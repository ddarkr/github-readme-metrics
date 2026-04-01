# COMMUNITY PLUGINS KNOWLEDGE BASE

**Generated:** 2026-04-02
**Parent:** ../AGENTS.md

## OVERVIEW
9 community-contributed plugins extending metrics with non-core integrations.

## STRUCTURE
```
community/
├── 16personalities/ # 16personalities test results
├── chess/           # Chess.com stats
├── crypto/          # Cryptocurrency prices
├── fortune/         # Fortune cookie quotes
├── nightscout/      # Nightscout glucose monitor
├── poopmap/         # PoopMap app stats
├── screenshot/      # Website screenshot capture
├── splatoon/        # Splatoon game stats
└── stock/           # Stock price display
```

Each plugin follows the same structure as core plugins:
- `index.mjs` - Plugin logic
- `metadata.yml` - Configuration
- `queries/` - API queries (if needed)
- `README.md` - Documentation

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add community plugin | Create new directory here | Follow same structure as core plugins |
| Plugin logic | `{plugin}/index.mjs` | Main plugin code |
| Plugin config | `{plugin}/metadata.yml` | Options, defaults |

## CONVENTIONS
- **Same as core plugins**: Must have index.mjs, metadata.yml, README.md
- **Optional queries/**: Only if plugin needs external API calls
- **File extension**: `.mjs` only, NEVER `.js`

## ANTI-PATTERNS
- **NEVER** bypass plugin registration → still needs metadata.yml
- **NEVER** use `.js` extension → use `.mjs`
- **NEVER** duplicate core plugin structure exactly → adapt to your use case

## UNIQUE STYLES
- Community plugins may have different code quality than core plugins
- Some use external APIs not officially documented (e.g., splatoon uses s3si library)
- Contributors maintain their own plugins (see README.md for author info)
