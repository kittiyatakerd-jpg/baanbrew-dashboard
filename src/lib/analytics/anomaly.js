// Lab 4.5 · ใช้ Claude Code เขียนฟังก์ชันที่ยังว่าง (Prompt 4.5A ใน PROMPTS_LAB4.md) จนกว่า npm test จะผ่าน · ห้ามแก้ไฟล์ test
// Lab 4.5 · หาวันที่ยอดขายผิดปกติ
// เทียบกับ "ค่ากลางของวันเดียวกันของสัปดาห์ใน 8 สัปดาห์ก่อน" ไม่ใช่ค่าเฉลี่ย 28 วัน
// เพราะสาขาออฟฟิศกับห้างขายวันธรรมดาและเสาร์-อาทิตย์ต่างกันมาก
import { addDays } from "../../lab3/time.js";

export const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};

/**
 * คะแนนความผิดปกติ = ln((จริง + SMOOTH) / (คาดหวัง + SMOOTH))
 * SMOOTH กันไม่ให้วันยอดน้อย ๆ (เช่น 50 บาท เทียบ 100 บาท) ดูผิดปกติเกินจริง
 * @param daily    [{ date, branch, revenue }] จาก dailyByBranch()
 * @param holidays { "YYYY-MM-DD": "ชื่อวันหยุด" } วันหยุดจะไม่ถูกจัดอันดับ แต่ติดป้ายไว้
 * @returns ทุกวันที่คำนวณได้ เรียงจากผิดปกติมากไปน้อย:
 *   { date, branch, actual, expected, change (สัดส่วน เช่น -0.9 = ต่ำกว่าปกติ 90%), score, holiday }
 */
export function scoreAnomalies(daily, holidays = {}, { weeks = 8, minWeeks = 4, smooth = 1000 } = {}) {
  // ยอดของแต่ละสาขา ค้นตามวันที่ได้ทันที
  const byBranch = new Map();
  for (const d of daily) {
    if (!byBranch.has(d.branch)) byBranch.set(d.branch, new Map());
    byBranch.get(d.branch).set(d.date, d.revenue);
  }

  const out = [];
  for (const [branch, rev] of byBranch) {
    for (const [date, actual] of rev) {
      // วันเดียวกันของสัปดาห์ย้อนหลัง 1..weeks สัปดาห์ (นับเฉพาะวันที่มีข้อมูล)
      const past = [];
      for (let k = 1; k <= weeks; k++) {
        const v = rev.get(addDays(date, -7 * k));
        if (v !== undefined) past.push(v);
      }
      if (past.length < minWeeks) continue;
      const expected = median(past);
      out.push({
        date, branch, actual, expected,
        change: expected ? actual / expected - 1 : 0,
        score: Math.log((actual + smooth) / (expected + smooth)),
        holiday: holidays[date] ?? null,
      });
    }
  }
  return out.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
}

/** อันดับวันผิดปกติที่ควรตรวจสอบ (ไม่รวมวันหยุด) */
export function topAnomalies(daily, holidays = {}, n = 15, opts) {
  return scoreAnomalies(daily, holidays, opts).filter((a) => !a.holiday).slice(0, n);
}
