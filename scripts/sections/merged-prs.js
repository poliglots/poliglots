const { gqlFetch, QUERIES } = require("../github-api");

function fetchMergedPRs(username) {
  console.log("  → Fetching merged PRs...");

  const response = gqlFetch(QUERIES.MERGED_PRS_LIST, { login: username });
  if (response.errors) return null;

  const nodes = response?.data?.user?.pullRequests?.nodes || [];
  if (!nodes.length) return null;

  const count = nodes.length;
  const repos = [...new Set(nodes.map((p) => p.repository?.nameWithOwner).filter(Boolean))];
  const prLinks = nodes
    .slice(0, 5)
    .map(
      (p) =>
        `• [#${p.number}](${p.html_url || `https://github.com/${p.repository?.nameWithOwner}/pull/${p.number}`}) — ${p.title.slice(0, 50)}\n  ↳ *${p.repository?.nameWithOwner}*`
    )
    .join("\n\n");

  const extra = nodes.length > 5 ? `\n• _${nodes.length - 5} more_` : "";

  return `<div align="left">

### Recent Merged Pull Requests

🔀 **${count}** merged PR${count > 1 ? "s" : ""} across ${repos.length} repo${repos.length > 1 ? "s" : ""}

${prLinks}${extra}

</div>`;
}

module.exports = { fetchMergedPRs };
