# TEMPLATES KNOWLEDGE BASE

**Generated:** 2026-04-02
**Parent:** ../AGENTS.md

## OVERVIEW
5 templates providing different visual presentations for metrics output (classic, repository, terminal, markdown, community).

## STRUCTURE
```
templates/
├── classic/         # Default GitHub-style template
├── community/       # Community-contributed templates
├── markdown/        # Plain markdown output
├── repository/      # Repository-focused layout
└── terminal/        # Terminal/console style
```

Each template directory contains:
- `template.mjs` - Template logic and rendering
- `style.css` - CSS styles for the template
- `image.svg` - Base SVG structure
- `metadata.yml` - Template configuration and options
- `README.md` - Template documentation

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Modify rendering | `{template}/template.mjs` | Template logic, EJS-like syntax |
| Update styles | `{template}/style.css` | CSS for this template |
| Change SVG base | `{template}/image.svg` | Base SVG structure |
| Template config | `{template}/metadata.yml` | Options, defaults |
| Template docs | `{template}/README.md` | User documentation |

## CONVENTIONS
- **MUST have**: `template.mjs`, `style.css`, `image.svg`, `metadata.yml`
- **template.mjs exports**: Default function returning rendered SVG
- **metadata.yml format**: YAML with `name`, `icon`, `options` sections
- **Style isolation**: Each template has its own CSS, never shared
- **File extension**: `.mjs` only, NEVER `.js`

## ANTI-PATTERNS
- **NEVER** share CSS between templates → each must be self-contained
- **NEVER** skip metadata.yml → required for template registration
- **NEVER** use `.js` extension → use `.mjs`
- **NEVER** modify image.svg without updating template.mjs references

## UNIQUE STYLES
- Templates use EJS-like syntax for variable interpolation
- SVG images are embedded as base64 to avoid external dependencies
- Some templates have partials/ subdirectory for component reuse (classic, terminal)
