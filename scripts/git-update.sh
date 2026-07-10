#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: git update <version>"
  echo "Example: git update VER11"
  exit 1
fi

VERSION="$1"

git status
git add .
git commit -m "$(cat <<EOF
${VERSION}
EOF
)"
git push origin main
