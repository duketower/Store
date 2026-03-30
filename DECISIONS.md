# Workspace Decisions

## Decision 001

Use three top-level buckets: `POS/`, `Websites/`, and `Bots/`.

Reason:
- Keeps unrelated codebases from mixing
- Makes future expansion predictable

## Decision 002

Store full AI/project docs at each real project root, not inside every collection folder.

Reason:
- AI tools work best with the nearest relevant context
- Avoids duplicated documentation

## Decision 003

Keep root docs focused on coordination, not implementation.

Reason:
- Prevents workspace docs from becoming noisy
- Leaves technical detail close to the code it describes

## Decision 004

Keep SonarCloud access details in one root runbook and keep live tokens out of git.

Reason:
- SonarCloud review work spans multiple projects in this workspace
- Centralizing the org key, project key, API workflow, and review steps avoids duplication
- Tokens are secrets and must stay local-only instead of being committed into markdown
