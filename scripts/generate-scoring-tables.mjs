#!/usr/bin/env node
/**
 * Generate src/utils/scoring/scoringTables.js from the verbatim official
 * extract at docs/PFRA-Scoring-Charts.md.
 *
 * Run: node scripts/generate-scoring-tables.mjs
 * Then: node scripts/validate-scoring-tables.mjs (should exit 0)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const MD_PATH = resolve(ROOT, 'docs/PFRA-Scoring-Charts.md')
const OUT_PATH = resolve(ROOT, 'src/utils/scoring/scoringTables.js')

const md = readFileSync(MD_PATH, 'utf8')

// Page → exercise mapping
const PAGE_SPECS = [
  { page: 2, exerciseKey: 'PUSHUPS', unit: 'reps' },
  { page: 3, exerciseKey: 'HRPU', unit: 'reps' },
  { page: 4, exerciseKey: 'SITUPS', unit: 'reps' },
  { page: 5, exerciseKey: 'CLRC', unit: 'reps' },
  { page: 6, exerciseKey: 'PLANK', unit: 'time' },
  { page: 7, exerciseKey: 'RUN_2MILE', unit: 'time' },
  { page: 8, exerciseKey: 'HAMR', unit: 'reps' },
]

const BRACKET_KEYS_IN_ORDER = [
  'UNDER_25',
  'AGE_25_29',
  'AGE_30_34',
  'AGE_35_39',
  'AGE_40_44',
  'AGE_45_49',
  'AGE_50_54',
  'AGE_55_59',
  'AGE_60_PLUS',
]

const BRACKET_LABELS = {
  UNDER_25: '<25',
  AGE_25_29: '25-29',
  AGE_30_34: '30-34',
  AGE_35_39: '35-39',
  AGE_40_44: '40-44',
  AGE_45_49: '45-49',
  AGE_50_54: '50-54',
  AGE_55_59: '55-59',
  AGE_60_PLUS: '60+',
}

// ── Parsers ─────────────────────────────────────────────────────────────────
function extractPage(pageNum) {
  const re = new RegExp(`^## Page ${pageNum}\\s*\\n\\n\`\`\`text\\n([\\s\\S]*?)\\n\`\`\``, 'm')
  const m = re.exec(md)
  if (!m) throw new Error(`page ${pageNum} not found in MD`)
  return m[1]
}

function parseTimeToSec(tok) {
  const clean = tok.replace(/[*≤≥]/g, '').trim()
  const parts = clean.split(':')
  const mins = parseInt(parts[0] || '0', 10)
  const secs = parseInt(parts[1] || '0', 10)
  return mins * 60 + secs
}

function parseRatio(tok) {
  const m = tok.match(/([0-9]+\.[0-9]+)/)
  if (!m) throw new Error(`not a ratio: ${tok}`)
  return parseFloat(m[1])
}

function parseReps(tok) {
  const clean = tok.replace(/[*≤≥]/g, '').trim()
  const n = parseInt(clean, 10)
  if (Number.isNaN(n)) throw new Error(`not an int: ${tok}`)
  return n
}

function parseValue(tok, unit) {
  if (unit === 'time') return parseTimeToSec(tok)
  if (unit === 'ratio') return parseRatio(tok)
  return parseReps(tok)
}

function tokenizeRow(line) {
  return line.trim().replace(/([≤≥])\s+/g, '$1').split(/\s+/)
}

/**
 * Parse the 26- or 21-row body of a scoring chart page.
 * Returns: [{ points, values: [v_col0 .. v_col17] }]
 * Columns: [M_<25, F_<25, M_25-29, F_25-29, ..., M_60+, F_60+]
 */
