/* =========================================================
 * Sci-Quest Arena — Realtime Sync Layer
 * ---------------------------------------------------------
 * API เดียวกันทุก backend:
 *   Sync.connect(code, onChange)  → subscribe สถานะห้อง (resolve เมื่อได้ข้อมูลแรก)
 *   Sync.exists(code)             → ห้องนี้มีอยู่ไหม
 *   Sync.create(code)             → สร้างห้อง (ถ้ายังไม่มี)
 *   Sync.transact(room => room)   → แก้ไขแบบ atomic (return undefined = ยกเลิก)
 *   Sync.pushFeed(room, entry)    → เพิ่มข้อความ Live Feed
 *
 * โครงสร้าง State ของห้อง (path: sqa_rooms/{code})
 * {
 *   code, status: 'lobby'|'playing'|'paused'|'ended', createdAt, endedAt,
 *   players: { [pid]: { id, name, avatar, score, isBot,
 *              items: { x2, shield, steal, freeze }, x2Active, frozen, frozenBy,
 *              answered: { [cardId]: pointsEarned }, joinedAt } },
 *   feed:    { [id]: { id, t, type, a, ai, b, bi, ... } },   // เก็บล่าสุด 40 รายการ
 *   bonus:   null | { id, qid, startedAt, answered: { [pid]: accuracy } },
 *   usedBonus: { [qid]: true }
 * }
 * ========================================================= */
const Sync = (() => {
  const cfg = window.SQA_CONFIG || { backend: 'local' };
  const mode = cfg.backend || 'local';
  let code = null, cb = null, last = null, adapter = null;

  function defaultRoom(c) {
    return { code: c, status: 'lobby', createdAt: Date.now(), players: {}, feed: {}, bonus: null, usedBonus: {} };
  }
  function normalize(r) {
    if (!r) return null;
    r.players = r.players || {}; r.feed = r.feed || {}; r.usedBonus = r.usedBonus || {};
    if (r.bonus) r.bonus.answered = r.bonus.answered || {};
    else r.bonus = null;
    for (const p of Object.values(r.players)) {
      p.items = Object.assign({ x2: 0, shield: 0, steal: 0, freeze: 0 }, p.items || {});
      p.answered = p.answered || {};
      p.score = p.score || 0;
    }
    return r;
  }
  const clean = o => JSON.parse(JSON.stringify(o));
  function emit(r) { last = normalize(r ? clean(r) : null); if (cb) cb(last); }

  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }

  /* ---------- 💻 Local (localStorage + BroadcastChannel) ---------- */
  const local = {
    key: c => 'sqa_room_' + c,
    read(c) { try { return JSON.parse(localStorage.getItem(this.key(c || code))); } catch (e) { return null; } },
    async connect() {
      try { this.bc = new BroadcastChannel('sqa_' + code); this.bc.onmessage = () => emit(this.read()); } catch (e) { this.bc = null; }
      this.onStorage = e => { if (e.key === this.key(code)) emit(this.read()); };
      window.addEventListener('storage', this.onStorage);
      emit(this.read());
    },
    async exists(c) { return !!this.read(c); },
    async transact(fn, allowCreate) {
      const cur = normalize(this.read());
      if (!cur && !allowCreate) return null;
      const next = fn(cur);
      if (next === undefined) return cur;
      localStorage.setItem(this.key(code), JSON.stringify(clean(next)));
      if (this.bc) this.bc.postMessage('u');
      emit(this.read());
      return next;
    },
    disconnect() {
      if (this.bc) this.bc.close();
      if (this.onStorage) window.removeEventListener('storage', this.onStorage);
    }
  };

  /* ---------- 🔥 Firebase Realtime Database ---------- */
  const firebaseA = {
    async load() {
      if (this.db) return;
      await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js');
      if (!firebase.apps.length) firebase.initializeApp(cfg.firebase);
      this.db = firebase.database();
    },
    async connect() {
      await this.load();
      this.ref = this.db.ref('sqa_rooms/' + code);
      await new Promise(res => {
        let first = true;
        this.handler = this.ref.on('value', s => { emit(s.val()); if (first) { first = false; res(); } });
      });
    },
    async exists(c) { await this.load(); return (await this.db.ref('sqa_rooms/' + c).once('value')).exists(); },
    async transact(fn, allowCreate) {
      const r = await this.ref.transaction(cur => {
        if (cur === null && !allowCreate) return null;     // แคชยังว่าง → รอค่าจริงจากเซิร์ฟเวอร์
        const n = fn(normalize(cur));
        return n === undefined ? undefined : clean(n);
      });
      return normalize(r.snapshot.val());
    },
    disconnect() { if (this.ref) this.ref.off('value', this.handler); }
  };

  /* ---------- ⚡ Supabase (ตาราง sqa_rooms: code, state jsonb, version int) ---------- */
  const supa = {
    async load() {
      if (this.client) return;
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
      this.client = supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey);
      this.t = cfg.supabase.table || 'sqa_rooms';
    },
    async fetchRow(c) {
      const { data } = await this.client.from(this.t).select('state,version').eq('code', c).maybeSingle();
      return data;
    },
    async connect() {
      await this.load();
      const row = await this.fetchRow(code); emit(row ? row.state : null);
      this.ch = this.client.channel('room-' + code)
        .on('postgres_changes', { event: '*', schema: 'public', table: this.t, filter: 'code=eq.' + code },
          p => { if (p.new && p.new.state) emit(p.new.state); })
        .subscribe();
    },
    async exists(c) { await this.load(); return !!(await this.fetchRow(c)); },
    async transact(fn, allowCreate) {
      for (let i = 0; i < 6; i++) {                      // optimistic concurrency ด้วย version
        const row = await this.fetchRow(code);
        const cur = row ? normalize(row.state) : null;
        if (!cur && !allowCreate) return null;
        const n = fn(cur);
        if (n === undefined) return cur;
        if (!row) {
          const { error } = await this.client.from(this.t).insert({ code, state: clean(n), version: 1 });
          if (!error) { emit(n); return n; }
        } else {
          const { data, error } = await this.client.from(this.t)
            .update({ state: clean(n), version: row.version + 1 })
            .eq('code', code).eq('version', row.version).select('code');
          if (!error && data && data.length) { emit(n); return n; }
        }
        await new Promise(r => setTimeout(r, 80 + Math.random() * 120));
      }
      throw new Error('Sync conflict');
    },
    disconnect() { if (this.ch) this.client.removeChannel(this.ch); }
  };

  const pick = () => ({ local, firebase: firebaseA, supabase: supa }[mode] || local);

  return {
    mode,
    get room() { return last; },
    get code() { return code; },
    async connect(c, onChange) {
      if (adapter) adapter.disconnect();
      code = c; cb = onChange; adapter = pick();
      await adapter.connect();
    },
    exists: c => pick().exists(c),
    create: c => adapter.transact(cur => (cur && cur.code) ? undefined : defaultRoom(c), true),
    transact: fn => adapter.transact(fn, false),
    disconnect() { if (adapter) adapter.disconnect(); adapter = null; cb = null; last = null; },
    defaultRoom,
    pushFeed(room, e) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      room.feed[id] = Object.assign({ id, t: Date.now() }, e);
      const keys = Object.keys(room.feed).sort((a, b) => room.feed[a].t - room.feed[b].t);
      while (keys.length > 40) delete room.feed[keys.shift()];
    }
  };
})();
