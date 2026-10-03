// Lab 2.2 · กราฟที่ซ่อมแล้ว
// หลักทุกกราฟ: คำถาม → ตัวชี้วัดที่ยุติธรรม → กราฟที่อ่านง่ายที่สุด → ข้อสรุป 1 บรรทัดคำนวณจากข้อมูลจริง
import { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, LabelList, Cell,
} from "recharts";
import { revenueByProduct, monthlyRevenue, branchPerformance, weeklyRevenue, daysInMonth } from "./lab2Metrics.js";
import { fmtBaht, fmtShortBaht, thaiDate, thaiMonth } from "../lib/metrics.js";
import { useChartColors } from "../theme.js";

const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;

function Frame({ takeaway, note, children }) {
  return (
    <div className="flex h-full flex-col gap-1">
      <p className="text-sm font-semibold text-ink">{takeaway}</p>
      <div className="min-h-0 flex-1">{children}</div>
      {note && <p className="text-xs text-ink-3">{note}</p>}
    </div>
  );
}

/** 1) Pie 40 ชิ้น → แท่งแนวนอน 10 อันดับแรก สีเดียว ป้าย % ท้ายแท่ง */
export function FixedChart1({ rows, products }) {
  const c = useChartColors(); const axis = c.tick;
  const all = useMemo(() => revenueByProduct(rows, products), [rows, products]);
  const top = all.slice(0, 10);
  const top3 = top.slice(0, 3).reduce((s, d) => s + d.share, 0);
  const rest = all.slice(10).reduce((s, d) => s + d.share, 0);
  return (
    <Frame takeaway={`${top[0].name} ทำเงินสูงสุด (${pct(top[0].share)}) · 3 อันดับแรกรวมกัน ${pct(top3, 0)}`}
           note={`อีก ${all.length - 10} เมนูที่เหลือรวมกัน ${pct(rest, 0)} ของยอดขาย`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={top} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: c.ink }} interval={0} />
          <Tooltip {...c.tooltip} formatter={(v) => [fmtBaht(v), "ยอดขาย"]} />
          <Bar dataKey="revenue" fill={c.main} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList dataKey="share" position="right" formatter={(v) => pct(v)} style={{ fontSize: 11, fill: c.ink }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Frame>
  );
}

