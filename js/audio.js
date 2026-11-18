/* Sci-Quest Arena — เสียงเอฟเฟกต์สังเคราะห์ด้วย Web Audio API (ไม่ต้องใช้ไฟล์เสียง) */
const SFX = (() => {
  let ctx = null, master = null, noiseBuf = null;
  let muted = localStorage.getItem('sqa_muted') === '1';

  function ac() {
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { return null; }
    return ctx;
  }
  function env(g, t, a, d, v) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function tone(f, { at = 0, dur = .15, type = 'sine', vol = .25, to = null, attack = .01 } = {}) {
    if (muted) return; const c = ac(); if (!c) return;
    const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    env(g, t, attack, dur, vol); o.connect(g); g.connect(master);
    o.start(t); o.stop(t + attack + dur + .05);
  }
  function noise({ at = 0, dur = .3, vol = .3, freq = 1000, q = 1, type = 'bandpass', to = null } = {}) {
    if (muted) return; const c = ac(); if (!c) return;
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate * 1.5, c.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = c.currentTime + at, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    f.Q.value = q; env(g, t, .01, dur, vol);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + .1);
  }
  const seq = (arr, step, o) => arr.forEach((f, i) => tone(f, { at: i * step, ...o }));

  return {
    unlock: ac,
    click()   { tone(660, { dur: .06, type: 'triangle', vol: .15, to: 900 }); },
    pop()     { tone(380, { dur: .12, vol: .25, to: 900 }); },
    join()    { seq([523, 659, 784], .07, { dur: .12, type: 'triangle', vol: .2 }); },
    correct() { seq([523, 659, 784, 1047], .08, { dur: .18, type: 'triangle', vol: .22 }); tone(1568, { at: .34, dur: .35, vol: .1 }); },
    partial() { seq([523, 659, 784], .1, { dur: .18, type: 'triangle', vol: .2 }); },
    wrong()   { tone(300, { dur: .18, type: 'sawtooth', vol: .1, to: 200 }); tone(220, { at: .18, dur: .3, type: 'sawtooth', vol: .1, to: 130 }); },
    coin()    { tone(988, { dur: .08, type: 'square', vol: .09 }); tone(1319, { at: .08, dur: .3, type: 'square', vol: .09 }); },
    item()    { seq([784, 988, 1175, 1568, 1976], .06, { dur: .22, vol: .18 }); noise({ dur: .7, vol: .05, freq: 7000, type: 'highpass' }); },
    whoosh()  { noise({ dur: .45, vol: .35, freq: 300, to: 3200, q: 2 }); },
    stolen()  { noise({ dur: .4, vol: .3, freq: 2500, to: 300, q: 2 }); tone(700, { at: .15, dur: .4, type: 'square', vol: .08, to: 120 }); },
    freeze()  { noise({ dur: 1, vol: .25, freq: 6000, to: 1200, q: 4 }); seq([2093, 1760, 1568, 1319, 1047], .08, { dur: .3, vol: .07 }); },
    crack()   { noise({ dur: .08, vol: .55, freq: 2500, q: .8 }); tone(170, { dur: .08, type: 'square', vol: .14, to: 70 }); },
    shatter() { noise({ dur: .7, vol: .45, freq: 4500, type: 'highpass' }); seq([2637, 2093, 3136, 2349, 2794], .04, { dur: .16, type: 'triangle', vol: .09 }); },
    block()   { tone(200, { dur: .1, type: 'square', vol: .14 }); tone(880, { at: .05, dur: .45, type: 'triangle', vol: .16, to: 640 }); },
    bonus()   { seq([392, 523, 659, 784, 659, 784, 1047], .09, { dur: .16, type: 'square', vol: .07 }); },
    fanfare() { seq([523, 523, 523, 698, 880, 784, 880, 1047], .15, { dur: .24, type: 'triangle', vol: .2 }); },
    drum()    { tone(120, { dur: .15, vol: .4, to: 50 }); noise({ dur: .1, vol: .15, freq: 1500 }); },
    get muted() { return muted; },
    toggleMute() { muted = !muted; localStorage.setItem('sqa_muted', muted ? '1' : '0'); if (!muted) this.click(); return muted; }
  };
})();
document.addEventListener('pointerdown', () => SFX.unlock(), { once: true });
