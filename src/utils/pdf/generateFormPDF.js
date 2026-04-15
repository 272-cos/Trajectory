/**
 * AF Form 1067 PDF Generator
 * Physical Fitness Test Administrative Score Card
 * Per DAFMAN 36-2905 (Change 1, 22 Jan 2026)
 *
 * NO PII: Excludes name, rank, unit. Includes only:
 * - Age bracket, Gender
 * - Performance values and component scores
 * - Composite score and pass/fail
 * - Assessment date
 */

import { jsPDF } from 'jspdf'
import { COMPONENTS, COMPONENT_WEIGHTS, calculateAge, getAgeBracket } from '../scoring/constants.js'

const COLORS = {
  darkGray: { r: 51, g: 51, b: 51 },
  mediumGray: { r: 102, g: 102, b: 102 },
  lightGray: { r: 242, g: 242, b: 242 },
  borderGray: { r: 200, g: 200, b: 200 },
  passGreen: { r: 34, g: 197, b: 94 },
  failRed: { r: 220, g: 38, b: 38 },
  headerBlue: { r: 37, g: 99, b: 235 },
}

const COMPONENT_LABELS = {
  [COMPONENTS.CARDIO]: 'Cardio',
  [COMPONENTS.STRENGTH]: 'Strength',
  [COMPONENTS.CORE]: 'Core Muscles',
  [COMPONENTS.BODY_COMP]: 'Body Composition',
}

/**
 * generateFormPDF - Create AF Form 1067 PDF from assessment data
 * @param {Object} demographics - { dob, gender }
 * @param {Object} decoded - Decoded S-code data
 * @param {Object} scores - { components[], composite }
 * @returns {jsPDF} - PDF document ready for download/print
 *
 * Complexity: O(n) where n = number of components tested (max 4)
 * Work elimination: Single pass over components, no I/O or external lookups
 */
export function generateFormPDF(demographics, decoded, scores) {
  if (!demographics || !decoded || !scores) {
    throw new Error('Missing required parameters for PDF generation')
  }

  const age = calculateAge(demographics.dob, decoded.date)
  const ageBracket = getAgeBracket(age)
  const gender = demographics.gender === 'M' ? 'Male' : 'Female'

  // Dimensions: 8.5" x 11" (letter) = 215.9 x 279.4 mm
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12.7 // 0.5 inch
  const contentWidth = pageWidth - 2 * margin

  let yPos = margin

  // Header
  yPos = drawHeader(doc, yPos, margin, contentWidth)

  // Member info section (NO PII)
  yPos = drawMemberInfo(doc, yPos, margin, contentWidth, ageBracket, gender, age, decoded.date)

  // Component scoring table
  yPos = drawComponentTable(doc, yPos, margin, contentWidth, scores.components)

  // Composite score section
  drawCompositeSection(doc, yPos, margin, contentWidth, scores.composite)

  // Footer
  drawFooter(doc, pageHeight, margin, decoded.date)

  return doc
}

/**
 * drawHeader - Title and form reference
 */
function drawHeader(doc, yPos, margin, contentWidth) {
  doc.setFontSize(16)
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b)
  doc.setFont(undefined, 'bold')

  const headerText = 'AIR FORCE PHYSICAL FITNESS TEST'
  const headerText2 = 'ADMINISTRATIVE SCORE CARD'

  // Center-align both lines
  const x = margin + contentWidth / 2
  doc.text(headerText, x, yPos, { align: 'center' })
  yPos += 6
  doc.text(headerText2, x, yPos, { align: 'center' })
  yPos += 8

  // Disclaimer
  doc.setFontSize(9)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(COLORS.failRed.r, COLORS.failRed.g, COLORS.failRed.b)
  doc.text('UNOFFICIAL ESTIMATE - NOT AN OFFICIAL SCORE', x, yPos, { align: 'center' })
  yPos += 6

  // Regulatory reference
  doc.setFontSize(8)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(COLORS.mediumGray.r, COLORS.mediumGray.g, COLORS.mediumGray.b)
  doc.text('Per DAFMAN 36-2905 (Change 1, 22 Jan 2026)', x, yPos, { align: 'center' })
  yPos += 7

  return yPos
}

/**
 * drawMemberInfo - Demographics section (NO PII fields)
 */
