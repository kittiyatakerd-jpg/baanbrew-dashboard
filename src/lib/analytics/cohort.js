// Lab 4.2 · ใช้ Claude Code เขียนฟังก์ชันที่ยังว่าง (Prompt 4.2A ใน PROMPTS_LAB4.md) จนกว่า npm test จะผ่าน · ห้ามแก้ไฟล์ test
// Lab 4.2 · Cohort retention รายเดือน
// cohort = เดือนแรกที่ลูกค้าสมาชิกซื้อ · retention[k] = สัดส่วนลูกค้าใน cohort ที่กลับมาซื้อในเดือนที่ k (k=0 คือเดือนแรก = 100%)

/** จำนวนเดือนจาก a ถึง b เช่น monthIndex("2025-11", "2026-02") = 3 */
export function monthIndex(a, b) {
  // คำนวณจากข้อความ "YYYY-MM" ตรง ๆ ไม่ผ่าน Date จึงไม่มีปัญหา timezone
  const [ya, ma] = a.split("-").map(Number);
  const [yb, mb] = b.split("-").map(Number);
  return (yb - ya) * 12 + (mb - ma);
}

/**
 * @param rows  แถวยอดขาย (ไม่นับ customer_id ว่าง)
 * @param asOf  วันสุดท้ายของข้อมูล YYYY-MM-DD ใช้บอกว่าเดือนสุดท้ายข้อมูลไม่ครบหรือไม่
 * @returns {{ cohorts: {cohort, size, retention: number[]}[], lastMonth, lastMonthPartial, daysInLastMonth }}
 *   retention ยาวเท่าจำนวนเดือนที่สังเกตได้ของ cohort นั้น (ถึง lastMonth)
 */
export function computeCohorts(rows, asOf) {
  // เดือนที่ลูกค้าแต่ละคนมาซื้อ (Set จึงนับซ้ำในเดือนเดียวกันครั้งเดียว)
  const months = new Map();
  for (const x of rows) {
    if (!x.customer_id) continue; // walk-in ไม่ใช่สมาชิก
    if (!months.has(x.customer_id)) months.set(x.customer_id, new Set());
    months.get(x.customer_id).add(x.date.slice(0, 7));
  }

  const lastMonth = asOf.slice(0, 7);
  // จัดลูกค้าเข้า cohort ตามเดือนแรก แล้วนับว่าเดือนที่ k หลังจากนั้นมีกี่คนกลับมา
  const groups = new Map();
  for (const set of months.values()) {
    const first = [...set].sort()[0];
    const g = groups.get(first) ?? { size: 0, active: new Array(monthIndex(first, lastMonth) + 1).fill(0) };
    g.size += 1;
    for (const m of set) g.active[monthIndex(first, m)] += 1;
    groups.set(first, g);
  }

  const cohorts = [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([cohort, g]) => ({ cohort, size: g.size, retention: g.active.map((n) => n / g.size) }));

  // จำนวนวันของเดือนสุดท้าย: วันที่ 0 ของเดือนถัดไปใน Date.UTC = วันสุดท้ายของเดือนนี้
  const [y, m, d] = asOf.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { cohorts, lastMonth, lastMonthPartial: d < daysInMonth, daysInLastMonth: d, daysInMonth };
}
