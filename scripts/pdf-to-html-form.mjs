#!/usr/bin/env node
/**
 * pdf-to-html-form.mjs
 *
 * PDF round-trip tool. Default mode replicates an input PDF as an editable
 * HTML form (page raster background + overlaid AcroForm-style HTML inputs
 * inferred from the PDF text). Optional mode (--emit-pdf) re-emits the same
 * layout as a real AcroForm PDF using pdf-lib, so the tool covers
 * pdf -> html -> pdf in one pass.
 *
 * Usage:
 *   node scripts/pdf-to-html-form.mjs <input.pdf> [output.html] \\
 *        [--dpi=150] [--tesseract] [--emit-pdf=<out.pdf>]
 *
 * Modes:
 *   1. Text PDF  - uses pdftotext -bbox-layout to get word-level positions.
 *   2. Image PDF - falls back to tesseract OCR if --tesseract is passed AND
 *                  tesseract is installed; otherwise emits a background-only
 *                  HTML with a warning banner.
 *   3. --emit-pdf - additionally writes an AcroForm PDF with the same field
 *                  layout, page rasters as backgrounds, and text/radio widgets
 *                  at the same coordinates.
 *
 * Output:
 *   <output>.html + <output>-assets/ (rendered page PNGs)
 *   <out.pdf> (when --emit-pdf is given)
 *
 * External deps (all standard on Debian/Ubuntu, included in poppler-utils):
 *   pdftoppm, pdftotext, pdfinfo, (tesseract optional)
 *   pdf-lib (npm; already a project dependency)
 *
 * Any agent may call this tool. It has no side effects beyond the files it
 * writes next to the output path.
 */

import { execSync, spawnSync } from 'node:child_process'
import {
  mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync,
} from 'node:fs'
import { basename, dirname, extname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

// -------------------------- CLI --------------------------

function parseArgs(argv) {
  const args = { dpi: 150, tesseract: false, emitPdf: null, positional: [] }
  for (const a of argv.slice(2)) {
    if (a === '--tesseract') args.tesseract = true
    else if (a.startsWith('--dpi=')) args.dpi = Number(a.slice(6)) || 150
    else if (a.startsWith('--emit-pdf=')) args.emitPdf = a.slice('--emit-pdf='.length)
    else if (a === '-h' || a === '--help') args.help = true
    else args.positional.push(a)
  }
  return args
}

function usage() {
  console.log(`Usage: pdf-to-html-form.mjs <input.pdf> [output.html] [options]

Options:
  --dpi=<n>            Render DPI for page rasters (default 150)
  --tesseract          Use tesseract OCR if PDF has no extractable text
  --emit-pdf=<path>    Also emit a round-tripped AcroForm PDF at <path>
                       (page rasters as background, fields as PDF widgets)
  -h, --help           Show this help

Default mode: replicates a PDF as an HTML form. Renders each page as a
background image and overlays <input>/radio widgets at positions inferred
from the PDF's text content.

With --emit-pdf, additionally writes a real AcroForm PDF with the same
layout via pdf-lib, completing a pdf -> html -> pdf round trip.

Examples:
  node pdf-to-html-form.mjs form.pdf
  node pdf-to-html-form.mjs form.pdf out/form.html --dpi=200
  node pdf-to-html-form.mjs scanned.pdf --tesseract
  node pdf-to-html-form.mjs form.pdf --emit-pdf=form.acroform.pdf
`)
}

// -------------------------- Tool probes --------------------------

function which(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] })
    return true
  } catch { return false }
}

function requireBin(bin) {
  if (!which(bin)) {
    throw new Error(`Required binary '${bin}' is not on PATH. Install poppler-utils (pdftoppm, pdftotext, pdfinfo).`)
  }
}

// -------------------------- PDF helpers --------------------------

function pdfInfo(pdfPath) {
  const out = execSync(`pdfinfo ${JSON.stringify(pdfPath)}`, { encoding: 'utf8' })
  const info = {}
  for (const line of out.split('\n')) {
    const m = line.match(/^([A-Za-z ]+):\s+(.*)$/)
    if (m) info[m[1].trim()] = m[2].trim()
  }
  const pages = parseInt(info['Pages'] || '1', 10)
  const sizeMatch = (info['Page size'] || '').match(/([\d.]+)\s*x\s*([\d.]+)\s*pts/)
  const widthPts = sizeMatch ? parseFloat(sizeMatch[1]) : 612
  const heightPts = sizeMatch ? parseFloat(sizeMatch[2]) : 792
  return { pages, widthPts, heightPts, raw: info }
}

