#!/usr/bin/env python3
"""Calcule et injecte l'attribut technique `update` dans data/agenda.yaml.

Le script rejoue l'intégralité de l'historique git du fichier d'agenda
(`data/agenda.json` puis `data/agenda.yaml` après migration) et, pour chaque
événement, détermine la date du dernier commit ayant modifié son contenu
substantiel (ajout ou modification d'un champ métier).

Les refactorisations de schéma (renommage de champs, passage au format ISO
8601, migration JSON → YAML) sont neutralisées : les événements sont comparés
sur une forme canonique, de sorte qu'un simple changement de structure ne soit
pas comptabilisé comme une mise à jour.

Usage :
    python scripts/agenda_update_dates.py            # rapport seul
    python scripts/agenda_update_dates.py --write    # écrit data/agenda.yaml
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
AGENDA_YAML = REPO_ROOT / "data" / "agenda.yaml"

# Chemins historiques successifs du fichier d'agenda.
HISTORICAL_PATHS = ("data/agenda.json", "data/agenda.yaml")

# Champs métier retenus pour la comparaison d'un événement d'un commit à l'autre.
CANONICAL_FIELDS = ("date", "title", "type", "description", "location", "link", "lat", "lon")


# ---------------------------------------------------------------------------
# Accès à git
# ---------------------------------------------------------------------------

def git(*args: str) -> str:
    """Exécute une commande git dans le dépôt et renvoie sa sortie."""
    result = subprocess.run(
        ("git", *args),
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


def commit_history() -> list[tuple[str, str, str, str]]:
    """Liste chronologique des commits touchant l'agenda.

    Renvoie des tuples (sha, date ISO courte, chemin du fichier, sujet).
    """
    seen: dict[str, tuple[str, str, str, str]] = {}
    for path in HISTORICAL_PATHS:
        raw = git(
            "log", "--reverse", "--format=%H\t%cI\t%s", "--", path
        )
        for line in raw.splitlines():
            if not line.strip():
                continue
            sha, iso_date, subject = line.split("\t", 2)
            # Un même commit peut toucher les deux chemins (commit de migration) :
            # le chemin le plus récent gagne.
            seen[sha] = (sha, iso_date[:10], path, subject)

    ordered = git("log", "--reverse", "--format=%H").splitlines()
    return [seen[sha] for sha in ordered if sha in seen]


def file_at_commit(sha: str, path: str) -> str | None:
    """Contenu du fichier à un commit donné, ou None s'il n'existe pas."""
    result = subprocess.run(
        ("git", "show", f"{sha}:{path}"),
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return None
    return result.stdout


# ---------------------------------------------------------------------------
# Normalisation des événements
# ---------------------------------------------------------------------------

def normalize_title(title: str) -> str:
    """Forme comparable d'un titre : sans accent, sans ponctuation, en minuscules."""
    decomposed = unicodedata.normalize("NFKD", title or "")
    stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", stripped.lower()).strip()


def canonical_date(event: dict) -> str:
    """Date canonique au format ISO, intervalles inclus (`début/fin`)."""
    start = str(event.get("date") or event.get("dateStart") or "").strip()
    end = str(event.get("dateEnd") or "").strip()

    # Ancien format : heure dans un champ distinct.
    time_start = str(event.get("time") or event.get("heure") or "").strip()
    if time_start and "T" not in start:
        start = f"{start}T{time_start}"

    if end and end not in ("", start):
        return f"{start}/{end}"
    return start


def start_date(canon_date: str) -> str:
    return canon_date.split("/")[0].split("T")[0]


def canonicalize(event: dict) -> dict:
    """Projette un événement de n'importe quelle version du schéma sur la forme canonique."""
    title = event.get("title") or event.get("titre") or ""
    canon = {
        "date": canonical_date(event),
        "title": str(title).strip(),
        "type": str(event.get("type") or "").strip().lower(),
        "description": str(event.get("description") or "").strip(),
        "location": str(event.get("location") or event.get("lieu") or "").strip(),
        "link": str(event.get("link") or event.get("lien") or event.get("url") or "").strip(),
        "lat": normalize_coord(event.get("lat")),
        "lon": normalize_coord(event.get("lon")),
    }
    return canon


def normalize_coord(value) -> float:
    try:
        return round(float(value), 4)
    except (TypeError, ValueError):
        return 0.0


def extract_events(content: str, path: str) -> list[dict]:
    """Extrait la liste canonique des événements d'une révision du fichier."""
    if path.endswith(".json"):
        data = json.loads(content)
    else:
        data = yaml.safe_load(content)

    if not isinstance(data, dict):
        return []

    raw_events: list[dict] = []
    if isinstance(data.get("events"), list):
        raw_events = [e for e in data["events"] if isinstance(e, dict)]
    else:
        # Ancien schéma : un bloc par année, chacun contenant sa liste `events`.
        for key in sorted(data.keys()):
            block = data[key]
            if isinstance(block, dict) and isinstance(block.get("events"), list):
                raw_events.extend(e for e in block["events"] if isinstance(e, dict))

    return [canonicalize(e) for e in raw_events]


# ---------------------------------------------------------------------------
# Appariement d'un commit au suivant
# ---------------------------------------------------------------------------