function drawMemberInfo(doc, yPos, margin, contentWidth, ageBracket, gender, age, date) {
  // Section title
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(COLORS.headerBlue.r, COLORS.headerBlue.g, COLORS.headerBlue.b)
  doc.text('Member Information', margin, yPos)
  yPos += 5

  // Draw light background box for info section
  doc.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b)
  doc.rect(margin, yPos - 3, contentWidth, 22, 'F')
  doc.setDrawColor(COLORS.borderGray.r, COLORS.borderGray.g, COLORS.borderGray.b)
  doc.rect(margin, yPos - 3, contentWidth, 22)

  // Info fields
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b)

  const fieldLabels = ['Age Bracket:', 'Gender:', 'Age (years):', 'Assessment Date:']
  const fieldValues = [
    ageBracket,
    gender,
    String(age),
    formatDateForForm(date),
  ]

  const colWidth = contentWidth / 2
  let xPos = margin + 3
  let rowY = yPos + 2

  for (let i = 0; i < fieldLabels.length; i++) {
    const label = fieldLabels[i]
    const value = fieldValues[i]

    doc.setFont(undefined, 'bold')
    doc.text(label, xPos, rowY)
    doc.setFont(undefined, 'normal')
    doc.text(value, xPos + 30, rowY)

    if (i % 2 === 1) {
      xPos = margin + 3
      rowY += 7
    } else {
      xPos += colWidth
    }
  }

  return yPos + 24
}

/**
 * drawComponentTable - Scoring table for all tested components
 */
function drawComponentTable(doc, yPos, margin, contentWidth, components) {
  // Section title
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(COLORS.headerBlue.r, COLORS.headerBlue.g, COLORS.headerBlue.b)
  doc.text('Component Scores', margin, yPos)
  yPos += 7

  // Table header
  const tableTop = yPos
  const colWidths = [contentWidth * 0.25, contentWidth * 0.2, contentWidth * 0.25, contentWidth * 0.15, contentWidth * 0.15]
  const headers = ['Component', 'Raw Value', 'Points', 'Max Pts', 'Status']
  const headerX = [
    margin,
    margin + colWidths[0],
    margin + colWidths[0] + colWidths[1],
    margin + colWidths[0] + colWidths[1] + colWidths[2],
    margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
  ]

  // Draw header background
  doc.setFillColor(COLORS.headerBlue.r, COLORS.headerBlue.g, COLORS.headerBlue.b)
  doc.rect(margin, yPos - 4, contentWidth, 6, 'F')

  doc.setFontSize(9)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(255, 255, 255)

  headers.forEach((header, i) => {
    doc.text(header, headerX[i] + 1, yPos, { align: 'left' })
  })

  yPos += 6
  doc.setDrawColor(COLORS.borderGray.r, COLORS.borderGray.g, COLORS.borderGray.b)
  doc.setLineWidth(0.3)
  doc.line(margin, yPos, margin + contentWidth, yPos)

  // Table rows
  doc.setFontSize(9)
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b)

  components.forEach((comp) => {
    const compLabel = COMPONENT_LABELS[comp.type] || comp.type
    const maxPts = COMPONENT_WEIGHTS[comp.type]

    let rawValue = '-'
    let points = '-'
    let status = '-'
    let statusColor = COLORS.darkGray

    if (comp.exempt) {
      rawValue = 'Exempt'
      points = '0'
      status = 'EXEMPT'
      statusColor = COLORS.mediumGray
    } else if (comp.walkOnly) {
      rawValue = '2km Walk'
      points = comp.pass ? 'PASS' : 'FAIL'
      status = comp.pass ? 'PASS' : 'FAIL'
      statusColor = comp.pass ? COLORS.passGreen : COLORS.failRed
    } else if (comp.tested && comp.points != null) {
      rawValue = formatRawValue(comp)
      points = comp.points.toFixed(1)
      status = comp.pass ? 'PASS' : 'FAIL'
      statusColor = comp.pass ? COLORS.passGreen : COLORS.failRed
    }

    // Row background (alternate)
    if (Math.floor((yPos - tableTop - 6) / 6) % 2 === 1) {
      doc.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b)
      doc.rect(margin, yPos - 3, contentWidth, 5.5, 'F')
    }

    doc.setFont(undefined, 'normal')
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b)
    doc.text(compLabel, headerX[0] + 1, yPos)
    doc.text(rawValue, headerX[1] + 1, yPos)
    doc.text(points, headerX[2] + 1, yPos)
    doc.text(String(maxPts), headerX[3] + 1, yPos)

    doc.setFont(undefined, 'bold')
    doc.setTextColor(statusColor.r, statusColor.g, statusColor.b)
    doc.text(status, headerX[4] + 1, yPos)

    yPos += 5.5
  })

  // Bottom border
  doc.setDrawColor(COLORS.borderGray.r, COLORS.borderGray.g, COLORS.borderGray.b)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, margin + contentWidth, yPos)

  return yPos + 4
}

