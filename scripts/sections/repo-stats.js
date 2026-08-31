const { ensureCache, getRepos } = require("../cache");

function fetchTopRepos(username) {
  const data = ensureCache(username);
  if (!data) return null;

  const repos = getRepos().nodes || [];
  if (!repos.length) return null;

  const sorted = repos
    .sort(
      (a, b) =>
        (b.stargazerCount || 0) - (a.stargazerCount || 0) ||
        (b.forkCount || 0) - (a.forkCount || 0)
    )
    .slice(0, 10);

  const lines = sorted.map((r) => {
    const lang = r.primaryLanguage?.name || "N/A";
    return `• ${r.nameWithOwner} ⭐${r.stargazerCount} 🍴${r.forkCount} (${lang})`;
  });

  const markdown = `\`\`\`\n${lines.join("\n")}\n\`\`\``;
  return `<div align="left">\n\n### Top Repositories Contributed To\n\n${markdown}\n\n</div>`;
}

module.exports = { fetchTopRepos };
