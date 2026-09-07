# Architecture

GitHub Readme Metrics is a Node.js 24 application using JavaScript ES modules (`.mjs`). The GitHub Action and Express web server are separate adapters around the same metrics engine. There is no TypeScript compilation step in the maintained runtime.

## Repository map

```text
source/
  app/
    metrics/              Shared data collection and rendering engine
    action/               GitHub Action entrypoint and descriptor source
    web/                  Express entrypoint, instance, settings source, and static UI
      statics/embed/      Embedded configuration UI and preview fixture generator
  plugins/                Built-in plugins
    community/            Community plugins
  templates/              SVG/Markdown templates and their processors
    community/            Community template support
.github/
  readme/                 Documentation templates, guides, and images
  scripts/                Build, preview, and maintenance tooling
  workflows/              Validation and publishing workflows
  config/                 Tool configuration
tests/
  mocks/api/              GitHub and third-party response fixtures
  mocks/                  Fixture helpers and mock integration
  fixtures/               File-backed test inputs
  cases/                  Generated Action/web scenario cases
```

The root `action.yml` and `settings.example.json` are generated public configuration surfaces. `package.json` defines supported commands and dependencies. Personal `settings.json` is ignored. `MIGRATION_PLAN.md` is a historical proposal, not an active implementation guide.

## Execution flow

1. **Adapter:** `source/app/action/index.mjs` converts Action inputs into a query; `source/app/web/index.mjs` starts the Express instance in `instance.mjs`, which handles web requests.
2. **Metadata and setup:** `source/app/metrics/metadata.mjs` loads plugin/template definitions and input metadata. `setup.mjs` configures the available processors and templates.
3. **Collection:** `source/app/metrics/index.mjs` coordinates the base data and enabled plugins. Plugins fetch or transform their data and expose result objects to the selected template. GitHub access uses Octokit GraphQL/REST; other providers use their own APIs.
4. **Template:** The template processor prepares presentation context. EJS renders the image/Markdown source and partials using plugin results and shared helpers.
5. **Output:** SVG is verified and resized; raster output is captured using Chromium. The adapter handles delivery or Action output behavior.

The adapters share the engine, not a single process entrypoint. Public web previews use generated example data and must not be treated as proof that an external API integration works with real credentials.

## Plugins

A plugin directory contains `index.mjs` for processing, `metadata.yml` for input and capability definitions, `examples.yml` for workflow examples, and `README.md` for documentation. API query templates live in `queries/` where needed. Community implementations use `source/plugins/community/<name>/`.

Keep acquisition, filtering, limits, and provider-specific errors in the plugin. Templates consume the resulting fields; they should not fetch data or manufacture measurements. When changing an API fixture in `tests/mocks/api/`, update the corresponding consumer test.

## Templates and browser rendering

Templates have an `image.svg` or other output source, `style.css`, `template.mjs`, metadata, and examples. Optional font definitions and EJS partials are template-specific. SVG templates embed XHTML with `foreignObject`; image and font assets can be embedded to avoid external requests in the delivered report.

The renderer uses Puppeteer to measure the final `#metrics-end` marker and obtain output dimensions. It waits for fonts and image decoding with animations disabled during measurement. The SVG renderer shares a browser, serializes launch/recovery, and closes each render's page in `finally`.

Nested charts need their own valid coordinate system, not just valid XML. For example, the lines plugin emits a `viewBox` and reserves space for axis labels so responsive sizing does not clip them. Browser bounding-box checks cover failures that string and XML assertions cannot detect.

Modern Terminal registers its content partials in `source/templates/modern-terminal/partials/_.json`. Shared helpers own the command/output shell, Powerline prompts, and embedded vector icons. Helpers do not belong in the content registry. See the [template rendering contract](source/templates/modern-terminal/README.md#rendering-contract) before changing its layout.

## Source of generated files

`npm run build` invokes `.github/scripts/build.mjs`. It regenerates files in place; it does not compile the application or publish in its normal mode.

| Generated output | Maintained source |
| --- | --- |
| Root `README.md` | `.github/readme/partials/templated/README.md` and included partials |
| Plugin/template README headers and examples | Their `metadata.yml` and `examples.yml`; body text outside generated markers remains hand-maintained |
| Plugin/template indexes and compatibility tables | Metadata plus `.github/readme/partials/templated/` |
| Root `action.yml` | `source/app/action/action.yml` plus input metadata |
| Root `settings.example.json` | `source/app/web/settings.example.json` plus input metadata |
| `tests/cases/*.yml` | Plugin/template examples processed into test scenarios |
| `.github/workflows/examples.yml` | `.github/scripts/files/examples.yml` and collected plugin/template examples |

Change generator inputs before regenerating outputs. Generated example workflows are examples, not evidence that an examples branch, container tag, or hosted service has been published by this fork.

## Testing boundaries

- `regressions.test.js` checks runtime edge cases and recovery.
- `integrations.test.js` exercises provider behavior using fixtures.
- `rendering.test.js` checks consumer-visible rendering behavior, including actual Chromium chart bounds.
- `modern-terminal.test.js` renders every registered content widget with seeded data in both themes, disabled states, and escaped error states.
- `metrics.test.js` covers the broader Action, web, and placeholder scenario matrix.
- `presets.test.js` covers an explicitly configured preset checkout.

`npm test` selects the offline suites; browser-backed cases still need Chrome/Chromium. Use Puppeteer's installed browser or `PUPPETEER_BROWSER_PATH`. The broader scenario and preset suites have separate commands because they can depend on external resources. See [CONTRIBUTING.md](CONTRIBUTING.md) for the verification workflow and [.github/readme/partials/documentation/setup/local.md](.github/readme/partials/documentation/setup/local.md) for setup.

## Credentials and deployment

The Action and web instance can access credential-protected data. Tokens and personal settings are runtime inputs, not source files or test data. Review the [security policy](SECURITY.md) before exposing a web instance or publishing reports. The original MIT attribution is preserved in [LICENSE](LICENSE).

The inherited root `vercel.json` is a reverse-proxy configuration for upstream `metrics.lecoq.io` endpoints, not a deployment of this fork's Node.js engine. Do not use it for private reports or assume it provides an independently hosted service. Use the documented Node.js or Docker setup to run this fork.
