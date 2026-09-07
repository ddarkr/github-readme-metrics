//Imports
const processes = require("child_process")
const yaml = require("js-yaml")
const fs = require("fs")
const path = require("path")
const url = require("url")
const axios = require("axios")
const faker = require("@faker-js/faker").faker
const ejs = require("ejs")

//GitHub action
const action = yaml.load(fs.readFileSync(path.join(__dirname, "../action.yml"), "utf8"))
action.defaults = Object.fromEntries(Object.entries(action.inputs).map(([key, {default: value}]) => [key, value]))
action.input = vars => Object.fromEntries([...Object.entries(action.defaults), ...Object.entries(vars)].map(([key, value]) => [`INPUT_${key.toLocaleUpperCase()}`, value]))
action.run = async vars =>
  await new Promise((solve, reject) => {
    let [stdout, stderr] = ["", ""]
    const env = {...process.env, ...action.input(vars), SANDBOX: true, GITHUB_REPOSITORY: "ddarkr/metrics"}
    const child = processes.spawn("node", ["source/app/action/index.mjs"], {env})
    child.stdout.on("data", data => stdout += data)
    child.stderr.on("data", data => stderr += data)
    child.on("close", code => {
      if (code === 0)
        return solve(true)
      console.log(stdout, stderr)
      reject(stdout)
    })
  })

//Web instance
const web = {}
web.run = async vars => (await axios.get(`http://127.0.0.1:${web.port}/lowlighter?${new url.URLSearchParams(Object.fromEntries(Object.entries(vars).map(([key, value]) => [key.replace(/^plugin_/, "").replace(/_/g, "."), value])))}`)).status === 200
web.start = async () =>
  new Promise((solve, reject) => {
    let output = ""
    web.instance = processes.spawn(process.execPath, ["source/app/web/index.mjs"], {env: {...process.env, SANDBOX: true, PORT: "0"}})
    const timer = setTimeout(() => {
      web.instance.kill("SIGKILL")
      reject(new Error(`Sandbox did not become ready:\n${output}`))
    }, 20000)
    const fail = error => {
      clearTimeout(timer)
      reject(error)
    }
    web.instance.once("error", fail)
    web.instance.once("exit", code => fail(new Error(`Sandbox exited (${code}):\n${output}`)))
    web.instance.stdout.on("data", chunk => {
      output += chunk
      if (!output.includes("Server ready !"))
        return
      web.port = Number(output.match(/Listening on port\s+│\s+(\d+)/)?.[1])
      clearTimeout(timer)
      if (!web.port)
        return reject(new Error(`Sandbox did not report its port:\n${output}`))
      solve()
    })
    web.instance.stderr.on("data", chunk => output += chunk)
  })
web.stop = async () => await web.instance.kill("SIGKILL")

//Web instance placeholder
require("./../source/app/web/statics/embed/app.placeholder.js")
const placeholder = globalThis.placeholder
delete globalThis.placeholder
placeholder.init({
  faker,
  ejs,
  axios: {
    async get(url) {
      return axios.get(`http://127.0.0.1:${web.port}${url}`)
    },
  },
})
const boolean = value => /^(?:true|on|yes|1)$/i.test(`${value}`)
const parsed = value => (typeof value === "string") && /^(?:true|on|yes|1|false|off|no|0)$/i.test(value) ? boolean(value) : value
placeholder.run = async vars => {
  const inputs = {
    ...Object.fromEntries(Object.entries(metadata.inputs).filter(([_, input]) => "default" in input).map(([key, {default: value}]) => [key, value])),
    ...vars,
  }
  const options = Object.fromEntries(Object.entries(inputs).map(([key, value]) => [
    key.replace(/^plugin_/, "").replace(/_/g, "."),
    metadata.inputs[key]?.type === "boolean" ? boolean(value) : metadata.inputs[key] ? value : parsed(value),
  ]))
  const enabled = Object.fromEntries(Object.entries(inputs)
    .filter(([key]) => /^plugin_[\da-z]+$/i.test(key))
    .map(([key, value]) => [key.replace(/^plugin_/, ""), boolean(value)]))
  const config = Object.fromEntries(Object.entries(options).filter(([key]) => /^config[.]/.test(key)).map(([key, value]) => [key.replace(/^config[.]/, ""), value]))
  const base = Object.fromEntries(
    (Array.isArray(options.base) ? options.base : `${options.base ?? ""}`.split(","))
      .map(part => part.trim())
      .filter(part => metadata.inputs.base.values.includes(part))
      .map(part => [part, true]),
  )
  for (const part of metadata.inputs.base.values)
    if (`base.${part}` in options)
      base[part] = boolean(options[`base.${part}`])
  return await placeholder({
    templates: {selected: vars.template},
    plugins: {enabled: {...enabled, base}, options},
    config,
    version: "TEST",
    user: "lowlighter",
    avatar: "https://github.com/lowlighter.png",
  })
}

