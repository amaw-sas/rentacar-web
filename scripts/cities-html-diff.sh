#!/usr/bin/env bash
# Cities HTML diff — verifies SCEN-011 (zero structural regression vs baseline).
#
# Usage:
#   bash scripts/cities-html-diff.sh <BASELINE_BASE_URL> <POST_BASE_URL> [city1 city2 city3 ...]
#
# Example (local-only):
#   bash scripts/cities-html-diff.sh http://localhost:4099 http://localhost:4000 armenia bogota cali
#
# Example (vs production):
#   bash scripts/cities-html-diff.sh https://alquilatucarro.com http://localhost:4000 armenia
#
# What it does:
#   1. curl baseline /<city> and post /<city>
#   2. Filter volatile attributes that change between builds (data-v-*, asset
#      hashes, __NUXT__ payload timestamps, csrf nonces)
#   3. Diff the normalized output
#   4. Empty diff → SCEN-011 satisfied. Non-empty → human review.

set -u

BASELINE_URL="${1:?baseline URL required (e.g. http://localhost:4099)}"
POST_URL="${2:?post-migration URL required (e.g. http://localhost:4000)}"
shift 2
CITIES=("${@:-armenia bogota cali}")

OUTDIR=$(mktemp -d)
trap 'rm -rf "$OUTDIR"' EXIT

normalize() {
  # Strip volatile attributes:
  # - data-v-XXXXXXXX (Vue scoped CSS hashes)
  # - data-n-head-ssr (Nuxt SSR marker, present in baseline only)
  # - asset query strings (?v=hash)
  # - whitespace differences
  # - __NUXT__ payload (full JSON serialized state — diffs every render)
  sed -E '
    s/data-v-[a-f0-9]+="[^"]*"//g;
    s/data-n-head-ssr="[^"]*"//g;
    s/\?v=[a-f0-9]+//g;
    s/<script[^>]*window\.__NUXT__[^<]*<\/script>//g;
    s/"Date","[0-9TZ:.\-]+"/"Date","REDACTED"/g;
    s/[[:space:]]+/ /g;
  ' | tr '>' '>\n' | grep -v '^[[:space:]]*$'
}

total_cities=${#CITIES[@]}
diffs_total=0

for city in "${CITIES[@]}"; do
  echo "=== /$city ==="

  curl -sS "$BASELINE_URL/$city" > "$OUTDIR/$city.baseline.html" || {
    echo "FAIL: could not fetch $BASELINE_URL/$city"; exit 1;
  }
  curl -sS "$POST_URL/$city" > "$OUTDIR/$city.post.html" || {
    echo "FAIL: could not fetch $POST_URL/$city"; exit 1;
  }

  normalize < "$OUTDIR/$city.baseline.html" > "$OUTDIR/$city.baseline.norm"
  normalize < "$OUTDIR/$city.post.html" > "$OUTDIR/$city.post.norm"

  if diff -u "$OUTDIR/$city.baseline.norm" "$OUTDIR/$city.post.norm" > "$OUTDIR/$city.diff" 2>&1; then
    echo "OK: bytewise identical after normalization"
  else
    diff_lines=$(wc -l < "$OUTDIR/$city.diff")
    diffs_total=$((diffs_total + diff_lines))
    echo "DIFF ($diff_lines lines):"
    cat "$OUTDIR/$city.diff" | head -80
    echo ""
  fi
done

echo ""
echo "=== summary ==="
echo "cities checked: $total_cities"
echo "total diff lines: $diffs_total"
if [ "$diffs_total" -eq 0 ]; then
  echo "✅ SCEN-011 satisfied: zero structural diff"
else
  echo "⚠️  SCEN-011 not satisfied: review the diffs above before merging"
fi
