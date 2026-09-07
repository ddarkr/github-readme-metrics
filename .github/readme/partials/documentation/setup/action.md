# Using the GitHub Action

Use this path to keep a rendered report in a profile repository (a repository named after its owner). The workflow commits the generated file back to that repository.

## Credentials and permissions

Create a **classic personal access token** and save it as the repository secret `METRICS_TOKEN`. The Action uses GitHub's GraphQL API beyond the workflow repository, so `${{ secrets.GITHUB_TOKEN }}` is not sufficient and fine-grained tokens are currently rejected by the runtime.

Start with the least scopes needed by the enabled plugins. Public-only reports may need no additional scopes; add `read:org` for organization data, `repo` for private-repository data, and only the plugin-specific scopes documented in the [plugin reference](/source/plugins/README.md). Never paste the token into a workflow, README, URL, or committed settings file.

The workflow itself needs only `contents: write` to commit its output.

## Minimal workflow

Create `.github/workflows/metrics.yml` in the repository that should receive `github-metrics.svg`:

```yaml
name: Metrics

on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  metrics:
    runs-on: ubuntu-latest
    steps:
      - uses: ddarkr/github-readme-metrics@master
        with:
          token: ${{ secrets.METRICS_TOKEN }}
          filename: github-metrics.svg
```

Use the rendered image in that repository's `README.md`:

```markdown
![Metrics](./github-metrics.svg)
```

For a different account, add `user: account-name`; for a repository report, add `repo: repository-name`. Configuration uses Action inputs such as `template`, `base`, and `plugin_languages`; the generated [core reference](/source/plugins/core/README.md) is the complete input contract. Template and plugin pages provide copyable examples.

## Version choice

This maintained fork is invoked as `ddarkr/github-readme-metrics@master`. Pin a commit SHA if your workflow requires an immutable Action revision. Do not use the legacy `ddarkr/metrics` Action path.

`output_action` controls alternatives such as pull-request, gist, or manual output handling; the default commits the rendered file. See [core output configuration](/source/plugins/core/README.md#-configuring-output-action) before changing it.
