import * as d3 from "d3"
import {D3node} from "../../source/app/metrics/utils.mjs"
import lines from "../../source/plugins/lines/index.mjs"
import contributors from "./api/github/rest/repos/getContributorsStats.mjs"

/** Exercise the real chart generator with the existing contributor response fixture. */
export async function linesFixture() {
  let week = 0, value = 0
  const response = await contributors({faker: {
    number: {int: () => [240, 80, 20, 600, 160, 40][value++ % 6]},
    // GitHub's contributor weeks use Unix seconds, not Date objects.
    date: {recent: () => Date.UTC(2026, 0, 4 + 7 * week++) / 1000},
  }}, null, null, [{owner: "ddarkr", repo: "metrics"}])
  return lines({
    login: "ddarkr", q: {lines: true}, account: "user",
    data: {shared: {"repositories.skipped": []}, user: {repositories: {nodes: [{name: "metrics", owner: {login: "ddarkr"}}]}}},
    imports: {d3, D3node, filters: {repo: () => true}, metadata: {plugins: {lines: {
      enabled: () => true,
      inputs: () => ({skipped: [], sections: ["repositories", "history"], "repositories.limit": 4, "history.limit": 0, delay: 0}),
    }}}},
    rest: {repos: {getContributorsStats: async () => response}},
  }, {enabled: true})
}
