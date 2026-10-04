const processes = require("child_process")

const run = script => processes.execFileSync(process.execPath, ["--input-type", "module", "--eval", script], {cwd: require("path").join(__dirname, ".."), stdio: "pipe"})

describe("rendered data contracts", () => {
  test("calendar displays the contribution counts returned by GitHub", () => {
    run(`
      import assert from "node:assert/strict"
      import ejs from "ejs"
      import {JSDOM} from "jsdom"
      import fixture from "./tests/mocks/api/github/graphql/isocalendar.calendar.mjs"
      import {formatters} from "./source/app/metrics/utils.mjs"
      const response = fixture({
        faker: {number: {int: () => 10}},
        login: "calendar-user",
        query: 'from: "2026-01-01T00:00:00.000Z" to: "2026-01-18T00:00:00.000Z"',
      })
      const plugins = {calendar: {years: [{year: 2026, weeks: response.user.calendar.contributionCalendar.weeks}]}}
      const html = await ejs.renderFile("source/templates/modern-terminal/partials/calendar.ejs", {
        plugins, meta: {$: ""}, f: formatters().format,
      }, {async: true})
      const document = new JSDOM(html)
      try {
        assert.equal(document.window.document.querySelector("dd").textContent.trim(), "102")
      }
      finally {
        document.window.close()
      }
    `)
  })
  test("line history axes remain inside the chart at narrow report widths", () => {
    run(`
      import assert from "node:assert/strict"
      import {puppeteer} from "./source/app/metrics/utils.mjs"
      import {fixture} from "./tests/mocks/modern-terminal.mjs"
      const {render} = await fixture()
      const browser = await puppeteer.launch()
      try {
        const page = await browser.newPage()
        await page.setContent(await render("lines"))
        for (const width of [320, 480]) {
          await page.evaluate(width => document.querySelector("svg").setAttribute("width", width), width)
          const clipped = await page.evaluate(() => {
            const chart = document.querySelector(".report-chart svg")
            const bounds = chart.getBoundingClientRect()
            return [...chart.querySelectorAll("text")].filter(label => {
              const box = label.getBoundingClientRect()
              return box.left < bounds.left - 1 || box.right > bounds.right + 1 ||
                box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1
            }).map(label => label.textContent)
          })
          assert.deepEqual(clipped, [], "Clipped axis labels at " + width + "px")
        }
      }
      finally {
        await browser.close()
      }
    `)
  })


  test("terminal table measurements remain readable in dark and light raster renders", () => {
    run(`
      import assert from "node:assert/strict"
      import {puppeteer} from "./source/app/metrics/utils.mjs"
      import {fixture} from "./tests/mocks/modern-terminal.mjs"
      const {render} = await fixture()
      const browser = await puppeteer.launch()
      try {
        const page = await browser.newPage()
        for (const theme of ["warp-dark", "warp-light"]) {
          await page.setContent(await render("habits", {theme}))
          const {report, measurement} = await page.evaluate(() => {
            const appearance = element => {
              const style = getComputedStyle(element)
              return {color: style.color, font: style.fontFamily}
            }
            return {
              report: appearance(document.querySelector(".terminal-report")),
              measurement: appearance(document.querySelector("tbody td.tui-number")),
            }
          })
          assert.deepEqual(measurement, report, "Table measurements must inherit the report theme in " + theme)
        }
      }
      finally {
        await browser.close()
      }
    `)
  })

  test("SVG verification rejects malformed XML before browser rendering", () => {
    run(`
      import assert from "node:assert/strict"
      import metrics from "./source/app/metrics/index.mjs"
      const conf = {
        settings: {templates: {default: "fixture", enabled: []}},
        templates: {fixture: {image: '<svg xmlns="http://www.w3.org/2000/svg"><g></svg>', style: "", fonts: "", views: [], partials: []}},
        metadata: {
          templates: {fixture: {formats: ["svg"]}},
          plugins: {core: {
            inputs: () => ({"debug.flags": [], "experimental.features": [], "config.order": []}),
            extras: () => true,
          }},
        },
      }
      await assert.rejects(
        metrics({login: "fixture", q: {}}, {conf, plugins: {}, verify: true}, {
          Plugins: {base: async () => {}}, Templates: {fixture: async () => {}},
        }),
        error => error.name === "SyntaxError",
      )
    `)
  })
})
