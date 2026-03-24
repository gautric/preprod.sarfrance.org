---
inclusion: fileMatch
fileMatchPattern: "data/**/*.yaml"
---

# Data / Metadata Separation Pattern

All YAML data files in `data/` follow a two-file pattern that separates content data from structural metadata.

## Pattern

| Concern | Location | Example |
|---------|----------|---------|
| Content data (entries, events, notices…) | `data/<name>.yaml` | `data/books.yaml`, `data/agenda.yaml` |
| Structural metadata (categories, tags, types…) | `data/metadata/<name>.yaml` | `data/metadata/books.yaml`, `data/metadata/agenda.yaml` |
| Translated labels for tags/types/categories | `i18n/fr.yaml` + `i18n/en.yaml` | `agenda_type_conférence`, `chrono_tag_france` |

## Files

| Data file | Metadata file | i18n prefix | Metadata content |
|-----------|---------------|-------------|------------------|
| `data/books.yaml` | `data/metadata/books.yaml` | `bibli_cat_` | `categories` — list of genre keys |
| `data/agenda.yaml` | `data/metadata/agenda.yaml` | `agenda_type_` | `types` — list of event type keys |
| `data/notices.yaml` | `data/metadata/notices.yaml` | `notices_tag_` | `tags` — list of tag keys |
| `data/chronologie.yaml` | `data/metadata/chronologie.yaml` | `chrono_tag_` | `tags` — list of tag keys |
| `data/fr/hauts-lieux.yaml` + `data/en/hauts-lieux.yaml` | `data/metadata/hauts-lieux.yaml` | `hl_tag_` | `tags` — list of tag keys |

## Rules

1. Never embed categories, tags, or types inside a content data file — always put them in `data/metadata/<name>.yaml`
2. Metadata files contain simple lists of keys (no labels) — labels are resolved via i18n
3. Each metadata domain uses a consistent i18n key prefix: `<prefix><key>` (e.g. `agenda_type_conférence`, `notices_tag_officier-marine`)
4. When adding a new tag/type/category, add the key to the metadata file AND add i18n entries in both `i18n/fr.yaml` and `i18n/en.yaml`
5. Templates access metadata via `.Site.Data.metadata.<name>.<field>` (e.g. `.Site.Data.metadata.agenda.types`)
6. For hyphenated metadata file names, use `index` in templates: `(index .Site.Data.metadata "hauts-lieux").tags`
7. Templates render labels via `{{ i18n (printf "<prefix>%s" $key) }}`
8. Templates access content data via `.Site.Data.<name>.<field>` (e.g. `.Site.Data.agenda.events`)
9. For language-specific data (`data/fr/`, `data/en/`), the per-language files contain only content (no tag definitions)
10. When adding a new data-driven page, create both `data/<name>.yaml` and `data/metadata/<name>.yaml`, plus i18n entries
11. Tag/type keys in metadata must match the values used in the content data entries
