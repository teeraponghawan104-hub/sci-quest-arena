/* =========================================================
 * Sci-Quest! — Studio Audio Engine
 * ---------------------------------------------------------
 * 1) Studio Stereo SFX (21 ไฟล์ใน audio/sfx/*.mp3):
 *    เล่นผ่าน Web Audio API AudioBufferSourceNode (0ms latency, เล่นซ้อนกันได้หลายเสียงพร้อมกัน)
 *    พร้อมระบบ Reverb, FM Chimes, Brass Section, Acoustic Drums และ Physical Modeling
 * 2) Studio Multi-Track Stereo BGM Loops (audio/sfx/bgm_*.mp3):
 *    - bgm_play.mp3   : Kahoot!-style Marimba + Rhodes + Funk Bass + Acoustic Drums
 *    - bgm_bonus.mp3  : เพลงเร้าใจ 150 BPM + เสียงนาฬิกาติ๊กต็อกเมื่อปล่อยโจทย์โบนัสพิเศษ
 *    - bgm_podium.mp3 : เพลงฉลองแชมป์บนโพเดียม 1-2-3
 * 3) เสียงพากย์ธรรมชาติ (65 ไฟล์ใน audio/vo/*.mp3):
 *    เสียงพากย์พิธีกรสนามสุดมันส์ พร้อมระบบ Audio Ducking เบาเพลงอัตโนมัติ
 * ========================================================= */
