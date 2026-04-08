#!/bin/bash
# Download brand logos from Firebase Storage
# logo.png does not exist in Firebase (404) — skipped
# og-alquilatucarro.jpg already local at /img/og-alquilatucarro.jpg — skipped
# Run from project root: bash scripts/download-brand-logos.sh

set -eu

BASE="https://firebasestorage.googleapis.com/v0/b/rentacar-403321.firebasestorage.app/o"
OUT="packages/logic/public/images/brand"

mkdir -p "$OUT"

echo "=== Downloading logos ==="
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Fog-logo.png?alt=media" -o "$OUT/og-logo.png"
curl -fSL "$BASE/rentacar-main%2Falquilatucarro%2Fimg%2Flogo.svg?alt=media" -o "$OUT/logo.svg"

echo ""
echo "=== Done ==="
ls -lh "$OUT/"
