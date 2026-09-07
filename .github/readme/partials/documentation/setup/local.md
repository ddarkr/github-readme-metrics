# 🔧 Local setup for development (~20 min)

## 0️ Prepare your machine

Node.js 24 or newer is required. Docker and CI use Node.js 24.

## 1️ Clone repository and install dependencies

Run the following command to clone this repository and install dependencies.

```shell
git clone https://github.com/ddarkr/metrics.git
cd metrics/
npm ci
cp settings.example.json settings.json
```

Puppeteer downloads its browser during installation. To use an existing Chrome or Chromium installation instead, set `PUPPETEER_SKIP_DOWNLOAD=true` when installing and `PUPPETEER_BROWSER_PATH` to the browser executable when running metrics. The Docker image installs Debian Chromium and configures these variables automatically.

## 2️ Setup and configure *metrics*

Follow [🏗️ Deploying a web instance (~20 min)](/.github/readme/partials/documentation/setup/web.md) guide except docker-related sections.

Once read, start local instance using the following command:
```shell
npm start
```

## 3️ Start hacking!

Connect to your web server using `http://localhost:{port}` and start hacking!

For quick testing, it is advised to directly craft URLs, rather than using the web interface.

*Example: test a new plugin*
```shell
https://localhost:{port}/username?base=0&newplugin=1&newplugin.option1=hello&newplugin.option2=world)
```

## *️⃣ Testing changes

Testing is done through [jest](https://github.com/facebook/jest) framework.

To avoid consuming APIs requests and causing additional charges on external services, data are [mocked](/tests/mocks/index.mjs) using [JavaScript Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) and [Faker.js](https://github.com/faker-js/faker) with randomly generated data.

Run `npm test` for runtime, plugin integration, rendering regressions, and the mocked Action/web/placeholder matrix. The web tests use an automatically assigned port and do not load your `settings.json`.

`npm run test-presets` is separate: it checks the external presets branch and may clone it.

After changing metadata or examples, run `npm run build` and include its generated Action inputs, option reference, compatibility matrix, and test cases. Edit the source `metadata.yml` and `examples.yml`, not their generated copies.

For an isolated interactive preview without personal credentials, run `SANDBOX=true PORT=3001 npm start`.

