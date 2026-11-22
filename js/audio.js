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
  const sfxLastPlayed = new Map();
  const voCache = new Map();

  const SFX_LIST = [
    'click', 'pop', 'join', 'correct', 'partial', 'wrong', 'coin', 'item',
    'whoosh', 'stolen', 'freeze', 'crack', 'shatter', 'block', 'splat',
    'dizzy', 'zap', 'potion', 'bonus', 'fanfare', 'drum', 'shutter'
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
            ? `🏆 มงลงแชมป์อันดับ 1 ได้แก่ "${d.winner}" (${d.score} แต้ม) โซ๊ะมากแม่! ขอเสียงปรบมือ!`
            : '🏆 จบการแข่งขันแล้วจ้า! มงลงแชมป์แบบโซ๊ะมากแม่ ขอเสียงปรบมือดังๆ เลย!',
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
    shutter() { playSfx('shutter', 0.95); },

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
