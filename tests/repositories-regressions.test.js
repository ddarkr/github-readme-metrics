const processes = require("child_process")

const run = script => processes.execFileSync("node", ["--input-type", "module", "--eval", script], {stdio: "pipe"})

const harness = (batch, graphqlBody) => `
  import assert from "assert/strict"
  import base from "./source/plugins/base/index.mjs"
  import {user, node, bulk} from "./tests/mocks/repositories.mjs"
  const queries = {user: () => "BASE", "user.x": () => "BULK", repositories: vars => JSON.stringify(vars)}
  const imports = {
    metadata: {plugins: {base: {
      inputs: () => ({indepth: false, hireable: false, skip: false, "repositories.forks": false, "repositories.affiliations": ["owner"], "repositories.batch": ${batch}, "repositories.skipped": [], "users.ignored": [], "commits.authoring": ["ddarkr"]}),
    }}},
    filters: {},
    format: {error(error) { throw error }},
  }
  const rest = {search: {commits: async () => ({data: {total_count: 0}})}, packages: {listPackagesForUser: async () => { throw new Error("no scope") }}}
  const conf = {settings: {repositories: 100, plugins: {base: {parts: ["header"]}}}, authenticated: "other"}
  ${graphqlBody}
`

describe("repositories regressions", () => {
  test("base retries the same page after a failed repositories request instead of returning zero nodes", () => {
    run(harness(2, `
      const pages = [[node("alpha")], [node("beta")], []]
      let calls = 0
      const graphql = async query => {
        if (query === "BASE")
          return {user}
        if (query === "BULK")
          return {user: bulk}
        const vars = JSON.parse(query)
        if (vars.type === "repositoriesContributedTo")
          return {user: {repositoriesContributedTo: {edges: [], nodes: []}}}
        calls++
        if (calls === 1)
          throw new Error("Something went wrong while executing your query")
        const page = pages[Math.min(calls - 2, pages.length - 1)]
        return {user: {repositories: page.length ? {edges: [{cursor: "CURSOR" + calls}], nodes: page} : {edges: [], nodes: []}}}
      }
      const data = {base: {}}
      await base({login: "ddarkr", graphql, rest, data, q: {}, queries: {base: queries}, imports, callbacks: null}, conf)
      assert.deepEqual(data.user.repositories.nodes.map(repository => repository.name), ["alpha", "beta"])
      assert.equal(data.user.repositories.nodes.reduce((sum, repository) => sum + repository.stargazers.totalCount, 0), 4)
      assert.equal(data.user.repositories.nodes.reduce((sum, repository) => sum + repository.forkCount, 0), 6)
    `))
  })

  test("base keeps paginating full pages smaller than the repositories target", () => {
    run(harness(25, `
      const pages = [Array.from({length: 25}, (_, index) => node("repo-" + index)), Array.from({length: 10}, (_, index) => node("extra-" + index)), []]
      let calls = 0
      const graphql = async query => {
        if (query === "BASE")
          return {user}
        if (query === "BULK")
          return {user: bulk}
        const vars = JSON.parse(query)
        if (vars.type === "repositoriesContributedTo")
          return {user: {repositoriesContributedTo: {edges: [], nodes: []}}}
        const page = pages[Math.min(calls++, pages.length - 1)]
        return {user: {repositories: page.length ? {edges: [{cursor: "CURSOR" + calls}], nodes: page} : {edges: [], nodes: []}}}
      }
      const data = {base: {}}
      await base({login: "ddarkr", graphql, rest, data, q: {}, queries: {base: queries}, imports, callbacks: null}, conf)
      assert.equal(data.user.repositories.nodes.length, 35)
    `))
  })
})
