import gspread
from datetime import datetime
import pytz

from .config import SPREADSHEET_ID, CREDENTIALS_FILE, TIMEZONE

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

HEADERS = ["Date", "Time", "Description", "Amount", "Category", "Paid By", "Payment Mode", "Added By"]
SHEET_NAME = "Expenses"
DASHBOARD_NAME = "Dashboard"
SETTLEMENTS_NAME = "Settlements"
SETTLEMENT_HEADERS = ["Date", "From", "To", "Amount", "Note"]
MONTHLY_SUMMARY_NAME = "Monthly Summary"
BUDGET_NAME = "Budget"
CATEGORIES = ["Raw Materials", "Labour", "Salary", "Maintenance", "Equipment",
               "Utilities", "Rent", "Transport", "Packaging", "Miscellaneous"]
PAYERS = ["Ali", "Anurag"]
PAYMENT_MODES = ["Cash", "UPI", "Binary"]

# Default monthly budgets per category (₹)
DEFAULT_BUDGETS = {
    "Raw Materials": 50000,
    "Labour":        30000,
    "Salary":        40000,
    "Maintenance":   10000,
    "Equipment":     15000,
    "Utilities":      5000,
    "Rent":          20000,
    "Transport":      8000,
    "Packaging":     10000,
    "Miscellaneous":  5000,
}


def _client():
    return gspread.service_account(filename=CREDENTIALS_FILE, scopes=SCOPES)


def _get_sheet():
    client = _client()
    spreadsheet = client.open_by_key(SPREADSHEET_ID)
    try:
        return spreadsheet.worksheet(SHEET_NAME)
    except gspread.exceptions.WorksheetNotFound:
        return spreadsheet.add_worksheet(title=SHEET_NAME, rows=1000, cols=10)


def _get_spreadsheet():
    return _client().open_by_key(SPREADSHEET_ID)


