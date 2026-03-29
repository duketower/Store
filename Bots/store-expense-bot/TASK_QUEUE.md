# Store Expense Bot Task Queue

## Current

- Verify the bot setup is reproducible from the new `.venv/` location
- Add stronger operational guidance for deployment and credentials
- Keep project docs aligned with the real module layout

## Next

- Improve error handling around Google Sheets operations
- Add clearer validation and feedback for malformed expense messages
- Consider better summaries and category assistance

## Done

- Moved the bot into `Bots/store-expense-bot/`
- Rebuilt the Python virtual environment inside the project
- Added project-level documentation scaffold
- Centralized shared sheet headers, payers, categories, and payment modes in `src/constants.py`
- Removed duplicated business literals from `src/handlers.py` and `src/sheets.py`
