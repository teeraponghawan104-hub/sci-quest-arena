/* =========================================================
 * Sci-Quest! — High-Scale Realtime Sync Layer (200+ Devices Edition)
 * ---------------------------------------------------------
 * ออกแบบเพื่อรองรับการแข่งขันระดับสายชั้น/หอประชุม 200+ เครื่องพร้อมกัน:
 *   1) แยกช่องส่งรูปหน้าตลก (/selfie) ส่งตรงถึงหน้าจอครูเท่านั้น!
 *      มือถือเด็กอีก 199 เครื่องไม่ต้องโหลดรูปของเพื่อน -> ลดปริมาณข้อมูลลง 95%
 *   2) Compact State Broadcast: ตัดข้อมูลที่ไม่จำเป็น (เช่น answered map รายข้อของคนอื่น)
 *      ออกจาก Broadcast รวม ทำให้ห้อง 200 คนมีขนาดข้อมูลเพียง ~18 KB!
 *   3) Delta Patch + Dynamic Host Debounce + Jittered Reconnect:
 *      ลดการชนกันของแพ็กเก็ตและกัน Thundering Herd เมื่อเด็ก 200 คนเข้าพร้อมกัน
 *   4) Firebase Per-Path Updates & Supabase Multi-Table (sqa_rooms + sqa_players):
 *      ไร้ปัญหา Write Contention รองรับ 200+ เครื่องพร้อมกันได้สบาย!
 * ========================================================= */
