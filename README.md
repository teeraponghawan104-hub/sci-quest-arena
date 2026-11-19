# 🧪 Sci-Quest Arena

เว็บแอปพลิเคชันเกมโชว์การเรียนรู้วิทยาศาสตร์สไตล์ Kahoot! แบบไฮบริด (**บอร์ดเกมการ์ด QR 3 สี + เว็บแอป Real-time**) สำหรับนักเรียนอายุ 12–16 ปี ครอบคลุมเนื้อหาจากเทศกาลภาพยนตร์วิทยาศาสตร์ 4 เรื่อง รองรับตั้งแต่ห้องเรียนปกติจนถึง **หอประชุม 200+ เครื่องพร้อมกัน**

## ✨ ฟีเจอร์หลัก
- **หน้าจอแยกชัดเจน**:
  - **`index.html`** — หน้า Landing เลือกเข้าสู่ระบบในฐานะ **ครูผู้ควบคุมเกม (Host)** หรือ **ผู้เรียน (Player)** พร้อมปุ่มเต็มจอและลิงก์พิมพ์การ์ด
  - **`host.html`** — หน้าจอครูสำหรับฉายโปรเจกเตอร์ แสดง Room PIN + QR Code (`openExternalBrowser=1` เด้งออกจาก LINE อัตโนมัติ), **Leaderboard Top 15 ลื่น 60 FPS + ปุ่มค้นหาผู้เล่นครบ 200+ คน**, Live Feed, **ตัวจับเวลาเกม (หมดเวลาสรุปผลโพเดียม 1–2–3 อัตโนมัติ)**, **ปล่อยคำถามโบนัสจับเวลา `10 วิ / 20 วิ / 30 วิ`**, หน้าจออนุมัติรูปถ่ายหน้าตลกขนาดใหญ่ และโหมดเต็มจอ (ปุ่มลัด `F`)
  - **`player.html`** — หน้าจอนักเรียน (Mobile-First) เลือกอวตาร, สแกน QR พร้อมโหมดสำรองสำหรับ LINE (ถ่ายรูป QR / เลือกรูป / กรอกรหัสการ์ด), ตรวจคำตอบภาษาไทยอัจฉริยะ 4 ระดับ, ระบบจำเครื่องกันเด้งออก (`localStorage` + Self-healing), ไอเทม 9 ชนิด พร้อมช่อง **ค้นหาชื่อเพื่อน / สุ่มเป้า** สำหรับห้อง 200 คน
  - **`cards.html`** — หน้าสำหรับพิมพ์การ์ดคำถาม QR Code 3 สี ทั้ง 36 ใบ + ใบกติกาประจำโต๊ะพร้อมตัดใช้งานจริง
- **9 ไอเทมสุดป่วน**: `⚡ x2 คูณสอง`, `🛡️ โล่กันแกล้ง`, `🧲 ดูดแต้ม`, `❄️ แช่แข็ง`, `💨 หมอกบังจอ`, `🙃 จอตีลังกา`, `⚡ ช็อตแต้ม`, `🚀 เร่งสปีด`, และ `📸 แชะหน้าตลก` (ส่งรูปตรงถึงจอครูเพื่อกดอนุมัติ)
- **ระบบเสียงสตูดิโอ**: เสียงพากย์ไทย Neural ธรรมชาติ 52 ประโยค (รวมศัพท์วัยรุ่นฮิต เช่น *"เริ่ดมากแม่"*, *"โซ๊ะมากแม่"*, *"เริ่ดเลยล่ะ"*) + เอฟเฟกต์และเพลงประกอบสเตอริโอ 24 ไฟล์ พร้อมตัวกันเสียงรัวเมื่อมีคนเข้าพร้อมกัน 200 เครื่อง

---

## 🚀 วิธีเริ่มต้นใช้งานทันที

1. เปิดเทอร์มินัลในโฟลเดอร์โปรเจกต์ แล้วรันเว็บเซิร์ฟเวอร์จำลอง:
   ```bash
   npx serve .
   # หรือใช้ Python:
   python -m http.server 8080
   ```
   *(ไม่แนะนำให้เปิดแบบ `file://` เพราะกล้องสแกน QR ทำงานสมบูรณ์ที่สุดผ่าน HTTP/HTTPS)*
