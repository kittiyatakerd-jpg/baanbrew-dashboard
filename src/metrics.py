"""ฟังก์ชันคำนวณตัวชี้วัดของบ้านสบาย ช็อป

ทุกฟังก์ชันรับ DataFrame ที่ได้จาก load_orders() เป็นพารามิเตอร์แรก
นิยามตัวชี้วัดอยู่ใน CLAUDE.md
"""
from __future__ import annotations  # ให้ type hint แบบ `Path | str` ใช้ได้บน Python 3.9

from pathlib import Path

import pandas as pd

DATA = Path(__file__).resolve().parent.parent / "data"

SUCCESS = "จัดส่งสำเร็จ"
CANCELLED = "ยกเลิก"
RETURNED = "คืนสินค้า"


def load_orders(path: Path | str = DATA / "orders.csv") -> pd.DataFrame:
    """อ่าน orders.csv แล้วเพิ่มคอลัมน์ที่ใช้บ่อย: net, unit_cost, gp, month, date"""
    df = pd.read_csv(path, encoding="utf-8-sig", dtype={"order_id": str, "product_id": str})
    products = pd.read_csv(DATA / "products.csv", encoding="utf-8-sig", dtype={"product_id": str})
    df["unit_cost"] = df["product_id"].map(products.set_index("product_id")["unit_cost"])

    success = df["status"] == SUCCESS
    gross = df["qty"] * df["unit_price"] * (1 - df["discount_pct"] / 100)
    # แถวที่ไม่สำเร็จ net = 0 และ gp = 0 (ไม่หักต้นทุนของออเดอร์ที่ยกเลิก/คืน)
    df["net"] = gross.where(success, 0.0)
    df["gp"] = (gross - df["qty"] * df["unit_cost"]).where(success, 0.0)
    df["month"] = df["order_datetime"].str[:7]
    df["date"] = df["order_datetime"].str[:10]
    return df


def _between_dates(df: pd.DataFrame, start_date: str | None, end_date: str | None) -> pd.Series:
    """mask ช่วงวันที่สั่งซื้อ รวมทั้งสองวัน (เทียบกับคอลัมน์ date ไม่ใช่ order_datetime เต็ม)"""
    mask = pd.Series(True, index=df.index)
    if start_date is not None:
        mask &= df["date"] >= start_date
    if end_date is not None:
        mask &= df["date"] <= end_date
    return mask


def _rate(df: pd.DataFrame, status: str) -> float:
    """จำนวนแถวสถานะนั้น ÷ จำนวนคำสั่งซื้อทั้งหมดใน df × 100"""
    if len(df) == 0:
        return 0.0
    return float((df["status"] == status).sum() / len(df) * 100)


def net_sales(df: pd.DataFrame) -> float:
    """ยอดขายสุทธิรวม (บาท)"""
    return float(df["net"].sum())


def gross_profit(df: pd.DataFrame) -> float:
    """กำไรขั้นต้นรวม (บาท)"""
    return float(df["gp"].sum())


def aov(df: pd.DataFrame) -> float:
    """ยอดขายสุทธิเฉลี่ยต่อคำสั่งซื้อที่จัดส่งสำเร็จ (บาท)"""
    n = (df["status"] == SUCCESS).sum()
    return float(df["net"].sum() / n) if n else 0.0


def cancel_rate(df: pd.DataFrame) -> float:
    """อัตรายกเลิกของคำสั่งซื้อทั้งหมดใน df (เปอร์เซ็นต์ 0–100)"""
    return _rate(df, CANCELLED)


def monthly_sales(df: pd.DataFrame) -> pd.Series:
    """ยอดขายสุทธิรายเดือน index = 'YYYY-MM' เรียงตามเวลา"""
    return df.groupby("month")["net"].sum().sort_index()


def best_month(df: pd.DataFrame) -> str:
    """เดือนที่ยอดขายสุทธิสูงสุด ('YYYY-MM')"""
    return str(monthly_sales(df).idxmax())


def channel_share(df: pd.DataFrame, channel: str, start_month: str, end_month: str) -> float:
    """สัดส่วนยอดขายสุทธิของช่องทางในช่วงเดือน start_month..end_month (รวมทั้งสองเดือน) เป็นเปอร์เซ็นต์"""
    period = df[(df["month"] >= start_month) & (df["month"] <= end_month)]
    total = period["net"].sum()
    if total == 0:
        return 0.0
    return float(period.loc[period["channel"] == channel, "net"].sum() / total * 100)


def _ship_bucket(days: float) -> str:
    if days <= 2:
        return "1-2"
    if days <= 4:
        return "3-4"
    if days <= 6:
        return "5-6"
    return "7+"


def rating_by_ship_bucket(df: pd.DataFrame) -> dict[str, float]:
    """คะแนนรีวิวเฉลี่ยตามระยะส่ง คืน dict คีย์ '1-2', '3-4', '5-6', '7+'"""
    rated = df.dropna(subset=["ship_days", "rating"])
    means = rated.groupby(rated["ship_days"].map(_ship_bucket))["rating"].mean()
    return {k: float(v) for k, v in means.items()}


def top_products(df: pd.DataFrame, n: int = 5) -> pd.DataFrame:
    """n สินค้าที่ยอดขายสุทธิสูงสุด คืน DataFrame คอลัมน์ product_id, product_name, net เรียงจากมากไปน้อย"""
    totals = df.groupby(["product_id", "product_name"], as_index=False)["net"].sum()
    return totals.sort_values("net", ascending=False).head(n).reset_index(drop=True)


def top_province(df: pd.DataFrame, region: str) -> str:
    """จังหวัดที่มียอดขายสุทธิสูงสุดในภูมิภาคที่ระบุ"""
    return str(df[df["region"] == region].groupby("province")["net"].sum().idxmax())


def avg_ship_days(df: pd.DataFrame, region: str | None = None, carrier: str | None = None,
                  start_date: str | None = None, end_date: str | None = None) -> float:
    """ระยะส่งเฉลี่ย (วัน) ตามตัวกรองที่ให้มา วันที่เป็น 'YYYY-MM-DD' และรวมทั้งสองวัน"""
    mask = _between_dates(df, start_date, end_date)
    if region is not None:
        mask &= df["region"] == region
    if carrier is not None:
        mask &= df["carrier"] == carrier
    return float(df.loc[mask, "ship_days"].dropna().mean())


def return_rate(df: pd.DataFrame, product_id: str | None = None,
                start_date: str | None = None, end_date: str | None = None) -> float:
    """อัตราคืนสินค้า (เปอร์เซ็นต์) ของสินค้าและช่วงวันที่ที่ระบุ"""
    mask = _between_dates(df, start_date, end_date)
    if product_id is not None:
        mask &= df["product_id"] == product_id
    return _rate(df[mask], RETURNED)
