/* =========================================================
 * Sci-Quest! — การตั้งค่า (แก้ไขไฟล์นี้ไฟล์เดียว)
 * ---------------------------------------------------------
 * backend:
 *   'cloud'    = ซิงก์ออนไลน์ข้ามอุปกรณ์อัตโนมัติ (ค่าเริ่มต้น — ใช้งานบน Vercel / มือถือสแกน QR เล่นได้ทันที ไม่ต้องตั้งค่า DB)
 *   'local'    = โหมดจำลองในเครื่องเดียว (localStorage + BroadcastChannel)
 *   'firebase' = Firebase Realtime Database (กรณีต้องการใช้ DB ส่วนตัว)
 *   'supabase' = Supabase Realtime (กรณีต้องการใช้ DB ส่วนตัว)
 * ========================================================= */
window.SQA_CONFIG = {
  backend: 'cloud',

  cloud: {
    brokers: [
      'wss://broker.emqx.io:8084/mqtt',
      'wss://broker.hivemq.com:8884/mqtt'
    ],
    topicPrefix: 'sciquest_arena_v2'
  },

  firebase: {
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    appId: ''
  },

  supabase: {
    url: '',
    anonKey: '',
    table: 'sqa_rooms'
  },

  // URL สาธารณะของเว็บ (เว้นว่าง = ใช้ URL ปัจจุบันอัตโนมัติ เช่น https://sci-quest-arena.vercel.app/)
  publicBaseUrl: '',

  game: {
    redItemChance: 0.4,       // โอกาสได้ไอเทมจากการ์ดแดง (0-1)
    stealAmount: 100,         // แต้มที่ขโมยได้
    freezeHits: 5,            // จำนวนครั้งที่ต้องทุบน้ำแข็ง
    bonusPassThreshold: 50    // % ความแม่นยำขั้นต่ำเพื่อผ่านคำถามโบนัส
  }
};
