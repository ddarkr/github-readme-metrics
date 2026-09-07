`ddarkr/github-readme-metrics` is a maintained fork of [lowlighter/metrics](https://github.com/lowlighter/metrics). It generates GitHub account, organization, and repository reports for embedding in a README or other SVG-capable surface. The original project remains MIT-licensed; its attribution is preserved in this fork's [license](./LICENSE).

## Start here

- **Automated profile report:** follow the [GitHub Action quickstart](./.github/readme/partials/documentation/setup/action.md). It writes an SVG to the repository that owns the workflow.
- **Local development or self-hosting:** use the [Node.js setup](./.github/readme/partials/documentation/setup/local.md) or [Docker guide](./.github/readme/partials/documentation/setup/docker.md).
- **Self-hosted web endpoint:** see the [web-instance guide](./.github/readme/partials/documentation/setup/web.md). This fork does not operate a public rendering service.

## Fork additions

- [Modern Terminal](./source/templates/modern-terminal/README.md) is a Warp-inspired terminal template with dark/light themes, density controls, command/output blocks, and support for user, organization, and repository reports.
- [Tokscale](./source/plugins/community/tokscale/README.md) is an optional community plugin for a Tokscale username's token totals, rank, cost, submissions, and model usage; it does not require a GitHub token for its own data.
- [Koito](./source/plugins/music/README.md#-koito) is a Music-provider integration for self-hosted ListenBrainz-compatible Koito instances. It supports recent listens and top tracks/artists; public instances can be used without an API key, while protected instances use a token secret.

See the generated [template reference](./source/templates/README.md), [plugin reference](./source/plugins/README.md), and [compatibility matrix](./.github/readme/partials/documentation/compatibility.md) for supported options and combinations.
