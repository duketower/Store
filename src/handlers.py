from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler
from datetime import datetime, timedelta
import pytz

from .parser import parse_expense
from .sheets import (append_expense, get_today_expenses, get_recent_expenses,
                     get_balance_summary, delete_expense_row, update_expense_field)
from .config import MAX_LIST_ENTRIES, USER_MAP, TIMEZONE


def _get_other_user_id(sender_id: int) -> int | None:
    return next((uid for uid in USER_MAP if uid != sender_id), None)


async def _notify_other_user(context, sender_id: int, summary: str):
    other_id = _get_other_user_id(sender_id)
    if other_id:
        sender_name = USER_MAP.get(sender_id, "Someone")
        try:
            await context.bot.send_message(other_id, f"New expense by {sender_name}:\n{summary}")
        except Exception:
            pass

# ConversationHandler states
WAITING_DESCRIPTION, WAITING_AMOUNT, WAITING_CATEGORY, WAITING_PAID_BY, WAITING_PAYMENT_MODE, WAITING_DATE, EDITING_TEXT = range(7)

CATEGORIES = ["Raw Materials", "Labour", "Salary", "Maintenance", "Equipment", "Utilities", "Rent", "Transport", "Packaging", "Miscellaneous"]
PAYERS = ["Ali", "Anurag"]
PAYMENT_MODES = ["Cash", "UPI", "Binary"]


# --- Auth helpers ---

def _get_sender_name(user_id: int) -> str | None:
    """Returns 'Ali' or 'Anurag', or None if the user is not authorized."""
    return USER_MAP.get(user_id)


async def _check_auth(update: Update) -> bool:
    """Rejects unauthorized users. Returns True if allowed, False if blocked."""
    name = _get_sender_name(update.effective_user.id)
    if not name:
        await update.effective_message.reply_text("Sorry, you're not authorized to use this bot.")
        return False
    return True


# --- Keyboards ---

def _category_keyboard(prefix: str = "cat") -> InlineKeyboardMarkup:
    buttons = [InlineKeyboardButton(c, callback_data=f"{prefix}:{c}") for c in CATEGORIES]
    rows = [buttons[i:i+2] for i in range(0, len(buttons), 2)]
    return InlineKeyboardMarkup(rows)


def _paid_by_keyboard(sender_name: str, prefix: str = "paid") -> InlineKeyboardMarkup:
    """Labels the sender's own button as 'Me (Name)' for quick one-tap."""
    buttons = [
        InlineKeyboardButton(
            f"Me ({name})" if name == sender_name else name,
            callback_data=f"{prefix}:{name}"
        )
        for name in PAYERS
    ]
    return InlineKeyboardMarkup([buttons])


def _payment_mode_keyboard(prefix: str = "mode") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[InlineKeyboardButton(m, callback_data=f"{prefix}:{m}") for m in PAYMENT_MODES]])


def _date_keyboard() -> InlineKeyboardMarkup:
    tz = pytz.timezone(TIMEZONE)
    today = datetime.now(tz)
    dates = [
        (today,                  "Today"),
        (today - timedelta(1),   "Yesterday"),
        (today - timedelta(2),   "Day Before Yesterday"),
    ]
    buttons = [
        [InlineKeyboardButton(label, callback_data=f"date:{d.strftime('%Y-%m-%d')}")]
        for d, label in dates
    ]
    buttons.append([InlineKeyboardButton("📅 Enter Date", callback_data="date:custom")])
    return InlineKeyboardMarkup(buttons)


# --- Save helper ---

async def _do_save(context: ContextTypes.DEFAULT_TYPE, added_by: str):
    d = context.user_data
    append_expense(
        description=d["description"],
        amount=d["amount"],
        category=d["category"],
        paid_by=d["paid_by"],
        payment_mode=d["payment_mode"],
        added_by=added_by,
        date_str=d.get("date"),
    )


def _expense_summary(d: dict) -> str:
    source = "Company account" if d["payment_mode"] == "Binary" else f"{d['paid_by']}'s personal"
    return (
        f"{d['description']} — {d['amount']:.2f}\n"
        f"Category: {d['category']}\n"
        f"Paid by: {d['paid_by']} via {d['payment_mode']} ({source})"
    )


