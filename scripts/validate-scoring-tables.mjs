#!/usr/bin/env node
/**
 * Validate src/utils/scoring/scoringTables.js against docs/PFRA-Scoring-Charts.md
 * (which is the verbatim pdftotext extraction of the official PFRA Scoring Charts PDF).
 *
 * Usage: node scripts/validate-scoring-tables.mjs
 * Exit: 0 if all tables match, 1 if any mismatch.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { SCORING_TABLES, WHTR_TABLE } from '../src/utils/scoring/scoringTables.js'
import { EXERCISES, GENDER, AGE_BRACKETS } from '../src/utils/scoring/constants.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const MD_PATH = resolve(ROOT, 'docs/PFRA-Scoring-Charts.md')
const TABLES_PATH = resolve(ROOT, 'src/utils/scoring/scoringTables.js')

const md = readFileSync(MD_PATH, 'utf8')
const tablesSrc = readFileSync(TABLES_PATH, 'utf8').split('\n')

// Page → exercise mapping (unit: 'ratio' | 'time' | 'reps')
const PAGE_EXERCISES = {
  1: { exercise: EXERCISES.WHTR, unit: 'ratio', universal: true },
  2: { exercise: EXERCISES.PUSHUPS, unit: 'reps' },
  3: { exercise: EXERCISES.HRPU, unit: 'reps' },
  4: { exercise: EXERCISES.SITUPS, unit: 'reps' },
  5: { exercise: EXERCISES.CLRC, unit: 'reps' },
  6: { exercise: EXERCISES.PLANK, unit: 'time' },
  7: { exercise: EXERCISES.RUN_2MILE, unit: 'time' },
  8: { exercise: EXERCISES.HAMR, unit: 'reps' },
}

const BRACKETS_ORDER = [
  AGE_BRACKETS.UNDER_25,
  AGE_BRACKETS.AGE_25_29,
  AGE_BRACKETS.AGE_30_34,
  AGE_BRACKETS.AGE_35_39,
  AGE_BRACKETS.AGE_40_44,
  AGE_BRACKETS.AGE_45_49,
  AGE_BRACKETS.AGE_50_54,
  AGE_BRACKETS.AGE_55_59,
  AGE_BRACKETS.AGE_60_PLUS,
]

function extractPage(pageNum) {
  const re = new RegExp(`^## Page ${pageNum}\\s*\\n\\n\`\`\`text\\n([\\s\\S]*?)\\n\`\`\``, 'm')
  const m = re.exec(md)
  return m ? m[1] : null
}

function parseTime(tok) {
  const clean = tok.replace(/[*≤≥]/g, '').trim()
  const parts = clean.split(':')
  const mins = parseInt(parts[0] || '0', 10)
  const secs = parseInt(parts[1] || '0', 10)
  return mins * 60 + secs
}

function parseRatio(tok) {
  const m = tok.match(/([0-9]+\.[0-9]+)/)
  return m ? parseFloat(m[1]) : null
}

function parseReps(tok) {
  const clean = tok.replace(/[*≤≥]/g, '').trim()
  return parseInt(clean, 10)
}

function parseValue(tok, unit) {
  if (unit === 'time') return parseTime(tok)
  if (unit === 'ratio') return parseRatio(tok)
  return parseReps(tok)
}

function tokenizeRow(line) {
  // Glue "≥ 67" / "≤ 13:25" into single tokens.
  return line.trim().replace(/([≤≥])\s+/g, '$1').split(/\s+/)
}

/**
 * Parse a page table into rows of the form:
 *   { points: Number, values: Array<Number|null>(18) }
 * Column order: [M_U25, F_U25, M_2529, F_2529, ..., M_60+, F_60+]
 */
function parseTable(pageText, unit) {
  const lines = pageText.split('\n')
  const rows = []
  for (const line of lines) {
    const toks = tokenizeRow(line)
    if (toks.length !== 20) continue
    const pt1 = parseFloat(toks[0])
    const pt2 = parseFloat(toks[19])
    if (Number.isNaN(pt1) || Number.isNaN(pt2) || pt1 !== pt2) continue
    const values = toks.slice(1, 19).map(t => parseValue(t, unit))
    rows.push({ points: pt1, values })
  }
  return rows
}

/**
 * Find the line number in scoringTables.js where a specific entry lives.
 * Returns 0 if not found (best-effort for error reporting).
 */
