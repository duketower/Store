# Store Expense Bot Architecture

## Goal

Capture store expense messages from Telegram and write them to a Google Sheet quickly and reliably.

## Main Components

### Bot Entrypoint

- `bot.py` boots the Telegram application

### Config

- `src/config.py` loads environment variables and runtime configuration
- `src/constants.py` is the single source of truth for expense-sheet headers, dropdown values, and shared business labels

### Parsing

- `src/parser.py` interprets free-text entries like `milk 45.50`

### Handlers

- `src/handlers.py` manages commands, guided flows, and message handling using the shared constants module for field names and options

### Sheets Integration

- `src/sheets.py` reads and writes Google Sheets data using service-account credentials and reuses the shared schema constants to avoid drift

## External Dependencies

- Telegram Bot API through `python-telegram-bot`
- Google Sheets API through `gspread` and `google-auth`

## Runtime Notes

- Secrets live in `.env`
- Google service account credentials live in `credentials.json`
- Local Python environment lives in `.venv/`
