# Store Workspace Architecture

## Purpose

This workspace groups three independent development lanes under one repository:

- POS product development
- Website development
- Bot development

## Top-Level Design

```text
Store/
├── POS/          # Product app + client deployment platform
├── Websites/     # Website collection
└── Bots/         # Bot collection
```

## Boundaries

### POS

- Own frontend app, build config, docs, and client deployment tooling
- Shared only with itself through `POS/platform/`

### Websites

- One website per subfolder
- Each website is an independent app with its own docs and dependencies

### Bots

- One bot per subfolder
- Each bot owns its runtime, secrets, and docs

## Coordination Model

- Workspace root handles shared planning only
- Project-level architecture lives inside each project root
- Collection folders exist to group future projects cleanly
