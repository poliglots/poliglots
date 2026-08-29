const { ghApiJson } = require("../github-api");

function fetchIssues(username) {
  console.log("  → Fetching reported issues...");

  const perPage = 30;
  const allIssues = [];

  // Paginate through issues authored by user
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

  const issues = allIssues
    .slice(0, 30)
    .map((i) => {
      const status = i.state === "closed" ? "❌" : "🟢";
      const repo = i.repository_url
        ? i.repository_url.replace("https://api.github.com/repos/", "")
        : "";
      const body = (i.body || "").trim().replace(/\s+/g, " ").slice(0, 150);
      const date = i.closed_at
        ? new Date(i.closed_at).toLocaleDateString()
        : new Date(i.updated_at).toLocaleDateString();

      const summary = `${status} #${i.number} — ${i.title} (${repo})`;
      const detail = `${body}${body.length < (i.body || "").trim().length ? "…" : ""}  \n<small>📅 ${date}</small>`;

      return `<details>\n<summary>${summary}</summary>\n\n${detail}\n\n</details>`;
    })
    .join("\n\n---\n\n");

  return `<div align="left">

### Reported Issues

${issues}

</div>`;
}

module.exports = { fetchIssues };
