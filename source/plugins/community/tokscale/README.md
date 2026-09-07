<!--header-->
<table>
  <tr><td colspan="2"><a href="/README.md#-plugins">← Back to plugins index</a></td></tr>
  <tr><th colspan="2"><h3>🎯 Tokscale</h3></th></tr>
  <tr><td colspan="2" align="center"><p>Displays token usage statistics from <a href="https://tokscale.ai">Tokscale.ai</a>.</p>
</td></tr>
  <tr><th>⚠️ Disclaimer</th><td><p>This plugin is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Tokscale.ai.</p>
</td></tr>
<tr><th>Authors</th><td><a href="https://github.com/doda">@doda</a></td></tr>
  <tr>
    <th rowspan="3">Supported features<br><sub><a href="metadata.yml">→ Full specification</a></sub></th>
    <td><a href="/source/templates/classic/README.md"><code>📗 Classic template</code></a> <a href="/source/templates/modern-terminal/README.md"><code>Modern Terminal</code></a></td>
  </tr>
  <tr>
    <td><code>👤 Users</code></td>
  </tr>
  <tr>
    <td><i>No tokens are required for this plugin</i></td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <img src="https://via.placeholder.com/468x60?text=No%20preview%20available" alt=""></img>
      <img width="900" height="1" alt="">
    </td>
  </tr>
</table>
<!--/header-->

## ➡️ Available options

<!--options-->
<table>
  <tr>
    <td align="center" nowrap="nowrap">Option</i></td><td align="center" nowrap="nowrap">Description</td>
  </tr>
  <tr>
    <td nowrap="nowrap"><h4><code>plugin_tokscale</code></h4></td>
    <td rowspan="2"><p>Enable tokscale plugin</p>
<img width="900" height="1" alt=""></td>
  </tr>
  <tr>
    <td nowrap="nowrap"><b>type:</b> <code>boolean</code>
<br>
<b>default:</b> no<br></td>
  </tr>
  <tr>
    <td nowrap="nowrap"><h4><code>plugin_tokscale_user</code></h4></td>
    <td rowspan="2"><p>Tokscale username</p>
<img width="900" height="1" alt=""></td>
  </tr>
  <tr>
    <td nowrap="nowrap">⏯️ Cannot be preset<br>
<b>type:</b> <code>string</code>
<br>
<b>default:</b> <code>→ User login</code><br></td>
  </tr>
  <tr>
    <td nowrap="nowrap"><h4><code>plugin_tokscale_sections</code></h4></td>
    <td rowspan="2"><p>Displayed sections</p>
<ul>
<li><code>overview</code>: show total tokens, cost, and rank</li>
<li><code>models</code>: show most used models</li>
<li><code>recent</code>: show last submission info</li>
</ul>
<img width="900" height="1" alt=""></td>
  </tr>
  <tr>
    <td nowrap="nowrap"><b>type:</b> <code>array</code>
<i>(comma-separated)</i>
<br>
<b>default:</b> overview, models, recent<br></td>
  </tr>
  <tr>
    <td nowrap="nowrap"><h4><code>plugin_tokscale_models_limit</code></h4></td>
    <td rowspan="2"><p>Display limit (models)</p>
<img width="900" height="1" alt=""></td>
  </tr>
  <tr>
    <td nowrap="nowrap"><b>type:</b> <code>number</code>
<i>(0 ≤
𝑥)</i>
<br>
<b>zero behaviour:</b> disable</br>
<b>default:</b> 5<br></td>
  </tr>
</table>
<!--/options-->

## ℹ️ Examples workflows

<!--examples-->
```yaml
name: Tokscale statistics
uses: ddarkr/metrics@master
with:
  filename: metrics.plugin.tokscale.svg
  token: NOT_NEEDED
  base: ""
  plugin_tokscale: yes
  plugin_tokscale_user: ddarkr

```
<!--/examples-->
