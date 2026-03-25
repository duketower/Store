from datetime import time
import pytz
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ConversationHandler,
    CallbackQueryHandler,
    filters,
)

from src.config import BOT_TOKEN, TIMEZONE
from src.sheets import ensure_header_row, setup_expenses_ux, setup_monthly_summary, setup_budget_tab
from src.handlers import (
    start_handler,
    add_start,
    add_description,
    add_amount,
    handle_category,
    handle_paid_by,
    handle_payment_mode,
    handle_date_callback,
    handle_date_text,
    cancel_handler,
    quick_add_entry,
    summary_handler,
    list_handler,
    balance_handler,
    handle_list_entry_tap,
    handle_entry_back,
    handle_list_delete_confirm,
    handle_list_delete_yes,
    handle_edit_field_select,
    handle_edit_field_tap,
    handle_edit_value_callback,
    handle_edit_text_input,
    handle_list_more,
    search_handler,
    settle_handler,
    scheduled_daily_summary,
    scheduled_weekly_summary,
    WAITING_DESCRIPTION,
    WAITING_AMOUNT,
    WAITING_CATEGORY,
    WAITING_PAID_BY,
    WAITING_PAYMENT_MODE,
    WAITING_DATE,
    EDITING_TEXT,
)


def main():
    print("Starting bot...")
    ensure_header_row()
    setup_expenses_ux()
    setup_monthly_summary()
    setup_budget_tab()
    print("Google Sheet ready.")

    app = Application.builder().token(BOT_TOKEN).build()

    # Standalone callback handlers — no conversation state needed
    app.add_handler(CallbackQueryHandler(handle_list_entry_tap,      pattern=r"^entry:\d+$"))
    app.add_handler(CallbackQueryHandler(handle_entry_back,          pattern=r"^entry_back$"))
    app.add_handler(CallbackQueryHandler(handle_list_delete_confirm, pattern=r"^del_c:\d+$"))
    app.add_handler(CallbackQueryHandler(handle_list_delete_yes,     pattern=r"^del_y:\d+$"))
    app.add_handler(CallbackQueryHandler(handle_edit_field_select,   pattern=r"^edit:\d+$"))
    app.add_handler(CallbackQueryHandler(handle_list_more,           pattern=r"^list_more:\d+$"))
    # Keyboard-based field edits (Category, Paid By, Payment Mode) — no text input needed
    app.add_handler(CallbackQueryHandler(handle_edit_field_tap,      pattern=r"^ef:\d+:(Category|Paid By|Payment Mode)$"))
    app.add_handler(CallbackQueryHandler(handle_edit_value_callback, pattern=r"^ev:"))

    # Main conversation handler — covers add expense AND edit (Amount/Description/Date)
    conv = ConversationHandler(
        entry_points=[
            CommandHandler("add", add_start),
            MessageHandler(filters.TEXT & ~filters.COMMAND, quick_add_entry),
            # Edit text/date fields enter the conversation from list callbacks
            CallbackQueryHandler(handle_edit_field_tap, pattern=r"^ef:\d+:(Amount|Description|Date)$"),
        ],
        states={
            WAITING_DESCRIPTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, add_description)],
            WAITING_AMOUNT:      [MessageHandler(filters.TEXT & ~filters.COMMAND, add_amount)],
            WAITING_CATEGORY:    [CallbackQueryHandler(handle_category, pattern=r"^cat:")],
            WAITING_PAID_BY:     [CallbackQueryHandler(handle_paid_by, pattern=r"^paid:")],
            WAITING_PAYMENT_MODE:[CallbackQueryHandler(handle_payment_mode, pattern=r"^mode:")],
            WAITING_DATE: [
                CallbackQueryHandler(handle_date_callback, pattern=r"^date:"),
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_date_text),
            ],
            EDITING_TEXT: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_edit_text_input),
            ],
        },
        fallbacks=[CommandHandler("cancel", cancel_handler)],
    )

    app.add_handler(CommandHandler("start", start_handler))
    app.add_handler(CommandHandler("summary", summary_handler))
    app.add_handler(CommandHandler("list", list_handler))
    app.add_handler(CommandHandler("balance", balance_handler))
    app.add_handler(CommandHandler("search", search_handler))
    app.add_handler(CommandHandler("settle", settle_handler))
    app.add_handler(CommandHandler("cancel", cancel_handler))
    app.add_handler(conv)

    # Scheduled summaries (Asia/Kolkata time)
    ist = pytz.timezone(TIMEZONE)
    summary_time = time(21, 0, 0, tzinfo=ist)  # 9:00 PM IST
    app.job_queue.run_daily(scheduled_daily_summary, time=summary_time, name="daily_summary")
    app.job_queue.run_daily(scheduled_weekly_summary, time=summary_time, days=(6,), name="weekly_summary")  # Sunday

    print("Bot is running. Press Ctrl+C to stop.")
    app.run_polling()


if __name__ == "__main__":
    main()
