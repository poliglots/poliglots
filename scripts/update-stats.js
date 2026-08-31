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
const { updateREADME } = require("./readme-updater");
const { buildSections } = require("./sections");
const { ensureCache, clearCache } = require("./cache");

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

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log("🔍 Gathering GitHub statistics...");

  const username = fetchUsername();
  console.log(`  📦 User: @${username}`);

  // Single shared API call for all sections
  clearCache();
  const cacheData = ensureCache(username);
  if (!cacheData) {
    console.error("❌ Failed to fetch GitHub data. Aborting.");
    process.exit(1);
  }

  const coll = cacheData.coll;
  console.log(`   💬 Commits: ${coll?.totalCommitContributions || 0}, Issues: ${coll?.totalIssueContributions || 0}, Reviews: ${coll?.totalPullRequestReviewContributions || 0}`);

  const sections = buildSections(username);
  updateREADME(sections);
}

main();
