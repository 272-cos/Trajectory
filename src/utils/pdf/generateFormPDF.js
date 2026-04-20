/**
 * AF Form 4446 PDF Generator (20260327) - pdf-lib build
 * AIR FORCE PHYSICAL FITNESS READINESS ASSESSMENT SCORE CARD
 * Per DAFMAN 36-2905 (Change 1, 22 Jan 2026)
 *
 * Output: real AcroForm PDF with 4 PKCS#7 signature widgets, each pre-wired
 * with a /SigFieldLock dictionary so any compliant reader (Adobe, etc.) seals
 * the appropriate cells when the signature is applied.
 *
 * Sig fields:
 *   pfra_admin_sig - locks all test data (Part II + every exercise row + DNF/Notes/Total)
 *   member_sig     - locks 3 acknowledgement checkboxes + member sig date + next pfra due
 *   fac_ufac_sig   - locks fac_ufac_date + fac_ufac_validity
 *   commander_sig  - locks commander_date
 *
 * Doc-level JS (Adobe Reader): on open, scans signed sigs and auto-fills the
 * adjacent Date fields from the signer cert. CAC CN convention is
 * LAST.FIRST.MIDDLE.EDIPI; date is auto-populated from the signing timestamp.
 *
 * Public API is async (returns Promise<Uint8Array>):
 *   generateFormPDF(demographics, decoded, scores) -> Uint8Array
 *   generatePDFAndDownload(...) -> Promise<void>
 *   downloadPDFBytes(bytes, filename) -> void
 */

import {
  PDFDocument, StandardFonts, rgb,
  PDFName, PDFString, PDFNumber, PDFBool,
} from 'pdf-lib'
import {
  EXERCISES,
  DIAGNOSTIC_PERIOD_START,
  DIAGNOSTIC_PERIOD_END,
  calculateAge,
} from '../scoring/constants.js'
import { buildScoringJs } from './pdfScoringJs.js'

// -------------------- Layout constants (points, 1 pt = 1/72") --------------------

const PAGE_W = 612            // letter
const PAGE_H = 792
const MARGIN = 36             // ~0.5"
const CONTENT_W = PAGE_W - 2 * MARGIN
const LINE_THIN = 0.7
const RADIO_R = 2.4
const CHECKBOX = 9
const ROW_H = 22
const HEADER_ROW_H = 15
const PART_H = 13
const PART_II_H = 28

const FONT_TITLE = 11
const FONT_PART = 9
const FONT_CATEGORY = 9
const FONT_LABEL = 7
const FONT_VALUE = 8
const FONT_SMALL = 6
const FONT_PRIVACY_TITLE = 7.5
const FONT_PRIVACY_BODY = 6
const FONT_ACK = 6.5
const FONT_CUI = 8

const GREY = [190 / 255, 190 / 255, 190 / 255]
const BLACK = [0, 0, 0]

// -------------------- Field name constants (load-bearing - lock dicts depend on them) --------------------

const FIELDS = {
  // Demographics (Part I)
  rank_name: 'rank_name',
  unit: 'unit',
  dod_id: 'dod_id',
  duty_phone: 'duty_phone',
  sex: 'sex',
  age: 'age',
  // Part II - test admin
  fsq_date: 'fsq_date',
  pfra_date: 'pfra_date',
  eligible_diagnostic: 'eligible_diagnostic',
  height_inches: 'height_inches',
  weight_lbs: 'weight_lbs',
  // Bottom row
  dnf: 'dnf',
  notes: 'notes',
  total_score: 'total_score',
  // Acknowledgement
  member_accept_official: 'member_accept_official',
  member_accept_dpfra: 'member_accept_dpfra',
  member_dispute: 'member_dispute',
  member_signature_date: 'member_signature_date',
  next_pfra_due: 'next_pfra_due',
  pfra_admin_date: 'pfra_admin_date',
  pfra_admin_injury: 'pfra_admin_injury',
  fac_ufac_date: 'fac_ufac_date',
  fac_ufac_validity: 'fac_ufac_validity',
  commander_date: 'commander_date',
  // Signature widgets
  member_sig: 'member_sig',
  pfra_admin_sig: 'pfra_admin_sig',
  fac_ufac_sig: 'fac_ufac_sig',
  commander_sig: 'commander_sig',
}

// Per-exercise field generator (keeps lock-list construction trivial)
const EXERCISE_KEYS = ['waist', 'bodyfat', 'pushup', 'hrpu', 'situp', 'clrc', 'plank', 'run', 'hamr', 'walk']
function exFields(key) {
  return {
    exempt: `${key}_exempt`,
    expiration: `${key}_expiration`,
    measurement: `${key}_measurement`,
    min_met: `${key}_min_met`,
    score: `${key}_score`,
  }
}

// Special measurement fields (not all exercises use a single measurement field)
const WAIST_FIELDS = ['waist_w1', 'waist_w2', 'waist_w3', 'waist_avg']
const BODYFAT_PCT = 'bodyfat_pct'

function allTestDataFields() {
  const list = [
    FIELDS.fsq_date, FIELDS.pfra_date, FIELDS.eligible_diagnostic,
    FIELDS.height_inches, FIELDS.weight_lbs,
  ]
  for (const k of EXERCISE_KEYS) {
    const f = exFields(k)
    list.push(f.exempt, f.expiration, f.min_met, f.score)
    if (k === 'waist') list.push(...WAIST_FIELDS)
    else if (k === 'bodyfat') list.push(BODYFAT_PCT)
    else list.push(f.measurement)
  }
  list.push(FIELDS.dnf, FIELDS.notes, FIELDS.total_score)
  return list
}

const SIG_LOCKS = {
  pfra_admin_sig: () => [
    ...allTestDataFields(),
    FIELDS.pfra_admin_date, FIELDS.pfra_admin_injury,
  ],
  member_sig: () => [
    FIELDS.rank_name, FIELDS.dod_id,
    FIELDS.member_accept_official, FIELDS.member_accept_dpfra, FIELDS.member_dispute,
    FIELDS.member_signature_date, FIELDS.next_pfra_due,
  ],
  fac_ufac_sig: () => [
    FIELDS.fac_ufac_date, FIELDS.fac_ufac_validity,
  ],
  commander_sig: () => [
    FIELDS.commander_date,
  ],
}

// -------------------- Coordinate helpers (top-y -> pdf-lib bottom-y) --------------------

function topY(y) { return PAGE_H - y }

// -------------------- Drawing primitives --------------------

function setRect(page, x, yTop, w, h, opts = {}) {
  const args = {
    x, y: topY(yTop + h), width: w, height: h,
    borderColor: rgb(...BLACK),
    borderWidth: opts.borderWidth ?? LINE_THIN,
  }
  if (opts.fill) args.color = rgb(...opts.fill)
  page.drawRectangle(args)
}


function drawText(page, text, x, yTop, opts = {}) {
  const size = opts.size ?? FONT_VALUE
  const font = opts.font
  // For "yTop" semantics: draw text so its top edge sits at yTop. Approx baseline = yTop + ascender(=~0.78*size)
  const baseline = yTop + size * 0.78
  page.drawText(String(text), {
    x, y: topY(baseline),
    font, size,
    color: rgb(...(opts.color ?? BLACK)),
    maxWidth: opts.maxWidth,
  })
}

function drawTextCentered(page, text, cx, yTop, opts = {}) {
  const size = opts.size ?? FONT_VALUE
  const font = opts.font
  const w = font.widthOfTextAtSize(String(text), size)
  drawText(page, text, cx - w / 2, yTop, opts)
}

function drawTextRight(page, text, xRight, yTop, opts = {}) {
  const size = opts.size ?? FONT_VALUE
  const font = opts.font
  const w = font.widthOfTextAtSize(String(text), size)
  drawText(page, text, xRight - w, yTop, opts)
}

function drawLine(page, x1, y1Top, x2, y2Top, thickness = 0.5) {
  page.drawLine({
    start: { x: x1, y: topY(y1Top) },
    end: { x: x2, y: topY(y2Top) },
    color: rgb(...BLACK),
    thickness,
  })
}

function drawCircle(page, cx, cyTop, r, fill = false) {
  page.drawCircle({
    x: cx, y: topY(cyTop),
    size: r,
    borderColor: rgb(...BLACK),
    borderWidth: LINE_THIN,
    color: fill ? rgb(...BLACK) : undefined,
  })
}

function drawSquareCheckbox(page, x, yTop, checked = false) {
  setRect(page, x, yTop, CHECKBOX, CHECKBOX)
  if (checked) {
    drawLine(page, x + 1.5, yTop + 1.5, x + CHECKBOX - 1.5, yTop + CHECKBOX - 1.5, 1)
    drawLine(page, x + CHECKBOX - 1.5, yTop + 1.5, x + 1.5, yTop + CHECKBOX - 1.5, 1)
  }
}

// -------------------- Form-field helpers --------------------

function placeTextField(form, page, name, x, yTop, w, h, defaultValue = '') {
  const tf = form.createTextField(name)
  if (defaultValue) tf.setText(defaultValue)
  tf.addToPage(page, {
    x, y: topY(yTop + h), width: w, height: h,
    borderWidth: 0,
    backgroundColor: undefined,
  })
  return tf
}

/**
 * Attach an AA/C (calculate) JavaScript action to a text field. Fires on every
 * document-wide field change, per PDF spec: the reader walks AcroForm /CO and
 * runs each listed field's AA/C in order, so any edit triggers the recompute.
 */
