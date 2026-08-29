const { ghApiJson } = require("../github-api");

function fetchIssues(username) {
  console.log("  → Fetching reported issues...");

  const perPage = 30;
  const allIssues = [];

  for (let page = 1; page <= 3; page++) {
    const data = ghApiJson(
      `/search/issues?q=author:${username}+is:issue&per_page=${perPage}&page=${page}&sort=updated&order=desc`
    );
    if (!data.items || !data.items.length) break;
    // Filter out PRs — GitHub's /search/issues returns both issues AND PRs
    const realIssues = data.items.filter((i) => !i.pull_request);
    if (!realIssues.length) break;
    allIssues.push(...realIssues);
    if (data.items.length < perPage) break;
  }

  if (!allIssues.length) return null;

  const total = allIssues.length;
  const open = allIssues.filter((i) => i.state === "open").length;
  const closed = total - open;
  const repos = [...new Set(allIssues.map((i) => i.repository_url?.replace("https://api.github.com/repos/", "")))].filter(Boolean);

  const issueLinks = allIssues
    .slice(0, 5)
    .map(
      (i) =>
        `• [${i.state === "open" ? "🟢" : "❌"} #${i.number}](${i.html_url}) — ${i.title.slice(0, 50)}\n  ↳ *${i.repository_url?.replace("https://api.github.com/repos/", "")}*`
    )
    .join("\n\n");

  const extra = allIssues.length > 5 ? `\n• _${allIssues.length - 5} more_` : "";

  return `<div align="left">

### Reported Issues

🐛 **${total}** issue${total > 1 ? "s" : ""} (${open} open · ${closed} closed) across ${repos.length} repo${repos.length > 1 ? "s" : ""}

${issueLinks}${extra}

</div>`;
}

module.exports = { fetchIssues };
