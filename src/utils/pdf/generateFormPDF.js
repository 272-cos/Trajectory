/**
 * AF Form 4446 PDF Generator (20260327)
 * AIR FORCE PHYSICAL FITNESS READINESS ASSESSMENT SCORE CARD
 * Per DAFMAN 36-2905 (Change 1, 22 Jan 2026)
 *
 * NO PII: Rank, Name, Unit, DSQ ID, Duty Phone left blank.
 * Fills: Sex, Age, PFRA Date, exercise measurements, scores, composite.
 * Watermarked UNOFFICIAL ESTIMATE.
 *
 * Complexity: O(1) - fixed number of components (max 4), no iteration over unbounded data.
 * Work elimination: level 1 (guard/short-circuit for missing components).
 * Concurrency: none - pure function, no shared state.
 */

import { jsPDF } from 'jspdf'
import {
  EXERCISES,
  DIAGNOSTIC_PERIOD_START,
  DIAGNOSTIC_PERIOD_END,
  calculateAge,
} from '../scoring/constants.js'

// ---- Layout constants (mm, letter = 215.9 x 279.4) ----

const PAGE_MARGIN = 10
const PAGE_WIDTH = 215.9
const CONTENT_WIDTH = PAGE_WIDTH - 2 * PAGE_MARGIN
const LINE_THIN = 0.25

// Font sizes
const FONT_TITLE = 11
const FONT_SECTION_HEADER = 9
const FONT_CELL_LABEL = 7
const FONT_CELL_VALUE = 8
const FONT_SMALL = 6
const FONT_WATERMARK = 48
const FONT_PRIVACY = 5.5
const WATERMARK_OPACITY = 0.08

// Row heights
const ROW_H = 8
const HEADER_ROW_H = 6

// ---- Helpers ----

/** Draw a bordered cell with optional label (top) and value (center-bottom). */
function drawCell(doc, x, y, w, h, label, value, opts = {}) {
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(LINE_THIN)
  doc.rect(x, y, w, h)

  if (label) {
    doc.setFontSize(opts.labelSize || FONT_CELL_LABEL)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(label, x + 1, y + 3)
  }

  if (value != null && value !== '') {
    doc.setFontSize(opts.valueSize || FONT_CELL_VALUE)
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    doc.setTextColor(0, 0, 0)
    const valY = label ? y + h - 1.5 : y + h / 2 + 1
    doc.text(String(value), x + 1.5, valY)
  }
}

/** Draw a section header bar (dark background, white text). */
function drawSectionHeader(doc, x, y, w, h, text) {
  doc.setFillColor(0, 0, 0)
  doc.rect(x, y, w, h, 'F')
  doc.setFontSize(FONT_SECTION_HEADER)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(text, x + 2, y + h - 1.5)
}

/** Draw a component header row (Exercise | Exempt | Expiration | Measurement | Min Value Met? | Score). */
function drawComponentHeader(doc, x, y, w) {
  const h = HEADER_ROW_H
  doc.setFillColor(220, 220, 220)
  doc.rect(x, y, w, h, 'FD')
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(LINE_THIN)

  doc.setFontSize(FONT_CELL_LABEL)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)

  const cols = getComponentCols(w)
  const headers = ['Exercise', 'Exempt', 'Expiration', 'Measurement', 'Min Value Met?', 'Score']
  let cx = x
  for (let i = 0; i < cols.length; i++) {
    doc.rect(cx, y, cols[i], h)
    doc.text(headers[i], cx + 1, y + h - 1.5)
    cx += cols[i]
  }
  return y + h
}

/** Column widths for component exercise rows. */
function getComponentCols(totalW) {
  // Exercise(30%) | Exempt(8%) | Expiration(12%) | Measurement(28%) | Min Met(12%) | Score(10%)
  return [
    totalW * 0.30,
    totalW * 0.08,
    totalW * 0.12,
    totalW * 0.28,
    totalW * 0.12,
    totalW * 0.10,
  ]
}

