/* =========================================================
 * Sci-Quest! — Realtime Sync Layer
 * ---------------------------------------------------------
 * รองรับ 4 โหมด:
 *   'cloud'    = Zero-Config Cloud Realtime (MQTT over WSS Retained + CRDT-style Merge + Local)
 *                เล่นข้ามอุปกรณ์ (คอมครู + มือถือเด็กสแกน QR บน Vercel) ได้ทันทีโดยไม่ต้องตั้งค่า DB!
 *   'local'    = โหมดจำลองในเครื่องเดียว (localStorage + BroadcastChannel)
 *   'firebase' = Firebase Realtime Database
 *   'supabase' = Supabase Realtime
 * ========================================================= */
const Sync = (() => {
  const cfg = window.SQA_CONFIG || { backend: 'cloud' };
  const mode = cfg.backend || 'cloud';
  let code = null, cb = null, last = null, adapter = null;

  function defaultRoom(c) {
    const now = Date.now();
    return {
      code: c, status: 'lobby', createdAt: now, hostUpdatedAt: 0, resetAt: 0,
      players: {}, feed: {}, bonus: null, usedBonus: {}
    };
  }

  function normalize(r) {
    if (!r || !r.code) return null;
    r.players = r.players || {};
    r.feed = r.feed || {};
    r.usedBonus = r.usedBonus || {};
    r.hostUpdatedAt = r.hostUpdatedAt || 0;
    r.resetAt = r.resetAt || 0;
    if (r.bonus) r.bonus.answered = r.bonus.answered || {};
    else r.bonus = null;
    for (const p of Object.values(r.players)) {
      p.items = Object.assign({ x2: 0, shield: 0, steal: 0, freeze: 0 }, p.items || {});
      p.answered = p.answered || {};
      p.score = p.score || 0;
      p.updatedAt = p.updatedAt || p.joinedAt || 0;
    }
    return r;
  }

  const clean = o => JSON.parse(JSON.stringify(o));

  /* ผสานสถานะห้องจากหลายอุปกรณ์โดยไม่ให้ข้อมูลผู้เล่นหรือคะแนนทับกันหาย และเคารพการล้างห้อง (resetAt) */
  function mergeRooms(a, b) {
    a = normalize(a); b = normalize(b);
    if (!a) return b;
    if (!b) return a;

    const resetAt = Math.max(a.resetAt || 0, b.resetAt || 0);
    // หากฝั่งใดมี resetAt เก่ากว่า ให้ล้างข้อมูลที่เกิดก่อน resetAt ออกก่อนนำมาผสาน
    const stripOld = r => {
      if (!resetAt || (r.resetAt || 0) >= resetAt) return r;
      const copy = clean(r);
      copy.usedBonus = {};
      for (const [pid, p] of Object.entries(copy.players || {})) {
        if ((p.updatedAt || p.joinedAt || 0) < resetAt) delete copy.players[pid];
      }
      for (const [fid, f] of Object.entries(copy.feed || {})) {
        if ((f.t || 0) < resetAt) delete copy.feed[fid];
      }
      if (copy.bonus && (copy.bonus.startedAt || 0) < resetAt) copy.bonus = null;
      return copy;
    };
    a = stripOld(a);
    b = stripOld(b);

    const hostNewerB = (b.hostUpdatedAt || 0) >= (a.hostUpdatedAt || 0);
    const primary = hostNewerB ? b : a;
    const out = {
      code: primary.code || a.code,
      status: primary.status || 'lobby',
      createdAt: Math.min(a.createdAt || Date.now(), b.createdAt || Date.now()),
      hostUpdatedAt: Math.max(a.hostUpdatedAt || 0, b.hostUpdatedAt || 0),
      resetAt,
      endedAt: primary.status === 'ended' ? (primary.endedAt || a.endedAt || b.endedAt || null) : null,
      usedBonus: Object.assign({}, a.usedBonus || {}, b.usedBonus || {}),
      bonus: primary.bonus ? clean(primary.bonus) : null,
      players: {},
      feed: {}
    };

    // รวมผู้ตอบคำถามโบนัสเดียวกันจากทุกเครื่อง
    if (out.bonus && a.bonus && b.bonus && a.bonus.id === b.bonus.id) {
      out.bonus.answered = Object.assign({}, a.bonus.answered || {}, b.bonus.answered || {});
    }

    // รวมผู้เล่นทุกคนที่อัปเดตหลัง resetAt โดยเลือกสถานะที่มี updatedAt ล่าสุดของผู้เล่นคนนั้น
    const allPids = new Set([...Object.keys(a.players || {}), ...Object.keys(b.players || {})]);
    for (const pid of allPids) {
      const pa = a.players[pid], pb = b.players[pid];
      const chosen = (pa && pb)
        ? ((pb.updatedAt || 0) >= (pa.updatedAt || 0) ? pb : pa)
        : (pa || pb);
      if (chosen && (chosen.updatedAt || chosen.joinedAt || 0) >= resetAt) {
        out.players[pid] = clean(chosen);
      }
    }

    // รวม Live Feed ล่าสุด 40 รายการที่เกิดหลัง resetAt
    const allFeed = Object.assign({}, a.feed || {}, b.feed || {});
    for (const [fid, f] of Object.entries(allFeed)) {
      if ((f.t || 0) < resetAt) delete allFeed[fid];
    }
    const fKeys = Object.keys(allFeed).sort((x, y) => (allFeed[x].t || 0) - (allFeed[y].t || 0));
    while (fKeys.length > 40) delete allFeed[fKeys.shift()];
    out.feed = allFeed;

    return normalize(out);
  }

  function emit(r) {
    last = normalize(r ? clean(r) : null);
    if (cb) cb(last);
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  /* ---------- 🌐 Cloud Realtime (MQTT over WSS + Local Hybrid) ---------- */
  const cloud = {
    key: c => 'sqa_room_' + c,
    readLocal(c) { try { return JSON.parse(localStorage.getItem(this.key(c || code))); } catch (e) { return null; } },
    writeLocal(r, c) {
      try { localStorage.setItem(this.key(c || code), JSON.stringify(clean(r))); } catch (e) {}
      if (this.bc) { try { this.bc.postMessage('u'); } catch (e) {} }
    },
    topicState(c) {
      const p = (cfg.cloud && cfg.cloud.topicPrefix) || 'sciquest_arena_v2';
      return `${p}/room/${c || code}/state`;
    },
    topicPing(c) {
      const p = (cfg.cloud && cfg.cloud.topicPrefix) || 'sciquest_arena_v2';
      return `${p}/room/${c || code}/ping`;
    },
    async ensureMqtt() {
      if (window.mqtt) return true;
      try {
        await loadScript('https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js');
        return !!window.mqtt;
      } catch (e) {
        try {
          await loadScript('https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js');
          return !!window.mqtt;
        } catch (e2) { return false; }
      }
    },
    async connect() {
      this.cur = normalize(this.readLocal());
      try {
        this.bc = new BroadcastChannel('sqa_' + code);
        this.bc.onmessage = () => {
          const loc = normalize(this.readLocal());
          if (loc) { this.cur = mergeRooms(this.cur, loc); emit(this.cur); }
        };
      } catch (e) { this.bc = null; }

      this.onStorage = e => {
        if (e.key === this.key(code)) {
          const loc = normalize(this.readLocal());
          if (loc) { this.cur = mergeRooms(this.cur, loc); emit(this.cur); }
        }
      };
      window.addEventListener('storage', this.onStorage);

      const ok = await this.ensureMqtt();
      if (!ok) { emit(this.cur); return; }

      const brokers = (cfg.cloud && cfg.cloud.brokers) || ['wss://broker.emqx.io:8084/mqtt'];
      const tState = this.topicState(code);
      const tPing = this.topicPing(code);

      await new Promise(resolve => {
        let settled = false;
        const done = () => { if (!settled) { settled = true; resolve(); } };
        const timer = setTimeout(done, 1600);

        try {
          this.client = window.mqtt.connect(brokers[0], {
            clientId: 'sqa_' + Math.random().toString(36).slice(2, 10),
            clean: true,
            connectTimeout: 3500,
            reconnectPeriod: 2000
          });

          this.client.on('connect', () => {
            this.client.subscribe([tState, tPing], { qos: 0 }, () => {
              this.client.publish(tPing, '1', { qos: 0 });
              // หากเครื่องนี้มีข้อมูลห้องอยู่แล้ว ให้ประกาศ state ล่าสุดขึ้น Cloud ด้วย
              if (this.cur) this.publishState(this.cur);
            });
          });

          this.client.on('message', (topic, payload) => {
            if (topic === tPing) {
              if (this.cur) this.publishState(this.cur);
              return;
            }
            if (topic === tState) {
              try {
                const inc = normalize(JSON.parse(payload.toString()));
                if (inc && inc.code === code) {
                  this.cur = mergeRooms(this.cur, inc);
                  this.writeLocal(this.cur);
                  emit(this.cur);
                }
              } catch (e) {}
              clearTimeout(timer);
              done();
            }
          });

          this.client.on('error', () => { clearTimeout(timer); done(); });
        } catch (e) {
          clearTimeout(timer);
          done();
        }
      });

      emit(this.cur);
    },
    publishState(r) {
      if (!this.client || !this.client.connected || !r) return;
      try {
        this.client.publish(this.topicState(r.code || code), JSON.stringify(clean(r)), { qos: 0, retain: true });
      } catch (e) {}
    },
    async exists(c) {
      if (this.readLocal(c)) return true;
      // ในโหมด Cloud อนุญาตให้เข้าห้องตามรหัส PIN ได้เสมอ (ซิงก์ state จาก Cloud ทันทีเมื่อ connect)
      return true;
    },
    async transact(fn, allowCreate) {
      const loc = normalize(this.readLocal());
      if (loc) this.cur = mergeRooms(this.cur, loc);
      if (!this.cur && !allowCreate) this.cur = defaultRoom(code);
      const base = this.cur ? clean(this.cur) : null;
      const next = fn(base);
      if (next === undefined) return this.cur;
      this.cur = normalize(clean(next));
      this.writeLocal(this.cur);
      this.publishState(this.cur);
      emit(this.cur);
      return this.cur;
    },
    disconnect() {
      if (this.bc) { try { this.bc.close(); } catch (e) {} this.bc = null; }
      if (this.onStorage) window.removeEventListener('storage', this.onStorage);
      if (this.client) { try { this.client.end(true); } catch (e) {} this.client = null; }
      this.cur = null;
    }
  };

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
        if (cur === null && !allowCreate) return null;
        const n = fn(normalize(cur));
        return n === undefined ? undefined : clean(n);
      });
      return normalize(r.snapshot.val());
    },
    disconnect() { if (this.ref) this.ref.off('value', this.handler); }
  };

  /* ---------- ⚡ Supabase ---------- */
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
      for (let i = 0; i < 6; i++) {
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

  const pick = () => ({ cloud, local, firebase: firebaseA, supabase: supa }[mode] || cloud);

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
    create: c => adapter.transact(cur => (cur && cur.code) ? cur : defaultRoom(c), true),
    transact: fn => adapter.transact(fn, false),
    disconnect() { if (adapter) adapter.disconnect(); adapter = null; cb = null; last = null; },
    defaultRoom,
    mergeRooms,
    pushFeed(room, e) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      room.feed[id] = Object.assign({ id, t: Date.now() }, e);
      const keys = Object.keys(room.feed).sort((a, b) => room.feed[a].t - room.feed[b].t);
      while (keys.length > 40) delete room.feed[keys.shift()];
    }
  };
})();