/** 2) แกนตัด + สีรุ้ง → แกนเริ่มที่ 0 สีเดียว เรียงมากไปน้อย มีป้ายตัวเลข */
export function FixedChart2({ rows }) {
  const c = useChartColors(); const axis = c.tick;
  const data = useMemo(() => branchPerformance(rows).sort((a, b) => b.revenue - a.revenue), [rows]);
  const hi = data[0], lo = data[data.length - 1];
  return (
    <Frame takeaway={`${hi.branch} ขายได้ ${(hi.revenue / lo.revenue).toFixed(1)} เท่าของ${lo.branch} (ยอดรวมทั้งช่วงข้อมูล)`}
           note="แกน Y เริ่มที่ 0 ความสูงของแท่งจึงเทียบกันได้ตรงตามจริง">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="branch" tick={axis} interval={0} />
          <YAxis tickFormatter={fmtShortBaht} tick={axis} width={60} domain={[0, "auto"]} />
          <Tooltip {...c.tooltip} formatter={(v) => [fmtBaht(v), "ยอดขาย"]} />
          <Bar dataKey="revenue" fill={c.main} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            <LabelList dataKey="revenue" position="top" formatter={fmtShortBaht} style={{ fontSize: 12, fill: c.ink }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Frame>
  );
}

/** 3) 538 จุดยุ่งเหยิง → รวมเป็นรายสัปดาห์ (เฉพาะสัปดาห์ที่ครบ 7 วัน) */
export function FixedChart3({ rows }) {
  const c = useChartColors(); const axis = c.tick;
  const data = useMemo(() => weeklyRevenue(rows), [rows]);
  const avg = (arr) => arr.reduce((s, d) => s + d.revenue, 0) / arr.length;
  const growth = avg(data.slice(-13)) / avg(data.slice(0, 13)) - 1;
  return (
    <Frame takeaway={`ยอดขายโตขึ้น: เฉลี่ยต่อสัปดาห์ช่วง 13 สัปดาห์ล่าสุดสูงกว่า 13 สัปดาห์แรก ${pct(growth, 0)}`}
           note="รวมเป็นรายสัปดาห์ (จันทร์–อาทิตย์) ตัดสัปดาห์ที่ข้อมูลไม่ครบ 7 วัน · ยอดกระโดดช่วง พ.ย. 68 คือสาขาอารีย์เปิด">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="week" tickFormatter={(w) => thaiMonth(w.slice(0, 7))} tick={axis} minTickGap={40} />
          <YAxis tickFormatter={fmtShortBaht} tick={axis} width={56} domain={[0, "auto"]} />
          <Tooltip {...c.tooltip} labelFormatter={(w) => `สัปดาห์เริ่ม ${thaiDate(w)}`} formatter={(v) => [fmtBaht(v), "ยอดขายต่อสัปดาห์"]} />
          <Line dataKey="revenue" stroke={c.main} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </Frame>
  );
}

/** 4) ยอดรวมรายเดือน (เดือนล่าสุดมีไม่กี่วัน) → ยอดเฉลี่ยต่อวัน + ทำเครื่องหมายเดือนที่ข้อมูลไม่ครบ */
export function FixedChart4({ rows }) {
  const c = useChartColors(); const axis = c.tick;
  const data = useMemo(
    () => monthlyRevenue(rows).map((m) => ({ ...m, partial: m.days < daysInMonth(m.month) })),
    [rows]
  );
  const last = data[data.length - 1], prev = data[data.length - 2];
  const diff = last.perDay / prev.perDay - 1;
  return (
    <Frame takeaway={`${thaiMonth(last.month)} มีข้อมูลแค่ ${last.days} วัน · ยอดเฉลี่ยต่อวัน ${fmtBaht(last.perDay)} ${diff >= 0 ? "สูงกว่า" : "ต่ำกว่า"}${thaiMonth(prev.month)} ${pct(Math.abs(diff))} ยอดไม่ได้ตก`}
           note="ใช้ยอดเฉลี่ยต่อวันแทนยอดรวม เพราะแต่ละเดือนมีจำนวนวันไม่เท่ากัน · แท่งสีจาง = เดือนที่ข้อมูลยังไม่ครบ">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="month" tickFormatter={thaiMonth} tick={axis} interval={2} />
          <YAxis tickFormatter={fmtShortBaht} tick={axis} width={56} domain={[0, "auto"]} />
          <Tooltip {...c.tooltip} labelFormatter={thaiMonth}
                   formatter={(v, _n, p) => [`${fmtBaht(v)} (${p.payload.days} วัน)`, "ยอดเฉลี่ยต่อวัน"]} />
          <Bar dataKey="perDay" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((m) => <Cell key={m.month} fill={m.partial ? c.muted : c.main} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Frame>
  );
}

/** 5) ยอดรวมสาขา (เปิดไม่พร้อมกัน) → ยอดเฉลี่ยต่อวันที่เปิดขาย */
export function FixedChart5({ rows }) {
  const c = useChartColors(); const axis = c.tick;
  const data = useMemo(() => branchPerformance(rows).sort((a, b) => b.perDay - a.perDay), [rows]);
  const lo = data[data.length - 1];
  const ari = data.find((d) => d.branch === "อารีย์");
  return (
    <Frame takeaway={`เทียบต่อวันแล้ว ${lo.branch} ต่ำสุด ${fmtBaht(lo.perDay)}/วัน · อารีย์ (${ari.days} วัน) ไม่ใช่สาขาที่แย่ที่สุดอย่างที่ยอดรวมทำให้เข้าใจ`}
           note="ยอดเฉลี่ยต่อวัน = ยอดรวม ÷ จำนวนวันที่มีการขาย · ก่อนสรุปเรื่องผู้จัดการ ควรดูประเภทสาขา ทำเล และวันหยุดเทอมของมหาวิทยาลัยด้วย">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 64, left: 0, bottom: 0 }}>
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis type="category" dataKey="branch" width={90} tick={{ fontSize: 12, fill: c.ink }} />
          <Tooltip
                   formatter={(v, _n, p) => [`${fmtBaht(v)}/วัน (${p.payload.days} วัน)`, "ยอดเฉลี่ยต่อวัน"]} />
          <Bar dataKey="perDay" fill={c.main} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList dataKey="perDay" position="right" formatter={(v) => fmtBaht(v)} style={{ fontSize: 12, fill: c.ink }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Frame>
  );
}