/** Draw one exercise row within a component table. */
function drawExerciseRow(doc, x, y, w, exerciseName, measureLabel, data) {
  const h = ROW_H
  const cols = getComponentCols(w)

  let cx = x
  // Exercise name
  drawCell(doc, cx, y, cols[0], h, null, exerciseName)
  cx += cols[0]

  // Exempt (Y/N or blank)
  drawCell(doc, cx, y, cols[1], h, null, data.exempt ?? '')
  cx += cols[1]

  // Expiration (blank - we do not have this data)
  drawCell(doc, cx, y, cols[2], h, null, '')
  cx += cols[2]

  // Measurement
  const measText = data.measurement != null ? `${measureLabel}: ${data.measurement}` : ''
  drawCell(doc, cx, y, cols[3], h, null, measText)
  cx += cols[3]

  // Min Value Met?
  drawCell(doc, cx, y, cols[4], h, null, data.minMet ?? '')
  cx += cols[4]

  // Score
  drawCell(doc, cx, y, cols[5], h, null, data.score ?? '')

  return y + h
}

/** Format seconds to mm:ss. */
function fmtTime(seconds) {
  if (seconds == null) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Format a date for form display (MM/DD/YYYY). */
function fmtDate(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(String(date) + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return ''
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

/** Check if a date falls in the diagnostic period. */
function isInDiagnosticPeriod(date) {
  if (!date) return false
  const d = date instanceof Date ? date : new Date(String(date) + 'T12:00:00')
  const start = new Date(DIAGNOSTIC_PERIOD_START + 'T00:00:00')
  const end = new Date(DIAGNOSTIC_PERIOD_END + 'T23:59:59')
  return d >= start && d <= end
}

/**
 * Resolve a component from the scores.components array by type.
 * Returns the component object or null.
 */
function findComponent(scores, type) {
  if (!scores?.components) return null
  return scores.components.find(c => c.type === type) ?? null
}

/**
 * Build exercise row data from a component match.
 * @param {Object|null} comp - component from scores
 * @returns {{ exempt: string, measurement: string|null, minMet: string, score: string }}
 */
function buildRowData(comp) {
  if (!comp) return { exempt: '', measurement: null, minMet: '', score: '' }
  if (comp.exempt) return { exempt: 'Y', measurement: null, minMet: '', score: '' }

  const exempt = 'N'
  let measurement = null
  let minMet = ''
  let score = ''

  if (comp.tested && comp.value != null) {
    measurement = formatCompValue(comp)
    minMet = comp.pass ? 'Y' : 'N'
    score = comp.points != null ? comp.points.toFixed(1) : ''
  }

  if (comp.walkOnly) {
    measurement = comp.value != null ? fmtTime(comp.value) : ''
    minMet = comp.pass ? 'Y' : 'N'
    score = comp.pass ? 'P' : 'F'
  }

  return { exempt, measurement, minMet, score }
}

/** Format a component's raw value for display. */
function formatCompValue(comp) {
  if (!comp?.exercise || comp.value == null) return ''
  switch (comp.exercise) {
    case EXERCISES.RUN_2MILE:
    case EXERCISES.WALK_2KM:
    case EXERCISES.PLANK:
      return fmtTime(comp.value)
    case EXERCISES.WHTR:
      return comp.value.toFixed(2)
    case EXERCISES.HAMR:
      return String(comp.value)
    default:
      return String(comp.value)
  }
}

// ---- Main generators ----

/**
 * generateFormPDF - Create AF Form 4446 PDF from assessment data
 * @param {Object} demographics - { dob, gender }
 * @param {Object} decoded - Decoded assessment data (from S-code)
 * @param {Object} scores - { components[], composite }
 * @returns {jsPDF} PDF document
 */
export function generateFormPDF(demographics, decoded, scores) {
  if (!demographics || !decoded || !scores) {
    throw new Error('Missing required parameters for PDF generation')
  }

  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const pageHeight = doc.internal.pageSize.getHeight()
  const m = PAGE_MARGIN
  const w = CONTENT_WIDTH

  const age = calculateAge(demographics.dob, decoded.date)
  const gender = demographics.gender === 'M' ? 'Male' : 'Female'
  const pfraDate = fmtDate(decoded.date)
  const diagnostic = isInDiagnosticPeriod(decoded.date)

  let y = m

  // ---- UNOFFICIAL ESTIMATE watermark ----
  doc.saveGraphicsState()
  // jsPDF GState for transparency
  const gs = new doc.GState({ opacity: WATERMARK_OPACITY })
  doc.setGState(gs)
  doc.setFontSize(FONT_WATERMARK)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 0, 0)
  // Rotate text diagonally across the page
  const cx = PAGE_WIDTH / 2
  const cy = pageHeight / 2
  doc.text('UNOFFICIAL ESTIMATE', cx, cy, {
    align: 'center',
    angle: 45,
  })
  doc.restoreGraphicsState()

  // ---- Title block ----
  doc.setFontSize(FONT_TITLE)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('AIR FORCE PHYSICAL FITNESS READINESS ASSESSMENT SCORE CARD', PAGE_WIDTH / 2, y + 5, { align: 'center' })
  y += 8

  // Unofficial disclaimer (red, smaller)
  doc.setFontSize(FONT_CELL_VALUE)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 0, 0)
  doc.text('UNOFFICIAL ESTIMATE - NOT AN OFFICIAL SCORE', PAGE_WIDTH / 2, y + 3, { align: 'center' })
  y += 6

  // ---- Privacy Act Statement ----
  doc.setFontSize(FONT_CELL_LABEL)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Privacy Act Statement', m, y + 3)
  y += 4

  doc.setFontSize(FONT_PRIVACY)
  doc.setFont('helvetica', 'normal')
  const privacyText = [
    'AUTHORITY: 10 U.S.C. 8013, Secretary of the Air Force; and DAFMAN 36-2905, Air Force Physical Fitness Program.',
    'PURPOSE: To document physical fitness readiness assessment results for Air Force members.',
    'ROUTINE USES: Information may be disclosed to DoD officials with a need to know.',
    'DISCLOSURE: Voluntary; however, failure to provide data may result in inability to process fitness assessment.',
  ]
  for (const line of privacyText) {
    doc.text(line, m, y + 3, { maxWidth: w })
    y += 3
  }
  y += 1

  // ---- PART I. MEMBER COMPLETES ----
  y = drawSectionRow(doc, m, y, w, 'PART I. MEMBER COMPLETES')

  // Row: Rank | Name | Unit | DSQ ID | Duty Phone | Sex | Age
  const partICols = [w * 0.10, w * 0.20, w * 0.20, w * 0.14, w * 0.14, w * 0.10, w * 0.12]
  const partILabels = ['Rank', 'Name', 'Unit', 'DSQ ID', 'Duty Phone', 'Sex', 'Age']
  const partIValues = ['', '', '', '', '', gender, String(age)]
  let cx2 = m
  for (let i = 0; i < partICols.length; i++) {
    drawCell(doc, cx2, y, partICols[i], ROW_H, partILabels[i], partIValues[i])
    cx2 += partICols[i]
  }
  y += ROW_H

  // ---- PART II. TEST ADMINISTRATOR COMPLETES ----
  y = drawSectionRow(doc, m, y, w, 'PART II. TEST ADMINISTRATOR COMPLETES')

  // Row: FSQ Date | PFRA Date | Eligible for Diagnostic PFRA? | Height (in) | Weight (lbs)
  const partIIaCols = [w * 0.15, w * 0.15, w * 0.30, w * 0.20, w * 0.20]
  const partIIaLabels = ['FSQ Date', 'PFRA Date', 'Eligible for Diagnostic PFRA?', 'Height (inches)', 'Weight (lbs)']

  // Compute height from decoded bodyComp if available
  const heightStr = decoded.bodyComp?.heightInches ? String(decoded.bodyComp.heightInches) : ''
  const partIIaValues = ['', pfraDate, '', heightStr, '']

  cx2 = m
  for (let i = 0; i < partIIaCols.length; i++) {
    if (i === 2) {
      // Diagnostic checkbox cell - special handling
      drawDiagnosticCell(doc, cx2, y, partIIaCols[i], ROW_H, diagnostic)
    } else {
      drawCell(doc, cx2, y, partIIaCols[i], ROW_H, partIIaLabels[i], partIIaValues[i])
    }
    cx2 += partIIaCols[i]
  }
  y += ROW_H

  // ---- Body Composition section ----
  y = drawSectionRow(doc, m, y, w, 'Body Composition')
  y = drawComponentHeader(doc, m, y, w)

  const bodyComp = findComponent(scores, 'bodyComp')
  const bodyData = buildRowData(bodyComp)

  // Waist Circumference row - fill WHtR as measurement
  const waistMeas = decoded.bodyComp?.waistInches ? String(decoded.bodyComp.waistInches) : ''
  const waistRow = {
    ...bodyData,
    measurement: waistMeas || bodyData.measurement,
  }
  y = drawExerciseRow(doc, m, y, w, 'Waist Circumference', 'Waist', waistRow)

  // Body Fat Assessment row (blank - we do not collect this)
  y = drawExerciseRow(doc, m, y, w, 'Body Fat Assessment', 'Results (%)', { exempt: '', measurement: null, minMet: '', score: '' })

  // ---- Strength section ----
  y = drawSectionRow(doc, m, y, w, 'Strength')
  y = drawComponentHeader(doc, m, y, w)

  const strength = findComponent(scores, 'strength')

  // Push-up row
  const pushData = (strength && strength.exercise === EXERCISES.PUSHUPS)
    ? buildRowData(strength)
    : { exempt: '', measurement: null, minMet: '', score: '' }
  y = drawExerciseRow(doc, m, y, w, 'Push-up (1-min)', 'Reps', pushData)

  // HRPU row
  const hrpuData = (strength && strength.exercise === EXERCISES.HRPU)
    ? buildRowData(strength)
    : { exempt: '', measurement: null, minMet: '', score: '' }
  y = drawExerciseRow(doc, m, y, w, 'Hand-Release Push-up (2-min)', 'Reps', hrpuData)

  // ---- Endurance (Core) section ----
  y = drawSectionRow(doc, m, y, w, 'Endurance')
  y = drawComponentHeader(doc, m, y, w)

  const core = findComponent(scores, 'core')

  // Sit-up row
  const situpData = (core && core.exercise === EXERCISES.SITUPS)
    ? buildRowData(core)
    : { exempt: '', measurement: null, minMet: '', score: '' }
  y = drawExerciseRow(doc, m, y, w, 'Sit-up (1-min)', 'Reps', situpData)

  // CLRC row
  const clrcData = (core && core.exercise === EXERCISES.CLRC)
    ? buildRowData(core)
    : { exempt: '', measurement: null, minMet: '', score: '' }
  y = drawExerciseRow(doc, m, y, w, 'Cross-Leg Reverse Crunch (2-min)', 'Reps', clrcData)

  // Plank row
  const plankData = (core && core.exercise === EXERCISES.PLANK)
    ? buildRowData(core)
    : { exempt: '', measurement: null, minMet: '', score: '' }
  y = drawExerciseRow(doc, m, y, w, 'Timed Forearm Plank', 'Time', plankData)

  // ---- Cardio section ----
  y = drawSectionRow(doc, m, y, w, 'Cardio')
  y = drawComponentHeader(doc, m, y, w)

  const cardio = findComponent(scores, 'cardio')

  // 2 Mile Run
  const runData = (cardio && cardio.exercise === EXERCISES.RUN_2MILE)
    ? buildRowData(cardio)
    : { exempt: '', measurement: null, minMet: '', score: '' }
  y = drawExerciseRow(doc, m, y, w, '2 Mile Run', 'Time', runData)

  // 20 Meter HAMR
  const hamrData = (cardio && cardio.exercise === EXERCISES.HAMR)
    ? buildRowData(cardio)
    : { exempt: '', measurement: null, minMet: '', score: '' }
  y = drawExerciseRow(doc, m, y, w, '20 Meter HAMR', 'Shuttles', hamrData)

  // 2 KM Walk
  const walkData = (cardio && cardio.walkOnly)
    ? buildRowData(cardio)
    : (cardio && cardio.exercise === EXERCISES.WALK_2KM)
      ? buildRowData(cardio)
      : { exempt: '', measurement: null, minMet: '', score: '' }
  y = drawExerciseRow(doc, m, y, w, '2 KM Walk', 'Time', walkData)

  // ---- DNF / Notes / Total Score row ----
  const dnfW = w * 0.20
  const notesW = w * 0.55
  const totalW = w * 0.25

  // DNF checkbox
  drawCell(doc, m, y, dnfW, ROW_H, null, 'Did Not Finish (DNF):  [ ]')

  // Notes
  drawCell(doc, m + dnfW, y, notesW, ROW_H, 'Notes', '')

  // Total Score
  const compositeVal = scores.composite?.composite != null
    ? scores.composite.composite.toFixed(1)
    : ''
  drawCell(doc, m + dnfW + notesW, y, totalW, ROW_H, 'Total Score', compositeVal, { bold: true })
  y += ROW_H

  // ---- PART III. ACKNOWLEDGEMENT ----
  y = drawSectionRow(doc, m, y, w, 'PART III. ACKNOWLEDGEMENT')

  // Member testing acknowledgement
  y = drawAcknowledgementBlock(doc, m, y, w, 'MEMBER TESTING:', 'I have been briefed on and accept the results of this assessment.', ['Signature', 'Date', 'Next PFRA Due'])

  // PFRA Administrator
  y = drawAcknowledgementBlock(doc, m, y, w, 'PFRA ADMINISTRATOR:', '', ['Name/Signature', 'Date'])

  // FAC/UFAC
  y = drawAcknowledgementBlock(doc, m, y, w, 'FAC/UFAC:', 'Results valid / invalid due to injury or illness.', ['Name/Signature', 'Date'])

  // Unit Commander
  y = drawAcknowledgementBlock(doc, m, y, w, 'UNIT COMMANDER:', '', ['Name/Signature', 'Date'])

  // ---- Footer ----
  const footerY = pageHeight - 6
  doc.setFontSize(FONT_SMALL)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('AF Form 4446, 20260327', m, footerY)
  doc.text('CUI (when filled in)', PAGE_WIDTH / 2, footerY, { align: 'center' })
  doc.text('Prescribed by: AFMAN36-2905', PAGE_WIDTH - m, footerY, { align: 'right' })

  return doc
}

/** Draw a dark section header row spanning full width. */
function drawSectionRow(doc, x, y, w, text) {
  const h = HEADER_ROW_H
  drawSectionHeader(doc, x, y, w, h, text)
  return y + h
}

/** Draw the diagnostic checkbox cell. */
function drawDiagnosticCell(doc, x, y, w, h, isDiagnostic) {
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(LINE_THIN)
  doc.rect(x, y, w, h)

  doc.setFontSize(FONT_CELL_LABEL)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text('Eligible for Diagnostic PFRA?', x + 1, y + 3)

  doc.setFontSize(FONT_CELL_VALUE)
  const yesBox = isDiagnostic ? '[X]' : '[ ]'
  const noBox = isDiagnostic ? '[ ]' : '[X]'
  doc.text(`Yes ${yesBox}   No ${noBox}`, x + 1.5, y + h - 1.5)
}

/**
 * Draw an acknowledgement block (label, description, signature fields).
 * Signature fields are blank bordered cells in a row.
 */
function drawAcknowledgementBlock(doc, x, y, w, label, description, fields) {
  const rowH = 7

  // Label + description
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(LINE_THIN)

  if (description) {
    doc.rect(x, y, w, rowH)
    doc.setFontSize(FONT_CELL_LABEL)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(label, x + 1, y + 3)
    doc.setFont('helvetica', 'normal')
    doc.text(description, x + 1, y + rowH - 1.5, { maxWidth: w - 2 })
    y += rowH
  } else {
    doc.rect(x, y, w, 4)
    doc.setFontSize(FONT_CELL_LABEL)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(label, x + 1, y + 3)
    y += 4
  }

  // Signature fields row
  const fieldW = w / fields.length
  for (let i = 0; i < fields.length; i++) {
    drawCell(doc, x + i * fieldW, y, fieldW, rowH, fields[i], '')
  }
  y += rowH

  return y
}

/**
 * downloadPDF - Trigger PDF download in browser
 * @param {jsPDF} doc - PDF document
 * @param {string} filename - Download filename
 */
export function downloadPDF(doc, filename = 'pfa-assessment.pdf') {
  doc.save(filename)
}

/**
 * generatePDFAndDownload - Convenience wrapper: generate and download
 * @param {Object} demographics - { dob, gender }
 * @param {Object} decoded - Decoded assessment data
 * @param {Object} scores - { components[], composite }
 * @param {Date} assessmentDate - Date for filename
 */
export function generatePDFAndDownload(demographics, decoded, scores, assessmentDate = new Date()) {
  const pdf = generateFormPDF(demographics, decoded, scores)
  const dateObj = assessmentDate instanceof Date
    ? assessmentDate
    : new Date(String(assessmentDate) + 'T12:00:00')
  const dateStr = (dateObj instanceof Date && !Number.isNaN(dateObj.getTime()))
    ? dateObj.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]
  downloadPDF(pdf, `pfa-assessment-${dateStr}.pdf`)
}
