# 📚 Documentation

This fork is maintained on `master`. Examples and generated option reference describe the code in this checkout.

<% for (const partial of ["documentation/setup", "templated/templates", "templated/plugins", "documentation/contributing"]) { %>
<%- await include(`/partials/${partial}.md`) -%>
<% } %>
