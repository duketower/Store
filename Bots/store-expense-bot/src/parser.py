import re


def parse_expense(text: str) -> dict | None:
    """
    Parse a free-text message into expense components.

    Accepted formats:
      milk 45.50
      milk and eggs 45.50
      coffee beans 230,00

    Returns:
      {"description": str, "amount": float} or None if parsing fails.
    """
    text = text.strip()
    # Match: <description> <amount>
    # Amount is the last token that looks like a number (with optional decimal)
    pattern = r"^(.+?)\s+([\d]+(?:[.,]\d{1,2})?)$"
    match = re.match(pattern, text, re.IGNORECASE)

    if not match:
        return None

    description = match.group(1).strip()
    raw_amount = match.group(2).replace(",", ".")

    try:
        amount = float(raw_amount)
    except ValueError:
        return None

    if amount <= 0 or amount >= 1_000_000:
        return None

    return {"description": description, "amount": amount}
