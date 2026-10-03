import { useSyncExternalStore } from "react";

// สีกราฟแยกตามธีม (Recharts ต้องการค่าสีจริง ใช้ CSS variable ใน SVG attribute ไม่ได้)
const PALETTES = {
  light: { main: "#8A4B1F", muted: "#E7D3BF", grid: "#EEE7E0", ink: "#44403c", axis: "#78716c", cursor: "#f5f0ea", surface: "#ffffff", line: "#e7e5e4" },
  dark:  { main: "#D9A273", muted: "#5C4532", grid: "#332c27", ink: "#e7e0d9", axis: "#a1958a", cursor: "#2a2420", surface: "#1f1b18", line: "#3a332d" },
};

const isDark = () => document.documentElement.classList.contains("dark");
const subscribe = (cb) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
};

/** คืนชุดสีของกราฟตามธีมปัจจุบัน และอัปเดตเองเมื่อสลับ Dark/Light */
export function useChartColors() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  const c = PALETTES[dark ? "dark" : "light"];
  return {
    ...c,
    tick: { fontSize: 12, fill: c.axis },
    tooltip: {
      contentStyle: { background: c.surface, border: `1px solid ${c.line}`, borderRadius: 8, color: c.ink },
      labelStyle: { color: c.ink, fontWeight: 600 },
      itemStyle: { color: c.ink },
      cursor: { fill: c.cursor },
    },
  };
}
