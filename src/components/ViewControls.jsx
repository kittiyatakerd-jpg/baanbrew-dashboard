// ปุ่มเลือกมุมมอง (คอม / มือถือ) และโหมดสี (สว่าง / มืด)
// ไอคอนเป็น SVG แบบเส้น ใช้ร่วมกับข้อความเสมอ ไม่ใช้ emoji

const Icon = ({ d, children }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);
const Monitor = () => <Icon><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></Icon>;
const Phone = () => <Icon><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></Icon>;
const Sun = () => <Icon><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>;
const Moon = () => <Icon d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />;

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

function Segmented({ label, value, onChange, options, className = "" }) {
  return (
    <div role="group" aria-label={label} className={`flex rounded-lg bg-surface-2 p-1 ring-1 ring-line ${className}`}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
                className={`flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-medium ${focus}
                  ${value === o.value ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink-3 hover:text-ink"}`}>
          {o.icon}<span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function ViewControls({ view, setView, theme, setTheme }) {
  return (
    <div className="flex items-center gap-2">
      {/* บนมือถือจริงไม่ต้องจำลอง จึงซ่อนปุ่มนี้ */}
      <Segmented label="มุมมองหน้าจอ" value={view} onChange={setView} className="hidden md:flex"
                 options={[{ value: "desktop", label: "คอม", icon: <Monitor /> },
                           { value: "mobile", label: "มือถือ", icon: <Phone /> }]} />
      <Segmented label="โหมดสี" value={theme} onChange={setTheme}
                 options={[{ value: "light", label: "สว่าง", icon: <Sun /> },
                           { value: "dark", label: "มืด", icon: <Moon /> }]} />
    </div>
  );
}
