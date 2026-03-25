# Store Expense Bot Workflows

## Setup Workflow

1. Create the Telegram bot
2. Create and share the Google Sheet
3. Add `credentials.json`
4. Copy `.env.example` to `.env`
5. Run the bot from `./.venv/`

## Daily Operation Workflow

1. Send a quick expense message or use `/add`
2. Bot parses or collects the required fields
3. Bot writes the row to Google Sheets
4. Operator checks `/summary` or `/list` when needed

## Maintenance Workflow

1. Update dependencies or bot logic inside this project only
2. Verify `.env` and `credentials.json` are still present
3. Restart the bot from `./.venv/bin/python bot.py`
