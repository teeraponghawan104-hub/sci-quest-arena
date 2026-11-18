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
 * 3) เสียงพากย์ธรรมชาติ (26 ไฟล์ใน audio/vo/*.mp3):
 *    เสียงพากย์คู่ ชาย-หญิง (NiwatNeural & PremwadeeNeural) พร้อมระบบ Audio Ducking เบาเพลงอัตโนมัติ
 * ========================================================= */
const SFX = (() => {
  let ctx = null, master = null, bgmGain = null;
  let muted = localStorage.getItem('sqa_muted') === '1';
  let bgmOn = localStorage.getItem('sqa_bgm') !== '0';
  let voiceOn = localStorage.getItem('sqa_voice') !== '0';

  let bgmMode = 'none'; // 'none' | 'play' | 'bonus' | 'podium'
  let bgmSource = null;
  let bgmAudioEl = null;
  let currentVo = null;
  let lastVoAt = 0;

  const sfxBuffers = new Map();
  const sfxLoading = new Map();
  const voCache = new Map();

  const SFX_LIST = [
    'click', 'pop', 'join', 'correct', 'partial', 'wrong', 'coin', 'item',
    'whoosh', 'stolen', 'freeze', 'crack', 'shatter', 'block', 'splat',
    'dizzy', 'zap', 'potion', 'bonus', 'fanfare', 'drum'
  ];

  function ac() {
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.75;
        master.connect(ctx.destination);
        bgmGain = ctx.createGain();
        bgmGain.gain.value = 0.30;
        bgmGain.connect(ctx.destination);
        preloadAllSfx();
      }
      if (ctx.state === 'suspended') ctx.resume();
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
    ['bgm_play', 'bgm_bonus', 'bgm_podium'].forEach(name => loadBuffer(`audio/sfx/${name}.mp3`));
  }

  function playSfx(name, vol = 0.85, rate = 1.0) {
    if (muted) return;
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

  /* ---------------- 🎵 Studio Stereo BGM Loops ---------------- */
  function stopBgmNode() {
    if (bgmSource) {
      try { bgmSource.stop(); bgmSource.disconnect(); } catch (e) {}
      bgmSource = null;
    }
    if (bgmAudioEl) {
      try { bgmAudioEl.pause(); bgmAudioEl.currentTime = 0; } catch (e) {}
      bgmAudioEl = null;
    }
  }

  async function startBgm(mode = 'play') {
    if (bgmMode === mode && (bgmSource || bgmAudioEl)) return;
    bgmMode = mode;
    stopBgmNode();
    if (mode === 'none' || !bgmOn || muted) return;

    const track = { play: 'bgm_play', bonus: 'bgm_bonus', podium: 'bgm_podium' }[mode] || 'bgm_play';
    const url = `audio/sfx/${track}.mp3`;
    const c = ac();
    const buf = await loadBuffer(url);
    // ตรวจสอบว่าสถานะยังไม่เปลี่ยนระหว่างรอโหลด
    if (bgmMode !== mode || !bgmOn || muted) return;

    if (c && buf) {
      try {
        stopBgmNode();
        const src = c.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        src.connect(bgmGain);
        src.start(0);
        bgmSource = src;
        return;
      } catch (e) {}
    }
    if (typeof Audio !== 'undefined') {
      try {
        stopBgmNode();
        const a = new Audio(url);
        a.loop = true;
        a.volume = 0.25;
        bgmAudioEl = a;
        a.play().catch(() => {});
      } catch (e) {}
    }
  }

  function stopBgm() {
    bgmMode = 'none';
    stopBgmNode();
  }

  /* ---------------- 🎙️ เสียงพากย์ธรรมชาติ (Neural Thai Voice MP3) ---------------- */
  function showMcBubble(text) {
    let box = document.getElementById('mcAnnouncerBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'mcAnnouncerBox';
      box.style.cssText = 'position:fixed;bottom:14px;right:14px;z-index:240;max-width:min(90vw,390px);pointer-events:none;';
      document.body.appendChild(box);
    }
    box.innerHTML = `
      <div class="pop-in bg-[#333333] text-white px-4 py-2.5 rounded-[6px] shadow-[0_5px_0_#000] border-l-8 border-[#ffa602] flex items-center gap-2.5">
        <span class="text-2xl leading-none wiggle">🎙️</span>
        <div class="text-xs sm:text-sm font-bold leading-snug">
          <div class="text-[10px] font-black uppercase text-[#ffa602] tracking-wider">พิธีกรพากย์สนาม</div>
          <div>${text}</div>
        </div>
      </div>`;
    clearTimeout(box._t);
    box._t = setTimeout(() => { box.innerHTML = ''; }, 3900);
  }

  function setDucking(duck) {
    const vol = duck ? 0.10 : 0.30;
    if (bgmGain) bgmGain.gain.value = vol;
    if (bgmAudioEl) bgmAudioEl.volume = duck ? 0.08 : 0.25;
  }

  function playVoClip(filename, bubbleText, priority = false) {
    if (bubbleText) showMcBubble(bubbleText);
    if (muted || !voiceOn || !filename || typeof Audio === 'undefined') return;
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
      audio.volume = 0.95;
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
          `🔔 เปิดสนามแล้ว! สแกนการ์ดแล้วลุยกันเลย!`,
          true
        );
        break;
      case 'pause':
        playSfx('pop', 0.8);
        playVoClip('pause.mp3', '⏸️ เบรกเกมชั่วคราว วางมือถือแล้วหันมาฟังครูก่อนนะ!', true);
        break;
      case 'bonus':
        playSfx('bonus', 0.95);
        playVoClip(
          pickOne(['bonus_1.mp3', 'bonus_2.mp3']),
          '🚨 โจทย์โบนัสพิเศษจากครูมาแล้ว! รีบตอบชิงกล่องสุ่มไอเทม!',
          true
        );
        break;
      case 'giftAll':
        playSfx('item', 0.95);
        playVoClip('gift_all.mp3', '🎁 ครูใจป้ำแจกไอเทมสุ่มให้ทุกคนแล้ว เตรียมรับความชุลมุน!', true);
        break;
      case 'join':
        playVoClip(
          pickOne(['join_1.mp3', 'join_2.mp3']),
          `👋 ${A} ก้าวเข้าสู่สนามแล้ว เพื่อนๆ ระวังคะแนนไว้ให้ดี!`
        );
        break;
      case 'score':
        if (d.doubled) {
          playSfx('fanfare', 0.85);
          playVoClip('x2_score.mp3', `⚡ คูณสองทำงาน! ${A} ฟาดไปรวดเดียว +${pts} แต้ม!`, true);
        } else if (pts >= 280) {
          playSfx('correct', 0.9);
          playVoClip('big_score.mp3', `🔥 โกยแต้มก้อนใหญ่! ${A} เก็บไป +${pts} แต้ม!`);
        } else {
          showMcBubble(`✨ ${A} เก็บเพิ่มไป +${pts} แต้ม!`);
        }
        break;
      case 'gradePerfect':
        playVoClip(
          pickOne(['perfect_1.mp3', 'perfect_2.mp3']),
          '🎯 แม่นเหมือนจับวาง! รับไปเลยคะแนนเต็ม 100%!',
          true
        );
        break;
      case 'gradeClose':
        playVoClip('close_1.mp3', '👍 เกือบเป๊ะแล้วครับ! จัดไป 70% สวยงาม!', true);
        break;
      case 'gradePartial':
        playVoClip('partial_1.mp3', '🙂 พอมีเค้าโครงอยู่! เอาแต้มสะสมไป 40% นะ', true);
        break;
      case 'gradeMiss':
        playVoClip(
          pickOne(['miss_1.mp3', 'miss_2.mp3']),
          '🎺 ยังไม่ตรงประเด็น! ลองอ่านคำใบ้แล้วส่งใหม่อีกรอบ!',
          true
        );
        break;
      case 'steal':
        playVoClip(
          pickOne(['steal_1.mp3', 'steal_2.mp3']),
          `💸 แสบมาก! ${A} แอบฉกคะแนนของ ${B} ไป ${pts} แต้ม!`,
          true
        );
        break;
      case 'freeze':
        playVoClip('freeze_1.mp3', `❄️ พายุน้ำแข็งทำงาน! ${A} แช่แข็งหน้าจอของ ${B} แล้ว!`, true);
        break;
      case 'blind':
        playVoClip('blind_1.mp3', `💨 ระเบิดหมอกทำงาน! ${A} พ่นหมอกบังจอของ ${B} มืดตึ๊ดตื๋อ!`, true);
        break;
      case 'flip':
        playVoClip('flip_1.mp3', `🙃 โดนไวรัสจอตีลังกา! ${A} เสกหน้าจอของ ${B} กลับหัว 180°!`, true);
        break;
      case 'zap':
        playVoClip('zap_1.mp3', `🌩️ เปรี้ยง! ${A} ผ่าสายฟ้าใส่ ${B} แต้มปลิวหายไป ${pts} คะแนน!`, true);
        break;
      case 'boost':
        playVoClip('boost_1.mp3', `🧪 ${A} ดื่มน้ำยาวิทย์! รับโบนัส +${pts} แต้ม แถมส่องคำใบ้ฟรี!`, true);
        break;
      case 'block':
        playVoClip('block_1.mp3', `🛡️ ทำอะไรไม่ได้! ${B} มีโล่ป้องกัน สะท้อนท่าป่วนของ ${A} ได้แบบหล่อๆ!`, true);
        break;
      case 'podium':
        playVoClip(
          'podium_1.mp3',
          d.winner ? `🏆 แชมป์อันดับ 1 ได้แก่ "${d.winner}" (${d.score} แต้ม) ขอเสียงปรบมือ!` : '🏆 จบการแข่งขัน! ขอแสดงความยินดีกับแชมป์บนโพเดียม!',
          true
        );
        break;
    }
  }

  return {
    unlock() {
      const c = ac();
      if (bgmMode !== 'none' && bgmOn && !muted && !bgmSource && !bgmAudioEl) {
        const m = bgmMode; bgmMode = 'none'; startBgm(m);
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

    startBgm,
    stopBgm,
    speak: playVoClip,
    announce,

    get muted() { return muted; },
    get bgmOn() { return bgmOn; },
    get voiceOn() { return voiceOn; },

    toggleMute() {
      muted = !muted;
      localStorage.setItem('sqa_muted', muted ? '1' : '0');
      if (muted) {
        if (currentVo) currentVo.pause();
        stopBgmNode();
      } else {
        this.click();
        if (bgmMode !== 'none' && bgmOn) { const m = bgmMode; bgmMode = 'none'; startBgm(m); }
      }
      return muted;
    },
    toggleBgm() {
      bgmOn = !bgmOn;
      localStorage.setItem('sqa_bgm', bgmOn ? '1' : '0');
      if (!bgmOn) stopBgmNode();
      else if (bgmMode !== 'none') { const m = bgmMode; bgmMode = 'none'; startBgm(m); }
      return bgmOn;
    },
    toggleVoice() {
      voiceOn = !voiceOn;
      localStorage.setItem('sqa_voice', voiceOn ? '1' : '0');
      if (!voiceOn && currentVo) currentVo.pause();
      else if (voiceOn) playVoClip('voice_on.mp3', '🎙️ เปิดเสียงพากย์พิธีกรสนามแล้วค่ะ!', true);
      return voiceOn;
    }
  };
})();
document.addEventListener('pointerdown', () => SFX.unlock(), { once: true });
