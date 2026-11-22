/* Sci-Quest! — ค่าคงที่และ helper ของ UI สไตล์ Kahoot! (Custom Vector Art Edition) */
const AVATARS = [
  { name: 'จิ้งจอกวิทย์', bg: '#e21b3c' },
  { name: 'แพนด้าแล็บ', bg: '#1368ce' },
  { name: 'กบนักคิด', bg: '#26890c' },
  { name: 'ยูนิคอร์น', bg: '#d89e00' },
  { name: 'หมึกอัจฉริยะ', bg: '#7c3aed' },
  { name: 'หุ่นยนต์เอไอ', bg: '#0284c7' },
  { name: 'เอเลี่ยนจิ๋ว', bg: '#16a34a' },
  { name: 'เสือน้อย', bg: '#ea580c' },
  { name: 'เพนกวิน', bg: '#2563eb' },
  { name: 'ไดโนเสาร์', bg: '#15803d' },
  { name: 'ผึ้งขยัน', bg: '#ca8a04' },
  { name: 'นกฮูกอาจารย์', bg: '#5b21b6' },
  { name: 'วาฬน้ำลึก', bg: '#0369a1' },
  { name: 'สิงโตเจ้าป่า', bg: '#dc2626' },
  { name: 'โคอาล่าชิล', bg: '#475569' },
  { name: 'จรวดอวกาศ', bg: '#be123c' }
];

const COLORS = {
  green:  { key: 'green',  name: 'สีเขียว', level: 'ง่าย',     points: 100, bg: '#26890c', dark: '#195c07', light: '#dcfce7', text: '#ffffff', emoji: '■', shape: '■', prefix: 'G' },
  yellow: { key: 'yellow', name: 'สีเหลือง', level: 'ปานกลาง', points: 200, bg: '#d89e00', dark: '#9c7200', light: '#fef9c3', text: '#ffffff', emoji: '●', shape: '●', prefix: 'Y' },
  red:    { key: 'red',    name: 'สีแดง',   level: 'ยาก',      points: 350, bg: '#e21b3c', dark: '#9c1128', light: '#fee2e2', text: '#ffffff', emoji: '▲', shape: '▲', prefix: 'R' }
};

/* ไอเทม 9 ชนิด สไตล์บล็อกสี Kahoot! */
const ITEMS = {
  x2:     { key: 'x2',     name: 'คูณสอง',     shape: '●', color: '#d89e00', dark: '#9c7200', desc: 'ตอบถูกข้อถัดไปได้คะแนน 2 เท่า' },
  shield: { key: 'shield', name: 'โล่ป้องกัน', shape: '◆', color: '#1368ce', dark: '#0c478f', desc: 'ป้องกันการโจมตีทุกชนิด 1 ครั้ง (ทำงานอัตโนมัติ)' },
  steal:  { key: 'steal',  name: 'ขโมยแต้ม',   shape: '■', color: '#26890c', dark: '#195c07', desc: 'เลือกเพื่อน 1 คน ขโมยมา 100 แต้ม' },
  freeze: { key: 'freeze', name: 'แช่แข็ง',    shape: '▲', color: '#e21b3c', dark: '#9c1128', desc: 'ล็อกหน้าจอเพื่อน 1 คน ต้องทุบน้ำแข็ง 5 ครั้ง' },
  blind:  { key: 'blind',  name: 'ระเบิดหมอก', shape: '◆', color: '#864cbf', dark: '#5e328a', desc: 'พ่นหมอกควันบังจอเพื่อน 1 คน ต้องเช็ดจอ 6 ครั้ง' },
  flip:   { key: 'flip',   name: 'จอตีลังกา',  shape: '●', color: '#e05a00', dark: '#9e3f00', desc: 'ส่งไวรัสกลับหัวหน้าจอเพื่อน 180° ต้องกดซ่อม 4 ครั้ง' },
  zap:    { key: 'zap',    name: 'สายฟ้าฟาด',  shape: '▲', color: '#008299', dark: '#005969', desc: 'ผ่าสายฟ้าใส่เพื่อน ลดแต้ม 150 แต้ม + เราได้ 50 แต้ม' },
  boost:  { key: 'boost',  name: 'น้ำยาวิทย์', shape: '■', color: '#198038', dark: '#0f5223', desc: 'รับฟรี +120 แต้มทันที แถมส่องคำสำคัญของโจทย์!' },
  selfie: { key: 'selfie', name: 'แชะหน้าตลก', shape: '▲', color: '#c026d3', dark: '#86198f', desc: 'บังคับเพื่อนถ่ายรูปหน้าตลกขึ้นจอใหญ่ครู! ต้องรอครูอนุมัติถึงเล่นต่อได้' }
};
const ITEM_KEYS = Object.keys(ITEMS);