def setup_dashboard():
    """Creates or refreshes the Dashboard sheet with live formula cells."""
    spreadsheet = _get_spreadsheet()

    try:
        dash = spreadsheet.worksheet(DASHBOARD_NAME)
        dash.clear()
    except gspread.exceptions.WorksheetNotFound:
        dash = spreadsheet.add_worksheet(title=DASHBOARD_NAME, rows=60, cols=3)

    # Row layout (1-indexed):
    # 1   Title
    # 2   blank
    # 3   OVERALL SUMMARY
    # 4   Total All Time
    # 5     Company (Binary)
    # 6     Personal (Combined)
    # 7   blank
    # 8   PERSONAL PAYMENTS
    # 9   Anurag  ← B9
    # 10  Ali     ← B10
    # 11  blank
    # 12  COMPANY OWES
    # 13  To Anurag =B9
    # 14  To Ali    =B10
    # 15  blank
    # 16  EACH PARTNER'S 50% SHARE
    # 17  Anurag's share
    # 18  Ali's share
    # 19  blank
    # 20  NET SETTLEMENT
    # 21  Settlement formula
    # 22  blank
    # 23  THIS MONTH
    # 24  Total this month
    # 25  Anurag this month
    # 26  Ali this month
    # 27  blank
    # 28  THIS WEEK
    # 29  Total this week
    # 30  Anurag this week
    # 31  Ali this week
    # 32  blank
    # 33  MONTH-OVER-MONTH
    # 34  Last month total
    # 35  This month total (=B24)
    # 36  Change (amount)
    # 37  blank
    # 38  TOP 5 LARGEST EXPENSES
    # 39  #1
    # 40  #2
    # 41  #3
    # 42  #4
    # 43  #5
    # 44  blank
    # 45  CATEGORY BREAKDOWN
    # 46+ one row per category

    # Helper: week start (Monday) in YYYY-MM-DD
    week_start = '=TEXT(TODAY()-WEEKDAY(TODAY(),3),"YYYY-MM-DD")'

    data = [
        ["BINARY VENTURE — EXPENSE DASHBOARD", "", ""],
        ["", "", ""],
        ["── OVERALL SUMMARY ──────────────────────", "", ""],
        ["Total Expenses (All Time)",    "=SUM(Expenses!D2:D)", ""],
        ["  Company (Binary)",           '=SUMIF(Expenses!G2:G,"Binary",Expenses!D2:D)', ""],
        ["  Personal (Combined)",        '=SUMIFS(Expenses!D2:D,Expenses!G2:G,"<>Binary")', ""],
        ["", "", ""],
        ["── PERSONAL PAYMENTS (from own pocket) ─", "", ""],
        ["Anurag",                       '=SUMIFS(Expenses!D2:D,Expenses!F2:F,"Anurag",Expenses!G2:G,"<>Binary")', ""],
        ["Ali",                          '=SUMIFS(Expenses!D2:D,Expenses!F2:F,"Ali",Expenses!G2:G,"<>Binary")', ""],
        ["", "", ""],
        ["── COMPANY OWES (reimbursements due) ───", "", ""],
        ["To Anurag",                    "=B9", ""],
        ["To Ali",                       "=B10", ""],
        ["", "", ""],
        ["── EACH PARTNER'S 50% SHARE ────────────", "", ""],
        ["Anurag's share",               "=(B9+B10)/2", ""],
        ["Ali's share",                  "=(B9+B10)/2", ""],
        ["", "", ""],
        ["── NET SETTLEMENT ──────────────────────", "", ""],
        ['=IF(B9=B10,"Accounts settled — even split",IF(B9>B10,"Ali owes Anurag ₹"&TEXT((B9-B10)/2,"#,##0.00"),"Anurag owes Ali ₹"&TEXT((B10-B9)/2,"#,##0.00")))', "", ""],
        ["", "", ""],
        ["── THIS MONTH ───────────────────────────", "", ""],
        ["Total",
         '=SUMPRODUCT((LEFT(Expenses!A2:A1000,7)=TEXT(TODAY(),"YYYY-MM"))*Expenses!D2:D1000)', ""],
        ["Anurag",
         '=SUMPRODUCT((LEFT(Expenses!A2:A1000,7)=TEXT(TODAY(),"YYYY-MM"))*(Expenses!F2:F1000="Anurag")*(Expenses!G2:G1000<>"Binary")*Expenses!D2:D1000)', ""],
        ["Ali",
         '=SUMPRODUCT((LEFT(Expenses!A2:A1000,7)=TEXT(TODAY(),"YYYY-MM"))*(Expenses!F2:F1000="Ali")*(Expenses!G2:G1000<>"Binary")*Expenses!D2:D1000)', ""],
        ["", "", ""],
        ["── THIS WEEK ────────────────────────────", "", ""],
        ["Total",
         '=SUMPRODUCT((Expenses!A2:A1000>=TEXT(TODAY()-WEEKDAY(TODAY(),3),"YYYY-MM-DD"))*(Expenses!A2:A1000<>"")*(Expenses!D2:D1000))', ""],
        ["Anurag",
         '=SUMPRODUCT((Expenses!A2:A1000>=TEXT(TODAY()-WEEKDAY(TODAY(),3),"YYYY-MM-DD"))*(Expenses!A2:A1000<>"")*(Expenses!F2:F1000="Anurag")*(Expenses!G2:G1000<>"Binary")*Expenses!D2:D1000)', ""],
        ["Ali",
         '=SUMPRODUCT((Expenses!A2:A1000>=TEXT(TODAY()-WEEKDAY(TODAY(),3),"YYYY-MM-DD"))*(Expenses!A2:A1000<>"")*(Expenses!F2:F1000="Ali")*(Expenses!G2:G1000<>"Binary")*Expenses!D2:D1000)', ""],
        ["", "", ""],
        ["── MONTH-OVER-MONTH ─────────────────────", "", ""],
        ["Last month",
         '=SUMPRODUCT((LEFT(Expenses!A2:A1000,7)=TEXT(EOMONTH(TODAY(),-1),"YYYY-MM"))*Expenses!D2:D1000)', ""],
        ["This month",  "=B24", ""],
        ["Change",      '=IF(B34=0,"—",TEXT(B35-B34,"#,##0.00")&IF(B35>=B34," ▲"," ▼"))', ""],
        ["", "", ""],
        ["── TOP 5 LARGEST EXPENSES ──────────────", "", ""],
        ["#1", '=IFERROR(LARGE(Expenses!D2:D,1),"")', '=IFERROR(INDEX(Expenses!C2:C,MATCH(LARGE(Expenses!D2:D,1),Expenses!D2:D,0)),"")'],
        ["#2", '=IFERROR(LARGE(Expenses!D2:D,2),"")', '=IFERROR(INDEX(Expenses!C2:C,MATCH(LARGE(Expenses!D2:D,2),Expenses!D2:D,0)),"")'],
        ["#3", '=IFERROR(LARGE(Expenses!D2:D,3),"")', '=IFERROR(INDEX(Expenses!C2:C,MATCH(LARGE(Expenses!D2:D,3),Expenses!D2:D,0)),"")'],
        ["#4", '=IFERROR(LARGE(Expenses!D2:D,4),"")', '=IFERROR(INDEX(Expenses!C2:C,MATCH(LARGE(Expenses!D2:D,4),Expenses!D2:D,0)),"")'],
        ["#5", '=IFERROR(LARGE(Expenses!D2:D,5),"")', '=IFERROR(INDEX(Expenses!C2:C,MATCH(LARGE(Expenses!D2:D,5),Expenses!D2:D,0)),"")'],
        ["", "", ""],
        ["── CATEGORY BREAKDOWN ──────────────────", "", ""],
    ]

    for cat in CATEGORIES:
        data.append([cat, f'=SUMIF(Expenses!E2:E,"{cat}",Expenses!D2:D)', ""])

    dash.update(values=data, range_name="A1", value_input_option="USER_ENTERED")

    # Bold headers + widen column A — all in one batch request
    bold_rows = [1, 3, 8, 12, 16, 20, 21, 23, 28, 33, 38, 45]  # 1-indexed
    bold_requests = [
        {
            "repeatCell": {
                "range": {
                    "sheetId": dash.id,
                    "startRowIndex": r - 1,
                    "endRowIndex": r,
                    "startColumnIndex": 0,
                    "endColumnIndex": 1,
                },
                "cell": {"userEnteredFormat": {"textFormat": {"bold": True}}},
                "fields": "userEnteredFormat.textFormat.bold",
            }
        }
        for r in bold_rows
    ]
    bold_requests.append({
        "updateDimensionProperties": {
            "range": {"sheetId": dash.id, "dimension": "COLUMNS", "startIndex": 0, "endIndex": 1},
            "properties": {"pixelSize": 320},
            "fields": "pixelSize",
        }
    })
    spreadsheet.batch_update({"requests": bold_requests})


