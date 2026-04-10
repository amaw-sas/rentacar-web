#!/bin/bash
# Vercel Ignored Build Step
# Exit 1 = PROCEED with build (do not ignore)
# Exit 0 = SKIP build (ignore, cancel)
# https://vercel.com/docs/projects/overview#ignored-build-step
#
# Usage: Configure in Vercel Dashboard → Settings → Build & Deployment → Ignored Build Step
# Command: bash ../../scripts/vercel-ignore-build.sh

echo "Checking if build is needed..."

# Always build if no previous SHA (first deploy)
if [ -z "$VERCEL_GIT_PREVIOUS_SHA" ]; then
  echo "First deploy — building"
  exit 1
fi

# Always build on manual redeploy (dashboard "Redeploy" sets previous == current)
if [ "$VERCEL_GIT_PREVIOUS_SHA" = "$VERCEL_GIT_COMMIT_SHA" ]; then
  echo "Manual redeploy (SHA unchanged) — building"
  exit 1
fi

# Detect which brand this project is for (from the root directory name)
BRAND=$(basename "$PWD")
echo "Brand: $BRAND"

# Files/dirs that trigger build for ALL brands (shared core)
# scripts/vercel-ignore-build.sh is included so script changes rebuild all brands
SHARED_PATHS="packages/logic/ package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json scripts/vercel-ignore-build.sh"

# Check if shared paths changed
for path in $SHARED_PATHS; do
  if git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- "../../$path" 2>/dev/null; then
    continue
  else
    echo "Shared path changed: $path — building"
    exit 1
  fi
done

# Check if this brand's package changed
if git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- "." 2>/dev/null; then
  echo "No changes in $BRAND or shared paths — skipping build"
  exit 0
else
  echo "Changes detected in $BRAND — building"
  exit 1
fi
