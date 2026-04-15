---
name: DAF Form 4446 PDF Generation
description: Future feature - generate PDF mirroring DAF Form 4446 scorecard with digital signatures, replacing current text/print report
type: project
---

Report tab needs to generate a PDF that mirrors DAF Form 4446 (Physical Fitness Assessment Scorecard, Feb 2025 version) instead of the current plain text/print HTML approach.

**Why:** Current print-based report doesn't work on iPhone (no Save as PDF in iOS print dialog). The 4446 is the standard form every PTL/FAC/supervisor recognizes. Data maps 1:1 to the app's scoring model.

**How to apply:**
- jsPDF lazy-loaded, generates PDF mirroring 4446 layout (Part I member info, Part II component scores, Part III signatures)
- Canvas signature pad (finger-draw on phone) for member + witness/administrator signatures
- Web Share API to email/AirDrop the signed PDF from iPhone
- Watermark: "SELF-CHECK - NOT AN OFFICIAL DAF FORM 4446"
- Reference PDF: https://static.e-publishing.af.mil/production/1/af_a1/form/daf4446/daf4446.pdf
- Fetch the actual 4446 PDF to match layout precisely before building
- signature_pad library (~5KB) for canvas draw
- Two-device flow: Airman signs on phone, shares PDF, supervisor can print and wet-sign or open on their device
