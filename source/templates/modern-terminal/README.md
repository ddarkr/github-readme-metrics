<!--header-->
<table>
  <tr><td colspan="2"><a href="/README.md#%EF%B8%8F-templates">← Back to templates index</a></td></tr>
  <tr><th colspan="2"><h3>Modern Terminal</h3></th></tr>
  <tr><td colspan="2" align="center"><p>A Warp-inspired terminal theme with Powerline prompts and embedded vector icons.
Compact key/value rows, aligned data tables, text distributions, and activity trees
inside command/output blocks, with dark/light themes and configurable density.</p>
</td></tr>
  <tr>
    <th rowspan="3">Supported features<br><sub><a href="metadata.yml">→ Full specification</a></sub></th>
    <td><a href="/source/plugins/achievements/README.md" title="🏆 Achievements">🏆</a> <a href="/source/plugins/activity/README.md" title="📰 Recent activity">📰</a> <a href="/source/plugins/anilist/README.md" title="🌸 Anilist watch list and reading list">🌸</a> <a href="/source/plugins/calendar/README.md" title="📆 Commit calendar">📆</a> <a href="/source/plugins/code/README.md" title="♐ Random code snippet">♐</a> <a href="/source/plugins/16personalities/README.md" title="🧠 16personalities">🧠</a> <a href="/source/plugins/chess/README.md" title="♟️ Chess">♟️</a> <a href="/source/plugins/crypto/README.md" title="🪙 Crypto">🪙</a> <a href="/source/plugins/fortune/README.md" title="🥠 Fortune">🥠</a> <a href="/source/plugins/nightscout/README.md" title="💉 Nightscout">💉</a> <a href="/source/plugins/poopmap/README.md" title="💩 PoopMap plugin">💩</a> <a href="/source/plugins/screenshot/README.md" title="📸 Website screenshot">📸</a> <a href="/source/plugins/splatoon/README.md" title="🦑 Splatoon">🦑</a> <a href="/source/plugins/stock/README.md" title="💹 Stock prices">💹</a> <a href="/source/plugins/tokscale/README.md" title="🎯 Tokscale">🎯</a> <a href="/source/plugins/contributors/README.md" title="🏅 Repository contributors">🏅</a> <a href="/source/plugins/discussions/README.md" title="💬 Discussions">💬</a> <a href="/source/plugins/followup/README.md" title="🎟️ Follow-up of issues and pull requests">🎟️</a> <a href="/source/plugins/gists/README.md" title="🎫 Gists">🎫</a> <a href="/source/plugins/habits/README.md" title="💡 Coding habits and activity">💡</a> <a href="/source/plugins/introduction/README.md" title="🙋 Introduction">🙋</a> <a href="/source/plugins/isocalendar/README.md" title="📅 Isometric commit calendar">📅</a> <a href="/source/plugins/languages/README.md" title="🈷️ Languages activity">🈷️</a> <a href="/source/plugins/leetcode/README.md" title="🗳️ Leetcode">🗳️</a> <a href="/source/plugins/licenses/README.md" title="📜 Repository licenses">📜</a> <a href="/source/plugins/lines/README.md" title="👨‍💻 Lines of code changed">👨‍💻</a> <a href="/source/plugins/music/README.md" title="🎼 Music activity and suggestions">🎼</a> <a href="/source/plugins/notable/README.md" title="🎩 Notable contributions">🎩</a> <a href="/source/plugins/pagespeed/README.md" title="⏱️ Google PageSpeed">⏱️</a> <a href="/source/plugins/people/README.md" title="🧑‍🤝‍🧑 People">🧑‍🤝‍🧑</a> <a href="/source/plugins/posts/README.md" title="✒️ Recent posts">✒️</a> <a href="/source/plugins/projects/README.md" title="🗂️ GitHub projects">🗂️</a> <a href="/source/plugins/reactions/README.md" title="🎭 Comment reactions">🎭</a> <a href="/source/plugins/repositories/README.md" title="📓 Featured repositories">📓</a> <a href="/source/plugins/rss/README.md" title="🗼 Rss feed">🗼</a> <a href="/source/plugins/skyline/README.md" title="🌇 GitHub Skyline">🌇</a> <a href="/source/plugins/sponsors/README.md" title="💕 GitHub Sponsors">💕</a> <a href="/source/plugins/sponsorships/README.md" title="💝 GitHub Sponsorships">💝</a> <a href="/source/plugins/stackoverflow/README.md" title="🗨️ Stack Overflow">🗨️</a> <a href="/source/plugins/stargazers/README.md" title="✨ Stargazers">✨</a> <a href="/source/plugins/starlists/README.md" title="💫 Star lists">💫</a> <a href="/source/plugins/stars/README.md" title="🌟 Recently starred repositories">🌟</a> <a href="/source/plugins/steam/README.md" title="🕹️ Steam">🕹️</a> <a href="/source/plugins/support/README.md" title="💭 GitHub Community Support">💭</a> <a href="/source/plugins/topics/README.md" title="📌 Starred topics">📌</a> <a href="/source/plugins/traffic/README.md" title="🧮 Repositories traffic">🧮</a> <a href="/source/plugins/tweets/README.md" title="🐤 Latest tweets">🐤</a> <a href="/source/plugins/wakatime/README.md" title="⏰ WakaTime">⏰</a></td>
  </tr>
  <tr>
    <td><code>👤 Users</code> <code>👥 Organizations</code> <code>📓 Repositories</code></td>
  </tr>
  <tr>
    <td><code>*️⃣ SVG</code> <code>*️⃣ PNG</code> <code>*️⃣ JPEG</code> <code>#️⃣ JSON</code></td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <img src="https://github.com/ddarkr/metrics/blob/examples/metrics.modern-terminal.svg" alt=""></img>
      <img width="900" height="1" alt="">
    </td>
  </tr>
