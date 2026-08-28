#!/bin/bash
set -e

# Stats collection script for README.md
# Uses GITHUB_TOKEN (provided by GitHub Actions)
# Uses Node.js and gh CLI only — no Python

ORG="poliglots"
README_FILE="README.md"

echo "🔍 Gathering GitHub statistics..."

# --- 1. Languages by Commit ---
echo "  → Fetching languages data..."
languages=$(gh api "repos/$ORG/poliglots/languages" --jq '
  to_entries | map(.value) | add as $total |
  sort_by(.value) | reverse |
  .[] |
  "\(.key | lpad(20;" ")) \((.value / $total * 100) | . * 10 | round / 10)\"% \(" + ("█" * (.value / $total * 100 / 2 | floor)) + ")"
')

# --- 2. No. of PRs Merged (closed PRs) ---
echo "  → Fetching merged PRs..."
merged_prs=$(gh search issues "repo:$ORG/poliglots type:pr state:closed" --json total_count --jq '.total_count')

# --- 3. No. of PRs Open ---
echo "  → Fetching open PRs..."
open_prs=$(gh search issues "repo:$ORG/poliglots type:pr state:open" --json total_count --jq '.total_count')

# --- 4. Top Repos Contributed To ---
echo "  → Fetching top repos..."
top_repos=$(gh api "orgs/$ORG/repos?per_page=100&sort=updated&direction=desc" --jq '
  [.[] | select(.full_name != "poliglots/poliglots")]
  | sort_by(.stargazers_count, .forks_count) | reverse | .[:10]
  | .[] |
  "• \(.full_name) ⭐\(.stargazers_count) 🍴\(.forks_count) (\(.language // "N/A"))"
')

# --- Build stats section ---
timestamp=$(date -u '+%Y-%m-%d %H:%M UTC')
stats_section=$(cat << EOF
<!-- STATS_MARKER_START -->

### 📊 Project Statistics

<div align="center">

**Last Updated:** $timestamp

</div>

---

<div align="center">

#### Languages by Commit

\`\`\`
$languages
\`\`\`

</div>

---

<div align="center">

#### Pull Request Stats

| Metric | Count |
|--------|-------|
| ✅ PRs Merged | $merged_prs |
| 🔓 PRs Open | $open_prs |

</div>

---

<div align="center">

#### Top Repositories Contributed To

\`\`\`
$top_repos
\`\`\`

</div>

<!-- STATS_MARKER_END -->
EOF
)

# --- Update README.md ---
echo "📝 Updating README.md..."

if grep -q "<!-- STATS_MARKER_START -->" "$README_FILE"; then
  # Replace existing section between markers
  awk -v new_section="$stats_section" '
    /<!-- STATS_MARKER_START -->/ { found=1; print new_section; next }
    /<!-- STATS_MARKER_END -->/ { found=0; next }
    !found { print }
  ' "$README_FILE" > /tmp/README_updated.md
  mv /tmp/README_updated.md "$README_FILE"
else
  # Insert before the footer section
  sed -i '/Building the future/i\\' "$README_FILE"
  sed -i '/Building the future/i\' "$stats_section" "$README_FILE"
fi

echo "✅ README.md updated successfully!"
echo "   📊 Languages: collected"
echo "   ✅ Merged PRs: $merged_prs"
echo "   🔓 Open PRs: $open_prs"
echo "   📁 Top repos: collected"
