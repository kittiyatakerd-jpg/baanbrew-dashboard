// ฟังก์ชันคำนวณทั้งหมดของ Dashboard แยกจากหน้าจอ เพื่อให้ตรวจสอบได้ง่าย
// หลักของข้อมูลบ้านบรู:
//   - 1 แถวใน sales.csv = 1 รายการสินค้า (บิลเดียวมีได้หลายแถว)
//   - ยอดขาย = qty × unit_price
//   - customer_id ว่าง = ลูกค้าทั่วไป ไม่นับเป็นสมาชิก

/** แปลงแถวดิบจาก CSV (ทุกค่าเป็นข้อความ) ให้เป็นตัวเลข และเพิ่มคอลัมน์ที่ใช้บ่อย */
export function prepareRows(rows) {
  return rows
    .filter((r) => r.order_id)
    .map((r) => {
      const qty = Number(r.qty);
      const unitPrice = Number(r.unit_price);
      return {
        ...r,
        qty,
        unitPrice,
        revenue: qty * unitPrice,
        // ใช้ 10 ตัวอักษรแรกของ datetime (เวลาไทยอยู่แล้ว) เป็นวันที่
        // ไม่ใช้ new Date().toISOString() เพราะจะแปลงเป็น UTC แล้ววันที่เลื่อน
        date: r.datetime.slice(0, 10),
        hour: Number(r.datetime.slice(11, 13)),
      };
    });
}

/** KPI 4 ตัว: ยอดขายรวม, จำนวนบิล (order_id ไม่ซ้ำ), เฉลี่ยต่อบิล, สมาชิกไม่ซ้ำ */
export function computeKpis(rows) {
  const revenue = rows.reduce((sum, r) => sum + r.revenue, 0);
  const bills = new Set(rows.map((r) => r.order_id)).size; // นับบิล ไม่ใช่นับแถว
  const members = new Set(rows.map((r) => r.customer_id).filter(Boolean)).size;
  return { revenue, bills, avgPerBill: bills ? revenue / bills : 0, members };
}

/** ยอดขายรวมรายวัน เรียงตามวันที่ */
export function dailyRevenue(rows) {
  const map = new Map();
  for (const r of rows) map.set(r.date, (map.get(r.date) ?? 0) + r.revenue);
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));
}

/** เพิ่มค่าเฉลี่ยเคลื่อนที่ 7 วัน (ma7) ให้แต่ละจุด 6 วันแรกยังไม่ครบ จึงเป็น null */
export function withMovingAverage(series, key = "revenue", window = 7) {
  return series.map((d, i) => {
    if (i < window - 1) return { ...d, ma7: null };
    const slice = series.slice(i - window + 1, i + 1);
    return { ...d, ma7: slice.reduce((s, x) => s + x[key], 0) / window };
  });
}

/** ยอดขายแยกสาขา เรียงมากไปน้อย */
export function revenueByBranch(rows) {
  const map = new Map();
  for (const r of rows) map.set(r.branch, (map.get(r.branch) ?? 0) + r.revenue);
  return [...map.entries()]
    .map(([branch, revenue]) => ({ branch, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * จำนวนบิลตามชั่วโมงของวัน (การบ้าน Day 1)
 * นับ order_id ไม่ซ้ำในแต่ละชั่วโมง · branch = null คือรวมทุกสาขา
 */
export function billsByHour(rows, branch = null) {
  const sets = new Map();
  for (const r of rows) {
    if (branch && r.branch !== branch) continue;
    if (!sets.has(r.hour)) sets.set(r.hour, new Set());
    sets.get(r.hour).add(r.order_id);
  }
  const hours = [...sets.keys()];
  const min = Math.min(...hours), max = Math.max(...hours);
  const out = [];
  for (let h = min; h <= max; h++) out.push({ hour: h, bills: sets.get(h)?.size ?? 0 });
  return out;
}

// ---------- รูปแบบตัวเลขและวันที่ ----------
export const fmtBaht = (n) => "฿" + Math.round(n).toLocaleString("th-TH");
export const fmtBaht2 = (n) =>
  "฿" + n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtNum = (n) => n.toLocaleString("th-TH");
export const fmtShortBaht = (n) =>
  n >= 1_000_000 ? `฿${(n / 1_000_000).toFixed(2)}ล.` : n >= 1000 ? `฿${Math.round(n / 1000)}k` : `฿${n}`;

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
/** "2025-04-01" → "1 เม.ย. 68" (คำนวณจากข้อความ ไม่ผ่าน Date จึงไม่มีปัญหา timezone) */
export function thaiDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${TH_MONTHS[m - 1]} ${String((y + 543) % 100).padStart(2, "0")}`;
}
/** "2025-04" → "เม.ย. 68" */
export function thaiMonth(ym) {
  const [y, m] = ym.split("-").map(Number);
  return `${TH_MONTHS[m - 1]} ${String((y + 543) % 100).padStart(2, "0")}`;
}