</table>
<!--/header-->

## ℹ️ Examples workflows

<!--examples-->
```yaml
name: Dark profile report
uses: ddarkr/metrics@master
with:
  template: modern-terminal
  filename: metrics.modern-terminal.svg
  token: ${{ secrets.METRICS_TOKEN }}
  base: header, activity, community, repositories, metadata
  plugin_languages: yes
  plugin_languages_details: percentage, bytes-size
  plugin_activity: yes
  plugin_activity_limit: 12
  plugin_calendar: yes
  config_terminal_theme: warp-dark
  config_terminal_density: comfortable
  config_terminal_dividers: yes

```
```yaml
name: Light compact profile report
uses: ddarkr/metrics@master
with:
  template: modern-terminal
  filename: metrics.modern-terminal.light.svg
  token: ${{ secrets.METRICS_TOKEN }}
  base: header, repositories, metadata
  plugin_languages: yes
  plugin_achievements: yes
  config_terminal_theme: warp-light
  config_terminal_density: compact
  config_terminal_dividers: no
  config_terminal_animations: no

```
```yaml
name: Light repository report
uses: ddarkr/metrics@master
with:
  template: modern-terminal
  filename: metrics.modern-terminal.repository.svg
  token: ${{ secrets.METRICS_TOKEN }}
  repo: metrics
  base: header, repositories, metadata
  plugin_contributors: yes
  plugin_contributors_head: master
  plugin_contributors_contributions: yes
  plugin_licenses: yes
  plugin_licenses_ratio: yes
  plugin_licenses_legal: yes
  config_terminal_theme: warp-light
  config_terminal_density: comfortable
  config_terminal_dividers: yes
  config_terminal_animations: no

```
```yaml
name: Dark compact repository report
uses: ddarkr/metrics@master
with:
  template: modern-terminal
  filename: metrics.modern-terminal.repository.dark.svg
  token: ${{ secrets.METRICS_TOKEN }}
  repo: metrics
  base: header, repositories, metadata
  plugin_followup: yes
  plugin_followup_sections: repositories
  plugin_traffic: yes
  config_terminal_theme: warp-dark
  config_terminal_density: compact
  config_terminal_dividers: no
  config_terminal_animations: no

```
<!--/examples-->

## Implementation

This template combines Warp's command/output blocks with Powerlevel10k-inspired prompts. The session header and final input use Powerline account, directory, and context segments; previous blocks keep muted directory prompts and small command icons. The first block has a cyan outline and a subtle tinted background; subsequent blocks stay flat. The `metrics` command labels and cursor are presentation, not an interactive shell or claims that commands were executed. There are no simulated window controls, execution timings, success indicators, or invented branch names. Dark and light variants share the composition and the existing 13px TUI output.

### Rendering contract

