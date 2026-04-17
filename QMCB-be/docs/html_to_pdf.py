"""Render a local HTML file to PDF with Playwright (runs JS, e.g. Mermaid)."""

from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "html",
        nargs="?",
        type=Path,
        default=Path(__file__).with_name("simulate-request-flow.html"),
        help="HTML file (default: simulate-request-flow.html next to this script)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="Output PDF path (default: same name as HTML with .pdf)",
    )
    args = parser.parse_args()

    html_path = args.html.resolve()
    if not html_path.is_file():
        print(f"Not found: {html_path}", file=sys.stderr)
        return 1

    out_pdf = args.output or html_path.with_suffix(".pdf")

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Install Playwright: pip install playwright && playwright install chromium", file=sys.stderr)
        return 1

    pdf_margin = {"top": "12mm", "right": "12mm", "bottom": "12mm", "left": "12mm"}

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(html_path.as_uri(), wait_until="networkidle")
        # Wait for Mermaid to render SVG (avoids empty or clipped diagrams)
        try:
            page.wait_for_selector(".mermaid svg", timeout=15_000)
        except Exception:
            pass
        page.wait_for_timeout(500)
        pdf_bytes = page.pdf(
            format="A4",
            print_background=True,
            margin=pdf_margin,
            prefer_css_page_size=True,
        )
        browser.close()

    written = _write_pdf_bytes(out_pdf, pdf_bytes)
    print("Wrote:", written)
    return 0


def _write_pdf_bytes(target: Path, data: bytes) -> Path:
    """Write PDF bytes; if the file is open elsewhere (Windows lock), use a new name."""

    try:
        target.write_bytes(data)
        return target
    except PermissionError:
        fallback = target.with_name(
            f"{target.stem}-{datetime.now():%Y%m%d-%H%M%S}.pdf"
        )
        fallback.write_bytes(data)
        print(
            f"Note: could not overwrite {target} (close it in your PDF viewer/editor). "
            f"Saved as:",
            file=sys.stderr,
        )
        return fallback


if __name__ == "__main__":
    raise SystemExit(main())
