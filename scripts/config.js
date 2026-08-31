const path = require("path");

const SCRIPT_DIR = __dirname;
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

const MARKERS = {
  STATS_BANNER:   { start: "<!-- STATS_BANNER_START -->",  end: "<!-- STATS_BANNER_END -->" },
  LANGUAGES:      { start: "<!-- LANGUAGES_STATS_START -->", end: "<!-- LANGUAGES_STATS_END -->" },
  REPO_STATS:     { start: "<!-- REPO_STATS_START -->",     end: "<!-- REPO_STATS_END -->" },
  MERGED_PRS:     { start: "<!-- MERGED_PRS_START -->",     end: "<!-- MERGED_PRS_END -->" },
  ISSUES:         { start: "<!-- ISSUES_START -->",         end: "<!-- ISSUES_END -->" },
};

const README_PATH = path.join(REPO_ROOT, "README.md");

module.exports = { REPO_ROOT, MARKERS, README_PATH };
