const { gqlFetch, QUERIES } = require("../github-api");

function fetchPRStats(username) {
  console.log("  → Fetching PR stats...");

  const openRes = gqlFetch(QUERIES.OPEN_PRS, { login: username });
  const mergedRes = gqlFetch(QUERIES.MERGED_PRS, { login: username });

  if (openRes.errors || mergedRes.errors) return null;

  const openPRs = openRes?.data?.user?.pullRequests?.totalCount ?? 0;
  const mergedPRs = mergedRes?.data?.user?.pullRequests?.totalCount ?? 0;

  return `<div align="left">\n\n### Pull Request Stats\n\n| Metric         | Count |\n|----------------|-------|\n| ✅ PRs Merged   | ${mergedPRs}    |\n| 🔓 PRs Open    | ${openPRs}    |\n\n</div>`;
}

module.exports = { fetchPRStats };