function parseTable(pageText, unit) {
  const rows = []
  for (const line of pageText.split('\n')) {
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

// ── Build data ──────────────────────────────────────────────────────────────
// exerciseData[exerciseKey] = [{ points, values[18] }]
const exerciseData = {}
for (const spec of PAGE_SPECS) {
  const txt = extractPage(spec.page)
  const rows = parseTable(txt, spec.unit)
  if (!rows.length) throw new Error(`no rows parsed for ${spec.exerciseKey}`)
  exerciseData[spec.exerciseKey] = { rows, unit: spec.unit }
}

// WHtR from page 1
const whtrRows = parseTable(extractPage(1), 'ratio')
if (!whtrRows.length) throw new Error('no WHtR rows parsed')
// Sanity: all 18 columns equal per row
for (const row of whtrRows) {
  const first = row.values[0]
  if (!row.values.every(v => v === first)) {
    throw new Error(`WHtR row ${row.points} not universal: ${row.values.join(',')}`)
  }
}

// ── Emit ────────────────────────────────────────────────────────────────────
function fmtPoints(p) {
  return p.toFixed(1)
}

function fmtThresholdComment(value, unit) {
  if (unit === 'time') {
    const m = Math.floor(value / 60)
    const s = value % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }
  if (unit === 'ratio') return value.toFixed(2)
  return String(value)
}

function emitExerciseBlock(exerciseKey, genderIndex, bracketIndex) {
  // genderIndex: 0=M, 1=F
  // bracketIndex: 0..8 in BRACKET_KEYS_IN_ORDER
  const { rows, unit } = exerciseData[exerciseKey]
  const col = bracketIndex * 2 + genderIndex
  const lines = []
  lines.push(`      [EXERCISES.${exerciseKey}]: [`)
  for (const row of rows) {
    const val = row.values[col]
    const comment = unit === 'time' ? `  // ${fmtThresholdComment(val, unit)}` : ''
    lines.push(`        { threshold: ${val}, points: ${fmtPoints(row.points)} },${comment}`)
  }
  lines.push(`      ],`)
  return lines.join('\n')
}

function emitBracketBlock(genderIndex, bracketIndex) {
  const bracketKey = BRACKET_KEYS_IN_ORDER[bracketIndex]
  const lines = []
  lines.push(`    [AGE_BRACKETS.${bracketKey}]: {`)
  // Order: RUN_2MILE, HAMR, PUSHUPS, HRPU, SITUPS, CLRC, PLANK  (same as existing file)
  const exerciseOrder = ['RUN_2MILE', 'HAMR', 'PUSHUPS', 'HRPU', 'SITUPS', 'CLRC', 'PLANK']
  for (const ex of exerciseOrder) {
    lines.push(emitExerciseBlock(ex, genderIndex, bracketIndex))
  }
  lines.push(`    },`)
  return lines.join('\n')
}

function emitGenderBlock(genderKey, genderIndex) {
  const genderLabel = genderKey === 'MALE' ? 'MALE' : 'FEMALE'
  const lines = []
  lines.push(`  [GENDER.${genderKey}]: {`)
  for (let bi = 0; bi < BRACKET_KEYS_IN_ORDER.length; bi++) {
    const bracketKey = BRACKET_KEYS_IN_ORDER[bi]
    lines.push('    // =====================================================================')
    lines.push(`    // ${genderLabel} ${BRACKET_LABELS[bracketKey]}`)
    lines.push('    // =====================================================================')
    lines.push(emitBracketBlock(genderIndex, bi))
  }
  lines.push(`  },`)
  return lines.join('\n')
}

const header = `/**
 * Scoring tables for 2026 PFA (50-20-15-15 model)
 * Source: Final USAF Physical Fitness Readiness Assessment Scoring (Effective 1 Mar 26)
 * All 18 age/gender brackets (9 age brackets x 2 genders)
 *
 * GENERATED FILE - DO NOT EDIT BY HAND.
 * Source of truth: docs/PFRA-Scoring-Charts.md
 * Regenerate: node scripts/generate-scoring-tables.mjs
 * Verify: node scripts/validate-scoring-tables.mjs
 */

import { EXERCISES, GENDER, AGE_BRACKETS } from './constants.js'

/**
 * Scoring table structure:
 * {
 *   [gender]: {
 *     [ageGroup]: {
 *       [exercise]: [
 *         { threshold, points },
 *         ...
 *       ]
 *     }
 *   }
 * }
 *
 * For times (run): threshold = max time in seconds for that point value
 *   Table sorted ascending (fastest time first = max points)
 * For reps/shuttles: threshold = minimum reps/shuttles for that point value
 *   Table sorted descending (highest reps first = max points)
 * For plank: threshold = minimum hold time in seconds
 *   Table sorted descending (longest hold first = max points)
 * For WHtR: threshold = max ratio for that point value
 *   Table sorted ascending (lowest ratio first = max points)
 */

export const SCORING_TABLES = {
`

const footer = `}

// WHtR is universal (not age/gender specific)
// Source: Final USAF Physical Fitness Readiness Assessment Scoring (Effective 1 Mar 26)
export const WHTR_TABLE = [
${whtrRows.map(r => `  { threshold: ${r.values[0].toFixed(2)}, points: ${fmtPoints(r.points)} },`).join('\n')}
]

/**
 * Get scoring table for specific demographic and exercise
 * @param {string} gender - 'M' or 'F'
 * @param {string} ageGroup - Age group constant
 * @param {string} exercise - Exercise type constant
 * @returns {Array|null} Scoring table or null if not found
 */
export function getScoringTable(gender, ageGroup, exercise) {
  if (exercise === EXERCISES.WHTR) {
    return WHTR_TABLE
  }

  const genderTables = SCORING_TABLES[gender]
  if (!genderTables) {
    console.warn(\`No scoring tables for gender: \${gender}\`)
    return null
  }

  const ageGroupTables = genderTables[ageGroup]
  if (!ageGroupTables) {
    console.warn(\`No scoring tables for age group: \${ageGroup} (gender: \${gender})\`)
    console.warn('Available age groups:', Object.keys(genderTables))
    return null
  }

  const exerciseTable = ageGroupTables[exercise]
  if (!exerciseTable) {
    console.warn(\`No scoring table for exercise: \${exercise} (gender: \${gender}, age: \${ageGroup})\`)
    return null
  }

  return exerciseTable
}
`

const body = [
  emitGenderBlock('MALE', 0),
  emitGenderBlock('FEMALE', 1),
].join('\n')

const full = header + body + '\n' + footer
writeFileSync(OUT_PATH, full)
console.log(`Wrote ${OUT_PATH} (${full.split('\n').length} lines)`)
