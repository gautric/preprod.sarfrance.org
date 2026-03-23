#!/usr/bin/env python3
"""
Query Google Books API to fill in missing ISBN and couverture (cover image)
for ouvrages in data/bibliotheque.yaml.

Preserves the original YAML formatting by inserting lines in-place.
"""

import yaml
import urllib.request
import urllib.parse
import json
import time
import sys
import re

API_URL = "https://www.googleapis.com/books/v1/volumes"
YAML_FILE = "data/bibliotheque.yaml"


def search_google_books(auteur, titre, editeur=None):
    """Search Google Books and return (isbn, cover_url) or (None, None)."""
    author_parts = auteur.strip().split()
    author_query = author_parts[0] if author_parts else ""
    skip_author = auteur.lower().strip() in ("collectif", "x", "", "anonyme")

    q_parts = []
    if titre:
        clean_title = titre.replace("(l')", "").replace("(la)", "").replace("(les)", "")
        # Truncate very long titles for better API matching
        if len(clean_title) > 80:
            clean_title = clean_title[:80]
        q_parts.append(clean_title)
    if not skip_author and author_query:
        q_parts.append(f'inauthor:{author_query}')

    if not q_parts:
        return None, None

    query = " ".join(q_parts)
    params = urllib.parse.urlencode({
        "q": query,
        "maxResults": 5,
        "printType": "books",
    })

    url = f"{API_URL}?{params}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  API error: {e}", file=sys.stderr)
        return None, None

    if data.get("totalItems", 0) == 0 or "items" not in data:
        return None, None

    for item in data["items"]:
        vol = item.get("volumeInfo", {})
        isbn = None
        cover = None

        for ident in vol.get("industryIdentifiers", []):
            if ident["type"] == "ISBN_13":
                isbn = ident["identifier"]
                break
            elif ident["type"] == "ISBN_10":
                isbn = ident["identifier"]

        images = vol.get("imageLinks", {})
        cover = images.get("thumbnail") or images.get("smallThumbnail")

        if isbn or cover:
            return isbn, cover

    return None, None


def find_ouvrage_blocks(lines):
    """
    Parse the YAML file line by line and find each ouvrage block.
    Returns list of dicts: {start_line, end_line, fields}
    where fields is a dict of field_name -> line_index.
    """
    blocks = []
    in_ouvrages = False
    current_block = None

    for i, line in enumerate(lines):
        # Detect start of ouvrages list
        if line.strip() == "ouvrages:":
            in_ouvrages = True
            continue

        if not in_ouvrages:
            continue

        # New list item
        if re.match(r'^- \w', line):
            if current_block is not None:
                current_block["end_line"] = i - 1
                blocks.append(current_block)
            current_block = {"start_line": i, "end_line": None, "fields": {}}
            # Parse field on same line as dash
            m = re.match(r'^- (\w+):\s*(.*)', line)
            if m:
                current_block["fields"][m.group(1)] = i

        elif current_block is not None and re.match(r'^  \w', line):
            # Continuation field
            m = re.match(r'^  (\w+):\s*(.*)', line)
            if m:
                current_block["fields"][m.group(1)] = i

        # Skip comment lines
        elif line.strip().startswith('#'):
            continue

        # If we hit a non-indented, non-empty line that's not a list item, end ouvrages
        elif current_block is not None and line.strip() and not line.startswith(' ') and not line.startswith('-'):
            current_block["end_line"] = i - 1
            blocks.append(current_block)
            current_block = None
            in_ouvrages = False

    # Last block
    if current_block is not None:
        current_block["end_line"] = len(lines) - 1
        blocks.append(current_block)

    return blocks


def main():
    with open(YAML_FILE, "r", encoding="utf-8") as f:
        raw = f.read()

    # Parse YAML to get structured data
    data = yaml.safe_load(raw)
    ouvrages = data["ouvrages"]

    # Also read as lines for in-place editing
    lines = raw.split("\n")

    # Find all ouvrage blocks in the file
    blocks = find_ouvrage_blocks(lines)

    if len(blocks) != len(ouvrages):
        print(f"WARNING: block count ({len(blocks)}) != ouvrage count ({len(ouvrages)})")
        print("Aborting to avoid corruption.")
        sys.exit(1)

    print(f"Found {len(blocks)} ouvrages, {len(ouvrages)} in YAML")

    # Count what needs updating
    needs_update = []
    for i, o in enumerate(ouvrages):
        needs_isbn = not o.get("isbn")
        needs_cover = not o.get("couverture")
        if needs_isbn or needs_cover:
            needs_update.append((i, needs_isbn, needs_cover))

    print(f"{len(needs_update)} ouvrages need ISBN and/or couverture lookup")

    # Collect insertions: list of (after_line, text_to_insert)
    insertions = []
    updated_isbn = 0
    updated_cover = 0
    processed = 0

    for idx, (i, needs_isbn, needs_cover) in enumerate(needs_update):
        o = ouvrages[i]
        block = blocks[i]

        auteur = o.get("auteur", "")
        titre = o.get("titre", "")
        editeur = o.get("editeur", "")

        if not titre or len(titre) < 3:
            continue

        processed += 1
        print(f"[{processed}/{len(needs_update)}] {auteur} — {titre[:55]}...", end=" ", flush=True)

        isbn, cover = search_google_books(auteur, titre, editeur)

        status = []

        if needs_isbn and isbn:
            # Insert isbn line after the last field in the block
            insert_after = block["end_line"]
            insertions.append((insert_after, f"  isbn: '{isbn}'"))
            updated_isbn += 1
            status.append(f"ISBN={isbn}")

        if needs_cover and cover:
            insert_after = block["end_line"]
            insertions.append((insert_after, f"  couverture: {cover}"))
            updated_cover += 1
            status.append("cover=✓")

        if not status:
            status.append("—")
        print(" | ".join(status))

        # Rate limit
        time.sleep(0.4)

    # Apply insertions in reverse order (so line numbers stay valid)
    insertions.sort(key=lambda x: x[0], reverse=True)
    for after_line, text in insertions:
        lines.insert(after_line + 1, text)

    # Write back
    with open(YAML_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"\nTerminé! ISBN ajoutés: {updated_isbn}, couvertures ajoutées: {updated_cover}")
    print(f"Traités: {processed}/{len(needs_update)}")


if __name__ == "__main__":
    main()
