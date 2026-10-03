export default function KpiCard({ label, value, note }) {
  return (
    <div className="rounded-xl bg-surface p-4 @xl:p-5 ring-1 ring-line">
      <div className="text-sm text-ink-3">{label}</div>
      <div className="mt-1 text-2xl @xl:text-3xl font-semibold tabular-nums text-ink">{value}</div>
      {note && <div className="mt-1 text-xs text-ink-3">{note}</div>}
    </div>
  );
}
