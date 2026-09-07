const {execFileSync} = require("node:child_process")
const fs = require("node:fs")
const path = require("node:path")
const registry = JSON.parse(fs.readFileSync(path.join(__dirname, "../source/templates/modern-terminal/partials/_.json"), "utf8"))
let results

beforeAll(() => {
  const output = execFileSync(process.execPath, ["--input-type=module", "--eval", `
    import assert from "node:assert/strict"
    import fs from "node:fs/promises"
    import path from "node:path"
    import {JSDOM} from "jsdom"
    import {fixture} from "./tests/mocks/modern-terminal.mjs"
    const {registry, data, render} = await fixture()
    const p = data.plugins, f = data.f
    const witness = {
      "base.header": () => [data.user.name, data.computed.registration],
      "base.activity+community": () => [data.computed.commits, data.user.issueComments.totalCount],
      "base.repositories": () => [data.computed.diskUsage, data.computed.repositories.stargazers],
      "16personalities": () => [p["16personalities"].type],
      achievements: () => p.achievements.list.map(x => x.title),
      activity: () => p.activity.events.map(x => x.repo),
      anilist: () => [p.anilist.user.name],
      calendar: () => [f(p.calendar.years.reduce((s,y) => s+y.weeks.reduce((s,w) => s+w.contributionDays.reduce((s,d) => s+d.contributionCount,0),0),0))],
      chess: () => [p.chess.meta.White, p.chess.meta.Black, p.chess.meta.Result],
      code: () => [p.code.snippet.filename, p.code.snippet.message],
      contributors: () => Object.keys(p.contributors.list),
      crypto: () => [p.crypto.symbol.toUpperCase(), p.crypto.current_price.toFixed(p.crypto.precision)],
      discussions: () => [p.discussions.started, p.discussions.comments],
      followup: () => [p.followup.issues.open, p.followup.pr.merged],
      fortune: () => [p.fortune.text],
      gists: () => [p.gists.totalCount, p.gists.files],
      habits: () => [p.habits.commits.fetched],
      introduction: () => [p.introduction.text],
      isocalendar: () => [p.isocalendar.streak.max],
      languages: () => p.languages.favorites.map(x => x.name),
      leetcode: () => Object.values(p.leetcode.problems).flatMap(({solved, count}) => [solved.toLocaleString("en-US"), count.toLocaleString("en-US")]),
      licenses: () => [f.license(p.licenses.default)],
      lines: () => p.lines.repos.map(x => x.handle),
      music: () => p.music.tracks.flatMap(x => [x.name, x.artist]),
      nightscout: () => [p.nightscout.data.at(-1).sgv],
      notable: () => p.notable.contributions.map(x => x.name),
      pagespeed: () => p.pagespeed.scores.map(x => x.title),
      people: () => p.people.types.flatMap(type => p.people[type].map(x => x.login)),
      poopmap: () => [p.poopmap.days],
      posts: () => p.posts.list.map(x => x.title),
      projects: () => p.projects.list.map(x => x.name),
      reactions: () => [p.reactions.total, p.reactions.comments],
      repositories: () => p.repositories.list.map(x => x.nameWithOwner || x.name),
      rss: () => p.rss.feed.map(x => x.title),
      screenshot: () => [],
      skyline: () => [],
      splatoon: () => [p.splatoon.player.name, p.splatoon.player.equipment.weapon.name],
      sponsors: () => [f(p.sponsors.count.active.total)],
      sponsorships: () => p.sponsorships.list.map(x => x.login),
      stackoverflow: () => [f(p.stackoverflow.user.reputation)],
      stargazers: () => [f(data.computed.repositories.stargazers)],
      starlists: () => p.starlists.lists.map(x => x.name),
      stars: () => p.stars.repositories.map(x => x.node.nameWithOwner),
      steam: () => [p.steam.player.name],
      stock: () => [p.stock.company, p.stock.symbol, p.stock.price.toFixed(2)],
      support: () => [f(p.support.stats.hearts)],
      tokscale: () => p.tokscale.models.map(x => x.name),
      topics: () => p.topics.list.map(x => x.name.toLowerCase()),
      traffic: () => [f(p.traffic.views.count), f(p.traffic.views.uniques)],
      tweets: () => [p.tweets.username],
      wakatime: () => [p.wakatime.languages[0].name],
    }
    const normalize = value => String(value).replace(/\\s+/g," ").trim()
    const results = {}
    for (const name of registry) {
      results[name] = {}
      for (const state of ["warp-dark", "warp-light", "disabled", ...(!name.startsWith("base.") ? ["error"] : [])]) {
        let dom
        try {
          assert.equal(typeof witness[name], "function", "Missing observable contract")
          if (!name.startsWith("base.")) assert.ok(p[name], "Widget fixture is missing")
          const normal = state.startsWith("warp-")
          const rendered = await render(name, {theme: normal ? state : "warp-dark", state: normal ? "normal" : state})
          dom = new JSDOM(rendered, {contentType: "image/svg+xml"})
          const doc = dom.window.document
          const section = doc.querySelector(".terminal-output")
          if (state === "disabled") assert.equal(section, null, "Disabled widget must not emit a block")
          else if (state === "error") {
            assert.equal(doc.querySelector(".error")?.textContent, "API unavailable <fixture> & retry later")
            assert.equal(doc.querySelector("fixture"), null, "Error text must be escaped")
          }
          else {
            assert.ok(section, "Enabled widget did not render")
            assert.equal(doc.querySelector(".error"), null, "Normal fixture rendered an error")
            const text = normalize(section.textContent)
            assert.ok(!/\\b(?:undefined|NaN)\\b/.test(text), "Unavailable data leaked into output: "+text.slice(0,200))
            const expected = witness[name]()
            if (["screenshot", "skyline"].includes(name)) assert.ok(section.querySelector('img[src^="data:image/"]'), "Image content must be present and self-contained")
            else {
              assert.ok(expected.length, "No observable fixture values selected")
              for (const value of expected) {
                assert.ok(value !== undefined && value !== null && String(value).length, "Missing fixture witness")
                assert.ok(text.includes(normalize(value)), "Missing rendered value: "+value)
              }
            }
            for (const use of doc.querySelectorAll("use")) assert.ok(doc.getElementById(use.getAttribute("href").slice(1)), "Unresolved icon")
            if (process.env.METRICS_WIDGET_OUTPUT) {
              await fs.mkdir(process.env.METRICS_WIDGET_OUTPUT, {recursive:true})
              await fs.writeFile(path.join(process.env.METRICS_WIDGET_OUTPUT, name+"."+state+".svg"), rendered)
            }
          }
          results[name][state] = null
        }
        catch (error) { results[name][state] = error.message }
        finally { dom?.window.close() }
      }
    }
    console.log("WIDGET_RESULTS="+JSON.stringify(results))
  `], {cwd: path.join(__dirname, ".."), encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 120000})
  results = JSON.parse(output.split("WIDGET_RESULTS=").at(-1).trim())
}, 130000)

describe.each(registry)("modern-terminal widget %s", name => {
  test.each(["warp-dark", "warp-light"])("renders actual data in %s", theme => {
    expect(results[name][theme]).toBeNull()
  })
  test("omits disabled content", () => {
    expect(results[name].disabled).toBeNull()
  })
  if (!name.startsWith("base.")) test("renders escaped service errors", () => {
    expect(results[name].error).toBeNull()
  })
})
