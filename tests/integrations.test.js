const processes = require("child_process")

const run = script => processes.execFileSync("node", ["--input-type", "module", "--eval", script], {stdio: "pipe"})

describe("plugin integrations", () => {
  test("Tokscale encodes usernames, honors zero model limit, and leaves API models untouched", () => {
    run(`
      import assert from "assert/strict"
      import tokscale from "./source/plugins/community/tokscale/index.mjs"
      import {tokscaleResponses} from "./tests/mocks/tokscale.mjs"
      const response = structuredClone(tokscaleResponses.valid)
      let requested = ""
      const imports = {
        axios: {get: async url => (requested = url, {data: response})},
        format: {error: error => error},
        metadata: {plugins: {tokscale: {
          enabled: () => true,
          inputs: () => ({user: "doda/name", sections: ["models"], "models.limit": 0}),
        }}},
      }
      const result = await tokscale({login: "tester", q: {tokscale: true}, imports, data: {}, account: "bypass"}, {enabled: true})
      assert.equal(requested, "https://tokscale.ai/api/users/doda%2Fname")
      assert.deepEqual(result.models, [])
      assert.deepEqual(response.modelUsage.map(({model}) => model), ["claude-opus-4-5-thinking", "gpt-5.3-codex", "gemini-3-pro-preview", "claude-sonnet-4-5", "gpt-5.2"])
    `)
  })

  test("Tokscale rejects malformed required response structures", () => {
    run(`
      import assert from "assert/strict"
      import tokscale from "./source/plugins/community/tokscale/index.mjs"
      import {tokscaleResponses} from "./tests/mocks/tokscale.mjs"
      const imports = {
        axios: {get: async () => ({data: tokscaleResponses.malformedUser})},
        format: {error: error => error},
        metadata: {plugins: {tokscale: {
          enabled: () => true,
          inputs: () => ({user: "ddarkr", sections: [], "models.limit": 5}),
        }}},
      }
      await assert.rejects(
        tokscale({login: "tester", q: {tokscale: true}, imports, data: {}, account: "bypass"}, {enabled: true}),
        error => /^Tokscale API response is invalid:/.test(error.error?.message ?? "") && !/TypeError/.test(error.error.instance),
      )
    `)
  })

  test("Koito normalizes instance URLs, sends optional Token auth, and maps recent tracks", () => {
    run(`
      import assert from "assert/strict"
      import music from "./source/plugins/music/index.mjs"
      import {koitoResponses} from "./tests/mocks/koito.mjs"
      let request
      const imports = {
        axios: {get: async (url, options) => (request = {url, options}, {data: koitoResponses.recent})},
        format: {error: error => error, date: (_, {time}) => time ? "12:00" : "01/09/2026"},
        imgb64: async artwork => artwork,
        metadata: {plugins: {music: {
          enabled: () => true,
          extras: () => true,
          inputs: () => ({provider: "koito", mode: "recent", playlist: "", limit: 4, user: "https://music-stats.doda.im///?ignored=true", "played.at": true, "time.range": "short", "top.type": "tracks", token: ""}),
        }}},
      }
      const result = await music({login: "tester", q: {music: true}, imports, data: {}, account: "bypass"}, {enabled: true, token: " api-key "})
      assert.equal(request.url, "https://music-stats.doda.im/apis/web/v1/listens?limit=4")
      assert.equal(request.options.headers.Authorization, "Token api-key")
      assert.deepEqual(result.tracks, [{name: "A deterministic track", artist: "A deterministic artist", artwork: "https://music-stats.doda.im/image/small/track-1", played_at: "12:00 on 01/09/2026"}])
    `)
  })

  test("Koito maps current top artist and track endpoints from ranked items", () => {
    run(`
      import assert from "assert/strict"
      import music from "./source/plugins/music/index.mjs"
      import {koitoResponses} from "./tests/mocks/koito.mjs"
      for (const {topType, response, expected} of [
        {topType: "artists", response: koitoResponses.topArtists, expected: {name: "A deterministic artist", artist: "Play count: 42", artwork: "https://music-stats.doda.im/image/small/artist-2"}},
        {topType: "tracks", response: koitoResponses.topTracks, expected: {name: "A deterministic track", artist: "A deterministic artist", artwork: "https://music-stats.doda.im/image/small/track-1"}},
      ]) {
        let request
        const imports = {
          axios: {get: async (url, options) => (request = {url, options}, {data: response})},
          format: {error: error => error},
          imgb64: async artwork => artwork,
          metadata: {plugins: {music: {
            enabled: () => true,
            extras: () => true,
            inputs: () => ({provider: "koito", mode: "top", playlist: "", limit: 4, user: "https://music-stats.doda.im", "played.at": false, "time.range": "long", "top.type": topType, token: ""}),
          }}},
        }
        const result = await music({login: "tester", q: {music: true}, imports, data: {}, account: "bypass"}, {enabled: true})
        assert.match(request.url, new RegExp("/apis/web/v1/top/" + topType + "\\\\?limit=4&period=all_time$"))
        assert.equal(request.options.headers.Authorization, undefined)
        assert.deepEqual(result.tracks, [expected])
      }
    `)
  })

  test("Koito exposes malformed payloads and API failures", () => {
    run(`
      import assert from "assert/strict"
      import music from "./source/plugins/music/index.mjs"
      import {koitoResponses} from "./tests/mocks/koito.mjs"
      const baseImports = response => ({
        axios: {get: async () => {
          if (response instanceof Error || response.isAxiosError)
            throw response
          return {data: response}
        }},
        format: {error: error => error, date: () => "unused"},
        imgb64: async artwork => artwork,
        metadata: {plugins: {music: {
          enabled: () => true,
          extras: () => true,
          inputs: () => ({provider: "koito", mode: "recent", playlist: "", limit: 4, user: "https://music-stats.doda.im", "played.at": false, "time.range": "short", "top.type": "tracks", token: ""}),
        }}},
      })
      const invoke = imports => music({login: "tester", q: {music: true}, imports, data: {}, account: "bypass"}, {enabled: true})
      await assert.rejects(
        invoke(baseImports(koitoResponses.malformed)),
        error => /^Koito API response is invalid:/.test(error.error?.message ?? "") && !/TypeError/.test(error.error.instance),
      )
      await assert.rejects(
        invoke(baseImports(koitoResponses.unauthorized)),
        error => /^Koito API returned 401/.test(error.error?.message ?? "") && error.error.instance?.error === "unauthorized",
      )
    `)
  })
})