2. เปิดเบราว์เซอร์ไปที่ `http://localhost:8080/index.html`
3. ค่าเริ่มต้น (`backend: 'cloud'`) ซิงก์ข้ามมือถือได้ทันทีโดยไม่ต้องตั้งค่าเพิ่มเติม เหมาะสำหรับห้องเรียนทั่วไป (30–60 เครื่อง)

---

## 🏟️ การตั้งค่าสำหรับหอประชุม 200+ เครื่องพร้อมกัน (แนะนำ!)

ตัวระบบถูกปรับแต่งสถาปัตยกรรมมารองรับ 200 เครื่องแล้ว (แยกช่องส่งรูปเซลฟี่ตรงหาครูเท่านั้น, บีบอัดข้อมูลซิงก์เหลือ ~20 KB, แสดง Leaderboard Top 15 แบบ 60 FPS พร้อมค้นหาครบทุกคน, มีช่องค้นหา/สุ่มชื่อเพื่อนตอนยิงไอเทม และจำกัดเสียงเอฟเฟกต์ไม่ให้ซ้อนรัว)

สำหรับงานแข่งขันจริงระดับสายชั้น/หอประชุม **200 เครื่องพร้อมกัน** แนะนำให้เสียบ Backend ฟรีของ **Supabase** (รองรับ 200 Concurrent Connections ฟรี) หรือ **Firebase** ลงในไฟล์ `js/config.js` เพื่อความนิ่ง 100% ไม่ติด Rate Limit ของ Broker สาธารณะ:

### ตัวเลือก A: Supabase Realtime — โหมด 2 ตาราง (แนะนำที่สุดสำหรับ 200 เครื่อง ฟรี!)
1. สร้างโปรเจกต์ฟรีที่ [Supabase](https://supabase.com/) แล้วเปิด **SQL Editor** รันคำสั่งนี้ทั้งหมดครั้งเดียว:
   ```sql
   -- 1) ตารางเก็บสถานะห้อง (ครูอัปเดตเป็นหลัก)
   create table if not exists public.sqa_rooms (
     code text primary key,
     state jsonb not null,
     version int not null default 1
   );

   -- 2) ตารางเก็บข้อมูลผู้เล่นแยกแถวละ 1 คน (200 เครื่องเขียนพร้อมกันได้ไม่ชนกัน!)
   create table if not exists public.sqa_players (
     room_code text not null,
     pid text not null,
     data jsonb not null,
     updated_at timestamptz not null default now(),
     primary key (room_code, pid)
   );

   create index if not exists idx_sqa_players_room on public.sqa_players (room_code);

   -- เปิดสิทธิ์ใช้งานสำหรับห้องเรียน
   alter table public.sqa_rooms enable row level security;
   alter table public.sqa_players enable row level security;

   create policy "public_room_access" on public.sqa_rooms
     for all using (true) with check (true);
   create policy "public_players_access" on public.sqa_players
     for all using (true) with check (true);

   -- เปิด Realtime ทั้ง 2 ตาราง
   alter publication supabase_realtime add table public.sqa_rooms;
   alter publication supabase_realtime add table public.sqa_players;
   ```
2. นำ `Project URL` และ `anon public key` ไปใส่ใน `js/config.js`:
   ```js
   backend: 'supabase',
   supabase: {
     url: 'https://YOUR_PROJECT.supabase.co',
     anonKey: 'YOUR_ANON_KEY',
     table: 'sqa_rooms',
     playersTable: 'sqa_players',
     scalable: true
   }
   ```
3. Push ขึ้น GitHub / Vercel แล้วใช้งาน 200 เครื่องพร้อมกันได้ทันที!

### ตัวเลือก B: Firebase Realtime Database (รองรับ 100 เครื่องฟรี / Pay-as-you-go รองรับได้ถึง 200,000 เครื่อง)
1. สร้างโปรเจกต์ใน [Firebase Console](https://console.firebase.google.com/) และเปิดใช้ **Realtime Database**
2. ตั้งค่า Security Rules:
   ```json
   {
     "rules": {
       "sqa_rooms": { ".read": true, ".write": true },
       "sqa_selfies": { ".read": true, ".write": true }
     }
   }
   ```
3. นำค่า Config ไปใส่ใน `js/config.js` และเปลี่ยน `backend: 'firebase'`
   *(ระบบใช้ Multi-path updates แยกตาม `players/{pid}` และแยกโหนด `sqa_selfies/{code}` ให้อัตโนมัติ หมดปัญหาเขียนชนกัน)*
