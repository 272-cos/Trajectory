---
name: CAC/ID Card Scanning
description: Future feature - scan military ID card via camera to auto-populate report form fields (rank, name, DOB)
type: project
---

Scan CAC/military ID card to populate Report tab fields and Profile DOB.

**Why:** Manual entry of rank/name/unit is friction. Scanning the ID card would auto-fill in seconds.

**How to apply:**
- PDF417 barcode (back of CAC) ONLY: zxing-js library (~50KB), lazy-loaded, structured data output
- NO Tesseract/OCR - too heavy
- Camera access via navigator.mediaDevices.getUserMedia() - works on HTTPS (GitHub Pages)
- All processing client-side, zero backend
- Scanned PII (name, rank) treated same as current Report tab fields: in-memory only, never persisted to localStorage or codes
- DOB from scan could auto-populate Profile tab D-code
- Gender from scan could auto-populate Profile tab
- Depends on DAF 4446 PDF feature (project_daf4446_pdf.md) being built first
- PII constraint: scanned data must NEVER be stored in localStorage, codes, or URL params