function renderPages(pdfPath, outDir, dpi) {
  mkdirSync(outDir, { recursive: true })
  const prefix = join(outDir, 'page')
  execSync(
    `pdftoppm -r ${dpi} ${JSON.stringify(pdfPath)} ${JSON.stringify(prefix)} -png`,
    { stdio: ['ignore', 'pipe', 'inherit'] },
  )
  return readdirSync(outDir).filter(f => f.startsWith('page') && f.endsWith('.png')).sort()
}

function extractWords(pdfPath) {
  // Uses pdftotext -bbox-layout; returns array of { page, x, y, w, h, text }.
  const tmp = `/tmp/pdf-to-html-bbox-${process.pid}.html`
  try {
    execSync(`pdftotext -bbox-layout ${JSON.stringify(pdfPath)} ${JSON.stringify(tmp)}`,
      { stdio: ['ignore', 'pipe', 'ignore'] })
    const xml = readFileSync(tmp, 'utf8')
    return parseBboxXml(xml)
  } finally {
    try { rmSync(tmp) } catch { /* noop */ }
  }
}

function parseBboxXml(xml) {
  // poppler emits <page><flow><block><line><word xMin xMax yMin yMax>text</word>...
  const words = []
  const pageRe = /<page\s+width="([\d.]+)"\s+height="([\d.]+)">([\s\S]*?)<\/page>/g
  let pageNum = 0
  let pm
  while ((pm = pageRe.exec(xml)) !== null) {
    pageNum++
    const pw = parseFloat(pm[1])
    const ph = parseFloat(pm[2])
    const pageBody = pm[3]
    const wordRe = /<word\s+xMin="([\d.]+)"\s+yMin="([\d.]+)"\s+xMax="([\d.]+)"\s+yMax="([\d.]+)"[^>]*>([\s\S]*?)<\/word>/g
    let wm
    while ((wm = wordRe.exec(pageBody)) !== null) {
      const text = wm[5].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
      if (!text) continue
      const x = parseFloat(wm[1])
      const y = parseFloat(wm[2])
      const x2 = parseFloat(wm[3])
      const y2 = parseFloat(wm[4])
      words.push({
        page: pageNum, pageWidthPts: pw, pageHeightPts: ph,
        x, y, w: x2 - x, h: y2 - y, text,
      })
    }
  }
  return words
}

