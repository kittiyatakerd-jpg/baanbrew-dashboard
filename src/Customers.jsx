import { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, Cell,
} from "recharts";
import KpiCard from "./components/KpiCard.jsx";
import Card from "./components/Card.jsx";
import {
  GENDERS, purchasesByMember, memberKpis, newMembersByMonth, membersByAge, membersByBranch,
  billsHistogram, memberVsWalkin,
} from "./lib/customers.js";
import { fmtBaht, fmtBaht2, fmtNum, thaiMonth } from "./lib/metrics.js";
import { useChartColors } from "./theme.js";

const pct = (x, d = 0) => `${(x * 100).toFixed(d)}%`;

export default function Customers({ rows, customers }) {
  const c = useChartColors();
  const axis = c.tick;
  const [gender, setGender] = useState(null);

  const purchases = useMemo(() => purchasesByMember(rows), [rows]);
  const lastDate = useMemo(() => rows.reduce((m, r) => (r.date > m ? r.date : m), ""), [rows]);
  const compare = useMemo(() => memberVsWalkin(rows), [rows]);
  const group = useMemo(() => (gender ? customers.filter((x) => x.gender === gender) : customers), [customers, gender]);

  const kpi = useMemo(() => memberKpis(group, purchases), [group, purchases]);
  const monthly = useMemo(() => newMembersByMonth(group, lastDate), [group, lastDate]);
  const ages = useMemo(() => membersByAge(group), [group]);
  const branches = useMemo(() => membersByBranch(group, purchases), [group, purchases]);
  const hist = useMemo(() => billsHistogram(group, purchases), [group, purchases]);

  const topAge = ages.reduce((a, b) => (b.members > a.members ? b : a));
  const young = ages.filter((a) => a.age === "18-24" || a.age === "25-34").reduce((s, a) => s + a.share, 0);
  const lowBranch = branches.reduce((a, b) => (b.activeRate < a.activeRate ? b : a));
  const full = monthly.filter((m) => !m.partial);
  const first3 = full.slice(0, 3).reduce((s, m) => s + m.members, 0) / 3;
  const last3 = full.slice(-3).reduce((s, m) => s + m.members, 0) / 3;
  const partialMonth = monthly.find((m) => m.partial);
  const [mem, walk] = compare;
  const who = gender ? `สมาชิก${gender}` : "สมาชิก";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl @xl:text-3xl font-bold text-ink">บ้านบรู · ลูกค้าสมาชิก</h1>
          <p className="mt-1 text-ink-2">
            ข้อมูลจาก customers.csv (ทำความสะอาดแล้ว) เชื่อมกับยอดขายด้วย customer_id · ไม่แสดงชื่อและเบอร์โทร (PDPA)
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="กรองตามเพศ">
          {[null, ...GENDERS].map((g) => (
            <button key={g ?? "all"} type="button" onClick={() => setGender(g)} aria-pressed={gender === g}
                    className={`min-h-11 cursor-pointer rounded-lg px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${gender === g ? "bg-ink text-canvas" : "bg-surface-2 text-ink-2 ring-1 ring-line hover:text-ink"}`}>
              {g ?? "ทุกเพศ"}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 @4xl:grid-cols-4 gap-3 @xl:gap-4">
        <KpiCard label={`${who}ทั้งหมด`} value={fmtNum(kpi.members)} note="คน (customer_id ไม่ซ้ำ)" />
        <KpiCard label="เคยซื้ออย่างน้อย 1 ครั้ง" value={pct(kpi.activeRate, 1)} note={`${fmtNum(kpi.buyers)} คน · ยังไม่เคยซื้อ ${fmtNum(kpi.members - kpi.buyers)} คน`} />
        <KpiCard label="บิลเฉลี่ยต่อคน" value={kpi.avgBills.toFixed(1)} note={`ค่ากลาง ${kpi.medianBills} บิล (เฉพาะคนที่เคยซื้อ)`} />
        <KpiCard label="ยอดซื้อเฉลี่ยต่อคน" value={fmtBaht(kpi.avgRevenue)} note="ตลอดช่วงข้อมูล (เฉพาะคนที่เคยซื้อ)" />
      </div>

      <div className="grid @4xl:grid-cols-2 gap-5">
        <Card title="สมาชิกใหม่รายเดือน"
              takeaway={`สมัครเฉลี่ย ${Math.round(last3)} คน/เดือน ใน 3 เดือนล่าสุด เทียบกับ ${Math.round(first3)} คน/เดือน ช่วง 3 เดือนแรก`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={c.grid} />
              <XAxis dataKey="month" tickFormatter={thaiMonth} tick={axis} interval="preserveStartEnd" minTickGap={16} />
              <YAxis tick={axis} width={40} allowDecimals={false} />
              <Tooltip {...c.tooltip} labelFormatter={thaiMonth}
                       formatter={(v, _n, p) => [`${fmtNum(v)} คน${p.payload.partial ? " (ข้อมูลยังไม่ครบเดือน)" : ""}`, "สมาชิกใหม่"]} />
              <Bar dataKey="members" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {monthly.map((m) => <Cell key={m.month} fill={m.partial ? c.muted : c.main} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {partialMonth && <p className="-mt-1 text-xs text-ink-3">แท่งสีจาง = {thaiMonth(partialMonth.month)} มีข้อมูลถึงวันที่ {Number(lastDate.slice(8))} เท่านั้น อย่าเพิ่งสรุปว่าสมัครน้อยลง</p>}
        </Card>

        <Card title="สมาชิกแยกตามกลุ่มอายุ"
              takeaway={`กลุ่มใหญ่สุดคือ ${topAge.age} ปี (${pct(topAge.share)}) · อายุ 18–34 ปีรวมกัน ${pct(young)}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ages} layout="vertical" margin={{ top: 0, right: 100, left: 0, bottom: 0 }}>
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis type="category" dataKey="age" width={78} tick={{ ...axis, fill: c.ink }} />
              <Tooltip {...c.tooltip} formatter={(v, _n, p) => [`${fmtNum(v)} คน (${pct(p.payload.share, 1)})`, "สมาชิก"]} />
              <Bar dataKey="members" fill={c.main} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <LabelList dataKey="members" position="right"
                           formatter={(v) => `${fmtNum(v)} (${pct(v / (kpi.members || 1))})`} style={{ fontSize: 12, fill: c.ink }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="สมาชิกตามสาขาประจำ: เคยซื้อ / ยังไม่เคยซื้อ"
              right={
                <div className="flex gap-3 text-xs text-ink-2" aria-hidden="true">
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: c.main }} />เคยซื้อ</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: c.muted }} />ยังไม่เคยซื้อ</span>
                </div>
              }
              takeaway={`${lowBranch.branch} มีสัดส่วนสมาชิกที่ยังไม่เคยซื้อสูงสุด (${pct(1 - lowBranch.activeRate)}) ควรส่งคูปองซื้อครั้งแรก`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={branches} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="branch" width={90} tick={{ ...axis, fill: c.ink }} />
              <Tooltip {...c.tooltip} formatter={(v, name, p) => [`${fmtNum(v)} คน (${pct(v / p.payload.members)})`, name]} />
              <Bar dataKey="buyers" name="เคยซื้อ" stackId="m" fill={c.main} stroke={c.surface} strokeWidth={2} isAnimationActive={false} />
              <Bar dataKey="inactive" name="ยังไม่เคยซื้อ" stackId="m" fill={c.muted} stroke={c.surface} strokeWidth={2} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <LabelList dataKey="members" position="right" formatter={fmtNum} style={{ fontSize: 12, fill: c.ink }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="จำนวนบิลต่อสมาชิก (คนที่เคยซื้อ)"
              takeaway={`ครึ่งหนึ่งซื้อไม่เกิน ${kpi.medianBills} บิล แต่มีขาประจำที่ซื้อ 20 บิลขึ้นไป ${fmtNum(hist[hist.length - 1].members)} คน · ค่าเฉลี่ยจึงสูงกว่าค่ากลาง`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hist} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={c.grid} />
              <XAxis dataKey="bin" tick={axis} ticks={["1", "5", "10", "15", "20+"]} interval={0} />
              <YAxis tick={axis} width={40} allowDecimals={false} />
              <Tooltip {...c.tooltip} labelFormatter={(b) => `${b} บิล`} formatter={(v) => [`${fmtNum(v)} คน`, "สมาชิก"]} />
              <Bar dataKey="members" fill={c.main} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <section className="rounded-xl bg-surface p-4 @xl:p-5 ring-1 ring-line">
        <h2 className="font-semibold text-ink">สมาชิก เทียบกับ ลูกค้าทั่วไป (ทั้งร้าน)</h2>
        <p className="mt-0.5 text-sm text-ink-2">
          สมาชิกจ่ายต่อบิลใกล้เคียงลูกค้าทั่วไป ({fmtBaht2(mem.avgPerBill)} กับ {fmtBaht2(walk.avgPerBill)}) แต่สร้างยอดขาย {pct(mem.share)} ของร้าน
          คุณค่าของสมาชิกจึงอยู่ที่ความถี่ในการกลับมา ไม่ใช่ขนาดบิล
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink-3">
                <th className="py-2 font-medium">กลุ่ม</th>
                <th className="py-2 text-right font-medium">จำนวนบิล</th>
                <th className="py-2 text-right font-medium">ยอดขาย</th>
                <th className="py-2 text-right font-medium">เฉลี่ยต่อบิล</th>
                <th className="py-2 pl-4 font-medium">สัดส่วนยอดขาย</th>
              </tr>
            </thead>
            <tbody>
              {compare.map((g) => (
                <tr key={g.key} className="border-b border-line last:border-0 text-ink">
                  <td className="py-2.5">{g.label}</td>
                  <td className="py-2.5 text-right tabular-nums">{fmtNum(g.bills)}</td>
                  <td className="py-2.5 text-right tabular-nums">{fmtBaht(g.revenue)}</td>
                  <td className="py-2.5 text-right tabular-nums">{fmtBaht2(g.avgPerBill)}</td>
                  <td className="py-2.5 pl-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-32 rounded-full bg-surface-2 ring-1 ring-line">
                        <div className="h-full rounded-full bg-brand" style={{ width: pct(g.share, 1) }} />
                      </div>
                      <span className="tabular-nums">{pct(g.share, 1)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
