/**
 * ICS (iCalendar) export for training plan events.
 * Generates RFC 5545 compliant .ics files that work with:
 * - iOS Calendar (tap to add)
 * - Google Calendar (Android intent)
 * - Outlook, Samsung Calendar, etc.
 */

/**
 * Escape special characters per RFC 5545 section 3.3.11
 * @param {string} text
 * @returns {string}
 */
function escapeICS(text) {
  if (!text) return ''
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Format an ISO date string as an ICS all-day date (YYYYMMDD).
 * @param {string} dateISO - e.g. '2026-04-15'
 * @returns {string} e.g. '20260415'
 */
function toICSDate(dateISO) {
  return dateISO.replace(/-/g, '')
}

/**
 * Get the next day in ICS date format (for DTEND of all-day events).
 * @param {string} dateISO
 * @returns {string}
 */
function toICSNextDay(dateISO) {
  const d = new Date(dateISO + 'T12:00:00')
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

/**
 * Generate a UID for an ICS event (deterministic from date + label).
 * @param {string} dateISO
 * @param {string} label
 * @returns {string}
 */
function generateUID(dateISO, label) {
  const hash = Array.from(dateISO + label).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
  return `${Math.abs(hash).toString(36)}-${toICSDate(dateISO)}@trajectory`
}

/**
 * Build an ICS VEVENT block for a single training event.
 * @param {object} event - Training calendar event
 * @returns {string} VEVENT block
 */
function buildVEvent(event) {
  const lines = [
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${toICSDate(event.date)}`,
    `DTEND;VALUE=DATE:${toICSNextDay(event.date)}`,
    `SUMMARY:${escapeICS(event.label)}`,
    `UID:${generateUID(event.date, event.label)}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
  ]

  const desc = [event.description, event.notes].filter(Boolean).join(' - ')
  if (desc) {
    lines.push(`DESCRIPTION:${escapeICS(desc)}`)
  }

  lines.push('END:VEVENT')
  return lines.join('\r\n')
}

/**
 * Generate a complete ICS file string from training calendar events.
 * @param {object} eventsByDate - Map of ISO date -> event array
 * @param {object} [options]
 * @param {string} [options.calendarName] - Display name for the calendar
 * @returns {string} Complete ICS file content
 */
function generateICS(eventsByDate, options = {}) {
  const calName = options.calendarName || 'Trajectory Training Plan'
  const events = []

  for (const [, dayEvents] of Object.entries(eventsByDate)) {
    for (const event of dayEvents) {
      events.push(buildVEvent(event))
    }
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trajectory//PFA Training Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(calName)}`,
    ...events,
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}

/**
 * Download the ICS file. Works on both iOS and Android:
 * - iOS Safari: Opens in Calendar app automatically
 * - Android Chrome: Downloads file, user taps to import
 * @param {string} icsContent - ICS file string
 * @param {string} [filename] - Download filename
 */
function downloadICS(icsContent, filename = 'trajectory-training-plan.ics') {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Generate and download a single event ICS (for adding individual days).
 * @param {object} event - Single training event
 */
export function downloadSingleEvent(event) {
  const ics = generateICS({ [event.date]: [event] }, {
    calendarName: 'Trajectory',
  })
  downloadICS(ics, `trajectory-${event.date}.ics`)
}
