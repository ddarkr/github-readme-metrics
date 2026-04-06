# APP KNOWLEDGE BASE

**Generated:** 2026-04-02
**Parent:** ../AGENTS.md

## OVERVIEW
Core application code with dual-mode entry points: GitHub Action and Express web server, sharing metrics engine.

## STRUCTURE
```
app/
├── metrics/         # Core metrics engine
│   ├── index.mjs    # Main engine entry
│   ├── setup.mjs    # Configuration setup
│   ├── utils.mjs    # Shared utilities
│   ├── metadata.mjs # Metadata handling
│   └── presets.mjs  # Preset configurations
├── action/          # GitHub Action entry
│   └── index.mjs    # Action bootstrap
└── web/             # Express web server
    ├── index.mjs    # Server entry point
    ├── instance.mjs # Express app setup + routes
    └── statics/     # Static assets (embed, oauth, insights)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Core rendering | `metrics/index.mjs` | Main metrics generation logic |
| Configuration | `metrics/setup.mjs` | User config parsing and validation |
| Utilities | `metrics/utils.mjs` | Shared helper functions |
| GitHub Action | `action/index.mjs` | Action input processing, workflow |
| Web server | `web/instance.mjs` | Express routes, middleware, endpoints |
| Static assets | `web/statics/` | Embed placeholders, OAuth, insights UI |

## CONVENTIONS
- **Entry points**: Both `action/index.mjs` and `web/index.mjs` call the same `metrics/` engine
- **No separate routes file**: Routes are defined inline in `instance.mjs`
- **Static serving**: Files in `statics/` are served directly by Express
- **File extension**: `.mjs` only, NEVER `.js`

## ANTI-PATTERNS
- **NEVER** duplicate logic between action and web entry points → use shared metrics/ engine
- **NEVER** add new route files → routes go in instance.mjs
- **NEVER** use `.js` extension → use `.mjs`
- **NEVER** hardcode URLs or secrets → use environment variables

## COMMANDS
```bash
npm start    # Start web server (web/index.mjs)
npm run dev  # Start with nodemon for development
```

## NOTES
- **Dual mode**: Same core engine powers both Action and web instance
- **Puppeteer**: Used for SVG height calculation and PNG conversion (spawns headless Chrome)
- **Rate limiting**: Express rate-limit middleware protects web endpoints
- **Caching**: memory-cache used for API response caching