/* บอสคำถามยักษ์ประจำห้อง 4 ตัว (Co-Op Raid Bosses จับคู่กับภาพยนตร์วิทย์ 4 เรื่อง) */
const BOSSES = {
  dr_glitch: {
    key: 'dr_glitch',
    name: 'Dr. Glitch AI',
    title: 'จอมหลอนข้อมูล',
    film: 'f1',
    color: '#e21b3c',
    dark: '#881337',
    accent: '#f472b6',
    tagline: 'แต่งข้อมูลปลอมขั้นเทพ! ช่วยกันตอบคำถามจับผิด AI ปราบมัน!'
  },
  mirage_queen: {
    key: 'mirage_queen',
    name: 'Phantom Mirage',
    title: 'ราชินีมายาดิจิทัล',
    film: 'f2',
    color: '#1368ce',
    dark: '#1e3a8a',
    accent: '#38bdf8',
    tagline: 'สร้างภาพลวงตาบนโซเชียล! รวมพลังทั้งห้องเปิดโปงความจริง!'
  },
  echo_colossus: {
    key: 'echo_colossus',
    name: 'Echo Heart',
    title: 'จักรกลหัวใจจำลอง',
    film: 'f3',
    color: '#d89e00',
    dark: '#92400e',
    accent: '#fb7185',
    tagline: 'เลียนแบบหัวใจมนุษย์ได้แนบเนียน! ตอบคำถามสยบพลังจักรกล!'
  },
  decibel_titan: {
    key: 'decibel_titan',
    name: 'Decibel Titan',
    title: 'ไททันคลื่นเสียงคลั่ง',
    film: 'f4',
    color: '#26890c',
    dark: '#14532d',
    accent: '#4ade80',
    tagline: 'ปล่อยคลื่นเสียงสนั่นห้อง! ช่วยกันตอบความรู้คลื่นเสียงหยุดมัน!'
  }
};
const BOSS_KEYS = Object.keys(BOSSES);

