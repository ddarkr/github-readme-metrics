# Contributing

This repository maintains [ddarkr/github-readme-metrics](https://github.com/ddarkr/github-readme-metrics), a fork of [lowlighter/metrics](https://github.com/lowlighter/metrics). Submit pull requests against this fork for its changes; do not send fork-specific support requests to the upstream project. Issues and Discussions are currently disabled.

Read [ARCHITECTURE.md](ARCHITECTURE.md) for the source layout and [local setup](.github/readme/partials/documentation/setup/local.md) for installation. Follow the [Code of Conduct](CODE_OF_CONDUCT.md). Report vulnerabilities according to [SECURITY.md](SECURITY.md), not in a public issue containing exploit details.

## Development prerequisites

- Node.js 24 or newer and pnpm 11.9.0 (pinned via `packageManager`; Node 24 ships corepack, so bootstrap with `corepack enable`). Use `pnpm install --frozen-lockfile` to install the lockfile's dependency versions. Lifecycle scripts for puppeteer, sharp, canvas, and dprint are allowed via `pnpm-workspace.yaml`.
- Chrome/Chromium for browser-backed rendering tests. Use Puppeteer's installed browser, or set `PUPPETEER_BROWSER_PATH` to an existing executable.
- Keep personal credentials in GitHub Actions secrets or the ignored local `settings.json`. Never put real credentials in test fixtures, screenshots, logs, or committed workflow files.
- `tests/secrets.json` contains committed dummy inputs for scenario generation. It is not a credential store; never replace its fixture values with real tokens.

## Making a change

1. Search this fork's existing pull requests. For a substantial feature or incompatible change, use a draft pull request to explain the proposed behavior before expanding the implementation.
2. Keep a pull request focused on one behavior or a related set of fixes. Explain the problem, the observable change, and any compatibility impact.
3. Follow the existing ES module (`.mjs`) and two-space indentation conventions. Reuse existing plugin and template patterns rather than adding parallel implementations.
4. Run the relevant checks below. State exactly what was exercised and which external-service paths were not tested.
5. For visual changes, attach actual dark/light renders at narrow widths. For bug fixes, add a regression test when it protects a plausible failure; avoid assertions that only pin source text or incidental markup.

## Checks

```sh
pnpm test
pnpm run linter
pnpm run build
```

`pnpm test` runs the offline regression, integration-fixture, widget, and browser rendering suites. It does not establish that every external service accepts live credentials. The browser-backed cases require Chrome/Chromium even though they use local fixture data.

`pnpm run test-metrics` runs the broader Action/web scenario matrix. `pnpm run test-presets` is separate and requires its configured preset checkout. These suites can depend on external resources; they are not the default offline check.

`pnpm run build` regenerates documentation, descriptors, example workflows, and test cases in place; it is not a JavaScript compilation step. The normal command does not publish. Do not use the build script's `publish` mode for local verification.

## Source files and generated files

| Change | Edit first |
| --- | --- |
| Plugin behavior or options | `source/plugins/<plugin>/index.mjs`, `metadata.yml`, and `examples.yml` |
| Community plugin | `source/plugins/community/<plugin>/` |
| Template layout | `source/templates/<template>/image.svg`, `partials/`, and `style.css` |
| Template processing or examples | `template.mjs`, `metadata.yml`, and `examples.yml` in that template |
| Root README and shared guides | `.github/readme/partials/` |
| Action descriptor | `source/app/action/action.yml` and plugin input metadata |
| Example server settings | `source/app/web/settings.example.json` and plugin input metadata |
| API fixtures | `tests/mocks/api/` and their corresponding test cases |

Regenerate after changing metadata, examples, or documentation templates. Do not fix a generated README header, root `action.yml`, or generated case in isolation: the next build would overwrite it. Plugin/template README content outside generated markers can be maintained directly.

## Pull request checklist

- Describe the behavior and any changed options or configuration.
- Include verification commands and their outcomes, with browser/API prerequisites noted.
- Update the source documentation and regenerate affected outputs.
- Include no local settings, real tokens, assistant artifacts, or unrelated formatting changes.
- Preserve the MIT license and original authors' attribution.
