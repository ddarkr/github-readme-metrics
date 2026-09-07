# Security

## Reporting a vulnerability

Do not publish exploit details, credentials, private repository data, or sensitive logs in an issue, pull request, or discussion.

**No private vulnerability reporting channel is currently configured.** GitHub Issues, Discussions, and private vulnerability reporting are disabled for this repository. Do not send sensitive reports in public pull requests or comments. Maintainers must establish and document a private channel before accepting vulnerability details.

Once a private channel is available, a report should identify the affected commit, component, impact, and a minimal reproduction using dummy credentials. Distinguish changes specific to this fork from behavior inherited from [lowlighter/metrics](https://github.com/lowlighter/metrics). Coordinate any upstream disclosure privately as well.

## Safe operation

- Store tokens in GitHub Actions secrets or local configuration excluded from version control. Grant only the scopes needed by enabled plugins.
- Do not expose `settings.json`, environment files, access tokens, or debug logs from a web server or container image.
- Treat a self-hosted web instance as a credential-bearing service. Review enabled plugins, network access, and authentication before exposing it publicly.
- Rendered reports can disclose private activity and third-party account data. Review outputs before publishing them.
- If a credential is exposed, revoke or rotate it immediately. Removing it from the current file does not remove it from Git history or previously published artifacts.

No security response-time guarantee or long-term support policy is currently published. Use the current maintained revision and review updates before deploying them.
