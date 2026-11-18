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

/* ไอเทม 4 ชนิด จับคู่กับบล็อกสี 4 สีของ Kahoot! (● เหลือง, ◆ น้ำเงิน, ■ เขียว, ▲ แดง) */
const ITEMS = {
  x2:     { key: 'x2',     name: 'คูณสอง',     shape: '●', emoji: '⚡', color: '#d89e00', dark: '#9c7200', desc: 'ตอบถูกข้อถัดไปได้คะแนน 2 เท่า' },
  shield: { key: 'shield', name: 'โล่ป้องกัน', shape: '◆', emoji: '🛡️', color: '#1368ce', dark: '#0c478f', desc: 'ป้องกันการโจมตีจากเพื่อน 1 ครั้ง (ทำงานอัตโนมัติ)' },
  steal:  { key: 'steal',  name: 'ขโมยแต้ม',   shape: '■', emoji: '💰', color: '#26890c', dark: '#195c07', desc: 'เลือกเพื่อน 1 คน ขโมยมา 100 แต้ม' },
  freeze: { key: 'freeze', name: 'แช่แข็ง',    shape: '▲', emoji: '❄️', color: '#e21b3c', dark: '#9c1128', desc: 'ล็อกหน้าจอเพื่อน 1 คน ต้องทุบน้ำแข็ง 5 ครั้ง' }
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
    case 'block': return { emoji: '🛡️', tone: 'blue', html: `${B} ใช้โล่กัน${e.kind === 'steal' ? 'การขโมย' : 'น้ำแข็ง'}ของ ${A}!`, attack: true };
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
