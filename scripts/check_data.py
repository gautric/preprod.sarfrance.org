#!/usr/bin/env python3
"""Vérifications de cohérence des données du site SAR France.

Appelé par `make check` et par `.github/workflows/preview.yml`. Sort avec un code
d'erreur dès qu'au moins une vérification échoue. Les sorties sont lisibles à
l'œil nu et compatibles `$GITHUB_STEP_SUMMARY` (Markdown).

Vérifications exécutées, dans l'ordre :

  1. Schémas JSON pour chaque fichier de `data/` (agenda, books, notices,
     chronologie, lieux-de-memoire FR + EN).
  2. Clés `type`/`tags`/`genre` utilisées ⊆ `data/metadata/<nom>.yaml`.
  3. Clés déclarées dans `data/metadata/<nom>.yaml` ⊆ i18n FR ∩ EN
     (préfixes `agenda_type_`, `notices_tag_`, `chrono_tag_`, `bibli_cat_`,
     `hl_tag_`).
  4. Chaque clé déclarée a une classe CSS correspondante dans `colors.css`
     (préfixes `type-`, `tag-`, `cat-` selon le domaine).
  5. Agenda : ordre chronologique strict et champ `update` toujours en dernier
     dans chaque bloc.
  6. Parité `content/fr/**/*.md` ↔ `content/en/**/*.md` et identité des clés
     d'`i18n/fr.yaml` ↔ `i18n/en.yaml`.
  7. Formulaire `.github/ISSUE_TEMPLATE/add-agenda-event.yml` : les options du
     champ `type` doivent correspondre exactement à `data/metadata/agenda.yaml`.
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any, Iterable

import yaml

try:
    from jsonschema import Draft202012Validator
except ImportError:  # pragma: no cover - dépendance installée via scripts/requirements.txt
    sys.stderr.write(
        "❌ Dépendance manquante : jsonschema. Installez-la via\n"
        "   source .venv/bin/activate && pip install -r scripts/requirements.txt\n"
    )
    sys.exit(2)


ROOT = Path(__file__).resolve().parent.parent
SCHEMAS = Path(__file__).resolve().parent / "schemas"

# Correspondance : domaine → (fichier data, metadata, préfixe i18n, préfixe CSS,
# champ metadata, nom du champ dans la data qui porte la ou les clés).
DOMAINS = {
    "agenda": {
        "data": ROOT / "data/agenda.yaml",
        "metadata": ROOT / "data/metadata/agenda.yaml",
        "i18n_prefix": "agenda_type_",
        "css_prefix": "type-",
        "metadata_field": "types",
    },
    "books": {
        "data": ROOT / "data/books.yaml",
        "metadata": ROOT / "data/metadata/books.yaml",
        "i18n_prefix": "bibli_cat_",
        "css_prefix": "cat-",
        "metadata_field": "categories",
    },
    "notices": {
        "data": ROOT / "data/notices.yaml",
        "metadata": ROOT / "data/metadata/notices.yaml",
        "i18n_prefix": "notices_tag_",
        "css_prefix": "tag-",
        "metadata_field": "tags",
    },
    "chronologie": {
        "data": ROOT / "data/chronologie.yaml",
        "metadata": ROOT / "data/metadata/chronologie.yaml",
        "i18n_prefix": "chrono_tag_",
        "css_prefix": "tag-",
        "metadata_field": "tags",
    },
    "lieux-de-memoire": {
        # Les deux langues partagent la metadata ; la validation du schéma passe
        # sur chaque fichier langue séparément.
        "data": [ROOT / "data/fr/lieux-de-memoire.yaml", ROOT / "data/en/lieux-de-memoire.yaml"],
        "metadata": ROOT / "data/metadata/lieux-de-memoire.yaml",
        "i18n_prefix": "hl_tag_",
        "css_prefix": "tag-",
        "metadata_field": "tags",
    },
}

I18N_FR = ROOT / "i18n/fr.yaml"
I18N_EN = ROOT / "i18n/en.yaml"
COLORS_CSS = ROOT / "themes/sarfrance/assets/css/colors.css"
CONTENT_FR = ROOT / "content/fr"
CONTENT_EN = ROOT / "content/en"
ISSUE_FORM_AGENDA = ROOT / ".github/ISSUE_TEMPLATE/add-agenda-event.yml"

# Résultats accumulés, pour un rapport final unique.
errors: list[str] = []
warnings: list[str] = []


# ---------------------------------------------------------------------------
# Utilitaires
# ---------------------------------------------------------------------------

def _load_yaml(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def _load_schema(name: str) -> dict:
    with (SCHEMAS / f"{name}.schema.json").open("r", encoding="utf-8") as fh:
        return json.load(fh)


def _urlize(value: str) -> str:
    """Imite le filtre `urlize` de Hugo avec `removePathAccents = true`.

    Les clés sont converties en minuscules sans accents, et les séparateurs non
    alphanumériques deviennent des tirets. C'est la règle appliquée par
    `colors.css` pour construire les classes `tag-{key}` / `type-{key}` /
    `cat-{key}`.
    """
    normalized = unicodedata.normalize("NFD", value)
    stripped = "".join(c for c in normalized if unicodedata.category(c) != "Mn")
    stripped = stripped.lower()
    stripped = re.sub(r"[^a-z0-9]+", "-", stripped).strip("-")
    return stripped


def _walk_tags(obj: Any, field_names: Iterable[str], seen: set[str]) -> None:
    """Parcourt récursivement une structure YAML pour collecter les clés sous
    les champs désignés (`tags`, `tag`, `genre`, `type`…)."""
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key in field_names:
                if isinstance(value, list):
                    for item in value:
                        if isinstance(item, str):
                            seen.add(item)
                elif isinstance(value, str) and value:
                    seen.add(value)
            else:
                _walk_tags(value, field_names, seen)
    elif isinstance(obj, list):
        for item in obj:
            _walk_tags(item, field_names, seen)


def _i18n_ids(path: Path) -> set[str]:
    data = _load_yaml(path) or []
    return {entry.get("id") for entry in data if isinstance(entry, dict) and entry.get("id")}


# ---------------------------------------------------------------------------
# 1. Validation par schéma JSON
# ---------------------------------------------------------------------------

def check_schemas() -> None:
    for name, cfg in DOMAINS.items():
        try:
            schema = _load_schema(name)
        except FileNotFoundError:
            warnings.append(f"[{name}] schéma JSON manquant — contrôle sauté")
            continue
        validator = Draft202012Validator(schema)
        data_paths = cfg["data"] if isinstance(cfg["data"], list) else [cfg["data"]]
        for data_path in data_paths:
            data = _load_yaml(data_path)
            found = sorted(
                validator.iter_errors(data),
                key=lambda e: list(e.absolute_path),
            )
            if not found:
                continue
            for err in found[:20]:  # évite les milliers de lignes sur une data corrompue
                location = "/".join(str(p) for p in err.absolute_path) or "<racine>"
                errors.append(
                    f"[schema/{data_path.relative_to(ROOT)}] {location} : {err.message}"
                )
            if len(found) > 20:
                errors.append(
                    f"[schema/{data_path.relative_to(ROOT)}] (+ {len(found) - 20} erreurs supplémentaires non listées)"
                )


# ---------------------------------------------------------------------------
# 2. Clés utilisées ⊆ metadata
# 3. Metadata ⊆ i18n FR ∩ EN
# 4. Metadata → CSS
# ---------------------------------------------------------------------------

def _collect_used_keys(name: str, cfg: dict) -> set[str]:
    used: set[str] = set()
    data_paths = cfg["data"] if isinstance(cfg["data"], list) else [cfg["data"]]
    for data_path in data_paths:
        data = _load_yaml(data_path)
        if name == "agenda":
            for event in (data or {}).get("events", []):
                if isinstance(event, dict) and event.get("type"):
                    used.add(event["type"])
        elif name == "books":
            _walk_tags(data, {"genre"}, used)
        else:
            _walk_tags(data, {"tags", "tag"}, used)
    return used


def check_metadata_consistency() -> None:
    fr_ids = _i18n_ids(I18N_FR)
    en_ids = _i18n_ids(I18N_EN)
    css_classes: set[str] = set()
    if COLORS_CSS.exists():
        css_text = COLORS_CSS.read_text(encoding="utf-8")
        css_classes = set(re.findall(r"\.((?:tag|type|cat)-[a-z0-9-]+)", css_text))

    for name, cfg in DOMAINS.items():
        metadata = _load_yaml(cfg["metadata"]) or {}
        declared = set(metadata.get(cfg["metadata_field"]) or [])
        used = _collect_used_keys(name, cfg)

        # 2. Toute clé utilisée doit être déclarée.
        extra = used - declared
        if extra:
            errors.append(
                f"[{name}] clés utilisées absentes de `data/metadata/{name}.yaml` : {sorted(extra)}"
            )

        # Avertissement : clé déclarée inutilisée.
        unused = declared - used
        if unused:
            warnings.append(
                f"[{name}] clés déclarées sans usage courant : {sorted(unused)}"
            )

        # 3. Toute clé déclarée doit avoir un libellé FR et EN.
        prefix = cfg["i18n_prefix"]
        missing_fr = sorted(k for k in declared if f"{prefix}{k}" not in fr_ids)
        missing_en = sorted(k for k in declared if f"{prefix}{k}" not in en_ids)
        if missing_fr:
            errors.append(f"[{name}] i18n FR manquant pour : {missing_fr}")
        if missing_en:
            errors.append(f"[{name}] i18n EN manquant pour : {missing_en}")

        # 4. Toute clé déclarée doit avoir une classe CSS.
        css_prefix = cfg["css_prefix"]
        missing_css = sorted(
            k for k in declared if f"{css_prefix}{_urlize(k)}" not in css_classes
        )
        if missing_css:
            errors.append(
                f"[{name}] classes CSS `{css_prefix}<key>` manquantes dans "
                f"`themes/sarfrance/assets/css/colors.css` pour : {missing_css}"
            )


# ---------------------------------------------------------------------------
# 5. Ordre de l'agenda + place de `update`
# ---------------------------------------------------------------------------

def _first_date_token(date_value: str) -> str:
    """Retourne la première date d'un champ `date` (10 caractères AAAA-MM-JJ)."""
    return str(date_value).split("/")[0][:10]


