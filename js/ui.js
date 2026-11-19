/* Sci-Quest! — ค่าคงที่และ helper ของ UI สไตล์ Kahoot! */
const AVATARS = [
  { e: '🦊', bg: '#e21b3c' }, { e: '🐼', bg: '#1368ce' }, { e: '🐸', bg: '#26890c' }, { e: '🦄', bg: '#d89e00' },
  { e: '🐙', bg: '#864cbf' }, { e: '🤖', bg: '#008299' }, { e: '👽', bg: '#26890c' }, { e: '🐯', bg: '#d89e00' },
  { e: '🐧', bg: '#1368ce' }, { e: '🦖', bg: '#26890c' }, { e: '🐝', bg: '#d89e00' }, { e: '🦉', bg: '#46178f' },
  { e: '🐳', bg: '#008299' }, { e: '🦁', bg: '#e21b3c' }, { e: '🐨', bg: '#333333' }, { e: '🚀', bg: '#e21b3c' }
];

const COLORS = {
  green:  { key: 'green',  name: 'สีเขียว', level: 'ง่าย',     points: 100, bg: '#26890c', dark: '#195c07', light: '#dcfce7', text: '#ffffff', emoji: '■', shape: '■', prefix: 'G' },
  yellow: { key: 'yellow', name: 'สีเหลือง', level: 'ปานกลาง', points: 200, bg: '#d89e00', dark: '#9c7200', light: '#fef9c3', text: '#ffffff', emoji: '●', shape: '●', prefix: 'Y' },
  red:    { key: 'red',    name: 'สีแดง',   level: 'ยาก',      points: 350, bg: '#e21b3c', dark: '#9c1128', light: '#fee2e2', text: '#ffffff', emoji: '▲', shape: '▲', prefix: 'R' }
};

/* ไอเทม 9 ชนิด สไตล์บล็อกสี Kahoot! */
const ITEMS = {
  x2:     { key: 'x2',     name: 'คูณสอง',     shape: '●', emoji: '⚡', color: '#d89e00', dark: '#9c7200', desc: 'ตอบถูกข้อถัดไปได้คะแนน 2 เท่า' },
  shield: { key: 'shield', name: 'โล่ป้องกัน', shape: '◆', emoji: '🛡️', color: '#1368ce', dark: '#0c478f', desc: 'ป้องกันการโจมตีทุกชนิด 1 ครั้ง (ทำงานอัตโนมัติ)' },
  steal:  { key: 'steal',  name: 'ขโมยแต้ม',   shape: '■', emoji: '💰', color: '#26890c', dark: '#195c07', desc: 'เลือกเพื่อน 1 คน ขโมยมา 100 แต้ม' },
  freeze: { key: 'freeze', name: 'แช่แข็ง',    shape: '▲', emoji: '❄️', color: '#e21b3c', dark: '#9c1128', desc: 'ล็อกหน้าจอเพื่อน 1 คน ต้องทุบน้ำแข็ง 5 ครั้ง' },
  blind:  { key: 'blind',  name: 'ระเบิดหมอก', shape: '◆', emoji: '💨', color: '#864cbf', dark: '#5e328a', desc: 'พ่นหมอกควันบังจอเพื่อน 1 คน ต้องเช็ดจอ 6 ครั้ง' },
  flip:   { key: 'flip',   name: 'จอตีลังกา',  shape: '●', emoji: '🙃', color: '#e05a00', dark: '#9e3f00', desc: 'ส่งไวรัสกลับหัวหน้าจอเพื่อน 180° ต้องกดซ่อม 4 ครั้ง' },
  zap:    { key: 'zap',    name: 'สายฟ้าฟาด',  shape: '▲', emoji: '🌩️', color: '#008299', dark: '#005969', desc: 'ผ่าสายฟ้าใส่เพื่อน ลดแต้ม 150 แต้ม + เราได้ 50 แต้ม' },
  boost:  { key: 'boost',  name: 'น้ำยาวิทย์', shape: '■', emoji: '🧪', color: '#198038', dark: '#0f5223', desc: 'รับฟรี +120 แต้มทันที แถมส่องคำสำคัญของโจทย์!' },
  selfie: { key: 'selfie', name: 'แชะหน้าตลก', shape: '▲', emoji: '📸', color: '#c026d3', dark: '#86198f', desc: 'บังคับเพื่อนถ่ายรูปหน้าตลกขึ้นจอใหญ่ครู! ต้องรอครูอนุมัติถึงเล่นต่อได้' }
};
const ITEM_KEYS = Object.keys(ITEMS);

