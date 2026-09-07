# Documentation

This fork is maintained on `master`; generated option references describe the code in this checkout.

<% for (const partial of ["documentation/setup", "documentation/contributing"]) { %>
<%- await include(`/partials/${partial}.md`) -%>
<% } %>
