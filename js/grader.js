/* =========================================================
 * Sci-Quest Arena — Smart Thai Answer Grading
 * ---------------------------------------------------------
 * 1) Normalize ข้อความไทย: ตัดวรรณยุกต์/การันต์/ช่องว่าง/เครื่องหมาย,
 *    ยุบตัวอักษรซ้ำ, แปลงคำพ้อง (เอไอ → ai ฯลฯ)
 * 2) Concept Keyword Matching: แต่ละแนวคิดมีคำพ้องหลายคำ
 *    ตรงเป๊ะ = 1 แนวคิด, สะกดใกล้เคียง (Fuzzy bigram ≥ 0.72) = 0.75 แนวคิด
 * 3) Character Bigram Similarity (Dice + Recall) กับเฉลยต้นแบบ
 * 4) คะแนนรวม = 75% แนวคิด + 25% ความคล้ายข้อความ
 *    (ครบทุกแนวคิด → อย่างน้อย 85%)  มีบทลงโทษการลอกโจทย์และวลีเข้าใจผิด
 * ========================================================= */
const Grader = (() => {
  const SYN = [
    [/ปัญญาประดิษฐ์/g, 'ai'], [/เอไอ/g, 'ai'], [/a\.i\./g, 'ai'],
    [/แช[ทต]บ[อ็]?[ทต]/g, 'chatbot'], [/เช็ก/g, 'เช็ค'], [/เช็ค/g, 'เช็ค'],
    [/อินฟลู(เอ็?นเซอร์?)?/g, 'อินฟลู'], [/เด[ซช]ิเบ[ลน]|decibel/g, 'db'],
    [/ดีพเฟก|ดีปเฟก|deep\s*fake/g, 'deepfake']
  ];
  const cache = new Map();

  function normalize(s) {
    if (cache.has(s)) return cache.get(s);
    let t = String(s || '').toLowerCase();
    for (const [re, rep] of SYN) t = t.replace(re, rep);
    t = t.replace(/[\u0E47-\u0E4E]/g, '')         // ไม้ไต่คู้ วรรณยุกต์ การันต์ ฯลฯ
         .replace(/[ๆฯ]/g, '')
         .replace(/[^\u0E00-\u0E7Fa-z0-9#]/g, '')  // ช่องว่าง/เครื่องหมาย
         .replace(/(.)\1{2,}/g, '$1');            // มากกกก → มาก
    if (cache.size > 2000) cache.clear();
    cache.set(s, t);
    return t;
  }
  function bigrams(s) {
    const m = new Map();
    if (s.length === 1) { m.set(s, 1); return m; }
    for (let i = 0; i < s.length - 1; i++) { const g = s.substr(i, 2); m.set(g, (m.get(g) || 0) + 1); }
    return m;
  }
  const size = m => { let n = 0; for (const v of m.values()) n += v; return n; };
  function overlap(A, B) { let n = 0; for (const [k, v] of A) if (B.has(k)) n += Math.min(v, B.get(k)); return n; }
  function dice(a, b) {
    const A = bigrams(a), B = bigrams(b), sa = size(A), sb = size(B);
    return sa && sb ? 2 * overlap(A, B) / (sa + sb) : 0;
  }
  function fuzzyContains(text, kw) {
    if (!kw) return 0;
    if (text.includes(kw)) return 1;
    if (kw.length < 4 || kw.startsWith('ไม')) return 0;   // คำปฏิเสธต้องตรงเป๊ะ
    let best = 0;
    for (let len = kw.length - 1; len <= kw.length + 1; len++) {
      for (let i = 0; i + len <= text.length; i++) {
        const d = dice(text.substr(i, len), kw);
        if (d > best) best = d;
        if (best >= .9) return .75;
      }
    }
    return best >= .72 ? .75 : 0;
  }

  const TIERS = [
    { min: 80, mult: 1, key: 'perfect', label: 'แม่นยำมาก!', color: '#16a34a' },
    { min: 50, mult: .7, key: 'close', label: 'ใกล้เคียง!', color: '#2563eb' },
    { min: 25, mult: .4, key: 'partial', label: 'พอมีเค้าโครง', color: '#d97706' },
    { min: 0, mult: 0, key: 'miss', label: 'ยังไม่ใช่ ลองใหม่นะ', color: '#dc2626' }
  ];

  function grade(answer, q) {
    const a = normalize(answer);
    const concepts = q.kw.map(syns => ({ label: syns[0], credit: 0 }));
    const out = (score, extra = {}) => {
      const accuracy = Math.max(0, Math.min(100, Math.round(score * 100)));
      const tier = TIERS.find(t => accuracy >= t.min);
      return {
        accuracy, multiplier: tier.mult, tier: tier.key, label: tier.label, color: tier.color,
        concepts, matched: concepts.filter(c => c.credit > 0).map(c => c.label), total: concepts.length, ...extra
      };
    };
    if (a.length < 2) return out(0);
    const m = normalize(q.model);
    if (a === m) { concepts.forEach(c => c.credit = 1); return out(1); }

    // (1) Concept keyword matching
    q.kw.forEach((syns, i) => {
      let best = 0;
      for (const s of syns) { const c = fuzzyContains(a, normalize(s)); if (c > best) best = c; if (best === 1) break; }
      concepts[i].credit = best;
    });
    const need = q.need || (q.kw.length >= 4 ? q.kw.length - 1 : q.kw.length);
    const credit = concepts.reduce((s, c) => s + c.credit, 0);
    const kwScore = Math.min(1, credit / need);

    // (2) Bigram similarity กับเฉลย
    const A = bigrams(a), M = bigrams(m), ov = overlap(A, M);
    const recall = ov / size(M), d = 2 * ov / (size(A) + size(M));
    const textSim = Math.min(1, Math.max(d, recall * .9) * 1.5);

    let score = .75 * kwScore + .25 * textSim;
    if (kwScore >= .999) score = Math.max(score, .85);

    // (3) บทลงโทษ
    let penalty = '';
    if (dice(a, normalize(q.q)) > .75) { score *= .3; penalty = 'copy'; }
    if (q.anti && q.anti.some(x => a.includes(normalize(x)))) { score *= .4; penalty = 'anti'; }

    return out(score, { kwScore, textSim, penalty });
  }

  return { grade, normalize, dice, TIERS };
})();
if (typeof module !== 'undefined') module.exports = Grader;