const TONES = {
  sky: '#1368ce', green: '#26890c', yellow: '#d89e00', red: '#e21b3c', violet: '#46178f', amber: '#d89e00',
  emerald: '#26890c', cyan: '#008299', blue: '#1368ce', fuchsia: '#c026d3', slate: '#333333'
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

/* ---------- Custom Vector Helpers ---------- */
function itemIconHtml(key, size = 22, cls = '') {
  return window.SQA_ART ? SQA_ART.itemSvg(key, size, cls) : '';
}
function filmIconHtml(key, size = 22, cls = '') {
  return window.SQA_ART ? SQA_ART.filmSvg(key, size, cls) : '';
}
function heroIconHtml(name, size = 48, cls = '') {
  return window.SQA_ART ? SQA_ART.heroSvg(name, size, cls) : '';
}
function uiIconHtml(name, size = 16, cls = '') {
  return window.SQA_ART ? SQA_ART.uiSvg(name, size, cls) : '';
}
function bossArtHtml(key, width = 190, cls = '') {
  return window.SQA_ART ? SQA_ART.bossSvg(key, width, cls) : '';
}

function avatarHtml(i, size = 48, extra = '') {
  const idx = (i >= 0 && i < AVATARS.length) ? i : 0;
  const a = AVATARS[idx];
  const inner = window.SQA_ART ? SQA_ART.avatarSvg(idx, Math.round(size * 0.88)) : esc(a.name.slice(0, 1));
  return `<div class="avatar ${extra}" style="width:${size}px;height:${size}px;background:${a.bg}" title="${esc(a.name)}">${inner}</div>`;
}

function hydrateStaticIcons() {
  if (!window.SQA_ART) return;
  document.querySelectorAll('[data-art-ui]').forEach(el => {
    const name = el.dataset.artUi;
    const sz = Number(el.dataset.artSize) || 16;
    el.innerHTML = SQA_ART.uiSvg(name, sz);
  });
  document.querySelectorAll('[data-art-hero]').forEach(el => {
    const name = el.dataset.artHero;
    const sz = Number(el.dataset.artSize) || 48;
    el.innerHTML = SQA_ART.heroSvg(name, sz);
  });
  document.querySelectorAll('[data-art-item]').forEach(el => {
    const key = el.dataset.artItem;
    const sz = Number(el.dataset.artSize) || 22;
    el.innerHTML = SQA_ART.itemSvg(key, sz);
  });
  document.querySelectorAll('[data-art-film]').forEach(el => {
    const key = el.dataset.artFilm;
    const sz = Number(el.dataset.artSize) || 22;
    el.innerHTML = SQA_ART.filmSvg(key, sz);
  });
  document.querySelectorAll('[data-art-smoke]').forEach(el => {
    const variant = Number(el.dataset.artSmoke) || 0;
    const sz = Number(el.dataset.artSize) || 136;
    el.innerHTML = SQA_ART.smokeSvg(variant, sz);
  });
  document.querySelectorAll('[data-art-boss]').forEach(el => {
    const key = el.dataset.artBoss;
    const sz = Number(el.dataset.artSize) || 190;
    el.innerHTML = SQA_ART.bossSvg(key, sz);
  });
}
document.addEventListener('DOMContentLoaded', hydrateStaticIcons);

function feedView(e) {
  const A = `<b>${esc(e.a || '')}</b>`, B = `<b>${esc(e.b || '')}</b>`;
  const it = ITEMS[e.item] || {};
  const inlineIt = e.item ? `<span class="sqa-ico mr-0.5">${itemIconHtml(e.item, 17)}</span>` : '';
  switch (e.type) {
    case 'join': return { emoji: uiIconHtml('users', 15), tone: 'sky', html: `${A} เข้าร่วมเกมแล้ว!` };
    case 'score': {
      const c = COLORS[e.color] || COLORS.green;
      return { emoji: `<span class="font-black text-xs leading-none">${c.shape}</span>`, tone: e.color, html: `${A} ตอบการ์ด${c.name} <b>+${e.pts}</b>${e.doubled ? ' <span class="x2tag">x2!</span>' : ''} <span class="opacity-70">(${e.acc}%)</span>` };
    }
    case 'item': return { emoji: heroIconHtml('giftBox', 19), tone: 'amber', html: `${A} ได้รับ ${inlineIt}<b>${esc(it.name || '')}</b>` };
    case 'bonusWin': return { emoji: uiIconHtml('star', 15), tone: 'amber', html: `${A} ผ่านโบนัส! ได้ ${inlineIt}<b>${esc(it.name || '')}</b>` };
    case 'x2': return { emoji: itemIconHtml('x2', 19), tone: 'amber', html: `${A} เปิดใช้ <b>คูณสอง (x2)</b>!` };
    case 'steal': return { emoji: itemIconHtml('steal', 19), tone: 'emerald', html: `${A} ขโมย <b>${e.pts}</b> แต้มจาก ${B}!`, attack: true };
    case 'freeze': return { emoji: itemIconHtml('freeze', 19), tone: 'red', html: `${A} แช่แข็งหน้าจอของ ${B}!`, attack: true };
    case 'blind': return { emoji: itemIconHtml('blind', 19), tone: 'violet', html: `${A} ปาระเบิดหมอกควันบังจอของ ${B}!`, attack: true };
    case 'unblind': return { emoji: heroIconHtml('sponge', 19), tone: 'sky', html: `${A} เช็ดหมอกควันออกจากจอแล้ว!` };
    case 'flip': return { emoji: itemIconHtml('flip', 19), tone: 'amber', html: `${A} ส่งไวรัสจอตีลังกา 180° ใส่ ${B}!`, attack: true };
    case 'unflip': return { emoji: uiIconHtml('wrench', 14), tone: 'sky', html: `${A} ซ่อมหน้าจอกลับมาตั้งตรงแล้ว!` };
    case 'zap': return { emoji: itemIconHtml('zap', 19), tone: 'cyan', html: `${A} ปล่อยสายฟ้าฟาด ${B} <b>-${e.pts}</b> แต้ม!`, attack: true };
    case 'boost': return { emoji: itemIconHtml('boost', 19), tone: 'emerald', html: `${A} ดื่มน้ำยาวิทย์ <b>+${e.pts}</b> แต้ม & ส่องคำใบ้!` };
    case 'selfie': return { emoji: itemIconHtml('selfie', 19), tone: 'fuchsia', html: `${A} สั่ง ${B} <b>ถ่ายรูปหน้าตลก</b> ส่งให้ครูตรวจ!`, attack: true };
    case 'selfieSent': return { emoji: heroIconHtml('funnyFace', 19), tone: 'fuchsia', html: `${A} ส่งรูปหน้าตลกขึ้นจอใหญ่แล้ว! <b>รอครูกดอนุญาต</b>`, attack: true };
    case 'selfieApproved': return { emoji: uiIconHtml('check', 15), tone: 'green', html: `ครูอนุมัติรูปหน้าตลกของ ${A} ให้เล่นต่อได้!` };
    case 'selfieRejected': return { emoji: uiIconHtml('refresh', 14), tone: 'red', html: `ครูสั่งให้ ${A} ถ่ายรูปหน้าตลกใหม่ (ยังไม่ฮาพอ!)` };
    case 'giftAll': return { emoji: heroIconHtml('giftBox', 19), tone: 'amber', html: `<b>ครูแจกไอเทมสุ่มให้ทุกคนในห้องแล้ว!</b>` };
    case 'fever': return { emoji: heroIconHtml('feverBolt', 19), tone: 'red', html: `<b>FEVER TIME x2!</b> คะแนนคูณสองทั้งห้อง ${e.sec || 60} วินาที!` };
    case 'underdog': return { emoji: heroIconHtml('rocketBoost', 19), tone: 'green', html: `<b>พลังฮึดท้ายตาราง!</b> แจก +150 แต้ม + ไอเทมโจมตีให้ ${e.count || 0} คนท้ายตาราง!` };
    case 'freezeTop': return { emoji: itemIconHtml('freeze', 19), tone: 'cyan', html: `<b>พายุแช่แข็งจ่าฝูง!</b> แช่แข็ง Top 3 บนกระดานคะแนน!` };
    case 'streak': return { emoji: heroIconHtml('flame', 19), tone: 'amber', html: `${A} <b>ไฟลุก! คอมโบ ${e.streak} ข้อติด</b> (+${e.bonus || 0} โบนัส!)` };
    case 'block': {
      const atkLabel = { steal: 'การขโมย', freeze: 'พายุน้ำแข็ง', blind: 'ระเบิดหมอก', flip: 'ไวรัสกลับหัว', zap: 'สายฟ้าฟาด', selfie: 'กล้องแชะหน้าตลก' }[e.kind] || 'การโจมตี';
      return { emoji: itemIconHtml('shield', 19), tone: 'blue', html: `${B} ใช้โล่กัน${atkLabel}ของ ${A}!`, attack: true };
    }
    case 'unfreeze': return { emoji: heroIconHtml('hammer', 19), tone: 'sky', html: `${A} ทุบน้ำแข็งแตกแล้ว!` };
    case 'bonus': return { emoji: heroIconHtml('giftBox', 19), tone: 'fuchsia', html: `<b>ปล่อยคำถามโบนัส!</b> ตอบผ่านรับกล่องสุ่ม` };
    case 'bossStart': {
      const bs = BOSSES[e.bossKey] || BOSSES.dr_glitch;
      return { emoji: heroIconHtml('bossRaid', 19), tone: 'red', html: `<b>บอสปรากฏตัว! ${esc(bs.name)}</b> (HP ${Number(e.maxHp || 0).toLocaleString()}) ช่วยกันตีด่วน!` };
    }
    case 'bossHit': return { emoji: heroIconHtml('swordHit', 19), tone: e.crit ? 'amber' : 'fuchsia', html: `${A} โจมตีบอส <b>-${e.dmg} HP</b>${e.crit ? ' <span class="x2tag">CRIT!</span>' : ''}` };
    case 'bossWin': {
      const bs = BOSSES[e.bossKey] || BOSSES.dr_glitch;
      return { emoji: heroIconHtml('trophy', 19), tone: 'green', html: `<b>ปราบ ${esc(bs.name)} สำเร็จ!</b> ทั้งห้องรับ <b>+${e.coopReward || 300}</b> แต้ม!${e.mvpName ? ` MVP: <b>${esc(e.mvpName)}</b>` : ''}` };
    }
    case 'bossFail': {
      const bs = BOSSES[e.bossKey] || BOSSES.dr_glitch;
      return { emoji: heroIconHtml('bossRaid', 19), tone: 'slate', html: `<b>หมดเวลา Raid!</b> ${esc(bs.name)} หนีไปได้ (รับปลอบใจ +50 แต้มทุกคนที่ร่วมสู้)` };
    }
    default: return { emoji: uiIconHtml('sparkles', 14), tone: 'slate', html: esc(e.text || '') };
  }
}

function toast(msg, kind = 'info', ms = 2600) {
  let box = document.getElementById('toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
  const colors = { info: '#333333', success: '#26890c', error: '#e21b3c', warn: '#d89e00', ice: '#1368ce' };
  const t = document.createElement('div');
  t.className = 'toast pop-in flex items-center justify-center gap-2';
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
  const cols = ['#e21b3c', '#1368ce', '#d89e00', '#26890c', '#ffffff', '#facc15'];
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
  return { cloud: 'CLOUD LIVE', local: 'LOCAL MODE', firebase: 'FIREBASE LIVE', supabase: 'SUPABASE LIVE' }[m] || m;
}
function modeBadgeHtml() {
  return `<span class="inline-flex items-center gap-1.5">${uiIconHtml('globe', 13)}<span>${esc(modeLabel())}</span></span>`;
}

function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function syncFullscreenButtons() {
  const on = isFullscreen();
  const icoHtml = uiIconHtml(on ? 'exitFullscreen' : 'fullscreen', 15);
  document.querySelectorAll('[data-fullscreen-btn]').forEach(btn => {
    const label = btn.querySelector('[data-fs-text]');
    const icon = btn.querySelector('[data-fs-icon]');
    if (icon) icon.innerHTML = icoHtml;
    if (label) label.textContent = on ? 'ออกเต็มจอ' : 'เต็มจอ';
    else if (!icon) btn.innerHTML = `<span class="inline-flex items-center gap-1">${icoHtml}<span>${on ? 'ออกเต็มจอ' : 'เต็มจอ'}</span></span>`;
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
function speakerIconName() {
  if (!window.SFX || SFX.muted || SFX.volumePct <= 0) return 'speakerOff';
  return SFX.volumePct < 50 ? 'speakerLow' : 'speakerOn';
}

function ensureAudioMixerModal() {
  let modal = document.getElementById('audioMixerModal');
  if (modal) return modal;
  const rows = [
    { ch: 'master', title: 'เสียงรวมทั้งหมด (Master)', sub: 'ควบคุมความดังรวมทุกช่อง', color: '#46178f', icon: 'speakerOn' },
    { ch: 'bgm',    title: 'เพลงประกอบ (BGM)',        sub: 'เพลงฉากหลัก / โบนัส / โพเดียม', color: '#1368ce', icon: 'music' },
    { ch: 'sfx',    title: 'เสียงเอฟเฟกต์ (SFX)',      sub: 'ปุ่มกด / ตอบถูก / ไอเทมป่วนเพื่อน', color: '#26890c', icon: 'bolt' },
    { ch: 'voice',  title: 'เสียงพากย์พิธีกร (Voice)', sub: 'เสียงพากย์สดบรรยายจังหวะสำคัญ', color: '#c026d3', icon: 'mic' }
  ];
  const trackCards = (window.SFX && SFX.tracks ? SFX.tracks : []).map(t => `
    <button type="button" data-bgm-pick="${t.id}" class="text-left p-2 rounded-[6px] border-2 border-neutral-200 bg-white hover:border-[#46178f] transition flex items-center gap-2 min-w-0">
      <span class="w-7 h-7 rounded-[5px] text-white grid place-items-center shrink-0 shadow-[0_2px_0_rgba(0,0,0,0.22)]" style="background:${t.color}">${uiIconHtml('music', 13)}</span>
      <div class="min-w-0">
        <div class="font-display font-extrabold text-[11px] text-[#333] leading-tight truncate">${esc(t.name)}</div>
        <div class="text-[10px] font-bold text-neutral-500 truncate">${esc(t.tag)} • ${esc(t.bpm)}</div>
      </div>
    </button>
  `).join('');

  modal = document.createElement('div');
  modal.id = 'audioMixerModal';
  modal.className = 'overlay dim z-[240] hidden overflow-y-auto';
  modal.innerHTML = `
    <div class="k-box max-w-md w-full p-4 sm:p-5 pop-in border-t-8 border-[#ffa602] my-auto max-h-[92vh] overflow-y-auto">
      <div class="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b-2 border-neutral-200">
        <div class="flex items-center gap-2.5">
          <span class="w-10 h-10 rounded-[8px] bg-[#46178f] text-[#ffa602] grid place-items-center shadow-[0_3px_0_#25076b]">${uiIconHtml('sliders', 20)}</span>
          <div>
            <h3 class="font-display text-lg sm:text-xl font-black text-[#333] leading-tight">ปรับเสียง & เลือกเพลงประกอบ</h3>
            <p class="text-[11px] font-bold text-neutral-500">ปรับความดังแยก 4 ช่อง และเปลี่ยนสไตล์เพลงได้ 6 แนว</p>
          </div>
        </div>
        <button type="button" data-mixer-close class="btn-3d k-btn-dark w-9 h-9 grid place-items-center text-sm shrink-0">✕</button>
      </div>

      <!-- เลือกเพลงประกอบ 6 สไตล์ -->
      <div class="mb-3 p-2.5 rounded-[8px] bg-neutral-100 border-2 border-neutral-200">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-extrabold uppercase text-[#333] inline-flex items-center gap-1.5">
            ${uiIconHtml('music', 14, 'text-[#46178f]')}<span>สไตล์เพลงประกอบ (6 เพลง)</span>
          </span>
          <span data-bgm-cur-name class="text-[11px] font-black text-[#46178f]"></span>
        </div>
        <div class="grid grid-cols-2 gap-1.5">${trackCards}</div>
      </div>

      <div class="space-y-2.5">
        ${rows.map(r => `
          <div class="rounded-[8px] bg-neutral-100 border-2 border-neutral-200 p-2.5 space-y-2" data-mixer-row="${r.ch}">
            <div class="flex items-center justify-between gap-2">
              <button type="button" data-ch-toggle="${r.ch}" class="flex items-center gap-2 text-left min-w-0 group" title="เปิด/ปิด ${r.title}">
                <span data-ch-badge="${r.ch}" class="w-8 h-8 rounded-[6px] text-white grid place-items-center shrink-0 shadow-[0_3px_0_rgba(0,0,0,0.25)] transition" style="background:${r.color}">
                  ${uiIconHtml(r.icon, 16)}
                </span>
                <div class="min-w-0">
                  <div class="font-display font-extrabold text-sm text-[#333] leading-tight truncate">${r.title}</div>
                  <div class="text-[11px] font-semibold text-neutral-500 truncate">${r.sub}</div>
                </div>
              </button>
              <span data-ch-pct="${r.ch}" class="px-2 py-0.5 rounded-[4px] bg-[#241f35] text-[#ffa602] font-display font-black text-xs tabular shrink-0 min-w-[46px] text-center">75%</span>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" data-ch-down="${r.ch}" class="btn-3d k-btn-white w-8 h-8 grid place-items-center shrink-0" title="ลดเสียง ${r.title}">
                ${uiIconHtml('minus', 14)}
              </button>
              <input type="range" min="0" max="100" step="5" value="75" data-ch-slider="${r.ch}" aria-label="${r.title}"
                class="mixer-range flex-1" style="--thumb-color:${r.color}" />
              <button type="button" data-ch-up="${r.ch}" class="btn-3d k-btn-white w-8 h-8 grid place-items-center shrink-0" title="เพิ่มเสียง ${r.title}">
                ${uiIconHtml('plus', 14)}
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="grid grid-cols-3 gap-2 mt-4 pt-3 border-t-2 border-neutral-200">
        <button type="button" data-mixer-test-sfx class="btn-3d k-btn-green py-2 px-2 text-xs inline-flex items-center justify-center gap-1">
          ${uiIconHtml('bolt', 13)}<span>ทดสอบ SFX</span>
        </button>
        <button type="button" data-mixer-test-vo class="btn-3d k-btn-blue py-2 px-2 text-xs inline-flex items-center justify-center gap-1">
          ${uiIconHtml('mic', 13)}<span>ทดสอบพากย์</span>
        </button>
        <button type="button" data-mixer-reset class="btn-3d k-btn-dark py-2 px-2 text-xs inline-flex items-center justify-center gap-1">
          ${uiIconHtml('refresh', 13)}<span>ค่าเริ่มต้น</span>
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
  modal.querySelector('[data-mixer-close]').addEventListener('click', () => { SFX.click(); modal.classList.add('hidden'); });
  modal.querySelector('[data-mixer-reset]').addEventListener('click', () => SFX.resetVolumes());
  modal.querySelector('[data-mixer-test-sfx]').addEventListener('click', () => SFX.correct());
  modal.querySelector('[data-mixer-test-vo]').addEventListener('click', () => SFX.speak('voice_on.mp3', 'ทดสอบเสียงพากย์พิธีกรสนามค่ะ!', true));

  modal.querySelectorAll('[data-ch-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ch = btn.dataset.chToggle;
      if (ch === 'master') SFX.toggleMute();
      else if (ch === 'bgm') { SFX.click(); SFX.toggleBgm(); }
      else if (ch === 'sfx') SFX.toggleSfx();
      else if (ch === 'voice') { SFX.click(); SFX.toggleVoice(); }
    });
  });
  modal.querySelectorAll('[data-ch-down]').forEach(btn => {
    btn.addEventListener('click', () => SFX.channelDown(btn.dataset.chDown, 0.1));
  });
  modal.querySelectorAll('[data-ch-up]').forEach(btn => {
    btn.addEventListener('click', () => SFX.channelUp(btn.dataset.chUp, 0.1));
  });
  modal.querySelectorAll('[data-ch-slider]').forEach(inp => {
    const ch = inp.dataset.chSlider;
    inp.addEventListener('input', () => SFX.setChannelVolume(ch, Number(inp.value) / 100, true));
    inp.addEventListener('change', () => {
      if (ch === 'sfx' || ch === 'master') SFX.click();
    });
  });
  modal.querySelectorAll('[data-bgm-pick]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tr = SFX.setBgmTrack(btn.dataset.bgmPick);
      if (tr) toast(`${uiIconHtml('music', 15)}<span>เปลี่ยนเพลงเป็น <b>${esc(tr.name)}</b> (${esc(tr.tag)})</span>`, 'info', 2000);
    });
  });
  return modal;
}

