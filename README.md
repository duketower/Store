# Store Workspace

The workspace is now organized into three main folders:

- `POS/` for the POS application and its client deployment platform
- `Websites/` for company and client websites
- `Bots/` for Telegram bots and future bot projects

## Current Layout

```text
Store/
├── POS/
│   ├── src/
│   ├── platform/
│   └── docs/
├── Websites/
│   ├── binaryventures.in/
│   └── binaryventures.in V2/
└── Bots/
    └── store-expense-bot/
```

## What Lives Where

- Run the POS web app from `POS/`
- Run the POS client build/deploy tooling from `POS/platform/`
- Run the company website from `Websites/binaryventures.in/`
- Build the next website strategy and redesign in `Websites/binaryventures.in V2/`
- Keep Telegram bot work inside `Bots/`

## Documentation System

- Workspace docs live at the root: `CLAUDE.md`, `ARCHITECTURE.md`, `PROJECT_PLAN.md`, `TASK_QUEUE.md`, `DECISIONS.md`
- Each real project also has its own local documentation set
- `Websites/` and `Bots/` stay lightweight and act as project collections

## Git Rules

- Versioned Git hooks live in `.githooks/`
- `pre-commit` enforces documentation sync and small commit batches
- `commit-msg` enforces clear commit messages like `feat(pos): add client build validation`
- Commit message template lives in `.gitmessage.txt`
- For a fresh clone, run `./.githooks/install.sh`
- Final task responses should come after scoped commits, not before them
- Common generated folders such as `node_modules`, `.next`, `dist`, `out`, and `.vercel` are ignored workspace-wide