def setup_expenses_ux():
    """
    Applies to the Expenses sheet:
      - Data validation dropdowns for Category (col E), Paid By (col F), Payment Mode (col G)
      - Conditional formatting: colour rows by Payment Mode (Binary=blue, Cash=green, UPI=orange)
      - Running total formula in column I (header: Running Total)
    All done in a single batch_update call.
    """
    spreadsheet = _get_spreadsheet()
    sheet = spreadsheet.worksheet(SHEET_NAME)
    sid = sheet.id

    cat_list   = ",".join(CATEGORIES)
    payer_list = ",".join(PAYERS)
    mode_list  = ",".join(PAYMENT_MODES)

    # Column indices (0-based): E=4, F=5, G=6, I=8
    def _validation(col_idx, values_str):
        return {
            "setDataValidation": {
                "range": {"sheetId": sid, "startRowIndex": 1, "endRowIndex": 1000,
                          "startColumnIndex": col_idx, "endColumnIndex": col_idx + 1},
                "rule": {
                    "condition": {"type": "ONE_OF_LIST",
                                  "values": [{"userEnteredValue": v} for v in values_str.split(",")]},
                    "showCustomUi": True,
                    "strict": False,
                },
            }
        }

    def _cond_format(col_idx, value, rgb):
        r, g, b = rgb
        return {
            "addConditionalFormatRule": {
                "rule": {
                    "ranges": [{"sheetId": sid, "startRowIndex": 1, "endRowIndex": 1000,
                                "startColumnIndex": 0, "endColumnIndex": 9}],
                    "booleanRule": {
                        "condition": {
                            "type": "TEXT_EQ",
                            "values": [{"userEnteredValue": value}],
                        },
                        "format": {
                            "backgroundColor": {"red": r, "green": g, "blue": b}
                        },
                    },
                },
                "index": 0,
            }
        }

    requests = [
        _validation(4, cat_list),    # Category
        _validation(5, payer_list),  # Paid By
        _validation(6, mode_list),   # Payment Mode
        # Conditional formatting by Payment Mode column (G)
        _cond_format(6, "Binary", (0.80, 0.88, 0.97)),   # light blue
        _cond_format(6, "Cash",   (0.85, 0.96, 0.85)),   # light green
        _cond_format(6, "UPI",    (1.00, 0.94, 0.80)),   # light orange/amber
    ]
    spreadsheet.batch_update({"requests": requests})

    # Add Running Total header (col I = index 9) if not present
    header_row = sheet.row_values(1)
    if len(header_row) < 9 or header_row[8] != "Running Total":
        sheet.update_cell(1, 9, "Running Total")

    # Write running total formulas for rows 2..200 in one call
    running_total_cells = [[f"=SUM($D$2:D{row})"] for row in range(2, 201)]
    sheet.update(values=running_total_cells, range_name="I2:I201", value_input_option="USER_ENTERED")