function openAudioMixer() {
  if (!window.SFX) return;
  SFX.click();
  const modal = ensureAudioMixerModal();
  syncVolumeControls();
  modal.classList.remove('hidden');
}

function syncVolumeControls() {
  if (!window.SFX) return;
  const pct = SFX.volumePct;
  const ico = uiIconHtml(speakerIconName(), 16);
  document.querySelectorAll('[data-vol-mute]').forEach(btn => {
    const ic = btn.querySelector('[data-vol-icon]');
    if (ic) ic.innerHTML = ico;
    else btn.innerHTML = ico;
    btn.title = SFX.muted ? 'เปิดเสียง' : 'ปิดเสียง';
  });
  document.querySelectorAll('[data-vol-label]').forEach(el => {
    el.textContent = `${pct}%`;
  });
  document.querySelectorAll('[data-vol-slider]').forEach(inp => {
    if (document.activeElement !== inp) inp.value = String(pct);
  });
  document.querySelectorAll('[data-vol-down]').forEach(btn => {
    btn.disabled = pct <= 0;
  });
  document.querySelectorAll('[data-vol-up]').forEach(btn => {
    btn.disabled = pct >= 100 && !SFX.muted;
  });

  // ซิงก์ชื่อเพลงปัจจุบัน + ปุ่มใน Mixer
  const curTrack = SFX.bgmTrack;
  document.querySelectorAll('[data-bgm-cur-name]').forEach(el => {
    if (curTrack) el.textContent = curTrack.name;
  });

  // ซิงก์แถบแยกปรับเสียง 4 ช่อง (Master / BGM / SFX / Voice)
  const modal = document.getElementById('audioMixerModal');
  if (modal) {
    modal.querySelectorAll('[data-bgm-pick]').forEach(btn => {
      const active = curTrack && btn.dataset.bgmPick === curTrack.id;
      btn.className = active
        ? 'text-left p-2 rounded-[6px] border-2 border-[#46178f] bg-[#f3e8ff] ring-2 ring-[#ffa602] transition flex items-center gap-2 min-w-0'
        : 'text-left p-2 rounded-[6px] border-2 border-neutral-200 bg-white hover:border-[#46178f] transition flex items-center gap-2 min-w-0';
    });
    ['master', 'bgm', 'sfx', 'voice'].forEach(ch => {
      const chPct = SFX.getChannelPct(ch);
      const pctEl = modal.querySelector(`[data-ch-pct="${ch}"]`);
      const slEl = modal.querySelector(`[data-ch-slider="${ch}"]`);
      const dnEl = modal.querySelector(`[data-ch-down="${ch}"]`);
      const upEl = modal.querySelector(`[data-ch-up="${ch}"]`);
      const badgeEl = modal.querySelector(`[data-ch-badge="${ch}"]`);
      if (pctEl) pctEl.textContent = `${chPct}%`;
      if (slEl && document.activeElement !== slEl) slEl.value = String(chPct);
      if (dnEl) dnEl.disabled = chPct <= 0;
      if (upEl) upEl.disabled = chPct >= 100;
      if (badgeEl) {
        badgeEl.style.opacity = chPct > 0 ? '1' : '0.4';
        if (ch === 'master') badgeEl.innerHTML = uiIconHtml(speakerIconName(), 16);
      }
    });
  }
}

