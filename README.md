# GitHub Readme Metrics

[![Continuous integration](https://github.com/ddarkr/github-readme-metrics/actions/workflows/ci.yml/badge.svg)](https://github.com/ddarkr/github-readme-metrics/actions/workflows/ci.yml)

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

# Documentation

This fork is maintained on `master`; generated option references describe the code in this checkout.


## Setup

Choose the path that matches where you want reports to be generated:

- [**GitHub Action**](/.github/readme/partials/documentation/setup/action.md) — the recommended profile-repository path. A scheduled workflow renders and commits the image.
- [**Local Node.js development**](/.github/readme/partials/documentation/setup/local.md) — run the web app and the offline checks from a checkout.
- [**Local Docker rendering**](/.github/readme/partials/documentation/setup/docker.md) — build the supplied image and run its Action entrypoint without installing Node.js on the host.
- [**Self-hosted web instance**](/.github/readme/partials/documentation/setup/web.md) — an advanced, operator-owned endpoint; keep its credentials private.
- [**Upstream shared instance**](/.github/readme/partials/documentation/setup/shared.md) — an optional service operated upstream, not by this fork.

Additional references:

- [Organizations](/.github/readme/partials/documentation/organizations.md)
- [Self-hosted runners](/.github/readme/partials/documentation/selfhosted.md)
- [Template/plugin compatibility](/.github/readme/partials/documentation/compatibility.md)

## Contributing

- [Contribution guide](/CONTRIBUTING.md)
- [Architecture](/ARCHITECTURE.md)
- [MIT license](/LICENSE)
- [Pull requests for this fork](https://github.com/ddarkr/github-readme-metrics/pulls)

Issues, Discussions, and private vulnerability reporting are currently disabled in the repository settings. Do not post sensitive reports publicly; see [SECURITY.md](/SECURITY.md).

Useful upstream APIs and dependencies:

- [GitHub GraphQL API](https://docs.github.com/en/graphql)
- [GitHub REST API](https://docs.github.com/en/rest)
- [GitHub Octicons](https://github.com/primer/octicons)


## License and upstream attribution

This maintained fork remains available under the MIT License. The original copyright notice is preserved:

```
MIT License
Copyright (c) 2020-present lowlighter
```

See [LICENSE](./LICENSE) for the full terms and [lowlighter/metrics](https://github.com/lowlighter/metrics) for the upstream project.