def setup_monthly_summary():
    """
    Creates/refreshes the Monthly Summary sheet.
    Rows = last 12 months; Columns = categories + total.
    All values are SUMPRODUCT formulas pulling from Expenses sheet.
    """
    spreadsheet = _get_spreadsheet()
    try:
        ms = spreadsheet.worksheet(MONTHLY_SUMMARY_NAME)
        ms.clear()
    except gspread.exceptions.WorksheetNotFound:
        ms = spreadsheet.add_worksheet(title=MONTHLY_SUMMARY_NAME, rows=20, cols=len(CATEGORIES) + 2)

    tz = pytz.timezone(TIMEZONE)
    now = datetime.now(tz)

    # Build list of last 12 months (YYYY-MM), newest first
    months = []
    for i in range(11, -1, -1):
        # Go back i months from current month
        y = now.year
        m = now.month - i
        while m <= 0:
            m += 12
            y -= 1
        months.append(f"{y}-{m:02d}")

    # Header row
    header = ["Month"] + CATEGORIES + ["Total"]
    data = [header]

    for month in months:
        row = [month]
        for cat in CATEGORIES:
            formula = (
                f'=SUMPRODUCT('
                f'(LEFT(Expenses!$A$2:$A$1000,7)="{month}")*'
                f'(Expenses!$E$2:$E$1000="{cat}")*'
                f'Expenses!$D$2:$D$1000)'
            )
            row.append(formula)
        # Total for the month
        row.append(f'=SUMPRODUCT((LEFT(Expenses!$A$2:$A$1000,7)="{month}")*Expenses!$D$2:$D$1000)')
        data.append(row)

    ms.update(values=data, range_name="A1", value_input_option="USER_ENTERED")
    ms.freeze(rows=1, cols=1)

    # Bold header row
    sid = ms.id
    spreadsheet.batch_update({"requests": [
        {"repeatCell": {
            "range": {"sheetId": sid, "startRowIndex": 0, "endRowIndex": 1,
                      "startColumnIndex": 0, "endColumnIndex": len(header)},
            "cell": {"userEnteredFormat": {"textFormat": {"bold": True}}},
            "fields": "userEnteredFormat.textFormat.bold",
        }},
        {"updateDimensionProperties": {
            "range": {"sheetId": sid, "dimension": "COLUMNS", "startIndex": 0, "endIndex": 1},
            "properties": {"pixelSize": 100},
            "fields": "pixelSize",
        }},
    ]})


