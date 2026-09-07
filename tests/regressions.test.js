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
      const formatted = formatters().format.error(error)
      assert.match(formatted.error.message, new RegExp(error.code))
      assert.equal(formatted.error.instance, error.message)
    `)
  })

  test("imgb64 rejects failed and invalid image sources without reporting success", () => {
    run(`
      import assert from "assert/strict"
      import {imgb64} from "./source/app/metrics/utils.mjs"
      const originalFetch = globalThis.fetch
      const response = (body, status = 200) => ({
        ok: status >= 200 && status < 300,
        status,
        arrayBuffer: async () => new TextEncoder().encode(body).buffer,
      })
      try {
        globalThis.fetch = async image => {
          if (image.endsWith("/missing"))
            return response("", 404)
          if (image.endsWith(".svg"))
            return response("<html>not svg</html>")
          return response("not an image")
        }
        const encoded = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOcOnfpfwAGfgLYttYINwAAAABJRU5ErkJggg=="
        assert.equal(await imgb64(encoded), encoded)
        assert.match(await imgb64("https://example.com/missing"), /^data:image\\/png;base64,/)
        assert.equal(await imgb64("https://example.com/missing", {fallback: false}), null)
        assert.equal(await imgb64("https://example.com/invalid.svg", {fallback: false}), null)
        assert.equal(await imgb64("https://example.com/invalid-raster", {fallback: false}), null)
        assert.equal(await imgb64("data:image/png;base64,bm90IGFuIGltYWdl", {fallback: false}), null)
      }
      finally {
        if (originalFetch)
          globalThis.fetch = originalFetch
        else
          delete globalThis.fetch
      }
    `)
  })

  test("svg.page coordinates concurrent browser recovery", () => {
    run(`
      import assert from "assert/strict"
      import {puppeteer, svg} from "./source/app/metrics/utils.mjs"
      const originalLaunch = puppeteer.launch
      const originalBrowser = svg.resize.browser
      let launches = 0
      let pages = 0
      let closes = 0
      const staleBrowser = {
        async version() {
          throw new Error("Connection closed")
        },
        async close() {
          closes++
        },
      }
      const browser = {
        async version() {
          return "Chrome/shared"
        },
        async newPage() {
          return {id: ++pages}
        },
      }
      svg.resize.browser = staleBrowser
      puppeteer.launch = async () => {
        launches++
        return browser
      }
      try {
        const created = await Promise.all([svg.page("first"), svg.page("second")])
        assert.equal(launches, 1)
        assert.equal(closes, 1)
        assert.deepEqual(created.map(({id}) => id).sort(), [1, 2])
      }
      finally {
        puppeteer.launch = originalLaunch
        svg.resize.browser = originalBrowser
      }
    `)
  })

  test("svg.page keeps a healthy shared browser after a local page failure", () => {
    run(`
      import assert from "assert/strict"
      import {puppeteer, svg} from "./source/app/metrics/utils.mjs"
      const originalLaunch = puppeteer.launch
      const originalBrowser = svg.resize.browser
      let closes = 0
      let launches = 0
      let attempts = 0
      const page = {id: "usable"}
      const browser = {
        async version() {
          return "Chrome/healthy"
        },
        async newPage() {
          attempts++
          if (attempts === 1)
            throw new Error("local page failure")
          return page
        },
        async close() {
          closes++
        },
      }
      svg.resize.browser = browser
      puppeteer.launch = async () => {
        launches++
        return browser
      }
      try {
        await assert.rejects(svg.page("first"), /local page failure/)
        assert.equal(closes, 0)
        assert.equal(launches, 0)
        assert.equal(await svg.page("second"), page)
      }
      finally {
        puppeteer.launch = originalLaunch
        svg.resize.browser = originalBrowser
      }
    `)
  })

  test("svg.page replaces and closes an unavailable browser once", () => {
    run(`
      import assert from "assert/strict"
      import {puppeteer, svg} from "./source/app/metrics/utils.mjs"
      const originalLaunch = puppeteer.launch
      const originalBrowser = svg.resize.browser
      let available = true
      let closes = 0
      let launches = 0
      const page = {id: "recovered"}
      const staleBrowser = {
        async version() {
          if (!available)
            throw new Error("Connection closed")
          return "Chrome/stale"
        },
        async newPage() {
          available = false
          throw new Error("Target closed")
        },
        async close() {
          closes++
        },
      }
      const recoveredBrowser = {
        async version() {
          return "Chrome/recovered"
        },
        async newPage() {
          return page
        },
      }
      svg.resize.browser = staleBrowser
      puppeteer.launch = async () => {
        launches++
        return recoveredBrowser
      }
      try {
        assert.equal(await svg.page("recovery"), page)
        assert.equal(closes, 1)
        assert.equal(launches, 1)
      }
      finally {
        puppeteer.launch = originalLaunch
        svg.resize.browser = originalBrowser
      }
    `)
  })

  test("svg.resize awaits its viewport and closes its page when rendering fails", () => {
    run(`
      import assert from "assert/strict"
      import {svg} from "./source/app/metrics/utils.mjs"
      const originalPage = svg.page
      let closed = 0
      let viewportReady = false
      const page = {
        async setViewport() {
          await Promise.resolve()
          viewportReady = true
        },
        on() {
          return page
        },
        async setContent() {
          assert.equal(viewportReady, true)
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

  test("wakatime aggregates duplicate stats as normalized fractions", () => {
    run(`
      import assert from "assert/strict"
      import wakatime from "./source/plugins/wakatime/index.mjs"
      import stats from "./tests/mocks/wakatime.mjs"
      const result = await wakatime({
        login: "ddarkr",
        q: {wakatime: true},
        data: {},
        account: {},
        imports: {
          axios: {get: async () => ({data: {data: stats}})},
          filters: {text: () => true},
          format: {error(error) { throw error }},
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
      assert.deepEqual(result.projects, [
        {name: "dotfiles", percent: 0.2, total: 200},
        {name: "metrics", percent: 0.15, total: 150},
      ])
      assert.deepEqual(result.languages, [
        {name: "JavaScript", percent: 0.3, total: 300},
        {name: "TypeScript", percent: 0.15, total: 150},
      ])
    `)
  })
})
