/* =========================================================
 * Sci-Quest! — ระบบเสียงแบบครบเครื่อง:
 * 1) SFX เอฟเฟกต์เสียงสังเคราะห์ (Web Audio API)
 * 2) BGM เพลงประกอบสไตล์ Kahoot! + เพลงตื่นเต้นตอนปล่อยโจทย์โบนัสพิเศษ
 * 3) Voice MC พิธีกรพากย์เสียงภาษาไทยกวนๆ (Web Speech API + แถบคำพูดพิธีกร)
 * ========================================================= */
const SFX = (() => {
  let ctx = null, master = null, bgmGain = null, noiseBuf = null;
  let muted = localStorage.getItem('sqa_muted') === '1';
  let bgmOn = localStorage.getItem('sqa_bgm') !== '0';      // เปิดเพลงประกอบเป็นค่าเริ่มต้น
  let voiceOn = localStorage.getItem('sqa_voice') !== '0';  // เปิดเสียงพากย์กวนๆ เป็นค่าเริ่มต้น
  let bgmMode = 'none'; // 'none' | 'play' | 'bonus' | 'podium'
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
        bgmGain.gain.value = 0.22;
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

  function tone(f, { at = 0, dur = .15, type = 'sine', vol = .25, to = null, attack = .01, dest = null } = {}) {
    if (muted) return;
    const c = ac(); if (!c) return;
    const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    env(g, t, attack, dur, vol);
    o.connect(g); g.connect(dest || master);
    o.start(t); o.stop(t + attack + dur + .04);
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

  /* ---------------- 🎵 ระบบเพลงประกอบ (BGM Sequencer) ---------------- */
  // โน้ตเพลงสไตล์ Kahoot! (Play / Bonus / Podium)
  const PATTERNS = {
    play: {
      interval: 230, // ~130 BPM 8th notes
      bass: [146.8, 0, 146.8, 174.6, 196.0, 0, 220.0, 196.0, 146.8, 0, 146.8, 220.0, 261.6, 220.0, 196.0, 174.6],
      lead: [587.3, 0, 698.5, 587.3, 784.0, 0, 880.0, 784.0, 587.3, 698.5, 784.0, 880.0, 1046.5, 880.0, 784.0, 0]
    },
    bonus: {
      interval: 165, // ~180 BPM เร้าใจตอนปล่อยโจทย์โบนัสพิเศษ!
      bass: [164.8, 164.8, 196.0, 164.8, 220.0, 220.0, 246.9, 196.0, 164.8, 164.8, 246.9, 220.0, 293.7, 261.6, 246.9, 196.0],
      lead: [659.3, 784.0, 987.8, 659.3, 880.0, 987.8, 1174.7, 987.8, 1318.5, 1174.7, 987.8, 880.0, 1174.7, 987.8, 784.0, 987.8]
    },
    podium: {
      interval: 210,
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
      tone(bFreq, { dur: isBonus ? .13 : .18, type: isBonus ? 'sawtooth' : 'triangle', vol: isBonus ? .28 : .32, dest: bgmGain });
    }
    if (lFreq) {
      tone(lFreq, { dur: isBonus ? .11 : .14, type: isBonus ? 'square' : 'sine', vol: isBonus ? .16 : .2, dest: bgmGain });
    }
    // จังหวะกลองเบาๆ
    if (idx % 4 === 0) {
      tone(110, { dur: .08, type: 'sine', vol: .35, to: 42, dest: bgmGain });
    } else if (isBonus && idx % 2 === 1) {
      noise({ dur: .04, vol: .12, freq: 5000, type: 'highpass', dest: bgmGain });
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

  /* ---------------- 🎙️ ระบบเสียงพากย์กวนๆ & เสียงประกาศ (Web Speech API) ---------------- */
  function loadThaiVoice() {
    if (!window.speechSynthesis) return;
    const voices = speechSynthesis.getVoices();
    thVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('th') && /natural|premwadee|niwat|google/i.test(v.name))
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
        <span class="text-2xl leading-none wiggle">🎙️</span>
        <div class="text-xs sm:text-sm font-bold leading-snug">
          <div class="text-[10px] font-black uppercase text-[#ffa602] tracking-wider">พิธีกรภาคสนาม</div>
          <div>${text}</div>
        </div>
      </div>`;
    clearTimeout(box._t);
    box._t = setTimeout(() => { box.innerHTML = ''; }, 4200);
  }

  let lastSpeakAt = 0;
  function speak(text, { priority = false, pitch = 1.12, rate = 1.14, showBubble = true } = {}) {
    if (!text) return;
    if (showBubble) showMcBubble(text);
    if (muted || !voiceOn || !window.speechSynthesis) return;
    const now = Date.now();
    if (!priority && now - lastSpeakAt < 1800) return; // กันเสียงพากย์พูดซ้อนกันรัวเกินไป
    lastSpeakAt = now;

    try {
      if (priority) speechSynthesis.cancel();
      if (!thVoice) loadThaiVoice();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'th-TH';
      if (thVoice) u.voice = thVoice;
      u.rate = rate;
      u.pitch = pitch;
      u.volume = 1.0;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  const pickOne = arr => arr[Math.floor(Math.random() * arr.length)];

  // คลังประโยคพากย์กวนๆ สไตล์เกมโชว์
  function announce(kind, d = {}) {
    const A = d.a || 'ผู้เล่น', B = d.b || 'เพื่อน', pts = d.pts || 0;
    switch (kind) {
      case 'start':
        speak(pickOne([
          'การแข่งขันเริ่มขึ้นแล้วครับ! สแกนการ์ดแล้วพิมพ์คำตอบลุยกันเลย!',
          'เปิดสนามแล้วครับวัยรุ่น! ใครความรู้แน่นหรือใครสายป่วน เดี๋ยวรู้กัน!'
        ]), { priority: true });
        break;
      case 'pause':
        speak('ครูสั่งเบรกเกมชั่วคราวครับ! วางมือถือแล้วหันมาฟังครูก่อนนะ!', { priority: true });
        break;
      case 'bonus':
        speak(pickOne([
          'ประกาศด่วน! ครูปล่อยโจทย์โบนัสพิเศษแล้วครับ! รีบตอบให้ไว กล่องสุ่มไอเทมรออยู่!',
          'สัญญาณโบนัสดังแล้วครับ! ใครอยากได้ไอเทมไปแกล้งเพื่อน รีบพิมพ์ตอบด่วนเลย!',
          'โจทย์พิเศษมาแล้วจ้า! ตอบให้ผ่านห้าสิบเปอร์เซ็นต์ รับกล่องสุ่มไปป่วนเพื่อนทันที!'
        ]), { priority: true, pitch: 1.18, rate: 1.16 });
        break;
      case 'giftAll':
        speak('ใจป้ำสุดๆ! ครูแจกไอเทมสุ่มให้ทุกคนในห้องแล้วครับ เตรียมตัวรับความชุลมุนได้เลย!', { priority: true });
        break;
      case 'join':
        speak(pickOne([
          `เอาล่ะครับ ${A} ก้าวเข้าสู่สนามแล้ว หน้าตาดูพร้อมบวกมาก!`,
          `ยินดีต้อนรับ ${A} ครับ มาดูกันว่าจะรอดหรือจะร่วง!`,
          `โอ้โห ${A} มาแล้วครับ เพื่อนๆ ระวังคะแนนในกระเป๋าไว้ให้ดี!`
        ]));
        break;
      case 'score':
        if (d.doubled) {
          speak(`คูณสองทำงาน! ${A} ฟาดรวดเดียว ${pts} คะแนน เพื่อนมองตาปริบๆ เลยครับ!`, { priority: true });
        } else if (pts >= 280) {
          speak(pickOne([
            `ตึงจัด! ${A} พิชิตการ์ดแดง รับไปเต็มๆ ${pts} คะแนน!`,
            `สมองระดับอัจฉริยะ! ${A} โกยเพิ่มไปอีก ${pts} แต้มครับผม!`
          ]));
        } else {
          speak(pickOne([
            `${A} เก็บเพิ่มไป ${pts} แต้ม แบบชิลๆ!`,
            `มาเรื่อยๆ ครับ ${A} บวกเพิ่มอีก ${pts} คะแนน!`
          ]));
        }
        break;
      case 'gradePerfect':
        speak(pickOne([
          'แม่นเหมือนจับวาง! เอาไปเลยเต็มร้อยเปอร์เซ็นต์!',
          'ตึงจัดครับน้อง! ความรู้แน่นปึ้ก เอาคะแนนเต็มไปเลย!',
          'ตอบดีจนครูน้ำตาไหล! รับคะแนนเต็มร้อยเปอร์เซ็นต์!'
        ]), { priority: true });
        break;
      case 'gradeClose':
        speak(pickOne([
          'เกือบเป๊ะแล้ว! เอาไปเจ็ดสิบเปอร์เซ็นต์ สวยงามพระรามแปด!',
          'ถือว่าทำการบ้านมาดี! จัดไปเจ็ดสิบเปอร์เซ็นต์ครับผม!'
        ]), { priority: true });
        break;
      case 'gradePartial':
        speak(pickOne([
          'พอมีเค้าโครงอยู่! เอาแต้มปลอบใจไปสี่สิบเปอร์เซ็นต์!',
          'เฉียดๆ ครับ! ได้มาสี่สิบเปอร์เซ็นต์ก็ยังดีกว่ามือเปล่านะ!'
        ]), { priority: true });
        break;
      case 'gradeMiss':
        speak(pickOne([
          'เอ๊ะ เดี๋ยวก่อน! อันนี้ตอบหรือละเมอครับเนี่ย ลองพิมพ์ใหม่อีกที!',
          'ยังไม่ใช่ครับวัยรุ่น! ตั้งสติ อ่านคำใบ้ แล้วลองใหม่อีกรอบ!',
          'ใกล้แล้วครับ... ใกล้จะออกทะเลแล้ว! ลองเติมคำสำคัญอีกนิดนะ!',
          'คนตรวจกุมขมับแล้วครับ! ลองเรียบเรียงใหม่อีกสักตั้ง!'
        ]), { priority: true });
        break;
      case 'steal':
        speak(pickOne([
          `แสบทรวง! ${A} แอบฉกคะแนนของ ${B} ไปหน้าตาเฉย ${pts} แต้ม! มิตรภาพยังดีอยู่ไหมครับเนี่ย!`,
          `ปล้นกลางวันแสกๆ! ${A} ดูดแต้มจาก ${B} ไป ${pts} คะแนน ร้องไห้แล้วนั่น!`
        ]), { priority: true });
        break;
      case 'freeze':
        speak(pickOne([
          `หนาวสั่นไปเลย! ${A} ส่งพายุน้ำแข็งแช่แข็งหน้าจอของ ${B} แล้วครับ รีบทุบด่วน!`,
          `กลายเป็นไอติมไปแล้ว! ${B} โดน ${A} แช่แข็งเต็มๆ กดทุบน้ำแข็งรัวๆ เลยครับ!`
        ]), { priority: true });
        break;
      case 'blind':
        speak(pickOne([
          `มองไม่เห็นล่ะสิ! ${A} ปาระเบิดหมอกควันใส่หน้าจอของ ${B} มืดตึ๊ดตื๋อเลยครับ!`,
          `เลอะเทอะไปหมด! ${B} โดน ${A} ปาหมอกบังจอ รีบเช็ดหน้าจอด่วน!`
        ]), { priority: true });
        break;
      case 'flip':
        speak(pickOne([
          `มึนหัวตึ้บ! ${A} ส่งไวรัสกลับหัวใส่ ${B} หน้าจอตีลังกากลับด้านไปแล้วครับ!`,
          `โลกหมุนติ้ว! ${B} โดน ${A} เสกไวรัสจอตีลังกา ต้องตะแคงคอพิมพ์แล้วล่ะครับ!`
        ]), { priority: true });
        break;
      case 'zap':
        speak(pickOne([
          `เปรี้ยง! ${A} ปล่อยสายฟ้าฟาดใส่ ${B} แต้มปลิวหายไป ${pts} คะแนน!`,
          `ฟ้าผ่ากลางห้องเรียน! ${B} โดนสายฟ้าของ ${A} ช็อตแต้มลดไป ${pts} คะแนน!`
        ]), { priority: true });
        break;
      case 'boost':
        speak(`หวานเจี๊ยบ! ${A} ดื่มน้ำยาวิทย์ บวกแต้มฟรีๆ ${pts} คะแนน แถมส่องคีย์เวิร์ดด้วย!`, { priority: true });
        break;
      case 'block':
        speak(pickOne([
          `ว้ายย ทำอะไรไม่ได้! ${B} กางโล่สะท้อนการโจมตีของ ${A} ดังเป๊ง!`,
          `เสียของฟรี! ${B} มีโล่ป้องกัน กันท่าป่วนของ ${A} ได้แบบหล่อๆ!`
        ]), { priority: true });
        break;
      case 'podium':
        speak(
          d.winner
            ? `หมดเวลาการแข่งขันครับ! และแชมป์อันดับหนึ่งของสนามนี้ได้แก่ ${d.winner} ด้วยคะแนน ${d.score} แต้ม! ขอเสียงปรบมือดังๆ ครับ!`
            : 'จบการแข่งขันแล้วครับ มาดูโฉมหน้าผู้ชนะบนโพเดียมกันเลย!',
          { priority: true, pitch: 1.15, rate: 1.08 }
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
    wrong()   { tone(300, { dur: .18, type: 'sawtooth', vol: .12, to: 200 }); tone(220, { at: .18, dur: .3, type: 'sawtooth', vol: .12, to: 130 }); },
    coin()    { tone(988, { dur: .08, type: 'square', vol: .1 }); tone(1319, { at: .08, dur: .3, type: 'square', vol: .1 }); },
    item()    { seq([784, 988, 1175, 1568, 1976], .06, { dur: .22, vol: .18 }); noise({ dur: .7, vol: .05, freq: 7000, type: 'highpass' }); },
    whoosh()  { noise({ dur: .45, vol: .35, freq: 300, to: 3200, q: 2 }); },
    stolen()  { noise({ dur: .4, vol: .3, freq: 2500, to: 300, q: 2 }); tone(700, { at: .15, dur: .4, type: 'square', vol: .09, to: 120 }); },
    freeze()  { noise({ dur: 1, vol: .25, freq: 6000, to: 1200, q: 4 }); seq([2093, 1760, 1568, 1319, 1047], .08, { dur: .3, vol: .08 }); },
    crack()   { noise({ dur: .08, vol: .55, freq: 2500, q: .8 }); tone(170, { dur: .08, type: 'square', vol: .14, to: 70 }); },
    shatter() { noise({ dur: .7, vol: .45, freq: 4500, type: 'highpass' }); seq([2637, 2093, 3136, 2349, 2794], .04, { dur: .16, type: 'triangle', vol: .1 }); },
    block()   { tone(200, { dur: .1, type: 'square', vol: .14 }); tone(880, { at: .05, dur: .45, type: 'triangle', vol: .16, to: 640 }); },
    splat()   { noise({ dur: .45, vol: .4, freq: 600, to: 180, q: 1.5 }); tone(240, { dur: .35, type: 'sawtooth', vol: .15, to: 75 }); },
    dizzy()   { seq([440, 587, 392, 659, 349, 784], .07, { dur: .12, type: 'sine', vol: .2 }); },
    zap()     { noise({ dur: .55, vol: .5, freq: 3500, to: 400, q: .7 }); tone(1200, { dur: .25, type: 'sawtooth', vol: .2, to: 65 }); },
    potion()  { seq([392, 523, 659, 784, 1047, 1319], .055, { dur: .14, type: 'sine', vol: .22 }); },
    bonus()   { seq([392, 523, 659, 784, 659, 784, 1047, 1319], .08, { dur: .18, type: 'square', vol: .1 }); },
    fanfare() { seq([523, 523, 523, 698, 880, 784, 880, 1047], .15, { dur: .24, type: 'triangle', vol: .22 }); },
    drum()    { tone(120, { dur: .15, vol: .4, to: 50 }); noise({ dur: .1, vol: .15, freq: 1500 }); },

    startBgm,
    stopBgm,
    speak,
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
      else if (voiceOn) speak('เปิดเสียงพากย์พิธีกรกวนป่วนสนามแล้วครับ!', { priority: true });
      return voiceOn;
    }
  };
})();
document.addEventListener('pointerdown', () => SFX.unlock(), { once: true });
