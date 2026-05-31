#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/bin:/bin:$PATH"

SCRIPT_PATH="${BASH_SOURCE[0]}"
SCRIPT_DIR="$(cd "${SCRIPT_PATH%/*}" && pwd)"
REPO="${FEVIO_REPO:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
cd "$REPO"

TODAY="$(TZ=Asia/Seoul date +%F)"
DIGEST="docs/06-hw/daily-git-history/$TODAY.md"
ALLOWED_PATH_REGEX='^docs/06-hw/'

if [ ! -f "$DIGEST" ]; then
  echo "Digest not found: $DIGEST"
  exit 1
fi

cat > /tmp/hermes-review-prompt.txt <<EOF2
You are running the scheduled HW9 Hermes review loop for Fevio.

Read:
- AGENTS.md
- README.md
- docs/06-hw/git-history-summary-skill.md
- $DIGEST
- docs/06-hw/git-history-TODOS.md

Allowed:
- Update only $DIGEST
- Update only docs/06-hw/git-history-TODOS.md
- Append only docs/06-hw/hermes-review-log.md

Forbidden:
- Do not edit app code.
- Do not edit src files.
- Do not edit supabase files.
- Do not edit database migrations.
- Do not deploy.
- Do not close issues.
- Do not merge pull requests.
- Do not access secrets.
- Do not send emails.

Task:
Add a "Hermes Review" section to today's digest.
Explain what changed, why it matters for Fevio, what risks to verify, and whether the loop is closed.
EOF2

hermes chat < /tmp/hermes-review-prompt.txt

if ! grep -q '^## Hermes Review$' "$DIGEST"; then
  echo "ERROR: Hermes did not add a '## Hermes Review' section to $DIGEST"
  exit 1
fi

BAD_FILES="$(git status --porcelain --untracked-files=all | awk -v allowed="$ALLOWED_PATH_REGEX" '
  {
    path = substr($0, 4)
    if ($0 ~ /^R/ || $0 ~ /^C/) {
      split(path, parts, " -> ")
      path = parts[2]
    }
    if (path !~ allowed) {
      print path
    }
  }
')"

if [ -n "$BAD_FILES" ]; then
  echo "ERROR: Hermes modified files outside docs/06-hw/:"
  echo "$BAD_FILES"
  exit 1
fi
