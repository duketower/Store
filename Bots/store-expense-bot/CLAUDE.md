# Store Expense Bot Instructions

This is a Telegram bot that captures grocery expense entries and writes them to Google Sheets.

## Stack

- Python
- python-telegram-bot
- gspread
- google-auth
- python-dotenv

## Project Rules

- Keep changes inside `Bots/store-expense-bot/`
- Reuse the existing module split: `bot.py`, `src/config.py`, `src/parser.py`, `src/handlers.py`, `src/sheets.py`
- Do not hardcode secrets or credential contents
- Prefer simple conversational bot flows over overly complex abstractions

## Runtime

Use the local virtual environment in `./.venv/`.

## Reference Docs

- `README.md`
- `ARCHITECTURE.md`
- `PROJECT_PLAN.md`
- `TASK_QUEUE.md`
- `DECISIONS.md`
- `docs/product_spec.md`
- `docs/api_design.md`
- `docs/workflows.md`

## Repo Git Rules

- The repo pre-commit hook enforces doc sync and small commit batches
- The repo commit-msg hook enforces clear commit messages

## Documentation Sync Rule

- Before finishing any non-trivial task, update the affected docs in this folder if commands, bot behavior, integrations, workflow, roadmap, or decisions changed
- `README.md` = setup and run instructions
- `ARCHITECTURE.md` = module responsibilities and integrations
- `PROJECT_PLAN.md` = roadmap and priorities
- `TASK_QUEUE.md` = current, next, done
- `DECISIONS.md` = durable choices
- `docs/*` = product behavior, interface flow, workflows
- If no docs changed, say so explicitly in the final summary