function initVolumeControls() {
  if (!window.SFX) return;
  document.querySelectorAll('[data-vol-mute]').forEach(btn => {
    if (btn.dataset.volBound) return;
    btn.dataset.volBound = '1';
    btn.addEventListener('click', () => SFX.toggleMute());
  });
  document.querySelectorAll('[data-vol-down]').forEach(btn => {
    if (btn.dataset.volBound) return;
    btn.dataset.volBound = '1';
    btn.addEventListener('click', () => SFX.volumeDown(0.1));
  });
  document.querySelectorAll('[data-vol-up]').forEach(btn => {
    if (btn.dataset.volBound) return;
    btn.dataset.volBound = '1';
    btn.addEventListener('click', () => SFX.volumeUp(0.1));
  });
  document.querySelectorAll('[data-vol-slider]').forEach(inp => {
    if (inp.dataset.volBound) return;
    inp.dataset.volBound = '1';
    inp.addEventListener('input', () => SFX.setVolume(Number(inp.value) / 100, true));
    inp.addEventListener('change', () => { if (SFX.volumePct > 0) SFX.click(); });
  });
  document.querySelectorAll('[data-vol-mixer]').forEach(btn => {
    if (btn.dataset.volBound) return;
    btn.dataset.volBound = '1';
    btn.addEventListener('click', openAudioMixer);
  });
  document.querySelectorAll('[data-bgm-next]').forEach(btn => {
    if (btn.dataset.volBound) return;
    btn.dataset.volBound = '1';
    btn.addEventListener('click', () => {
      const tr = SFX.nextBgmTrack();
      if (tr) toast(`${uiIconHtml('music', 15)}<span>เปลี่ยนเพลง: <b>${esc(tr.name)}</b> (${esc(tr.tag)})</span>`, 'info', 2000);
    });
  });
  document.querySelectorAll('[data-vol-label]').forEach(el => {
    if (el.dataset.volBound) return;
    el.dataset.volBound = '1';
    el.style.cursor = 'pointer';
    el.title = 'คลิกเพื่อปรับเสียงแยกช่อง (เพลง / เอฟเฟกต์ / พากย์)';
    el.addEventListener('click', openAudioMixer);
  });
  SFX.onChange(syncVolumeControls);
  syncVolumeControls();
}
document.addEventListener('DOMContentLoaded', () => {
  initFullscreenButtons();
  initVolumeControls();
});