function attachCalculateAction(ctx, tf, jsCode, formatJs) {
  const calcAction = ctx.obj({ S: PDFName.of('JavaScript'), JS: PDFString.of(jsCode) })
  const aaDict = { C: calcAction }
  if (formatJs) {
    aaDict.F = ctx.obj({ S: PDFName.of('JavaScript'), JS: PDFString.of(formatJs) })
  }
  tf.acroField.dict.set(PDFName.of('AA'), ctx.obj(aaDict))
}

// Merge an additional action slot (K=keystroke, V=validate, Bl=blur) onto a
// field's /AA dict without stomping any existing /AA/C calc wiring.
function attachFieldAction(ctx, tf, slot, jsCode) {
  const action = ctx.obj({ S: PDFName.of('JavaScript'), JS: PDFString.of(jsCode) })
  const existing = tf.acroField.dict.get(PDFName.of('AA'))
  if (existing) {
    existing.set(PDFName.of(slot), action)
  } else {
    const aaDict = {}
    aaDict[slot] = action
    tf.acroField.dict.set(PDFName.of('AA'), ctx.obj(aaDict))
  }
}

function setTooltip(tf, text) {
  if (!text) return
  tf.acroField.dict.set(PDFName.of('TU'), PDFString.of(text))
}

function setMaxLen(tf, n) {
  tf.acroField.dict.set(PDFName.of('MaxLen'), PDFNumber.of(n))
}

// Per-exercise score calc JS. Pulls sex/age from Part I and the matching
// measurement/exempt fields. this.TR.scoreFor() is defined in the doc-level JS.
// Also auto-drives the companion {key}_min_met radio (Yes if score > 0, No if 0).
function scoreCalcJs(exerciseKey, measurementField, exemptField, minMetField, siblings) {
  const sibJson = JSON.stringify(siblings || [])
  return `
    try {
      var mm = null;
      try { mm = this.getField("${minMetField}"); } catch (e1) {}
      var ex = this.getField("${exemptField}");
      var m = this.getField("${measurementField}");
      var s = this.getField("sex");
      var a = this.getField("age");
      var pts = "";
      var mmVal = "Off";
      if (ex && String(ex.value) === "Yes") {
        pts = ""; mmVal = "Off";
      } else if (!m || m.value === "" || !s || !s.value || !a || !a.value) {
        pts = ""; mmVal = "Off";
      } else {
        pts = this.TR.scoreFor("${exerciseKey}", m.value, s.value, parseInt(a.value, 10));
        mmVal = (pts !== "" && parseFloat(pts) > 0) ? "Yes" : "No";
      }
      event.value = pts;
      if (mm) mm.value = mmVal;
      try { this.TR.lockSiblings(this, ${sibJson}); } catch (eS) {}
    } catch (e) { event.value = ""; }
  `
}

// Waist score = WHtR → points. WHtR = waist_avg / height_inches.
// BC has no per-component minimum (DAFMAN §3.7.1) — min_met is Yes whenever a
// score is produced (WHtR < 0.60 → points > 0; ≥ 0.60 → 0 but still "met").
function waistScoreCalcJs() {
  return `
    try {
      var mm = null;
      try { mm = this.getField("waist_min_met"); } catch (e1) {}
      var ex = this.getField("waist_exempt");
      var pts = "";
      var mmVal = "Off";
      if (ex && String(ex.value) === "Yes") {
        pts = ""; mmVal = "Off";
      } else {
        var w = parseFloat(this.getField("waist_avg").value);
        var h = parseFloat(this.getField("height_inches").value);
        if (!w || !h || h <= 0) {
          pts = ""; mmVal = "Off";
        } else {
          pts = this.TR.scoreFor("whtr", w / h);
          mmVal = "Yes";
        }
      }
      event.value = pts;
      if (mm) mm.value = mmVal;
    } catch (e) { event.value = ""; }
  `
}

function compositeCalcJs() {
  return `
    try { event.value = this.TR.compositeScore(this); }
    catch (e) { event.value = ""; }
  `
}

// Walk is pass/fail only (DAFMAN §3.15; EC-05). 2-km walk time vs age/sex
// cutoff determines PASS/FAIL; the value never contributes to composite, but
// a FAIL fails the overall PFRA. Also drives walk_min_met + exclusivity.
function walkCalcJs() {
  return `
    try {
      var mm = null;
      try { mm = this.getField("walk_min_met"); } catch (eM) {}
      var ex = this.getField("walk_exempt");
      var result = "";
      var mmVal = "Off";
      if (ex && String(ex.value) === "Yes") {
        result = ""; mmVal = "Off";
      } else {
        result = this.TR.walkResult(this);
        if (result === "PASS") mmVal = "Yes";
        else if (result === "FAIL") mmVal = "No";
        else mmVal = "Off";
      }
      event.value = result;
      if (mm) mm.value = mmVal;
      try { this.TR.lockSiblings(this, ${JSON.stringify(CARDIO_GRP)}); } catch (eS) {}
    } catch (e) { event.value = ""; }
  `
}

// Component exclusivity groups: one exercise per component may be tested.
// Walk is profile-only alternative to the run/HAMR cardio pair.
// Keys map to {key}_measurement, {key}_exempt, {key}_expiration, {key}_score,
// {key}_min_met — the library's lockSiblings walks all companions.
const STRENGTH_GRP = ['pushup', 'hrpu']
const CORE_GRP     = ['situp', 'clrc', 'plank']
const CARDIO_GRP   = ['run', 'hamr', 'walk']

// Attach calc actions to every output score field and the composite, and
// build the /CO refs list in dependency order (components first, composite last).
function attachScoreCalcs(form, calcRefs) {
  const ctx = form.doc.context

  // (field name, calc JS) pairs. Order matters — /CO is walked top to bottom.
  const scoreSpecs = [
    ['waist_score',  waistScoreCalcJs()],
    ['pushup_score', scoreCalcJs('pushups',  'pushup_measurement', 'pushup_exempt', 'pushup_min_met', STRENGTH_GRP)],
    ['hrpu_score',   scoreCalcJs('hrpu',     'hrpu_measurement',   'hrpu_exempt',   'hrpu_min_met',   STRENGTH_GRP)],
    ['situp_score',  scoreCalcJs('situps',   'situp_measurement',  'situp_exempt',  'situp_min_met',  CORE_GRP)],
    ['clrc_score',   scoreCalcJs('clrc',     'clrc_measurement',   'clrc_exempt',   'clrc_min_met',   CORE_GRP)],
    ['plank_score',  scoreCalcJs('plank',    'plank_measurement',  'plank_exempt',  'plank_min_met',  CORE_GRP)],
    ['run_score',    scoreCalcJs('2mile_run','run_measurement',    'run_exempt',    'run_min_met',    CARDIO_GRP)],
    ['hamr_score',   scoreCalcJs('hamr',     'hamr_measurement',   'hamr_exempt',   'hamr_min_met',   CARDIO_GRP)],
    ['walk_score',   walkCalcJs()],
  ]
  for (const [name, js] of scoreSpecs) {
    const tf = form.getTextField(name)
    attachCalculateAction(ctx, tf, js)
    calcRefs.push(tf.acroField.ref)
  }

  // Composite must run after all component scores → last in /CO.
  const total = form.getTextField('total_score')
  attachCalculateAction(ctx, total, compositeCalcJs())
  calcRefs.push(total.acroField.ref)

  // Install /CO on the AcroForm dict (next_pfra_due is appended later by
  // attachNextPfraDueCalc after the member-testing block has created it).
  const acroFormDict = form.acroForm.dict
  acroFormDict.set(PDFName.of('CO'), ctx.obj(calcRefs))
}

