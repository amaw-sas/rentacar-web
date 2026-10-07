#!/usr/bin/env bash
# Executable form of the observable scenarios for the "lint is broken in two
# levels" change. Run from the repo root: bash scripts/verify-lint-scenarios.sh
#
# SCEN-001  `pnpm lint` exits 0 and really analyses the four packages
# SCEN-002  each package lints on its own
# SCEN-003  a seeded defect turns the lint red (the rules bite)
# SCEN-004  the CI step has no continue-on-error and fails on a seeded defect
# SCEN-006  nothing was silenced: no undeclared eslint-disable
#
# SCEN-005 (no behaviour change: 4 unit suites + e2e collection + typecheck) is
# NOT here on purpose — it runs the real suites, which take minutes; it is
# driven separately so this script stays a fast gate.

set -uo pipefail
cd "$(dirname "$0")/.."

PASS=0
FAIL=0
SEED_FILE='packages/logic/src/__lint_seed__.ts'

ok()   { printf '  \033[32mPASS\033[0m  %s\n' "$1"; PASS=$((PASS + 1)); }
bad()  { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; FAIL=$((FAIL + 1)); }
head_() { printf '\n\033[1m%s\033[0m\n' "$1"; }

cleanup() { rm -f "$SEED_FILE"; }
trap cleanup EXIT

# ---------------------------------------------------------------- SCEN-001
head_ 'SCEN-001 — pnpm lint exits 0 and analyses the four packages'
LINT_OUT="$(pnpm lint 2>&1)"
LINT_EXIT=$?
[ "$LINT_EXIT" -eq 0 ] && ok "pnpm lint exit 0" || bad "pnpm lint exit $LINT_EXIT"
grep -q 'command not found' <<<"$LINT_OUT" && bad "output still says 'command not found'" || ok "no 'command not found'"
grep -q 'Parsing error'     <<<"$LINT_OUT" && bad "output has a Parsing error"          || ok "no 'Parsing error'"

ANALYSED="$(pnpm exec eslint . --format json 2>/dev/null \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{console.log(JSON.parse(d).length)}catch{console.log(0)}})')"
[ "${ANALYSED:-0}" -ge 1100 ] && ok "analysed $ANALYSED files (floor 1100)" \
                              || bad "analysed only ${ANALYSED:-0} files, floor is 1100"

for pkg_dir in packages/logic packages/ui-alquilatucarro packages/ui-alquilame packages/ui-alquicarros; do
  n="$(pnpm exec eslint "$pkg_dir" --format json 2>/dev/null \
    | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{console.log(JSON.parse(d).length)}catch{console.log(0)}})')"
  [ "${n:-0}" -ge 50 ] && ok "$pkg_dir: $n files analysed" || bad "$pkg_dir: only ${n:-0} files analysed"
done

# ---------------------------------------------------------------- SCEN-002
head_ 'SCEN-002 — each package lints on its own'
for pkg in @rentacar-main/logic ui-alquilatucarro ui-alquilame ui-alquicarros; do
  if pnpm --filter "$pkg" lint >/dev/null 2>&1; then ok "pnpm --filter $pkg lint → 0"
  else bad "pnpm --filter $pkg lint → non-zero"; fi
done

# ---------------------------------------------------------------- SCEN-003
head_ 'SCEN-003 — a seeded defect turns the lint red'
cat > "$SEED_FILE" <<'SEED'
// Temporary file written by scripts/verify-lint-scenarios.sh. Deleted on exit.
export function seeded() {
  const neverUsed = 42
  return 'seeded'
}
SEED
SEED_OUT="$(pnpm lint 2>&1)"
SEED_EXIT=$?
[ "$SEED_EXIT" -ne 0 ] && ok "seeded defect → exit $SEED_EXIT (non-zero)" || bad "seeded defect still exits 0 — the rules do NOT bite"
grep -q '__lint_seed__' <<<"$SEED_OUT"    && ok "output names the offending file" || bad "output does not name the file"
grep -q 'no-unused-vars' <<<"$SEED_OUT"   && ok "output names the rule"           || bad "output does not name the rule"

# ---------------------------------------------------------------- SCEN-004
head_ 'SCEN-004 — the CI step fails on the same defect, and has no continue-on-error'
# The CI step is literally `run: pnpm lint`, so run exactly that.
( pnpm lint >/dev/null 2>&1 ) && bad "CI step command exits 0 with the defect present" \
                              || ok "CI step command (pnpm lint) exits non-zero with the defect present"
cleanup
( pnpm lint >/dev/null 2>&1 ) && ok "CI step command exits 0 again once the defect is removed" \
                              || bad "CI step command still non-zero after removing the defect"

# Count the DIRECTIVE, not the word: lines 49 and 130 of ci.yml are comments
# that mention continue-on-error, so a bare `grep -c` returns 2 even when the
# directive is gone. That is the trap this check exists to avoid.
CoE="$(grep -cE '^[[:space:]]*continue-on-error:' .github/workflows/ci.yml || true)"
[ "$CoE" -eq 0 ] && ok "no continue-on-error directive left in ci.yml" \
                 || bad "ci.yml still has $CoE continue-on-error directive(s)"

# ---------------------------------------------------------------- SCEN-006
head_ 'SCEN-006 — nothing silenced'
# This script is excluded from its own search. It contains the very string it
# looks for, four times, so including it makes the check count itself and report
# 4 additions forever — a red that means nothing, which is worse than no check.
DISABLES="$(git diff --unified=0 "$(git merge-base HEAD origin/main)"...HEAD \
  -- . ':(exclude)scripts/verify-lint-scenarios.sh' \
  | grep -c '^+.*eslint-disable' || true)"
[ "${DISABLES:-0}" -eq 0 ] && ok "no eslint-disable added in this branch" \
                           || bad "${DISABLES} eslint-disable added — each must be declared in the PR"

# ---------------------------------------------------------------- summary
printf '\n\033[1m%s\033[0m\n' "RESULT: $PASS pass, $FAIL fail"
[ "$FAIL" -eq 0 ] || exit 1
