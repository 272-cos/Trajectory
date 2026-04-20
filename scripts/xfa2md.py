#!/usr/bin/env python3
"""Extract XFA form structure (labels + fields) from a PDF to Markdown.

Works for Adobe LiveCycle / XFA PDFs where pdftotext only sees the
"Please wait..." fallback page. Reads the /XFA template stream, walks
<draw> (static text) and <field> (form inputs), and emits them in
visual reading order (page, y, x).

Requires: qpdf, python3 stdlib only.
Usage:    xfa2md.py <input.pdf> [output.md]
"""
from __future__ import annotations

import os
import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
import zlib
from dataclasses import dataclass, field
from pathlib import Path

XFA_NS = "{http://www.xfa.org/schema/xfa-template/3.3/}"


@dataclass
class Item:
    kind: str  # "label" | "field"
    page: int
    y: float
    x: float
    text: str = ""
    name: str = ""
    ftype: str = ""
    options: list[str] = field(default_factory=list)


def unit_to_mm(v: str) -> float:
    if not v:
        return 0.0
    m = re.match(r"([-\d.]+)\s*([a-zA-Z]*)", v.strip())
    if not m:
        return 0.0
    n, u = float(m.group(1)), (m.group(2) or "mm").lower()
    return {"mm": n, "cm": n * 10, "in": n * 25.4, "pt": n * 25.4 / 72}.get(u, n)


def decrypt_and_qdf(src: Path, workdir: Path) -> Path:
    dec = workdir / "dec.pdf"
    qdf = workdir / "qdf.pdf"
    subprocess.run(
        ["qpdf", "--decrypt", str(src), str(dec)],
        check=True, capture_output=True,
    )
    subprocess.run(
        ["qpdf", "--qdf", "--object-streams=disable", str(dec), str(qdf)],
        check=True, capture_output=True,
    )
    return qdf


def extract_template(qdf: Path) -> bytes:
    data = qdf.read_bytes()
    m = re.search(rb"/XFA\s*\[(.*?)\]", data, re.DOTALL)
    if not m:
        raise SystemExit("no /XFA array found — not an XFA PDF")
    pairs = re.findall(r"\(([^)]+)\)\s+(\d+)\s+\d+\s+R", m.group(1).decode("latin-1"))
    parts = dict(pairs)
    tnum = parts.get("template")
    if not tnum:
        raise SystemExit("no template part in /XFA array")
    raw = subprocess.run(
        ["qpdf", f"--show-object={tnum}", "--raw-stream-data", str(qdf)],
        check=True, capture_output=True,
    ).stdout
    try:
        return zlib.decompress(raw)
    except zlib.error:
        return raw


def text_of(elem: ET.Element | None) -> str:
    if elem is None:
        return ""
    parts = [elem.text or ""]
    for child in elem:
        parts.append(text_of(child))
        if child.tail:
            parts.append(child.tail)
    return "".join(parts).strip()


def field_type(fld: ET.Element) -> tuple[str, list[str]]:
    ui = fld.find(f"{XFA_NS}ui")
    if ui is None:
        return "field", []
    for child in ui:
        tag = child.tag.replace(XFA_NS, "")
        if tag == "checkButton":
            return "checkbox", []
        if tag == "choiceList":
            items = fld.find(f"{XFA_NS}items")
            opts = [text_of(t) for t in items.findall(f"{XFA_NS}text")] if items is not None else []
            return "dropdown", opts
        if tag == "dateTimeEdit":
            return "date", []
        if tag == "signature":
            return "signature", []
        if tag == "numericEdit":
            return "number", []
        if tag == "textEdit":
            return "text", []
    return "field", []


def walk(elem: ET.Element, page: int, ox: float, oy: float, out: list[Item]) -> None:
    tag = elem.tag.replace(XFA_NS, "")
    x = ox + unit_to_mm(elem.attrib.get("x", "0"))
    y = oy + unit_to_mm(elem.attrib.get("y", "0"))

    if tag == "pageArea":
        page = len([i for i in out if False]) + page  # unchanged; pages tracked externally
    if tag == "draw":
        txt_el = elem.find(f"{XFA_NS}value/{XFA_NS}text")
        exdata = elem.find(f"{XFA_NS}value/{XFA_NS}exData")
        txt = text_of(txt_el) or text_of(exdata)
        if txt:
            out.append(Item("label", page, y, x, text=txt))
    elif tag == "field":
        caption = text_of(elem.find(f"{XFA_NS}caption/{XFA_NS}value/{XFA_NS}text"))
        name = elem.attrib.get("name", "")
        ftype, opts = field_type(elem)
        out.append(Item("field", page, y, x, text=caption, name=name, ftype=ftype, options=opts))
    for child in elem:
        walk(child, page, x, y, out)


def build_items(template_xml: bytes) -> list[Item]:
    root = ET.fromstring(template_xml)
    items: list[Item] = []
    # Iterate pageAreas separately to track page numbers
    page = 0
    for subform in root.iter(f"{XFA_NS}subform"):
        for pageset in subform.findall(f"{XFA_NS}pageSet"):
            for parea in pageset.findall(f"{XFA_NS}pageArea"):
                page += 1
                walk(parea, page, 0.0, 0.0, items)
        # Walk non-pageSet children on the last-seen page (most XFA forms
        # put the field tree inside the top subform, siblings of pageSet)
        for child in subform:
            if child.tag.endswith("pageSet"):
                continue
            walk(child, max(page, 1), 0.0, 0.0, items)
    # Stable sort: page, then top-to-bottom, then left-to-right
    items.sort(key=lambda i: (i.page, round(i.y, 1), round(i.x, 1)))
    return items


def render_md(pdf_name: str, items: list[Item]) -> str:
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = [
        f"# {Path(pdf_name).stem}",
        "",
        f"> Source: `{pdf_name}`  ",
        f"> Generated: {now}  ",
        "> Tool: `xfa2md.py` (XFA template extraction via qpdf)",
        "",
        "---",
        "",
    ]
    current_page = 0
    for it in items:
        if it.page != current_page:
            current_page = it.page
            lines += [f"## Page {current_page}", ""]
        if it.kind == "label":
            for line in it.text.splitlines():
                s = line.strip()
                if s:
                    lines.append(s)
            lines.append("")
        else:
            cap = it.text or it.name or "(unnamed)"
            suffix = f" _({it.ftype})_" if it.ftype else ""
            if it.ftype == "checkbox":
                lines.append(f"- [ ] **{cap}**{suffix}")
            elif it.ftype == "dropdown" and it.options:
                lines.append(f"- **{cap}**{suffix}: {', '.join(it.options)}")
            else:
                lines.append(f"- **{cap}**{suffix}  `[{it.name}]`")
    return "\n".join(lines) + "\n"


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(f"usage: {argv[0]} <input.pdf> [output.md]", file=sys.stderr)
        return 1
    src = Path(argv[1]).resolve()
    if not src.is_file():
        print(f"error: not found: {src}", file=sys.stderr)
        return 1
    out = Path(argv[2]) if len(argv) > 2 else src.with_suffix(".md")

    with tempfile.TemporaryDirectory() as td:
        qdf = decrypt_and_qdf(src, Path(td))
        template = extract_template(qdf)
    items = build_items(template)
    out.write_text(render_md(src.name, items))
    label_n = sum(1 for i in items if i.kind == "label")
    field_n = sum(1 for i in items if i.kind == "field")
    pages = max((i.page for i in items), default=0)
    print(f"wrote: {out} ({pages} pages, {label_n} labels, {field_n} fields)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
