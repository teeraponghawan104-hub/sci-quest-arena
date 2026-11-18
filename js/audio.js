/* =========================================================
 * Sci-Quest! — ระบบเสียงเกมโชว์ (Kahoot! & TV Variety Style)
 * ---------------------------------------------------------
 * 1) Game Show SFX กวนๆ แบบรายการเกมโชว์ (ไม่ต้องพึ่งเสียงหุ่นยนต์ TTS!):
 *    - Sad Trombone (แต่ว-แต๊ว-แต๋ว-แต๊ววว~) ตอนตอบผิด/โดนขโมยแต้ม
 *    - DJ Airhorn & Brass Hit ตอนได้คะแนนเต็ม/ชนะโบนัส
 *    - Boxing Bell (ระฆังมวย เป๊ง-เป๊ง!) ตอนเริ่มเกม
 *    - Red Alert Siren + Drumroll ตอนครูปล่อยโจทย์โบนัสพิเศษ
 *    - Cartoon Boing & Slide Whistle ตอนโดนไอเทมแกล้ง
 * 2) เพลงประกอบ (BGM) โทน Marimba & Sub-Bass นุ่มๆ สไตล์ Kahoot!
 *    + เพลงจังหวะเร้าใจตอนปล่อยโจทย์โบนัสพิเศษ
 * 3) แถบข้อความพากย์สนามบนหน้าจอ (ส่วนเสียงพูด TTS ปิดไว้เป็นค่าเริ่มต้น
 *    หากเปิดจะใช้โทนเสียงธรรมชาติ pitch 1.0 พูดเฉพาะคำประกาศสั้นๆ)
 * ========================================================= */
