/**Template processor */
export default async function({q}, _, {imports}) {
  //Core
  await imports.plugins.core(...arguments)

  //Enable modern terminal features
  q.raw = true
  q.terminalTheme = "modern-dark"

  //Add custom properties for modern terminal
  q.terminal = {
    cursorBlink: true,
    fontSize: "14px",
    lineHeight: "1.5",
    padding: "20px"
  }
}