def setup_budget_tab():
    """
    Creates/refreshes the Budget sheet.
    Columns: Category | Budget (₹/month) | This Month Actual | Remaining | % Used
    Budgets are editable values; actuals pull live from Expenses sheet.
    """
    spreadsheet = _get_spreadsheet()
    try:
        bud = spreadsheet.worksheet(BUDGET_NAME)
        bud.clear()
    except gspread.exceptions.WorksheetNotFound:
        bud = spreadsheet.add_worksheet(title=BUDGET_NAME, rows=len(CATEGORIES) + 5, cols=5)

    header = ["Category", "Budget (₹/mo)", "This Month", "Remaining", "% Used"]
    data = [header]

    for i, cat in enumerate(CATEGORIES):
        row_num = i + 2  # 1-indexed, row 1 = header
        budget_val = DEFAULT_BUDGETS.get(cat, 0)
        actual_formula = (
            f'=SUMPRODUCT('
            f'(LEFT(Expenses!$A$2:$A$1000,7)=TEXT(TODAY(),"YYYY-MM"))*'
            f'(Expenses!$E$2:$E$1000="{cat}")*'
            f'Expenses!$D$2:$D$1000)'
        )
        remaining = f"=B{row_num}-C{row_num}"
        pct_used   = f'=IFERROR(C{row_num}/B{row_num},0)'
        data.append([cat, budget_val, actual_formula, remaining, pct_used])

    ms = bud
    ms.update(values=data, range_name="A1", value_input_option="USER_ENTERED")
    ms.freeze(rows=1)

    sid = ms.id
    # Bold header, widen col A, format col E as percentage
    spreadsheet.batch_update({"requests": [
        {"repeatCell": {
            "range": {"sheetId": sid, "startRowIndex": 0, "endRowIndex": 1,
                      "startColumnIndex": 0, "endColumnIndex": 5},
            "cell": {"userEnteredFormat": {"textFormat": {"bold": True}}},
            "fields": "userEnteredFormat.textFormat.bold",
        }},
        {"repeatCell": {
            "range": {"sheetId": sid, "startRowIndex": 1, "endRowIndex": len(CATEGORIES) + 1,
                      "startColumnIndex": 4, "endColumnIndex": 5},
            "cell": {"userEnteredFormat": {"numberFormat": {"type": "PERCENT", "pattern": "0.0%"}}},
            "fields": "userEnteredFormat.numberFormat",
        }},
        {"updateDimensionProperties": {
            "range": {"sheetId": sid, "dimension": "COLUMNS", "startIndex": 0, "endIndex": 1},
            "properties": {"pixelSize": 160},
            "fields": "pixelSize",
        }},
        # Conditional formatting: red if over budget (D < 0)
        {"addConditionalFormatRule": {
            "rule": {
                "ranges": [{"sheetId": sid, "startRowIndex": 1, "endRowIndex": len(CATEGORIES) + 1,
                            "startColumnIndex": 3, "endColumnIndex": 4}],
                "booleanRule": {
                    "condition": {"type": "NUMBER_LESS", "values": [{"userEnteredValue": "0"}]},
                    "format": {"backgroundColor": {"red": 0.96, "green": 0.80, "blue": 0.80}},
                },
            },
            "index": 0,
        }},
        # Conditional formatting: green if under 80% used
        {"addConditionalFormatRule": {
            "rule": {
                "ranges": [{"sheetId": sid, "startRowIndex": 1, "endRowIndex": len(CATEGORIES) + 1,
                            "startColumnIndex": 4, "endColumnIndex": 5}],
                "booleanRule": {
                    "condition": {"type": "NUMBER_LESS", "values": [{"userEnteredValue": "0.8"}]},
                    "format": {"backgroundColor": {"red": 0.85, "green": 0.96, "blue": 0.85}},
                },
            },
            "index": 0,
        }},
    ]})


def ensure_header_row():
    sheet = _get_sheet()
    first_row = sheet.row_values(1)
    if first_row != HEADERS:
        sheet.insert_row(HEADERS, index=1)
        sheet.freeze(rows=1)


def append_expense(description: str, amount: float, category: str,
                   paid_by: str, payment_mode: str, added_by: str,
                   date_str: str = None):
    tz = pytz.timezone(TIMEZONE)
    now = datetime.now(tz)
    if not date_str:
        date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")

    sheet = _get_sheet()
    sheet.append_row([date_str, time_str, description, amount, category, paid_by, payment_mode, added_by])


def check_budget_alert(category: str) -> dict | None:
    """
    Returns an alert dict if this month's spend for the category has crossed
    80% or 100% of the DEFAULT_BUDGETS threshold, else None.

    Returns: {"category": str, "spent": float, "budget": float, "pct": float, "over": bool}
    """
    budget = DEFAULT_BUDGETS.get(category)
    if not budget:
        return None

    tz = pytz.timezone(TIMEZONE)
    month = datetime.now(tz).strftime("%Y-%m")
    sheet = _get_sheet()
    all_rows = sheet.get_all_records()

    spent = sum(
        float(r.get("Amount", 0))
        for r in all_rows
        if str(r.get("Date", "")).startswith(month) and r.get("Category") == category
    )
    pct = spent / budget
    if pct >= 0.80:
        return {"category": category, "spent": spent, "budget": budget, "pct": pct, "over": pct >= 1.0}
    return None


def get_today_expenses() -> list[dict]:
    tz = pytz.timezone(TIMEZONE)
    today = datetime.now(tz).strftime("%Y-%m-%d")
    sheet = _get_sheet()
    all_rows = sheet.get_all_records()
    return [r for r in all_rows if str(r.get("Date", "")) == today]


HEADER_COL = {h: i + 1 for i, h in enumerate(HEADERS)}


