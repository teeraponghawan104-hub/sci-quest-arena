# 🧪 Sci-Quest Arena

เว็บแอปพลิเคชันเกมโชว์การเรียนรู้วิทยาศาสตร์แบบไฮบริด (**บอร์ดเกมการ์ด 3 สี + เว็บแอป Real-time**) สำหรับนักเรียนอายุ 12–16 ปี ครอบคลุมเนื้อหาจากเทศกาลภาพยนตร์วิทยาศาสตร์ 4 เรื่อง

## 📂 โครงสร้างหน้าจอ (แยกชัดเจน)
- **`index.html`** — หน้า Landing เลือกเข้าสู่ระบบในฐานะ **ครูผู้ควบคุมเกม (Host)** หรือ **ผู้เรียน (Player)** และลิงก์ไปหน้าพิมพ์การ์ด
- **`host.html`** — หน้าจอครู (สำหรับฉายโปรเจกเตอร์หน้าห้อง) แสดง Room PIN, QR Code, Leaderboard สลับอันดับแบบ Real-time, Live Feed การใช้ไอเทม, ปุ่มปล่อยคำถามโบนัส, หยุดเกม และโพเดียม 1–2–3 + บอทจำลองสำหรับทดสอบ
- **`player.html`** — หน้าจอนักเรียน (Mobile-First แนวตั้ง) ล็อกอินเลือกอวตาร, สแกน QR หรือพิมพ์รหัสการ์ด, ตอบคำถามแบบไม่จับเวลาพร้อมตรวจคำตอบภาษาไทยอัจฉริยะ, แถบไอเทมด้านล่างจอ, กล่องสุ่ม และหน้าจอทุบน้ำแข็ง
- **`cards.html`** — หน้าสำหรับพิมพ์การ์ดคำถาม QR Code 3 สี ทั้ง 36 ใบ + ใบกติกาประจำโต๊ะพร้อมตัดใช้งานจริง

---

## 🚀 วิธีเริ่มต้นใช้งานทันที (โหมดจำลองในเครื่อง)

1. เปิดเทอร์มินัลในโฟลเดอร์โปรเจกต์ แล้วรันเว็บเซิร์ฟเวอร์จำลอง เช่น:
   ```bash
   npx serve .
   # หรือใช้ Python:
   python -m http.server 8080
   ```
   *(ไม่แนะนำให้เปิดแบบ `file://` เพราะกล้องสแกน QR และ `BroadcastChannel` ทำงานสมบูรณ์ที่สุดผ่าน HTTP/HTTPS)*
2. เปิดเบราว์เซอร์ไปที่ `http://localhost:8080/index.html`
3. เปิดแท็บ **Host (`host.html`)** เพื่อรับรหัสห้อง (เช่น `1234`) แล้วกด **"เปิดแท็บนักเรียน"** หรือกด **"+ เพิ่มบอท 4 คน"** และ **"จำลองการเล่นอัตโนมัติ"** เพื่อดู Leaderboard และ Live Feed ทำงานทันที!

---

## 🌐 การเชื่อมต่อ Real-time ข้ามอุปกรณ์ (เลือกใช้ Firebase หรือ Supabase)

แก้ไขไฟล์ `js/config.js` เพียงไฟล์เดียว:

### ตัวเลือก A: Firebase Realtime Database
1. สร้างโปรเจกต์ใน [Firebase Console](https://console.firebase.google.com/) และเปิดใช้ **Realtime Database**
2. ตั้งค่า Security Rules เบื้องต้น (สำหรับห้องเรียน):
   ```json
   {
     "rules": {
       "sqa_rooms": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```
3. นำค่า Config ไปใส่ใน `js/config.js` และเปลี่ยน `backend: 'firebase'`

### ตัวเลือก B: Supabase Realtime
1. สร้างโปรเจกต์ใน [Supabase](https://supabase.com/) แล้วรัน SQL นี้ใน SQL Editor:
   ```sql
   create table public.sqa_rooms (
     code text primary key,
     state jsonb not null,
     version int not null default 1
   );
   alter table public.sqa_rooms enable row level security;
   create policy "public_room_access" on public.sqa_rooms for all using (true) with check (true);
   alter publication supabase_realtime add table public.sqa_rooms;
   ```
2. ใส่ `url` และ `anonKey` ใน `js/config.js` และเปลี่ยน `backend: 'supabase'`
3. หากโฮสต์บนโดเมนจริง (เช่น Firebase Hosting / Vercel / Netlify) สามารถใส่ `publicBaseUrl` ใน `js/config.js` เพื่อให้ QR Code ชี้ไปยัง URL สาธารณะได้ทันที
