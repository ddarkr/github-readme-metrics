# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-02
**Commit:** 366f8b9d
**Branch:** master

## OVERVIEW
GitHub metrics infographics generator (Node.js/Express). Renders SVG/Markdown/PDF/JSON stats via 40+ plugins, 5 templates. GitHub Action + web instance dual mode.

## STRUCTURE
```
metrics/
├── source/
│   ├── app/
│   │   ├── metrics/    # Core engine (index.mjs, setup.mjs, utils.mjs, metadata.mjs, presets.mjs)
│   │   ├── action/     # GitHub Action entry (index.mjs)
│   │   └── web/        # Express server (index.mjs, instance.mjs, statics/)
│   ├── plugins/        # 40 plugins (each: index.mjs, metadata.yml, queries/, README.md)
│   └── templates/      # 5 templates (each: template.mjs, style.css, image.svg, metadata.yml)
├── tests/              # Jest tests + mocks (metrics.test.js, mocks/api/)
├── .github/workflows/  # 12 CI/CD workflows
└── ARCHITECTURE.md     # Detailed architecture docs
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add new plugin | `source/plugins/{name}/` | Copy structure from existing (base, core) |
| Modify rendering | `source/templates/{name}/` | EJS templates + CSS |
| API integration | `source/plugins/{name}/queries/` | GraphQL/REST queries |
| Web server changes | `source/app/web/` | Express instance |
| GitHub Action logic | `source/app/action/` | Action entry point |
| Test mocking | `tests/mocks/` | API response mocks |

## CONVENTIONS
- **File extension**: `.mjs` (ES modules), NOT `.js`
- **Indent**: 2 spaces (UTF-8) per `.editorconfig`
- **Plugin structure**: Each plugin has `index.mjs` (logic), `metadata.yml` (config), `queries/` (API), `README.md` (docs)
- **Template structure**: Each template has `template.mjs` (logic), `style.css`, `image.svg`, `metadata.yml`
- **Testing**: Jest with 60s timeout, `--runInBand` for sequential execution

## ANTI-PATTERNS (THIS PROJECT)
- **NEVER** use `.js` extension for source files → use `.mjs`
- **NEVER** skip plugin metadata.yml → required for plugin registration
- **NEVER** hardcode API responses in tests → use `tests/mocks/`
- **NEVER** modify `tests/mocks/api/` without updating corresponding test cases

## COMMANDS
```bash
npm start              # Start web instance
npm test               # Run all tests (Jest, --runInBand)
npm run test-metrics   # Run metrics tests only
npm run dev            # Dev mode with nodemon
npm run linter         # ESLint check
npm run build          # Build project
```

## NOTES
- **Dual mode**: Same entry point for GitHub Action and web instance
- **Puppeteer dependency**: Used for SVG height calculation and PNG conversion
- **Plugin count**: 40 core plugins + 9 community plugins in `source/plugins/community/`
- **Template count**: 4 core templates + 1 community template in `source/templates/community/`
- **Large files**: Only 2 files exceed 500 lines (monitor complexity)
