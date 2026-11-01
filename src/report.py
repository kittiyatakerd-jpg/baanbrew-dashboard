"""สร้างรายงานประจำเดือนเป็น Markdown

ใช้งาน: python -m src.report 2026-03
ผลลัพธ์: reports/monthly_report.md
ตัวเลขทุกตัวคำนวณผ่านฟังก์ชันใน src/metrics.py
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

import pandas as pd

from src import metrics as m

REPORTS = Path(__file__).resolve().parent.parent / "reports"


def build_report(df: pd.DataFrame, month: str) -> str:
    """คืนเนื้อหารายงาน Markdown ของเดือน 'YYYY-MM'"""
    monthly = m.monthly_sales(df)
    if month not in monthly.index:
        raise ValueError(f"ไม่มีข้อมูลเดือน {month} (มี {monthly.index[0]} ถึง {monthly.index[-1]})")

    in_month = df[df["month"] == month]
    sales = m.net_sales(in_month)

    pos = list(monthly.index).index(month)
    if pos == 0:
        compare = "ไม่มีข้อมูลเดือนก่อนหน้าให้เทียบ"
    else:
        prev_month = monthly.index[pos - 1]
        prev = monthly.iloc[pos - 1]
        change = (sales - prev) / prev * 100
        compare = f"{prev_month}: {prev:,.0f} บาท → เปลี่ยนแปลง {change:+.1f}%"

    top = m.top_products(in_month, 5)
    rows = "\n".join(
        f"| {i} | {r.product_id} | {r.product_name} | {r.net:,.0f} |"
        for i, r in enumerate(top.itertuples(), start=1)
    )

    return f"""# รายงานประจำเดือน {month} · บ้านสบาย ช็อป

## สรุปตัวเลข

| ตัวชี้วัด | ค่า |
|---|---|
| ยอดขายสุทธิ | {sales:,.0f} บาท |
| เทียบเดือนก่อน | {compare} |
| อัตรายกเลิก | {m.cancel_rate(in_month):.2f}% |
| อัตราคืนสินค้า | {m.return_rate(in_month):.2f}% |

## 5 สินค้าขายดี (ตามยอดขายสุทธิ)

| อันดับ | รหัส | สินค้า | ยอดขายสุทธิ (บาท) |
|---|---|---|---|
{rows}

_นิยามตัวชี้วัดตาม CLAUDE.md · อัตรายกเลิก/คืน = จำนวนแถวสถานะนั้น ÷ คำสั่งซื้อทั้งหมดในเดือน × 100_
"""


def write_report(month: str, out_dir: Path = REPORTS, df: pd.DataFrame | None = None) -> Path:
    """เขียนรายงานลง out_dir/monthly_report.md แล้วคืน path ของไฟล์"""
    if df is None:
        df = m.load_orders()
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "monthly_report.md"
    path.write_text(build_report(df, month), encoding="utf-8")
    return path


def main() -> None:
    parser = argparse.ArgumentParser(description="สร้างรายงานประจำเดือน")
    parser.add_argument("month", help="เดือนรูปแบบ YYYY-MM เช่น 2026-03")
    args = parser.parse_args()
    if not re.fullmatch(r"\d{4}-\d{2}", args.month):
        parser.error("month ต้องอยู่ในรูปแบบ YYYY-MM")
    print(f"เขียนรายงานแล้ว: {write_report(args.month)}")


if __name__ == "__main__":
    main()
