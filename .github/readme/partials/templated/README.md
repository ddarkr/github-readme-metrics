# GitHub Readme Metrics

[![Continuous integration](https://github.com/ddarkr/github-readme-metrics/actions/workflows/ci.yml/badge.svg)](https://github.com/ddarkr/github-readme-metrics/actions/workflows/ci.yml)

<% for (const partial of ["templated/introduction", "templated/documentation", "license"]) { -%>
<%- await include(`/partials/${partial}.md`) %>
<% } %>
