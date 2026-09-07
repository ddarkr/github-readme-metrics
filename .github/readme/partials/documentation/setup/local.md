# Local development

## Prerequisites

Install Node.js 24 or newer. The renderer uses Puppeteer for browser-backed output. `npm ci` normally installs Puppeteer's browser; if installation is configured to skip that download, set `PUPPETEER_BROWSER_PATH` to an existing Chrome or Chromium executable before running browser-backed rendering checks.

## Checkout and run

```sh
git clone https://github.com/ddarkr/github-readme-metrics.git
cd github-readme-metrics
npm ci
```

For an isolated preview that does not use personal GitHub credentials:

```sh
SANDBOX=true PORT=3001 npm start
```

Open `http://localhost:3001`. For a live self-hosted instance, copy `settings.example.json` to `settings.json`, configure a personal token there, and follow the [web-instance guide](/.github/readme/partials/documentation/setup/web.md). `settings.json` and environment files contain credentials: keep them local, do not commit them, and do not serve them from a web root.

## Checks and generation

```sh
npm test
```

`npm test` runs the deterministic offline regression, integration, rendering, and modern-terminal widget checks. It does not require a personal token or read your `settings.json`; `tests/rendering.test.js` requires Chromium through Puppeteer's installed browser or `PUPPETEER_BROWSER_PATH`.

```sh
npm run test-metrics
npm run test-presets
```

Run `test-metrics` only when you intend to exercise the network/browser-heavy metrics suite. `test-presets` is separate and may access the external presets branch.

```sh
npm run build
```

`npm run build` **regenerates** derived Action inputs, option/reference pages, compatibility data, examples, and test cases from metadata and examples; it is not a compilation step. Edit source metadata and examples, then regenerate rather than hand-editing generated output.
