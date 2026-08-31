const { ensureCache, getRepos } = require("../cache");

function fetchLanguagesByCommit(username) {
  const data = ensureCache(username);
  if (!data) return null;

  const repos = getRepos().nodes || [];
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
