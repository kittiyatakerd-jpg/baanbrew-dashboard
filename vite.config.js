import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ใช้พอร์ต 5173 เสมอ ถ้ามีโปรแกรมอื่นใช้อยู่จะแจ้ง error แทนการเลื่อนไปเลขอื่นเงียบ ๆ
  server: { port: 5173, strictPort: true },
})
