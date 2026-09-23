const { ensureCache, getOpenPRsCount } = require("../cache");
const { gqlFetch, QUERIES } = require("../github-api");
const { PRS_TO_SHOW } = require("../config");

function fetchOpenPRs(username) {
  ensureCache(username);

  const response = gqlFetch(QUERIES.OPEN_PRS_LIST, { login: username });
  if (response.errors) return null;

  const nodes = response?.data?.user?.pullRequests?.nodes || [];
  if (!nodes.length) return null;

  const count = getOpenPRsCount();
  const repos = [...new Set(nodes.map((p) => p.repository?.nameWithOwner).filter(Boolean))];
  const prLinks = nodes
    .slice(0, PRS_TO_SHOW)
    .map(
      (p) =>
        `• [#${p.number}](${p.html_url || `https://github.com/${p.repository?.nameWithOwner}/pull/${p.number}`}) — ${p.title.slice(0, 50)}\n  ↳ *${p.repository?.nameWithOwner}*`
    )
    .join("\n\n");

  const extra = nodes.length > PRS_TO_SHOW ? `\n• _${nodes.length - PRS_TO_SHOW} more_` : "";

  return `<div align="left">

### Open Pull Requests

🔓 **${count}** open PR${count > 1 ? "s" : ""} across ${repos.length} repo${repos.length > 1 ? "s" : ""}

${prLinks}${extra}

</div>`;
}

module.exports = { fetchOpenPRs };