const TONES = {
  sky: '#1368ce', green: '#26890c', yellow: '#d89e00', red: '#e21b3c', violet: '#46178f', amber: '#d89e00',
  emerald: '#26890c', cyan: '#008299', blue: '#1368ce', fuchsia: '#e21b3c', slate: '#333333'
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function rand(n) { return Math.floor(Math.random() * n); }
function refreshIcons() { if (window.lucide) lucide.createIcons(); }

function baseUrl() {
  const cfg = window.SQA_CONFIG || {};
  if (cfg.publicBaseUrl) return cfg.publicBaseUrl.endsWith('/') ? cfg.publicBaseUrl : cfg.publicBaseUrl + '/';
  return location.href.split(/[?#]/)[0].replace(/[^/]*$/, '');
}

function normCode(s) {
  const m = String(s || '').toUpperCase().match(/([GYR])\s*-?\s*0*(\d{1,2})/);
  return m ? m[1] + m[2].padStart(2, '0') : null;
}
function prettyCode(c) { return c ? c[0] + '-' + c.slice(1) : ''; }

function avatarHtml(i, size = 48, extra = '') {
  const a = AVATARS[i] || AVATARS[0];
  return `<div class="avatar ${extra}" style="width:${size}px;height:${size}px;background:${a.bg};font-size:${Math.round(size * 0.58)}px">${a.e}</div>`;
}

function feedView(e) {
  const A = `<b>${esc(e.a || '')}</b>`, B = `<b>${esc(e.b || '')}</b>`;
  const it = ITEMS[e.item] || {};
  switch (e.type) {
    case 'join': return { emoji: '◆', tone: 'sky', html: `${A} เข้าร่วมเกมแล้ว!` };
    case 'score': {
      const c = COLORS[e.color] || COLORS.green;
      return { emoji: c.shape, tone: e.color, html: `${A} ตอบการ์ด${c.name} <b>+${e.pts}</b>${e.doubled ? ' <span class="x2tag">x2!</span>' : ''} <span class="opacity-70">(${e.acc}%)</span>` };
    }
    case 'item': return { emoji: '🎁', tone: 'amber', html: `${A} ได้รับ ${it.emoji} <b>${it.name}</b>` };
    case 'bonusWin': return { emoji: '★', tone: 'amber', html: `${A} ผ่านโบนัส! ได้ ${it.emoji} <b>${it.name}</b>` };
    case 'x2': return { emoji: '⚡', tone: 'amber', html: `${A} เปิดใช้ <b>คูณสอง (x2)</b>!` };
    case 'steal': return { emoji: '💰', tone: 'emerald', html: `${A} ขโมย <b>${e.pts}</b> แต้มจาก ${B}!`, attack: true };
    case 'freeze': return { emoji: '❄️', tone: 'red', html: `${A} แช่แข็งหน้าจอของ ${B}!`, attack: true };
    case 'blind': return { emoji: '💨', tone: 'violet', html: `${A} ปาระเบิดหมอกควันบังจอของ ${B}!`, attack: true };
    case 'unblind': return { emoji: '🧽', tone: 'sky', html: `${A} เช็ดหมอกควันออกจากจอแล้ว!` };
    case 'flip': return { emoji: '🙃', tone: 'amber', html: `${A} ส่งไวรัสจอตีลังกา 180° ใส่ ${B}!`, attack: true };
    case 'unflip': return { emoji: '🔧', tone: 'sky', html: `${A} ซ่อมหน้าจอกลับมาตั้งตรงแล้ว!` };
    case 'zap': return { emoji: '🌩️', tone: 'cyan', html: `${A} ปล่อยสายฟ้าฟาด ${B} <b>-${e.pts}</b> แต้ม!`, attack: true };
    case 'boost': return { emoji: '🧪', tone: 'emerald', html: `${A} ดื่มน้ำยาวิทย์ <b>+${e.pts}</b> แต้ม & ส่องคำใบ้!` };
    case 'selfie': return { emoji: '📸', tone: 'fuchsia', html: `${A} สั่ง ${B} <b>ถ่ายรูปหน้าตลก</b> ส่งให้ครูตรวจ!`, attack: true };
    case 'selfieSent': return { emoji: '🤪', tone: 'fuchsia', html: `${A} ส่งรูปหน้าตลกขึ้นจอใหญ่แล้ว! <b>รอครูกดอนุญาต</b>`, attack: true };
    case 'selfieApproved': return { emoji: '✅', tone: 'green', html: `ครูอนุมัติรูปหน้าตลกของ ${A} ให้เล่นต่อได้!` };
    case 'selfieRejected': return { emoji: '🔁', tone: 'red', html: `ครูสั่งให้ ${A} ถ่ายรูปหน้าตลกใหม่ (ยังไม่ฮาพอ!)` };
    case 'giftAll': return { emoji: '🎁', tone: 'amber', html: `<b>ครูแจกไอเทมสุ่มให้ทุกคนในห้องแล้ว!</b>` };
    case 'block': {
      const atkLabel = { steal: 'การขโมย', freeze: 'พายุน้ำแข็ง', blind: 'ระเบิดหมอก', flip: 'ไวรัสกลับหัว', zap: 'สายฟ้าฟาด', selfie: 'กล้องแชะหน้าตลก' }[e.kind] || 'การโจมตี';
      return { emoji: '🛡️', tone: 'blue', html: `${B} ใช้โล่กัน${atkLabel}ของ ${A}!`, attack: true };
    }
    case 'unfreeze': return { emoji: '🔨', tone: 'sky', html: `${A} ทุบน้ำแข็งแตกแล้ว!` };
    case 'bonus': return { emoji: '🎁', tone: 'fuchsia', html: `<b>ปล่อยคำถามโบนัส!</b> ตอบผ่านรับกล่องสุ่ม` };
    default: return { emoji: '▲', tone: 'slate', html: esc(e.text || '') };
  }
}

function toast(msg, kind = 'info', ms = 2600) {
  let box = document.getElementById('toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
  const colors = { info: '#333333', success: '#26890c', error: '#e21b3c', warn: '#d89e00', ice: '#1368ce' };
  const t = document.createElement('div');
  t.className = 'toast pop-in';
  t.style.background = colors[kind] || colors.info;
  t.innerHTML = msg;
  box.appendChild(t);
  setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 300); }, ms);
}

function bump(el, cls = 'bump') {
  if (!el) return;
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
}

function confetti(ms = 3000, count = 160) {
  const cv = document.createElement('canvas');
  cv.className = 'confetti-canvas';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  const W = cv.width = innerWidth, H = cv.height = innerHeight;
  const cols = ['#e21b3c', '#1368ce', '#d89e00', '#26890c', '#ffffff'];
  const ps = Array.from({ length: count }, () => ({
    x: W / 2 + (Math.random() - .5) * W * .4, y: H * .3,
    vx: (Math.random() - .5) * 20, vy: -Math.random() * 18 - 6,
    s: 8 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .4,
    c: cols[rand(cols.length)]
  }));
  const t0 = performance.now();
  (function frame(t) {
    ctx.clearRect(0, 0, W, H);
    ps.forEach(p => {
      p.vy += .45; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    });
    if (t - t0 < ms) requestAnimationFrame(frame); else cv.remove();
  })(t0);
}

function modeLabel() {
  const m = (window.SQA_CONFIG || {}).backend || 'cloud';
  return { cloud: '🌐 CLOUD LIVE', local: 'LOCAL MODE', firebase: 'FIREBASE LIVE', supabase: 'SUPABASE LIVE' }[m] || m;
}

function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function syncFullscreenButtons() {
  const on = isFullscreen();
  document.querySelectorAll('[data-fullscreen-btn]').forEach(btn => {
    const label = btn.querySelector('[data-fs-text]');
    const icon = btn.querySelector('[data-fs-icon]');
    if (icon) icon.textContent = on ? '🗗' : '⛶';
    if (label) label.textContent = on ? 'ออกเต็มจอ' : 'เต็มจอ';
    else if (!icon) btn.textContent = on ? '🗗 ออกเต็มจอ' : '⛶ เต็มจอ';
    btn.title = on ? 'ออกจากโหมดเต็มจอ (Esc)' : 'เปิดโหมดเต็มจอ';
  });
}

async function toggleFullscreen() {
  try {
    if (!isFullscreen()) {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  } catch (e) {
    toast('เบราว์เซอร์นี้ไม่รองรับโหมดเต็มจออัตโนมัติ (กด F11 แทนได้)', 'warn');
  }
  syncFullscreenButtons();
}

function initFullscreenButtons() {
  document.querySelectorAll('[data-fullscreen-btn]').forEach(btn => {
    if (btn.dataset.fsBound) return;
    btn.dataset.fsBound = '1';
    btn.addEventListener('click', () => {
      if (window.SFX) SFX.click();
      toggleFullscreen();
    });
  });
  document.addEventListener('fullscreenchange', syncFullscreenButtons);
  document.addEventListener('webkitfullscreenchange', syncFullscreenButtons);
  syncFullscreenButtons();
}
document.addEventListener('DOMContentLoaded', initFullscreenButtons);

/* สร้างภาพหน้าตลกการ์ตูนบน Canvas (สำหรับบอท หรือเครื่องที่ไม่มีกล้องเว็บแคม) */
function makeFunnyFaceDataUrl(name = 'Player', avIdx = 0) {
  const cv = document.createElement('canvas');
  cv.width = 360; cv.height = 360;
  const c = cv.getContext('2d');
  const av = AVATARS[avIdx] || AVATARS[0];
  const bgs = ['#c026d3', '#e21b3c', '#1368ce', '#d89e00', '#26890c'];
  c.fillStyle = bgs[rand(bgs.length)];
  c.fillRect(0, 0, 360, 360);
  // ลายเส้นแฉกเกมโชว์
  c.fillStyle = 'rgba(255,255,255,0.14)';
  for (let i = 0; i < 12; i++) {
    c.beginPath();
    c.moveTo(180, 180);
    c.arc(180, 180, 260, (i * Math.PI) / 6, (i * Math.PI) / 6 + 0.25);
    c.closePath();
    c.fill();
  }
  const faces = ['🤪', '😜', '🤡', '👻', '🐵', '🐸', '👽', '🤓'];
  c.font = '150px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(faces[rand(faces.length)], 180, 155);
  c.font = '68px sans-serif';
  c.fillText(av.e, 285, 95);
  c.fillText('📸', 75, 95);
  c.fillStyle = '#333333';
  c.fillRect(20, 278, 320, 58);
  c.fillStyle = '#ffa602';
  c.font = 'bold 26px Kanit, sans-serif';
  c.fillText(`หน้าตลกของ ${name}!`, 180, 308);
  return cv.toDataURL('image/jpeg', 0.7);
}

/* จัดรูปแบบเวลา MM:SS */
function formatClock(ms) {
  const totalSec = Math.max(0, Math.ceil((ms || 0) / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ตรวจจับเบราว์เซอร์ในแอป LINE / Facebook / Instagram ที่มักบล็อกกล้อง */
function isLineBrowser() {
  return /\bLine\//i.test(navigator.userAgent || '');
}
function isInAppBrowser() {
  return /\b(Line\/|FBAN|FBAV|Instagram|KAKAOTALK|MicroMessenger)/i.test(navigator.userAgent || '');
}
function withExternalBrowser(rawUrl) {
  try {
    const u = new URL(rawUrl, location.href);
    u.searchParams.set('openExternalBrowser', '1');
    return u.toString();
  } catch (e) {
    return rawUrl + (rawUrl.includes('?') ? '&' : '?') + 'openExternalBrowser=1';
  }
}
