const { gqlFetch, QUERIES } = require("../github-api");

function fetchMergedPRs(username) {
  console.log("  → Fetching merged PRs...");

  const response = gqlFetch(QUERIES.MERGED_PRS_LIST, { login: username });
  if (response.errors) return null;

  const nodes = response?.data?.user?.pullRequests?.nodes || [];
  if (!nodes.length) return null;

  const prs = nodes
    .filter((p) => p && p.title)
    .map((p) => {
      // Truncate body to 150 chars for readability
      const body = (p.body || "").trim().replace(/\s+/g, " ").slice(0, 150);
      const date = p.mergedAt ? new Date(p.mergedAt).toLocaleDateString() : "";
      const repo = p.repository?.nameWithOwner || "";

      const summary = `#${p.number} — ${p.title} (${repo})`;
      const detail = date ? `${body}${body.length < (p.body || "").trim().length ? "…" : ""}  \n<small>📅 ${date}</small>` : body;

      return `<details>\n<summary>${summary}</summary>\n\n${detail}\n\n</details>`;
    })
    .join("\n\n---\n\n");

  return `<div align="left">

### Recent Merged Pull Requests

${prs}

</div>`;
}

module.exports = { fetchMergedPRs };