// Tooltip / mask / validate polish. Runs after all fields are created.
// Non-structural: no new fields, just /TU + /AA/K + /AA/V dict entries.
function attachFieldPolish(form) {
  const ctx = form.doc.context
  const safe = (name, fn) => {
    try { const tf = form.getTextField(name); if (tf) fn(tf) } catch (e) {}
  }

  // DoD ID: 10-digit integer only.
  safe('dod_id', (tf) => {
    setMaxLen(tf, 10)
    setTooltip(tf, 'DoD ID (EDIPI) - 10 digits')
    attachFieldAction(ctx, tf, 'K', 'AFNumber_Keystroke(0, 0, 0, 0, "", true);')
  })

  // HAMR: whole shuttle count, no decimals.
  safe('hamr_measurement', (tf) => {
    setTooltip(tf, 'Total shuttles completed (whole number)')
    attachFieldAction(ctx, tf, 'K', 'AFNumber_Keystroke(0, 0, 0, 0, "", true);')
  })

  // Height: accept 5'10", 5'10, 5-10, 70, 70". Normalize to inches.
  safe('height_inches', (tf) => {
    setTooltip(tf, "Height - enter inches (70) or feet'inches (5'10\")")
    attachFieldAction(ctx, tf, 'V', `
      try {
        var v = (event.value === null || event.value === undefined) ? "" : String(event.value).replace(/\\s+/g, "");
        if (v !== "") {
          var inches = null;
          var m = v.match(/^(\\d+)['\\-](\\d+)"?$/);
          if (m) { inches = parseInt(m[1], 10) * 12 + parseInt(m[2], 10); }
          else {
            var n = parseFloat(v);
            if (!isNaN(n)) inches = Math.round(n);
          }
          if (inches === null || inches < 48 || inches > 84) {
            app.alert("Height must be 48-84 inches (4'0\\" to 7'0\\").");
            event.rc = false;
          } else {
            event.value = String(inches);
          }
        }
      } catch (e) {}
    `)
  })

  // Weight: plausible range 80-500 lbs.
  safe('weight_lbs', (tf) => {
    setTooltip(tf, 'Weight in pounds')
    attachFieldAction(ctx, tf, 'V', `
      try {
        if (event.value !== "" && event.value !== null) {
          var w = parseFloat(event.value);
          if (isNaN(w) || w < 80 || w > 500) {
            app.alert("Weight must be between 80 and 500 lbs.");
            event.rc = false;
          }
        }
      } catch (e) {}
    `)
  })

  // Common tooltips.
  safe('pfra_date',             (tf) => setTooltip(tf, 'PFRA assessment date (mm/dd/yyyy)'))
  safe('fsq_date',              (tf) => setTooltip(tf, 'FSQ completion date (must be on or before PFRA date)'))
  safe('next_pfra_due',         (tf) => setTooltip(tf, 'Auto-defaults from composite; ARC/Guard override to 12 months'))
  safe('waist_w1',              (tf) => setTooltip(tf, 'Waist measurement 1 (inches)'))
  safe('waist_w2',              (tf) => setTooltip(tf, 'Waist measurement 2 (inches)'))
  safe('waist_w3',              (tf) => setTooltip(tf, 'Waist measurement 3 (inches)'))
  safe('waist_avg',             (tf) => setTooltip(tf, 'Average of 3 waist measurements (auto)'))
  safe('waist_score',           (tf) => setTooltip(tf, 'WHtR points (auto)'))
  safe('pushup_measurement',    (tf) => setTooltip(tf, 'Push-ups completed in 1 minute (reps)'))
  safe('hrpu_measurement',      (tf) => setTooltip(tf, 'Hand-Release Push-ups in 2 minutes (reps)'))
  safe('situp_measurement',     (tf) => setTooltip(tf, 'Sit-ups completed in 1 minute (reps)'))
  safe('clrc_measurement',      (tf) => setTooltip(tf, 'Cross-Leg Reverse Crunches in 2 minutes (reps)'))
  safe('plank_measurement',     (tf) => setTooltip(tf, 'Forearm Plank hold time (mm:ss)'))
  safe('run_measurement',       (tf) => setTooltip(tf, '2-mile run time (mm:ss)'))
  safe('walk_measurement',      (tf) => setTooltip(tf, '2 KM walk time (mm:ss)'))
  for (const k of EXERCISE_KEYS) {
    safe(`${k}_expiration`,     (tf) => setTooltip(tf, 'AF Form 469 expiration date (exempt components only)'))
    safe(`${k}_score`,          (tf) => setTooltip(tf, 'Component score (auto)'))
  }
  safe('total_score',           (tf) => setTooltip(tf, 'Composite score (auto, 0-100)'))

  // Time-based exercises: mask + sync sub-fields → hidden {key}_measurement.
  const syncTimeFields = (k) => `
    try {
      var mn = this.getField("${k}_min");
      var sc = this.getField("${k}_sec");
      var mv = (mn && mn.value !== null && mn.value !== undefined) ? String(mn.value).replace(/\\s+/g, "") : "";
      var sv = (sc && sc.value !== null && sc.value !== undefined) ? String(sc.value).replace(/\\s+/g, "") : "";
      var combined = "";
      var ok = true;
      if (sv !== "") {
        var sN = parseInt(sv, 10);
        if (isNaN(sN) || sN < 0 || sN > 59) {
          app.alert("Seconds must be 0-59.");
          event.rc = false;
          ok = false;
        }
      }
      if (ok) {
        if (mv !== "" || sv !== "") {
          var mn2 = (mv === "") ? "0" : mv;
          var sN2 = (sv === "") ? 0 : parseInt(sv, 10);
          combined = mn2 + ":" + (sN2 < 10 ? "0" + sN2 : sN2);
        }
        var h = this.getField("${k}_measurement");
        if (h) h.value = combined;
      }
    } catch (e) {}
  `
  for (const k of ['run', 'plank', 'walk']) {
    safe(`${k}_min`, (tf) => {
      setMaxLen(tf, 2)
      setTooltip(tf, 'Minutes')
      attachFieldAction(ctx, tf, 'K', 'AFNumber_Keystroke(0, 0, 0, 0, "", true);')
      attachFieldAction(ctx, tf, 'V', syncTimeFields(k))
    })
    safe(`${k}_sec`, (tf) => {
      setMaxLen(tf, 2)
      setTooltip(tf, 'Seconds (0-59)')
      attachFieldAction(ctx, tf, 'K', 'AFNumber_Keystroke(0, 0, 0, 0, "", true);')
      attachFieldAction(ctx, tf, 'V', syncTimeFields(k))
    })
  }
}

// Attach the Next PFRA Due auto-default calc. Must run AFTER
// drawMemberTesting has created the next_pfra_due field. Writes only when
// the field is empty so ARC/Guard (12-month cycle) overrides are preserved.
function attachNextPfraDueCalc(form, calcRefs) {
  const ctx = form.doc.context
  const nextDue = form.getTextField('next_pfra_due')
  attachCalculateAction(ctx, nextDue, `
    try {
      var cur = (event.target && event.target.value) ? String(event.target.value) : "";
      if (cur === "") {
        var v = this.TR.nextPfraDueDefault(this);
        if (v !== "") event.value = v;
      }
    } catch (e) {}
  `)
  calcRefs.push(nextDue.acroField.ref)
  form.acroForm.dict.set(PDFName.of('CO'), ctx.obj(calcRefs))
}

function placeDateField(form, page, name, x, yTop, w, h, defaultValue = '') {
  const tf = placeTextField(form, page, name, x, yTop, w, h, defaultValue)
  const ctx = form.doc.context
  const fmtAction = ctx.obj({ S: PDFName.of('JavaScript'), JS: PDFString.of('AFDate_FormatEx("mm/dd/yyyy");') })
  const ksAction = ctx.obj({ S: PDFName.of('JavaScript'), JS: PDFString.of('AFDate_KeystrokeEx("mm/dd/yyyy");') })
  const aa = ctx.obj({ F: fmtAction, K: ksAction })
  tf.acroField.dict.set(PDFName.of('AA'), aa)
  return tf
}

function placeCheckbox(form, page, name, x, yTop, size, checked = false) {
  const cb = form.createCheckBox(name)
  if (checked) cb.check()
  cb.addToPage(page, {
    x, y: topY(yTop + size), width: size, height: size,
    borderWidth: 0,
  })
  return cb
}

function placeYesNoRadio(form, page, name, x, yTop, w, h, selected = null) {
  // Selected: 'Y' | 'N' | null
  const r = form.createRadioGroup(name)
  const yesX = x + w * 0.08
  const noX = x + w * 0.55
  const cy = yTop + h / 2
  // Draw circles + labels visually (the radio widgets are transparent overlays)
  drawCircle(page, yesX, cy, RADIO_R, selected === 'Y')
  drawText(page, 'Yes', yesX + RADIO_R + 1.5, cy - FONT_LABEL / 2, { size: FONT_LABEL, font: page.helv })
  drawCircle(page, noX, cy, RADIO_R, selected === 'N')
  drawText(page, 'No', noX + RADIO_R + 1.5, cy - FONT_LABEL / 2, { size: FONT_LABEL, font: page.helv })
  // Add hidden radio options
  r.addOptionToPage('Yes', page, {
    x: yesX - RADIO_R, y: topY(cy + RADIO_R), width: 2 * RADIO_R, height: 2 * RADIO_R, borderWidth: 0,
  })
  r.addOptionToPage('No', page, {
    x: noX - RADIO_R, y: topY(cy + RADIO_R), width: 2 * RADIO_R, height: 2 * RADIO_R, borderWidth: 0,
  })
  if (selected === 'Y') r.select('Yes')
  if (selected === 'N') r.select('No')
  return r
}

// -------------------- Signature widget (low-level pdf-lib) --------------------

/**
 * Add an unsigned PDF signature widget to a page with a /SigFieldLock /Include
 * dictionary listing the fields that should be sealed when the signature is applied.
 *
 * Returns the field reference (for inclusion in AcroForm.Fields).
 */
function addSignatureField(pdfDoc, page, name, x, yTop, w, h, lockFieldNames) {
  const ctx = pdfDoc.context
  const yBottom = topY(yTop + h)

  // SigFieldLock dict
  const lockDict = ctx.obj({
    Type: PDFName.of('SigFieldLock'),
    Action: PDFName.of('Include'),
    Fields: ctx.obj(lockFieldNames.map(n => PDFString.of(n))),
  })

  // Signature widget annotation + field (combined)
  const sigDict = ctx.obj({
    Type: PDFName.of('Annot'),
    Subtype: PDFName.of('Widget'),
    FT: PDFName.of('Sig'),
    T: PDFString.of(name),
    Rect: ctx.obj([x, yBottom, x + w, yBottom + h]),
    P: page.ref,
    F: PDFNumber.of(4),               // Print
    Lock: lockDict,
    SV: ctx.obj({
      Type: PDFName.of('SV'),
      Filter: PDFName.of('Adobe.PPKLite'),
      SubFilter: ctx.obj([PDFName.of('adbe.pkcs7.detached')]),
    }),
  })
  const sigRef = ctx.register(sigDict)

  // Add to page Annots
  const annots = page.node.Annots() ?? ctx.obj([])
  annots.push(sigRef)
  page.node.set(PDFName.of('Annots'), annots)

  return sigRef
}

// -------------------- Document JS (Adobe Reader auto-populate) --------------------