const SFX = (() => {
  let ctx = null, master = null, bgmGain = null;
  function readStoredVol(key, fallback) {
    const str = localStorage.getItem(key);
    if (str === null || str === '') return fallback;
    const raw = Number(str);
    return Number.isFinite(raw) ? Math.max(0, Math.min(1, raw)) : fallback;
  }

  let muted = localStorage.getItem('sqa_muted') === '1';
  let bgmOn = localStorage.getItem('sqa_bgm') !== '0';
  let sfxOn = localStorage.getItem('sqa_sfx') !== '0';
  let voiceOn = localStorage.getItem('sqa_voice') !== '0';
  let volume = readStoredVol('sqa_volume', 0.75);
  let bgmVolume = readStoredVol('sqa_vol_bgm', 0.70);
  let sfxVolume = readStoredVol('sqa_vol_sfx', 0.85);
  let voiceVolume = readStoredVol('sqa_vol_voice', 0.95);
  let isDucked = false;

  const BGM_TRACKS = [
    { id: 'bgm_play',     name: 'Kahoot! Groove',  tag: 'สนุกคลาสสิก', bpm: '125 BPM', color: '#46178f' },
    { id: 'bgm_arcade',   name: '8-Bit Arcade',    tag: 'เกมย้อนยุค',  bpm: '136 BPM', color: '#e21b3c' },
    { id: 'bgm_synth',    name: 'Cyber Synthwave', tag: 'ไซเบอร์เท่ๆ', bpm: '126 BPM', color: '#7c3aed' },
    { id: 'bgm_tropical', name: 'Tropical Pop',    tag: 'สดใสชิลๆ',   bpm: '116 BPM', color: '#0284c7' },
    { id: 'bgm_lofi',     name: 'Lo-Fi Study',     tag: 'โฟกัสสบายๆ',  bpm: '92 BPM',  color: '#26890c' },
    { id: 'bgm_esports',  name: 'Esports Boss',    tag: 'มันส์สุดขีด', bpm: '144 BPM', color: '#d89e00' }
  ];

  let bgmTrackId = (() => {
    const saved = localStorage.getItem('sqa_bgm_track') || 'bgm_play';
    return BGM_TRACKS.some(t => t.id === saved) ? saved : 'bgm_play';
  })();

  let bgmMode = 'none'; // 'none' | 'play' | 'bonus' | 'fever' | 'podium'
  let bgmPlayingFile = '';
  let bgmSource = null;
  let bgmAudioEl = null;
  let bgmReqId = 0;
  let currentVo = null;
  let lastVoAt = 0;
  let autoplayBlocked = false;

  const sfxBuffers = new Map();
  const sfxLoading = new Map();
  const sfxLastPlayed = new Map();
  const voCache = new Map();
  const listeners = new Set();

  const SFX_LIST = [
    'click', 'pop', 'join', 'correct', 'partial', 'wrong', 'coin', 'item',
    'whoosh', 'stolen', 'freeze', 'crack', 'shatter', 'block', 'splat',
    'dizzy', 'zap', 'potion', 'bonus', 'fanfare', 'drum', 'shutter'
  ];

  const effVol = () => (muted ? 0 : volume);
  const sfxBusGain = () => (sfxOn ? 1 : 0) * effVol() * sfxVolume;
  const bgmWebGain = () => (bgmOn ? 1 : 0) * (isDucked ? 0.14 : 0.48) * effVol() * bgmVolume;
  const bgmElVol = () => Math.max(0, Math.min(1, (bgmOn ? 1 : 0) * (isDucked ? 0.12 : 0.44) * effVol() * bgmVolume));
  const voElVol = () => Math.max(0, Math.min(1, (voiceOn ? 1 : 0) * effVol() * voiceVolume * 1.15));

  function applyGains() {
    if (master) master.gain.value = sfxBusGain();
    if (bgmGain) bgmGain.gain.value = bgmWebGain();
    if (bgmAudioEl) bgmAudioEl.volume = bgmElVol();
    if (currentVo) currentVo.volume = voElVol();
  }

  function notifyChange() {
    listeners.forEach(fn => { try { fn(); } catch (e) {} });
  }

  function hideUnlockHint() {
    autoplayBlocked = false;
    const el = document.getElementById('audioUnlockHint');
    if (el) el.remove();
  }

  function showUnlockHint() {
    if (muted || !bgmOn || volume <= 0 || bgmVolume <= 0 || bgmMode === 'none') return;
    autoplayBlocked = true;
    if (!document.body || document.getElementById('audioUnlockHint')) return;
    const box = document.createElement('button');
    box.id = 'audioUnlockHint';
    box.type = 'button';
    box.className = 'pop-in btn-3d k-btn-yellow fixed top-3 left-1/2 -translate-x-1/2 z-[245] px-4 py-2 text-xs sm:text-sm flex items-center gap-2 border-2 border-white whitespace-nowrap';
    const ico = window.SQA_ART ? SQA_ART.uiSvg('music', 15) : '';
    box.innerHTML = `<span class="w-6 h-6 rounded-full bg-[#241f35] text-[#ffa602] grid place-items-center shrink-0 wiggle">${ico}</span><span>แตะเพื่อเปิดเพลงประกอบ</span>`;
    box.addEventListener('click', () => {
      SFX.unlock();
      hideUnlockHint();
    });
    document.body.appendChild(box);
  }

  function ac() {
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.connect(ctx.destination);
        bgmGain = ctx.createGain();
        bgmGain.connect(ctx.destination);
        applyGains();
        preloadAllSfx();
      }
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    } catch (e) { return null; }
    return ctx;
  }

  async function loadBuffer(url) {
    if (sfxBuffers.has(url)) return sfxBuffers.get(url);
    if (sfxLoading.has(url)) return sfxLoading.get(url);
    const c = ac();
    if (!c || typeof fetch === 'undefined') return null;
    const p = fetch(url)
      .then(r => r.arrayBuffer())
      .then(ab => c.decodeAudioData(ab))
      .then(buf => { sfxBuffers.set(url, buf); return buf; })
      .catch(() => null);
    sfxLoading.set(url, p);
    return p;
  }

  function preloadAllSfx() {
    if (typeof fetch === 'undefined') return;
    SFX_LIST.forEach(name => loadBuffer(`audio/sfx/${name}.mp3`));
    [bgmTrackId, 'bgm_bonus', 'bgm_podium'].forEach(name => loadBuffer(`audio/sfx/${name}.mp3`));
  }

  function playSfx(name, vol = 0.85, rate = 1.0) {
    if (muted || !sfxOn || volume <= 0 || sfxVolume <= 0) return;
    // กันเสียงซ้อนถี่เกินไปเมื่อมีผู้เล่น 200 เครื่องเข้าห้องหรือได้คะแนนพร้อมกัน
    const now = Date.now();
    const minGap = (name === 'crack' || name === 'click') ? 35 : 130;
    if (now - (sfxLastPlayed.get(name) || 0) < minGap) return;
    sfxLastPlayed.set(name, now);

    const url = `audio/sfx/${name}.mp3`;
    const c = ac();
    const buf = sfxBuffers.get(url);
    if (c && buf) {
      try {
        const src = c.createBufferSource();
        const g = c.createGain();
        src.buffer = buf;
        src.playbackRate.value = rate;
        g.gain.value = vol;
        src.connect(g);
        g.connect(master);
        src.start(0);
        return;
      } catch (e) {}
    }
    // กรณีไฟล์กำลังโหลดอยู่ ให้โหลดเข้า AudioBuffer พร้อมเล่นผ่าน HTML5 Audio ทันทีโดยไม่หน่วง
    loadBuffer(url).then(decoded => {
      if (decoded && c && !muted) {
        try {
          const src = c.createBufferSource();
          const g = c.createGain();
          src.buffer = decoded;
          src.playbackRate.value = rate;
          g.gain.value = vol;
          src.connect(g);
          g.connect(master);
          src.start(0);
        } catch (e) {}
      }
    });
  }

  /* ---------------- Studio Stereo BGM Loops (Instant Auto-Start + Autoplay Fallback) ---------------- */
  function stopBgmNode() {
    bgmReqId++;
    bgmPlayingFile = '';
    if (bgmSource) {
      try { bgmSource.stop(); bgmSource.disconnect(); } catch (e) {}
      bgmSource = null;
    }
    if (bgmAudioEl) {
      try { bgmAudioEl.pause(); bgmAudioEl.currentTime = 0; } catch (e) {}
      bgmAudioEl = null;
    }
  }

  function resolveTrackFile(mode) {
    if (mode === 'bonus') return 'bgm_bonus';
    if (mode === 'podium') return 'bgm_podium';
    if (mode === 'fever' || mode === 'boss') return 'bgm_esports';
    return bgmTrackId || 'bgm_play';
  }

  async function startBgm(mode = 'play', fromGesture = false) {
    const track = resolveTrackFile(mode);
    const isPlayingNow = !!(bgmSource || (bgmAudioEl && !bgmAudioEl.paused));
    if (bgmMode === mode && bgmPlayingFile === track && isPlayingNow) return;
    bgmMode = mode;
    stopBgmNode();
    if (mode === 'none' || !bgmOn || muted || volume <= 0 || bgmVolume <= 0) {
      hideUnlockHint();
      return;
    }

    const reqId = ++bgmReqId;
    const url = `audio/sfx/${track}.mp3`;

    // ถ้า AudioContext พร้อมทำงานแล้ว (หรือปลดล็อกจากการแตะหน้าจอ) -> เล่นผ่าน Web Audio Loop ไร้รอยต่อ
    if (fromGesture || (ctx && ctx.state === 'running')) {
      const c = ac();
      if (c && c.state === 'suspended') {
        try { await c.resume(); } catch (e) {}
      }
      if (c && c.state === 'running') {
        const buf = await loadBuffer(url);
        if (reqId !== bgmReqId || bgmMode !== mode || !bgmOn || muted || volume <= 0 || bgmVolume <= 0) return;
        if (buf) {
          try {
            stopBgmNode();
            const src = c.createBufferSource();
            src.buffer = buf;
            src.loop = true;
            src.connect(bgmGain);
            applyGains();
            src.start(0);
            bgmSource = src;
            bgmPlayingFile = track;
            hideUnlockHint();
            return;
          } catch (e) {}
        }
      }
    }

    // โหมดเข้าหน้าเว็บครั้งแรก -> ลองเล่นทันทีผ่าน HTML5 Audio (เล่นเลยทันทีหากเบราว์เซอร์อนุญาต!)
    if (typeof Audio !== 'undefined') {
      try {
        const a = new Audio(url);
        a.loop = true;
        a.volume = bgmElVol();
        const p = a.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            if (reqId !== bgmReqId || bgmMode !== mode || !bgmOn || muted || volume <= 0 || bgmVolume <= 0) {
              try { a.pause(); } catch (e) {}
              return;
            }
            stopBgmNode();
            bgmAudioEl = a;
            bgmPlayingFile = track;
            applyGains();
            hideUnlockHint();
          }).catch(() => {
            try { a.pause(); } catch (e) {}
            if (reqId === bgmReqId && bgmMode === mode && bgmOn && !muted && volume > 0 && bgmVolume > 0) {
              showUnlockHint();
            }
          });
        } else {
          bgmAudioEl = a;
          bgmPlayingFile = track;
          hideUnlockHint();
        }
      } catch (e) {
        showUnlockHint();
      }
    }
  }

  function stopBgm() {
    bgmMode = 'none';
    stopBgmNode();
    hideUnlockHint();
  }

  /* ---------------- เสียงพากย์ธรรมชาติ (Neural Thai Voice MP3) ---------------- */
  function showMcBubble(text) {
    let box = document.getElementById('mcAnnouncerBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'mcAnnouncerBox';
      box.style.cssText = 'position:fixed;bottom:14px;right:14px;z-index:240;max-width:min(90vw,390px);pointer-events:none;';
      document.body.appendChild(box);
    }
    const cleanText = String(text || '').replace(/^[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\u200D]+\s*/u, '');
    const micSvg = window.SQA_ART ? SQA_ART.uiSvg('mic', 20) : 'MC';
    box.innerHTML = `
      <div class="pop-in bg-[#241f35] text-white px-4 py-2.5 rounded-[8px] shadow-[0_6px_0_#000] border-2 border-white/15 border-l-8 border-l-[#ffa602] flex items-center gap-3">
        <span class="w-9 h-9 rounded-full bg-[#ffa602] text-[#1e1b2e] grid place-items-center shrink-0 wiggle shadow">${micSvg}</span>
        <div class="text-xs sm:text-sm font-bold leading-snug">
          <div class="text-[10px] font-black uppercase text-[#ffa602] tracking-wider">LIVE COMMENTARY • พิธีกรพากย์สนาม</div>
          <div>${cleanText}</div>
        </div>
      </div>`;
    clearTimeout(box._t);
    box._t = setTimeout(() => { box.innerHTML = ''; }, 3900);
  }

  function setDucking(duck) {
    isDucked = !!duck;
    applyGains();
  }

  function playVoClip(filename, bubbleText, priority = false) {
    if (bubbleText) showMcBubble(bubbleText);
    if (muted || volume <= 0 || voiceVolume <= 0 || !voiceOn || !filename || typeof Audio === 'undefined') return;
    const now = Date.now();
    if (!priority && now - lastVoAt < 1800) return;
    lastVoAt = now;

    try {
      if (currentVo) {
        currentVo.pause();
        currentVo.currentTime = 0;
      }
      let audio = voCache.get(filename);
      if (!audio) {
        audio = new Audio(`audio/vo/${filename}`);
        voCache.set(filename, audio);
      }
      audio.currentTime = 0;
      audio.volume = voElVol();
      currentVo = audio;
      setDucking(true);
      audio.onended = () => setDucking(false);
      audio.play().catch(() => setDucking(false));
    } catch (e) {}
  }

  const pickOne = arr => arr[Math.floor(Math.random() * arr.length)];

  function announce(kind, d = {}) {
    const A = d.a || 'ผู้เล่น', B = d.b || 'เพื่อน', pts = d.pts || 0;
    switch (kind) {
      case 'start':
        playSfx('drum', 0.9);
        playVoClip(
          pickOne(['start_1.mp3', 'start_2.mp3']),
          pickOne([
            '🔔 เปิดสนามแล้วจ้าวัยรุ่น! สแกนการ์ดแล้วลุยให้จึ้งไปเลย!',
            '🔥 เริ่ดเลยล่ะ! การแข่งขันเริ่มแล้ว มาดูกันว่าใครจะตัวตึงที่สุดในห้อง!'
          ]),
          true
        );
        break;
      case 'pause':
        playSfx('pop', 0.8);
        playVoClip('pause.mp3', '⏸️ พักก่อนคุณน้า! ครูสั่งเบรกเกมชั่วคราว วางมือถือแล้วฟังครูก่อนเด้อ!', true);
        break;
      case 'bonus':
        playSfx('bonus', 0.95);
        playVoClip(
          pickOne(['bonus_1.mp3', 'bonus_2.mp3', 'bonus_3.mp3']),
          pickOne([
            '🚨 ประกาศด่วนแบบตะโกน! โจทย์โบนัสพิเศษมาแล้วแม่ รีบตอบชิงกล่องสุ่มด่วน!',
            '✨ โซ๊ะมากแม่! ครูปล่อยคำถามโบนัสแล้ว ตอบผ่านรับไอเทมไปแกงเพื่อนทันที!',
            '🎁 จึ้งมากคุณน้า! โจทย์พิเศษเด้งแล้ว รีบพิมพ์ตอบให้ไวเลยล่ะ!'
          ]),
          true
        );
        break;
      case 'giftAll':
        playSfx('item', 0.95);
        playVoClip('gift_all.mp3', '🎁 ครูใจป้ำแบบตัวแม่! แจกไอเทมสุ่มให้ทุกคนแล้ว เตรียมแกงกันได้เลย!', true);
        break;
      case 'join':
        playVoClip(
          pickOne(['join_1.mp3', 'join_2.mp3', 'join_3.mp3', 'join_4.mp3']),
          pickOne([
            `💅 ตัวตึง "${A}" เข้าสนามมาอีกหนึ่ง! โซ๊ะมากแม่ พร้อมบวกสุดๆ!`,
            `🔥 เริ่ดเลยล่ะ! "${A}" มาแล้ว เพื่อนๆ ระวังแต้มไว้ให้ดี!`,
            `👑 ตัวแม่ตัวมัม "${A}" ก้าวเข้าสนามแล้วจ้า งานนี้มีคนหนาวแน่นอน!`,
            `⚡ "${A}" มาแบบสับแบบจึ้ง! ยินดีต้อนรับเข้าสู่สนามแข่ง!`
          ])
        );
        break;
      case 'score':
        if (d.doubled) {
          playSfx('fanfare', 0.85);
          playVoClip(
            pickOne(['x2_score.mp3', 'x2_score_2.mp3']),
            `⚡ คูณสองโซ๊ะมากแม่! ${A} ฟาดแต้มเบิ้ล +${pts} แบบเริ่ดเลยล่ะ!`,
            true
          );
        } else if (pts >= 280) {
          playSfx('correct', 0.9);
          playVoClip(
            pickOne(['big_score.mp3', 'big_score_2.mp3']),
            `👑 ปังปุริเย่สุดๆ! ${A} โกยแต้มก้อนใหญ่ +${pts} มงลงหัวแล้วจ้า!`
          );
        } else {
          showMcBubble(pickOne([
            `✨ เริ่ดเลยล่ะ! ${A} เก็บเพิ่มไป +${pts} แต้มแบบฉ่ำๆ!`,
            `💅 โซ๊ะมากแม่! ${A} บวกเพิ่มอีก +${pts} คะแนน!`
          ]));
        }
        break;
      case 'gradePerfect':
        playVoClip(
          pickOne(['perfect_1.mp3', 'perfect_2.mp3', 'perfect_3.mp3', 'perfect_4.mp3', 'perfect_5.mp3', 'perfect_6.mp3', 'perfect_7.mp3']),
          pickOne([
            '👑 เริ่ดมากแม่! ตอบเป๊ะขนาดนี้ เอาคะแนนเต็ม 100% ไปเลยจ้า!',
            '💅 โซ๊ะมากแม่! ความรู้แน่นฉ่ำ มงลงไปเลยจ้า!',
            '🔥 เริ่ดเลยล่ะ! ตึงจัดปลัดบอก เอาไปเต็มร้อยคะแนน!',
            '✨ จึ้งมากแม่! ตอบดีแบบตะโกน สิบเต็มสิบไม่หัก!',
            '💖 ตัวแม่ตัวมัมสุดๆ! สมองไหลลื่นแบบสับ เอาแต้มเต็มไปเลย!',
            '🚀 ทำถึงเกินคุณน้า! ตอบเป๊ะเวอร์วังอลังการ!',
            '🐶 โฮ่งมากแม่! เก่งแบบเกินต้าน รับคะแนนเต็มไปเลย!'
          ]),
          true
        );
        break;
      case 'gradeClose':
        playVoClip(
          pickOne(['close_1.mp3', 'close_2.mp3']),
          pickOne([
            '👍 เริ่ดอยู่เด้อ! เกือบเป๊ะแล้วแม่ เอาไป 70% แบบสวยๆ!',
            '✨ ทำดีทำถึง! เก็บไป 70% แบบฉ่ำๆ เลยล่ะ!'
          ]),
          true
        );
        break;
      case 'gradePartial':
        playVoClip(
          pickOne(['partial_1.mp3', 'partial_2.mp3']),
          pickOne([
            '🙂 ถือว่าเริ่ดเลยล่ะ! เอาแต้มไป 40% ก่อนนะคุณน้า!',
            '👌 พอได้อยู่นะแม่! เก็บ 40% เข้ากระเป๋าไปแบบกรุบกริบ!'
          ]),
          true
        );
        break;
      case 'gradeMiss':
        playVoClip(
          pickOne(['miss_1.mp3', 'miss_2.mp3', 'miss_3.mp3', 'miss_4.mp3', 'miss_5.mp3']),
          pickOne([
            '🍲 แกงตัวเองป่ะเนี่ยคุณน้า! ยังไม่ตรงประเด็น ลองพิมพ์ใหม่อีกทีเด้อ!',
            '🫠 อ่อมมากแม่! คำตอบยังออกทะเลอยู่เลย ตั้งสติแล้วเอาใหม่!',
            '😅 บ้งแล้วหนึ่ง! อ่านคำใบ้ก่อนลูก อย่าเพิ่งมั่วซั่ว!',
            '💀 ขิตแล้วแม่! อันนี้ตอบหรือละเมอคะเนี่ย ลองส่งใหม่อีกรอบด่วน!',
            '✋ พักก่อนคุณน้า! คำสำคัญยังไม่มาเลย ลองแก้ใหม่เร็ว!'
          ]),
          true
        );
        break;
      case 'steal':
        playVoClip(
          pickOne(['steal_1.mp3', 'steal_2.mp3', 'steal_3.mp3']),
          pickOne([
            `🍲 แกงหม้อใหญ่แล้วแม่! ${A} แอบฉกแต้มของ ${B} ไป ${pts} แต้ม เริ่ดเลยล่ะ!`,
            `💸 เหลี่ยมจัดปลัดบอก! ${A} ดูดคะแนนจาก ${B} มา ${pts} แต้มแบบฉ่ำๆ!`,
            `😱 ${B} โดน ${A} ขโมยไป ${pts} แต้มแบบจุกๆ กำหมัดแน่นแล้วนะคุณน้า!`
          ]),
          true
        );
        break;
      case 'freeze':
        playVoClip(
          pickOne(['freeze_1.mp3', 'freeze_2.mp3']),
          pickOne([
            `❄️ หนาวฉ่ำไปเลยแม่! ${A} แช่แข็งหน้าจอของ ${B} แล้ว รีบกดทุบน้ำแข็งด่วน!`,
            `🧊 แข็งเป็นไอติมเลยคุณน้า! ${B} โดน ${A} แช่แข็ง กดทุบ 5 ทีให้ไว!`
          ]),
          true
        );
        break;
      case 'blind':
        playVoClip(
          pickOne(['blind_1.mp3', 'blind_2.mp3']),
          pickOne([
            `💨 มองไม่เห็นเลยดิ! ${A} ปาระเบิดหมอกควันบังจอ ${B} รีบเช็ดหน้าจอด่วนแม่!`,
            `🌫️ หมอกลงจัดมากคุณน้า! ${B} โดน ${A} พ่นหมอกบังจอ กดเช็ดรัวๆ เร็ว!`
          ]),
          true
        );
        break;
      case 'flip':
        playVoClip(
          pickOne(['flip_1.mp3', 'flip_2.mp3']),
          pickOne([
            `🙃 มึนหัวตึ้บเลยแม่! ${A} เสกหน้าจอ ${B} ตีลังกากลับหัว รีบกดซ่อมจอด่วน!`,
            `🤪 แกงกันแรงมาก! หน้าจอของ ${B} กลับหัว 180° ตะแคงคอพิมพ์ไปเลยจ้า!`
          ]),
          true
        );
        break;
      case 'zap':
        playVoClip(
          pickOne(['zap_1.mp3', 'zap_2.mp3']),
          pickOne([
            `🌩️ เปรี้ยง! ${A} ปล่อยสายฟ้าฟาดแบบสับ แต้มของ ${B} ปลิวหายไป ${pts} คะแนนเลยแม่!`,
            `⚡ ช็อตฟีลสุดๆ! ${B} โดนสายฟ้าของ ${A} ผ่ากลางสนาม คะแนนร่วงไป ${pts} แต้มเลยคุณน้า!`
          ]),
          true
        );
        break;
      case 'boost':
        playVoClip('boost_1.mp3', `🧪 หวานเจี๊ยบเลยแม่! ${A} ดื่มน้ำยาวิทย์บวกฟรี +${pts} แต้ม แถมส่องคีย์เวิร์ดแบบเริ่ดๆ!`, true);
        break;
      case 'selfie':
        playSfx('shutter', 0.95);
        playVoClip('selfie_1.mp3', `📸 โดนสั่งแชะหน้าตลกแล้วแม่! ${B} ต้องทำหน้าฮาแบบสับส่งขึ้นจอใหญ่ให้ครูตรวจด่วน!`, true);
        break;
      case 'selfieSent':
        playSfx('shutter', 0.98);
        playVoClip('selfie_sent.mp3', `🤪 รูปหน้าตลกของ ${A} ขึ้นจอใหญ่แล้วจ้า! โซ๊ะมากแม่ ครูตรวจความฮาแล้วกดอนุมัติได้เลย!`, true);
        break;
      case 'selfieApproved':
        playSfx('correct', 0.9);
        playVoClip('selfie_ok.mp3', `✅ เริ่ดมากแม่! ครูอนุมัติความฮาของ ${A} ผ่านฉลุย กลับไปลุยต่อได้เลย!`, true);
        break;
      case 'selfieRejected':
        playSfx('wrong', 0.9);
        playVoClip('selfie_reject.mp3', `🤪 ครูบอกยังอ่อมอยู่นะคุณน้า! หน้าของ ${A} ยังไม่ตลกพอ สั่งถ่ายใหม่อีกรอบด่วน!`, true);
        break;
      case 'block':
        playVoClip(
          pickOne(['block_1.mp3', 'block_2.mp3']),
          pickOne([
            `🛡️ โนสนโนแคร์จ้า! ${B} กางโล่สะท้อนท่าป่วนของ ${A} กลับไปแบบเชิ่ดๆ เริ่ดมากแม่!`,
            `💅 ทำอะไรไม่ได้หรอกคุณน้า! ${B} มีโล่กันไว้ได้แบบสวยๆ ${A} เสียไอเทมฟรีไปเลยดิ!`
          ]),
          true
        );
        break;
      case 'podium':
        playVoClip(
          pickOne(['podium_1.mp3', 'podium_2.mp3']),
          d.winner
            ? `มงลงแชมป์อันดับ 1 ได้แก่ "${d.winner}" (${d.score} แต้ม) โซ๊ะมากแม่! ขอเสียงปรบมือ!`
            : 'จบการแข่งขันแล้วจ้า! มงลงแชมป์แบบโซ๊ะมากแม่ ขอเสียงปรบมือดังๆ เลย!',
          true
        );
        break;
      case 'bossStart':
        playVoClip(
          'boss_start.mp3',
          'ระวังให้ดี! บอสคำถามยักษ์บุกห้องแล้วแม่! รวมพลังทั้งห้องรุมตอบคำถามปราบมันด่วน!',
          true
        );
        break;
      case 'bossWin':
        playVoClip(
          'boss_win.mp3',
          'ปราบบอสสำเร็จแล้วจ้า! สุดยอดมากทั้งห้อง รับโบนัสคะแนนและไอเทมกันแบบจุกๆ!',
          true
        );
        break;
      case 'bossAttack':
        playVoClip(
          pickOne(['boss_attack_1.mp3', 'boss_attack_2.mp3']),
          pickOne([
            'ระวังตัวให้ดีแม่! บอสชาร์จพลังเต็มแล้ว ปล่อยท่าไม้ตายโจมตีทั้งห้องเลยจ้า!',
            'กรี๊ดดด! บอสสวนกลับแล้วคุณน้า ใครมีโล่รีบกันไว้ให้ดี โดนเต็มๆ เลยแม่!'
          ]),
          true
        );
        break;
      case 'bossCounter':
        playVoClip(
          'boss_counter.mp3',
          'อุ๊ยต๊าย! ตอบพลาดโดนบอสสวนกลับหักแต้มไปเลยจ้า ตั้งสติแล้วตอบใหม่ให้เป๊ะเด้อ!',
          true
        );
        break;
      case 'bossEnrage':
        playVoClip(
          'boss_enrage.mp3',
          'บอสคลั่งแล้วแม่! เลือดใกล้หมดแล้วแต่ตีเร็วขึ้นอีก ช่วยกันรุมปิดเกมให้ไวเลย!',
          true
        );
        break;
      case 'bossFail':
        playVoClip(
          'boss_fail.mp3',
          'แง้! หมดเวลาแล้วคุณน้า บอสหนีไปได้เฉยเลย รอบหน้ามารวมพลังแก้แค้นกันใหม่นะ!',
          true
        );
        break;
      case 'freezeTop':
        playVoClip(
          'freeze_top.mp3',
          'พายุแช่แข็งจ่าฝูงมาแล้วแม่! อันดับ 1 ถึง 3 แข็งเป็นไอติม ทีมข้างหลังรีบวิ่งแซงด่วน!',
          true
        );
        break;
      case 'badName':
        playVoClip(
          'bad_name.mp3',
          'หยุดก่อนคุณน้า! ชื่อนี้ไม่ผ่านเซ็นเซอร์นะจ๊ะ ตั้งชื่อเล่นสุภาพๆ น่ารักๆ หน่อยเด้อ!',
          true
        );
        break;
      case 'reconnect':
        playVoClip(
          'reconnect.mp3',
          'กลับมาแล้วจ้า! กู้คืนคะแนนกับไอเทมเดิมให้ครบทุกแต้ม ลุยต่อได้เลยแม่!',
          true
        );
        break;
      case 'fever':
        playVoClip(
          'fever_1.mp3',
          'ฟีเวอร์ไทม์มาแล้วแม่! คะแนนคูณสองทั้งห้อง 60 วินาที ลุยให้สุด!',
          true
        );
        break;
      case 'underdog':
        playVoClip(
          'underdog_1.mp3',
          'พลังฮึดท้ายตารางทำงาน! แจกแต้มกับไอเทมโจมตีให้ทีมหลังพลิกเกมแล้วจ้า!',
          true
        );
        break;
      case 'streak':
        playVoClip(
          'streak_1.mp3',
          `ไฟลุกท่วมสนามแล้วแม่! ${A} ตอบถูกติดกัน ${d.streak || 3} ข้อติด รับโบนัสแถมกล่องสุ่มไปเลย!`,
          false
        );
        break;
    }
  }

  const api = {
    unlock() {
      const c = ac();
      if (c && c.state === 'suspended') c.resume().catch(() => {});
      hideUnlockHint();
      const isPlayingNow = !!(bgmSource || (bgmAudioEl && !bgmAudioEl.paused));
      if (bgmMode !== 'none' && bgmOn && !muted && volume > 0 && !isPlayingNow) {
        const m = bgmMode;
        bgmMode = 'none';
        startBgm(m, true);
      }
      return c;
    },
    click()   { playSfx('click', 0.70); },
    pop()     { playSfx('pop', 0.80); },
    join()    { playSfx('join', 0.85); },
    correct() { playSfx('correct', 0.95); },
    partial() { playSfx('partial', 0.88); },
    wrong()   { playSfx('wrong', 0.90); },
    coin()    { playSfx('coin', 0.85); },
    item()    { playSfx('item', 0.95); },
    whoosh()  { playSfx('whoosh', 0.90); },
    stolen()  { playSfx('stolen', 0.92); },
    freeze()  { playSfx('freeze', 0.92); },
    crack()   { playSfx('crack', 0.95, 0.92 + Math.random() * 0.22); },
    shatter() { playSfx('shatter', 0.98); },
    block()   { playSfx('block', 0.95); },
    splat()   { playSfx('splat', 0.92); },
    dizzy()   { playSfx('dizzy', 0.90); },
    zap()     { playSfx('zap', 0.95); },
    potion()  { playSfx('potion', 0.92); },
    bonus()   { playSfx('bonus', 0.95); },
    fanfare() { playSfx('fanfare', 0.98); },
    drum()    { playSfx('drum', 0.92); },
    shutter() { playSfx('shutter', 0.95); },

    startBgm,
    stopBgm,
    speak: playVoClip,
    announce,
    onChange(fn) { if (typeof fn === 'function') listeners.add(fn); },

    get muted() { return muted || volume <= 0; },
    get bgmOn() { return bgmOn && bgmVolume > 0; },
    get sfxOn() { return sfxOn && sfxVolume > 0; },
    get voiceOn() { return voiceOn && voiceVolume > 0; },
    get volume() { return volume; },
    get volumePct() { return muted ? 0 : Math.round(volume * 100); },
    get autoplayBlocked() { return autoplayBlocked; },
    get tracks() { return BGM_TRACKS; },
    get bgmTrackId() { return bgmTrackId; },
    get bgmTrack() { return BGM_TRACKS.find(t => t.id === bgmTrackId) || BGM_TRACKS[0]; },

    setBgmTrack(id) {
      const found = BGM_TRACKS.find(t => t.id === id);
      if (!found) return this.bgmTrack;
      bgmTrackId = found.id;
      localStorage.setItem('sqa_bgm_track', bgmTrackId);
      if (!bgmOn || bgmVolume <= 0) {
        bgmOn = true;
        if (bgmVolume <= 0) { bgmVolume = 0.70; localStorage.setItem('sqa_vol_bgm', String(bgmVolume)); }
        localStorage.setItem('sqa_bgm', '1');
      }
      if (muted || volume <= 0) {
        muted = false;
        if (volume <= 0) { volume = 0.75; localStorage.setItem('sqa_volume', String(volume)); }
        localStorage.setItem('sqa_muted', '0');
      }
      applyGains();
      this.click();
      const targetMode = (bgmMode === 'none') ? 'play' : bgmMode;
      bgmPlayingFile = '';
      startBgm(targetMode === 'play' ? 'play' : targetMode, true);
      notifyChange();
      return found;
    },
    nextBgmTrack() {
      const idx = BGM_TRACKS.findIndex(t => t.id === bgmTrackId);
      const next = BGM_TRACKS[(idx + 1) % BGM_TRACKS.length];
      return this.setBgmTrack(next.id);
    },

    getChannelVolume(ch = 'master') {
      if (ch === 'bgm') return bgmVolume;
      if (ch === 'sfx') return sfxVolume;
      if (ch === 'voice') return voiceVolume;
      return volume;
    },
    getChannelPct(ch = 'master') {
      if (ch === 'master') return muted ? 0 : Math.round(volume * 100);
      if (ch === 'bgm') return (!bgmOn || muted) ? 0 : Math.round(bgmVolume * 100);
      if (ch === 'sfx') return (!sfxOn || muted) ? 0 : Math.round(sfxVolume * 100);
      if (ch === 'voice') return (!voiceOn || muted) ? 0 : Math.round(voiceVolume * 100);
      return 0;
    },

    setChannelVolume(ch, v, silent = false) {
      const next = Math.max(0, Math.min(1, Math.round(Number(v) * 100) / 100));
      if (ch === 'master') return this.setVolume(next, silent);

      if (next > 0 && (muted || volume <= 0)) {
        muted = false;
        if (volume <= 0) { volume = 0.75; localStorage.setItem('sqa_volume', String(volume)); }
        localStorage.setItem('sqa_muted', '0');
      }

      if (ch === 'bgm') {
        bgmVolume = next;
        localStorage.setItem('sqa_vol_bgm', String(bgmVolume));
        if (bgmVolume > 0 && !bgmOn) { bgmOn = true; localStorage.setItem('sqa_bgm', '1'); }
        applyGains();
        if (bgmVolume <= 0) { stopBgmNode(); hideUnlockHint(); }
        else if (bgmMode !== 'none' && !bgmSource && !(bgmAudioEl && !bgmAudioEl.paused)) {
          const m = bgmMode; bgmMode = 'none'; startBgm(m, true);
        }
      } else if (ch === 'sfx') {
        sfxVolume = next;
        localStorage.setItem('sqa_vol_sfx', String(sfxVolume));
        if (sfxVolume > 0 && !sfxOn) { sfxOn = true; localStorage.setItem('sqa_sfx', '1'); }
        applyGains();
        if (!silent && sfxVolume > 0) this.click();
      } else if (ch === 'voice') {
        voiceVolume = next;
        localStorage.setItem('sqa_vol_voice', String(voiceVolume));
        if (voiceVolume > 0 && !voiceOn) { voiceOn = true; localStorage.setItem('sqa_voice', '1'); }
        applyGains();
        if (voiceVolume <= 0 && currentVo) currentVo.pause();
      }
      notifyChange();
      return next;
    },
    channelUp(ch, step = 0.1) {
      const base = this.getChannelPct(ch) / 100;
      return this.setChannelVolume(ch, Math.min(1, Math.round((base + step) * 20) / 20));
    },
    channelDown(ch, step = 0.1) {
      const base = this.getChannelPct(ch) / 100;
      return this.setChannelVolume(ch, Math.max(0, Math.round((base - step) * 20) / 20));
    },
    resetVolumes() {
      muted = false; bgmOn = true; sfxOn = true; voiceOn = true;
      volume = 0.75; bgmVolume = 0.70; sfxVolume = 0.85; voiceVolume = 0.95;
      localStorage.setItem('sqa_muted', '0');
      localStorage.setItem('sqa_bgm', '1');
      localStorage.setItem('sqa_sfx', '1');
      localStorage.setItem('sqa_voice', '1');
      localStorage.setItem('sqa_volume', String(volume));
      localStorage.setItem('sqa_vol_bgm', String(bgmVolume));
      localStorage.setItem('sqa_vol_sfx', String(sfxVolume));
      localStorage.setItem('sqa_vol_voice', String(voiceVolume));
      applyGains();
      this.click();
      if (bgmMode !== 'none' && !bgmSource && !(bgmAudioEl && !bgmAudioEl.paused)) {
        const m = bgmMode; bgmMode = 'none'; startBgm(m, true);
      }
      notifyChange();
    },

    setVolume(v, silent = false) {
      const next = Math.max(0, Math.min(1, Math.round(Number(v) * 100) / 100));
      volume = next;
      localStorage.setItem('sqa_volume', String(volume));
      if (volume > 0 && muted) {
        muted = false;
        localStorage.setItem('sqa_muted', '0');
      }
      applyGains();
      if (volume <= 0) {
        stopBgmNode();
        if (currentVo) currentVo.pause();
        hideUnlockHint();
      } else if (bgmMode !== 'none' && bgmOn && bgmVolume > 0 && !bgmSource && !(bgmAudioEl && !bgmAudioEl.paused)) {
        const m = bgmMode; bgmMode = 'none'; startBgm(m, true);
      }
      if (!silent && volume > 0) this.click();
      notifyChange();
      return volume;
    },
    volumeUp(step = 0.1) {
      const base = muted ? 0 : volume;
      return this.setVolume(Math.min(1, Math.round((base + step) * 20) / 20));
    },
    volumeDown(step = 0.1) {
      const base = muted ? 0 : volume;
      return this.setVolume(Math.max(0, Math.round((base - step) * 20) / 20));
    },

    toggleMute() {
      if (muted || volume <= 0) {
        muted = false;
        if (volume <= 0) {
          volume = 0.75;
          localStorage.setItem('sqa_volume', String(volume));
        }
        localStorage.setItem('sqa_muted', '0');
        applyGains();
        this.click();
        if (bgmMode !== 'none' && bgmOn && bgmVolume > 0) { const m = bgmMode; bgmMode = 'none'; startBgm(m, true); }
      } else {
        muted = true;
        localStorage.setItem('sqa_muted', '1');
        if (currentVo) currentVo.pause();
        stopBgmNode();
        hideUnlockHint();
        applyGains();
      }
      notifyChange();
      return muted;
    },
    toggleBgm() {
      if (!bgmOn || bgmVolume <= 0) {
        bgmOn = true;
        if (bgmVolume <= 0) { bgmVolume = 0.70; localStorage.setItem('sqa_vol_bgm', String(bgmVolume)); }
        localStorage.setItem('sqa_bgm', '1');
        applyGains();
        if (bgmMode !== 'none' && !muted && volume > 0) { const m = bgmMode; bgmMode = 'none'; startBgm(m, true); }
      } else {
        bgmOn = false;
        localStorage.setItem('sqa_bgm', '0');
        stopBgmNode();
        hideUnlockHint();
      }
      notifyChange();
      return bgmOn;
    },
    toggleSfx() {
      if (!sfxOn || sfxVolume <= 0) {
        sfxOn = true;
        if (sfxVolume <= 0) { sfxVolume = 0.85; localStorage.setItem('sqa_vol_sfx', String(sfxVolume)); }
        localStorage.setItem('sqa_sfx', '1');
        applyGains();
        this.click();
      } else {
        sfxOn = false;
        localStorage.setItem('sqa_sfx', '0');
        applyGains();
      }
      notifyChange();
      return sfxOn;
    },
    toggleVoice() {
      if (!voiceOn || voiceVolume <= 0) {
        voiceOn = true;
        if (voiceVolume <= 0) { voiceVolume = 0.95; localStorage.setItem('sqa_vol_voice', String(voiceVolume)); }
        localStorage.setItem('sqa_voice', '1');
        applyGains();
        playVoClip('voice_on.mp3', 'เปิดเสียงพากย์พิธีกรสนามแล้วค่ะ!', true);
      } else {
        voiceOn = false;
        localStorage.setItem('sqa_voice', '0');
        if (currentVo) currentVo.pause();
        applyGains();
      }
      notifyChange();
      return voiceOn;
    }
  };
  return api;
})();
window.SFX = SFX;
['pointerdown', 'touchstart', 'keydown'].forEach(ev => {
  document.addEventListener(ev, () => {
    if (window.SFX && (SFX.autoplayBlocked || !document._sqaUnlocked)) {
      document._sqaUnlocked = true;
      SFX.unlock();
    }
  }, { passive: true });
});
