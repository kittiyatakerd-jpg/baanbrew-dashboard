# บ้านบรู Dashboard (Lab 1–2)

Dashboard ยอดขายร้านกาแฟบ้านบรู 5 สาขา สร้างด้วย React + Vite + Tailwind + Recharts อ่านข้อมูลจาก `public/sales.csv`

```bash
npm install
npm run dev      # เปิด http://localhost:5173
npm run verify   # พิมพ์ KPI และยอดแต่ละสาขา ไว้เทียบกับ Pivot Table
```

| แท็บ / ไฟล์ | งาน |
|---|---|
| ภาพรวม · `src/Overview.jsx` | Lab 1.2: KPI 4 ตัว, ยอดขายรายวัน + เฉลี่ย 7 วัน, ยอดขายแยกสาขา · การบ้าน: บิลตามชั่วโมง (`HOMEWORK_DAY1.md`) |
| `src/lib/metrics.js` | สูตรคำนวณทั้งหมด (ยอดขาย = qty × unit_price, บิล = order_id ไม่ซ้ำ) |
| Lab 2.2 · `src/lab2/FixedCharts.jsx` | ซ่อมกราฟแย่ 5 แบบ · คำตอบใบงานใน `LAB2_WORKSHEET.md` |
| `../lab2-cleaning/` | Lab 2.1: notebook ทำความสะอาดข้อมูล, `sales_clean.csv`, บันทึกการตัดสินใจ |

## ปุ่มมุมมองและโหมดสี (แถบเมนูขวาบน)
- **คอม / มือถือ:** จำลองจอมือถือกว้าง 390px บนคอม layout ใช้ container query (`@container`, `@xl:`, `@4xl:`) จึงจัดตัวเองตามความกว้างกรอบ ไม่ใช่ตามจอ (บนมือถือจริงจะซ่อนปุ่มนี้)
- **สว่าง / มืด:** สลับ class `dark` บน `<html>` ครั้งแรกจะตามการตั้งค่าของเครื่อง และจำค่าที่เลือกไว้ (`localStorage`)
- สีทั้งหมดเป็นโทเคนตามหน้าที่ใน `src/index.css` (`bg-surface`, `text-ink-2`, ...) ส่วนสีกราฟอยู่ใน `src/theme.js` (`useChartColors`) ตัวอักษรทุกคู่สีผ่าน contrast 4.5:1

## ผลการตรวจ (Verify)
ยอดขายรวม ฿4,466,821 · บิล 34,791 · เฉลี่ย ฿128.39/บิล · สมาชิก 2,507
สยาม ฿1,230,707 > สีลม ฿997,409 > บางนา ฿899,690 > มหาวิทยาลัย ฿796,625 > อารีย์ ฿542,390
