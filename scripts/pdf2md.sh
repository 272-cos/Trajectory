#!/usr/bin/env bash
# pdf2md - convert PDF to Markdown.
#   Static PDFs: pdftotext -layout, page-delimited fenced blocks.
#   XFA (Adobe LiveCycle) PDFs: auto-fallback to xfa2md.py which reads
#   the /XFA template stream and emits labels + fillable fields in
#   visual reading order.
#
# Usage: pdf2md.sh <input.pdf> [output.md]
#        pdf2md.sh --force-xfa <input.pdf> [output.md]
#        pdf2md.sh --force-text <input.pdf> [output.md]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="auto"

while [[ $# -gt 0 && "$1" == --* ]]; do
    case "$1" in
        --force-xfa)  MODE="xfa"; shift ;;
        --force-text) MODE="text"; shift ;;
        -h|--help)
            sed -n '2,11p' "$0"; exit 0 ;;
        *) echo "unknown flag: $1" >&2; exit 2 ;;
    esac
done

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 [--force-xfa|--force-text] <input.pdf> [output.md]" >&2
    exit 1
fi

IN="$1"
OUT="${2:-${IN%.pdf}.md}"

command -v pdftotext >/dev/null || { echo "error: pdftotext not found (install poppler-utils)" >&2; exit 1; }
command -v pdfinfo   >/dev/null || { echo "error: pdfinfo not found (install poppler-utils)" >&2; exit 1; }
[[ -f "$IN" ]] || { echo "error: input not found: $IN" >&2; exit 1; }

detect_xfa() {
    # XFA forms report "Form: XFA" in pdfinfo.
    pdfinfo "$1" 2>/dev/null | awk -F: '/^Form:/ {gsub(/^ +/, "", $2); print $2}' | grep -qx "XFA"
}

render_text() {
    local in="$1" out="$2"
    local title pages
    title="$(basename "${in%.pdf}")"
    pages="$(pdfinfo "$in" 2>/dev/null | awk '/^Pages:/ {print $2}')"
    pages="${pages:-1}"
    {
        printf '# %s\n\n' "$title"
        printf '> Source: `%s`  \n' "$(basename "$in")"
        printf '> Generated: %s  \n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
        printf '> Tool: `pdftotext -layout` (poppler-utils)\n\n'
        printf -- '---\n\n'
        for (( p=1; p<=pages; p++ )); do
            printf '## Page %d\n\n' "$p"
            printf '```text\n'
            pdftotext -layout -f "$p" -l "$p" "$in" - | sed 's/\r$//'
            printf '```\n\n'
        done
    } > "$out"
    echo "wrote: $out ($(wc -l < "$out") lines, ${pages} pages, mode=text)"
}

render_xfa() {
    local in="$1" out="$2"
    command -v qpdf    >/dev/null || { echo "error: qpdf not found (required for XFA mode)" >&2; exit 1; }
    command -v python3 >/dev/null || { echo "error: python3 not found (required for XFA mode)" >&2; exit 1; }
    [[ -x "$SCRIPT_DIR/xfa2md.py" ]] || { echo "error: $SCRIPT_DIR/xfa2md.py missing or not executable" >&2; exit 1; }
    "$SCRIPT_DIR/xfa2md.py" "$in" "$out"
}

case "$MODE" in
    xfa)  render_xfa  "$IN" "$OUT" ;;
    text) render_text "$IN" "$OUT" ;;
    auto)
        if detect_xfa "$IN"; then
            echo "detected: XFA form -> using xfa2md.py"
            render_xfa "$IN" "$OUT"
        else
            render_text "$IN" "$OUT"
        fi
        ;;
esac
