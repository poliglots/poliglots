#!/usr/bin/env node

/**
 * update-stats.js - Gather GitHub user statistics and update README.md.
 *
 * This script fetches languages by commit, PR counts (open/merged),
 * and contribution stats for the authenticated user across all repos
 * using `gh api graphql`, then updates the README.md between STATS markers.
 *
 * Environment variables:
 *   GITHUB_TOKEN - Auto-detected via gh CLI in GitHub Actions
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ─── Configuration ───────────────────────────────────────────────────────────

// Resolve paths relative to the repo root (parent of .github/)
const SCRIPT_DIR = path.dirname(__filename);
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../..");
const README_PATH = path.join(REPO_ROOT, "README.md");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ghApi(endpoint, flags = "") {
  const cmd = `gh api "${endpoint}" ${flags}`.trim();
  try {
    return execSync(cmd, {
      encoding: "utf8",
      cwd: REPO_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (error) {
    console.error(`❌ gh api error: ${error.stderr || error.message}`);
    throw error;
  }
}

function gqlFetch(query, variables) {
  const fields = Object.entries(variables)
    .map(([key, value]) => `--field ${key}="${value}"`)
    .join(" ");
  const cmd = `gh api graphql -f query='${query.trim()}' ${fields}`;
  try {
    const output = execSync(cmd, {
      encoding: "utf8",
      cwd: REPO_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return JSON.parse(output);
  } catch (error) {
    console.error(`❌ gh api graphql error: ${error.stderr || error.message}`);
    throw error;
  }
}

// ─── Data Fetching ───────────────────────────────────────────────────────────

const CONTRIBUTIONS_QUERY = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
    }
    repositoriesContributedTo(
      first: 100
      contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]
    ) {
      totalCount
      nodes {
        nameWithOwner
        stargazerCount
        forkCount
        primaryLanguage {
          name
        }
      }
    }
  }
}
`;

const OPEN_PRS_QUERY = `
query($login: String!) {
  user(login: $login) {
    pullRequests(first: 1, states: OPEN, orderBy: {field: UPDATED_AT, direction: DESC}) {
      totalCount
    }
  }
}
`;

const MERGED_PRS_QUERY = `
query($login: String!) {
  user(login: $login) {
    pullRequests(first: 1, states: MERGED, orderBy: {field: UPDATED_AT, direction: DESC}) {
      totalCount
    }
  }
}
`;

function fetchUserLogin() {
  return ghApi("user", "--jq '.login'").trim();
}

function fetchLanguagesByCommit(username) {
  console.log("  → Fetching languages by commit...");

  const response = gqlFetch(CONTRIBUTIONS_QUERY, { login: username });
  if (response.errors) {
    console.error("❌ GraphQL errors:", JSON.stringify(response.errors, null, 2));
    return "```\nNo data available\n```";
  }

  const repos = response?.data?.user?.repositoriesContributedTo?.nodes || [];
  if (repos.length === 0) {
    return "```\nNo data available\n```";
  }

  // Aggregate languages across all contributed repos
  const langMap = {};
  for (const repo of repos) {
    const lang = repo.primaryLanguage?.name;
    if (lang) {
      langMap[lang] = (langMap[lang] || 0) + 1;
    }
  }

  const entries = Object.entries(langMap).sort((a, b) => b[1] - a[1]);
  const totalRepos = entries.reduce((sum, [, count]) => sum + count, 0);

  const lines = entries.map(([lang, count]) => {
    const pct = ((count / totalRepos) * 100).toFixed(1);
    const blocks = Math.round((count / totalRepos) * 50);
    const bar = "█".repeat(blocks);
    return `${lang.padEnd(20)} ${pct.padStart(5)}% ${bar}`;
  });

  return "```\n" + lines.join("\n") + "\n```";
}

function fetchOpenPRs(username) {
  console.log("  → Fetching open PRs...");
  const response = gqlFetch(OPEN_PRS_QUERY, { login: username });
  if (response.errors) {
    return 0;
  }
  return response?.data?.user?.pullRequests?.totalCount || 0;
}

function fetchMergedPRs(username) {
  console.log("  → Fetching merged PRs...");
  const response = gqlFetch(MERGED_PRS_QUERY, { login: username });
  if (response.errors) {
    return 0;
  }
  return response?.data?.user?.pullRequests?.totalCount || 0;
}

function fetchTopRepos(username) {
  console.log("  → Fetching top repos...");

  const response = gqlFetch(CONTRIBUTIONS_QUERY, { login: username });
  if (response.errors) {
    return "```\nNo repos found\n```";
  }

  const repos = response?.data?.user?.repositoriesContributedTo?.nodes || [];
  if (repos.length === 0) {
    return "```\nNo external repos\n```";
  }

  // Sort by stars, then forks
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

  return "```\n" + lines.join("\n") + "\n```";
}

function fetchCommitStats(username) {
  console.log("  → Fetching commit stats...");

  const response = gqlFetch(CONTRIBUTIONS_QUERY, { login: username });
  if (response.errors) {
    return { commits: 0, issues: 0, reviews: 0, prs: 0 };
  }

  const coll = response?.data?.user?.contributionsCollection;
  return {
    commits: coll?.totalCommitContributions || 0,
    issues: coll?.totalIssueContributions || 0,
    reviews: coll?.totalPullRequestReviewContributions || 0,
    prs: coll?.totalPullRequestContributions || 0,
  };
}

// ─── README Update ───────────────────────────────────────────────────────────

function updateREADME(statsSection) {
  console.log("📝 Updating README.md...");
  const readme = fs.readFileSync(README_PATH, "utf8");
  const startMarker = "<!-- STATS_MARKER_START -->";
  const endMarker = "<!-- STATS_MARKER_END -->";

  const startIdx = readme.indexOf(startMarker);
  const endIdx = readme.indexOf(endMarker);

  let newReadme;
  if (startIdx === -1 || endIdx === -1) {
    // Markers don't exist — append before the footer section
    const footerIndex = readme.indexOf("Building the future");
    if (footerIndex !== -1) {
      newReadme =
        readme.substring(0, footerIndex) +
        "\n" +
        statsSection +
        readme.substring(footerIndex);
    } else {
      console.log("⚠️  Stats markers not found. Appending to end.");
      newReadme = readme + "\n" + statsSection;
    }
  } else {
    // Replace existing section
    newReadme =
      readme.substring(0, startIdx) +
      statsSection +
      readme.substring(endIdx + endMarker.length);
  }

  if (newReadme === readme) {
    console.log("✅ No changes needed. README.md is up to date.");
    return;
  }

  fs.writeFileSync(README_PATH, newReadme);
  console.log("✅ README.md updated successfully!");
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log("🔍 Gathering GitHub statistics...");

  const username = fetchUserLogin();
  console.log(`  📦 User: @${username}`);

  const languages = fetchLanguagesByCommit(username);
  const mergedPRs = fetchMergedPRs(username);
  const openPRs = fetchOpenPRs(username);
  const topRepos = fetchTopRepos(username);
  const commits = fetchCommitStats(username);

  const timestamp = new Date()
    .toISOString()
    .replace(/T/, " ")
    .replace(/\.\d{3}Z/, " UTC");

  const statsSection = `<!-- STATS_MARKER_START -->

### 📊 Project Statistics

<div align="center">

**Last Updated:** ${timestamp}

</div>

---

<div align="center">

#### Languages by Commit

${languages}

</div>

---

<div align="center">

#### Pull Request Stats

| Metric | Count |
|--------|-------|
| ✅ PRs Merged | ${mergedPRs} |
| 🔓 PRs Open | ${openPRs} |

</div>

---

<div align="center">

#### Top Repositories Contributed To

${topRepos}

</div>

<!-- STATS_MARKER_END -->`;

  updateREADME(statsSection);

  console.log("   📊 Languages: collected");
  console.log(`   ✅ Merged PRs: ${mergedPRs}`);
  console.log(`   🔓 Open PRs: ${openPRs}`);
  console.log(`   💬 Commits: ${commits.commits}, Issues: ${commits.issues}, Reviews: ${commits.reviews}`);
  console.log("   📁 Top repos: collected");
}

main();
