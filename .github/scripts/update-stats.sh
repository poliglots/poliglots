#!/bin/bash
set -e

# Stats collection script for README.md
# Uses GITHUB_TOKEN (provided by GitHub Actions)

TOKEN="${GITHUB_TOKEN}"
ORG="poliglots"
README_FILE="README.md"

echo "🔍 Gathering GitHub statistics..."

# --- 1. Languages by Commit ---
echo "  → Fetching languages data..."
languages_json=$(curl -s -H "Authorization: token $TOKEN" \
  "https://api.github.com/repos/$ORG/poliglots/languages")

languages=$(echo "$languages_json" | python3 << 'PYEOF'
import sys, json
data = json.loads(sys.stdin.read())
if not data:
    print("```\\nNo data available```")
    sys.exit(0)
total = sum(data.values())
items = sorted(data.items(), key=lambda x: x[1], reverse=True)
for lang, bytes_count in items:
    pct = (bytes_count / total) * 100
    bar = "█" * int(pct / 2)
    print(f"{lang:20} {pct:5.1f}% {bar}")
PYEOF
)

# --- 2. No. of PRs Merged (closed PRs) ---
echo "  → Fetching merged PRs..."
merged_prs=$(curl -s -H "Authorization: token $TOKEN" \
  "https://api.github.com/search/issues?q=repo:$ORG/poliglots+type:pr+state:closed" | \
  python3 -c "import sys, json; print(json.load(sys.stdin).get('total_count', 0))")

# --- 3. No. of PRs Open ---
echo "  → Fetching open PRs..."
open_prs=$(curl -s -H "Authorization: token $TOKEN" \
  "https://api.github.com/search/issues?q=repo:$ORG/poliglots+type:pr+state:open" | \
  python3 -c "import sys, json; print(json.load(sys.stdin).get('total_count', 0))")

# --- 4. Top Repos Contributed To ---
echo "  → Fetching top repos..."
top_repos=$(curl -s -H "Authorization: token $TOKEN" \
  "https://api.github.com/orgs/$ORG/repos?per_page=100&sort=updated&direction=desc" | \
  python3 << 'PYEOF'
import sys, json
data = json.loads(sys.stdin.read())
if not data:
    print("```\\nNo repos found```")
    sys.exit(0)
# Filter out the repo itself (poliglots/poliglots)
repos = [r for r in data if r['full_name'] != 'poliglots/poliglots']
# Sort by stars, then forks
repos = sorted(repos, key=lambda x: (x.get('stargazers_count', 0), x.get('forks_count', 0)), reverse=True)[:10]
if not repos:
    print("```\\nNo external repos```")
    sys.exit(0)
for r in repos:
    name = r['full_name']
    stars = r.get('stargazers_count', 0)
    forks = r.get('forks_count', 0)
    lang = r.get('language', 'N/A')
    print(f"• {name} ⭐{stars} 🍴{forks} ({lang})")
PYEOF
)

# --- Generate timestamp ---
timestamp=$(date -u '+%Y-%m-%d %H:%M UTC')

# --- Build stats section ---
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
