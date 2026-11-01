"""รายงานประจำเดือน (src/report.py)"""
import pytest

from src import metrics as m
from src import report as r


@pytest.fixture(scope="module")
def df():
    return m.load_orders()


def test_report_march_net_sales(df, tmp_path):
    path = r.write_report("2026-03", out_dir=tmp_path, df=df)
    assert path.name == "monthly_report.md"
    assert "| ยอดขายสุทธิ | 1,147,155 บาท |" in path.read_text(encoding="utf-8")


def test_report_has_all_sections(df):
    text = r.build_report(df, "2026-03")
    for heading in ["เทียบเดือนก่อน", "อัตรายกเลิก", "อัตราคืนสินค้า", "5 สินค้าขายดี"]:
        assert heading in text
    assert text.count("| P") == 5  # 5 แถวในตารางสินค้าขายดี


def test_report_first_month_has_no_previous(df):
    assert "ไม่มีข้อมูลเดือนก่อนหน้า" in r.build_report(df, "2025-10")


def test_report_unknown_month(df):
    with pytest.raises(ValueError):
        r.build_report(df, "2030-01")
