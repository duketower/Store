# Store Bot — AI Handoff Document

> **Instructions for any AI picking this up:**
> - Read this file top to bottom before touching any code.
> - After completing any task, update the "Session Log" and "Current State" sections at the bottom.
> - Keep this file accurate — the next AI (or Claude) will use it to verify and continue.

---

## What This Project Is

A Telegram bot for two business partners — **Anurag** and **Ali** — to track store expenses for their business "Binary Venture". All data is stored in a Google Sheet. The bot handles guided entry, quick-add free text, editing, deleting, balance calculations, and scheduled summaries.

- **Repo:** https://github.com/duketower/Store
- **Notion page:** https://notion.so/31c888f3c14f810cb7ffd51c42a983ef
- **Language:** Python 3.11+
- **Key libs:** python-telegram-bot v22.6 (async), gspread v6.1.2, pytz, APScheduler (via job-queue extra)

---

## Project Structure

```
Store/
├── bot.py                  # Entry point — registers all handlers, starts polling
├── src/
│   ├── __init__.py
│   ├── config.py           # Reads .env — BOT_TOKEN, SPREADSHEET_ID, USER_MAP, etc.
│   ├── handlers.py         # ALL bot logic — command/callback handlers
│   ├── sheets.py           # ALL Google Sheets operations
│   └── parser.py           # Free-text expense parser ("milk 45.50")
├── .env                    # NOT committed — contains secrets
├── credentials.json        # NOT committed — Google service account key
├── requirements.txt
└── HANDOFF.md              # This file
```

---

## Environment Setup

```bash
pip install -r requirements.txt
# .env must have:
TELEGRAM_BOT_TOKEN=...
GOOGLE_SPREADSHEET_ID=...
GOOGLE_CREDENTIALS_FILE=credentials.json
TIMEZONE=Asia/Kolkata
ANURAG_TELEGRAM_ID=1470176
ALI_TELEGRAM_ID=300902306
MAX_LIST_ENTRIES=10
```

Run: `python bot.py`

**Note:** First startup takes 75–90s due to OAuth2 token fetch latency on this machine. The bot always eventually prints "Google Sheet ready. Bot is running." — this is normal.

---

## Google Sheet Structure

Sheet tab: **Expenses**
Columns: `Date | Time | Description | Amount | Category | Paid By | Payment Mode | Added By | Running Total`

Other tabs (auto-created at startup):
- **Dashboard** — live formula summary (overall, personal, settlement, weekly, monthly, top 5, category breakdown)
- **Monthly Summary** — SUMPRODUCT pivot: last 12 months × category
- **Budget** — per-category monthly budget vs actual, % used, red/green highlights
- **Settlements** — log of manual settlement payments between partners

---

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome + usage |
| `/add` | Guided flow: description → amount → category → paid by → payment mode → date |
| free text `milk 45` | Quick-add via parser |
| `/list` | Last 10 expenses, paginated with "Load More", inline edit/delete |
| `/summary` | Today's totals |
| `/balance [YYYY-MM]` | Personal payment diff + settlement amount (all time or by month) |
| `/search <keyword>` | Search by description, category, or payer |
| `/settle [amount] [note]` | Log a settlement payment; no args shows current balance |
| `/cancel` | Abort an in-progress /add |

---

## Key Architectural Decisions

- **ConversationHandler** manages multi-step `/add` flow and inline edit (text/date fields).
- **Standalone CallbackQueryHandlers** registered *before* the ConversationHandler for: list entry tap, back, delete confirm, delete yes, edit field select, edit value callback, load more.
- **Cross-user notifications:** after every save, the other partner is notified via `_notify_other_user()`.
- **Budget alerts:** after every save, `check_budget_alert(category)` checks if this month's category spend crossed 80% or 100% of `DEFAULT_BUDGETS`. Broadcasts to all users.
- **Settlements sheet** is lazy-created on first `/settle` call.
- **`setup_expenses_ux()`, `setup_monthly_summary()`, `setup_budget_tab()`** called at every bot startup to keep sheets in sync.
- **gspread auth:** `gspread.service_account(filename=CREDENTIALS_FILE, scopes=SCOPES)` — modern API, no deprecated `authorize()`.
- **Batch updates:** all Sheets formatting done via `spreadsheet.batch_update()` to avoid rate limits.

---

## Payment Mode Logic

| Mode | Meaning |
|------|---------|
| Cash / UPI | Personal payment from Ali or Anurag's own pocket |
| Binary | Company money (excluded from personal settlement calculation) |

Settlement = `abs(ali_personal - anurag_personal) / 2` — whoever paid more personally is owed half the difference.

---

## Default Budgets (₹/month, editable in Budget sheet col B)

Raw Materials: 50,000 | Labour: 30,000 | Salary: 40,000 | Maintenance: 10,000 | Equipment: 15,000 | Utilities: 5,000 | Rent: 20,000 | Transport: 8,000 | Packaging: 10,000 | Miscellaneous: 5,000

---

## What's Done

- [x] Guided /add flow with ConversationHandler
- [x] Quick-add free text parser
- [x] /list with pagination (Load More) + inline edit/delete all fields
- [x] /summary (today's totals)
- [x] /balance with optional month filter
- [x] /search keyword
- [x] /settle + Settlements log tab
- [x] Cross-user notifications (expense added, settlement logged)
- [x] Scheduled daily summary at 9PM IST
- [x] Scheduled weekly summary every Sunday 9PM IST
- [x] Dashboard tab: overall, personal payments, company owes, 50% share, settlement, this month, this week, month-over-month, top 5, category breakdown
- [x] Expenses sheet UX: data validation dropdowns, conditional row colours, running total col
- [x] Monthly Summary tab (12-month pivot)
- [x] Budget tab (budget vs actual, % used, red/green highlights)
- [x] Budget alerts (80% warning + 100% exceeded → broadcast to all users)

## What's Pending / Ideas

- [ ] Budget tab: make budgets user-editable from Telegram (e.g. `/budget Labour 35000`)
- [ ] Conditional formatting on Expenses: highlight amounts > some threshold
- [ ] Export/report command (`/report YYYY-MM`) → formatted monthly summary as message
- [ ] `/settle` with specific direction override (e.g. `/settle ali anurag 500`)
- [ ] Caching gspread client to speed up startup (reuse across calls within a session)
- [ ] Unit tests for parser.py and balance logic

---

## Session Log

> Append a bullet here after every session. Newest first.

- **2026-03-08 (Claude Sonnet 4.6):** Implemented /settle + Settlements tab, /search, Expenses sheet UX (dropdowns + conditional formatting + running total), Monthly Summary pivot tab, Budget tab with % used and red/green highlights, budget alerts at 80%/100%. All committed and pushed to GitHub. Dashboard formula verified correct.
- **Earlier sessions:** Built full bot from scratch — all commands, handlers, sheets, ConversationHandler, pagination, cross-user notifications, scheduled summaries, dashboard, search, settle.

---

## How to Verify After Taking Over

1. `git pull origin main` to get latest.
2. Run `python bot.py` and wait for "Bot is running." (~90s on this machine).
3. Open the Google Sheet — check Dashboard, Monthly Summary, Budget tabs loaded correctly.
4. Test: send a free-text expense in Telegram → confirm it saves and budget alert fires if threshold crossed.
5. Check `/list`, `/balance`, `/search`, `/settle` all respond correctly.
6. Update this file with what you verified and what you changed.
