# Store Expense Bot Interface Design

## User-Facing Commands

- Free-text expense input like `milk 45.50`
- `/add`
- `/summary`
- `/list`
- `/cancel`

## Internal Flow

1. Telegram message arrives
2. Handler routes the message
3. Parser extracts expense data when needed
4. Sheets layer writes a row to Google Sheets

## Configuration Inputs

- `.env`
- `credentials.json`

## Output Shape

Each logged expense should include:

- Date
- Time
- Description
- Amount
- Category
- Added by
