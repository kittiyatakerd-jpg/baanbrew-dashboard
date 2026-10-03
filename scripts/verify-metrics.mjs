// ตรวจตัวเลขของ metrics.js ด้วย Node (ไม่ต้องเปิดเบราว์เซอร์)
// รัน: node scripts/verify-metrics.mjs  แล้วเทียบกับ Pivot Table ใน Excel/Sheets
import { readFileSync } from "node:fs";
import Papa from "papaparse";
import { prepareRows, computeKpis, revenueByBranch, billsByHour, fmtBaht, fmtBaht2, fmtNum } from "../src/lib/metrics.js";

const csv = readFileSync(new URL("../public/sales.csv", import.meta.url), "utf8");
const rows = prepareRows(Papa.parse(csv, { header: true, skipEmptyLines: true }).data);
const k = computeKpis(rows);
console.log("แถวทั้งหมด", fmtNum(rows.length));
console.log("ยอดขายรวม ", fmtBaht(k.revenue));
console.log("จำนวนบิล  ", fmtNum(k.bills));
console.log("เฉลี่ย/บิล ", fmtBaht2(k.avgPerBill));
console.log("สมาชิก    ", fmtNum(k.members));
console.table(revenueByBranch(rows).map((b) => ({ สาขา: b.branch, ยอดขาย: b.revenue })));
for (const b of [null, "สยาม", "สีลม", "อารีย์", "บางนา", "มหาวิทยาลัย"]) {
  const h = billsByHour(rows, b);
  const top = [...h].sort((x, y) => y.bills - x.bills).slice(0, 3).map((x) => `${x.hour}.00(${x.bills})`);
  console.log(`พีค ${b ?? "ทุกสาขา"}:`, top.join(", "));
}
