/**
 * Build an Acrobat-Reader-compatible JavaScript blob that reproduces the
 * Trajectory scoring engine inside a filled AF Form 4446 PDF.
 *
 * Reader's JS engine is SpiderMonkey-based and ES3-ish (no let/const/arrow,
 * no Array.find, no default params). This module serializes the data tables
 * and provides lookup functions in that dialect.
 */
import { SCORING_TABLES, WHTR_TABLE } from '../scoring/scoringTables.js'
import {
  COMPONENT_WEIGHTS, PASSING_COMPOSITE, WALK_TIME_LIMITS, AGE_BRACKETS,
} from '../scoring/constants.js'

export function buildScoringJs() {
  const data = {
    T: SCORING_TABLES,
    WHTR: WHTR_TABLE,
    W: COMPONENT_WEIGHTS,
    WALK: WALK_TIME_LIMITS,
    PASS: PASSING_COMPOSITE,
    AB: AGE_BRACKETS,
  }
  // Attach TR to the document (`this`) so field-level /AA/C scripts can reach
  // it even if Reader did not treat the payload as a doc-level init.
  return 'this.TR_DATA = ' + JSON.stringify(data) + ';\n' + SCORING_JS_LIB
}

const SCORING_JS_LIB = `
this.TR = (function (doc) {
  var D = doc.TR_DATA;

  function ageBracket(age) {
    if (!age || isNaN(age)) return null;
    if (age < 25) return D.AB.UNDER_25;
    if (age < 30) return D.AB.AGE_25_29;
    if (age < 35) return D.AB.AGE_30_34;
    if (age < 40) return D.AB.AGE_35_39;
    if (age < 45) return D.AB.AGE_40_44;
    if (age < 50) return D.AB.AGE_45_49;
    if (age < 55) return D.AB.AGE_50_54;
    if (age < 60) return D.AB.AGE_55_59;
    return D.AB.AGE_60_PLUS;
  }

  // Accept "M"/"F"/"Male"/"Female"
  function genderKey(g) {
    if (!g) return null;
    var s = String(g).charAt(0).toUpperCase();
    return (s === 'M' || s === 'F') ? s : null;
  }

  // Parse mm:ss or plain seconds. Returns null on empty/bad input.
  function parseTime(v) {
    if (v === null || v === undefined) return null;
    var s = String(v).replace(/\\s+/g, '');
    if (s === '') return null;
    if (s.indexOf(':') !== -1) {
      var parts = s.split(':');
      var m = parseInt(parts[0], 10);
      var sec = parseInt(parts[1], 10);
      if (isNaN(m) || isNaN(sec)) return null;
      return m * 60 + sec;
    }
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  function parseNum(v) {
    if (v === null || v === undefined) return null;
    var s = String(v).replace(/\\s+/g, '');
    if (s === '') return null;
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  // Exercise direction: time-based vs reps-based. Matches scoringEngine.js.
  var TIME_BASED = { '2mile_run': 1, '2km_walk': 1, 'whtr': 1 };
  var PLANK = 'plank';

  function lookup(table, v, timeBased) {
    var i;
    if (timeBased) {
      // Lower is better; table sorted ascending by threshold
      for (i = 0; i < table.length; i++) {
        if (v <= table[i].threshold) return table[i].points;
      }
      return 0;
    }
    // Higher is better; table sorted descending by threshold
    for (i = 0; i < table.length; i++) {
      if (v >= table[i].threshold) return table[i].points;
    }
    return 0;
  }

  // Exercise score for a raw value. Returns '' if inputs incomplete.
  function scoreFor(exercise, rawValue, gender, age) {
    if (rawValue === null || rawValue === undefined || rawValue === '') return '';

    // WHtR uses a universal table and doesn't need gender/age.
    if (exercise === 'whtr') {
      var w = parseNum(rawValue);
      if (w === null || w <= 0) return '';
      var wt = Math.floor(w * 100) / 100;
      var wp = lookup(D.WHTR, wt, true);
      return (Math.round(wp * 10) / 10).toFixed(1);
    }

    var g = genderKey(gender);
    var ab = ageBracket(age);
    if (!g || !ab) return '';

    var table = (D.T[g] && D.T[g][ab] && D.T[g][ab][exercise]) || null;
    if (!table) return '';

    var v;
    if (exercise === '2mile_run' || exercise === '2km_walk' || exercise === PLANK) {
      v = parseTime(rawValue);
    } else {
      v = parseNum(rawValue);
    }
    if (v === null) return '';

    var isTime = !!TIME_BASED[exercise];
    var pts = lookup(table, v, isTime);
    // Format to 1 decimal where chart uses halves; otherwise integer-ish.
    return (Math.round(pts * 10) / 10).toFixed(1);
  }

  // Read a score output field (already computed via its own /AA/C).
  // Returns { pts, exempt } or null if blank.
  function readScoreField(doc, scoreName, exemptName) {
    var exempt = null;
    if (exemptName) {
      try { exempt = doc.getField(exemptName); } catch (e) { exempt = null; }
    }
    var exemptVal = exempt && exempt.value ? String(exempt.value) : '';
    if (exemptVal === 'Yes') return { pts: 0, max: 0, exempt: true };
    var sf;
    try { sf = doc.getField(scoreName); } catch (e) { return null; }
    if (!sf) return null;
    var sv = sf.value;
    if (sv === null || sv === undefined || sv === '') return null;
    var n = parseFloat(sv);
    if (isNaN(n)) return null;
    return { pts: n, max: 15, exempt: false };
  }

  // Component score: pick the tested exercise in a component (max points among
  // entered). Returns { earned, possible } with possible = weight, scaled by
  // ratio. If all exempt or untested, contributes 0/0.
  //
  // exerciseMap: array of { score, exempt, max } (max is the exercise's max pts).
  function componentScore(doc, exerciseMap, weight) {
    var best = null;
    var anyExempt = true;
    for (var i = 0; i < exerciseMap.length; i++) {
      var r = readScoreField(doc, exerciseMap[i].score, exerciseMap[i].exempt);
      if (r === null) continue;
      if (!r.exempt) anyExempt = false;
      if (r.exempt) continue;
      if (best === null || r.pts > best.pts) {
        best = { pts: r.pts, max: exerciseMap[i].max };
      }
    }
    if (best === null) {
      // Either nothing tested, or everything exempt
      return { earned: 0, possible: 0 };
    }
    // Scale to weight: earned = (pts/max) * weight
    return {
      earned: (best.pts / best.max) * weight,
      possible: weight,
    };
  }

  function compositeScore(doc) {
    // Body comp: WHtR (via waist_score). 20% weight, max 20 pts.
    var bc = componentScore(doc, [{ score: 'waist_score', exempt: 'waist_exempt', max: 20 }], D.W.bodyComp);
    // Strength: push-up or HRPU. Max 15 each.
    var st = componentScore(doc,
      [{ score: 'pushup_score', exempt: 'pushup_exempt', max: 15 },
       { score: 'hrpu_score',   exempt: 'hrpu_exempt',   max: 15 }],
      D.W.strength);
    // Core: sit-up, CLRC, plank. Max 15 each.
    var co = componentScore(doc,
      [{ score: 'situp_score', exempt: 'situp_exempt', max: 15 },
       { score: 'clrc_score',  exempt: 'clrc_exempt',  max: 15 },
       { score: 'plank_score', exempt: 'plank_exempt', max: 15 }],
      D.W.core);
    // Cardio: 2-mile run or HAMR. Max 50 each. (Walk is pass/fail only.)
    var ca = componentScore(doc,
      [{ score: 'run_score',  exempt: 'run_exempt',  max: 50 },
       { score: 'hamr_score', exempt: 'hamr_exempt', max: 50 }],
      D.W.cardio);

    var earned = bc.earned + st.earned + co.earned + ca.earned;
    var possible = bc.possible + st.possible + co.possible + ca.possible;
    if (possible <= 0) return '';
    var composite = Math.round((earned / possible) * 1000) / 10;
    return composite.toFixed(1);
  }

  // Walk pass/fail check. Returns "PASS", "FAIL", or "".
  function walkResult(doc) {
    var ex; try { ex = doc.getField('walk_exempt'); } catch (e) { ex = null; }
    if (ex && String(ex.value) === 'Yes') return '';
    var mf; try { mf = doc.getField('walk_measurement'); } catch (e) { mf = null; }
    if (!mf || !mf.value) return '';
    var sec = parseTime(mf.value);
    if (sec === null) return '';
    var sex = doc.getField('sex'); if (!sex || !sex.value) return '';
    var age = parseInt(doc.getField('age').value, 10);
    var ab = ageBracket(age);
    var g = genderKey(sex.value);
    if (!ab || !g) return '';
    var limit = D.WALK[g] && D.WALK[g][ab];
    if (!limit) return '';
    return sec <= limit ? 'PASS' : 'FAIL';
  }

  // Exclusivity: when one exercise in a component group has a measurement,
  // lock all sibling rows (measurement + exempt + expiration + score +
  // min_met) read-only, and force the active row's exempt radio to "No".
  // Clearing the active measurement unlocks every row in the group.
  function setRO(doc, name, ro) {
    try {
      var f = doc.getField(name);
      if (f) f.readonly = ro;
    } catch (e) {}
  }
  function lockSiblings(doc, keys) {
    var filled = null;
    var i, m;
    for (i = 0; i < keys.length; i++) {
      try {
        m = doc.getField(keys[i] + '_measurement');
        if (m && m.value !== null && m.value !== undefined && String(m.value) !== '') {
          filled = keys[i]; break;
        }
      } catch (e) {}
    }
    var parts = ['_measurement', '_min', '_sec', '_exempt', '_expiration', '_score', '_min_met'];
    for (i = 0; i < keys.length; i++) {
      var ro = (filled !== null && keys[i] !== filled);
      // Sibling rows: clear any stale values BEFORE locking them read-only.
      if (ro) {
        for (var c = 0; c < parts.length; c++) {
          try {
            var cf = doc.getField(keys[i] + parts[c]);
            if (!cf) continue;
            // Unlock briefly so we can clear; radio groups accept "Off".
            var wasRO = cf.readonly;
            cf.readonly = false;
            if (parts[c] === '_exempt' || parts[c] === '_min_met') {
              cf.value = 'Off';
            } else {
              cf.value = '';
            }
            cf.readonly = wasRO;
          } catch (eC) {}
        }
      }
      for (var j = 0; j < parts.length; j++) {
        setRO(doc, keys[i] + parts[j], ro);
      }
      // Active row: force exempt = "No" (a scored row is not exempt).
      if (filled !== null && keys[i] === filled) {
        try {
          var ex = doc.getField(keys[i] + '_exempt');
          if (ex) ex.value = 'No';
        } catch (e) {}
      }
    }
  }

  // Compute Next PFRA Due from pfra_date + composite per DAFMAN 36-2905
  // Table 3.3. Returns "" if inputs missing. Total Force default; ARC/Guard
  // members override (12-month cycle) by editing the field directly.
  function nextPfraDueDefault(doc) {
    var df; try { df = doc.getField('pfra_date'); } catch (e) { df = null; }
    if (!df || !df.value) return '';
    var comp = null;
    try {
      var ts = doc.getField('total_score');
      if (ts && ts.value !== null && ts.value !== '') comp = parseFloat(ts.value);
    } catch (e2) {}
    var months;
    if (comp === null || isNaN(comp)) return '';
    if (comp < 75) months = 3;
    else months = 6;
    // Parse mm/dd/yyyy → Date, add months, format back.
    var m = String(df.value).match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$/);
    if (!m) return '';
    var d = new Date(parseInt(m[3], 10), parseInt(m[1], 10) - 1, parseInt(m[2], 10));
    if (isNaN(d.getTime())) return '';
    d.setMonth(d.getMonth() + months);
    var mm = d.getMonth() + 1, dd = d.getDate(), yy = d.getFullYear();
    return (mm < 10 ? '0' + mm : mm) + '/' + (dd < 10 ? '0' + dd : dd) + '/' + yy;
  }

  // Gate the member signature: only allow signing if at least one of the 3
  // acknowledgement checkboxes is checked (accept official / accept DPFRA /
  // dispute). When no box is checked, the signature field is read-only.
  function gateMemberSig(doc) {
    var names = ['member_accept_official', 'member_accept_dpfra', 'member_dispute'];
    var anyChecked = false;
    for (var i = 0; i < names.length; i++) {
      try {
        var cb = doc.getField(names[i]);
        if (cb) {
          var v = cb.value;
          if (v && String(v) !== 'Off' && String(v) !== '') { anyChecked = true; break; }
        }
      } catch (e) {}
    }
    try {
      var sig = doc.getField('member_sig');
      if (sig) sig.readonly = !anyChecked;
    } catch (e2) {}
  }

  return {
    scoreFor: scoreFor,
    compositeScore: compositeScore,
    walkResult: walkResult,
    parseTime: parseTime,
    parseNum: parseNum,
    lockSiblings: lockSiblings,
    gateMemberSig: gateMemberSig,
    nextPfraDueDefault: nextPfraDueDefault,
  };
})(this);
`
