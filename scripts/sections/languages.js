const { gqlFetch, QUERIES } = require("../github-api");

function fetchLanguagesByCommit(username) {
  console.log("  → Fetching languages by commit...");

  const response = gqlFetch(QUERIES.CONTRIBUTIONS, { login: username });
  if (response.errors) {
    console.error("❌ GraphQL errors:", JSON.stringify(response.errors, null, 2));
    return null;
  }

  const repos = response?.data?.user?.repositoriesContributedTo?.nodes || [];
  if (!repos.length) return null;

  const langMap = {};
  for (const repo of repos) {
    const lang = repo.primaryLanguage?.name;
    if (lang) langMap[lang] = (langMap[lang] || 0) + 1;
  }

  const entries = Object.entries(langMap).sort((a, b) => b[1] - a[1]);
  const totalRepos = entries.reduce((sum, [, count]) => sum + count, 0);

  const lines = entries.map(([lang, count]) => {
    const pct = ((count / totalRepos) * 100).toFixed(1);
    const blocks = Math.round((count / totalRepos) * 50);
    const bar = "█".repeat(blocks);
    return `${lang.padEnd(20)} ${pct.padStart(5)}% ${bar}`;
  });

  const markdown = `\`\`\`\n${lines.join("\n")}\n\`\`\``;
  return `<div align="left">\n\n### Languages by Commit\n\n${markdown}\n\n</div>`;
}

module.exports = { fetchLanguagesByCommit };