function ocrWords(imagePath, pageNum, pageWidthPts, pageHeightPts, dpi) {
  // tesseract TSV gives word-level bounding boxes in image pixels
  const tsvPrefix = `/tmp/pdf-to-html-ocr-${process.pid}-${pageNum}`
  const run = spawnSync('tesseract', [imagePath, tsvPrefix, '-l', 'eng', 'tsv'], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (run.status !== 0) return []
  const tsv = readFileSync(tsvPrefix + '.tsv', 'utf8')
  try { rmSync(tsvPrefix + '.tsv') } catch { /* noop */ }
  const lines = tsv.trim().split('\n')
  const header = lines.shift()?.split('\t') ?? []
  const idx = {
    left: header.indexOf('left'),
    top: header.indexOf('top'),
    width: header.indexOf('width'),
    height: header.indexOf('height'),
    text: header.indexOf('text'),
    conf: header.indexOf('conf'),
  }
  const ptsPerPx = 72 / dpi
  const words = []
  for (const l of lines) {
    const cols = l.split('\t')
    const text = (cols[idx.text] || '').trim()
    if (!text) continue
    const conf = parseFloat(cols[idx.conf] || '-1')
    if (conf < 30) continue
    const left = parseFloat(cols[idx.left])
    const top = parseFloat(cols[idx.top])
    const width = parseFloat(cols[idx.width])
    const height = parseFloat(cols[idx.height])
    words.push({
      page: pageNum, pageWidthPts, pageHeightPts,
      x: left * ptsPerPx,
      y: top * ptsPerPx,
      w: width * ptsPerPx,
      h: height * ptsPerPx,
      text,
    })
  }
  return words
}

// -------------------------- Field inference --------------------------

/**
 * Group words into lines by page + near-equal y (tolerance = median glyph height).
 */
function groupLines(words) {
  const byPage = new Map()
  for (const w of words) {
    if (!byPage.has(w.page)) byPage.set(w.page, [])
    byPage.get(w.page).push(w)
  }
  const out = new Map()
  for (const [pg, list] of byPage) {
    list.sort((a, b) => a.y - b.y || a.x - b.x)
    const tol = medianHeight(list) * 0.6 || 4
    const lines = []
    for (const w of list) {
      const last = lines[lines.length - 1]
      if (last && Math.abs(last.y - w.y) <= tol) last.words.push(w)
      else lines.push({ y: w.y, words: [w] })
    }
    out.set(pg, lines)
  }
  return out
}

function medianHeight(words) {
  const hs = words.map(w => w.h).filter(h => h > 0).sort((a, b) => a - b)
  return hs.length ? hs[Math.floor(hs.length / 2)] : 0
}

/**
 * Infer fields from lines. A field is either:
 *  - a LABEL (word ending in ':') followed by empty space up to next label/line end -> text input
 *  - a Yes/No adjacency -> radio pair
 *  - an isolated square bracket / checkbox glyph -> checkbox
 */
function inferFields(linesByPage) {
  const fields = []
  for (const [page, lines] of linesByPage) {
    for (const line of lines) {
      const ws = line.words
      for (let i = 0; i < ws.length; i++) {
        const w = ws[i]
        // Yes/No radio pair
        if (/^Yes$/i.test(w.text)) {
          // Look ahead for 'No' on same line reasonably close
          for (let j = i + 1; j < ws.length && j < i + 4; j++) {
            if (/^No$/i.test(ws[j].text)) {
              fields.push({
                type: 'radio', page,
                name: buildLabel(ws, i) || `radio_p${page}_${Math.round(w.y)}`,
                x: w.x - 6, y: w.y - 2, w: (ws[j].x + ws[j].w) - (w.x - 6) + 4, h: w.h + 4,
                choices: ['Yes', 'No'],
              })
              i = j
              break
            }
          }
          continue
        }
        // Label ending in ":" — input spans until next label or line end
        if (/:$/.test(w.text) && w.text.length > 1) {
          const name = w.text.replace(/:$/, '').trim()
          let nextX = null
          for (let j = i + 1; j < ws.length; j++) {
            if (/:$/.test(ws[j].text)) { nextX = ws[j].x - 2; break }
          }
          const x0 = w.x + w.w + 2
          const xEnd = nextX ?? (w.pageWidthPts - 10)
          if (xEnd - x0 > 15) {
            fields.push({
              type: 'input', page, name,
              x: x0, y: w.y - 1, w: xEnd - x0, h: w.h + 3,
            })
          }
        }
      }
    }
  }
  return fields
}

function buildLabel(ws, yesIdx) {
  // Scan backward for a preceding label that names this radio
  for (let k = yesIdx - 1; k >= 0 && k >= yesIdx - 6; k--) {
    if (/:$/.test(ws[k].text)) return ws[k].text.replace(/:$/, '').trim()
  }
  // Otherwise build from 2-3 words preceding Yes
  const parts = []
  for (let k = Math.max(0, yesIdx - 3); k < yesIdx; k++) parts.push(ws[k].text)
  return parts.join(' ').trim() || null
}

// -------------------------- HTML output --------------------------

function buildHtml({ pages, fields, assetsDir, pdfName, modeNote, dpi }) {
  const style = `
    :root { --page-bg: #fff; --field-border: #0a5; --field-bg: rgba(10,170,85,0.08); }
    body { margin: 0; background: #333; font-family: system-ui, sans-serif; }
    header { color: #fff; padding: 8px 16px; background: #111; display: flex; gap: 16px; align-items: center; }
    header h1 { font-size: 14px; margin: 0; font-weight: 600; }
    header small { opacity: 0.7; font-size: 11px; }
    .page {
      position: relative;
      margin: 16px auto;
      background: var(--page-bg);
      box-shadow: 0 2px 12px rgba(0,0,0,0.4);
    }
    .page img.bg {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none;
      user-select: none;
    }
    .field {
      position: absolute;
      box-sizing: border-box;
    }
    .field input[type="text"] {
      width: 100%; height: 100%;
      border: 1px solid var(--field-border);
      background: var(--field-bg);
      font: inherit;
      padding: 0 2px;
      outline: none;
    }
    .field.radio {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      background: var(--field-bg);
      border: 1px dashed var(--field-border);
      padding: 0 2px;
    }
    .field.radio label { display: inline-flex; align-items: center; gap: 2px; }
    .warn {
      position: sticky; top: 0;
      background: #b60; color: #fff; padding: 6px 12px;
      font-size: 12px; z-index: 10;
    }
  `
  const headerHtml = `<header>
    <h1>${escape(pdfName)}</h1>
    <small>Regenerated from PDF - ${escape(modeNote)} - ${dpi}dpi</small>
  </header>`
  const warn = modeNote.includes('no text') ? `<div class="warn">This PDF has no extractable text. Overlay fields could not be inferred. Provide --tesseract if OCR is installed, or edit the HTML by hand.</div>` : ''

  const pageDivs = pages.map(pg => {
    const pxW = Math.round(pg.widthPts * (dpi / 72))
    const pxH = Math.round(pg.heightPts * (dpi / 72))
    const pageFields = fields.filter(f => f.page === pg.number)
    const overlays = pageFields.map(f => renderField(f, pg, dpi)).join('\n')
    return `<section class="page" style="width:${pxW}px;height:${pxH}px;">
      <img class="bg" src="${assetsDir}/${pg.image}" alt="Page ${pg.number}">
      ${overlays}
    </section>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escape(pdfName)} - HTML form</title>
<style>${style}</style>
</head>
<body>
${headerHtml}${warn}
<form id="pdf-form">
${pageDivs}
</form>
</body>
</html>`
}

function renderField(f, pg, dpi) {
  const px = v => Math.round(v * (dpi / 72))
  const left = px(f.x)
  const top = px(f.y)
  const width = px(f.w)
  const height = Math.max(px(f.h), 16)
  const style = `left:${left}px;top:${top}px;width:${width}px;height:${height}px;`
  if (f.type === 'radio') {
    const choices = f.choices.map((c) => {
      return `<label><input type="radio" name="${escape(f.name)}" value="${escape(c)}">${escape(c)}</label>`
    }).join('')
    return `<div class="field radio" style="${style}">${choices}</div>`
  }
  return `<div class="field" style="${style}"><input type="text" name="${escape(f.name)}"></div>`
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[m]))
}

// -------------------------- AcroForm PDF emitter (HTML -> PDF) --------------------------

/**
 * Emit a real AcroForm PDF using pdf-lib. The page raster goes in as a
 * background image scaled to the original page size; each inferred field
 * becomes a PDF widget at the same coordinates (PDF y-axis is bottom-up,
 * so we flip).
 *
 * Returns the file size in bytes.
 */
async function emitAcroFormPdf({ pages, fields, assetsAbs, outPath }) {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.setTitle(basename(outPath))
  pdfDoc.setProducer('pdf-to-html-form.mjs')
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const form = pdfDoc.getForm()
  const usedNames = new Set()
  const usedRadioGroups = new Set()

  function uniqueName(base) {
    let n = (base || 'field').replace(/[^A-Za-z0-9_]+/g, '_').slice(0, 48) || 'field'
    let candidate = n
    let i = 2
    while (usedNames.has(candidate)) { candidate = `${n}_${i++}` }
    usedNames.add(candidate)
    return candidate
  }
  function uniqueRadioGroup(base) {
    let n = (base || 'radio').replace(/[^A-Za-z0-9_]+/g, '_').slice(0, 48) || 'radio'
    let candidate = n
    let i = 2
    while (usedRadioGroups.has(candidate)) { candidate = `${n}_${i++}` }
    usedRadioGroups.add(candidate)
    return candidate
  }

  for (const pg of pages) {
    const page = pdfDoc.addPage([pg.widthPts, pg.heightPts])
    const pngBytes = readFileSync(join(assetsAbs, pg.image))
    const png = await pdfDoc.embedPng(pngBytes)
    page.drawImage(png, { x: 0, y: 0, width: pg.widthPts, height: pg.heightPts })

    const pageFields = fields.filter(f => f.page === pg.number)
    for (const f of pageFields) {
      // Flip Y: pdf-lib y is bottom-up. Field y from extractor is top-down in pts.
      const x = f.x
      const y = pg.heightPts - f.y - f.h
      const w = f.w
      const h = f.h
      if (f.type === 'radio') {
        const gName = uniqueRadioGroup(f.name)
        const group = form.createRadioGroup(gName)
        const choices = Array.isArray(f.choices) && f.choices.length ? f.choices : ['Yes', 'No']
        const slotW = w / choices.length
        for (let i = 0; i < choices.length; i++) {
          group.addOptionToPage(choices[i], page, {
            x: x + i * slotW, y, width: Math.min(slotW, h), height: h,
            borderColor: rgb(0, 0.4, 0), borderWidth: 0.5,
          })
        }
      } else {
        const tName = uniqueName(f.name)
        const tf = form.createTextField(tName)
        tf.addToPage(page, {
          x, y, width: w, height: h,
          font: helv,
          borderColor: rgb(0, 0.4, 0), borderWidth: 0.5,
          backgroundColor: rgb(0.94, 1, 0.94),
        })
        tf.setFontSize(Math.max(7, Math.min(11, h - 2)))
      }
    }
  }

  const bytes = await pdfDoc.save({ useObjectStreams: false })
  writeFileSync(outPath, bytes)
  return bytes.length
}

// -------------------------- Main --------------------------

async function main() {
  const args = parseArgs(process.argv)
  if (args.help || args.positional.length < 1) { usage(); process.exit(args.help ? 0 : 1) }

  requireBin('pdfinfo'); requireBin('pdftoppm'); requireBin('pdftotext')

  const pdfPath = resolve(args.positional[0])
  if (!existsSync(pdfPath)) { console.error(`Not found: ${pdfPath}`); process.exit(2) }

  const defaultOut = join(dirname(pdfPath), basename(pdfPath, extname(pdfPath)) + '.html')
  const outHtml = resolve(args.positional[1] || defaultOut)
  const assetsAbs = outHtml.replace(/\.html?$/i, '') + '-assets'
  const assetsRel = basename(assetsAbs)

  console.error(`[pdf-to-html-form] input:   ${pdfPath}`)
  console.error(`[pdf-to-html-form] output:  ${outHtml}`)
  console.error(`[pdf-to-html-form] assets:  ${assetsAbs}`)

  const info = pdfInfo(pdfPath)
  const imageFiles = renderPages(pdfPath, assetsAbs, args.dpi)
  const pages = imageFiles.map((f, i) => ({
    number: i + 1,
    image: f,
    widthPts: info.widthPts,
    heightPts: info.heightPts,
  }))

  let words = extractWords(pdfPath)
  let modeNote = words.length ? `text extracted (${words.length} words)` : 'no text in PDF'

  if (!words.length && args.tesseract) {
    if (!which('tesseract')) {
      console.error('[pdf-to-html-form] --tesseract requested but tesseract is not installed; skipping OCR.')
    } else {
      modeNote = 'OCR (tesseract)'
      for (const pg of pages) {
        const imgPath = join(assetsAbs, pg.image)
        const w = ocrWords(imgPath, pg.number, info.widthPts, info.heightPts, args.dpi)
        words = words.concat(w)
      }
      modeNote = `OCR (tesseract, ${words.length} words)`
    }
  }

  const lines = groupLines(words)
  const fields = inferFields(lines)
  console.error(`[pdf-to-html-form] inferred ${fields.length} field(s)`)

  const html = buildHtml({
    pages, fields,
    assetsDir: assetsRel,
    pdfName: basename(pdfPath),
    modeNote,
    dpi: args.dpi,
  })
  writeFileSync(outHtml, html)
  console.error(`[pdf-to-html-form] wrote ${outHtml}`)

  if (args.emitPdf) {
    const outPdf = resolve(args.emitPdf)
    const size = await emitAcroFormPdf({ pages, fields, assetsAbs, outPath: outPdf })
    console.error(`[pdf-to-html-form] wrote ${outPdf} (${size} bytes, ${fields.length} field widgets)`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exit(1) })
}
