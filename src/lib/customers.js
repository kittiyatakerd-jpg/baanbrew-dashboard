// คำนวณข้อมูลลูกค้าสมาชิก (customers.csv ที่ทำความสะอาดแล้วจาก notebook การบ้านที่ 2)
// เชื่อมกับยอดขายด้วย customer_id · แถวยอดขายที่ customer_id ว่าง = ลูกค้าทั่วไป (ไม่ใช่สมาชิก)

export const AGE_GROUPS = ["ต่ำกว่า 18", "18-24", "25-34", "35-44", "45-54", "55+"];
export const GENDERS = ["หญิง", "ชาย", "ไม่ระบุ"];

/** สรุปการซื้อของสมาชิกแต่ละคน: Map(customer_id → { bills, revenue }) */
export function purchasesByMember(rows) {
  const bills = new Map(), revenue = new Map();
  for (const r of rows) {
    if (!r.customer_id) continue;
    if (!bills.has(r.customer_id)) bills.set(r.customer_id, new Set());
    bills.get(r.customer_id).add(r.order_id);
    revenue.set(r.customer_id, (revenue.get(r.customer_id) ?? 0) + r.revenue);
  }
  const out = new Map();
  for (const [id, set] of bills) out.set(id, { bills: set.size, revenue: revenue.get(id) });
  return out;
}

/** KPI ของสมาชิก (กลุ่มที่กรองแล้ว) */
export function memberKpis(customers, purchases) {
  const buyers = customers.filter((c) => purchases.has(c.customer_id));
  const bills = buyers.map((c) => purchases.get(c.customer_id).bills).sort((a, b) => a - b);
  const median = bills.length ? (bills.length % 2 ? bills[(bills.length - 1) / 2] : (bills[bills.length / 2 - 1] + bills[bills.length / 2]) / 2) : 0;
  return {
    members: customers.length,
    buyers: buyers.length,
    activeRate: customers.length ? buyers.length / customers.length : 0,
    avgBills: bills.length ? bills.reduce((a, b) => a + b, 0) / bills.length : 0,
    medianBills: median,
    avgRevenue: buyers.length ? buyers.reduce((s, c) => s + purchases.get(c.customer_id).revenue, 0) / buyers.length : 0,
  };
}

/** สมาชิกใหม่รายเดือน · partial = เดือนที่ข้อมูลยังไม่ครบ (หลังวันขายล่าสุด) */
export function newMembersByMonth(customers, lastDate) {
  const map = new Map();
  for (const c of customers) {
    const m = c.joined_date.slice(0, 7);
    map.set(m, (map.get(m) ?? 0) + 1);
  }
  const [ly, lm, ld] = lastDate.split("-").map(Number);
  const lastMonth = lastDate.slice(0, 7);
  const partial = ld < new Date(ly, lm, 0).getDate();
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, members]) => ({ month, members, partial: partial && month === lastMonth }));
}

/** จำนวนสมาชิกตามกลุ่มอายุ เรียงตามอายุ (ข้อมูลมีลำดับ ไม่เรียงตามจำนวน) */
export function membersByAge(customers) {
  const total = customers.length || 1;
  return AGE_GROUPS.map((age) => {
    const n = customers.filter((c) => c.age_group === age).length;
    return { age, members: n, share: n / total };
  });
}

/** สมาชิกตามสาขาประจำ แยก เคยซื้อ / ยังไม่เคยซื้อ */
export function membersByBranch(customers, purchases) {
  const map = new Map();
  for (const c of customers) {
    const cur = map.get(c.branch) ?? { branch: c.branch, buyers: 0, inactive: 0 };
    if (purchases.has(c.customer_id)) cur.buyers++; else cur.inactive++;
    map.set(c.branch, cur);
  }
  return [...map.values()]
    .map((b) => ({ ...b, members: b.buyers + b.inactive, activeRate: b.buyers / (b.buyers + b.inactive) }))
    .sort((a, b) => b.members - a.members);
}

/** การกระจายของจำนวนบิลต่อสมาชิก (เฉพาะคนที่เคยซื้อ) · รวม 20 บิลขึ้นไปเป็นแท่งเดียว */
export function billsHistogram(customers, purchases, cap = 20) {
  const counts = new Array(cap + 1).fill(0);
  for (const c of customers) {
    const p = purchases.get(c.customer_id);
    if (p) counts[Math.min(p.bills, cap)]++;
  }
  return counts.slice(1).map((n, i) => ({ bin: i + 1 === cap ? `${cap}+` : String(i + 1), members: n }));
}

/** เทียบบิลของสมาชิกกับลูกค้าทั่วไป (ทั้งร้าน ไม่ขึ้นกับตัวกรอง) */
export function memberVsWalkin(rows) {
  const bills = new Map();
  for (const r of rows) {
    const b = bills.get(r.order_id) ?? { revenue: 0, member: false };
    b.revenue += r.revenue;
    if (r.customer_id) b.member = true;
    bills.set(r.order_id, b);
  }
  const g = { member: { bills: 0, revenue: 0 }, walkin: { bills: 0, revenue: 0 } };
  for (const b of bills.values()) {
    const k = b.member ? "member" : "walkin";
    g[k].bills++; g[k].revenue += b.revenue;
  }
  const total = g.member.revenue + g.walkin.revenue;
  return ["member", "walkin"].map((k) => ({
    key: k,
    label: k === "member" ? "สมาชิก" : "ลูกค้าทั่วไป",
    bills: g[k].bills,
    revenue: g[k].revenue,
    share: g[k].revenue / total,
    avgPerBill: g[k].revenue / g[k].bills,
  }));
}
