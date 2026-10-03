/** กรอบกราฟ: หัวข้อ + ข้อสรุป 1 บรรทัด + กราฟ */
export default function Card({ title, takeaway, children, right, height = 300 }) {
  return (
    <section className="rounded-xl bg-surface p-4 @xl:p-5 ring-1 ring-line">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-ink">{title}</h2>
          {takeaway && <p className="mt-0.5 text-sm text-ink-2">{takeaway}</p>}
        </div>
        {right}
      </div>
      <div className="mt-3" style={{ height }}>{children}</div>
    </section>
  );
}
