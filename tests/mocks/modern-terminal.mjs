import fs from "node:fs/promises"
import path from "node:path"
import {fileURLToPath} from "node:url"
import {createRequire} from "node:module"
import ejs from "ejs"
import {faker} from "@faker-js/faker"
import metadata from "../../source/app/metrics/metadata.mjs"
import {linesFixture} from "./lines.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const template = path.join(root, "source/templates/modern-terminal")
const assets = path.join(root, "source/app/web/statics/embed/placeholders")
const require = createRequire(import.meta.url)

export async function fixture() {
  await metadata({log: false})
  const registry = JSON.parse(await fs.readFile(path.join(template, "partials/_.json"), "utf8"))
  const image = await fs.readFile(path.join(template, "image.svg"), "utf8")
  const style = await fs.readFile(path.join(template, "style.css"), "utf8")
  const options = Object.fromEntries(Object.entries(metadata.inputs).map(([key, input]) => [key.replace(/^plugin_/, "").replaceAll("_", "."), input.default]))
  for (const [key, input] of Object.entries(metadata.inputs)) {
    const option = key.replace(/^plugin_/, "").replaceAll("_", ".")
    if (key.startsWith("plugin_") && key.endsWith("_sections") && Array.isArray(input.values))
      options[option] = input.values.join(", ")
    if (input.type === "number" && /(?:^|\.)limit(?:\.|$)/.test(option))
      options[option] = Math.max(input.min || 1, Math.min(Number(input.default) || 3, 4))
  }
  Object.assign(options, {
    repo: "", "repositories.featured": "ddarkr/metrics", "languages.details": "percentage, bytes-size",
    "people.types": "followers, following", "activity.limit": 12, "reactions.details": "count, percentage",
    "habits.charts": true, "habits.facts": true, "pagespeed.detailed": true, "stargazers.charts": true,
    "stargazers.worldmap": true, "posts.descriptions": true, "posts.covers": true,
    "contributors.contributions": true, "licenses.ratio": true, "licenses.legal": true,
    "sponsors.past": true, "projects.descriptions": true,
    "stock.symbol": "AAPL", "chess.user": "ddarkr",
  })
  const sources = new Map()
  for (const name of await fs.readdir(path.join(template, "partials"))) {
    if (name.endsWith(".ejs")) sources.set(`partials/${name}`, await fs.readFile(path.join(template, "partials", name), "utf8"))
  }
  let captured
  const originalFetch = globalThis.fetch
  const originalRandom = Math.random
  faker.seed(42)
  faker.setDefaultRefDate("2026-01-15T12:00:00Z")
  Math.random = () => faker.number.float({min: 0, max: 0.999999})
  globalThis.fetch = async url => {
    if (!String(url).startsWith("/.placeholders/")) throw new Error(`Unexpected fixture fetch: ${url}`)
    return new Response(await fs.readFile(path.join(assets, path.basename(url))))
  }
  try {
    require("../../source/app/web/statics/embed/app.placeholder.js")
    globalThis.placeholder.init({faker, ejs: {...ejs, render(source, data, options) {
      if (source === image) { captured = data; return "" }
      return ejs.render(source, data, options)
    }}, axios: {async get(url) {
      const suffix = decodeURIComponent(url.replace("/.templates/modern-terminal", ""))
      return {data: suffix ? sources.get(suffix.slice(1)) : {image, style, fonts: "", partials: registry}}
    }}})
    await globalThis.placeholder({templates: {selected: "modern-terminal"}, plugins: {
      enabled: {base: {header: true, activity: true, community: true, repositories: true, metadata: true}, ...Object.fromEntries(registry.filter(name => !name.startsWith("base.")).map(name => [name, true]))}, options,
    }, config: {}, version: "fixture", user: "ddarkr", avatar: ""})
    // Resolve lazy preview getters while the seeded random source is active.
    captured.plugins = Object.fromEntries(Object.entries(captured.plugins))
  }
  finally {
    globalThis.fetch = originalFetch
    Math.random = originalRandom
  }
  if (!captured) throw new Error("Placeholder data was not generated")
  captured.plugins.lines = await linesFixture()
  const localImages = new Map()
  async function render(name, {theme = "warp-dark", state = "normal"} = {}) {
    const isBase = name.startsWith("base.")
    const data = {...captured, terminal: {...captured.terminal, theme}, partials: [name], base: {...captured.base}, plugins: {...captured.plugins}}
    if (state === "disabled") {
      if (isBase) data.base = {}
      else delete data.plugins[name]
    }
    if (state === "error") data.plugins[name] = {error: {message: "API unavailable <fixture> & retry later"}}
    data.include = async (file, locals = {}) => ejs.render(sources.get(file), {...data, ...locals}, {async: true, filename: file})
    let rendered = await ejs.render(image, data, {async: true})
    for (const match of rendered.matchAll(/src="(\/\.placeholders\/([^"]+))"/g)) {
      if (!localImages.has(match[1])) localImages.set(match[1], `data:image/png;base64,${(await fs.readFile(path.join(assets, path.basename(match[2])))).toString("base64")}`)
      rendered = rendered.replaceAll(match[1], localImages.get(match[1]))
    }
    return rendered
  }
  return {registry, data: captured, render}
}
