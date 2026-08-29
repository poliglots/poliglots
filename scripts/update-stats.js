#!/usr/bin/env node

/**
 * update-stats.js - Gather GitHub user statistics and update README.md.
 *
 * Modular architecture:
 *   config.js          - Paths, markers, constants
 *   github-api.js      - ghApi, gqlFetch, GraphQL queries
 *   readme-updater.js  - README read/write + marker-based section replacement
 *   sections/          - One module per stats section (fetch + format)
 *
 * README.md markers:
 *   <!-- LANGUAGES_STATS_START / END -->  — Languages by commit
 *   <!-- PR_STATS_START / END -->          — PR counts (merged/open)
 *   <!-- REPO_STATS_START / END -->        — Top repos contributed to
 *
 * Environment variables:
 *   GITHUB_TOKEN - Auto-detected via gh CLI in GitHub Actions
 */

const { execSync } = require("child_process");
const { REPO_ROOT } = require("./config");
const { gqlFetch, QUERIES } = require("./github-api");
const { updateREADME } = require("./readme-updater");
const { buildSections } = require("./sections");

// ─── Data Fetching ───────────────────────────────────────────────────────────

function fetchUsername() {
  // GITHUB_TOKEN cannot access /user endpoint (403).
  // Use gh repo view to get the owner, which works with repo-scoped tokens.
  const output = execSync(
    "gh repo view --json owner -q '.owner.login'",
    { encoding: "utf8", cwd: REPO_ROOT, stdio: ["inherit", "pipe", "pipe"] }
  );
  return output.trim();
}

function fetchCommitStats(username) {
  const response = gqlFetch(QUERIES.CONTRIBUTIONS, { login: username });
  if (response.errors) {
    return { commits: 0, issues: 0, reviews: 0, prs: 0 };
  }

  const coll = response?.data?.user?.contributionsCollection || {};
  return {
    commits: coll?.totalCommitContributions || 0,
    issues: coll?.totalIssueContributions || 0,
    reviews: coll?.totalPullRequestReviewContributions || 0,
    prs: coll?.totalPullRequestContributions || 0,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log("🔍 Gathering GitHub statistics...");

  const username = fetchUsername();
  console.log(`  📦 User: @${username}`);

  const sections = buildSections(username);
  updateREADME(sections);

  const stats = fetchCommitStats(username);
  console.log(`   💬 Commits: ${stats.commits}, Issues: ${stats.issues}, Reviews: ${stats.reviews}`);
}

main();
