const processes = require("child_process")

const run = script => processes.execFileSync("node", ["--input-type", "module", "--eval", script], {stdio: "pipe"})

describe("habits push-event regressions", () => {
  test("habits resolves real commits from current before/head PushEvent shape", () => {
    run(`
      import assert from "assert/strict"
      import habits from "./source/plugins/habits/index.mjs"
      import fixtures from "./tests/mocks/habits.mjs"
      let compared = null
      const rest = {
        activity: {listEventsForAuthenticatedUser: async () => ({data: [fixtures.currentEvent]})},
        repos: {compareCommitsWithBasehead: async args => {
          compared = args
          return ({data: {commits: [fixtures.compare]}})
        }},
        request: async url => {
          assert.equal(url, "https://api.github.com/repos/o/r/commits/HEAD_SHA")
          return ({data: fixtures.detail})
        },
      }
      const imports = {
        metadata: {plugins: {habits: {
          enabled: () => true,
          extras: () => false,
          inputs: () => ({from: 100, days: 14, facts: true, charts: false, "charts.type": "none", trim: false, "languages.limit": 0, "languages.threshold": "0%", skipped: []}),
        }}},
        filters: {repo: () => true},
        paths: {basename: path => path.split("/").pop()},
        format: {error(error) { throw error }},
      }
      const data = {shared: {"repositories.skipped": [], "commits.authoring": ["ddarkr"]}, config: {}}
      const result = await habits({login: "ddarkr", data, rest, imports, q: {habits: true}, account: "user"}, {enabled: true})
      assert.deepEqual(compared, {owner: "o", repo: "r", basehead: "BEFORE_SHA...HEAD_SHA"})
      assert.equal(result.commits.fetched, 1)
      assert.equal(result.lines.average.chars, 14)
    `)
  })

  test("habits keeps supporting legacy embedded-commits PushEvent shape", () => {
    run(`
      import assert from "assert/strict"
      import habits from "./source/plugins/habits/index.mjs"
      import fixtures from "./tests/mocks/habits.mjs"
      const rest = {
        activity: {listEventsForAuthenticatedUser: async () => ({data: [fixtures.legacyEvent]})},
        repos: {compareCommitsWithBasehead: async () => { throw new Error("must not be called for legacy shape") }},
        request: async url => {
          assert.equal(url, "https://api.github.com/repos/o/r/commits/MOCKED_SHA")
          return ({data: fixtures.legacyDetail})
        },
      }
      const imports = {
        metadata: {plugins: {habits: {
          enabled: () => true,
          extras: () => false,
          inputs: () => ({from: 100, days: 14, facts: true, charts: false, "charts.type": "none", trim: false, "languages.limit": 0, "languages.threshold": "0%", skipped: []}),
        }}},
        filters: {repo: () => true},
        paths: {basename: path => path.split("/").pop()},
        format: {error(error) { throw error }},
      }
      const data = {shared: {"repositories.skipped": [], "commits.authoring": ["ddarkr"]}, config: {}}
      const result = await habits({login: "ddarkr", data, rest, imports, q: {habits: true}, account: "user"}, {enabled: true})
      assert.equal(result.commits.fetched, 1)
      assert.equal(result.lines.average.chars, 12.5)
    `)
  })

  test("recent analyzer produces observable editions from resolved compare commits", () => {
    run(`
      import assert from "assert/strict"
      import {RecentAnalyzer} from "./source/plugins/languages/analyzer/recent.mjs"
      import fixtures from "./tests/mocks/habits.mjs"
      const rest = {
        activity: {listEventsForAuthenticatedUser: async () => ({data: [fixtures.currentEvent]})},
        repos: {compareCommitsWithBasehead: async () => ({data: {commits: [fixtures.compare]}})},
        request: async () => ({data: fixtures.detail}),
      }
      const analyzer = new RecentAnalyzer("ddarkr", {rest, authoring: [], load: 100, days: 0})
      const patches = await analyzer.patches()
      assert.equal(patches.length, 1)
      assert.equal(patches[0].sha, "HEAD_SHA")
      assert.equal(patches[0].editions[0].path, "src/app.mjs")
      assert.equal(patches[0].editions[0].added.lines, 2)
    `)
  })

  test("pushEventCommits swallows only inaccessible ranges and resolves branch creation via head commit", () => {
    run(`
      import assert from "assert/strict"
      import {pushEventCommits} from "./source/plugins/languages/analyzer/recent.mjs"
      import fixtures from "./tests/mocks/habits.mjs"
      for (const status of [404, 409, 422]) {
        const failing = {repos: {compareCommitsWithBasehead: async () => { throw Object.assign(new Error("inaccessible"), {status}) }}}
        assert.deepEqual(await pushEventCommits(failing, [fixtures.currentEvent]), [])
      }
      const rateLimited = {repos: {compareCommitsWithBasehead: async () => { throw Object.assign(new Error("rate limited"), {status: 403}) }}}
      await assert.rejects(pushEventCommits(rateLimited, [fixtures.currentEvent]), /rate limited/)
      const branch = {repos: {
        compareCommitsWithBasehead: async () => { throw new Error("no range exists for branch creation") },
        getCommit: async args => {
          assert.deepEqual(args, {owner: "o", repo: "r", ref: "HEAD_SHA"})
          return ({data: fixtures.compare})
        },
      }}
      const resolved = await pushEventCommits(branch, [fixtures.branchEvent])
      assert.equal(resolved.length, 1)
      assert.equal(resolved[0].sha, "HEAD_SHA")
      assert.equal(resolved[0].author.email, "ddarkr@example.com")
      assert.equal(resolved[0].url, "https://api.github.com/repos/o/r/commits/HEAD_SHA")
      const legacy = await pushEventCommits({}, [fixtures.legacyEvent])
      assert.deepEqual(legacy.map(({sha}) => sha), ["MOCKED_SHA"])
    `)
  })
})
