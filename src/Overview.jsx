import { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LabelList,
} from "recharts";
import KpiCard from "./components/KpiCard.jsx";
import Card from "./components/Card.jsx";
import {
  computeKpis, dailyRevenue, withMovingAverage, revenueByBranch, billsByHour,
  fmtBaht, fmtBaht2, fmtNum, fmtShortBaht, thaiDate,
} from "./lib/metrics.js";
import { useChartColors } from "./theme.js";

const BRANCHES = ["สยาม", "สีลม", "อารีย์", "บางนา", "มหาวิทยาลัย"];

export default function Overview({ rows }) {
  const c = useChartColors();
  const axis = c.tick;
  const kpi = useMemo(() => computeKpis(rows), [rows]);
  const daily = useMemo(() => withMovingAverage(dailyRevenue(rows)), [rows]);
  const byBranch = useMemo(() => revenueByBranch(rows), [rows]);
  const [hourBranch, setHourBranch] = useState(null);
  const byHour = useMemo(() => billsByHour(rows, hourBranch), [rows, hourBranch]);
  const peak = byHour.reduce((a, b) => (b.bills > a.bills ? b : a), byHour[0]);

  const first = daily[0]?.date, last = daily[daily.length - 1]?.date;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl @xl:text-3xl font-bold text-ink">บ้านบรู · ภาพรวมยอดขาย</h1>
        <p className="mt-1 text-ink-2">
          ข้อมูล {thaiDate(first)} – {thaiDate(last)} · {daily.length} วัน · 5 สาขา
        </p>
      </header>

      <div className="grid grid-cols-2 @4xl:grid-cols-4 gap-3 @xl:gap-4">
        <KpiCard label="ยอดขายรวม" value={fmtBaht(kpi.revenue)} note="Σ qty × unit_price" />
        <KpiCard label="จำนวนบิล" value={fmtNum(kpi.bills)} note="order_id ที่ไม่ซ้ำ" />
        <KpiCard label="ยอดเฉลี่ยต่อบิล" value={fmtBaht2(kpi.avgPerBill)} note="ยอดขาย ÷ จำนวนบิล" />
        <KpiCard label="ลูกค้าสมาชิก" value={fmtNum(kpi.members)} note="customer_id ไม่ซ้ำ (ไม่นับลูกค้าทั่วไป)" />
      </div>

      <Card title="ยอดขายรายวัน"
            takeaway="เส้นเข้มคือค่าเฉลี่ย 7 วัน ใช้ดูแนวโน้ม · เส้นจางคือยอดจริงแต่ละวัน">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={daily} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="date" tickFormatter={thaiDate} tick={axis} minTickGap={40} />
            <YAxis tickFormatter={fmtShortBaht} tick={axis} width={56} />
            <Tooltip {...c.tooltip} labelFormatter={thaiDate}
                     formatter={(v, name) => [fmtBaht(v), name === "ma7" ? "เฉลี่ย 7 วัน" : "ยอดขายวันนั้น"]} />
            <Legend formatter={(v) => (v === "ma7" ? "เฉลี่ย 7 วัน" : "ยอดขายรายวัน")} />
            <Line dataKey="revenue" stroke={c.muted} strokeWidth={1} dot={false} isAnimationActive={false} />
            <Line dataKey="ma7" stroke={c.main} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid @4xl:grid-cols-2 gap-5">
        <Card title="ยอดขายแยกสาขา"
              takeaway={`${byBranch[0].branch} ขายได้มากที่สุด ${fmtBaht(byBranch[0].revenue)} (ยอดรวมทั้งช่วงข้อมูล)`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byBranch} margin={{ top: 24, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={c.grid} />
              <XAxis dataKey="branch" tick={axis} interval={0} />
              <YAxis tickFormatter={fmtShortBaht} tick={axis} width={56} domain={[0, "auto"]} />
              <Tooltip {...c.tooltip} formatter={(v) => [fmtBaht(v), "ยอดขาย"]} />
              <Bar dataKey="revenue" fill={c.main} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                <LabelList dataKey="revenue" position="top" formatter={fmtShortBaht} style={{ fontSize: 12, fill: c.ink }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="จำนวนบิลตามชั่วโมงของวัน"
              takeaway={`${hourBranch ?? "ทุกสาขา"}: ช่วงที่คนเยอะที่สุดคือ ${String(peak.hour).padStart(2, "0")}.00–${String(peak.hour + 1).padStart(2, "0")}.00 น. (${fmtNum(peak.bills)} บิล)`}
              right={
                <div className="flex flex-wrap gap-2" role="group" aria-label="เลือกสาขา">
                  {[null, ...BRANCHES].map((b) => (
                    <button key={b ?? "all"} onClick={() => setHourBranch(b)}
                            aria-pressed={hourBranch === b}
                            className={`min-h-11 rounded-lg px-3 text-sm font-medium cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${hourBranch === b ? "bg-ink text-canvas" : "bg-surface-2 text-ink-2 ring-1 ring-line hover:text-ink"}`}>
                      {b ?? "ทุกสาขา"}
                    </button>
                  ))}
                </div>
              }>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byHour} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={c.grid} />
              <XAxis dataKey="hour" tickFormatter={(h) => `${String(h).padStart(2, "0")}.00`} tick={axis} />
              <YAxis tickFormatter={fmtNum} tick={axis} width={52} />
              <Tooltip {...c.tooltip} labelFormatter={(h) => `${String(h).padStart(2, "0")}.00–${String(h + 1).padStart(2, "0")}.00 น.`}
                       formatter={(v) => [fmtNum(v) + " บิล", "จำนวนบิล"]} />
              <Bar dataKey="bills" fill={c.main} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
