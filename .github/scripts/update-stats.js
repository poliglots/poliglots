#!/usr/bin/env node

/**
 * update-stats.js - Gather GitHub user statistics and update README.md.
 *
 * Each stats section has its own pair of markers in README.md for independent
 * updating. Add new sections by creating a new marker pair and a corresponding
 * replace function.
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
const fs = require("fs");
const path = require("path");

// ─── Configuration ───────────────────────────────────────────────────────────

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

// Replace content between (and including) start/end markers, keeping the markers
function replaceSection(readme, startMarker, endMarker, newContent) {
  const startIdx = readme.indexOf(startMarker);
  const endIdx = readme.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    // Markers not found — skip
    console.log(`  ⚠️  ${startMarker} not found, skipping.`);
    return { readme, changed: false };
  }

  // Replace everything between startMarker...endMarker with: startMarker + newContent + endMarker
  // This keeps the markers in place for future runs
  const newReadme =
    readme.substring(0, startIdx + startMarker.length) +
    "\n\n" +
    newContent +
    "\n\n" +
    readme.substring(endIdx); // endMarker is already at endIdx, keep it

  return { readme: newReadme, changed: newReadme !== readme };
}

// ─── GraphQL Queries ─────────────────────────────────────────────────────────

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

// ─── Data Fetching ───────────────────────────────────────────────────────────

function fetchUsername() {
  // GITHUB_TOKEN cannot access /user endpoint (403).
  // Use gh repo view to get the owner, which works with repo-scoped tokens.
  const output = execSync(
    "gh repo view --json owner -q '.owner.login'",
    { encoding: "utf8", cwd: REPO_ROOT, stdio: ["pipe", "pipe", "pipe"] }
  );
  return output.trim();
}

function fetchLanguagesByCommit(username) {
  console.log("  → Fetching languages by commit...");

  const response = gqlFetch(CONTRIBUTIONS_QUERY, { login: username });
  if (response.errors) {
    console.error("❌ GraphQL errors:", JSON.stringify(response.errors, null, 2));
    return null;
  }

  const repos = response?.data?.user?.repositoriesContributedTo?.nodes || [];
  if (!repos || repos.length === 0) {
    return null;
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

  const markdown = `\`\`\`\n${lines.join("\n")}\n\`\`\``;

  return `<div align="center">

#### Languages by Commit

${markdown}

</div>`;
}

function fetchPRStats(username) {
  console.log("  → Fetching PR stats...");

  const openRes = gqlFetch(OPEN_PRS_QUERY, { login: username });
  const mergedRes = gqlFetch(MERGED_PRS_QUERY, { login: username });

  if (openRes.errors || mergedRes.errors) {
    return null;
  }

  const openPRs = openRes?.data?.user?.pullRequests?.totalCount ?? 0;
  const mergedPRs = mergedRes?.data?.user?.pullRequests?.totalCount ?? 0;

  const markdown = `<div align="center">

#### Pull Request Stats

| Metric | Count |
|--------|-------|
| ✅ PRs Merged | ${mergedPRs} |
| 🔓 PRs Open | ${openPRs} |

</div>`;

  return { markdown, mergedPRs, openPRs };
}

function fetchTopRepos(username) {
  console.log("  → Fetching top repos...");

  const response = gqlFetch(CONTRIBUTIONS_QUERY, { login: username });
  if (response.errors) {
    return null;
  }

  const repos = response?.data?.user?.repositoriesContributedTo?.nodes || [];
  if (!repos || repos.length === 0) {
    return null;
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

  const markdown = `\`\`\`\n${lines.join("\n")}\n\`\`\``;

  return `<div align="center">

#### Top Repositories Contributed To

${markdown}

</div>`;
}

function fetchCommitStats(username) {
  console.log("  → Fetching commit stats...");

  const response = gqlFetch(CONTRIBUTIONS_QUERY, { login: username });
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

// ─── Section Builders ────────────────────────────────────────────────────────

// Each section builder returns { content, marker } to be passed to replaceSection

function buildLanguagesSection(username) {
  const content = fetchLanguagesByCommit(username);
  if (!content) return null;
  return {
    content: content,
    start: "<!-- LANGUAGES_STATS_START -->",
    end: "<!-- LANGUAGES_STATS_END -->",
  };
}

function buildPRSection(username) {
  const result = fetchPRStats(username);
  if (!result) return null;
  return {
    content: result.markdown,
    start: "<!-- PR_STATS_START -->",
    end: "<!-- PR_STATS_END -->",
  };
}

function buildRepoSection(username) {
  const content = fetchTopRepos(username);
  if (!content) return null;
  return {
    content: content,
    start: "<!-- REPO_STATS_START -->",
    end: "<!-- REPO_STATS_END -->",
  };
}

// ─── README Update ───────────────────────────────────────────────────────────

function updateREADME(sections) {
  console.log("📝 Updating README.md...");
  let readme = fs.readFileSync(README_PATH, "utf8");
  let anyChanged = false;

  for (const section of sections) {
    const result = replaceSection(readme, section.start, section.end, section.content);
    if (result.changed) {
      readme = result.readme;
      anyChanged = true;
    }
  }

  if (!anyChanged) {
    console.log("✅ No changes needed. README.md is up to date.");
    return;
  }

  fs.writeFileSync(README_PATH, readme);
  console.log("✅ README.md updated successfully!");
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log("🔍 Gathering GitHub statistics...");

  const username = fetchUsername();
  console.log(`  📦 User: @${username}`);

  const sections = [
    buildLanguagesSection(username),
    buildPRSection(username),
    buildRepoSection(username),
  ].filter(Boolean); // remove null sections

  updateREADME(sections);

  const commits = fetchCommitStats(username);
  console.log(`   💬 Commits: ${commits.commits}, Issues: ${commits.issues}, Reviews: ${commits.reviews}`);
}

main();
