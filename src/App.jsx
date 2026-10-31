import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Papa from "papaparse";
import Overview from "./Overview.jsx";
import Lab2Page from "./lab2/Lab2Page.jsx";
import Customers from "./Customers.jsx";
import LiveTab from "./lab3/LiveTab.jsx";
import RulesTester from "./lab3/RulesTester.jsx";
import SetupGuide from "./lab3/SetupGuide.jsx";
import CustomersTab from "./lab4/CustomersTab.jsx";
import ForecastTab from "./lab4/ForecastTab.jsx";
import ViewControls from "./components/ViewControls.jsx";
import { isConfigured } from "./lab3/firebase.js";
import { firestoreSource, createDemoSource } from "./lab3/dataSource.js";
import { prepareRows } from "./lib/metrics.js";

const loadCsv = (url) =>
  new Promise((resolve, reject) =>
    Papa.parse(url, {
      download: true, header: true, skipEmptyLines: true,
      complete: (res) => resolve(res.data),
      error: (err) => reject(err),
    })
  );

// ?demo = โหมดสาธิต คำนวณในเบราว์เซอร์ ไม่ต้องมี Firebase
const DEMO = new URLSearchParams(location.search).has("demo");
const TABS = [
  { id: "overview", label: "ภาพรวม" },
  { id: "customers", label: "ลูกค้าสมาชิก" },
  { id: "lab2", label: "Lab 2.2 · ซ่อมกราฟ" },
  { id: "live", label: "สด · Firestore" },
  // id "customers" ใช้กับแท็บลูกค้าสมาชิก (การบ้าน) ไปแล้ว แท็บ Lab 4 จึงใช้ "rfm"
  { id: "rfm", label: "ลูกค้า & เมนู" },
  { id: "forecast", label: "พยากรณ์ & ผิดปกติ" },
  { id: "rules", label: "ทดสอบ Rules" },
];

// อ่าน/เขียนค่าที่ผู้ใช้เลือกไว้ (ถ้าเบราว์เซอร์บล็อก storage ก็ยังใช้งานได้ปกติ)
const load = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const save = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ไม่เป็นไร */ } };

// จอกว้างพอจะแสดงกรอบจำลองมือถือไหม (บนมือถือจริงไม่ต้องจำลอง)
const wideMq = typeof matchMedia !== "undefined" ? matchMedia("(min-width: 768px)") : null;
const useWide = () => useSyncExternalStore(
  (cb) => { wideMq?.addEventListener("change", cb); return () => wideMq?.removeEventListener("change", cb); },
  () => wideMq?.matches ?? true,
);

export default function App() {
  const [rows, setRows] = useState(null);
  const [products, setProducts] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [holidays, setHolidays] = useState({});
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(() => TABS.find((t) => "#" + t.id === location.hash)?.id ?? "overview");
  const [view, setView] = useState(() => load("view") ?? "desktop");
  const [theme, setTheme] = useState(() => (document.documentElement.classList.contains("dark") ? "dark" : "light"));

  useEffect(() => {
    Promise.all([loadCsv("/sales.csv"), loadCsv("/products.csv"), loadCsv("/customers.csv"), loadCsv("/thai_holidays.csv").catch(() => [])])
      .then(([sales, prods, custs, hol]) => {
        setRows(prepareRows(sales)); setProducts(prods); setCustomers(custs);
        setHolidays(Object.fromEntries(hol.map((h) => [h.date, h.holiday])));
      })
      .catch((e) => setError(e.message ?? String(e)));
  }, []);

  // แหล่งข้อมูลของแท็บ Lab 3–4: โหมดสาธิตใช้ CSV ในเครื่อง ไม่งั้นใช้ Firestore
  const source = useMemo(() => {
    if (DEMO) return rows && products ? createDemoSource(rows, products, holidays) : null;
    return isConfigured ? firestoreSource : null;
  }, [rows, products, holidays]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("theme-fade");
    html.classList.toggle("dark", theme === "dark");
    save("theme", theme);
  }, [theme]);
  useEffect(() => save("view", view), [view]);

  const choose = (id) => { setTab(id); history.replaceState(null, "", location.search + "#" + id); };
  const needsCsv = ["overview", "customers", "lab2"].includes(tab) || DEMO;
  const wide = useWide();
  const mobile = view === "mobile" && wide;

  const content = (
    <div className="@container px-4 @xl:px-5 py-6 @xl:py-8">
      {error && needsCsv && <p className="text-red-700 dark:text-red-400">โหลดข้อมูลไม่สำเร็จ: {error} (ตรวจว่ามี public/sales.csv, products.csv และ customers.csv)</p>}
      {!error && needsCsv && !rows && <p className="text-ink-3">กำลังโหลดข้อมูลยอดขาย…</p>}
      {rows && tab === "overview" && <Overview rows={rows} />}
      {rows && tab === "customers" && <Customers rows={rows} customers={customers} />}
      {rows && tab === "lab2" && <Lab2Page rows={rows} products={products} />}
      {tab === "live" && (source ? <LiveTab source={source} /> : !DEMO && <SetupGuide />)}
      {tab === "rfm" && (source ? <CustomersTab source={source} /> : !DEMO && <SetupGuide />)}
      {tab === "forecast" && (source ? <ForecastTab source={source} /> : !DEMO && <SetupGuide />)}
      {tab === "rules" && (DEMO ? <p className="text-ink-2">การทดสอบ Rules ใช้ได้กับ Firebase จริงเท่านั้น ไม่ใช่โหมดสาธิต</p>
        : isConfigured ? <RulesTester /> : <SetupGuide />)}
    </div>
  );

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <nav className="sticky top-0 z-10 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-2">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => choose(t.id)} aria-current={tab === t.id ? "page" : undefined}
                      className={`min-h-11 shrink-0 cursor-pointer rounded-lg px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${tab === t.id ? "bg-ink text-canvas" : "text-ink-2 hover:bg-surface-2"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <ViewControls view={view} setView={setView} theme={theme} setTheme={setTheme} />
        </div>
      </nav>

      {mobile ? (
        // จำลองจอมือถือ 390px (ขนาด iPhone 14/15) · layout ใช้ container query จึงจัดตัวเองตามความกว้างกรอบ
        <div className="flex justify-center px-4 py-8">
          <div className="w-[390px] shrink-0 overflow-hidden rounded-[2.5rem] border-[10px] border-stone-950 shadow-2xl ring-1 ring-line">
            <div className="h-[780px] overflow-y-auto bg-canvas">{content}</div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl">{content}</div>
      )}
    </main>
  );
}
