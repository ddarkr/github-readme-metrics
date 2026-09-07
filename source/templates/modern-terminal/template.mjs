/**Terminal report processor. Public presentation inputs are defined by core metadata. */
export default async function({q}, {data, account}, {imports}) {
  const inputs = imports.metadata.plugins.core.inputs({data, account, q})
  data.terminal = {
    theme: inputs["config.terminal.theme"],
    density: inputs["config.terminal.density"],
    dividers: inputs["config.terminal.dividers"],
    animations: inputs["config.terminal.animations"],
  }
  q.raw = true

  if (q.repo)
    await imports.templates.repository(...arguments)
  else
    await imports.plugins.core(...arguments)
}
