#!/bin/bash
# Vercel Ignored Build Step
# Exit 1 = skip build, Exit 0 = proceed with build
# https://vercel.com/docs/projects/overview#ignored-build-step
#
# Usage: Configure in Vercel Dashboard → Settings → Git → Ignored Build Step
# Command: bash ../../scripts/vercel-ignore-build.sh

echo "🔍 Checking if build is needed..."

# Always build if no previous SHA (first deploy)
if [ -z "$VERCEL_GIT_PREVIOUS_SHA" ]; then
  echo "✅ First deploy — building"
  exit 0
fi

# Detect which brand this project is for (from the root directory name)
BRAND=$(basename "$PWD")
echo "📦 Brand: $BRAND"

# Files/dirs that trigger build for ALL brands (shared core)
SHARED_PATHS="packages/logic/ package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json"

# Check if shared paths changed
for path in $SHARED_PATHS; do
  if git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- "../../$path" 2>/dev/null; then
    continue
  else
    echo "✅ Shared path changed: $path — building"
    exit 0
  fi
done

# Check if this brand's package changed
if git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- "." 2>/dev/null; then
  echo "⏭️  No changes in $BRAND or shared paths — skipping build"
  exit 1
else
  echo "✅ Changes detected in $BRAND — building"
  exit 0
fi