def get_recent_expenses(n: int = 10, offset: int = 0) -> tuple[list[dict], bool]:
    """Returns (rows, has_more). offset counts from the newest entry."""
    sheet = _get_sheet()
    all_rows = sheet.get_all_records()
    total = len(all_rows)
    end = total - offset
    start = max(0, end - n)
    result = all_rows[start:end]
    for i, row in enumerate(result):
        row["_sheet_row"] = start + i + 2  # +1 for header, +1 for 1-indexing
    has_more = start > 0
    return result, has_more


def search_expenses(keyword: str, limit: int = 15) -> list[dict]:
    """Search all expenses by keyword (matches description or category, case-insensitive)."""
    sheet = _get_sheet()
    all_rows = sheet.get_all_records()
    kw = keyword.lower().strip()
    matches = [
        r for r in all_rows
        if kw in str(r.get("Description", "")).lower()
        or kw in str(r.get("Category", "")).lower()
        or kw in str(r.get("Paid By", "")).lower()
    ]
    # Return most recent matches, with sheet row indices
    total = len(all_rows)
    result = matches[-limit:]
    for r in result:
        idx = all_rows.index(r)
        r["_sheet_row"] = idx + 2  # +1 header, +1 1-indexing
    return result


def delete_expense_row(sheet_row: int):
    sheet = _get_sheet()
    sheet.delete_rows(sheet_row)


def update_expense_field(sheet_row: int, field: str, value):
    sheet = _get_sheet()
    col = HEADER_COL[field]
    sheet.update_cell(sheet_row, col, value)


def _get_settlements_sheet():
    client = _client()
    spreadsheet = client.open_by_key(SPREADSHEET_ID)
    try:
        sheet = spreadsheet.worksheet(SETTLEMENTS_NAME)
    except gspread.exceptions.WorksheetNotFound:
        sheet = spreadsheet.add_worksheet(title=SETTLEMENTS_NAME, rows=500, cols=5)
        sheet.append_row(SETTLEMENT_HEADERS)
        sheet.freeze(rows=1)
    return sheet


def log_settlement(from_user: str, to_user: str, amount: float, note: str = "") -> None:
    tz = pytz.timezone(TIMEZONE)
    date_str = datetime.now(tz).strftime("%Y-%m-%d")
    sheet = _get_settlements_sheet()
    first_row = sheet.row_values(1)
    if first_row != SETTLEMENT_HEADERS:
        sheet.insert_row(SETTLEMENT_HEADERS, index=1)
        sheet.freeze(rows=1)
    sheet.append_row([date_str, from_user, to_user, amount, note])


def get_settlements(limit: int = 10) -> list[dict]:
    sheet = _get_settlements_sheet()
    rows = sheet.get_all_records()
    return rows[-limit:]


def get_balance_summary(month: str = None) -> dict:
    """
    Calculate personal payment totals for Ali and Anurag.

    Binary payments are company money — excluded from personal settlement.
    Personal payments (Cash/UPI) create a debt: if Ali paid more personally,
    Anurag owes Ali half the difference (assuming 50/50 partnership).

    Args:
        month: Optional filter in 'YYYY-MM' format (e.g. '2026-03').
    """
    sheet = _get_sheet()
    all_rows = sheet.get_all_records()

    if month:
        all_rows = [r for r in all_rows if str(r.get("Date", "")).startswith(month)]

    ali_rows = [r for r in all_rows if r.get("Paid By") == "Ali" and r.get("Payment Mode") != "Binary"]
    anurag_rows = [r for r in all_rows if r.get("Paid By") == "Anurag" and r.get("Payment Mode") != "Binary"]
    binary_rows = [r for r in all_rows if r.get("Payment Mode") == "Binary"]

    ali_personal = sum(float(r.get("Amount", 0)) for r in ali_rows)
    anurag_personal = sum(float(r.get("Amount", 0)) for r in anurag_rows)
    binary_total = sum(float(r.get("Amount", 0)) for r in binary_rows)

    diff = ali_personal - anurag_personal
    settlement = abs(diff) / 2

    return {
        "ali_personal": ali_personal,
        "ali_count": len(ali_rows),
        "anurag_personal": anurag_personal,
        "anurag_count": len(anurag_rows),
        "binary_total": binary_total,
        "binary_count": len(binary_rows),
        "diff": diff,
        "settlement": settlement,
        "creditor": "Ali" if diff > 0 else "Anurag",
        "debtor": "Anurag" if diff > 0 else "Ali",
    }
