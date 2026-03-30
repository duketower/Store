# Store Workspace Instructions

This repository is a workspace containing multiple independent projects.

## Workspace Buckets

- `POS/` contains the grocery store POS product and its client deployment tooling
- `Websites/` contains websites, one project per subfolder
- `Bots/` contains Telegram bots and future automation bots

## Working Rules

- Always work inside the relevant project folder, not at the workspace root, unless the task is cross-project
- Read the nearest project `CLAUDE.md`, `README.md`, and `ARCHITECTURE.md` before making non-trivial changes
- Do not mix files across projects
- Do not create root-level app code, configs, or dependencies for individual projects
- Keep root docs limited to workspace coordination

## Documentation Sync Rule

Documentation must be updated as part of the same task whenever the underlying project understanding changes.

- A task is not complete until code and docs agree
- For every non-trivial change, review the nearest relevant markdown files before finishing
- If no documentation update is needed, say that explicitly in the final summary
- Never leave architecture, setup, workflow, or planning docs stale after a feature, refactor, or structural change

### Which file to update

- Update `README.md` when setup, run, build, deploy, folder layout, or project purpose changes
- Update `ARCHITECTURE.md` when system structure, boundaries, data flow, or major technical design changes
- Update `PROJECT_PLAN.md` when priorities, roadmap, or delivery phases change
- Update `TASK_QUEUE.md` when active work, next tasks, or completed milestones change
- Update `DECISIONS.md` when a durable technical or product decision is made
- Update `docs/product_spec.md` when user-facing scope or feature behavior changes
- Update `docs/api_design.md` when interfaces, integrations, or config inputs change
- Update `docs/workflows.md` when operating steps, release flow, or maintenance process changes

## Documentation Layers

- Root docs describe workspace organization and cross-project priorities
- Each real project root owns its own implementation docs
- Collection folders like `Websites/` and `Bots/` should stay lightweight and point to child projects

## Reference Files

- `README.md`
- `ARCHITECTURE.md`
- `PROJECT_PLAN.md`
- `TASK_QUEUE.md`
- `DECISIONS.md`
- `SONAR_RUNBOOK.md` for repo-wide SonarCloud access and review workflow

## Shared Access Secrets

- Never commit live SonarCloud, Firebase, Cloudflare, or other service tokens into tracked files
- For SonarCloud access, use the root `SONAR_RUNBOOK.md` and a local-only `.sonar.env.local` file
- If access details change, update the runbook and any referencing docs in the same task

## Commit Discipline

- Commits must be small and focused
- Commit messages must follow: `type(scope): short summary`
- The repo uses Git hooks to enforce documentation sync, small batches, and clean commit messages
- If a change is intentionally large or exceptional, use the documented one-time bypass variables instead of weakening the rule permanently
- Before sending a final task summary for work that changed files, run `git status` for the relevant scope
- If the current task changed files, commit those task changes before the final response instead of leaving them local
- Do not mix unrelated pre-existing changes into the task commit; keep the commit scoped to the work you just completed
- Include the resulting commit hash or hashes in the final summary whenever you created commits
