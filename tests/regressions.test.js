const processes = require("child_process")

const run = script => processes.execFileSync("node", ["--input-type", "module", "--eval", script], {stdio: "pipe"})

describe("runtime regressions", () => {
  test("format.error handles axios errors without a response", () => {
    run(`
      import assert from "assert/strict"
      import {formatters} from "./source/app/metrics/utils.mjs"
      const error = new Error("connect ECONNREFUSED")
      error.isAxiosError = true
      error.code = "ECONNREFUSED"
      assert.deepEqual(formatters().format.error(error), {
        error: {
          message: "API error: ECONNREFUSED",
          instance: "connect ECONNREFUSED",
        },
      })
    `)
  })

  test("imgb64 falls back when downloaded artwork is not an image", () => {
    run(`
      import assert from "assert/strict"
      import {imgb64} from "./source/app/metrics/utils.mjs"
      globalThis.fetch = async () => ({
        arrayBuffer: async () => new TextEncoder().encode("not an image").buffer,
      })
      assert.match(await imgb64("https://example.com/artwork"), /^data:image\\/png;base64,/)
      assert.equal(await imgb64("https://example.com/artwork", {fallback: false}), null)
    `)
  })

  test("svg.page restarts a closed browser before creating a page", () => {
    run(`
      import assert from "assert/strict"
      import {puppeteer, svg} from "./source/app/metrics/utils.mjs"
      const launch = puppeteer.launch
      let launches = 0
      let newPages = 0
      const restartedPage = {id: "restarted"}
      svg.resize.browser = {
        async version() {
          throw new Error("Connection closed")
        },
      }
      puppeteer.launch = async () => {
        launches++
        return {
          async version() {
            return "Chrome/restarted"
          },
          async newPage() {
            newPages++
            return restartedPage
          },
        }
      }
      try {
        assert.equal(await svg.page("test"), restartedPage)
        assert.equal(launches, 1)
        assert.equal(newPages, 1)
      }
      finally {
        puppeteer.launch = launch
        svg.resize.browser = null
      }
    `)
  })

  test("svg.resize closes its page when rendering fails", () => {
    run(`
      import assert from "assert/strict"
      import {svg} from "./source/app/metrics/utils.mjs"
      const originalPage = svg.page
      let closed = 0
      const page = {
        setViewport() {},
        on() {
          return page
        },
        async setContent() {
          throw new Error("render failed")
        },
        async close() {
          closed++
        },
      }
      svg.page = async () => page
      try {
        await assert.rejects(svg.resize("<svg></svg>", {paddings: "0,0"}), /render failed/)
        assert.equal(closed, 1)
      }
      finally {
        svg.page = originalPage
      }
    `)
  })

  test("wakatime deduplicates repeated stats without inflating percentages", () => {
    run(`
      import assert from "assert/strict"
      import wakatime from "./source/plugins/wakatime/index.mjs"
      import {formatters} from "./source/app/metrics/utils.mjs"
      const stats = {
        projects: [
          {name: "metrics", percent: 10, total_seconds: 100},
          {name: "metrics", percent: 5, total_seconds: 50},
        ],
        languages: [
          {name: "JavaScript", percent: 20, total_seconds: 200},
          {name: "JavaScript", percent: 10, total_seconds: 100},
        ],
        operating_systems: [],
        editors: [],
        total_seconds: 3600,
        total_seconds_including_other_language: 3600,
        daily_average: 1800,
        daily_average_including_other_language: 1800,
      }
      const result = await wakatime({
        login: "ddarkr",
        q: {wakatime: true},
        data: {},
        account: {},
        imports: {
          axios: {get: async () => ({data: {data: stats}})},
          filters: {text: () => true},
          format: formatters().format,
          metadata: {plugins: {wakatime: {
            enabled: () => true,
            inputs: () => ({
              sections: [],
              days: "7",
              limit: 5,
              url: "https://wakatime.com",
              user: "ddarkr",
              "languages.other": false,
              "languages.ignored": [],
              "repositories.visibility": "all",
            }),
          }}},
        },
      }, {enabled: true, token: "TOKEN"})
      assert.equal(result.projects[0].name, "metrics")
      assert.equal(result.projects[0].total, 150)
      assert.equal(Math.round(result.projects[0].percent * 100), 15)
      assert.equal(result.languages[0].name, "JavaScript")
      assert.equal(result.languages[0].total, 300)
      assert.equal(Math.round(result.languages[0].percent * 100), 30)
    `)
  })
})
