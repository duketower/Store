# SonarCloud Runbook

This file is the single repo-level reference for SonarCloud access, issue review, and safe token handling.

## Current Project Details

- SonarCloud organization: `duketower`
- SonarCloud project key: `duketower_Store`
- Dashboard URL: `https://sonarcloud.io/project/overview?id=duketower_Store&organization=duketower`
- API base: `https://sonarcloud.io/api`

## Secret Handling

- Do not commit live SonarCloud tokens into this repository.
- Do not paste live tokens into tracked markdown files, source files, or committed config.
- Keep the token in a local-only file named `.sonar.env.local` at the repo root, or in a password manager.
- The previously shared token should be rotated or revoked after use because it was exposed in chat history.

Recommended local file:

```bash
SONAR_ORG=duketower
SONAR_PROJECT=duketower_Store
SONAR_TOKEN=<your-local-sonar-token>
```

Load it when needed:

```bash
set -a
source .sonar.env.local
set +a
```

## Common API Checks

Verify access:

```bash
curl -u "$SONAR_TOKEN:" \
  "https://sonarcloud.io/api/projects/search?organization=$SONAR_ORG&projects=$SONAR_PROJECT"
```

List open security hotspots:

```bash
curl -u "$SONAR_TOKEN:" \
  "https://sonarcloud.io/api/hotspots/search?organization=$SONAR_ORG&projectKey=$SONAR_PROJECT&status=TO_REVIEW&p=1&ps=500"
```

List unresolved issues:

```bash
curl -u "$SONAR_TOKEN:" \
  "https://sonarcloud.io/api/issues/search?projects=$SONAR_PROJECT&resolved=false&p=1&ps=500"
```

## Review Workflow

1. Load `.sonar.env.local`.
2. Pull the current hotspot or issue list from the API or SonarCloud UI.
3. Verify each finding in the code before changing anything.
4. Fix only real security or correctness issues first. Do not churn the full code-smell backlog unless requested.
5. After a fix, re-run the relevant local build or test command.
6. Push the updated commit so SonarCloud can re-analyze it.
7. Mark the hotspot as `Fixed` only after the code change is present in the analyzed revision.

## What To Update When Access Changes

If the SonarCloud organization, project key, or working process changes, update:

- `SONAR_RUNBOOK.md`
- `README.md`
- `CLAUDE.md`
- `TASK_QUEUE.md`
- `DECISIONS.md` if the storage policy or access model changes permanently

## Recommended Policy

- Keep one shared runbook instead of duplicating Sonar details in each project folder.
- Keep credentials local-only and gitignored.
- Use the runbook for repo-wide security review work across `POS/`, `Websites/`, and `Bots/`.
