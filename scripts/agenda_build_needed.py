#!/usr/bin/env python3
"""Décide si le rebuild quotidien (cron) du site doit avoir lieu.

Le site n'a besoin d'être reconstruit par le cron que lorsqu'un événement de
``data/agenda.yaml`` a eu lieu la veille : ce jour-là, l'événement bascule du
futur vers le passé (listes « à venir » de la page d'accueil, tri de l'agenda,
etc.), ce qui modifie le rendu. Les autres jours, la sortie du cron serait
identique à celle de la veille et le déploiement est superflu.

Un événement « a eu lieu la veille » lorsque la date de la veille (UTC, le cron
tournant en UTC) tombe sur sa date (événement d'un jour) ou dans son intervalle
``début/fin`` (événement de plusieurs jours).

Sortie :
  - imprime une explication lisible sur la sortie standard ;
  - écrit ``should_build=true|false`` dans ``$GITHUB_OUTPUT`` lorsque la
    variable est définie (contexte GitHub Actions) ;
  - code de sortie 0 si un build est requis, 1 sinon.

Principe de prudence : en cas de doute (fichier illisible, date non reconnue),
le build est demandé afin de ne jamais rater un déploiement.

Usage :
    python scripts/agenda_build_needed.py            # décision du jour
    python scripts/agenda_build_needed.py 2026-07-14 # décision pour une veille donnée
"""

from __future__ import annotations

import os
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
AGENDA_YAML = REPO_ROOT / "data" / "agenda.yaml"


def _parse_day(token: str) -> date | None:
    """Extrait la composante date (AAAA-MM-JJ) d'un jeton de date d'agenda.

    Gère les formats « AAAA-MM-JJ » et « AAAA-MM-JJTHH:MM:SS » en ne retenant
    que les dix premiers caractères. Retourne ``None`` si le jeton n'est pas une
    date reconnue.
    """
    token = str(token).strip()[:10]
    try:
        return datetime.strptime(token, "%Y-%m-%d").date()
    except ValueError:
        return None


def _event_span(date_value: str) -> tuple[date, date] | None:
    """Retourne l'intervalle (début, fin) couvert par le champ ``date``.

    Un événement d'un seul jour a un début égal à sa fin. Les intervalles
    « début/fin » sont scindés sur « / ». Retourne ``None`` si aucune borne
    n'est exploitable.
    """
    parts = str(date_value).split("/")
    start = _parse_day(parts[0])
    end = _parse_day(parts[1]) if len(parts) > 1 else start
    if start is None and end is None:
        return None
    # Si une seule borne est lisible, on la réutilise pour l'autre.
    start = start or end
    end = end or start
    if start > end:
        start, end = end, start
    return start, end


def _reference_yesterday(argv: list[str]) -> date:
    """Date de « la veille » : argument optionnel AAAA-MM-JJ, sinon hier (UTC)."""
    if argv:
        parsed = _parse_day(argv[0])
        if parsed is not None:
            return parsed
    return datetime.now(timezone.utc).date() - timedelta(days=1)


def _write_output(should_build: bool) -> None:
    """Écrit la décision dans $GITHUB_OUTPUT lorsque le contexte le fournit."""
    output_path = os.environ.get("GITHUB_OUTPUT")
    if output_path:
        with open(output_path, "a", encoding="utf-8") as fh:
            fh.write(f"should_build={'true' if should_build else 'false'}\n")


def main(argv: list[str]) -> int:
    yesterday = _reference_yesterday(argv)

    try:
        data = yaml.safe_load(AGENDA_YAML.read_text(encoding="utf-8")) or {}
        events = data.get("events", []) or []
    except (OSError, yaml.YAMLError) as exc:
        print(f"⚠️  Lecture de {AGENDA_YAML.name} impossible ({exc}).")
        print("   Par prudence, le build est demandé.")
        _write_output(True)
        return 0

    matching: list[str] = []
    for event in events:
        if not isinstance(event, dict) or not event.get("date"):
            continue
        span = _event_span(event["date"])
        if span and span[0] <= yesterday <= span[1]:
            matching.append(event.get("title", "?"))

    should_build = bool(matching)
    if should_build:
        print(f"✅ {len(matching)} événement(s) le {yesterday} (la veille) — build requis :")
        for title in matching:
            print(f"   • {title}")
    else:
        print(f"⏭️  Aucun événement le {yesterday} (la veille) — build superflu, cron ignoré.")

    _write_output(should_build)
    return 0 if should_build else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
