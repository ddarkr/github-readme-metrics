# Organization reports

Metrics can render organization accounts. Use the same workflow described in the [GitHub Action guide](/.github/readme/partials/documentation/setup/action.md), but supply the organization login as `user`:

```yaml
- uses: ddarkr/github-readme-metrics@master
  with:
    token: ${{ secrets.METRICS_TOKEN }}
    user: github
```

The token is a classic personal access token. Start with the least scopes required by enabled plugins; organization data commonly needs `read:org`, and private repository data needs `repo`. If the organization uses SAML SSO, authorize the token for that organization as required by [GitHub's SSO documentation](https://docs.github.com/en/authentication/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on).

Plugins that support organizations are marked `👥 Organizations` in their generated documentation. Large organizations can consume more GitHub API quota; select only the plugins and sections you need. Workflows may live in the organization's `.github` repository and their reports can be embedded in its organization profile README.

## Membership visibility for user reports

GitHub exposes only public organization memberships by default. Configure membership visibility in the organization's **People** tab and check the public profile in a signed-out/private browser window if it should appear in a report.
