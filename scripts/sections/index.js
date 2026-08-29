// Sections are assembled here; updateREADME is called from update-stats.js
const { MARKERS } = require("../config");
const { fetchLanguagesByCommit } = require("./languages");
const { fetchPRStats } = require("./pr-stats");
const { fetchTopRepos } = require("./repo-stats");
const { fetchMergedPRs } = require("./merged-prs");
const { fetchIssues } = require("./issues");

const SECTION_BUILDERS = {
  languages: {
    fetch: fetchLanguagesByCommit,
    start: MARKERS.LANGUAGES.start,
    end: MARKERS.LANGUAGES.end,
  },
  prStats: {
    fetch: fetchPRStats,
    start: MARKERS.PR_STATS.start,
    end: MARKERS.PR_STATS.end,
  },
  repoStats: {
    fetch: fetchTopRepos,
    start: MARKERS.REPO_STATS.start,
    end: MARKERS.REPO_STATS.end,
  },
  mergedPRs: {
    fetch: fetchMergedPRs,
    start: MARKERS.MERGED_PRS.start,
    end: MARKERS.MERGED_PRS.end,
  },
  issues: {
    fetch: fetchIssues,
    start: MARKERS.ISSUES.start,
    end: MARKERS.ISSUES.end,
  },
};

function buildSections(username) {
  return Object.entries(SECTION_BUILDERS)
    .map(([key, { fetch, start, end }]) => {
      const content = fetch(username);
      if (!content) return null;
      return { content, start, end };
    })
    .filter(Boolean);
}

module.exports = { buildSections, SECTION_BUILDERS };