const DOC_JS = `
// CAC CN convention: LAST.FIRST.MIDDLE.EDIPI  (or LAST.FIRST.EDIPI).
// Returns { name: "First [Middle] Last", dodid: "10 digits" | null }.
function _parseCacCn(cn) {
  if (!cn) return { name: null, dodid: null };
  var parts = String(cn).split(".");
  var dodid = null;
  var tail = parts[parts.length - 1];
  if (/^\\d{6,10}$/.test(tail)) { dodid = tail; parts = parts.slice(0, -1); }
  if (parts.length < 2) return { name: cn, dodid: dodid };
  var last = parts[0];
  var first = parts[1];
  var middle = (parts.length >= 3) ? parts[2] : "";
  var name = first + " " + (middle ? middle + " " : "") + last;
  return { name: name, dodid: dodid };
}
function _setIfEmpty(fieldName, val) {
  if (!fieldName || val === null || val === undefined || val === "") return;
  try {
    var f = this.getField(fieldName);
    if (f && (!f.value || String(f.value) === "")) f.value = val;
  } catch (e) {}
}
function _autoFillFromSig(sigName, nameField, dateField, dodidField) {
  try {
    var sf = this.getField(sigName);
    if (!sf) return;
    var info = sf.signatureInfo();
    if (!info) return;
    var parsed = _parseCacCn(info.subjectCN || info.name || "");
    _setIfEmpty(nameField, parsed.name);
    _setIfEmpty(dodidField, parsed.dodid);
    if (dateField && info.date) {
      _setIfEmpty(dateField, util.printd("mm/dd/yyyy", info.date));
    }
  } catch (e) { /* swallow - reader-script errors must not block doc open */ }
}
function _scanAllSigs() {
  // Member sig → fills rank_name + dod_id (only if empty) + sig date.
  _autoFillFromSig("member_sig",      "rank_name",   "member_signature_date", "dod_id");
  _autoFillFromSig("pfra_admin_sig",  null,          "pfra_admin_date",       null);
  _autoFillFromSig("fac_ufac_sig",    null,          "fac_ufac_date",         null);
  _autoFillFromSig("commander_sig",   null,          "commander_date",        null);
}
_scanAllSigs();
try { this.TR.gateMemberSig(this); } catch (e) {}
try {
  var _pd = this.getField("pfra_date");
  if (_pd && (!_pd.value || String(_pd.value) === "")) {
    var _d = new Date();
    var _mm = _d.getMonth() + 1, _dd = _d.getDate(), _yy = _d.getFullYear();
    _pd.value = (_mm < 10 ? "0" + _mm : _mm) + "/" + (_dd < 10 ? "0" + _dd : _dd) + "/" + _yy;
  }
} catch (e) {}
`

function attachDocJS(pdfDoc) {
  const ctx = pdfDoc.context
  // Scoring library (TR.*) loads first; auto-fill hooks run after.
  const fullJs = buildScoringJs() + '\n' + DOC_JS
  const jsAction = ctx.obj({
    S: PDFName.of('JavaScript'),
    JS: PDFString.of(fullJs),
  })
  const jsActionRef = ctx.register(jsAction)

  // /Names tree: standard doc-level JS registry (PDF 12.6.4.16).
  const namedJs = ctx.obj({
    Names: ctx.obj([PDFString.of('TrajectoryScoringAndAutoFill'), jsActionRef]),
  })
  const names = ctx.obj({ JavaScript: namedJs })
  pdfDoc.catalog.set(PDFName.of('Names'), names)
}

// -------------------- Layout-level helpers --------------------