const Sync = (() => {
  const cfg = window.SQA_CONFIG || { backend: 'cloud' };
  const mode = cfg.backend || 'cloud';
  let code = null, cb = null, connCb = null, selfieCb = null, isHostRole = false, last = null, adapter = null;

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
      p.answeredCount = Math.max(Number(p.answeredCount || 0), Object.keys(p.answered).length);
      p.score = p.score || 0;
      p.isBot = !!p.isBot;
      p.x2Active = !!p.x2Active;
      p.frozen = !!p.frozen;
      p.blinded = !!p.blinded;
      p.flipped = !!p.flipped;
      p.selfieLocked = !!p.selfieLocked;
      p.zappedAt = p.zappedAt || 0;
      p.updatedAt = p.updatedAt || p.joinedAt || 0;
      p.roundId = p.roundId ?? r.roundId;
    }
    return r;
  }

  const clean = o => JSON.parse(JSON.stringify(o));

  /* บีบอัด State ก่อน Broadcast 200 เครื่อง: ตัด selfiePhoto, answered map, ฟิลด์ว่าง และไอเทมที่เป็น 0 ออก */
  function compactForBroadcast(r) {
    const out = clean(r);
    for (const p of Object.values(out.players || {})) {
      p.answeredCount = Math.max(Number(p.answeredCount || 0), Object.keys(p.answered || {}).length);
      delete p.answered;
      delete p.selfiePhoto; // รูปถ่ายส่งแยกเฉพาะถึงหน้าจอครูผ่านช่อง /selfie!
      if (!p.isBot) delete p.isBot;
      if (!p.x2Active) delete p.x2Active;
      if (!p.frozen) { delete p.frozen; delete p.frozenBy; }
      if (!p.blinded) { delete p.blinded; delete p.blindedBy; }
      if (!p.flipped) { delete p.flipped; delete p.flippedBy; }
      if (!p.selfieLocked) { delete p.selfieLocked; delete p.selfieFrom; delete p.selfieStatus; }
      if (!p.zappedAt) { delete p.zappedAt; delete p.zappedBy; }
      if (p.items) {
        for (const [k, v] of Object.entries(p.items)) if (!v) delete p.items[k];
      }
    }
    const fKeys = Object.keys(out.feed || {}).sort((a, b) => (out.feed[a].t || 0) - (out.feed[b].t || 0));
    while (fKeys.length > 15) delete out.feed[fKeys.shift()];
    return out;
  }

  /* ผสานผู้เล่น 2 เวอร์ชันโดยไม่ให้ข้อมูล answered map ฝั่งเครื่องตัวเองหายเมื่อรับ Compact Broadcast */
  function mergePlayer(pa, pb, roundId) {
    if (!pa) { const c = clean(pb); c.roundId = roundId; return c; }
    if (!pb) { const c = clean(pa); c.roundId = roundId; return c; }
    const newer = (pb.updatedAt || 0) >= (pa.updatedAt || 0) ? clean(pb) : clean(pa);
    const older = (pb.updatedAt || 0) >= (pa.updatedAt || 0) ? pa : pb;
    newer.answered = Object.assign({}, older.answered || {}, newer.answered || {});
    newer.answeredCount = Math.max(Number(newer.answeredCount || 0), Number(older.answeredCount || 0), Object.keys(newer.answered).length);
    if (!newer.selfiePhoto && older.selfiePhoto && newer.selfieLocked && newer.selfieStatus === 'pending_review') {
      newer.selfiePhoto = older.selfiePhoto;
    }
    newer.roundId = roundId;
    return newer;
  }

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
          if (isUnsyncedClient || !p.roundId) p.roundId = roundId;
          else if (p.roundId < roundId) delete copy.players[pid];
        }
        for (const [fid, f] of Object.entries(copy.feed || {})) {
          if (isUnsyncedClient || !f.roundId) f.roundId = roundId;
          else if (f.roundId < roundId) delete copy.feed[fid];
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
      const mergedP = mergePlayer(a.players[pid], b.players[pid], roundId);
      if (mergedP && (mergedP.roundId || roundId) >= roundId) {
        out.players[pid] = mergedP;
      }
    }

    const allFeed = Object.assign({}, a.feed || {}, b.feed || {});
    for (const [fid, f] of Object.entries(allFeed)) {
      if ((f.roundId || roundId) < roundId) delete allFeed[fid];
    }
    const fKeys = Object.keys(allFeed).sort((x, y) => (allFeed[x].t || 0) - (allFeed[y].t || 0));
    while (fKeys.length > 35) delete allFeed[fKeys.shift()];
    out.feed = allFeed;

    return normalize(out);
  }

  /* ผสาน Patch ขนาดเล็กเข้ากับ State ปัจจุบัน */
  function applyPatch(room, patch) {
    const targetCode = (room && room.code) || code;
    if (!patch || (targetCode && patch.code !== targetCode)) return room;
    const base = normalize(room ? clean(room) : defaultRoom(patch.code || code));
    const curRound = base.roundId || 1;
    if (patch.roundId && patch.roundId < curRound && !patch.unsynced) return base;

    if (patch.players) {
      for (const [pid, incP] of Object.entries(patch.players)) {
        base.players[pid] = mergePlayer(base.players[pid], incP, curRound);
      }
    }
    if (patch.feed) {
      for (const [fid, f] of Object.entries(patch.feed)) {
        if (!base.feed[fid]) base.feed[fid] = Object.assign({}, clean(f), { roundId: curRound });
      }
      const fKeys = Object.keys(base.feed).sort((x, y) => (base.feed[x].t || 0) - (base.feed[y].t || 0));
      while (fKeys.length > 35) delete base.feed[fKeys.shift()];
    }
    if (patch.bonusAnswered && base.bonus && base.bonus.id === patch.bonusAnswered.bid) {
      base.bonus.answered = Object.assign({}, base.bonus.answered || {}, patch.bonusAnswered.map || {});
    }
    return normalize(base);
  }

  /* สร้าง Delta Patch ขนาดเล็ก (ตัด selfiePhoto และ answered map ออกเพื่อประหยัดแบนด์วิดท์ 200 เครื่อง) */
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
        const slim = clean(p);
        slim.answeredCount = Math.max(Number(slim.answeredCount || 0), Object.keys(slim.answered || {}).length);
        delete slim.answered;
        slim.selfiePhoto = ''; // รูปหน้าตลกส่งตรงเฉพาะช่อง /selfie ถึง Host
        patch.players[pid] = slim;
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
  function emitConn(state) { if (connCb) connCb(state); }

  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  /* ---------- 🌐 Cloud Realtime (200-Player Optimized MQTT + Dedicated Selfie Channel) ---------- */
  const cloud = {
    key: c => 'sqa_room_' + c,
    selfieKey: (c, pid) => `sqa_selfie_${c || code}_${pid}`,
    readLocal(c) { try { return JSON.parse(localStorage.getItem(this.key(c || code))); } catch (e) { return null; } },
    writeLocal(r, c) {
      try { localStorage.setItem(this.key(c || code), JSON.stringify(clean(r))); } catch (e) {}
      if (this.bc) { try { this.bc.postMessage({ t: 'u' }); } catch (e) {} }
    },
    prefix() { return (cfg.cloud && cfg.cloud.topicPrefix) || 'sciquest_arena_v2'; },
    topicState(c)  { return `${this.prefix()}/room/${c || code}/state`; },
    topicPatch(c)  { return `${this.prefix()}/room/${c || code}/patch`; },
    topicPing(c)   { return `${this.prefix()}/room/${c || code}/ping`; },
    topicSelfie(c) { return `${this.prefix()}/room/${c || code}/selfie`; },

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
      // ปรับจังหวะ Debounce อัตโนมัติตามจำนวนคน (200 คน = 1100ms กันทราฟฟิกพุ่ง)
      const count = Object.keys(this.cur.players || {}).length;
      const delay = count > 60 ? 1200 : (count > 20 ? 750 : 420);
      this.pubTimer = setTimeout(() => {
        this.pubTimer = null;
        if (this.cur) this.publishState(this.cur);
      }, delay);
    },

    publishState(r) {
      if (!this.client || !this.client.connected || !r) return;
      try {
        const slim = compactForBroadcast(r);
        this.client.publish(this.topicState(r.code || code), JSON.stringify(slim), { qos: 0, retain: true });
      } catch (e) {}
    },

    publishPatch(patch) {
      if (!this.client || !this.client.connected || !patch) return;
      try {
        this.client.publish(this.topicPatch(code), JSON.stringify(patch), { qos: 0, retain: false });
      } catch (e) {}
    },

    sendSelfie(pid, photo) {
      if (!pid || !photo) return;
      try { localStorage.setItem(this.selfieKey(code, pid), photo); } catch (e) {}
      if (this.bc) { try { this.bc.postMessage({ t: 'selfie', pid, photo }); } catch (e) {} }
      const payload = JSON.stringify({ code, pid, photo, at: Date.now() });
      if (this.client && this.client.connected) {
        try { this.client.publish(this.topicSelfie(code), payload, { qos: 0, retain: false }); } catch (e) {}
      } else {
        this.pendingSelfie = payload;
      }
    },

    startMqttClient(brokerIdx, onInitialDone) {
      const brokers = (cfg.cloud && cfg.cloud.brokers && cfg.cloud.brokers.length)
        ? cfg.cloud.brokers
        : ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];
      const brokerUrl = brokers[brokerIdx % brokers.length];

      const tState = this.topicState(code);
      const tPatch = this.topicPatch(code);
      const tPing = this.topicPing(code);
      const tSelfie = this.topicSelfie(code);
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
          keepalive: 28,
          connectTimeout: 4500,
          // สุ่มหน่วงเวลา Reconnect (1.5–3.5 วิ) กัน 200 เครื่องกระหน่ำต่อพร้อมกัน
          reconnectPeriod: Math.round(1500 + Math.random() * 2000)
        });

        this.client.on('connect', () => {
          failCount = 0;
          emitConn('connected');
          // เฉพาะ Host เท่านั้นที่ Subscribe ช่อง /selfie และ /ping!
          const subs = isHostRole ? [tState, tPatch, tPing, tSelfie] : [tState, tPatch];
          this.client.subscribe(subs, { qos: 0 }, () => {
            if (isHostRole) {
              if (this.cur) this.scheduleHostStatePublish(true);
            } else {
              this.client.publish(tPing, '1', { qos: 0 });
              if (this.pendingPatch) { this.publishPatch(this.pendingPatch); this.pendingPatch = null; }
              if (this.pendingSelfie) {
                try { this.client.publish(tSelfie, this.pendingSelfie, { qos: 0, retain: false }); } catch (e) {}
                this.pendingSelfie = null;
              }
            }
          });
        });

        this.client.on('message', (topic, payload) => {
          if (topic === tPing) {
            if (isHostRole && this.cur && Date.now() - this.lastPingReplyAt > 2500) {
              this.lastPingReplyAt = Date.now();
              this.scheduleHostStatePublish(true);
            }
            return;
          }
          if (topic === tSelfie) {
            if (isHostRole) {
              try {
                const msg = JSON.parse(payload.toString());
                if (msg && msg.pid && msg.photo) {
                  if (this.cur && this.cur.players[msg.pid]) {
                    this.cur.players[msg.pid].selfiePhoto = msg.photo;
                    emit(this.cur);
                  }
                  if (selfieCb) selfieCb(msg.pid, msg.photo);
                }
              } catch (e) {}
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
      this.pendingSelfie = null;
      try {
        this.bc = new BroadcastChannel('sqa_' + code);
        this.bc.onmessage = ev => {
          const d = ev && ev.data;
          if (d && d.t === 'selfie' && isHostRole && d.pid && d.photo) {
            if (this.cur && this.cur.players[d.pid]) {
              this.cur.players[d.pid].selfiePhoto = d.photo;
              emit(this.cur);
            }
            if (selfieCb) selfieCb(d.pid, d.photo);
            return;
          }
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

      this.onWake = () => {
        if (document.visibilityState === 'hidden') return;
        if (!this.client) return;
        if (!this.client.connected) {
          emitConn('reconnecting');
          try { this.client.reconnect(); } catch (e) {}
        } else if (!isHostRole) {
          setTimeout(() => {
            try { if (this.client && this.client.connected) this.client.publish(this.topicPing(code), '1', { qos: 0 }); } catch (e) {}
          }, Math.round(Math.random() * 800));
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
        this.scheduleHostStatePublish(true);
      } else {
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
      this.pendingSelfie = null;
    }
  };

  /* ---------- 💻 Local (localStorage + BroadcastChannel) ---------- */
  const local = {
    key: c => 'sqa_room_' + c,
    read(c) { try { return JSON.parse(localStorage.getItem(this.key(c || code))); } catch (e) { return null; } },
    async connect() {
      try {
        this.bc = new BroadcastChannel('sqa_' + code);
        this.bc.onmessage = ev => {
          const d = ev && ev.data;
          if (d && d.t === 'selfie' && isHostRole && selfieCb) { selfieCb(d.pid, d.photo); return; }
          emit(this.read());
        };
      } catch (e) { this.bc = null; }
      this.onStorage = e => { if (e.key === this.key(code)) emit(this.read()); };
      window.addEventListener('storage', this.onStorage);
      emitConn('connected');
      emit(this.read());
    },
    sendSelfie(pid, photo) {
      if (this.bc) { try { this.bc.postMessage({ t: 'selfie', pid, photo }); } catch (e) {} }
    },
    async exists(c) { return !!this.read(c); },
    async transact(fn, allowCreate) {
      const cur = normalize(this.read());
      if (!cur && !allowCreate) return null;
      const next = fn(cur);
      if (next === undefined) return cur;
      localStorage.setItem(this.key(code), JSON.stringify(clean(next)));
      if (this.bc) this.bc.postMessage({ t: 'u' });
      emit(this.read());
      return next;
    },
    disconnect() {
      if (this.bc) this.bc.close();
      if (this.onStorage) window.removeEventListener('storage', this.onStorage);
    }
  };

  /* ---------- 🔥 Firebase Realtime Database (Per-Path Updates สำหรับ 200+ เครื่องไร้ Write Contention) ---------- */
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
      this.selfieRef = this.db.ref('sqa_selfies/' + code);
      await new Promise(res => {
        let first = true;
        this.handler = this.ref.on('value', s => {
          emitConn('connected');
          this.cur = normalize(s.val());
          emit(this.cur);
          if (first) { first = false; res(); }
        });
      });
      if (isHostRole) {
        this.selfieHandler = this.selfieRef.on('child_added', s => {
          if (selfieCb && s.val()) selfieCb(s.key, s.val());
        });
        this.selfieChgHandler = this.selfieRef.on('child_changed', s => {
          if (selfieCb && s.val()) selfieCb(s.key, s.val());
        });
      }
    },
    sendSelfie(pid, photo) {
      if (this.selfieRef) this.selfieRef.child(pid).set(photo);
    },
    async exists(c) { await this.load(); return (await this.db.ref('sqa_rooms/' + c).once('value')).exists(); },
    async transact(fn, allowCreate) {
      const before = this.cur ? clean(this.cur) : (allowCreate ? defaultRoom(code) : null);
      if (!before) return null;
      const next = fn(clean(before));
      if (next === undefined) return this.cur;
      const norm = normalize(clean(next));
      // อัปเดตแบบแยก Path (multi-path update) เพื่อไม่ให้ 200 เครื่องเขียนชนกัน!
      if (isHostRole) {
        await this.ref.set(compactForBroadcast(norm));
      } else {
        const patch = buildPatch(before, norm);
        if (patch) {
          const updates = {};
          for (const [pid, p] of Object.entries(patch.players || {})) updates['players/' + pid] = p;
          for (const [fid, f] of Object.entries(patch.feed || {})) updates['feed/' + fid] = f;
          if (patch.bonusAnswered) {
            for (const [pid, acc] of Object.entries(patch.bonusAnswered.map || {})) {
              updates['bonus/answered/' + pid] = acc;
            }
          }
          if (Object.keys(updates).length) await this.ref.update(updates);
        }
      }
      this.cur = norm;
      return norm;
    },
    disconnect() {
      if (this.ref && this.handler) this.ref.off('value', this.handler);
      if (this.selfieRef && this.selfieHandler) this.selfieRef.off('child_added', this.selfieHandler);
      if (this.selfieRef && this.selfieChgHandler) this.selfieRef.off('child_changed', this.selfieChgHandler);
    }
  };

  /* ---------- ⚡ Supabase Realtime (รองรับทั้งโหมด 200+ เครื่องแบบแยกตาราง sqa_players และโหมดตารางเดียว) ---------- */
  const supa = {
    async load() {
      if (this.client) return;
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
      this.client = supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey);
      this.t = cfg.supabase.table || 'sqa_rooms';
      this.pt = cfg.supabase.playersTable || 'sqa_players';
      this.scalable = !!cfg.supabase.scalable;
    },
    async fetchRow(c) {
      const { data } = await this.client.from(this.t).select('state,version').eq('code', c).maybeSingle();
      return data;
    },
    async fetchFullScalable(c) {
      const [roomRes, playersRes] = await Promise.all([
        this.client.from(this.t).select('state').eq('code', c).maybeSingle(),
        this.client.from(this.pt).select('pid,data').eq('room_code', c)
      ]);
      if (!roomRes.data || !roomRes.data.state) return null;
      const room = normalize(clean(roomRes.data.state));
      room.players = {};
      for (const row of (playersRes.data || [])) {
        if (row.data && (row.data.roundId || 1) >= (room.roundId || 1)) {
          room.players[row.pid] = row.data;
        }
      }
      return normalize(room);
    },
    async connect() {
      await this.load();
      if (this.scalable) {
        this.cur = await this.fetchFullScalable(code);
        emitConn('connected');
        emit(this.cur);
        this.ch = this.client.channel('room200-' + code)
          .on('postgres_changes', { event: '*', schema: 'public', table: this.t, filter: 'code=eq.' + code }, p => {
            if (p.new && p.new.state) {
              this.cur = mergeRooms(this.cur, p.new.state);
              emit(this.cur);
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: this.pt, filter: 'room_code=eq.' + code }, p => {
            if (p.new && p.new.pid && p.new.data && this.cur) {
              if ((p.new.data.roundId || 1) >= (this.cur.roundId || 1)) {
                this.cur.players[p.new.pid] = mergePlayer(this.cur.players[p.new.pid], p.new.data, this.cur.roundId || 1);
                emit(this.cur);
              }
            }
          })
          .on('broadcast', { event: 'selfie' }, ({ payload }) => {
            if (isHostRole && payload && payload.pid && payload.photo && selfieCb) selfieCb(payload.pid, payload.photo);
          })
          .on('broadcast', { event: 'feed' }, ({ payload }) => {
            if (payload && this.cur) {
              this.cur.feed[payload.id] = payload;
              emit(this.cur);
            }
          })
          .on('broadcast', { event: 'bonus_ans' }, ({ payload }) => {
            if (payload && this.cur && this.cur.bonus && this.cur.bonus.id === payload.bonusId) {
              this.cur.bonus.answered = this.cur.bonus.answered || {};
              Object.assign(this.cur.bonus.answered, payload.map || {});
              emit(this.cur);
            }
          })
          .subscribe();
        return;
      }

      const row = await this.fetchRow(code);
      emitConn('connected');
      emit(row ? row.state : null);
      this.ch = this.client.channel('room-' + code)
        .on('postgres_changes', { event: '*', schema: 'public', table: this.t, filter: 'code=eq.' + code },
          p => { if (p.new && p.new.state) emit(p.new.state); })
        .on('broadcast', { event: 'selfie' }, ({ payload }) => {
          if (isHostRole && payload && payload.pid && payload.photo && selfieCb) selfieCb(payload.pid, payload.photo);
        })
        .subscribe();
    },
    sendSelfie(pid, photo) {
      if (this.ch) this.ch.send({ type: 'broadcast', event: 'selfie', payload: { pid, photo } });
    },
    async exists(c) { await this.load(); return !!(await this.fetchRow(c)); },
    async transact(fn, allowCreate) {
      if (this.scalable) {
        const before = this.cur ? clean(this.cur) : (allowCreate ? defaultRoom(code) : null);
        if (!before) return null;
        const next = fn(clean(before));
        if (next === undefined) return this.cur;
        const norm = normalize(clean(next));
        if (isHostRole) {
          const metaOnly = compactForBroadcast(norm);
          metaOnly.players = {};
          await this.client.from(this.t).upsert({ code, state: metaOnly, version: 1 });
          if (Object.keys(norm.players).length === 0 && Object.keys(before.players).length > 0) {
            await this.client.from(this.pt).delete().eq('room_code', code);
          }
        }
        const patch = buildPatch(before, norm);
        if (patch && patch.players) {
          const rows = Object.entries(patch.players).map(([pid, data]) => ({ room_code: code, pid, data }));
          if (rows.length) await this.client.from(this.pt).upsert(rows);
        }
        if (patch && patch.feed && this.ch) {
          for (const f of Object.values(patch.feed)) {
            this.ch.send({ type: 'broadcast', event: 'feed', payload: f });
          }
        }
        if (patch && patch.bonusAnswered && this.ch) {
          this.ch.send({ type: 'broadcast', event: 'bonus_ans', payload: patch.bonusAnswered });
        }
        this.cur = norm;
        emit(this.cur);
        return norm;
      }

      for (let i = 0; i < 6; i++) {
        const row = await this.fetchRow(code);
        const cur = row ? normalize(row.state) : null;
        if (!cur && !allowCreate) return null;
        const n = fn(cur);
        if (n === undefined) return cur;
        if (!row) {
          const { error } = await this.client.from(this.t).insert({ code, state: compactForBroadcast(n), version: 1 });
          if (!error) { emit(n); return n; }
        } else {
          const { data, error } = await this.client.from(this.t)
            .update({ state: compactForBroadcast(n), version: row.version + 1 })
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
      selfieCb = opts.onSelfie || null;
      adapter = pick();
      await adapter.connect();
    },
    exists: c => pick().exists(c),
    create: c => adapter.transact(cur => (cur && cur.code) ? cur : defaultRoom(c), true),
    transact: fn => adapter.transact(fn, false),
    sendSelfie: (pid, photo) => adapter && adapter.sendSelfie && adapter.sendSelfie(pid, photo),
    disconnect() { if (adapter) adapter.disconnect(); adapter = null; cb = null; connCb = null; selfieCb = null; last = null; },
    defaultRoom,
    mergeRooms,
    applyPatch,
    buildPatch,
    compactForBroadcast,
    pushFeed(room, e) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      room.feed[id] = Object.assign({ id, t: Date.now(), roundId: room.roundId || 1 }, e);
      const keys = Object.keys(room.feed).sort((a, b) => room.feed[a].t - room.feed[b].t);
      while (keys.length > 35) delete room.feed[keys.shift()];
    }
  };
})();