//Setup
beforeAll(async () => {
  //Clean community template
  await fs.promises.rm(path.join(__dirname, "../source/templates/@classic"), {recursive: true, force: true})
  //Start web instance
  await web.start()
})
//Teardown
afterAll(async () => {
  //Stop web instance
  await web.stop()
  //Clean community template
  await fs.promises.rm(path.join(__dirname, "../source/templates/@classic"), {recursive: true, force: true})
})

//Load metadata (as jest doesn't support ESM modules, we use this dirty hack)
const metadata = JSON.parse(`${
  processes.spawnSync("node", [
    "--input-type",
    "module",
    "--eval",
    'import metadata from "./source/app/metrics/metadata.mjs";const loaded=await metadata({log:false});console.log(JSON.stringify({...loaded,inputs:metadata.inputs}))',
  ]).stdout
}`)

//Build tests index
const tests = []
for (const type of ["plugins", "templates"]) {
  for (const name in metadata[type]) {
    const cases = yaml
      .load(fs.readFileSync(path.join(__dirname, "../tests/cases", `${name}.${type.replace(/s$/, "")}.yml`), "utf8"))
      ?.map(({name: test, with: inputs, modes = [], timeout}) => {
        const target = inputs.template?.replace(/^@/, "") ?? name
        const skip = new Set(type === "plugins"
          ? Object.entries(metadata.templates).filter(([_, {readme: {compatibility}}]) => !compatibility[name]).map(([template]) => template)
          : Object.keys(metadata.templates).filter(template => template !== target))
        if (!(metadata[type][name].supports?.includes("repository")))
          skip.add("repository")
        return [test, inputs, {skip: [...skip], modes, timeout}]
      }) ?? []
    tests.push(...cases)
  }
}

//Tests run
describe("GitHub Action", () =>
  describe.each([
    ["classic", {}],
    ["terminal", {}],
    ["modern-terminal", {}],
    ["repository", {repo: "metrics"}],
  ])("Template : %s", (template, query) => {
    for (const [name, input, {skip = [], modes = [], timeout} = {}] of tests) {
      if ((skip.includes(template)) || ((modes.length) && (!modes.includes("action"))))
        test.skip(name, () => null)
      else
        test(name, async () => expect(await action.run({template, base: "", query: JSON.stringify(query), plugins_errors_fatal: true, dryrun: true, use_mocked_data: true, verify: true, retries: 1, ...input})).toBe(true), timeout)
    }
  }))

describe("Web instance", () =>
  describe.each([
    ["classic", {}],
    ["terminal", {}],
    ["modern-terminal", {}],
    ["repository", {repo: "metrics"}],
  ])("Template : %s", (template, query) => {
    for (const [name, input, {skip = [], modes = [], timeout} = {}] of tests) {
      if ((skip.includes(template)) || ((modes.length) && (!modes.includes("web"))))
        test.skip(name, () => null)
      else
        test(name, async () => expect(await web.run({template, base: 0, ...query, plugins_errors_fatal: true, verify: true, ...input})).toBe(true), timeout)
    }
  }))

describe("Web instance (placeholder)", () =>
  describe.each([
    ["classic", {}],
    ["terminal", {}],
    ["modern-terminal", {}],
  ])("Template : %s", (template, query) => {
    for (const [name, input, {skip = [], modes = [], timeout} = {}] of tests) {
      if ((skip.includes(template)) || input.repo || ((modes.length) && (!modes.includes("placeholder"))))
        test.skip(name, () => null)
      else
        test(name, async () => {
          const rendered = await placeholder.run({template, ...query, ...input})
          expect(rendered).toMatch(/<svg\b/)
        }, timeout)
    }
  }))