function findLineFor(gender, bracket, exerciseKey, pointsVal) {
  const genderKey = gender === GENDER.MALE ? 'MALE' : 'FEMALE'
  const bracketKey = Object.entries(AGE_BRACKETS).find(([, v]) => v === bracket)?.[0]
  const exerciseEntries = Object.entries(EXERCISES)
  const exerciseEnumKey = exerciseEntries.find(([, v]) => v === exerciseKey)?.[0]
  if (!bracketKey || !exerciseEnumKey) return 0
  // Locate the gender block, then bracket, then exercise, then the points line.
  let inGender = false
  let inBracket = false
  let inExercise = false
  for (let i = 0; i < tablesSrc.length; i++) {
    const line = tablesSrc[i]
    if (line.includes(`[GENDER.${genderKey}]:`)) inGender = true
    else if (inGender && /\[GENDER\./.test(line)) inGender = false
    if (inGender && line.includes(`[AGE_BRACKETS.${bracketKey}]:`)) inBracket = true
    else if (inGender && inBracket && /\[AGE_BRACKETS\./.test(line) && !line.includes(bracketKey)) inBracket = false
    if (inBracket && line.includes(`[EXERCISES.${exerciseEnumKey}]:`)) inExercise = true
    else if (inExercise && /\[EXERCISES\./.test(line) && !line.includes(exerciseEnumKey)) inExercise = false
    if (inExercise && line.includes(`points: ${pointsVal.toFixed(1)}`)) {
      return i + 1
    }
  }
  return 0
}

/**
 * Validate one exercise across all 18 brackets (9 age × 2 gender).
 * Returns array of mismatch objects.
 */
function validateExercise(exerciseKey, unit, officialRows) {
  const mismatches = []
  const bracketGenders = []
  for (const bracket of BRACKETS_ORDER) {
    bracketGenders.push({ bracket, gender: GENDER.MALE })
    bracketGenders.push({ bracket, gender: GENDER.FEMALE })
  }

  for (const row of officialRows) {
    for (let col = 0; col < 18; col++) {
      const { bracket, gender } = bracketGenders[col]
      const expected = row.values[col]
      const table = SCORING_TABLES[gender]?.[bracket]?.[exerciseKey]
      if (!table) {
        mismatches.push({
          exercise: exerciseKey, gender, bracket, points: row.points,
          expected, actual: null, line: 0, note: 'MISSING_TABLE',
        })
        continue
      }
      const entry = table.find(e => e.points === row.points)
      if (!entry) {
        mismatches.push({
          exercise: exerciseKey, gender, bracket, points: row.points,
          expected, actual: null,
          line: findLineFor(gender, bracket, exerciseKey, row.points),
          note: 'MISSING_ROW',
        })
        continue
      }
      if (entry.threshold !== expected) {
        mismatches.push({
          exercise: exerciseKey, gender, bracket, points: row.points,
          expected, actual: entry.threshold,
          line: findLineFor(gender, bracket, exerciseKey, row.points),
        })
      }
    }
  }
  return mismatches
}

function validateWhtr(officialRows) {
  // Every column should match WHTR_TABLE by points.
  const mismatches = []
  for (const row of officialRows) {
    const entry = WHTR_TABLE.find(e => e.points === row.points)
    const expected = row.values[0] // all columns identical
    if (!entry) {
      mismatches.push({
        exercise: EXERCISES.WHTR, gender: '-', bracket: '-', points: row.points,
        expected, actual: null, note: 'MISSING_ROW',
      })
      continue
    }
    // Universality check: all columns should agree
    const universal = row.values.every(v => v === expected)
    if (!universal) {
      mismatches.push({
        exercise: EXERCISES.WHTR, gender: '-', bracket: '-', points: row.points,
        expected: `row values disagree: ${row.values.join(',')}`, actual: entry.threshold,
        note: 'NON_UNIVERSAL',
      })
    }
    if (entry.threshold !== expected) {
      mismatches.push({
        exercise: EXERCISES.WHTR, gender: '-', bracket: '-', points: row.points,
        expected, actual: entry.threshold,
      })
    }
  }
  return mismatches
}

function formatSeconds(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')} (${s}s)`
}

function fmt(value, unit) {
  if (value == null) return '∅'
  if (unit === 'time') return formatSeconds(value)
  if (unit === 'ratio') return value.toFixed(2)
  return String(value)
}

// ── Run ────────────────────────────────────────────────────────────────────
const allMismatches = []
for (const [pageNum, spec] of Object.entries(PAGE_EXERCISES)) {
  const txt = extractPage(Number(pageNum))
  if (!txt) {
    console.error(`Could not find page ${pageNum} in MD`)
    process.exit(2)
  }
  const rows = parseTable(txt, spec.unit)
  if (!rows.length) {
    console.error(`Could not parse any rows from page ${pageNum} (${spec.exercise})`)
    process.exit(2)
  }
  let mismatches
  if (spec.universal) {
    mismatches = validateWhtr(rows)
  } else {
    mismatches = validateExercise(spec.exercise, spec.unit, rows)
  }
  const status = mismatches.length === 0 ? 'OK' : `${mismatches.length} MISMATCH`
  console.log(`Page ${pageNum} [${spec.exercise}] — ${rows.length} rows parsed — ${status}`)
  for (const m of mismatches) {
    allMismatches.push({ ...m, unit: spec.unit })
  }
}

console.log('')
console.log('='.repeat(80))
if (allMismatches.length === 0) {
  console.log('ALL TABLES MATCH OFFICIAL PFRA SCORING CHARTS ✓')
  process.exit(0)
}

console.log(`${allMismatches.length} MISMATCH(ES) FOUND`)
console.log('='.repeat(80))
console.log('')

// Group by exercise × gender × bracket for readability
const grouped = new Map()
for (const m of allMismatches) {
  const key = `${m.exercise} | ${m.gender} | ${m.bracket}`
  if (!grouped.has(key)) grouped.set(key, [])
  grouped.get(key).push(m)
}

for (const [key, list] of grouped) {
  console.log(`\n▸ ${key}  (${list.length} issue${list.length === 1 ? '' : 's'})`)
  for (const m of list) {
    const lineRef = m.line ? `L${m.line}` : ''
    const note = m.note ? ` [${m.note}]` : ''
    console.log(
      `   @ ${m.points.toFixed(1)} pts${note}  expected ${fmt(m.expected, m.unit)}  actual ${fmt(m.actual, m.unit)}  ${lineRef}`
    )
  }
}

console.log('')
console.log(`TOTAL: ${allMismatches.length} mismatch(es)`)
process.exit(1)