def check_agenda_order() -> None:
    data = _load_yaml(DOMAINS["agenda"]["data"])
    events = (data or {}).get("events", [])
    previous_date: str | None = None
    previous_title: str | None = None
    for event in events:
        if not isinstance(event, dict):
            continue
        date_value = event.get("date")
        if not date_value:
            continue
        current = _first_date_token(date_value)
        if previous_date and current < previous_date:
            errors.append(
                f"[agenda] ordre chronologique rompu : « {event.get('title', '?')} » "
                f"({current}) placé après « {previous_title} » ({previous_date})"
            )
        previous_date = current
        previous_title = event.get("title", "?")

        # `update` doit être le dernier champ ; en Python ≥ 3.7 l'ordre
        # d'insertion du dict suit l'ordre YAML.
        keys = list(event.keys())
        if "update" in keys and keys[-1] != "update":
            errors.append(
                f"[agenda] le champ `update` n'est pas en dernier dans "
                f"« {event.get('title', '?')} » (ordre actuel : {keys})"
            )


# ---------------------------------------------------------------------------
# 6. Parité FR/EN
# ---------------------------------------------------------------------------

def check_parity() -> None:
    if CONTENT_FR.is_dir() and CONTENT_EN.is_dir():
        fr_files = {p.relative_to(CONTENT_FR).as_posix() for p in CONTENT_FR.rglob("*.md")}
        en_files = {p.relative_to(CONTENT_EN).as_posix() for p in CONTENT_EN.rglob("*.md")}
        only_fr = sorted(fr_files - en_files)
        only_en = sorted(en_files - fr_files)
        if only_fr:
            errors.append(f"[content] fichiers FR sans équivalent EN : {only_fr}")
        if only_en:
            errors.append(f"[content] fichiers EN sans équivalent FR : {only_en}")

    fr_ids = _i18n_ids(I18N_FR)
    en_ids = _i18n_ids(I18N_EN)
    only_fr_ids = sorted(fr_ids - en_ids)
    only_en_ids = sorted(en_ids - fr_ids)
    if only_fr_ids:
        errors.append(f"[i18n] clés présentes dans FR seul : {only_fr_ids}")
    if only_en_ids:
        errors.append(f"[i18n] clés présentes dans EN seul : {only_en_ids}")


