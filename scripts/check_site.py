#!/usr/bin/env python3
"""Validate local links, anchors, and draw.io files in the static site."""

from __future__ import annotations

import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]
EXTERNAL_SCHEMES = {"http", "https", "mailto", "tel", "data"}
MAX_ASSET_BYTES = 25 * 1024 * 1024


class PageParser(HTMLParser):
    def __init__(self, path: Path) -> None:
        super().__init__()
        self.path = path
        self.ids: set[str] = set()
        self.references: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        element_id = values.get("id")
        if element_id:
            self.ids.add(element_id)

        for attribute in ("href", "src"):
            value = values.get(attribute)
            if value:
                self.references.append((attribute, value))


def resolve_page_reference(page: Path, reference: str) -> tuple[Path, str]:
    parsed = urlparse(reference)
    raw_path = unquote(parsed.path)
    target = (page.parent / raw_path).resolve() if raw_path else page

    if raw_path.endswith("/"):
        target /= "index.html"
    elif target.is_dir():
        target /= "index.html"

    return target, unquote(parsed.fragment)


def validate_html() -> list[str]:
    errors: list[str] = []
    parsed_pages: dict[Path, PageParser] = {}

    for page in sorted(ROOT.rglob("*.html")):
        parser = PageParser(page)
        parser.feed(page.read_text(encoding="utf-8"))
        parsed_pages[page.resolve()] = parser

    for page, parser in parsed_pages.items():
        for attribute, reference in parser.references:
            parsed = urlparse(reference)
            if parsed.scheme in EXTERNAL_SCHEMES or reference.startswith("//"):
                continue

            target, fragment = resolve_page_reference(page, reference)
            if not target.exists():
                errors.append(
                    f"{page.relative_to(ROOT)}: {attribute}={reference!r} points to a missing file"
                )
                continue

            if fragment and target.suffix.lower() == ".html":
                target_parser = parsed_pages.get(target.resolve())
                if target_parser and fragment not in target_parser.ids:
                    errors.append(
                        f"{page.relative_to(ROOT)}: fragment #{fragment} does not exist in "
                        f"{target.relative_to(ROOT)}"
                    )

    return errors


def validate_drawio() -> list[str]:
    errors: list[str] = []
    for diagram in sorted(ROOT.rglob("*.drawio")):
        try:
            ET.parse(diagram)
        except ET.ParseError as exc:
            errors.append(f"{diagram.relative_to(ROOT)}: invalid draw.io XML: {exc}")
    return errors


def validate_asset_sizes() -> list[str]:
    errors: list[str] = []
    for path in ROOT.rglob("*"):
        if ".git" in path.parts or not path.is_file():
            continue
        if path.stat().st_size > MAX_ASSET_BYTES:
            errors.append(
                f"{path.relative_to(ROOT)} is larger than {MAX_ASSET_BYTES // 1024 // 1024} MB"
            )
    return errors


def main() -> int:
    errors = validate_html() + validate_drawio() + validate_asset_sizes()
    if errors:
        print("Site validation failed:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    html_count = len(list(ROOT.rglob("*.html")))
    drawio_count = len(list(ROOT.rglob("*.drawio")))
    print(f"Site validation passed: {html_count} HTML pages, {drawio_count} draw.io source.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
