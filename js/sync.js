/* =========================================================
 * Sci-Quest! — Ultra-Stable Realtime Sync Layer (v3)
 * ---------------------------------------------------------
 * ปรับปรุงความเสถียรสำหรับห้องเรียนจริง (นักเรียน 30–50 เครื่องพร้อมกัน):
 *   1) Role-Aware Cloud Sync (Host ส่ง Retained State Snapshot แบบ Debounce,
 *      Player ส่งเฉพาะ Patch ขนาดเล็ก ~300 bytes -> ลดทราฟฟิก 30 เท่า ไม่โดน Broker ตัด!)
 *   2) เฉพาะ Host เท่านั้นที่ตอบ Ping (กัน Broadcast Storm ตอนมือถือเด็กตื่นพร้อมกัน)
 *   3) ใช้ Logical roundId ป้องกันปัญหานาฬิกาเครื่องไม่ตรงกัน และกันมือถือเด้งออกเอง
 *   4) Auto-Reconnect ทันทีเมื่อปลดล็อกหน้าจอมือถือ (visibilitychange / online)
 *      + สำรอง Broker 2 ตัวอัตโนมัติ (EMQX -> HiveMQ)
 * ========================================================= */
const Sync = (() => {
  const cfg = window.SQA_CONFIG || { backend: 'cloud' };
  const mode = cfg.backend || 'cloud';
  let code = null, cb = null, connCb = null, isHostRole = false, last = null, adapter = null;

  function defaultRoom(c) {
    const now = Date.now();
    return {
      code: c, status: 'lobby', createdAt: now, hostUpdatedAt: 0, roundId: 1,
      timerTotalSec: 0, timerRemainingMs: 0, timerRunning: false,
      players: {}, feed: {}, bonus: null, usedBonus: {}
    };
  }

  function normalize(r) {
    if (!r || !r.code) return null;
    r.players = r.players || {};
    r.feed = r.feed || {};
    r.usedBonus = r.usedBonus || {};
    r.hostUpdatedAt = r.hostUpdatedAt || 0;
    r.roundId = r.roundId || 1;
    r.timerTotalSec = Number(r.timerTotalSec || 0);
    r.timerRemainingMs = Number(r.timerRemainingMs || 0);
    r.timerRunning = !!r.timerRunning;
    if (r.bonus) {
      r.bonus.answered = r.bonus.answered || {};
      r.bonus.durationSec = Number(r.bonus.durationSec || 20);
      if (r.bonus.remainingSec === undefined) r.bonus.remainingSec = r.bonus.durationSec;
    } else {
      r.bonus = null;
    }
    for (const p of Object.values(r.players)) {
      p.items = Object.assign({ x2: 0, shield: 0, steal: 0, freeze: 0, blind: 0, flip: 0, zap: 0, boost: 0, selfie: 0 }, p.items || {});
      p.answered = p.answered || {};
      p.score = p.score || 0;
      p.updatedAt = p.updatedAt || p.joinedAt || 0;
      p.roundId = p.roundId ?? r.roundId;
    }
    return r;
  }

  const clean = o => JSON.parse(JSON.stringify(o));

  /* ผสานสถานะห้องจากหลายอุปกรณ์ด้วย Logical roundId */
  function mergeRooms(a, b) {
    a = normalize(a); b = normalize(b);
    if (!a) return b;
    if (!b) return a;

    const roundId = Math.max(a.roundId || 1, b.roundId || 1);

    const adoptOrStrip = r => {
      const copy = clean(r);
      const isUnsyncedClient = (copy.hostUpdatedAt || 0) === 0;
      const rRound = copy.roundId || 1;
      if (rRound < roundId && !isUnsyncedClient) {
        copy.usedBonus = {};
        copy.players = {};
        copy.feed = {};
        copy.bonus = null;
      } else {
        for (const [pid, p] of Object.entries(copy.players || {})) {
          if (isUnsyncedClient || !p.roundId) {
            p.roundId = roundId;
          } else if (p.roundId < roundId) {
            delete copy.players[pid];
          }
        }
        for (const [fid, f] of Object.entries(copy.feed || {})) {
          if (isUnsyncedClient || !f.roundId) {
            f.roundId = roundId;
          } else if (f.roundId < roundId) {
            delete copy.feed[fid];
          }
        }
      }
      copy.roundId = roundId;
      return copy;
    };

    a = adoptOrStrip(a);
    b = adoptOrStrip(b);

    const hostNewerB = (b.hostUpdatedAt || 0) >= (a.hostUpdatedAt || 0);
    const primary = hostNewerB ? b : a;
    const out = {
      code: primary.code || a.code,
      status: primary.status || 'lobby',
      createdAt: Math.min(a.createdAt || Date.now(), b.createdAt || Date.now()),
      hostUpdatedAt: Math.max(a.hostUpdatedAt || 0, b.hostUpdatedAt || 0),
      roundId,
      timerTotalSec: primary.timerTotalSec || 0,
      timerRemainingMs: primary.timerRemainingMs || 0,
      timerRunning: !!primary.timerRunning,
      endedAt: primary.status === 'ended' ? (primary.endedAt || a.endedAt || b.endedAt || null) : null,
      usedBonus: Object.assign({}, a.usedBonus || {}, b.usedBonus || {}),
      bonus: primary.bonus ? clean(primary.bonus) : null,
      players: {},
      feed: {}
    };

    if (out.bonus && a.bonus && b.bonus && a.bonus.id === b.bonus.id) {
      out.bonus.answered = Object.assign({}, a.bonus.answered || {}, b.bonus.answered || {});
    }

    const allPids = new Set([...Object.keys(a.players || {}), ...Object.keys(b.players || {})]);
    for (const pid of allPids) {
      const pa = a.players[pid], pb = b.players[pid];
      const chosen = (pa && pb)
        ? ((pb.updatedAt || 0) >= (pa.updatedAt || 0) ? pb : pa)
        : (pa || pb);
      if (chosen && (chosen.roundId || roundId) >= roundId) {
        out.players[pid] = clean(chosen);
        out.players[pid].roundId = roundId;
      }
    }

    const allFeed = Object.assign({}, a.feed || {}, b.feed || {});
    for (const [fid, f] of Object.entries(allFeed)) {
      if ((f.roundId || roundId) < roundId) delete allFeed[fid];
    }
    const fKeys = Object.keys(allFeed).sort((x, y) => (allFeed[x].t || 0) - (allFeed[y].t || 0));
    while (fKeys.length > 40) delete allFeed[fKeys.shift()];
    out.feed = allFeed;

    return normalize(out);
  }

  /* ผสาน Patch ขนาดเล็กเข้ากับ State ปัจจุบัน */
  function applyPatch(room, patch) {
    const targetCode = (room && room.code) || code;
    if (!patch || (targetCode && patch.code !== targetCode)) return room;
    const base = normalize(room ? clean(room) : defaultRoom(patch.code || code));
    const curRound = base.roundId || 1;
    // ปฏิเสธ patch เก่าจากรอบก่อนหน้า (ยกเว้น patch ของผู้เล่นที่เพิ่งเข้ามาโดยยังไม่รู้รอบ)
    if (patch.roundId && patch.roundId < curRound && !patch.unsynced) return base;

    if (patch.players) {
      for (const [pid, incP] of Object.entries(patch.players)) {
        const curP = base.players[pid];
        if (!curP || (incP.updatedAt || 0) >= (curP.updatedAt || 0)) {
          base.players[pid] = clean(incP);
          base.players[pid].roundId = curRound;
        }
      }
    }
    if (patch.feed) {
      for (const [fid, f] of Object.entries(patch.feed)) {
        if (!base.feed[fid]) {
          base.feed[fid] = Object.assign({}, clean(f), { roundId: curRound });
        }
      }
      const fKeys = Object.keys(base.feed).sort((x, y) => (base.feed[x].t || 0) - (base.feed[y].t || 0));
      while (fKeys.length > 40) delete base.feed[fKeys.shift()];
    }
    if (patch.bonusAnswered && base.bonus && base.bonus.id === patch.bonusAnswered.bid) {
      base.bonus.answered = Object.assign({}, base.bonus.answered || {}, patch.bonusAnswered.map || {});
    }
    return normalize(base);
  }

  /* สร้าง Delta Patch จากความต่างระหว่าง before -> after */
  function buildPatch(before, after) {
    const patch = {
      code: after.code,
      roundId: after.roundId || 1,
      unsynced: (after.hostUpdatedAt || 0) === 0,
      players: {},
      feed: {}
    };
    let hasChange = false;
    const bPlayers = (before && before.players) || {};
    for (const [pid, p] of Object.entries(after.players || {})) {
      if (!bPlayers[pid] || JSON.stringify(bPlayers[pid]) !== JSON.stringify(p)) {
        patch.players[pid] = clean(p);
        hasChange = true;
      }
    }
    const bFeed = (before && before.feed) || {};
    for (const [fid, f] of Object.entries(after.feed || {})) {
      if (!bFeed[fid]) {
        patch.feed[fid] = clean(f);
        hasChange = true;
      }
    }
    if (after.bonus && after.bonus.answered) {
      const bAns = (before && before.bonus && before.bonus.id === after.bonus.id && before.bonus.answered) || {};
      const added = {};
      let hasAns = false;
      for (const [pid, val] of Object.entries(after.bonus.answered)) {
        if (bAns[pid] === undefined) { added[pid] = val; hasAns = true; }
      }
      if (hasAns) {
        patch.bonusAnswered = { bid: after.bonus.id, map: added };
        hasChange = true;
      }
    }
    return hasChange ? patch : null;
  }

  function emit(r) {
    last = normalize(r ? clean(r) : null);
    if (cb) cb(last);
  }
  function emitConn(state) {
    if (connCb) connCb(state);
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  /* ---------- 🌐 Cloud Realtime (MQTT over WSS + Delta Patch + Broker Failover) ---------- */
  const cloud = {
    key: c => 'sqa_room_' + c,
    readLocal(c) { try { return JSON.parse(localStorage.getItem(this.key(c || code))); } catch (e) { return null; } },
    writeLocal(r, c) {
      try { localStorage.setItem(this.key(c || code), JSON.stringify(clean(r))); } catch (e) {}
      if (this.bc) { try { this.bc.postMessage('u'); } catch (e) {} }
    },
    prefix() { return (cfg.cloud && cfg.cloud.topicPrefix) || 'sciquest_arena_v2'; },
    topicState(c) { return `${this.prefix()}/room/${c || code}/state`; },
    topicPatch(c) { return `${this.prefix()}/room/${c || code}/patch`; },
    topicPing(c)  { return `${this.prefix()}/room/${c || code}/ping`; },

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

    scheduleHostStatePublish(immediate = false) {
      if (!isHostRole || !this.cur) return;
      if (immediate) {
        clearTimeout(this.pubTimer);
        this.pubTimer = null;
        this.publishState(this.cur);
        return;
      }
      if (this.pubTimer) return;
      this.pubTimer = setTimeout(() => {
        this.pubTimer = null;
        if (this.cur) this.publishState(this.cur);
      }, 420);
    },

    publishState(r) {
      if (!this.client || !this.client.connected || !r) return;
      try {
        this.client.publish(this.topicState(r.code || code), JSON.stringify(clean(r)), { qos: 0, retain: true });
      } catch (e) {}
    },

    publishPatch(patch) {
      if (!this.client || !this.client.connected || !patch) return;
      try {
        this.client.publish(this.topicPatch(code), JSON.stringify(patch), { qos: 0, retain: false });
      } catch (e) {}
    },

    startMqttClient(brokerIdx, onInitialDone) {
      const brokers = (cfg.cloud && cfg.cloud.brokers && cfg.cloud.brokers.length)
        ? cfg.cloud.brokers
        : ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];
      const brokerUrl = brokers[brokerIdx % brokers.length];
      this.brokerIdx = brokerIdx;

      const tState = this.topicState(code);
      const tPatch = this.topicPatch(code);
      const tPing = this.topicPing(code);
      this.lastPingReplyAt = 0;

      if (this.client) {
        try { this.client.end(true); } catch (e) {}
        this.client = null;
      }

      emitConn('reconnecting');
      let failCount = 0;

      try {
        this.client = window.mqtt.connect(brokerUrl, {
          clientId: (isHostRole ? 'sqah_' : 'sqap_') + Math.random().toString(36).slice(2, 10),
          clean: true,
          keepalive: 25,
          connectTimeout: 4000,
          reconnectPeriod: 2000
        });

        this.client.on('connect', () => {
          failCount = 0;
          emitConn('connected');
          const subs = isHostRole ? [tState, tPatch, tPing] : [tState, tPatch];
          this.client.subscribe(subs, { qos: 0 }, () => {
            if (isHostRole) {
              if (this.cur) this.scheduleHostStatePublish(true);
            } else {
              // ผู้เล่นขอรับสถานะล่าสุดจาก Host (เฉพาะ Host เท่านั้นที่จะตอบ!)
              this.client.publish(tPing, '1', { qos: 0 });
              // หากผู้เล่นมีข้อมูลตัวเองค้างอยู่ (เช่น เพิ่งตื่นจากล็อกหน้าจอ) ให้ส่ง patch ตัวเองซ้ำเพื่อความชัวร์
              if (this.pendingPatch) {
                this.publishPatch(this.pendingPatch);
                this.pendingPatch = null;
              }
            }
          });
        });

        this.client.on('message', (topic, payload) => {
          if (topic === tPing) {
            // เฉพาะ Host เท่านั้นที่ตอบ Ping และจำกัดไม่เกิน 1 ครั้งต่อ 1.2 วินาที (กัน Broadcast Storm)
            if (isHostRole && this.cur && Date.now() - this.lastPingReplyAt > 1200) {
              this.lastPingReplyAt = Date.now();
              this.scheduleHostStatePublish(true);
            }
            return;
          }
          if (topic === tPatch) {
            try {
              const patch = JSON.parse(payload.toString());
              if (patch && patch.code === code) {
                this.cur = applyPatch(this.cur, patch);
                this.writeLocal(this.cur);
                emit(this.cur);
                if (isHostRole) this.scheduleHostStatePublish(false);
              }
            } catch (e) {}
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
            if (onInitialDone) { const fn = onInitialDone; onInitialDone = null; fn(); }
          }
        });

        this.client.on('reconnect', () => emitConn('reconnecting'));
        this.client.on('offline', () => emitConn('reconnecting'));
        this.client.on('error', () => {
          failCount++;
          if (failCount >= 2 && brokers.length > 1) {
            // สลับไป Broker สำรองอัตโนมัติ
            this.startMqttClient(brokerIdx + 1, onInitialDone);
          }
        });
      } catch (e) {
        emitConn('offline');
        if (onInitialDone) { const fn = onInitialDone; onInitialDone = null; fn(); }
      }
    },

    async connect() {
      this.cur = normalize(this.readLocal());
      this.pendingPatch = null;
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

      // ปลุกการเชื่อมต่อทันทีเมื่อนักเรียนปลดล็อกจอมือถือหรือสลับแท็บกลับมา
      this.onWake = () => {
        if (document.visibilityState === 'hidden') return;
        if (!this.client) return;
        if (!this.client.connected) {
          emitConn('reconnecting');
          try { this.client.reconnect(); } catch (e) {}
        } else if (!isHostRole) {
          try { this.client.publish(this.topicPing(code), '1', { qos: 0 }); } catch (e) {}
        }
      };
      document.addEventListener('visibilitychange', this.onWake);
      window.addEventListener('online', this.onWake);

      const ok = await this.ensureMqtt();
      if (!ok) { emitConn('offline'); emit(this.cur); return; }

      await new Promise(resolve => {
        let settled = false;
        const done = () => { if (!settled) { settled = true; resolve(); } };
        const timer = setTimeout(done, 1600);
        this.startMqttClient(0, () => { clearTimeout(timer); done(); });
      });

      emit(this.cur);
    },

    async exists() { return true; },

    async transact(fn, allowCreate) {
      const loc = normalize(this.readLocal());
      if (loc) this.cur = mergeRooms(this.cur, loc);
      if (!this.cur && !allowCreate) this.cur = defaultRoom(code);
      const before = this.cur ? clean(this.cur) : defaultRoom(code);
      const next = fn(clean(before));
      if (next === undefined) return this.cur;
      this.cur = normalize(clean(next));
      this.writeLocal(this.cur);

      if (isHostRole) {
        // Host เป็นผู้ประกาศ State หลัก (retained) เสมอ
        this.scheduleHostStatePublish(true);
      } else {
        // Player ส่งเฉพาะ Delta Patch ขนาดเล็ก -> เร็ว เสถียร ไม่ทับคนอื่น!
        const patch = buildPatch(before, this.cur);
        if (patch) {
          if (this.client && this.client.connected) this.publishPatch(patch);
          else this.pendingPatch = patch;
        }
      }
      emit(this.cur);
      return this.cur;
    },

    disconnect() {
      clearTimeout(this.pubTimer);
      this.pubTimer = null;
      if (this.bc) { try { this.bc.close(); } catch (e) {} this.bc = null; }
      if (this.onStorage) window.removeEventListener('storage', this.onStorage);
      if (this.onWake) {
        document.removeEventListener('visibilitychange', this.onWake);
        window.removeEventListener('online', this.onWake);
      }
      if (this.client) { try { this.client.end(true); } catch (e) {} this.client = null; }
      this.cur = null;
      this.pendingPatch = null;
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
      emitConn('connected');
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
        this.handler = this.ref.on('value', s => {
          emitConn('connected');
          emit(s.val());
          if (first) { first = false; res(); }
        });
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
      const row = await this.fetchRow(code);
      emitConn('connected');
      emit(row ? row.state : null);
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
    async connect(c, onChange, opts = {}) {
      if (adapter) adapter.disconnect();
      code = c; cb = onChange;
      isHostRole = !!opts.isHost;
      connCb = opts.onConn || null;
      adapter = pick();
      await adapter.connect();
    },
    exists: c => pick().exists(c),
    create: c => adapter.transact(cur => (cur && cur.code) ? cur : defaultRoom(c), true),
    transact: fn => adapter.transact(fn, false),
    disconnect() { if (adapter) adapter.disconnect(); adapter = null; cb = null; connCb = null; last = null; },
    defaultRoom,
    mergeRooms,
    applyPatch,
    buildPatch,
    pushFeed(room, e) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      room.feed[id] = Object.assign({ id, t: Date.now(), roundId: room.roundId || 1 }, e);
      const keys = Object.keys(room.feed).sort((a, b) => room.feed[a].t - room.feed[b].t);
      while (keys.length > 40) delete room.feed[keys.shift()];
    }
  };
})();
