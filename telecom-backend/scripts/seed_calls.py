"""Load data/mock_call_records_10000.xlsx into the calls table.

Run from the project root:
    python -m scripts.seed_calls            # load (skips if the table already has rows)
    python -m scripts.seed_calls --reset    # wipe the table and reload
"""
import sys
from decimal import Decimal
from pathlib import Path

import pandas as pd
from sqlalchemy import delete, func, insert, select

from app.database import Base, SessionLocal, engine
from app.models import Call

XLSX_PATH = Path(__file__).resolve().parent.parent / "data" / "mock_call_records_10000.xlsx"
BATCH_SIZE = 1000

COLUMN_MAP = {
    "id": "id",
    "callerName": "caller_name",
    "callerNumber": "caller_number",
    "receiverNumber": "receiver_number",
    "city": "city",
    "callDirection": "call_direction",
    "callStatus": "call_status",
    "callDuration": "call_duration",
    "callCost": "call_cost",
    "callStartTime": "call_start_time",
    "callEndTime": "call_end_time",
}


def load_records() -> list[dict]:
    # Phone numbers are identifiers, not quantities, so read them as text. Without
    # dtype=str, pandas turns "07387416172" into the number 7387416172 and loses the 0.
    # Costs are read as text too, so Decimal is built from the exact digits in the file.
    df = pd.read_excel(
        XLSX_PATH,
        dtype={"callerNumber": str, "receiverNumber": str, "callCost": str},
    )

    missing = set(COLUMN_MAP) - set(df.columns)
    if missing:
        raise ValueError(f"Spreadsheet is missing columns: {sorted(missing)}")
    df = df[list(COLUMN_MAP)].rename(columns=COLUMN_MAP)

    if df.isna().any().any():
        raise ValueError("Spreadsheet contains empty cells")
    if df["id"].duplicated().any():
        raise ValueError("Spreadsheet contains duplicate ids")

    for column in ("caller_number", "receiver_number"):
        if not df[column].str.fullmatch(r"\d{11}").all():
            raise ValueError(f"{column} must be 11 digits (a leading zero may have been lost)")

    df["call_start_time"] = pd.to_datetime(df["call_start_time"], utc=True)
    df["call_end_time"] = pd.to_datetime(df["call_end_time"], utc=True)
    df["call_cost"] = df["call_cost"].map(lambda text: Decimal(text.strip()))

    return df.to_dict(orient="records")


def main(reset: bool) -> None:
    Base.metadata.create_all(engine)

    with SessionLocal() as session:
        existing = session.scalar(select(func.count()).select_from(Call))
        if existing and not reset:
            print(f"calls table already holds {existing} rows. Use --reset to reload.")
            return
        if reset:
            session.execute(delete(Call))

        records = load_records()
        for start in range(0, len(records), BATCH_SIZE):
            session.execute(insert(Call), records[start:start + BATCH_SIZE])
        session.commit()

        total = session.scalar(select(func.count()).select_from(Call))
        print(f"Loaded {total} call records.")


if __name__ == "__main__":
    main(reset="--reset" in sys.argv)
