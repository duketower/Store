#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

chmod +x .githooks/pre-commit .githooks/commit-msg
git config core.hooksPath .githooks
git config commit.template .gitmessage.txt

printf '%s\n' "Git hooks installed for this clone."
printf '%s\n' "  hooksPath: $(git config --get core.hooksPath)"
printf '%s\n' "  commit template: $(git config --get commit.template)"