function fmtTime(seconds) {
  if (seconds == null) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtDate(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(String(date) + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return ''
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

function isInDiagnosticPeriod(date) {
  if (!date) return false
  const d = date instanceof Date ? date : new Date(String(date) + 'T12:00:00')
  const start = new Date(DIAGNOSTIC_PERIOD_START + 'T00:00:00')
  const end = new Date(DIAGNOSTIC_PERIOD_END + 'T23:59:59')
  return d >= start && d <= end
}

function findComponent(scores, type) {
  if (!scores?.components) return null
  return scores.components.find(c => c.type === type) ?? null
}

function buildRowData(comp) {
  if (!comp) return { exempt: null, measurement: null, minMet: null, score: '' }
  if (comp.exempt) return { exempt: 'Y', measurement: null, minMet: null, score: '' }
  const exempt = 'N'
  let measurement = null
  let minMet = null
  let score = ''
  if (comp.walkOnly) {
    measurement = comp.value != null ? fmtTime(comp.value) : ''
    minMet = comp.pass ? 'Y' : 'N'
    score = comp.pass ? 'P' : 'F'
  } else if (comp.tested && comp.value != null) {
    measurement = formatCompValue(comp)
    minMet = comp.pass ? 'Y' : 'N'
    score = comp.points != null ? comp.points.toFixed(1) : ''
  }
  return { exempt, measurement, minMet, score }
}

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

function componentCols(totalW) {
  // Exercise | Exempt | Expiration | Measurement | Min Value Met? | Score
  // Proportions from 4446_RED.JPG pixel analysis (structural red lines)
  return [totalW * 0.166, totalW * 0.107, totalW * 0.107, totalW * 0.336, totalW * 0.139, totalW * 0.145]
}

function wrap(font, text, size, maxWidth) {
  // Greedy word-wrap returning array of lines.
  const words = String(text).split(/\s+/)
  const lines = []
  let cur = ''
  for (const w of words) {
    const trial = cur ? cur + ' ' + w : w
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) cur = trial
    else { if (cur) lines.push(cur); cur = w }
  }
  if (cur) lines.push(cur)
  return lines
}

// -------------------- Main generator --------------------

export async function generateFormPDF(demographics, decoded, scores) {
  if (!demographics || !decoded || !scores) {
    throw new Error('Missing required parameters for PDF generation')
  }

  const PDF_VERSION = '1.0.5'
  const pdfDoc = await PDFDocument.create()
  pdfDoc.setTitle('AF Form 4446 - PFRA Score Card')
  pdfDoc.setProducer(`Trajectory PFRA Tracker v${PDF_VERSION}`)

  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helvItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
  const helvBoldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique)

  const page = pdfDoc.addPage([PAGE_W, PAGE_H])
  page.helv = helv  // attach for radio helper convenience

  const form = pdfDoc.getForm()
  // NeedAppearances: Reader regenerates field appearances on calculated-value
  // changes. Without this, /AA/C-computed scores show as empty until the user
  // tabs into each field.
  form.acroForm.dict.set(PDFName.of('NeedAppearances'), PDFBool.True)

  // Collects AcroForm /CO (calculation order) refs. Each field with an /AA/C
  // action must be listed here; Acrobat walks this array on any field change.
  const calcRefs = []

  const age = calculateAge(demographics.dob, decoded.date)
  const gender = demographics.gender === 'M' ? 'Male' : 'Female'
  const pfraDateStr = fmtDate(decoded.date)
  const diagnostic = isInDiagnosticPeriod(decoded.date)

  let y = MARGIN

  // ---- CUI banner top ----
  drawTextCentered(page, 'CUI (when filled in)', PAGE_W / 2, y, { size: FONT_CUI, font: helvBold })
  y += FONT_CUI + 2

  // ---- Title ----
  const titleH = FONT_TITLE + 6
  y += 1
  setRect(page, MARGIN, y - 2, CONTENT_W, titleH, { fill: GREY })
  drawTextCentered(page, 'AIR FORCE PHYSICAL FITNESS READINESS ASSESSMENT SCORE CARD',
    PAGE_W / 2, y - 2 + titleH / 2 - FONT_TITLE / 2, { size: FONT_TITLE, font: helvBold })
  y += titleH

  // ---- Privacy Act block ----
  const privacyH = drawPrivacyAct(page, helv, helvBold, MARGIN, y, CONTENT_W)
  y += privacyH

  // ---- PART I header ----
  setRect(page, MARGIN, y, CONTENT_W, PART_H, { fill: GREY })
  drawTextCentered(page, 'PART I. MEMBER COMPLETES', PAGE_W / 2, y + 2, { size: FONT_PART, font: helvBold })
  y += PART_H

  // Row: Rank/Name | Unit | DoD ID | Duty Phone | Sex | Age
  // Proportions from 4446_1.JPG pixel analysis
  const partICols = [CONTENT_W * 0.295, CONTENT_W * 0.204, CONTENT_W * 0.192, CONTENT_W * 0.135, CONTENT_W * 0.076, CONTENT_W * 0.098]
  const partILabels = ['Rank / Name:', 'Unit:', 'DoD ID:', 'Duty Phone:', 'Sex:', 'Age:']
  const partIFields = [FIELDS.rank_name, FIELDS.unit, FIELDS.dod_id, FIELDS.duty_phone, null, FIELDS.age]
  const partIDefaults = ['', '', '', '', null, String(age)]
  let cx = MARGIN
  for (let i = 0; i < partICols.length; i++) {
    setRect(page, cx, y, partICols[i], ROW_H)
    drawText(page, partILabels[i], cx + 2, y + 2, { size: FONT_LABEL, font: helv })
    if (partIFields[i]) {
      placeTextField(form, page, partIFields[i],
        cx + 1, y + FONT_LABEL + 4, partICols[i] - 2, ROW_H - FONT_LABEL - 5, partIDefaults[i])
    }
    if (i === 4) {
      const dd = form.createDropdown(FIELDS.sex)
      dd.addOptions(['Male', 'Female'])
      dd.select(gender)
      dd.addToPage(page, {
        x: cx + 1, y: topY(y + ROW_H) + FONT_LABEL - 6, width: partICols[i] - 2, height: ROW_H - FONT_LABEL - 6,
        borderWidth: 0, backgroundColor: undefined,
      })
    }
    cx += partICols[i]
  }
  y += ROW_H

  // ---- PART II header ----
  setRect(page, MARGIN, y, CONTENT_W, PART_H, { fill: GREY })
  drawTextCentered(page, 'PART II. TEST ADMINISTRATOR COMPLETES', PAGE_W / 2, y + 2, { size: FONT_PART, font: helvBold })
  y += PART_H

  // Row: FSQ Date | PFRA Date | Eligible (with footnote + radio) | Height | Weight
  // Proportions from 4446_2.JPG pixel analysis
  const partIIaCols = [CONTENT_W * 0.108, CONTENT_W * 0.134, CONTENT_W * 0.474, CONTENT_W * 0.139, CONTENT_W * 0.145]
  cx = MARGIN
  // FSQ Date
  setRect(page, cx, y, partIIaCols[0], PART_II_H)
  drawText(page, 'FSQ Date:', cx + 2, y + 2, { size: FONT_LABEL, font: helv })
  placeDateField(form, page, FIELDS.fsq_date, cx + 1, y + FONT_LABEL + 4, partIIaCols[0] - 2, PART_II_H - FONT_LABEL - 5)
  cx += partIIaCols[0]
  // PFRA Date
  setRect(page, cx, y, partIIaCols[1], PART_II_H)
  drawText(page, 'PFRA Date:', cx + 2, y + 2, { size: FONT_LABEL, font: helv })
  placeDateField(form, page, FIELDS.pfra_date, cx + 1, y + FONT_LABEL + 4, partIIaCols[1] - 2, PART_II_H - FONT_LABEL - 5, pfraDateStr)
  cx += partIIaCols[1]
  // Eligible Diagnostic
  setRect(page, cx, y, partIIaCols[2], PART_II_H)
  drawText(page, 'Eligible for Diagnostic PFRA?', cx + 2, y + 2, { size: FONT_LABEL, font: helv })
  drawText(page, '(Before 16th day of due month/Previous', cx + 2, y + FONT_LABEL + 5, { size: FONT_SMALL, font: helvItalic })
  drawText(page, 'month TR, IMA, DSG)', cx + 2, y + FONT_LABEL + FONT_SMALL + 7, { size: FONT_SMALL, font: helvItalic })
  placeYesNoRadio(form, page, FIELDS.eligible_diagnostic,
    cx + partIIaCols[2] * 0.55, y, partIIaCols[2] * 0.45, PART_II_H, diagnostic ? 'Y' : 'N')
  cx += partIIaCols[2]
  // Height
  setRect(page, cx, y, partIIaCols[3], PART_II_H)
  drawText(page, 'Height (inches):', cx + 2, y + 2, { size: FONT_LABEL, font: helv })
  const heightStr = decoded.bodyComp?.heightInches ? String(decoded.bodyComp.heightInches) : ''
  placeTextField(form, page, FIELDS.height_inches, cx + 1, y + FONT_LABEL + 4, partIIaCols[3] - 2, PART_II_H - FONT_LABEL - 5, heightStr)
  cx += partIIaCols[3]
  // Weight
  setRect(page, cx, y, partIIaCols[4], PART_II_H)
  drawText(page, 'Weight (lbs):', cx + 2, y + 2, { size: FONT_LABEL, font: helv })
  placeTextField(form, page, FIELDS.weight_lbs, cx + 1, y + FONT_LABEL + 4, partIIaCols[4] - 2, PART_II_H - FONT_LABEL - 5)
  y += PART_II_H

  // ---- Body Composition ----
  y = drawComponentHeader(page, helvBold, helvBoldItalic, MARGIN, y, CONTENT_W, 'Body Composition')
  const bodyComp = findComponent(scores, 'bodyComp')
  const bodyData = buildRowData(bodyComp)
  y = drawWaistRow(page, form, helv, MARGIN, y, CONTENT_W, bodyData, decoded, calcRefs)
  y = drawBodyFatRow(page, form, helv, MARGIN, y, CONTENT_W)

  // ---- Strength ----
  y = drawComponentHeader(page, helvBold, helvBoldItalic, MARGIN, y, CONTENT_W, 'Strength')
  const strength = findComponent(scores, 'strength')
  const pushupData = (strength && strength.exercise === EXERCISES.PUSHUPS) ? buildRowData(strength) : { exempt: null, measurement: null, minMet: null, score: '' }
  y = drawExerciseRow(page, form, helv, helvBold, MARGIN, y, CONTENT_W, 'Push-up', 'Reps', 'pushup', pushupData)
  const hrpuData = (strength && strength.exercise === EXERCISES.HRPU) ? buildRowData(strength) : { exempt: null, measurement: null, minMet: null, score: '' }
  y = drawExerciseRow(page, form, helv, helvBold, MARGIN, y, CONTENT_W, 'Hand-Release Push-up (HRPU)', 'Reps', 'hrpu', hrpuData)

  // ---- Endurance ----
  y = drawComponentHeader(page, helvBold, helvBoldItalic, MARGIN, y, CONTENT_W, 'Endurance')
  const core = findComponent(scores, 'core')
  const situpData = (core && core.exercise === EXERCISES.SITUPS) ? buildRowData(core) : { exempt: null, measurement: null, minMet: null, score: '' }
  y = drawExerciseRow(page, form, helv, helvBold, MARGIN, y, CONTENT_W, 'Sit-up', 'Reps', 'situp', situpData)
  const clrcData = (core && core.exercise === EXERCISES.CLRC) ? buildRowData(core) : { exempt: null, measurement: null, minMet: null, score: '' }
  y = drawExerciseRow(page, form, helv, helvBold, MARGIN, y, CONTENT_W, 'Cross-Leg Reverse Crunch (CLRC)', 'Reps', 'clrc', clrcData)
  const plankData = (core && core.exercise === EXERCISES.PLANK) ? buildRowData(core) : { exempt: null, measurement: null, minMet: null, score: '' }
  y = drawExerciseRow(page, form, helv, helvBold, MARGIN, y, CONTENT_W, 'Timed Forearm Plank', 'Time', 'plank', plankData)

  // ---- Cardio ----
  y = drawComponentHeader(page, helvBold, helvBoldItalic, MARGIN, y, CONTENT_W, 'Cardio')
  const cardio = findComponent(scores, 'cardio')
  const runData = (cardio && cardio.exercise === EXERCISES.RUN_2MILE) ? buildRowData(cardio) : { exempt: null, measurement: null, minMet: null, score: '' }
  y = drawExerciseRow(page, form, helv, helvBold, MARGIN, y, CONTENT_W, '2 Mile Run', 'Time', 'run', runData)
  const hamrData = (cardio && cardio.exercise === EXERCISES.HAMR) ? buildRowData(cardio) : { exempt: null, measurement: null, minMet: null, score: '' }
  y = drawExerciseRow(page, form, helv, helvBold, MARGIN, y, CONTENT_W, '20 Meter HAMR', 'Shuttles', 'hamr', hamrData)
  const walkData = (cardio && (cardio.walkOnly || cardio.exercise === EXERCISES.WALK_2KM)) ? buildRowData(cardio) : { exempt: null, measurement: null, minMet: null, score: '' }
  y = drawExerciseRow(page, form, helv, helvBold, MARGIN, y, CONTENT_W, '2 KM Walk', 'Time', 'walk', walkData)

  // ---- DNF / Notes / Total ----
  // Proportions from 4446_RED.JPG: DNF=0.165, Notes=0.552, TotalLabel=0.138, TotalValue=0.145
  const dnfW = CONTENT_W * 0.166
  const notesW = CONTENT_W * 0.551
  const totalLabelW = CONTENT_W * 0.139
  const totalValueW = CONTENT_W * 0.145
  setRect(page, MARGIN, y, dnfW, ROW_H)
  // Square checkbox: visual + form widget
  const cbY = y + (ROW_H - CHECKBOX) / 2
  drawSquareCheckbox(page, MARGIN + 3, cbY, false)
  placeCheckbox(form, page, FIELDS.dnf, MARGIN + 3, cbY, CHECKBOX, false)
  drawText(page, 'Did Not Finish', MARGIN + 3 + CHECKBOX + 3, y + ROW_H / 2 - 4, { size: FONT_LABEL, font: helv })
  drawText(page, '(DNF)', MARGIN + 3 + CHECKBOX + 3, y + ROW_H / 2 + 2, { size: FONT_LABEL, font: helv })

  setRect(page, MARGIN + dnfW, y, notesW, ROW_H)
  drawText(page, 'Notes:', MARGIN + dnfW + 2, y + ROW_H / 2 - FONT_LABEL / 2, { size: FONT_LABEL, font: helv })
  const notesLabelW = helv.widthOfTextAtSize('Notes:', FONT_LABEL) + 6
  placeTextField(form, page, FIELDS.notes, MARGIN + dnfW + notesLabelW, y + 2, notesW - notesLabelW - 2, ROW_H - 4)

  const totalX = MARGIN + dnfW + notesW
  setRect(page, totalX, y, totalLabelW, ROW_H)
  drawText(page, 'Total Score:', totalX + 2, y + 2, { size: FONT_LABEL, font: helvBold })

  setRect(page, totalX + totalLabelW, y, totalValueW, ROW_H)
  const compositeVal = scores.composite?.composite != null ? scores.composite.composite.toFixed(1) : ''
  placeTextField(form, page, FIELDS.total_score, totalX + totalLabelW + 1, y + 2, totalValueW - 2, ROW_H - 4, compositeVal)
  y += ROW_H

  // ---- Live calculator wiring (Acrobat Reader /AA/C + AcroForm /CO) ----
  attachScoreCalcs(form, calcRefs)

  // ---- PART III. ACKNOWLEDGEMENT ----
  setRect(page, MARGIN, y, CONTENT_W, PART_H, { fill: GREY })
  drawTextCentered(page, 'PART III. ACKNOWLEDGEMENT', PAGE_W / 2, y + 2, { size: FONT_PART, font: helvBold })
  y += PART_H

  y = drawMemberTesting(page, form, helv, helvBold, helvItalic, MARGIN, y, CONTENT_W)
  y = drawPfraAdminBlock(page, form, helv, helvBold, helvItalic, MARGIN, y, CONTENT_W)
  y = drawInjuryCheckboxRow(page, form, helv, helvBold, helvItalic, MARGIN, y, CONTENT_W)
  y = drawFacUfacBlock(page, form, helv, helvBold, helvItalic, MARGIN, y, CONTENT_W)
  y = drawValidityCheckboxRow(page, form, helv, helvBold, helvItalic, MARGIN, y, CONTENT_W)
  y = drawUnitCommanderBlock(page, form, helv, helvBold, helvItalic, MARGIN, y, CONTENT_W)

  // ---- Footer ----
  const footerY = PAGE_H - 18
  drawTextCentered(page, 'CUI (when filled in)', PAGE_W / 2, footerY + 6, { size: FONT_CUI, font: helvBold })
  drawText(page, 'AF Form 4446, 20260327', MARGIN, footerY, { size: FONT_SMALL, font: helvBold })
  drawText(page, 'Prescribed by: AFMAN36-2905', MARGIN, footerY + 8, { size: FONT_SMALL, font: helv })
  const pocLines = [
    'Controlled by: AF/A1P',
    'CUI Category: PVCY',
    'LDC: FEDCON',
    'POC: AF.A1P.Workflow@us.af.mil',
  ]
  for (let i = 0; i < pocLines.length; i++) {
    drawTextRight(page, pocLines[i], PAGE_W - MARGIN, footerY - 12 + i * 7, { size: FONT_SMALL, font: helv })
  }

  // ---- Add 4 signature widgets with /Lock dicts ----
  // Stash sig field rectangles during the ack-block draws via a side-channel on the page.
  const sigRefs = []
  for (const [name, locator] of Object.entries(page._sigLocators || {})) {
    const ref = addSignatureField(pdfDoc, page, name, locator.x, locator.y, locator.w, locator.h, SIG_LOCKS[name]())
    sigRefs.push(ref)
  }

  // Register sig fields in AcroForm.Fields (alongside the AcroForm fields pdf-lib already created)
  const acroFormDict = form.acroForm.dict
  const fieldsArr = acroFormDict.get(PDFName.of('Fields'))
  if (fieldsArr) {
    for (const r of sigRefs) fieldsArr.push(r)
  }
  acroFormDict.set(PDFName.of('SigFlags'), PDFNumber.of(3))   // SignaturesExist + AppendOnly

  // Now that the member-testing block has created next_pfra_due, wire its
  // default calc and append it to /CO.
  attachNextPfraDueCalc(form, calcRefs)

  // Tooltips + input masks on all fields (runs after every field exists).
  attachFieldPolish(form)

  // Tab order: column-wise (/Tabs /C) — Tab flows DOWN the measurement
  // column through every exercise row before jumping to exempt/date/score.
  page.node.set(PDFName.of('Tabs'), PDFName.of('C'))

  // ---- Doc-level JS (Adobe Reader auto-populate from CAC cert) ----
  attachDocJS(pdfDoc)

  return await pdfDoc.save({ useObjectStreams: false })
}

// -------------------- Block helpers --------------------

function drawPrivacyAct(page, helv, helvBold, x, yTop, w) {
  const pairs = [
    ['AUTHORITY:', 'Title 10 United States Code 9013, Secretary of the Air Force; AFMAN 36-2905, Department of the Air Force Physical Fitness Readiness Program and Policy.'],
    ['PURPOSE:', 'Information is used to positively identify an individual prior to administration of the Air Force Physical Fitness Readiness Assessment (PFRA).'],
    ['ROUTINE USES:', 'In addition to those disclosures generally permitted under 5 U.S.C. 552a(b) of the Privacy Act, these records or information contained therein may specifically be disclosed outside the DoD as a routine use pursuant to 5 U.S.C. 552a(b)(3); Blanket Routine Uses applies.'],
    ['DISCLOSURE:', 'Failure to provide the requested information will result in non-administration of the Fitness Assessment.'],
  ]
  // Pre-measure so the box height fits content
  let totalLines = 0
  const wrapped = []
  for (const [label, body] of pairs) {
    const labelW = helvBold.widthOfTextAtSize(label + ' ', FONT_PRIVACY_BODY)
    const lines = wrap(helv, body, FONT_PRIVACY_BODY, w - 4 - labelW)
    wrapped.push({ label, body, lines, labelW })
    totalLines += Math.max(1, lines.length)
  }
  const lineH = FONT_PRIVACY_BODY + 0.5
  const titleH = FONT_PRIVACY_TITLE + 2
  const blockH = titleH + totalLines * lineH + 4

  setRect(page, x, yTop, w, blockH, { fill: GREY })
  drawTextCentered(page, 'Privacy Act Statement', x + w / 2, yTop + 2, { size: FONT_PRIVACY_TITLE, font: helvBold })

  let py = yTop + titleH
  for (const { label, lines, labelW } of wrapped) {
    drawText(page, label, x + 2, py, { size: FONT_PRIVACY_BODY, font: helvBold })
    for (let i = 0; i < lines.length; i++) {
      const lx = i === 0 ? x + 2 + labelW : x + 2 + labelW
      drawText(page, lines[i], lx, py + i * lineH, { size: FONT_PRIVACY_BODY, font: helv })
    }
    py += Math.max(1, lines.length) * lineH
  }
  return blockH
}

function drawComponentHeader(page, helvBold, helvBoldItalic, x, yTop, w, categoryName) {
  const cols = componentCols(w)
  const headers = [null, 'Exempt', 'Expiration', 'Measurement', 'Min Value Met?', 'Score']
  let cx = x
  for (let i = 0; i < cols.length; i++) {
    setRect(page, cx, yTop, cols[i], HEADER_ROW_H, { fill: GREY })
    if (i === 0) {
      drawTextCentered(page, categoryName, cx + cols[i] / 2, yTop + (HEADER_ROW_H - FONT_CATEGORY) / 2, { size: FONT_CATEGORY, font: helvBoldItalic })
      const tw = helvBoldItalic.widthOfTextAtSize(categoryName, FONT_CATEGORY)
      drawLine(page, cx + cols[i] / 2 - tw / 2, yTop + HEADER_ROW_H - 1.5, cx + cols[i] / 2 + tw / 2, yTop + HEADER_ROW_H - 1.5, 0.5)
    } else {
      drawTextCentered(page, headers[i], cx + cols[i] / 2, yTop + (HEADER_ROW_H - FONT_LABEL) / 2, { size: FONT_LABEL, font: helvBold })
    }
    cx += cols[i]
  }
  return yTop + HEADER_ROW_H
}

function drawWaistRow(page, form, helv, x, yTop, w, data, decoded, calcRefs) {
  const cols = componentCols(w)
  const h = ROW_H
  let cx = x
  // Exercise name
  setRect(page, cx, yTop, cols[0], h)
  drawTextCentered(page, 'Waist Circumference', cx + cols[0] / 2, yTop + h / 2 - 4, { size: FONT_VALUE, font: helv })
  cx += cols[0]
  // Exempt radio
  setRect(page, cx, yTop, cols[1], h)
  placeYesNoRadio(form, page, exFields('waist').exempt, cx, yTop, cols[1], h, data.exempt)
  cx += cols[1]
  // Expiration
  setRect(page, cx, yTop, cols[2], h)
  placeDateField(form, page, exFields('waist').expiration, cx + 1, yTop + 1, cols[2] - 2, h - 2)
  cx += cols[2]
  // Measurement: 1: __ 2: __ 3: __ Average: __  (4 fields)
  // 1/2/3 are manual-entry; Average auto-calcs from the three on every change
  setRect(page, cx, yTop, cols[3], h)
  const smallSlotW = cols[3] * 0.18  // 1:, 2:, 3: each get 18%
  const avgSlotW = cols[3] - 3 * smallSlotW  // Average gets remaining 46%
  const slotWidths = [smallSlotW, smallSlotW, smallSlotW, avgSlotW]
  const labels = ['1:', '2:', '3:', 'Average:']
  const labelSizes = [FONT_SMALL, FONT_SMALL, FONT_SMALL, FONT_SMALL]
  const waistAvgVal = decoded.bodyComp?.waistInches ? String(decoded.bodyComp.waistInches) : ''
  const fieldVals = ['', '', '', waistAvgVal]
  let sx = cx
  let avgField = null
  for (let i = 0; i < 4; i++) {
    const ls = labelSizes[i]
    drawText(page, labels[i], sx + 1, yTop + h / 2 - 3, { size: ls, font: helv })
    const lw = helv.widthOfTextAtSize(labels[i], ls)
    const tf = placeTextField(form, page, WAIST_FIELDS[i], sx + lw + 2, yTop + 2, slotWidths[i] - lw - 3, h - 4, fieldVals[i])
    if (i === 3) avgField = tf
    sx += slotWidths[i]
  }
  // Wire waist_avg to auto-recalc on any document field change.
  // /CO lists this field; AA/C runs when any field changes; AA/F formats it.
  const ctx = form.doc.context
  const calcJs = `
    var w1 = parseFloat(this.getField("waist_w1").value) || 0;
    var w2 = parseFloat(this.getField("waist_w2").value) || 0;
    var w3 = parseFloat(this.getField("waist_w3").value) || 0;
    var n = (w1 > 0 ? 1 : 0) + (w2 > 0 ? 1 : 0) + (w3 > 0 ? 1 : 0);
    event.value = n > 0 ? ((w1 + w2 + w3) / n).toFixed(1) : "";
  `
  const fmtJs = `
    if (event.value) event.value = parseFloat(event.value).toFixed(1);
  `
  attachCalculateAction(ctx, avgField, calcJs, fmtJs)
  calcRefs.push(avgField.acroField.ref)
  cx += cols[3]
  // Min Met
  setRect(page, cx, yTop, cols[4], h)
  placeYesNoRadio(form, page, exFields('waist').min_met, cx, yTop, cols[4], h, data.minMet)
  cx += cols[4]
  // Score (display + field)
  setRect(page, cx, yTop, cols[5], h)
  placeTextField(form, page, exFields('waist').score, cx + 1, yTop + 2, cols[5] - 2, h - 4, data.score || '')
  return yTop + h
}

function drawBodyFatRow(page, form, helv, x, yTop, w) {
  const cols = componentCols(w)
  const h = ROW_H
  let cx = x
  setRect(page, cx, yTop, cols[0], h)
  drawTextCentered(page, 'Body Fat Assessment', cx + cols[0] / 2, yTop + h / 2 - 4, { size: FONT_VALUE, font: helv })
  cx += cols[0]
  setRect(page, cx, yTop, cols[1], h)
  placeYesNoRadio(form, page, exFields('bodyfat').exempt, cx, yTop, cols[1], h, null)
  cx += cols[1]
  setRect(page, cx, yTop, cols[2], h)
  placeDateField(form, page, exFields('bodyfat').expiration, cx + 1, yTop + 1, cols[2] - 2, h - 2)
  cx += cols[2]
  setRect(page, cx, yTop, cols[3], h)
  drawText(page, 'Results (%):', cx + 2, yTop + h / 2 - 3, { size: FONT_VALUE, font: helv })
  const lw = helv.widthOfTextAtSize('Results (%):', FONT_VALUE)
  placeTextField(form, page, BODYFAT_PCT, cx + 2 + lw + 1, yTop + 2, cols[3] - lw - 6, h - 4)
  cx += cols[3]
  setRect(page, cx, yTop, cols[4], h)
  placeYesNoRadio(form, page, exFields('bodyfat').min_met, cx, yTop, cols[4], h, null)
  cx += cols[4]
  setRect(page, cx, yTop, cols[5], h)
  placeTextField(form, page, exFields('bodyfat').score, cx + 1, yTop + 2, cols[5] - 2, h - 4)
  return yTop + h
}

function drawExerciseRow(page, form, helv, helvBold, x, yTop, w, exerciseName, measureLabel, key, data) {
  const cols = componentCols(w)
  const h = ROW_H
  const f = exFields(key)
  let cx = x
  // Exercise name — wrap to 2 lines if needed (matches 4446 reference)
  setRect(page, cx, yTop, cols[0], h)
  const nameW = helv.widthOfTextAtSize(exerciseName, FONT_VALUE)
  const cellPad = 4
  if (nameW > cols[0] - cellPad * 2) {
    const lines = wrap(helv, exerciseName, FONT_VALUE, cols[0] - cellPad * 2)
    const lineH = FONT_VALUE + 1
    const startY = yTop + (h - lines.length * lineH) / 2
    for (let i = 0; i < lines.length; i++) {
      const lw = helv.widthOfTextAtSize(lines[i], FONT_VALUE)
      drawText(page, lines[i], cx + (cols[0] - lw) / 2, startY + i * lineH, { size: FONT_VALUE, font: helv })
    }
  } else {
    drawTextCentered(page, exerciseName, cx + cols[0] / 2, yTop + h / 2 - 4, { size: FONT_VALUE, font: helv })
  }
  cx += cols[0]
  // Exempt radio
  setRect(page, cx, yTop, cols[1], h)
  placeYesNoRadio(form, page, f.exempt, cx, yTop, cols[1], h, data.exempt)
  cx += cols[1]
  // Expiration
  setRect(page, cx, yTop, cols[2], h)
  placeDateField(form, page, f.expiration, cx + 1, yTop + 1, cols[2] - 2, h - 2)
  cx += cols[2]
  // Measurement cell. For time-based exercises (run/plank/walk) the cell is
  // split into [mins][:][secs] numeric fields that back a hidden {key}_measurement
  // holding the normalized "mm:ss" string the scoring engine reads.
  setRect(page, cx, yTop, cols[3], h)
  drawText(page, `${measureLabel}:`, cx + 2, yTop + h / 2 - 3, { size: FONT_VALUE, font: helv })
  const measLabelW = helv.widthOfTextAtSize('Shuttles:', FONT_VALUE)
  const inputX = cx + 2 + measLabelW + 1
  const inputW = cols[3] - measLabelW - 6
  const isTime = (measureLabel === 'Time')
  if (isTime) {
    const colonW = helv.widthOfTextAtSize(':', FONT_VALUE)
    const halfW = (inputW - colonW - 4) / 2
    placeTextField(form, page, `${key}_min`, inputX, yTop + 2, halfW, h - 4, '')
    drawTextCentered(page, ':', inputX + halfW + 2 + colonW / 2, yTop + h / 2 - 3,
      { size: FONT_VALUE, font: helv })
    placeTextField(form, page, `${key}_sec`, inputX + halfW + colonW + 4, yTop + 2, halfW, h - 4, '')
    // Hidden combined measurement — keeps downstream code (scoring, lockSiblings)
    // working without changes.
    const hidden = placeTextField(form, page, f.measurement, inputX, yTop + 2, 1, 1, data.measurement ?? '')
    // Hidden (bit 2) + NoView (bit 3)
    hidden.acroField.dict.set(PDFName.of('F'), PDFNumber.of(2 | 32))
  } else {
    placeTextField(form, page, f.measurement, inputX, yTop + 2, inputW, h - 4, data.measurement ?? '')
  }
  cx += cols[3]
  // Min Met radio
  setRect(page, cx, yTop, cols[4], h)
  placeYesNoRadio(form, page, f.min_met, cx, yTop, cols[4], h, data.minMet)
  cx += cols[4]
  // Score
  setRect(page, cx, yTop, cols[5], h)
  placeTextField(form, page, f.score, cx + 1, yTop + 2, cols[5] - 2, h - 4, data.score || '')
  return yTop + h
}

function drawMemberTesting(page, form, helv, helvBold, helvItalic, x, yTop, w) {
  const labelW = w * 0.166
  const midW = w * 0.150
  const sigAreaW = w * 0.400
  const dateColW = w * 0.139
  const rightW = w * 0.145
  // 4446_RED.JPG ratio: MemberTesting : PfraAdmin : FacUfac : Commander = 1 : 2 : 0.53 : 1
  const checklistH = 33
  const sigH = 16

  // Label cell (covers both rows)
  setRect(page, x, yTop, labelW, checklistH + sigH)
  drawText(page, 'MEMBER TESTING:', x + 2, yTop + 2, { size: FONT_LABEL, font: helvBold })

  // Middle checkbox list (spans mid + sig area columns)
  const checklistW = midW + sigAreaW
  setRect(page, x + labelW, yTop, checklistW, checklistH)
  const items = [
    ['Accept results as Official PFRA and acknowledge results reflects my performance', FIELDS.member_accept_official],
    ['(If Applicable) Accept as DPFRA attempt IAW AFMAN 36-2905, 3.5.2.5', FIELDS.member_accept_dpfra],
    ['Dispute results IAW AFMAN 36-2905, 3.11.5.3. Member may appeal results IAW 8.2.', FIELDS.member_dispute],
  ]
  const listX = x + labelW + 3
  const ctx = form.doc.context
  const gateJs = PDFString.of('try { this.TR.gateMemberSig(this); } catch (e) {}')
  const gateAction = ctx.obj({ S: PDFName.of('JavaScript'), JS: gateJs })
  for (let i = 0; i < items.length; i++) {
    const ly = yTop + 2 + i * 9
    drawSquareCheckbox(page, listX, ly, false)
    const cb = placeCheckbox(form, page, items[i][1], listX, ly, CHECKBOX, false)
    drawText(page, items[i][0], listX + CHECKBOX + 3, ly + 1, { size: FONT_ACK, font: helvItalic })
    // /AA/U fires on Mouse Up, after the checkbox has toggled.
    cb.acroField.dict.set(PDFName.of('AA'), ctx.obj({ U: gateAction }))
  }

  // Right cells: Next PFRA Due label | field (aligned to Min Value Met? | Score)
  const pfraLabelX = x + labelW + checklistW
  setRect(page, pfraLabelX, yTop, dateColW, checklistH)
  drawText(page, 'Next PFRA Due:', pfraLabelX + 2, yTop + checklistH / 2 - FONT_LABEL / 2, { size: FONT_LABEL, font: helv })
  setRect(page, pfraLabelX + dateColW, yTop, rightW, checklistH)
  placeDateField(form, page, FIELDS.next_pfra_due,
    pfraLabelX + dateColW + 1, yTop + 2, rightW - 2, checklistH - 4)

  // Signature row: label cell | signature field cell
  const sigY = yTop + checklistH
  // "Signature:" label cell
  setRect(page, x + labelW, sigY, midW, sigH)
  drawText(page, 'Signature:', x + labelW + 2, sigY + sigH / 2 - FONT_LABEL / 2, { size: FONT_LABEL, font: helvItalic })
  // Signature field cell
  setRect(page, x + labelW + midW, sigY, sigAreaW, sigH)
  page._sigLocators = page._sigLocators || {}
  page._sigLocators[FIELDS.member_sig] = {
    x: x + labelW + midW + 1, y: sigY + 1,
    w: sigAreaW - 2, h: sigH - 2,
  }
  // Date label | field (aligned to Min Value Met? | Score)
  const dateX = x + labelW + checklistW
  setRect(page, dateX, sigY, dateColW, sigH)
  drawText(page, 'Date:', dateX + 2, sigY + sigH / 2 - FONT_LABEL / 2, { size: FONT_LABEL, font: helvItalic })
  setRect(page, dateX + dateColW, sigY, rightW, sigH)
  placeDateField(form, page, FIELDS.member_signature_date, dateX + dateColW + 1, sigY + 2, rightW - 2, sigH - 4)

  return sigY + sigH
}

function drawPfraAdminBlock(page, form, helv, helvBold, helvItalic, x, yTop, w) {
  const labelW = w * 0.166
  const sigLabelW = w * 0.150
  const dateW = w * 0.139
  const rightW = w * 0.145
  const sigFieldW = w - labelW - sigLabelW - dateW - rightW
  const rowH = 34

  // Label cell
  setRect(page, x, yTop, labelW, rowH)
  drawText(page, 'PFRA', x + 2, yTop + 2, { size: FONT_LABEL, font: helvBold })
  drawText(page, 'ADMINISTRATOR:', x + 2, yTop + FONT_LABEL + 4, { size: FONT_LABEL, font: helvBold })

  // Name/Signature label cell
  setRect(page, x + labelW, yTop, sigLabelW, rowH)
  drawText(page, 'Name/Signature:', x + labelW + 2, yTop + rowH / 2 - FONT_LABEL / 2, { size: FONT_LABEL, font: helvItalic })
  // Signature field cell
  setRect(page, x + labelW + sigLabelW, yTop, sigFieldW, rowH)
  page._sigLocators = page._sigLocators || {}
  page._sigLocators[FIELDS.pfra_admin_sig] = {
    x: x + labelW + sigLabelW + 1, y: yTop + 2,
    w: sigFieldW - 2, h: rowH - 4,
  }

  // Date label | field (aligned to Min Value Met? | Score)
  const dateX = x + labelW + sigLabelW + sigFieldW
  setRect(page, dateX, yTop, dateW, rowH)
  drawText(page, 'Date:', dateX + 2, yTop + rowH / 2 - FONT_LABEL / 2, { size: FONT_LABEL, font: helvItalic })
  setRect(page, dateX + dateW, yTop, rightW, rowH)
  placeDateField(form, page, FIELDS.pfra_admin_date, dateX + dateW + 1, yTop + 2, rightW - 2, rowH - 4)

  return yTop + rowH
}

function drawInjuryCheckboxRow(page, form, helv, helvBold, helvItalic, x, yTop, w) {
  const bodyText = 'Member experienced an injury or illness during this PFRA & was advised to pursue evaluation at a Medical Treatment Facility. This PFRA will become official unless rendered invalid by the Unit/CC. If no request to invalidate this PFRA or request to await medical review is not received by the FAC from the Unit/CC, the PFRA will become official on the 6th duty day(conclusion of next UTA for non-AGR ARC) IAW AFMAN 36-2905, 3.12.'
  const bodyFontSize = FONT_SMALL
  const bodyLineH = bodyFontSize + 1
  const bodyLines = wrap(helvItalic, bodyText, bodyFontSize, w - CHECKBOX - 12)
  const bodyH = Math.max(30, bodyLines.length * bodyLineH + 8)

  setRect(page, x, yTop, w, bodyH)
  drawSquareCheckbox(page, x + 3, yTop + 3, false)
  placeCheckbox(form, page, FIELDS.pfra_admin_injury, x + 3, yTop + 3, CHECKBOX, false)
  for (let i = 0; i < bodyLines.length; i++) {
    drawText(page, bodyLines[i], x + CHECKBOX + 8, yTop + 3 + i * bodyLineH, { size: bodyFontSize, font: helvItalic })
  }
  return yTop + bodyH
}

function drawFacUfacBlock(page, form, helv, helvBold, helvItalic, x, yTop, w) {
  const labelW = w * 0.166
  const sigLabelW = w * 0.150
  const dateW = w * 0.139
  const rightW = w * 0.145
  const sigFieldW = w - labelW - sigLabelW - dateW - rightW
  const rowH = 22

  // Label cell
  setRect(page, x, yTop, labelW, rowH)
  drawText(page, 'FAC/UFAC:', x + 2, yTop + 2, { size: FONT_LABEL, font: helvBold })

  // Name/Signature label cell
  setRect(page, x + labelW, yTop, sigLabelW, rowH)
  drawText(page, 'Name/Signature:', x + labelW + 2, yTop + rowH / 2 - FONT_LABEL / 2, { size: FONT_LABEL, font: helvItalic })
  // Signature field cell
  setRect(page, x + labelW + sigLabelW, yTop, sigFieldW, rowH)
  page._sigLocators = page._sigLocators || {}
  page._sigLocators[FIELDS.fac_ufac_sig] = {
    x: x + labelW + sigLabelW + 1, y: yTop + 2,
    w: sigFieldW - 2, h: rowH - 4,
  }

  // Date label | field (aligned to Min Value Met? | Score)
  const dateX = x + labelW + sigLabelW + sigFieldW
  setRect(page, dateX, yTop, dateW, rowH)
  drawText(page, 'Date:', dateX + 2, yTop + rowH / 2 - FONT_LABEL / 2, { size: FONT_LABEL, font: helvItalic })
  setRect(page, dateX + dateW, yTop, rightW, rowH)
  placeDateField(form, page, FIELDS.fac_ufac_date, dateX + dateW + 1, yTop + 2, rightW - 2, rowH - 4)

  return yTop + rowH
}

function drawValidityCheckboxRow(page, form, helv, helvBold, helvItalic, x, yTop, w) {
  const bodyH = 13

  setRect(page, x, yTop, w, bodyH)
  drawSquareCheckbox(page, x + 3, yTop + 2, false)
  placeCheckbox(form, page, FIELDS.fac_ufac_validity, x + 3, yTop + 2, CHECKBOX, false)
  const tx = x + CHECKBOX + 8
  const ty = yTop + 4
  const prefix = 'I have received and considered the provided medical documentation and render this test ['
  drawText(page, prefix, tx, ty, { size: FONT_ACK, font: helv })
  const pw = helv.widthOfTextAtSize(prefix, FONT_ACK)
  drawText(page, 'valid', tx + pw, ty, { size: FONT_ACK, font: helvBold })
  const vw = helvBold.widthOfTextAtSize('valid', FONT_ACK)
  drawText(page, ' / ', tx + pw + vw, ty, { size: FONT_ACK, font: helv })
  const sw = helv.widthOfTextAtSize(' / ', FONT_ACK)
  drawText(page, 'invalid', tx + pw + vw + sw, ty, { size: FONT_ACK, font: helvBold })
  const iw = helvBold.widthOfTextAtSize('invalid', FONT_ACK)
  drawText(page, '] due to injury/illness', tx + pw + vw + sw + iw, ty, { size: FONT_ACK, font: helv })
  return yTop + bodyH
}

function drawUnitCommanderBlock(page, form, helv, helvBold, helvItalic, x, yTop, w) {
  const labelW = w * 0.166
  const sigLabelW = w * 0.150
  const dateW = w * 0.139
  const rightW = w * 0.145
  const sigFieldW = w - labelW - sigLabelW - dateW - rightW
  const rowH = 44

  // Label cell
  setRect(page, x, yTop, labelW, rowH)
  drawText(page, 'UNIT COMMANDER:', x + 2, yTop + rowH / 2 - 3, { size: FONT_LABEL, font: helvBold })

  // Name/Signature label cell
  setRect(page, x + labelW, yTop, sigLabelW, rowH)
  drawText(page, 'Name/Signature:', x + labelW + 2, yTop + rowH / 2 - FONT_LABEL / 2, { size: FONT_LABEL, font: helvItalic })
  // Signature field cell
  setRect(page, x + labelW + sigLabelW, yTop, sigFieldW, rowH)
  page._sigLocators = page._sigLocators || {}
  page._sigLocators[FIELDS.commander_sig] = {
    x: x + labelW + sigLabelW + 1, y: yTop + 2,
    w: sigFieldW - 2, h: rowH - 4,
  }

  // Date label | field (aligned to Min Value Met? | Score)
  const dateX = x + labelW + sigLabelW + sigFieldW
  setRect(page, dateX, yTop, dateW, rowH)
  drawText(page, 'Date:', dateX + 2, yTop + rowH / 2 - FONT_LABEL / 2, { size: FONT_LABEL, font: helvItalic })
  setRect(page, dateX + dateW, yTop, rightW, rowH)
  placeDateField(form, page, FIELDS.commander_date, dateX + dateW + 1, yTop + 2, rightW - 2, rowH - 4)
  return yTop + rowH
}

// -------------------- Public download wrappers --------------------

export function downloadPDFBytes(bytes, filename = 'pfa-assessment.pdf') {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Back-compat: jsPDF callers used downloadPDF(doc, filename). Now the doc is bytes.
export function downloadPDF(bytesOrDoc, filename = 'pfa-assessment.pdf') {
  if (bytesOrDoc instanceof Uint8Array) return downloadPDFBytes(bytesOrDoc, filename)
  // jsPDF instance fallback (legacy)
  if (bytesOrDoc && typeof bytesOrDoc.save === 'function') return bytesOrDoc.save(filename)
  throw new Error('downloadPDF: unrecognized PDF input')
}

export async function generatePDFAndDownload(demographics, decoded, scores, assessmentDate = new Date()) {
  const bytes = await generateFormPDF(demographics, decoded, scores)
  const dateObj = assessmentDate instanceof Date
    ? assessmentDate
    : new Date(String(assessmentDate) + 'T12:00:00')
  const dateStr = (dateObj instanceof Date && !Number.isNaN(dateObj.getTime()))
    ? dateObj.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]
  downloadPDFBytes(bytes, `pfa-assessment-${dateStr}.pdf`)
}