const SFX = (() => {
  let ctx = null, master = null, bgmGain = null, noiseBuf = null;
  let muted = localStorage.getItem('sqa_muted') === '1';
  let bgmOn = localStorage.getItem('sqa_bgm') !== '0';
  // ปิดเสียงพูด TTS หุ่นยนต์เป็นค่าเริ่มต้น ใช้เสียงเอฟเฟกต์เกมโชว์กวนๆ แทน!
  let voiceOn = localStorage.getItem('sqa_voice') === '1';
  let bgmMode = 'none';
  let bgmTimer = null;
  let bgmStep = 0;
  let thVoice = null;

  function ac() {
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.55;
        master.connect(ctx.destination);
        bgmGain = ctx.createGain();
        bgmGain.gain.value = 0.20;
        bgmGain.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { return null; }
    return ctx;
  }

  function env(g, t, a, d, v) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  function tone(f, { at = 0, dur = .15, type = 'sine', vol = .25, to = null, attack = .01, lp = 0, vib = 0, dest = null } = {}) {
    if (muted) return;
    const c = ac(); if (!c) return;
    const t = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);

    // ลูกคอ Vibrato (เช่น เสียงทรอมโบนแป้ก Wah-Wah-Waaaah)
    if (vib > 0) {
      const lfo = c.createOscillator();
      const lfoG = c.createGain();
      lfo.frequency.value = 6;
      lfoG.gain.value = vib;
      lfo.connect(lfoG);
      lfoG.connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + attack + dur + .05);
    }

    env(g, t, attack, dur, vol);

    if (lp > 0) {
      const flt = c.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.setValueAtTime(lp, t);
      o.connect(flt);
      flt.connect(g);
    } else {
      o.connect(g);
    }
    g.connect(dest || master);
    o.start(t);
    o.stop(t + attack + dur + .05);
  }

  function noise({ at = 0, dur = .3, vol = .3, freq = 1000, q = 1, type = 'bandpass', to = null, dest = null } = {}) {
    if (muted) return;
    const c = ac(); if (!c) return;
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate * 1.5, c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = c.currentTime + at, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    f.Q.value = q; env(g, t, .01, dur, vol);
    s.connect(f); f.connect(g); g.connect(dest || master);
    s.start(t); s.stop(t + dur + .08);
  }

  const seq = (arr, step, o) => arr.forEach((f, i) => f && tone(f, { at: i * step, ...o }));

  /* ---------------- 🎺 เอฟเฟกต์เสียงกวนๆ สไตล์รายการเกมโชว์ ---------------- */
  // 1. ทรอมโบนแป้ก (Wah-Wah-Wah-Waaaaah~) เวลาตอบผิดหรือโดนแกล้ง
  function sadTrombone() {
    tone(293.7, { at: 0.00, dur: .24, type: 'sawtooth', vol: .22, to: 277.2, lp: 950 });
    tone(277.2, { at: 0.27, dur: .24, type: 'sawtooth', vol: .22, to: 261.6, lp: 950 });
    tone(261.6, { at: 0.54, dur: .24, type: 'sawtooth', vol: .22, to: 246.9, lp: 950 });
    tone(246.9, { at: 0.81, dur: .65, type: 'sawtooth', vol: .24, to: 207.7, lp: 850, vib: 8 });
  }

  // 2. แตร DJ Airhorn (ปู๊น! ปู๊น! ปู๊นนนน!) เวลาได้คะแนนเต็มหรือแจกไอเทม
  function airhorn() {
    const blast = (at, dur) => {
      [480, 720, 1010].forEach(f => tone(f, { at, dur, type: 'sawtooth', vol: .11, to: f * 0.98, lp: 2400 }));
    };
    blast(0.00, 0.11);
    blast(0.14, 0.11);
    blast(0.28, 0.42);
  }

  // 3. ระฆังมวยเปิดสนาม (เป๊ง! เป๊ง! เป๊ง!)
  function boxingBell() {
    [0, 0.18].forEach(at => {
      tone(1318.5, { at, dur: .45, type: 'sine', vol: .25 });
      tone(2637.0, { at, dur: .25, type: 'triangle', vol: .12 });
      tone(1975.5, { at, dur: .35, type: 'sine', vol: .10 });
    });
  }

  // 4. ไซเรนโจทย์โบนัสพิเศษ (วี๊-หว่อ + กลองรัว)
  function sirenAlert() {
    tone(520, { at: 0.00, dur: .22, type: 'triangle', vol: .22, to: 880 });
    tone(880, { at: 0.22, dur: .22, type: 'triangle', vol: .22, to: 520 });
    tone(520, { at: 0.44, dur: .22, type: 'triangle', vol: .24, to: 980 });
    noise({ at: 0.65, dur: .2, vol: .2, freq: 1800 });
  }

  // 5. สปริงเด้งดึ๋งกวนๆ (Boing~) เวลาโดนไวรัสจอตีลังกา
  function boing() {
    tone(160, { at: 0, dur: .38, type: 'sine', vol: .3, to: 620, vib: 28 });
    tone(320, { at: .05, dur: .32, type: 'triangle', vol: .15, to: 880, vib: 22 });
  }

  // 6. นกหวีดร่วง (Slide Whistle ฟิ้ววว~ตุ๊บ!) เวลาโดนขโมยแต้ม
  function slideWhistleDown() {
    tone(1480, { at: 0, dur: .38, type: 'sine', vol: .24, to: 260 });
    tone(110, { at: .39, dur: .12, type: 'triangle', vol: .32, to: 55 });
  }

  /* ---------------- 🎵 ระบบเพลงประกอบ (Kahoot! Warm Marimba & Bonus Groove) ---------------- */
  const PATTERNS = {
    play: {
      interval: 240, // จังหวะ Marimba นุ่มๆ สไตล์ Kahoot Lobby/Gameplay
      bass: [130.8, 0, 196.0, 0, 146.8, 0, 220.0, 0, 164.8, 0, 246.9, 0, 196.0, 0, 146.8, 196.0],
      lead: [523.3, 659.3, 784.0, 0, 587.3, 784.0, 880.0, 0, 659.3, 784.0, 987.8, 0, 784.0, 659.3, 587.3, 0]
    },
    bonus: {
      interval: 165, // จังหวะเร้าใจเมื่อปล่อยโจทย์โบนัสพิเศษ!
      bass: [164.8, 164.8, 196.0, 164.8, 220.0, 220.0, 246.9, 196.0, 164.8, 164.8, 246.9, 220.0, 293.7, 261.6, 246.9, 196.0],
      lead: [659.3, 784.0, 987.8, 659.3, 880.0, 987.8, 1174.7, 987.8, 1318.5, 1174.7, 987.8, 880.0, 1174.7, 987.8, 784.0, 987.8]
    },
    podium: {
      interval: 215,
      bass: [130.8, 0, 164.8, 196.0, 261.6, 0, 196.0, 164.8, 174.6, 0, 220.0, 261.6, 196.0, 0, 246.9, 196.0],
      lead: [523.3, 659.3, 784.0, 1046.5, 0, 784.0, 1046.5, 1318.5, 880.0, 1046.5, 1174.7, 1318.5, 987.8, 784.0, 1174.7, 1046.5]
    }
  };

  function tickBgm() {
    if (muted || !bgmOn || bgmMode === 'none') return;
    const c = ac(); if (!c) return;
    const p = PATTERNS[bgmMode] || PATTERNS.play;
    const idx = bgmStep % p.bass.length;
    const bFreq = p.bass[idx];
    const lFreq = p.lead[idx];
    const isBonus = bgmMode === 'bonus';

    if (bFreq) {
      tone(bFreq, { dur: isBonus ? .13 : .20, type: 'triangle', vol: .28, lp: 650, dest: bgmGain });
    }
    if (lFreq) {
      // ใช้ sine + triangle กรองความถี่สูงออก ให้เสียงเหมือนระนาดไม้ Marimba ของ Kahoot ไม่แหลมบาดหู
      tone(lFreq, { dur: isBonus ? .11 : .15, type: 'sine', vol: .18, dest: bgmGain });
      tone(lFreq * 2, { dur: .04, type: 'triangle', vol: .05, dest: bgmGain });
    }
    if (idx % 4 === 0) {
      tone(95, { dur: .07, type: 'sine', vol: .30, to: 42, dest: bgmGain });
    } else if (isBonus && idx % 2 === 1) {
      noise({ dur: .035, vol: .08, freq: 5500, type: 'highpass', dest: bgmGain });
    }
    bgmStep++;
  }

  function startBgm(mode = 'play') {
    if (bgmMode === mode && bgmTimer) return;
    bgmMode = mode;
    if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
    if (mode === 'none' || !bgmOn || muted) return;
    const p = PATTERNS[mode] || PATTERNS.play;
    bgmStep = 0;
    bgmTimer = setInterval(tickBgm, p.interval);
  }

  function stopBgm() {
    bgmMode = 'none';
    if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
  }

  /* ---------------- 💬 แถบพากย์สนามกวนๆ + เสียงประกาศสั้นกระชับ ---------------- */
  function loadThaiVoice() {
    if (!window.speechSynthesis) return;
    const voices = speechSynthesis.getVoices();
    thVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('th') && /natural|premwadee|niwat/i.test(v.name))
           || voices.find(v => v.lang && v.lang.toLowerCase().startsWith('th'))
           || null;
  }
  if (window.speechSynthesis) {
    loadThaiVoice();
    speechSynthesis.onvoiceschanged = loadThaiVoice;
  }

  function showMcBubble(text) {
    let box = document.getElementById('mcAnnouncerBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'mcAnnouncerBox';
      box.style.cssText = 'position:fixed;bottom:14px;right:14px;z-index:240;max-width:min(90vw,380px);pointer-events:none;';
      document.body.appendChild(box);
    }
    box.innerHTML = `
      <div class="pop-in bg-[#333333] text-white px-4 py-2.5 rounded-[6px] shadow-[0_5px_0_#000] border-l-8 border-[#ffa602] flex items-center gap-2.5">
        <span class="text-2xl leading-none wiggle">📢</span>
        <div class="text-xs sm:text-sm font-bold leading-snug">
          <div class="text-[10px] font-black uppercase text-[#ffa602] tracking-wider">พากย์สดข้างสนาม</div>
          <div>${text}</div>
        </div>
      </div>`;
    clearTimeout(box._t);
    box._t = setTimeout(() => { box.innerHTML = ''; }, 3800);
  }

  let lastSpeakAt = 0;
  // หากผู้ใช้กดเปิดปุ่ม 🎙️ เสียงพูด จะอ่านเฉพาะคำประกาศสั้นๆ ด้วยโทนเสียงธรรมชาติ (pitch 1.0, rate 1.0)
  function speakShort(shortVoiceText, bubbleText, priority = false) {
    if (bubbleText) showMcBubble(bubbleText);
    if (muted || !voiceOn || !window.speechSynthesis || !shortVoiceText) return;
    const now = Date.now();
    if (!priority && now - lastSpeakAt < 2200) return;
    lastSpeakAt = now;
    try {
      if (priority) speechSynthesis.cancel();
      if (!thVoice) loadThaiVoice();
      const u = new SpeechSynthesisUtterance(shortVoiceText);
      u.lang = 'th-TH';
      if (thVoice) u.voice = thVoice;
      u.rate = 1.0;
      u.pitch = 1.0;
      u.volume = 0.95;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  const pickOne = arr => arr[Math.floor(Math.random() * arr.length)];

  // เล่นเสียงเอฟเฟกต์เกมโชว์กวนๆ + แสดงป้ายพากย์ข้างสนาม
  function announce(kind, d = {}) {
    const A = d.a || 'ผู้เล่น', B = d.b || 'เพื่อน', pts = d.pts || 0;
    switch (kind) {
      case 'start':
        boxingBell();
        speakShort('เริ่มการแข่งขัน', '🔔 เป๊ง! เป๊ง! เปิดสนามแล้ว สแกนการ์ดลุยกันเลย!', true);
        break;
      case 'pause':
        tone(440, { dur: .18, type: 'triangle', vol: .2, to: 220 });
        speakShort('หยุดเกมชั่วคราว', '⏸️ เบรกเกมชั่วคราว หันมาฟังครูก่อนนะ!', true);
        break;
      case 'bonus':
        sirenAlert();
        speakShort('คำถามโบนัสพิเศษ', '🚨 ประกาศด่วน! โจทย์โบนัสพิเศษมาแล้ว รีบตอบชิงกล่องสุ่ม!', true);
        break;
      case 'giftAll':
        airhorn();
        speakShort('แจกไอเทมพิเศษทุกคน', '🎁 ครูแจกไอเทมสุ่มให้ทุกคนในห้องแล้ว เตรียมรับความชุลมุน!', true);
        break;
      case 'join':
        showMcBubble(pickOne([
          `👋 ${A} ก้าวเข้าสู่สนามแล้ว พร้อมบวก!`,
          `🔥 ${A} มาแล้ว! เพื่อนๆ ระวังแต้มไว้ให้ดี!`
        ]));
        break;
      case 'score':
        if (d.doubled || pts >= 280) {
          airhorn();
          speakShort(`${A} ได้ ${pts} คะแนน`, `🎺 ปู๊นนน! ${A} ฟาดไปรวดเดียว +${pts} แต้ม!`);
        } else {
          showMcBubble(`✨ ${A} เก็บเพิ่มไป +${pts} แต้ม!`);
        }
        break;
      case 'gradePerfect':
        airhorn();
        speakShort('ถูกต้อง คะแนนเต็ม', pickOne([
          '🎺 ปู๊นนน! แม่นเหมือนจับวาง รับไปเลยเต็ม 100%!',
          '🔥 ความรู้แน่นปึ้ก! จัดไปคะแนนเต็ม!'
        ]), true);
        break;
      case 'gradeClose':
        speakShort('ใกล้เคียงมาก', '👍 เกือบเป๊ะแล้ว! รับไป 70% สวยๆ!', true);
        break;
      case 'gradePartial':
        speakShort('พอใช้ได้', '🙂 พอมีเค้าโครง! เอาแต้มไป 40%!', true);
        break;
      case 'gradeMiss':
        sadTrombone();
        speakShort('ลองใหม่อีกครั้ง', pickOne([
          '🎺 แต่ว-แต๊ว-แต๋ว-แต๊ววว~ ยังไม่ตรงประเด็น ลองเติมคำสำคัญอีกนิด!',
          '😅 เกือบแล้ว... เกือบออกทะเลแล้ว! ดูคำใบ้แล้วลองส่งใหม่เลย!'
        ]), true);
        break;
      case 'steal':
        slideWhistleDown();
        speakShort(`${A} ขโมยคะแนน`, `💸 ฟิ้ววว~ ${A} ฉกแต้มของ ${B} ไปหน้าตาเฉย ${pts} แต้ม!`, true);
        break;
      case 'freeze':
        speakShort(`${B} ถูกแช่แข็ง`, `❄️ ${A} ส่งพายุน้ำแข็งแช่แข็งหน้าจอของ ${B} แล้ว! รีบทุบด่วน!`, true);
        break;
      case 'blind':
        speakShort('ระเบิดหมอกทำงาน', `💨 ${A} ปาระเบิดหมอกบังจอของ ${B} มืดตึ๊ดตื๋อ!`, true);
        break;
      case 'flip':
        boing();
        speakShort('ไวรัสจอตีลังกา', `🙃 ดึ๋งงง! ${A} เสกหน้าจอของ ${B} ตีลังกากลับหัว 180 องศา!`, true);
        break;
      case 'zap':
        speakShort('สายฟ้าฟาด', `🌩️ เปรี้ยง! ${A} ผ่าสายฟ้าใส่ ${B} แต้มหายไป ${pts} คะแนน!`, true);
        break;
      case 'boost':
        speakShort('น้ำยาวิทย์ทำงาน', `🧪 หวานเจี๊ยบ! ${A} ดื่มน้ำยาวิทย์ บวกฟรี +${pts} แต้ม & ส่องคำใบ้!`, true);
        break;
      case 'block':
        speakShort('โล่ป้องกันทำงาน', `🛡️ เป๊ง! ${B} กางโล่สะท้อนท่าป่วนของ ${A} ได้แบบหล่อๆ!`, true);
        break;
      case 'podium':
        airhorn();
        speakShort(
          d.winner ? `ผู้ชนะคือ ${d.winner}` : 'จบการแข่งขัน',
          d.winner ? `🏆 แชมป์อันดับ 1 ได้แก่ "${d.winner}" (${d.score} แต้ม) ขอเสียงปรบมือ!` : '🏆 จบการแข่งขัน! มาดูโฉมหน้าผู้ชนะบนโพเดียม!',
          true
        );
        break;
    }
  }

  return {
    unlock() {
      const c = ac();
      if (bgmMode !== 'none' && bgmOn && !muted && !bgmTimer) startBgm(bgmMode);
      return c;
    },
    click()   { tone(660, { dur: .06, type: 'triangle', vol: .15, to: 900 }); },
    pop()     { tone(380, { dur: .12, vol: .25, to: 900 }); },
    join()    { seq([523, 659, 784], .07, { dur: .12, type: 'triangle', vol: .2 }); },
    correct() { seq([523, 659, 784, 1047], .08, { dur: .18, type: 'triangle', vol: .24 }); tone(1568, { at: .34, dur: .35, vol: .12 }); },
    partial() { seq([523, 659, 784], .1, { dur: .18, type: 'triangle', vol: .2 }); },
    wrong()   { sadTrombone(); },
    coin()    { tone(988, { dur: .08, type: 'triangle', vol: .18 }); tone(1319, { at: .08, dur: .28, type: 'triangle', vol: .18 }); },
    item()    { seq([784, 988, 1175, 1568, 1976], .06, { dur: .22, vol: .18 }); noise({ dur: .5, vol: .04, freq: 7000, type: 'highpass' }); },
    whoosh()  { noise({ dur: .4, vol: .3, freq: 300, to: 3200, q: 2 }); },
    stolen()  { slideWhistleDown(); },
    freeze()  { noise({ dur: .8, vol: .22, freq: 6000, to: 1200, q: 4 }); seq([2093, 1760, 1568, 1319, 1047], .08, { dur: .25, vol: .08 }); },
    crack()   { noise({ dur: .08, vol: .5, freq: 2500, q: .8 }); tone(170, { dur: .08, type: 'triangle', vol: .2, to: 70 }); },
    shatter() { noise({ dur: .6, vol: .4, freq: 4500, type: 'highpass' }); seq([2637, 2093, 3136, 2349, 2794], .04, { dur: .16, type: 'triangle', vol: .1 }); },
    block()   { tone(220, { dur: .08, type: 'triangle', vol: .2 }); tone(1046.5, { at: .04, dur: .4, type: 'sine', vol: .22, to: 784 }); },
    splat()   { noise({ dur: .42, vol: .38, freq: 550, to: 160, q: 1.4 }); tone(220, { dur: .32, type: 'sawtooth', vol: .18, to: 70, lp: 600 }); },
    dizzy()   { boing(); },
    zap()     { noise({ dur: .5, vol: .45, freq: 3200, to: 350, q: .7 }); tone(1100, { dur: .24, type: 'sawtooth', vol: .2, to: 65, lp: 1800 }); },
    potion()  { seq([392, 523, 659, 784, 1047, 1319], .055, { dur: .14, type: 'sine', vol: .22 }); },
    bonus()   { sirenAlert(); },
    fanfare() { seq([523, 523, 523, 698, 880, 784, 880, 1047], .14, { dur: .24, type: 'triangle', vol: .22 }); },
    drum()    { boxingBell(); },
    sadTrombone,
    airhorn,
    boxingBell,
    sirenAlert,
    boing,
    slideWhistleDown,

    startBgm,
    stopBgm,
    speak: speakShort,
    announce,

    get muted() { return muted; },
    get bgmOn() { return bgmOn; },
    get voiceOn() { return voiceOn; },

    toggleMute() {
      muted = !muted;
      localStorage.setItem('sqa_muted', muted ? '1' : '0');
      if (muted) {
        if (window.speechSynthesis) speechSynthesis.cancel();
      } else {
        this.click();
      }
      return muted;
    },
    toggleBgm() {
      bgmOn = !bgmOn;
      localStorage.setItem('sqa_bgm', bgmOn ? '1' : '0');
      if (!bgmOn && bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
      else if (bgmOn && bgmMode !== 'none') { const m = bgmMode; bgmMode = 'none'; startBgm(m); }
      return bgmOn;
    },
    toggleVoice() {
      voiceOn = !voiceOn;
      localStorage.setItem('sqa_voice', voiceOn ? '1' : '0');
      if (!voiceOn && window.speechSynthesis) speechSynthesis.cancel();
      else if (voiceOn) speakShort('เปิดเสียงผู้ประกาศ', '🎙️ เปิดเสียงพูดผู้ประกาศแล้ว', true);
      return voiceOn;
    }
  };
})();
document.addEventListener('pointerdown', () => SFX.unlock(), { once: true });