- `partials/_.json` defines the registered section order. Each registered EJS partial emits **content only**, including its enabled/section guards and escaped error or empty-state text. Disabled sections emit no content.
- `image.svg` renders each partial once and passes `{partial, content}` to `partials/_block.ejs`. That shared include owns the path prompt, command heading, accessible section label, and output shell. Do not add a second shell or inspect rendered markup to choose a layout.
- `_prompt.ejs` owns the Powerline segments. `_icons.ejs` embeds nine vector symbols from the existing MIT-licensed Octicons dependency, with its license retained in the source; `_icon.ejs` references these symbols locally. No Nerd Font installation, private-use characters, external font download, or `config_octicon` setting is required. Keep these helpers out of `partials/_.json`; only content widgets belong in that registry.
- Use `terminal-kv` for fixed-width key/value rows with aligned colon separators. Use semantic `tui-table` tables with scoped column/row headers for numeric comparisons, and `tui-number` on numeric headers and cells for right alignment. Ten-cell `tui-bar` text distributions supplement, never replace, the exact values; label peak-relative counts separately from percentage shares. Missing measurements must not produce zero-filled bars.
- Use `terminal-list` for compact tree/log entries, `tui-status` for event states, and `tui-detail` for subordinate references, commits, and descriptions. Music and contributor lists use data tables rather than stacked cards. `terminal-text` preserves spacing and line breaks; `pre` is reserved for code or captured text. Long values wrap instead of being truncated to fixed character widths.
- Consume the plugin's actual result fields and configured sections. Fetching, filtering, and list limits belong to the plugin. Do not impose additional template limits or turn unavailable measurements into zero.
- Escape ordinary data with `<%=`. Use `<%-` only for markup already produced by the plugin's markdown, syntax-highlighting, chart, or image pipeline.
- Repository mode runs the existing repository processor before rendering. Base sections use the repository context rather than reporting the owner's profile as the repository.
- Keep `#metrics-end` after the padded XHTML report, inside `foreignObject`. Its position must include the report's bottom padding and its width must span the full image so SVG and raster bounds agree.

### Presentation settings

The public inputs are defined in the core plugin metadata:

| Input | Default | Values |
| --- | --- | --- |
| `config_terminal_theme` | `warp-dark` | `warp-dark`, `warp-light` |
| `config_terminal_density` | `comfortable` | `comfortable`, `compact` |
| `config_terminal_dividers` | `yes` | boolean |
| `config_terminal_animations` | `yes` | boolean |

`template.mjs` resolves these through `core.inputs()` and stores `{theme, density, dividers, animations}` in `data.terminal`. Template-local query aliases and arbitrary inline font-size, line-height, and padding overrides are not additional public settings. Preview renderers that bypass the processor must supply the same resolved object. Global `config_animations: no` and reduced-motion preferences also disable CSS motion.

The token block in `style.css` owns theme colors, type, the four-pixel spacing scale, rules, and motion. Body and command text are 13px; table headings and supporting text are 12px. Comfortable density uses 1.4 line height and 16px block padding; compact uses 1.3 and 12px. Both themes share the composition and tabular numeric alignment. Plugin-provided images and charts remain available where they are the actual requested content.

### Visual checks

Render profiles and repositories in both themes at 320, 375, 414, and 768 pixels. Include long account/repository names, URLs and model names; empty and error results; more than eight activity entries; calendar days with `contributionCount`; contributor categories; legal license details; and optional Tokscale measurements. Compare comfortable and compact density, dividers on/off, and animated/static/reduced-motion output. Verify that raster output includes the final section and that the web placeholder uses the same shared include contract.

### Automated widget checks

```sh
npx jest --runInBand tests/modern-terminal.test.js
```

The suite renders every content widget registered in `partials/_.json` with seeded preview data in both themes, checks that domain values appear, validates SVG/XML and local icon references, and exercises disabled and escaped error states. It uses the real preview generator and EJS partials; it does not authenticate to external APIs or exercise repository data collection.

Browser checks remain necessary for layout and image decoding. In particular, verify that embedded charts follow their preceding text: chart generators shared with classic can carry negative inline margins, which the terminal chart container overrides.

`tests/rendering.test.js` also runs the real lines chart generator and checks axis-label bounds in Chromium at 320 and 480 pixels. Install Puppeteer's browser or set `PUPPETEER_BROWSER_PATH` to an existing Chrome/Chromium executable before running that suite.

LeetCode separates exact solved/total counts, difficulty progress, grouped skills, and recent accepted submissions while honoring section selection. PoopMap summarizes the configured period and pairs hours 00–11 with 12–23 in a twelve-row table; bars are relative to the actual hourly peak, not percentages of all entries. Empty periods do not display invented peak hours or averages.
