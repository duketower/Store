# Store — Grocery Expense Tracker

A Telegram bot that logs grocery store expenses to Google Sheets. Send a message like `milk 45.50` and it's saved instantly.

## Project Docs

- `CLAUDE.md`
- `ARCHITECTURE.md`
- `PROJECT_PLAN.md`
- `TASK_QUEUE.md`
- `DECISIONS.md`
- `docs/product_spec.md`
- `docs/api_design.md`
- `docs/workflows.md`

---

## Setup

### Step 1 — Create the Telegram Bot

1. Open Telegram, search for `@BotFather`
2. Send `/newbot`, choose a name and username (must end in `bot`)
3. Copy the token it gives you

### Step 2 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Name it anything (e.g. `Grocery Expenses`)
3. Copy the spreadsheet ID from the URL — the long string between `/d/` and `/edit`

### Step 3 — Google Cloud Service Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Enable **Google Sheets API** and **Google Drive API**
4. Go to `IAM & Admin` → `Service Accounts` → `Create Service Account`
5. Give it any name, role: `Editor`
6. On the service account page → `Keys` tab → `Add Key` → `Create new key` → `JSON`
7. Rename the downloaded file to `credentials.json` and place it in this project folder
8. Open `credentials.json`, copy the `client_email` value
9. Go to your Google Sheet → `Share` → paste that email → give it `Editor` access

### Step 4 — Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `TELEGRAM_BOT_TOKEN` — from Step 1
- `GOOGLE_SPREADSHEET_ID` — from Step 2

### Step 5 — Install & Run

```bash
./.venv/bin/pip install -r requirements.txt
./.venv/bin/python bot.py
```

---

## Usage

| Action | How |
|--------|-----|
| Quick add | Type `milk 45.50` in the chat |
| Guided add | Send `/add` and follow the prompts |
| Today's total | Send `/summary` |
| Recent entries | Send `/list` |
| Cancel add | Send `/cancel` |

---

## Google Sheet Columns

| Date | Time | Description | Amount | Category | Paid By | Payment Mode | Added By |
|------|------|-------------|--------|----------|---------|--------------|----------|
| 2026-03-07 | 14:32:05 | Milk and eggs | 45.50 | Raw Materials | Ali | Cash | Ali |

The canonical sheet headers and dropdown values now live in `src/constants.py`.
When changing a column name or allowed value, update that file first and reuse it from handlers and Sheets code.

---

## Files

```
bot.py          Entry point — run this to start the bot
src/constants.py Shared sheet headers, payer lists, categories, and payment modes
handlers.py     Telegram command and message handlers
sheets.py       Google Sheets read/write logic
parser.py       Free-text message parser
config.py       Loads environment variables
credentials.json  Google service account key (you provide this)
.env            Your secrets (you create this from .env.example)
```