/**
 * drawCompositeSection - Overall score and pass/fail determination
 */
function drawCompositeSection(doc, yPos, margin, contentWidth, composite) {
  // Section title
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(COLORS.headerBlue.r, COLORS.headerBlue.g, COLORS.headerBlue.b)
  doc.text('Final Assessment', margin, yPos)
  yPos += 7

  // Summary box
  const boxHeight = 20
  const bgColor = composite.pass ? { r: 220, g: 252, b: 231 } : { r: 254, g: 226, b: 226 } // light green or light red
  doc.setFillColor(bgColor.r, bgColor.g, bgColor.b)
  doc.rect(margin, yPos - 3, contentWidth, boxHeight, 'F')
  const borderColor = composite.pass ? COLORS.passGreen : COLORS.failRed
  doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b)
  doc.setLineWidth(1)
  doc.rect(margin, yPos - 3, contentWidth, boxHeight)

  // Composite score
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  const scoreColor = composite.pass ? COLORS.passGreen : COLORS.failRed
  doc.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b)
  doc.text(`Composite Score: ${composite.composite.toFixed(1)}`, margin + 3, yPos + 2)

  // Pass/fail determination
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  const statusText = composite.pass ? 'PASS' : 'FAIL'
  doc.text(`Overall: ${statusText}`, margin + 3, yPos + 8)

  // Requirement notes
  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b)
  doc.text('Requires 75.0+ composite score and component minimums (60% cardio/strength/core; 50% body comp)', margin + 3, yPos + 14)

  return yPos + boxHeight + 6
}

/**
 * drawFooter - Disclaimer and metadata
 */
function drawFooter(doc, pageHeight, margin, date) {
  const footerY = pageHeight - margin - 8

  doc.setFontSize(8)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(COLORS.mediumGray.r, COLORS.mediumGray.g, COLORS.mediumGray.b)

  doc.text('This is an unofficial self-assessment estimate for supervisory awareness only.', margin, footerY)
  doc.text(`Generated: ${new Date().toLocaleDateString()} | Assessment Date: ${formatDateForForm(date)}`, margin, footerY + 4)
}

/**
 * formatRawValue - Display exercise result appropriate to type
 */
function formatRawValue(comp) {
  if (!comp.exercise) return '-'

  switch (comp.exercise) {
    case '2mile_run':
    case '2km_walk':
    case 'plank':
      return formatTimeValue(comp.value)
    case 'whtr':
      return comp.value ? comp.value.toFixed(2) : '-'
    case 'hamr':
      return `${comp.value} shuttles`
    default:
      // push-ups, sit-ups, etc.
      return `${comp.value} reps`
  }
}

/**
 * formatTimeValue - Convert seconds to mm:ss format
 */
function formatTimeValue(seconds) {
  if (seconds == null) return '-'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * formatDateForForm - Format date for display on form
 */
function formatDateForForm(date) {
  const d = date instanceof Date ? date : new Date(String(date) + 'T12:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
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
 * generatePDFAndDownload - Convenience wrapper: generate PDF and trigger download
 * @param {Object} demographics - { dob, gender }
 * @param {Object} decoded - Decoded S-code
 * @param {Object} scores - { components[], composite }
 * @param {Date} assessmentDate - Date of assessment for filename
 */
export function generatePDFAndDownload(demographics, decoded, scores, assessmentDate = new Date()) {
  const pdf = generateFormPDF(demographics, decoded, scores)
  const dateStr = assessmentDate.toISOString().split('T')[0]
  downloadPDF(pdf, `pfa-assessment-${dateStr}.pdf`)
}
