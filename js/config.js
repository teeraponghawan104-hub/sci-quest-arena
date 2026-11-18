/* =========================================================
 * Sci-Quest Arena — การตั้งค่า (แก้ไขไฟล์นี้ไฟล์เดียว)
 * ---------------------------------------------------------
 * backend:
 *   'local'    = โหมดจำลองในเครื่อง (ทดสอบได้ทันที เปิดหลายแท็บในเบราว์เซอร์เดียวกัน)
 *   'firebase' = Firebase Realtime Database (เล่นจริงข้ามอุปกรณ์)
 *   'supabase' = Supabase (ตาราง sqa_rooms + Realtime) ดู README.md
 * ========================================================= */
window.SQA_CONFIG = {
  backend: 'local',

  firebase: {
    apiKey: '',
    authDomain: '',
    databaseURL: '',      // เช่น https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app
    projectId: '',
    appId: ''
  },

  supabase: {
    url: '',              // เช่น https://xxxx.supabase.co
    anonKey: '',
    table: 'sqa_rooms'
  },

  // URL สาธารณะของเว็บ (ใช้สร้าง QR Code) เว้นว่าง = ใช้ URL ปัจจุบันอัตโนมัติ
  // เช่น 'https://sci-quest.web.app/'
  publicBaseUrl: '',

  game: {
    redItemChance: 0.4,       // โอกาสได้ไอเทมจากการ์ดแดง (0-1)
    stealAmount: 100,         // แต้มที่ขโมยได้
    freezeHits: 5,            // จำนวนครั้งที่ต้องทุบน้ำแข็ง
    bonusPassThreshold: 50    // % ความแม่นยำขั้นต่ำเพื่อผ่านคำถามโบนัส
  }
};
