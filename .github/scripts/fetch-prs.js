#!/usr/bin/env node

/**
 * fetch-prs.js - Fetch open and merged PRs from GitHub and generate README markdown.
 *
 * Usage:
 *   node fetch-prs.js [username]
 *
 * This script queries the GitHub GraphQL API for all open and merged pull requests
 * by the given user across all repositories, then outputs a Markdown section
 * suitable for embedding in README.md.
 *
 * The output includes an HTML comment marker that the update-readme.js script
 * uses to replace the old content.
 *
 * Environment variables:
 *   GITHUB_TOKEN - Personal access token with repo scope (auto-detected via gh CLI)
 */

const { execSync } = require("child_process");

// ─── Configuration ───────────────────────────────────────────────────────────

const USERNAME = process.argv[2] || "poliglots";
const MAX_PRS = 200; // Max PRs to fetch per query
const MAX_OPEN = 20; // Max open PRs to display
const MAX_MERGED = 30; // Max merged PRs to display

// ─── Helpers ─────────────────────────────────────────────────────────────────

function queryGitHub(states) {
  const statesStr = states.join(",");
  const query = `
query($username: String!, $states: [PullRequestState!]!) {
  user(login: $username) {
    pullRequests(first: 100, states: $states, orderBy: {field: UPDATED_AT, direction: DESC}) {
      totalCount
      nodes {
        number
        title
        url
        state
        repository {
          nameWithOwner
        }
        mergedAt
        createdAt
        updatedAt
      }
    }
  }
}
  `;

  try {
    const output = execSync(
      `gh api graphql --field username="${USERNAME}" --field states='${statesStr}' -f query='${query}'`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );
    return JSON.parse(output);
  } catch (error) {
    console.error(`❌ GitHub API error: ${error.stderr || error.message}`);
    process.exit(1);
  }
}

function extractPRs(response, states) {
  if (response.errors) {
    console.error("❌ GraphQL errors:", JSON.stringify(response.errors, null, 2));
    process.exit(1);
  }

  return (
    response?.data?.user?.pullRequests?.nodes?.filter((pr) =>
      states.includes(pr.state)
    ) || []
  );
}

function cleanTitle(title, repo) {
  // Remove common prefixes like "fix:", "feat:", "docs:" etc. for cleaner display
  // Keep the part after the scope if it exists
  const match = title.match(/^(fix|feat|chore|docs|refactor|style|perf|test|ci|build)(\([^)]*\))?\s*:?\s*(.+)$/i);
  if (match) {
    return match[3].trim();
  }
  return title;
}

function formatPR(pr) {
  const repo = pr.repository.nameWithOwner;
  const clean = cleanTitle(pr.title, repo);
  return `- **[${repo}](${pr.url})** — ${clean}`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log(`🔍 Fetching PRs for @${USERNAME}...`);

  // Fetch open PRs
  console.log("  📂 Fetching open PRs...");
  const openResponse = queryGitHub(["OPEN"]);
  const openPRs = extractPRs(openResponse, ["OPEN"]);
  console.log(`  ✅ Found ${openPRs.length} open PR(s)`);

  // Fetch merged PRs
  console.log("  📦 Fetching merged PRs...");
  const mergedResponse = queryGitHub(["MERGED"]);
  const mergedPRs = extractPRs(mergedResponse, ["MERGED"]);
  console.log(`  ✅ Found ${mergedPRs.length} merged PR(s)`);

  // Generate markdown
  const lines = [];

  lines.push("## 🌟 Open Source Contributions");
  lines.push("");

  // Merged PRs section (first)
  if (mergedPRs.length > 0) {
    lines.push("### ✅ Merged Pull Requests");
    lines.push("");
    mergedPRs.slice(0, MAX_MERGED).forEach((pr) => {
      lines.push(formatPR(pr));
    });
    if (mergedPRs.length > MAX_MERGED) {
      lines.push(
        `*...and ${mergedPRs.length - MAX_MERGED} more merged PRs.*`
      );
    }
    lines.push("");
  } else {
    lines.push("### ✅ Merged Pull Requests");
    lines.push("");
    lines.push("*No merged pull requests at this time.*");
    lines.push("");
  }

  // Open PRs section (second)
  if (openPRs.length > 0) {
    lines.push("### 🔵 Open Pull Requests");
    lines.push("");
    openPRs.slice(0, MAX_OPEN).forEach((pr) => {
      lines.push(formatPR(pr));
    });
    if (openPRs.length > MAX_OPEN) {
      lines.push(
        `*...and ${openPRs.length - MAX_OPEN} more open PRs.*`
      );
    }
    lines.push("");
  } else {
    lines.push("### 🔵 Open Pull Requests");
    lines.push("");
    lines.push("*No open pull requests at this time.*");
    lines.push("");
  }

  // Output
  const markdown = lines.join("\n");

  // Print the marker and content so the caller knows the boundaries
  console.log(`\n---PR_SECTION_START---`);
  console.log(markdown);
  console.log(`---PR_SECTION_END---`);

  // Also write to a temp file for easy consumption
  const fs = require("fs");
  fs.writeFileSync("/tmp/poliglots-prs.md", markdown);
  console.log("\n📝 PR section written to /tmp/poliglots-prs.md");
}

main();