# ---------------------------------------------------------------------------
# 7. Formulaire d'issue ↔ metadata
# ---------------------------------------------------------------------------

def check_issue_form() -> None:
    if not ISSUE_FORM_AGENDA.exists():
        warnings.append(
            f"[issue-form] {ISSUE_FORM_AGENDA.relative_to(ROOT)} introuvable — contrôle sauté"
        )
        return
    form = _load_yaml(ISSUE_FORM_AGENDA)
    options: list[str] = []
    for field in form.get("body", []):
        if (
            isinstance(field, dict)
            and field.get("type") == "dropdown"
            and field.get("id") == "type"
        ):
            options = list(field.get("attributes", {}).get("options", []))
            break
    if not options:
        warnings.append(
            "[issue-form] champ `type` introuvable dans add-agenda-event.yml — contrôle sauté"
        )
        return

    declared = set(
        _load_yaml(DOMAINS["agenda"]["metadata"]).get("types") or []
    )
    extra = set(options) - declared
    missing = declared - set(options)
    if extra:
        errors.append(
            f"[issue-form] options du dropdown `type` absentes de "
            f"`data/metadata/agenda.yaml` : {sorted(extra)}"
        )
    if missing:
        errors.append(
            "[issue-form] clés de `data/metadata/agenda.yaml` absentes des options "
            f"du dropdown `type` : {sorted(missing)}"
        )


# ---------------------------------------------------------------------------
# Exécution
# ---------------------------------------------------------------------------

def main() -> int:
    check_schemas()
    check_metadata_consistency()
    check_agenda_order()
    check_parity()
    check_issue_form()

    if warnings:
        print("## ⚠️  Avertissements\n")
        for message in warnings:
            print(f"- {message}")
        print()

    if errors:
        print("## ❌ Erreurs\n")
        for message in errors:
            print(f"- {message}")
        print(f"\n**{len(errors)} erreur(s)** détectée(s).")
        return 1

    print("✅ Toutes les vérifications sont passées.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