def find_match(event: dict, previous: list[dict], used: set[int]) -> int | None:
    """Retrouve l'événement correspondant dans la révision précédente.

    Trois passes, du critère le plus strict au plus permissif, afin de suivre un
    événement dont le titre ou la date a été retouché sans le considérer comme
    un nouvel événement.
    """
    title_key = normalize_title(event["title"])
    day = start_date(event["date"])

    # 1. Même titre et même jour de début.
    for i, prev in enumerate(previous):
        if i in used:
            continue
        if normalize_title(prev["canon"]["title"]) == title_key and start_date(prev["canon"]["date"]) == day:
            return i

    # 2. Même titre (la date a été corrigée).
    for i, prev in enumerate(previous):
        if i in used:
            continue
        if normalize_title(prev["canon"]["title"]) == title_key:
            return i

    # 3. Même jour et même type (le titre a été reformulé).
    for i, prev in enumerate(previous):
        if i in used:
            continue
        if start_date(prev["canon"]["date"]) == day and prev["canon"]["type"] == event["type"]:
            return i

    return None


def compute_update_dates(verbose: bool = False) -> dict[tuple[str, str], str]:
    """Rejoue l'historique et renvoie {(date, titre normalisé): date de mise à jour}."""
    state: list[dict] = []

    for sha, date, path, subject in commit_history():
        content = file_at_commit(sha, path)
        if content is None:
            continue
        try:
            events = extract_events(content, path)
        except (yaml.YAMLError, json.JSONDecodeError) as exc:
            print(f"⚠️  {sha[:8]} ignoré (fichier illisible) : {exc}", file=sys.stderr)
            continue
        if not events:
            continue

        used: set[int] = set()
        new_state: list[dict] = []
        added = changed = 0

        for event in events:
            index = find_match(event, state, used)
            if index is None:
                new_state.append({"canon": event, "update": date})
                added += 1
            else:
                used.add(index)
                previous = state[index]
                if previous["canon"] == event:
                    new_state.append({"canon": event, "update": previous["update"]})
                else:
                    new_state.append({"canon": event, "update": date})
                    changed += 1

        state = new_state
        if verbose:
            print(
                f"{date}  {sha[:8]}  {len(events):3d} évts  "
                f"+{added} ~{changed}  {subject[:60]}"
            )

    return {
        (entry["canon"]["date"], normalize_title(entry["canon"]["title"])): entry["update"]
        for entry in state
    }


# ---------------------------------------------------------------------------
# Écriture dans data/agenda.yaml
# ---------------------------------------------------------------------------

EVENT_START = re.compile(r"^  - (?=\w)")
EVENT_FIELD = re.compile(r"^    (\w+):")
UPDATE_FIELD = re.compile(r"^    update:")


def inject_updates(updates: dict[tuple[str, str], str]) -> tuple[str, int, int]:
    """Réécrit data/agenda.yaml en insérant `update` en fin de chaque bloc d'événement.

    L'insertion est faite ligne à ligne pour préserver l'ordre des clés, les
    guillemets et la mise en forme du fichier.
    """
    lines = AGENDA_YAML.read_text(encoding="utf-8").splitlines()
    parsed = yaml.safe_load(AGENDA_YAML.read_text(encoding="utf-8"))
    events = parsed["events"]

    # Repère la première et la dernière ligne de chaque bloc d'événement.
    blocks: list[tuple[int, int]] = []
    start = None
    last_field = None
    for i, line in enumerate(lines):
        if EVENT_START.match(line):
            if start is not None:
                blocks.append((start, last_field))
            start = i
            last_field = i
        elif EVENT_FIELD.match(line) and start is not None:
            last_field = i
    if start is not None:
        blocks.append((start, last_field))

    if len(blocks) != len(events):
        raise SystemExit(
            f"❌ {len(blocks)} blocs détectés pour {len(events)} événements — "
            "mise en forme du fichier inattendue, abandon."
        )

    written = missing = 0
    insertions: dict[int, str] = {}
    replacements: dict[int, str] = {}

    for (block_start, block_end), event in zip(blocks, events):
        key = (str(event["date"]), normalize_title(event.get("title", "")))
        date = updates.get(key)
        if date is None:
            missing += 1
            continue

        existing = next(
            (i for i in range(block_start, block_end + 1) if UPDATE_FIELD.match(lines[i])),
            None,
        )
        if existing is not None:
            replacements[existing] = f'    update: "{date}"'
        else:
            insertions[block_end] = f'    update: "{date}"'
        written += 1

    output: list[str] = []
    for i, line in enumerate(lines):
        output.append(replacements.get(i, line))
        if i in insertions:
            output.append(insertions[i])

    return "\n".join(output) + "\n", written, missing


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="écrit data/agenda.yaml")
    parser.add_argument("--verbose", action="store_true", help="détaille chaque commit rejoué")
    args = parser.parse_args()

    updates = compute_update_dates(verbose=args.verbose)
    print(f"📜 {len(updates)} événements datés depuis l'historique git.")

    content, written, missing = inject_updates(updates)
    print(f"✅ {written} attributs `update` calculés, {missing} événement(s) sans correspondance.")

    if args.write:
        AGENDA_YAML.write_text(content, encoding="utf-8")
        print(f"💾 {AGENDA_YAML.relative_to(REPO_ROOT)} mis à jour.")
    else:
        print("ℹ️  Aucune écriture (ajouter --write).")

    return 0


if __name__ == "__main__":
    sys.exit(main())
