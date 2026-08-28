#!/usr/bin/env node

/**
 * update-stats.js - Gather GitHub statistics and update README.md.
 *
 * This script fetches language data, PR counts, and top repos from GitHub
 * using `gh api`, then updates the README.md between STATS markers.
 *
 * Environment variables:
 *   GITHUB_TOKEN - Auto-detected via gh CLI in GitHub Actions
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ─── Configuration ───────────────────────────────────────────────────────────

const REPO = "poliglots";

// Resolve paths relative to the repo root (parent of .github/)
const SCRIPT_DIR = path.dirname(__filename);
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../..");
const README_PATH = path.join(REPO_ROOT, "README.md");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ghApi(path, flags = "") {
  const cmd = `gh api "repos/${REPO}/${path}" ${flags}`.trim();
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

function ghOrgApi(path, flags = "") {
  const cmd = `gh api "orgs/${ORG}/${path}" ${flags}`.trim();
  try {
    return execSync(cmd, {
      encoding: "utf8",
      cwd: REPO_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (error) {
    console.error(`❌ gh api org error: ${error.stderr || error.message}`);
    throw error;
  }
}

function ghSearch(query) {
  try {
    const output = execSync(
      `gh search issues "${query}" --json total_count`,
      {
        encoding: "utf8",
        cwd: REPO_ROOT,
        stdio: ["pipe", "pipe", "pipe"],
      }
    );
    const json = JSON.parse(output);
    return json.total_count;
  } catch (error) {
    console.error(`❌ gh search error: ${error.stderr || error.message}`);
    return 0;
  }
}

// ─── Data Fetching ───────────────────────────────────────────────────────────

function fetchLanguages() {
  console.log("  → Fetching languages data...");
  const raw = ghApi("languages", "--jq '. | to_entries | map(.value) | add'");
  const total = parseInt(raw.trim(), 10);
  if (!total || total === 0) {
    return "```\nNo data available\n```";
  }

  const entriesRaw = ghApi(
    "languages",
    "--jq '. | to_entries | sort_by(.value) | reverse'"
  );
  const entries = JSON.parse(entriesRaw);

  const lines = entries.map(({ key: lang, value: bytes }) => {
    const pct = ((bytes / total) * 100).toFixed(1);
    const blocks = Math.round((bytes / total) * 50);
    const bar = "█".repeat(blocks);
    return `${lang.padEnd(20)} ${pct.padStart(5)}% ${bar}`;
  });

  return `\`\`\`\n${lines.join("\n")}\n\`\`\``;
}

function fetchMergedPRs() {
  console.log("  → Fetching merged PRs...");
  const count = ghSearch(
    `repo:${ORG}/${REPO} type:pr state:closed`
  );
  return count;
}

function fetchOpenPRs() {
  console.log("  → Fetching open PRs...");
  const count = ghSearch(`repo:${ORG}/${REPO} type:pr state:open`);
  return count;
}

function fetchTopRepos() {
  console.log("  → Fetching top repos...");
  const raw = ghOrgApi(
    "repos?per_page=100&sort=updated&direction=desc",
    "--paginate"
  );
  const repos = JSON.parse(raw);
  if (!repos || repos.length === 0) {
    return "```\nNo repos found\n```";
  }

  // Filter out the repo itself and sort by stars then forks
  const filtered = repos
    .filter((r) => r.full_name !== `${ORG}/${REPO}`)
    .sort(
      (a, b) =>
        (b.stargazers_count - a.stargazers_count) ||
        (b.forks_count - a.forks_count)
    )
    .slice(0, 10);

  if (filtered.length === 0) {
    return "```\nNo external repos\n```";
  }

  const lines = filtered.map((r) => {
    const lang = r.language || "N/A";
    return `• ${r.full_name} ⭐${r.stargazers_count} 🍴${r.forks_count} (${lang})`;
  });

  return `\`\`\`\n${lines.join("\n")}\n\`\`\``;
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

  const languages = fetchLanguages();
  const mergedPRs = fetchMergedPRs();
  const openPRs = fetchOpenPRs();
  const topRepos = fetchTopRepos();

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
  console.log("   📁 Top repos: collected");
}

main();
