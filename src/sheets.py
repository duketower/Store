import gspread
from google.oauth2.service_account import Credentials
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
CATEGORIES = ["Raw Materials", "Labour", "Salary", "Maintenance", "Equipment",
               "Utilities", "Rent", "Transport", "Packaging", "Miscellaneous"]


def _get_sheet():
    creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
    client = gspread.authorize(creds)
    spreadsheet = client.open_by_key(SPREADSHEET_ID)
    try:
        return spreadsheet.worksheet(SHEET_NAME)
    except gspread.exceptions.WorksheetNotFound:
        return spreadsheet.add_worksheet(title=SHEET_NAME, rows=1000, cols=10)


def _get_spreadsheet():
    creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
    client = gspread.authorize(creds)
    return client.open_by_key(SPREADSHEET_ID)


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

    # Bold the title and section headers
    bold = {"textFormat": {"bold": True}}
    header_rows = ["A1", "A3", "A8", "A12", "A16", "A20", "A21", "A23", "A28", "A33", "A38", "A45"]
    for cell in header_rows:
        dash.format(cell, bold)

    # Widen column A
    spreadsheet.batch_update({"requests": [{
        "updateDimensionProperties": {
            "range": {"sheetId": dash.id, "dimension": "COLUMNS", "startIndex": 0, "endIndex": 1},
            "properties": {"pixelSize": 320},
            "fields": "pixelSize"
        }
    }]})


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


def delete_expense_row(sheet_row: int):
    sheet = _get_sheet()
    sheet.delete_rows(sheet_row)


def update_expense_field(sheet_row: int, field: str, value):
    sheet = _get_sheet()
    col = HEADER_COL[field]
    sheet.update_cell(sheet_row, col, value)


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
