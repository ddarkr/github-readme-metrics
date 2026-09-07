# Docker rendering

Build the image from this checkout when you need the Action entrypoint without installing Node.js on the host:

```sh
docker build -t github-readme-metrics .
```

The supplied Dockerfile uses Node.js 24, installs Debian Chromium, and configures `PUPPETEER_SKIP_DOWNLOAD` and `PUPPETEER_BROWSER_PATH` for that browser.

Run a one-off render with Action inputs as `INPUT_` environment variables. Mount a directory for output rather than putting credentials into the image:

```sh
mkdir -p renders
docker run --rm \
  --env INPUT_TOKEN="$METRICS_TOKEN" \
  --env INPUT_USER="your-github-login" \
  --env INPUT_FILENAME="github-metrics.svg" \
  --volume "$PWD/renders:/renders" \
  github-readme-metrics
```

`INPUT_TOKEN` must be a classic personal access token; pass it from a host environment variable or an approved secret mechanism, never a Dockerfile, image layer, or command history. Use the [Action guide](/.github/readme/partials/documentation/setup/action.md#credentials-and-permissions) to choose the minimum scopes.

Action input names are uppercase with an `INPUT_` prefix (`plugin_languages` becomes `INPUT_PLUGIN_LANGUAGES`). The default Docker output handling writes to the mounted `/renders` directory. To use a different output action, configure its corresponding Action inputs and provide the repository/committer credentials required by the [core output reference](/source/plugins/core/README.md#-configuring-output-action).

This guide intentionally builds locally; it does not assume a fork-published container image or tag.
