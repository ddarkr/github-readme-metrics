# PLUGINS KNOWLEDGE BASE

**Generated:** 2026-04-02
**Parent:** ../AGENTS.md

## OVERVIEW
40 core plugins + 9 community plugins extending metrics functionality via standardized interface.

## STRUCTURE
```
plugins/
├── achievements/    # GitHub achievements tracking
├── activity/        # Recent activity feed
├── anilist/         # Anilist anime/manga
├── base/            # Core base content
├── calendar/        # Commit calendar
├── code/            # Random code snippets
├── community/       # 9 community plugins (see community/AGENTS.md)
├── contributors/    # Repository contributors
├── core/            # Core plugin
├── discussions/     # GitHub discussions
├── followup/        # Issues/PRs follow-up
├── gists/           # GitHub gists
├── habits/          # Coding habits
├── introduction/    # User introduction
├── isocalendar/     # Isometric calendar
├── languages/       # Language activity (has analyzer/cli.mjs)
├── leetcode/        # LeetCode stats
├── licenses/        # Repository licenses
├── lines/           # Lines of code
├── music/           # Music activity
├── notable/         # Notable contributions
├── pagespeed/       # Google PageSpeed
├── people/          # GitHub people
├── posts/           # Recent posts
├── projects/        # GitHub projects
├── reactions/       # Comment reactions
├── repositories/    # Featured repos
├── rss/             # RSS feed
├── skyline/         # GitHub Skyline
├── sponsors/        # GitHub Sponsors
├── sponsorships/    # Sponsorships
├── stargazers/      # Stargazers chart
├── starlists/       # Star lists
├── stars/           # Recent stars
├── steam/           # Steam activity
├── support/         # Community support (deprecated)
├── topics/          # Starred topics
├── traffic/         # Repository traffic
├── tweets/          # Recent tweets (deprecated)
└── wakatime/        # WakaTime coding
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add new plugin | Copy `base/` or `core/` structure | Every plugin needs: index.mjs, metadata.yml, queries/, README.md |
| Plugin logic | `{plugin}/index.mjs` | Main plugin code |
| Plugin config | `{plugin}/metadata.yml` | Options, default values, descriptions |
| API queries | `{plugin}/queries/` | GraphQL (.graphql) or REST queries |
| Plugin docs | `{plugin}/README.md` | User-facing documentation |

## CONVENTIONS
- **MUST have**: `index.mjs`, `metadata.yml`, `queries/`, `README.md`
- **index.mjs exports**: Default async function returning plugin result
- **metadata.yml format**: YAML with `name`, `icon`, `options` sections
- **queries/**: Separate .graphql files for each query type
- **File extension**: `.mjs` only (ES modules), NEVER `.js`

## ANTI-PATTERNS
- **NEVER** create plugin without metadata.yml → breaks registration
- **NEVER** put queries inline in index.mjs → use queries/ directory
- **NEVER** use `.js` extension → use `.mjs`
- **NEVER** hardcode API responses → use mocked data in tests/

## UNIQUE STYLES
- Each plugin is self-contained and can be enabled/disabled independently
- Options are defined in metadata.yml and passed to index.mjs
- Some plugins have analyzer/ subdirectory for complex analysis (e.g., languages/)
