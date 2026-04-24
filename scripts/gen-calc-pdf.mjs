import fs from 'node:fs'
import { generateFormPDF } from '../src/utils/pdf/generateFormPDF.js'

const out = 'screenshots/4446_calc.pdf'
try { fs.unlinkSync(out) } catch { /* file may not exist */ }

const demographics = { sex: 'M', dob: '1990-06-15' }
const decoded = { sex: 'M', dob: '1990-06-15', age: 35, heightInches: 70 }
const scores = {}
const bytes = await generateFormPDF(demographics, decoded, scores)
fs.writeFileSync(out, bytes)
console.log('wrote', out, bytes.length)
