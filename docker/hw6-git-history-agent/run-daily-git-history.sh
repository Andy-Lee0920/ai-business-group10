#!/usr/bin/env bash
set -euo pipefail

cd /workspace

git config --global --add safe.directory /workspace

DATE="${DIGEST_DATE:-$(TZ=Asia/Seoul date +%F)}"
HW_DIR="/workspace/docs/06-hw"
OUT_DIR="$HW_DIR/daily-git-history"
TODO_FILE="$HW_DIR/git-history-TODOS.md"
RUN_LOG="$HW_DIR/docker-run-log.md"

mkdir -p "$OUT_DIR"

DIGEST_FILE="$OUT_DIR/$DATE.md"
NEXT_DATE="$(TZ=Asia/Seoul date -d "$DATE +1 day" +%F)"
START="${DIGEST_START:-$DATE 00:00 +0900}"
END="${DIGEST_END:-$NEXT_DATE 00:00 +0900}"

COMMIT_COUNT="$(git log origin/main --since="$START" --until="$END" --oneline 2>/dev/null | wc -l | tr -d ' ')"

LOG_FILE="/tmp/git-log-$DATE.txt"
STAT_FILE="/tmp/git-diff-stat-$DATE.txt"

git log origin/main \
  --since="$START" \
  --until="$END" \
  --date=iso \
  --name-status \
  --pretty=format:"COMMIT %H%nDATE %ad%nAUTHOR %an%nSUBJECT %s%n" \
  > "$LOG_FILE" || true

SINCE_REF="$(git rev-list -n 1 --before="$START" origin/main 2>/dev/null || true)"
UNTIL_REF="$(git rev-list -n 1 --before="$END" origin/main 2>/dev/null || true)"

if [ -n "$SINCE_REF" ] && [ -n "$UNTIL_REF" ]; then
  git diff --stat "$SINCE_REF".."$UNTIL_REF" > "$STAT_FILE" || true
else
  echo "No comparable refs found for $START to $END." > "$STAT_FILE"
fi

APP_CHANGED="$(grep -E '(^|[[:space:]])(app|src)/' "$LOG_FILE" || true)"
DOCS_CHANGED="$(grep -E '(^|[[:space:]])docs/' "$LOG_FILE" || true)"
SUPABASE_CHANGED="$(grep -E '(^|[[:space:]])supabase/' "$LOG_FILE" || true)"
TESTS_CHANGED="$(grep -E '(^|[[:space:]])(test|tests|e2e|playwright|vitest|__tests__)/' "$LOG_FILE" || true)"
CONFIG_CHANGED="$(grep -E '(^|[[:space:]])(package.json|package-lock.json|pnpm-lock.yaml|next.config|tsconfig|eslint|tailwind|\.github)/' "$LOG_FILE" || true)"

{
  echo "# Daily Git History Digest - $DATE"
  echo
  echo "## Date Range"
  echo
  echo "Analyzed commits on \`origin/main\` from $START to $END."
  echo
  echo "## Commit Count"
  echo
  echo "$COMMIT_COUNT"
  echo
  echo "## Changed Areas"
  echo

  if [ -n "$APP_CHANGED" ]; then
    echo "- Product behavior / UI: app or src files changed."
  fi

  if [ -n "$DOCS_CHANGED" ]; then
    echo "- Documentation / project management: docs files changed."
  fi

  if [ -n "$SUPABASE_CHANGED" ]; then
    echo "- Data model / Supabase: supabase files changed."
  fi

  if [ -n "$TESTS_CHANGED" ]; then
    echo "- Tests / verification: test-related files changed."
  fi

  if [ -n "$CONFIG_CHANGED" ]; then
    echo "- Configuration / CI: config or workflow files changed."
  fi

  if [ "$COMMIT_COUNT" = "0" ]; then
    echo "- No commits found in this date range."
  fi

  echo
  echo "## Git Diff Stat"
  echo
  echo '```txt'
  cat "$STAT_FILE"
  echo '```'
  echo
  echo "## Git Log"
  echo
  echo '```txt'
  cat "$LOG_FILE"
  echo '```'
  echo
  echo "## Product Meaning for Fevio"
  echo
  echo "This digest should be reviewed against Fevio's core product boundaries:"
  echo
  echo "- Care operation, not medical advice."
  echo "- Patient privacy before convenience."
  echo "- Partner support without oversharing."
  echo "- User confirmation before executable care tasks."
  echo "- Calm and practical UX."
  echo
  echo "## Risks or Verification Items"
  echo
  echo "- Check whether any user-facing change affects Fevio's medical-safety boundary."
  echo "- Check whether any partner-related change affects privacy or oversharing."
  echo "- Check whether any Supabase/auth change needs additional verification."
  echo "- Check whether any UI change implies diagnosis, dosage advice, or treatment recommendation."
  echo
  echo "## Suggested Next Actions"
  echo
  echo "- [ ] Review changed areas above."
  echo "- [ ] Verify whether any changed files affect partner sharing or privacy."
  echo "- [ ] Run relevant tests if product behavior, auth, or Supabase files changed."
  echo "- [ ] Add human interpretation if the raw git log requires product judgment."
  echo
  echo "## Security Constraint Used"
  echo
  echo "This digest was generated inside an on-premise Docker container."
  echo
  echo "The repository was mounted read-only, while only \`docs/06-hw/\` was mounted read-write."
  echo
  echo "The container was not given deployment credentials, GitHub write tokens, secrets, or permission to modify application code."
  echo
  echo "## Loop Status"
  echo
  echo "Closed."
  echo
  echo "The loop reached its exit condition because it wrote a dated digest, included commit count, grouped changed areas, listed verification risks, and documented the security constraint."
} > "$DIGEST_FILE"

if [ ! -f "$TODO_FILE" ]; then
  echo "# Git History TODOs" > "$TODO_FILE"
fi

remove_dated_section() {
  local file="$1"
  local tmp

  if [ ! -f "$file" ]; then
    return
  fi

  tmp="$(mktemp)"
  awk -v marker="## $DATE" '
    $0 == marker { skip = 1; next }
    /^## / && skip { skip = 0 }
    !skip { print }
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
}

remove_dated_section "$TODO_FILE"

{
  echo
  echo "## $DATE"
  echo
  echo "- [ ] Review daily git digest: \`docs/06-hw/daily-git-history/$DATE.md\`"
  echo "- [ ] Check whether changed files affect Fevio's medical-safety boundary."
  echo "- [ ] Check whether changed files affect partner sharing or privacy."
  echo "- [ ] Confirm whether follow-up tests are needed."
} >> "$TODO_FILE"

if [ ! -f "$RUN_LOG" ]; then
  echo "# Docker Git History Run Log" > "$RUN_LOG"
fi

remove_dated_section "$RUN_LOG"

{
  echo
  echo "## $DATE"
  echo
  echo "- Ran daily git history loop inside Docker."
  echo "- Output: \`docs/06-hw/daily-git-history/$DATE.md\`"
  echo "- Write scope: \`docs/06-hw/\` only."
  echo "- Loop status: closed."
} >> "$RUN_LOG"

echo "Created $DIGEST_FILE"
