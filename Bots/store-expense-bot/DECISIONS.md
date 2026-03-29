# Store Expense Bot Decisions

## Decision 001

Use Telegram as the primary operator interface.

Reason:
- Fast and familiar for store operators
- Good fit for quick expense capture

## Decision 002

Use Google Sheets as the persistence/reporting backend.

Reason:
- Easy to inspect manually
- Good enough for lightweight expense logging

## Decision 003

Keep the bot as a small Python project with a local `.venv/`.

Reason:
- Simple deployment and maintenance
- Clean isolation from the Node-based POS and website projects

## Decision 004

Keep Google Sheets schema labels and dropdown values centralized in `src/constants.py`.

Reason:
- Prevent drift between Telegram handlers and Sheets integration
- Avoid repeated hardcoded literals like `Payment Mode` and `Paid By`
- Make future schema changes safer and easier to audit
