# Self-hosted web instance

This is an operator-managed web endpoint, not a service run by `ddarkr/github-readme-metrics`. Run it only where you control access to its credentials and traffic.

## Configure locally

From a checkout prepared with [the local setup](/.github/readme/partials/documentation/setup/local.md):

```sh
cp settings.example.json settings.json
```

Set the required `token` in `settings.json` to a GitHub personal access token and keep the remaining restrictive defaults unless you understand the feature being enabled. In particular, leave `extras.default` disabled and do not enable command, user CSS/JavaScript, filesystem, or optional-dependency extras for untrusted requests. Keep `settings.json`, `.env`, and secrets outside the web root and version control.

Start the instance locally:

```sh
npm start
```

The example configuration listens on port 3000. Test through `http://127.0.0.1:3000`; do not expose the configuration file or token through a static server, image, repository, or URL.

## Run the local Docker image

Build the image as described in the [Docker guide](/.github/readme/partials/documentation/setup/docker.md), then mount the settings file read-only and bind the service to loopback:

```sh
docker run --rm --entrypoint="" \
  --publish 127.0.0.1:3000:3000 \
  --volume "$PWD/settings.json:/metrics/settings.json:ro" \
  github-readme-metrics npm start
```

The image includes Chromium and configures Puppeteer to use it. Do not bake `settings.json` into an image or publish it in a build context.

## Request parameters

The web endpoint uses the same engine as the Action, with URL names adapted to dots rather than Action underscores and without `plugin_` prefixes. For example, the Action input `plugin_languages_details` becomes `languages.details` in a request. URL-encode values.

```html
<img src="https://your-controlled-host/username?base=0&languages=1&languages.details=percentage">
```

Use the [core reference](/source/plugins/core/README.md) and individual plugin/template pages for the accepted settings. The server's settings control enabled templates, plugins, cache, output formats, rate limiting, and access restrictions.
