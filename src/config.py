from dotenv import load_dotenv
import os

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
SPREADSHEET_ID = os.getenv("GOOGLE_SPREADSHEET_ID")
CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")
DEFAULT_CATEGORY = os.getenv("DEFAULT_CATEGORY", "Uncategorized")
MAX_LIST_ENTRIES = int(os.getenv("MAX_LIST_ENTRIES", "10"))
TIMEZONE = os.getenv("TIMEZONE", "Asia/Kolkata")

ALI_TELEGRAM_ID = int(os.getenv("ALI_TELEGRAM_ID", "0"))
ANURAG_TELEGRAM_ID = int(os.getenv("ANURAG_TELEGRAM_ID", "0"))

# Maps Telegram user ID → display name used in the sheet
USER_MAP: dict[int, str] = {}
if ALI_TELEGRAM_ID:
    USER_MAP[ALI_TELEGRAM_ID] = "Ali"
if ANURAG_TELEGRAM_ID:
    USER_MAP[ANURAG_TELEGRAM_ID] = "Anurag"

if not BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN is not set in .env")
if not SPREADSHEET_ID:
    raise ValueError("GOOGLE_SPREADSHEET_ID is not set in .env")
if not USER_MAP:
    raise ValueError("At least one of ALI_TELEGRAM_ID or ANURAG_TELEGRAM_ID must be set in .env")