# --- /start ---

async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await _check_auth(update):
        return
    sender_name = _get_sender_name(update.effective_user.id)
    await update.message.reply_text(
        f"Hi {sender_name}! I track your store expenses.\n\n"
        "Quick add — just type:\n"
        "  milk 45.50\n"
        "  coffee beans 230\n\n"
        "Commands:\n"
        "  /add — guided step-by-step entry\n"
        "  /summary — today's total\n"
        "  /list — last 10 expenses\n"
        "  /balance — who owes whom\n"
        "  /cancel — cancel an in-progress /add"
    )


# --- Quick-add entry point (free-text message) ---

async def quick_add_entry(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await _check_auth(update):
        return ConversationHandler.END

    parsed = parse_expense(update.message.text)
    if not parsed:
        await update.message.reply_text(
            "Couldn't parse that. Try:\n  milk 45.50\n  coffee beans 230\n\nOr use /add for guided entry."
        )
        return ConversationHandler.END

    sender_name = _get_sender_name(update.effective_user.id)
    context.user_data["description"] = parsed["description"]
    context.user_data["amount"] = parsed["amount"]
    context.user_data["sender_name"] = sender_name

    await update.message.reply_text(
        f"{parsed['description']} — {parsed['amount']:.2f}\n\nPick a category:",
        reply_markup=_category_keyboard()
    )
    return WAITING_CATEGORY


# --- /add guided flow ---

async def add_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await _check_auth(update):
        return ConversationHandler.END
    sender_name = _get_sender_name(update.effective_user.id)
    context.user_data["sender_name"] = sender_name
    await update.message.reply_text("What did you buy?")
    return WAITING_DESCRIPTION


async def add_description(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["description"] = update.message.text.strip()
    await update.message.reply_text("How much did it cost?")
    return WAITING_AMOUNT


async def add_amount(update: Update, context: ContextTypes.DEFAULT_TYPE):
    raw = update.message.text.strip().replace(",", ".")
    try:
        amount = float(raw)
        if amount <= 0 or amount >= 1_000_000:
            raise ValueError
    except ValueError:
        await update.message.reply_text("Please send a valid amount (e.g. 45.50).")
        return WAITING_AMOUNT

    context.user_data["amount"] = amount
    await update.message.reply_text("Pick a category:", reply_markup=_category_keyboard())
    return WAITING_CATEGORY


# --- Shared callback steps ---

async def handle_category(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    context.user_data["category"] = query.data.replace("cat:", "")
    sender_name = context.user_data["sender_name"]

    await query.edit_message_text(
        f"{context.user_data['description']} — {context.user_data['amount']:.2f}"
        f" | {context.user_data['category']}\n\nWho paid?",
        reply_markup=_paid_by_keyboard(sender_name)
    )
    return WAITING_PAID_BY


async def handle_paid_by(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    context.user_data["paid_by"] = query.data.replace("paid:", "")

    await query.edit_message_text(
        f"Paid by: {context.user_data['paid_by']}\n\nPayment method?",
        reply_markup=_payment_mode_keyboard()
    )
    return WAITING_PAYMENT_MODE


async def handle_payment_mode(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    context.user_data["payment_mode"] = query.data.replace("mode:", "")

    await query.edit_message_text(
        f"{context.user_data['description']} — {context.user_data['amount']:.2f}"
        f" | {context.user_data['category']} | {context.user_data['paid_by']} | {context.user_data['payment_mode']}"
        f"\n\nWhich date?",
        reply_markup=_date_keyboard()
    )
    return WAITING_DATE


async def handle_date_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    value = query.data.replace("date:", "")

    # Edit mode: updating an existing expense's date
    if context.user_data.get("edit_date_mode"):
        if value == "custom":
            await query.edit_message_text("Enter date as DD-MM-YYYY (e.g. 05-03-2026):")
            context.user_data["edit_date_custom"] = True
            return EDITING_TEXT
        sheet_row = context.user_data.get("edit_row")
        try:
            update_expense_field(sheet_row, "Date", value)
            await query.edit_message_text(f"Updated Date to: {value}")
        except Exception as e:
            await query.edit_message_text(f"Update failed.\n({e})")
        context.user_data.pop("edit_row", None)
        context.user_data.pop("edit_field", None)
        context.user_data.pop("edit_date_mode", None)
        return ConversationHandler.END

    if value == "custom":
        await query.edit_message_text("Enter date as DD-MM-YYYY (e.g. 05-03-2026):")
        return WAITING_DATE

    context.user_data["date"] = value
    sender_name = context.user_data["sender_name"]
    try:
        await _do_save(context, added_by=sender_name)
        summary = _expense_summary(context.user_data)
        await query.edit_message_text("Saved!\n" + summary)
        await _notify_other_user(context, update.effective_user.id, summary)
    except Exception as e:
        await query.edit_message_text(f"Storage error, please try again.\n({e})")

    context.user_data.clear()
    return ConversationHandler.END


async def handle_date_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles custom date text input — for both add and edit flows."""
    raw = update.message.text.strip()
    try:
        dt = datetime.strptime(raw, "%d-%m-%Y")
        date_value = dt.strftime("%Y-%m-%d")
    except ValueError:
        await update.message.reply_text("Invalid format. Please enter as DD-MM-YYYY (e.g. 05-03-2026):")
        return WAITING_DATE

    # Edit mode: update existing expense
    if context.user_data.get("edit_date_mode"):
        sheet_row = context.user_data.get("edit_row")
        try:
            update_expense_field(sheet_row, "Date", date_value)
            await update.message.reply_text(f"Updated Date to: {date_value}")
        except Exception as e:
            await update.message.reply_text(f"Update failed.\n({e})")
        context.user_data.clear()
        return ConversationHandler.END

    # Add mode: continue saving
    context.user_data["date"] = date_value
    sender_name = context.user_data["sender_name"]
    try:
        await _do_save(context, added_by=sender_name)
        summary = _expense_summary(context.user_data)
        await update.message.reply_text("Saved!\n" + summary)
        await _notify_other_user(context, update.effective_user.id, summary)
    except Exception as e:
        await update.message.reply_text(f"Storage error, please try again.\n({e})")

    context.user_data.clear()
    return ConversationHandler.END


async def cancel_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    await update.message.reply_text("Cancelled.")
    return ConversationHandler.END


# --- /summary ---

async def summary_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await _check_auth(update):
        return
    try:
        rows = get_today_expenses()
        if not rows:
            await update.message.reply_text("No expenses recorded today yet.")
            return

        total = sum(float(r.get("Amount", 0)) for r in rows)
        binary = sum(float(r.get("Amount", 0)) for r in rows if r.get("Payment Mode") == "Binary")
        ali_personal = sum(float(r.get("Amount", 0)) for r in rows
                           if r.get("Paid By") == "Ali" and r.get("Payment Mode") != "Binary")
        anurag_personal = sum(float(r.get("Amount", 0)) for r in rows
                              if r.get("Paid By") == "Anurag" and r.get("Payment Mode") != "Binary")

        await update.message.reply_text(
            f"Today's total: {total:.2f} ({len(rows)} entries)\n"
            f"  Ali personal:     {ali_personal:.2f}\n"
            f"  Anurag personal:  {anurag_personal:.2f}\n"
            f"  Binary (company): {binary:.2f}"
        )
    except Exception as e:
        await update.message.reply_text(f"Couldn't fetch summary.\n({e})")


# --- /list ---

def _list_keyboard(rows: list[dict], next_offset: int, has_more: bool) -> InlineKeyboardMarkup:
    """One numbered button per entry (newest-first). Adds Load More if more pages exist."""
    buttons = [
        InlineKeyboardButton(str(i), callback_data=f"entry:{r['_sheet_row']}")
        for i, r in enumerate(reversed(rows), 1)
    ]
    rows_kb = [buttons[i:i+5] for i in range(0, len(buttons), 5)]
    if has_more:
        rows_kb.append([InlineKeyboardButton("⬇️ Load More", callback_data=f"list_more:{next_offset}")])
    return InlineKeyboardMarkup(rows_kb)


def _format_list_lines(rows: list[dict], start_num: int = 1) -> list[str]:
    lines = []
    for i, r in enumerate(reversed(rows), start_num):
        date = str(r.get("Date", ""))
        time = str(r.get("Time", ""))[:5]
        desc = r.get("Description", "")
        amt = float(r.get("Amount", 0))
        cat = r.get("Category", "")
        paid_by = r.get("Paid By", "")
        mode = r.get("Payment Mode", "")
        lines.append(f"{i}. {date} {time} — {desc} — {amt:.2f}\n   {cat} | {paid_by} | {mode}")
    return lines


async def list_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await _check_auth(update):
        return
    try:
        rows, has_more = get_recent_expenses(MAX_LIST_ENTRIES, offset=0)
        if not rows:
            await update.message.reply_text("No expenses recorded yet.")
            return

        lines = _format_list_lines(rows)
        next_offset = len(rows)
        await update.message.reply_text(
            "Recent expenses:\n\n" + "\n\n".join(lines) + "\n\nTap a number to edit or delete:",
            reply_markup=_list_keyboard(rows, next_offset, has_more)
        )
    except Exception as e:
        await update.message.reply_text(f"Couldn't fetch list.\n({e})")


async def handle_list_more(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    offset = int(query.data.replace("list_more:", ""))
    try:
        rows, has_more = get_recent_expenses(MAX_LIST_ENTRIES, offset=offset)
        if not rows:
            await query.answer("No more entries.", show_alert=True)
            return
        lines = _format_list_lines(rows)
        next_offset = offset + len(rows)
        await query.message.reply_text(
            "Older expenses:\n\n" + "\n\n".join(lines) + "\n\nTap a number to edit or delete:",
            reply_markup=_list_keyboard(rows, next_offset, has_more)
        )
    except Exception as e:
        await query.answer(f"Error: {e}", show_alert=True)


# --- Edit / Delete callbacks ---

def _entry_detail_text(r: dict) -> str:
    return (
        f"{r.get('Date', '')} {str(r.get('Time', ''))[:5]}\n"
        f"Description: {r.get('Description', '')}\n"
        f"Amount: {float(r.get('Amount', 0)):.2f}\n"
        f"Category: {r.get('Category', '')}\n"
        f"Paid By: {r.get('Paid By', '')}  |  {r.get('Payment Mode', '')}"
    )


def _entry_action_keyboard(sheet_row: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[
        InlineKeyboardButton("✏️ Edit", callback_data=f"edit:{sheet_row}"),
        InlineKeyboardButton("🗑️ Delete", callback_data=f"del_c:{sheet_row}"),
        InlineKeyboardButton("✖ Back", callback_data="entry_back"),
    ]])


def _edit_field_keyboard(sheet_row: int) -> InlineKeyboardMarkup:
    fields = [
        ("Amount",       f"ef:{sheet_row}:Amount"),
        ("Description",  f"ef:{sheet_row}:Description"),
        ("Category",     f"ef:{sheet_row}:Category"),
        ("Paid By",      f"ef:{sheet_row}:Paid By"),
        ("Payment Mode", f"ef:{sheet_row}:Payment Mode"),
        ("Date",         f"ef:{sheet_row}:Date"),
    ]
    buttons = [[InlineKeyboardButton(label, callback_data=cb)] for label, cb in fields]
    buttons.append([InlineKeyboardButton("✖ Cancel", callback_data="entry_back")])
    return InlineKeyboardMarkup(buttons)


async def handle_list_entry_tap(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    sheet_row = int(query.data.replace("entry:", ""))

    # Fetch the entry by sheet row
    try:
        rows, _ = get_recent_expenses(MAX_LIST_ENTRIES)
        matched = next((r for r in rows if r["_sheet_row"] == sheet_row), None)
        if not matched:
            await query.edit_message_text("Entry not found (list may have changed).")
            return
        await query.edit_message_text(
            _entry_detail_text(matched),
            reply_markup=_entry_action_keyboard(sheet_row)
        )
    except Exception as e:
        await query.edit_message_text(f"Error loading entry.\n({e})")


async def handle_entry_back(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text("Cancelled.")


async def handle_list_delete_confirm(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    sheet_row = int(query.data.replace("del_c:", ""))
    await query.edit_message_text(
        "Are you sure you want to delete this entry?",
        reply_markup=InlineKeyboardMarkup([[
            InlineKeyboardButton("Yes, Delete", callback_data=f"del_y:{sheet_row}"),
            InlineKeyboardButton("No, Keep", callback_data="entry_back"),
        ]])
    )


async def handle_list_delete_yes(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    sheet_row = int(query.data.replace("del_y:", ""))
    try:
        delete_expense_row(sheet_row)
        await query.edit_message_text("Deleted.")
    except Exception as e:
        await query.edit_message_text(f"Delete failed.\n({e})")


async def handle_edit_field_select(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    sheet_row = int(query.data.replace("edit:", ""))
    await query.edit_message_text(
        "Which field do you want to edit?",
        reply_markup=_edit_field_keyboard(sheet_row)
    )


async def handle_edit_field_tap(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Called when user picks a field to edit. ef:ROW:FIELD"""
    query = update.callback_query
    await query.answer()
    _, sheet_row_str, field = query.data.split(":", 2)
    sheet_row = int(sheet_row_str)

    context.user_data["edit_row"] = sheet_row
    context.user_data["edit_field"] = field

    if field == "Category":
        await query.edit_message_text("Pick new category:", reply_markup=_category_keyboard(prefix="ev"))
        return
    if field == "Paid By":
        sender_name = _get_sender_name(update.effective_user.id)
        await query.edit_message_text("Who paid?", reply_markup=_paid_by_keyboard(sender_name, prefix="ev"))
        return
    if field == "Payment Mode":
        await query.edit_message_text("Payment method?", reply_markup=_payment_mode_keyboard(prefix="ev"))
        return
    if field == "Date":
        await query.edit_message_text("Pick new date:", reply_markup=_date_keyboard())
        context.user_data["edit_date_mode"] = True
        return WAITING_DATE  # enters conversation for date handling

    # Text fields: Amount or Description
    await query.edit_message_text(
        f"Enter new {field}:" + (" (e.g. 45.50)" if field == "Amount" else "")
    )
    return EDITING_TEXT


async def handle_edit_value_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles ev:VALUE callbacks for keyboard-based fields."""
    query = update.callback_query
    await query.answer()
    value = query.data.replace("ev:", "")

    sheet_row = context.user_data.get("edit_row")
    field = context.user_data.get("edit_field")

    if not sheet_row or not field:
        await query.edit_message_text("Session expired. Use /list again.")
        return

    if field == "Amount":
        try:
            value = float(value)
        except ValueError:
            await query.edit_message_text("Invalid amount.")
            return

    try:
        update_expense_field(sheet_row, field, value)
        await query.edit_message_text(f"Updated {field} to: {value}")
    except Exception as e:
        await query.edit_message_text(f"Update failed.\n({e})")

    context.user_data.pop("edit_row", None)
    context.user_data.pop("edit_field", None)


async def handle_edit_text_input(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles text input when editing Amount or Description."""
    sheet_row = context.user_data.get("edit_row")
    field = context.user_data.get("edit_field")

    if not sheet_row or not field:
        return ConversationHandler.END

    raw = update.message.text.strip()

    # Custom date input from edit mode
    if context.user_data.get("edit_date_custom"):
        try:
            dt = datetime.strptime(raw, "%d-%m-%Y")
            value = dt.strftime("%Y-%m-%d")
        except ValueError:
            await update.message.reply_text("Invalid format. Enter as DD-MM-YYYY (e.g. 05-03-2026):")
            return EDITING_TEXT
        try:
            update_expense_field(sheet_row, "Date", value)
            await update.message.reply_text(f"Updated Date to: {value}")
        except Exception as e:
            await update.message.reply_text(f"Update failed.\n({e})")
        context.user_data.clear()
        return ConversationHandler.END

    if field == "Amount":
        try:
            value = float(raw.replace(",", "."))
            if value <= 0 or value >= 1_000_000:
                raise ValueError
        except ValueError:
            await update.message.reply_text("Invalid amount. Try again (e.g. 45.50):")
            return EDITING_TEXT
    else:
        value = raw

    try:
        update_expense_field(sheet_row, field, value)
        await update.message.reply_text(f"Updated {field} to: {value}")
    except Exception as e:
        await update.message.reply_text(f"Update failed.\n({e})")

    context.user_data.pop("edit_row", None)
    context.user_data.pop("edit_field", None)
    return ConversationHandler.END


# --- /balance ---

async def balance_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await _check_auth(update):
        return
    try:
        month = context.args[0] if context.args else None
        if month:
            # Validate YYYY-MM format
            try:
                datetime.strptime(month, "%Y-%m")
            except ValueError:
                await update.message.reply_text("Invalid format. Use: /balance 2026-03")
                return

        b = get_balance_summary(month=month)
        label = f"Balance — {month}" if month else "Balance Summary (all time)"

        if b["diff"] == 0:
            settlement_line = "Accounts are settled."
        else:
            settlement_line = f"{b['debtor']} owes {b['creditor']}: {b['settlement']:.2f}"

        await update.message.reply_text(
            f"{label}\n"
            f"{'─' * 28}\n"
            f"Ali personal:     {b['ali_personal']:.2f} ({b['ali_count']} entries)\n"
            f"Anurag personal:  {b['anurag_personal']:.2f} ({b['anurag_count']} entries)\n"
            f"Binary (company): {b['binary_total']:.2f} ({b['binary_count']} entries)\n"
            f"{'─' * 28}\n"
            f"{settlement_line}"
        )
    except Exception as e:
        await update.message.reply_text(f"Couldn't fetch balance.\n({e})")


# --- Scheduled summaries ---

async def _broadcast(context, text: str):
    """Send a message to all registered users."""
    for uid in USER_MAP:
        try:
            await context.bot.send_message(uid, text)
        except Exception:
            pass


async def scheduled_daily_summary(context: ContextTypes.DEFAULT_TYPE):
    """Fired every day at 9 PM IST. Sends today's expense summary to all users."""
    try:
        rows = get_today_expenses()
        if not rows:
            await _broadcast(context, "Daily Summary — No expenses recorded today.")
            return

        total = sum(float(r.get("Amount", 0)) for r in rows)
        binary = sum(float(r.get("Amount", 0)) for r in rows if r.get("Payment Mode") == "Binary")
        ali = sum(float(r.get("Amount", 0)) for r in rows
                  if r.get("Paid By") == "Ali" and r.get("Payment Mode") != "Binary")
        anurag = sum(float(r.get("Amount", 0)) for r in rows
                     if r.get("Paid By") == "Anurag" and r.get("Payment Mode") != "Binary")

        text = (
            f"Daily Summary\n"
            f"{'─' * 24}\n"
            f"Total today:      {total:.2f} ({len(rows)} entries)\n"
            f"  Ali personal:   {ali:.2f}\n"
            f"  Anurag personal:{anurag:.2f}\n"
            f"  Binary (co.):   {binary:.2f}"
        )
        await _broadcast(context, text)
    except Exception as e:
        await _broadcast(context, f"Daily summary failed.\n({e})")


async def scheduled_weekly_summary(context: ContextTypes.DEFAULT_TYPE):
    """Fired every Sunday at 9 PM IST. Sends this week's balance summary."""
    try:
        tz = pytz.timezone(TIMEZONE)
        now = datetime.now(tz)
        # Week starts Monday
        week_start = (now - timedelta(days=now.weekday())).strftime("%Y-%m-%d")
        month = now.strftime("%Y-%m")

        b = get_balance_summary(month=month)

        if b["diff"] == 0:
            settlement_line = "Accounts are settled."
        else:
            settlement_line = f"{b['debtor']} owes {b['creditor']}: {b['settlement']:.2f}"

        text = (
            f"Weekly Summary (week of {week_start})\n"
            f"{'─' * 28}\n"
            f"This month ({month}):\n"
            f"  Ali personal:    {b['ali_personal']:.2f}\n"
            f"  Anurag personal: {b['anurag_personal']:.2f}\n"
            f"  Binary (co.):    {b['binary_total']:.2f}\n"
            f"{'─' * 28}\n"
            f"{settlement_line}"
        )
        await _broadcast(context, text)
    except Exception as e:
        await _broadcast(context, f"Weekly summary failed.\n({e})")
