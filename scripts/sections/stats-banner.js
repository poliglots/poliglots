const { ensureCache, getColl, getRepos, getOpenPRs, getMergedPRs } = require("../cache");

function fetchStatsBanner(username) {
  const data = ensureCache(username);
  if (!data) return null;

  const coll = data.coll;
  const repos = data.repos.totalCount || 0;
  const commits = coll?.totalCommitContributions || 0;
  const openPRs = getOpenPRs();
  const mergedPRs = getMergedPRs();
  const issues = coll?.totalIssueContributions || 0;

  const pills = [
    `🗂️ ${repos} repos`,
    `💬 ${commits} commits`,
    `🔀 ${mergedPRs} merged PRs`,
    `🔓 ${openPRs} open PRs`,
    `🐛 ${issues} reported issues`,
  ].map((t) => {
    const esc = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<span style="display:inline-block;padding:4px 14px;margin:3px;background:#161b22;color:#e6edf3;border-radius:16px;font-size:13px;line-height:18px;">${esc}</span>`;
  }).join("\n");

  return `<div align="left">
${pills}
</div>`;
}

module.exports = { fetchStatsBanner };
