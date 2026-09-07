# Self-hosted runners

A self-hosted runner can run the same workflow as GitHub-hosted runners when Docker and `jq` are installed and the runner's working user can access the Docker daemon. Follow [GitHub's self-hosted runner documentation](https://docs.github.com/en/actions/hosting-your-own-runners) for runner installation and hardening.

Use the self-hosted label in the workflow:

```yaml
jobs:
  metrics:
    runs-on: self-hosted
    permissions:
      contents: write
    steps:
      - uses: ddarkr/github-readme-metrics@master
        with:
          token: ${{ secrets.METRICS_TOKEN }}
```

Treat the runner as a trusted execution environment: it receives the metrics secret and can invoke Docker. Keep the token in repository or organization secrets and use the [minimum scopes described in the Action guide](/.github/readme/partials/documentation/setup/action.md#credentials-and-permissions). For Action input troubleshooting, use the [core reference](/source/plugins/core/README.md).