/* สร้างภาพหน้าตลกการ์ตูน Vector-Style บน Canvas (ไม่ใช้ OS Emoji!) */
function makeFunnyFaceDataUrl(name = 'Player', avIdx = 0) {
  const cv = document.createElement('canvas');
  cv.width = 360; cv.height = 360;
  const c = cv.getContext('2d');
  const av = AVATARS[avIdx] || AVATARS[0];
  const palettes = [
    { bg: '#c026d3', face: '#facc15', accent: '#38bdf8' },
    { bg: '#1368ce', face: '#fde047', accent: '#fb7185' },
    { bg: '#e21b3c', face: '#fef08a', accent: '#4ade80' },
    { bg: '#26890c', face: '#facc15', accent: '#f472b6' },
    { bg: '#46178f', face: '#fbbf24', accent: '#22d3ee' }
  ];
  const pal = palettes[rand(palettes.length)];
  const style = rand(3);

  // พื้นหลังลายแฉกเกมโชว์
  c.fillStyle = pal.bg;
  c.fillRect(0, 0, 360, 360);
  c.fillStyle = 'rgba(255,255,255,0.14)';
  for (let i = 0; i < 12; i++) {
    c.beginPath();
    c.moveTo(180, 155);
    c.arc(180, 155, 280, (i * Math.PI) / 6, (i * Math.PI) / 6 + 0.24);
    c.closePath();
    c.fill();
  }

  // ประกายดาวรอบฉาก
  const drawStar = (x, y, r, col) => {
    c.fillStyle = col;
    c.beginPath();
    for (let k = 0; k < 8; k++) {
      const rad = k % 2 === 0 ? r : r * 0.4;
      const ang = (k * Math.PI) / 4;
      if (k === 0) c.moveTo(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad);
      else c.lineTo(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad);
    }
    c.closePath();
    c.fill();
  };
  drawStar(56, 76, 18, '#fef08a');
  drawStar(306, 86, 15, '#ffffff');
  drawStar(64, 232, 12, pal.accent);
  drawStar(296, 224, 14, '#fef08a');

  // ใบหน้าการ์ตูนสุดกวน
  c.lineWidth = 8;
  c.strokeStyle = '#1e1b2e';
  c.fillStyle = pal.face;
  c.beginPath();
  c.arc(180, 155, 92, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  // หมวกปาร์ตี้หรือแว่นตลก
  if (style === 0) {
    c.fillStyle = pal.accent;
    c.beginPath();
    c.moveTo(140, 74); c.lineTo(182, 16); c.lineTo(222, 74);
    c.closePath();
    c.fill(); c.stroke();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(182, 18, 12, 0, Math.PI * 2); c.fill(); c.stroke();
  }

  // แก้มชมพู
  c.fillStyle = 'rgba(251,113,133,0.65)';
  c.beginPath(); c.ellipse(122, 178, 18, 11, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(238, 178, 18, 11, 0, 0, Math.PI * 2); c.fill();

  // ตาโตเหล่สุดฮา (ซ้ายใหญ่ ขวาเล็ก หรี่กวนๆ)
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(144, 134, 27, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.arc(218, 142, 21, 0, Math.PI * 2); c.fill(); c.stroke();

  c.fillStyle = '#1e1b2e';
  c.beginPath(); c.arc(154, 125, 11, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(209, 149, 9, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(158, 121, 4, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(212, 146, 3.5, 0, Math.PI * 2); c.fill();

  // แว่นตาเนิร์ด (แบบที่ 1)
  if (style === 1) {
    c.strokeStyle = '#e21b3c';
    c.lineWidth = 7;
    c.strokeRect(110, 108, 62, 52);
    c.strokeRect(188, 114, 62, 52);
    c.beginPath(); c.moveTo(172, 134); c.lineTo(188, 136); c.stroke();
    c.strokeStyle = '#1e1b2e';
    c.lineWidth = 8;
  }

  // ปากกว้างแลบลิ้นยาวสุดฮา
  c.fillStyle = '#1e1b2e';
  c.beginPath();
  c.moveTo(132, 184);
  c.quadraticCurveTo(180, 232, 230, 178);
  c.quadraticCurveTo(180, 198, 132, 184);
  c.fill();
  c.stroke();

  // ลิ้นสีชมพู
  c.fillStyle = '#fb7185';
  c.beginPath();
  c.moveTo(174, 196);
  c.quadraticCurveTo(176, 248, 204, 240);
  c.quadraticCurveTo(222, 234, 212, 192);
  c.closePath();
  c.fill();
  c.stroke();
  c.strokeStyle = '#e11d48';
  c.lineWidth = 4;
  c.beginPath(); c.moveTo(192, 198); c.lineTo(198, 226); c.stroke();

  // ป้ายชื่อ Broadcast Lower-Third
  c.fillStyle = '#1e1b2e';
  c.fillRect(18, 278, 324, 62);
  c.fillStyle = av.bg || '#ffa602';
  c.fillRect(18, 278, 12, 62);
  c.fillStyle = '#ffa602';
  c.font = 'bold 24px Kanit, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(`หน้าตลกของ ${name}!`, 186, 309);
  return cv.toDataURL('image/jpeg', 0.72);
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
