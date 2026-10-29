#!/usr/bin/env python3
"""Hook Kiro `UserPromptSubmit` : détecte une demande d'ajout d'évènement à l'agenda.

Transposition locale du workflow GitHub `.github/workflows/agent-agenda.md`.
Le script lit sur l'entrée standard le JSON transmis par Kiro, en extrait le
texte du prompt et, s'il reconnaît une demande d'ajout d'évènement à l'agenda,
écrit sur la sortie standard une consigne qui renvoie l'agent vers la
procédure `.kiro/steering/ajout-evenement-agenda.md`. Dans tous les autres cas
il n'écrit rien. Il sort toujours avec le code 0 : il ne bloque jamais le prompt.

Test manuel :
    echo '{"prompt": "Ajoute cet évènement à l agenda : ..."}' \
        | python3 scripts/hooks/ajout_evenement_agenda.py
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata

PROMPT_KEYS = ("prompt", "user_prompt", "userPrompt", "message", "text", "input")

VERB = r"(ajout|ajoute|ajouter|nouvel|nouveau|nouvelle|integr|inser|inscri|add|new)\w*"
EVENT = r"(evenement|evenements|event|events)"
AGENDA = r"agenda"

PATTERNS = [
    # « ajoute un évènement … à l'agenda »
    re.compile(rf"\b{VERB}\b.{{0,80}}\b{EVENT}\b.{{0,80}}\b{AGENDA}\b"),
    # « ajoute à l'agenda l'évènement … »
    re.compile(rf"\b{VERB}\b.{{0,80}}\b{AGENDA}\b.{{0,80}}\b{EVENT}\b"),
    # « traite l'issue agenda #123 », « issue 123 (agenda) », « agenda : issue #123 »
    re.compile(rf"\b{AGENDA}\b.{{0,40}}\bissue\s*#?\d+"),
    re.compile(rf"\bissue\b.{{0,40}}#?\d+.{{0,40}}\b{AGENDA}\b"),
    re.compile(rf"\bissue\s+{AGENDA}\s*#?\d+"),
    # Mot-clé explicite
    re.compile(r"\bajout-agenda\b"),
]

# Demandes qui parlent de l'outillage lui-même, pas d'un évènement à ajouter.
EXCLUDE = re.compile(r"\b(hook|hooks|steering|workflow)\b")

INSTRUCTION = """\
[Hook ajout-evenement-agenda] Demande d'ajout d'évènement à l'agenda détectée.
Avant toute action, lis intégralement `.kiro/steering/ajout-evenement-agenda.md`
et applique sa procédure (transposition locale de `.github/workflows/agent-agenda.md`) :
source (issue GitHub `agenda` via `gh issue view` ou informations du prompt),
validation stricte avec les types de `data/metadata/agenda.yaml`, correction du
français, géocodage Nominatim, contrôle des doublons, insertion chronologique
dans `data/agenda.yaml` avec `update` à la date du jour, vérification du YAML.
Le seul fichier modifiable est `data/agenda.yaml`. Ne commite pas.
Si la demande ne concerne en fait pas l'ajout d'un évènement, ignore cette consigne."""


def collect_strings(value: object) -> list[str]:
    """Rassemble récursivement toutes les chaînes d'une structure JSON."""
    if isinstance(value, str):
        return [value]
    if isinstance(value, dict):
        return [s for v in value.values() for s in collect_strings(v)]
    if isinstance(value, list):
        return [s for v in value for s in collect_strings(v)]
    return []


def extract_prompt(raw: str) -> str:
    """Retourne le texte du prompt, quel que soit le schéma du JSON reçu."""
    try:
        payload = json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        return raw
    if isinstance(payload, dict):
        for key in PROMPT_KEYS:
            if isinstance(payload.get(key), str):
                return payload[key]
    return "\n".join(collect_strings(payload))


def normalize(text: str) -> str:
    """Minuscules, sans accents, apostrophes et espaces uniformisés."""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.lower().replace("’", "'")
    return re.sub(r"\s+", " ", text)


def is_agenda_request(prompt: str) -> bool:
    text = normalize(prompt)
    if EXCLUDE.search(text):
        return False
    return any(p.search(text) for p in PATTERNS)


def main() -> int:
    try:
        raw = sys.stdin.read()
        if is_agenda_request(extract_prompt(raw)):
            print(INSTRUCTION)
    except Exception:  # noqa: BLE001 — un hook ne doit jamais bloquer le prompt
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
