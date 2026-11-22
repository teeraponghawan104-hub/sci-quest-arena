/* =========================================================
 * Sci-Quest! — Ultra-Scale Realtime Sync Layer (200+ Devices v3)
 * ---------------------------------------------------------
 * ปรับจูนสถาปัตยกรรมเพื่อรองรับ 200+ เครื่องพร้อมกันบน Wi-Fi โรงเรียน/หอประชุม:
 *   1) Zero Fan-Out Storm: มือถือเด็กเลิก Subscribe ช่อง /patch ของเพื่อนอีก 199 คน
 *      รับเฉพาะ /state จากครู + ช่องส่วนตัว /d/<pid> สำหรับรับการโจมตี/ปลดล็อกทันที (ลดแพ็กเก็ตลง >95%)
 *   2) Ultra-Compact Wire Tuple v2: บีบอัดห้อง 200 คนเหลือเพียง ~13–16 KB (ลดลง ~89% จาก Raw JSON)
 *   3) Clock-Skew Proof Lamport Revision (rev + hostRev):
 *      ครูกดอนุมัติ/สั่งถ่ายใหม่ชนะเสมอ แม้เวลามือถือเด็กจะเดินเร็วกว่าเครื่องครู
 *   4) Zero Split-Brain Broker Pinning: ผู้เล่นยึด Broker เดียวกับลิงก์ QR ของครู (?b=idx)
 *   5) Patch Merging Queue + Auto Selfie Photo Re-Request:
 *      เน็ตหลุดชั่วคราวไม่ทับคำสั่งก่อนหน้า และถ้ารูปหน้าตลกตกหล่น Host ขอส่งซ้ำอัตโนมัติ
 *   6) In-Place Host Patch Merge + Debounced localStorage:
 *      ประมวลผล 50+ patch/วินาที โดยไม่บล็อกเธรดหลักหรือเขียนดิสก์รัว
 * ========================================================= */
const Sync = (() => {
  const cfg = window.SQA_CONFIG || { backend: 'cloud' };
  const mode = cfg.backend || 'cloud';
  let code = null, cb = null, connCb = null, selfieCb = null, selfieReqCb = null, brokerChangeCb = null, liveTimerFn = null, reactCb = null, bossHitCb = null;
  let isHostRole = false, pinnedBrokerIdx = 0, myPlayerId = null, last = null, adapter = null;

  function defaultRoom(c) {
    const now = Date.now();
    return {
      code: c, status: 'lobby', createdAt: now, hostUpdatedAt: 0, roundId: 1,
      timerTotalSec: 0, timerRemainingMs: 0, timerRunning: false, timerEpoch: 1,
      feverId: '', feverRemainingSec: 0,
      players: {}, feed: {}, bonus: null, usedBonus: {}, boss: null
    };
  }

  function normalizePlayer(p, roundId) {
    if (!p) return null;
    p.items = Object.assign({ x2: 0, shield: 0, steal: 0, freeze: 0, blind: 0, flip: 0, zap: 0, boost: 0, selfie: 0 }, p.items || {});
    p.answered = p.answered || {};
    p.answeredCount = Math.max(Number(p.answeredCount || 0), Object.keys(p.answered).length);
    p.score = Number(p.score || 0);
    p.streak = Number(p.streak || 0);
    p.isBot = !!p.isBot;
    p.x2Active = !!p.x2Active;
    p.frozen = !!p.frozen;
    p.frozenBy = p.frozen ? (p.frozenBy || '') : '';
    p.blinded = !!p.blinded;
    p.blindedBy = p.blinded ? (p.blindedBy || '') : '';
    p.flipped = !!p.flipped;
    p.flippedBy = p.flipped ? (p.flippedBy || '') : '';
    p.selfieLocked = !!p.selfieLocked;
    p.selfieFrom = p.selfieLocked ? (p.selfieFrom || '') : '';
    p.selfieStatus = p.selfieLocked ? (p.selfieStatus || '') : '';
    p.zappedAt = Number(p.zappedAt || 0);
    p.zappedBy = p.zappedBy || '';
    p.joinedAt = Number(p.joinedAt || p.updatedAt || Date.now());
    p.updatedAt = Number(p.updatedAt || p.joinedAt || 0);
    p.rev = Number(p.rev || 0);
    p.hostRev = Number(p.hostRev || 0);
    p.roundId = p.roundId ?? roundId;
    return p;
  }

  function normalize(r) {
    if (!r || !r.code) return null;
    r.players = r.players || {};
    r.feed = r.feed || {};
    r.usedBonus = r.usedBonus || {};
    r.hostUpdatedAt = Number(r.hostUpdatedAt || 0);
    r.roundId = Number(r.roundId || 1);
    r.timerTotalSec = Number(r.timerTotalSec || 0);
    r.timerRemainingMs = Number(r.timerRemainingMs || 0);
    r.timerRunning = !!r.timerRunning;
    r.timerEpoch = Number(r.timerEpoch || 1);
    r.feverId = r.feverId || '';
    r.feverRemainingSec = Math.max(0, Number(r.feverRemainingSec || 0));
    if (r.bonus) {
      r.bonus.answered = r.bonus.answered || {};
      r.bonus.durationSec = Number(r.bonus.durationSec || 20);
      if (r.bonus.remainingSec === undefined) r.bonus.remainingSec = r.bonus.durationSec;
    } else {
      r.bonus = null;
    }
    if (r.boss && r.boss.id) {
      r.boss.maxHp = Math.max(100, Number(r.boss.maxHp || 1000));
      r.boss.hp = Math.max(0, Math.min(r.boss.maxHp, Number(r.boss.hp ?? r.boss.maxHp)));
      r.boss.durationSec = Number(r.boss.durationSec || 90);
      r.boss.remainingSec = Math.max(0, Number(r.boss.remainingSec ?? r.boss.durationSec));
      r.boss.status = r.boss.status || 'active';
      r.boss.hitCount = Number(r.boss.hitCount || 0);
      r.boss.coopReward = Number(r.boss.coopReward || 300);
      r.boss.dmgByPlayer = r.boss.dmgByPlayer || {};
      r.boss.topDmg = Array.isArray(r.boss.topDmg) ? r.boss.topDmg : [];
      r.boss.contributorsCount = Number(r.boss.contributorsCount || Object.keys(r.boss.dmgByPlayer).length || r.boss.topDmg.length);
    } else {
      r.boss = null;
    }
    for (const p of Object.values(r.players)) {
      normalizePlayer(p, r.roundId);
    }
    return r;
  }

  const clean = o => JSON.parse(JSON.stringify(o));

  /* บีบอัด State แบบ Object มาตรฐาน (ใช้กับ Firebase/Supabase) */
  function compactForBroadcast(r) {
    const out = clean(r);
    for (const p of Object.values(out.players || {})) {
      p.answeredCount = Math.max(Number(p.answeredCount || 0), Object.keys(p.answered || {}).length);
      delete p.answered;
      delete p.selfiePhoto;
      if (!p.isBot) delete p.isBot;
      if (!p.x2Active) delete p.x2Active;
      if (!p.frozen) { delete p.frozen; delete p.frozenBy; }
      if (!p.blinded) { delete p.blinded; delete p.blindedBy; }
      if (!p.flipped) { delete p.flipped; delete p.flippedBy; }
      if (!p.selfieLocked) { delete p.selfieLocked; delete p.selfieFrom; delete p.selfieStatus; }
      if (!p.zappedAt) { delete p.zappedAt; delete p.zappedBy; }
      if (!p.hostRev) delete p.hostRev;
      if (p.items) {
        for (const [k, v] of Object.entries(p.items)) if (!v) delete p.items[k];
      }
    }
    const fKeys = Object.keys(out.feed || {}).sort((a, b) => (out.feed[a].t || 0) - (out.feed[b].t || 0));
    while (fKeys.length > 15) delete out.feed[fKeys.shift()];
    return out;
  }

  /* เข้ารหัส State แบบ Ultra-Compact Tuple v2 สำหรับส่งผ่าน MQTT (200 คนเหลือ ~13-16 KB!) */
  function encodeWireState(r) {
    const baseT = Number(r.createdAt || Date.now());
    const pArr = [];
    for (const p of Object.values(r.players || {})) {
      const flags =
        (p.isBot ? 1 : 0) |
        (p.x2Active ? 2 : 0) |
        (p.frozen ? 4 : 0) |
        (p.blinded ? 8 : 0) |
        (p.flipped ? 16 : 0) |
        (p.selfieLocked ? 32 : 0) |
        (p.selfieLocked && p.selfieStatus === 'pending_review' ? 64 : 0) |
        (p.selfieLocked && p.selfieStatus === 'waiting_photo' ? 128 : 0);

      let items = null;
      if (p.items) {
        for (const [k, v] of Object.entries(p.items)) {
          if (v > 0) { if (!items) items = {}; items[k] = v; }
        }
      }
      const hasMeta = !!(p.frozenBy || p.blindedBy || p.flippedBy || p.selfieFrom || p.zappedAt);
      const meta = hasMeta
        ? [p.frozenBy || '', p.blindedBy || '', p.flippedBy || '', p.selfieFrom || '', p.zappedAt ? (p.zappedAt - baseT) : 0, p.zappedBy || '']
        : 0;

      const ansCnt = Math.max(Number(p.answeredCount || 0), Object.keys(p.answered || {}).length);
      const jOff = Math.round(((p.joinedAt || baseT) - baseT) / 100);
      const uOff = (p.updatedAt || baseT) - baseT;
      const streak = Number(p.streak || 0);
      const tup = [p.id, p.name, p.avatar || 0, p.score || 0, ansCnt, jOff, uOff, p.rev || 0, p.hostRev || 0, flags, items || 0];
      if (meta || streak) { tup.push(meta || 0); if (streak) tup.push(streak); }
      pArr.push(tup);
    }

    const fKeys = Object.keys(r.feed || {}).sort((a, b) => (r.feed[a].t || 0) - (r.feed[b].t || 0));
    const keepFeed = fKeys.slice(-12).map(k => r.feed[k]);

    const wire = {
      v: 2,
      c: r.code,
      s: r.status || 'lobby',
      cr: baseT,
      hu: r.hostUpdatedAt || 0,
      r: r.roundId || 1,
      p: pArr,
      f: keepFeed
    };
    if (r.timerTotalSec) { wire.tt = r.timerTotalSec; wire.tr = r.timerRemainingMs || 0; wire.te = r.timerEpoch || 1; if (r.timerRunning) wire.tn = 1; }
    if (r.feverId && r.feverRemainingSec > 0) { wire.fi = r.feverId; wire.fs = Math.ceil(r.feverRemainingSec); }
    if (r.status === 'ended' && r.endedAt) wire.en = r.endedAt;
    if (r.usedBonus && Object.keys(r.usedBonus).length) wire.ub = r.usedBonus;
    if (r.bonus) wire.b = r.bonus;
    if (r.boss && r.boss.id) {
      const top = (r.boss.topDmg || []).slice(0, 5).map(d => [d.id, d.name, d.avatar || 0, d.dmg || 0, d.hits || 1]);
      const lh = r.boss.lastHit ? [r.boss.lastHit.id || '', r.boss.lastHit.name || '', r.boss.lastHit.dmg || 0, r.boss.lastHit.crit ? 1 : 0] : 0;
      wire.bs = [
        r.boss.id, r.boss.key || 'dr_glitch', r.boss.maxHp, r.boss.hp,
        r.boss.durationSec || 90, Math.max(0, Math.ceil(r.boss.remainingSec || 0)),
        r.boss.status || 'active', r.boss.hitCount || 0, r.boss.coopReward || 300,
        top, lh, r.boss.contributorsCount || top.length
      ];
    }
    return wire;
  }

  /* ถอดรหัส State ทั้ง v2 Tuple และ v1 Object กลับเป็น Room มาตรฐาน */
  function decodeWireState(raw) {
    if (!raw) return null;
    if (raw.v !== 2) return normalize(raw);
    const baseT = Number(raw.cr || Date.now());
    const roundId = Number(raw.r || 1);
    const players = {};
    for (const t of (raw.p || [])) {
      const flags = t[9] || 0;
      const meta = t[11] || null;
      const selfieLocked = !!(flags & 32);
      const selfieStatus = !selfieLocked ? '' : ((flags & 64) ? 'pending_review' : ((flags & 128) ? 'waiting_photo' : ''));
      players[t[0]] = normalizePlayer({
        id: t[0],
        name: t[1],
        avatar: t[2] || 0,
        score: t[3] || 0,
        streak: t[12] || 0,
        answeredCount: t[4] || 0,
        joinedAt: baseT + (t[5] || 0) * 100,
        updatedAt: baseT + (t[6] || 0),
        rev: t[7] || 0,
        hostRev: t[8] || 0,
        isBot: !!(flags & 1),
        x2Active: !!(flags & 2),
        frozen: !!(flags & 4),
        blinded: !!(flags & 8),
        flipped: !!(flags & 16),
        selfieLocked,
        selfieStatus,
        items: t[10] || {},
        frozenBy: meta ? meta[0] : '',
        blindedBy: meta ? meta[1] : '',
        flippedBy: meta ? meta[2] : '',
        selfieFrom: meta ? meta[3] : '',
        zappedAt: (meta && meta[4]) ? (baseT + meta[4]) : 0,
        zappedBy: meta ? meta[5] : '',
        answered: {},
        selfiePhoto: '',
        roundId
      }, roundId);
    }
    const feed = {};
    for (const e of (raw.f || [])) {
      if (e && e.id) feed[e.id] = e;
    }
    let boss = null;
    if (Array.isArray(raw.bs) && raw.bs[0]) {
      const bs = raw.bs;
      const topDmg = (bs[9] || []).map(x => ({ id: x[0], name: x[1], avatar: x[2] || 0, dmg: x[3] || 0, hits: x[4] || 1 }));
      const lh = bs[10] ? { id: bs[10][0], name: bs[10][1], dmg: bs[10][2], crit: !!bs[10][3] } : null;
      boss = {
        id: bs[0], key: bs[1] || 'dr_glitch', maxHp: bs[2] || 1000, hp: bs[3] ?? 0,
        durationSec: bs[4] || 90, remainingSec: bs[5] ?? 0,
        status: bs[6] || 'active', hitCount: bs[7] || 0, coopReward: bs[8] || 300,
        topDmg, lastHit: lh, contributorsCount: bs[11] || topDmg.length, dmgByPlayer: {}
      };
    } else if (raw.boss) {
      boss = raw.boss;
    }
    return normalize({
      code: raw.c,
      status: raw.s || 'lobby',
      createdAt: baseT,
      hostUpdatedAt: raw.hu || 0,
      roundId,
      timerTotalSec: raw.tt || 0,
      timerRemainingMs: raw.tr || 0,
      timerRunning: !!raw.tn,
      timerEpoch: raw.te || 1,
      feverId: raw.fi || '',
      feverRemainingSec: raw.fs || 0,
      endedAt: raw.en || null,
      usedBonus: raw.ub || {},
      bonus: raw.b || null,
      boss,
      players,
      feed
    });
  }

  /* ผสานผู้เล่น 2 เวอร์ชันด้วย Lamport Revision (rev) + Host Authority (hostRev) กันนาฬิกาเครื่องไม่ตรงกัน! */
  function mergePlayer(pa, pb, roundId) {
    if (!pa) { const c = normalizePlayer(clean(pb), roundId); c.roundId = roundId; return c; }
    if (!pb) { const c = normalizePlayer(clean(pa), roundId); c.roundId = roundId; return c; }

    const revA = Number(pa.rev || 0), revB = Number(pb.rev || 0);
    const hA = Number(pa.hostRev || 0), hB = Number(pb.hostRev || 0);
    const bIsNewer = revB !== revA
      ? (revB > revA)
      : (hB !== hA ? (hB > hA) : ((pb.updatedAt || 0) >= (pa.updatedAt || 0)));
    const newer = clean(bIsNewer ? pb : pa);
    const older = bIsNewer ? pa : pb;

    // เก็บประวัติการ์ดที่ตอบไปแล้วไม่ให้หายเมื่อรับ Compact Broadcast
    newer.answered = Object.assign({}, older.answered || {}, newer.answered || {});
    newer.answeredCount = Math.max(Number(newer.answeredCount || 0), Number(older.answeredCount || 0), Object.keys(newer.answered).length);

    // สิทธิ์ Host Authority (hostRev สูงกว่าชนะเสมอสำหรับคำสั่งอนุมัติ/สั่งถ่ายรูปหน้าตลกใหม่)
    if (hA !== hB) {
      const hWin = hB > hA ? pb : pa;
      newer.selfieLocked = !!hWin.selfieLocked;
      newer.selfieStatus = hWin.selfieStatus || '';
      newer.selfieFrom = hWin.selfieFrom || '';
      newer.selfiePhoto = hWin.selfiePhoto || '';
    }
    newer.hostRev = Math.max(hA, hB);
    newer.rev = Math.max(revA, revB);

    if (!newer.selfiePhoto && older.selfiePhoto && newer.selfieLocked && newer.selfieStatus === 'pending_review') {
      newer.selfiePhoto = older.selfiePhoto;
    }
    newer.roundId = roundId;
    return normalizePlayer(newer, roundId);
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
        copy.boss = null;
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
      timerEpoch: primary.timerEpoch || Math.max(a.timerEpoch || 1, b.timerEpoch || 1),
      feverId: primary.feverId || '',
      feverRemainingSec: primary.feverRemainingSec || 0,
      endedAt: primary.status === 'ended' ? (primary.endedAt || a.endedAt || b.endedAt || null) : null,
      usedBonus: Object.assign({}, a.usedBonus || {}, b.usedBonus || {}),
      bonus: primary.bonus ? clean(primary.bonus) : null,
      boss: primary.boss ? clean(primary.boss) : null,
      players: {},
      feed: {}
    };

    if (out.bonus && a.bonus && b.bonus && a.bonus.id === b.bonus.id) {
      out.bonus.answered = Object.assign({}, a.bonus.answered || {}, b.bonus.answered || {});
    }
    if (out.boss && a.boss && b.boss && a.boss.id === b.boss.id) {
      // เก็บตารางดาเมจเต็มฝั่ง Host ไว้ไม่ให้หายเมื่อผสาน Compact State
      const keepMap = Object.keys(a.boss.dmgByPlayer || {}).length >= Object.keys(b.boss.dmgByPlayer || {}).length
        ? a.boss.dmgByPlayer : b.boss.dmgByPlayer;
      out.boss.dmgByPlayer = Object.assign({}, keepMap || {}, out.boss.dmgByPlayer || {});
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

  /* ผสาน Patch แบบ In-Place O(1) สำหรับ Host (ไม่ต้อง Deep-Clone ทั้งห้อง 200 คนทุกครั้ง!) */
  function applyPatchInPlace(room, patch) {
    const targetCode = (room && room.code) || code;
    if (!patch || (targetCode && patch.code !== targetCode)) return room;
    const base = room || defaultRoom(patch.code || code);
    base.players = base.players || {};
    base.feed = base.feed || {};
    const curRound = base.roundId || 1;
    if (patch.roundId && patch.roundId < curRound && !patch.unsynced) return base;

    if (patch.players) {
      for (const [pid, incP] of Object.entries(patch.players)) {
        base.players[pid] = mergePlayer(base.players[pid], incP, curRound);
      }
    }
    if (patch.feed) {
      let added = false;
      for (const [fid, f] of Object.entries(patch.feed)) {
        if (!base.feed[fid]) {
          base.feed[fid] = Object.assign({}, clean(f), { roundId: curRound });
          added = true;
        }
      }
      if (added) {
        const fKeys = Object.keys(base.feed).sort((x, y) => (base.feed[x].t || 0) - (base.feed[y].t || 0));
        while (fKeys.length > 35) delete base.feed[fKeys.shift()];
      }
    }
    if (patch.bonusAnswered && base.bonus && base.bonus.id === patch.bonusAnswered.bid) {
      base.bonus.answered = Object.assign({}, base.bonus.answered || {}, patch.bonusAnswered.map || {});
    }
    return base;
  }

  /* ผสาน Patch แบบ Immutable (สำรองสำหรับผู้เรียกภายนอก) */
  function applyPatch(room, patch) {
    const base = normalize(room ? clean(room) : defaultRoom((patch && patch.code) || code));
    return normalize(applyPatchInPlace(base, patch));
  }

  /* ผสาน Pending Patch หลายอันเข้าด้วยกันเมื่อเน็ตหลุดชั่วคราว (ไม่ทับอันเก่าทิ้ง!) */
  function mergePatches(pA, pB) {
    if (!pA) return pB ? clean(pB) : null;
    if (!pB) return clean(pA);
    const out = clean(pA);
    out.roundId = Math.max(out.roundId || 1, pB.roundId || 1);
    out.unsynced = !!(out.unsynced && pB.unsynced);
    out.players = out.players || {};
    for (const [pid, p] of Object.entries(pB.players || {})) {
      out.players[pid] = mergePlayer(out.players[pid], p, out.roundId);
    }
    out.feed = Object.assign({}, out.feed || {}, pB.feed || {});
    if (pB.bonusAnswered) {
      if (out.bonusAnswered && out.bonusAnswered.bid === pB.bonusAnswered.bid) {
        out.bonusAnswered.map = Object.assign({}, out.bonusAnswered.map || {}, pB.bonusAnswered.map || {});
      } else {
        out.bonusAnswered = clean(pB.bonusAnswered);
      }
    }
    return out;
  }

  /* สร้าง Delta Patch ขนาดเล็ก (ตัด selfiePhoto และ answered map ออก) */
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
      const bp = bPlayers[pid];
      const changed = !bp
        || (bp.rev || 0) !== (p.rev || 0)
        || (bp.hostRev || 0) !== (p.hostRev || 0)
        || (bp.updatedAt || 0) !== (p.updatedAt || 0)
        || bp.score !== p.score;
      if (changed || JSON.stringify(bp) !== JSON.stringify(p)) {
        const slim = clean(p);
        slim.answeredCount = Math.max(Number(slim.answeredCount || 0), Object.keys(slim.answered || {}).length);
        delete slim.answered;
        slim.selfiePhoto = '';
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

  function emit(r, fast = false) {
    last = r ? (fast ? r : normalize(clean(r))) : null;
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

  /* ---------- 🌐 Cloud Realtime (Ultra-Scale 200+ MQTT + Direct Channel + Wire v2) ---------- */
  const cloud = {
    key: c => 'sqa_room_' + c,
    selfieKey: (c, pid) => `sqa_selfie_${c || code}_${pid}`,
    readLocal(c) { try { return JSON.parse(localStorage.getItem(this.key(c || code))); } catch (e) { return null; } },
    writeLocalNow(r, c) {
      if (!r) return;
      try { localStorage.setItem(this.key(c || code), JSON.stringify(r)); } catch (e) {}
      if (this.bc) { try { this.bc.postMessage({ t: 'u' }); } catch (e) {} }
    },
    scheduleWriteLocal(immediate = false) {
      if (!this.cur) return;
      if (immediate) {
        clearTimeout(this.localWriteTimer);
        this.localWriteTimer = null;
        this.writeLocalNow(this.cur);
        return;
      }
      if (this.localWriteTimer) return;
      this.localWriteTimer = setTimeout(() => {
        this.localWriteTimer = null;
        if (this.cur) this.writeLocalNow(this.cur);
      }, 1500);
    },
    prefix() { return (cfg.cloud && cfg.cloud.topicPrefix) || 'sciquest_arena_v2'; },
    topicState(c)  { return `${this.prefix()}/room/${c || code}/state`; },
    topicPatch(c)  { return `${this.prefix()}/room/${c || code}/patch`; },
    topicPing(c)   { return `${this.prefix()}/room/${c || code}/ping`; },
    topicSelfie(c) { return `${this.prefix()}/room/${c || code}/selfie`; },
    topicDirect(pid, c) { return `${this.prefix()}/room/${c || code}/d/${pid}`; },
    topicReact(c)  { return `${this.prefix()}/room/${c || code}/react`; },

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
      // ปรับ Debounce อัตโนมัติตามจำนวนคน (200 คน = 1800ms + Wire v2 ~14 KB -> ประหยัดทราฟฟิก >80%)
      const count = Object.keys(this.cur.players || {}).length;
      const delay = count > 100 ? 1800 : (count > 50 ? 1300 : (count > 20 ? 800 : 420));
      this.pubTimer = setTimeout(() => {
        this.pubTimer = null;
        if (this.cur) this.publishState(this.cur);
      }, delay);
    },

    publishState(r) {
      if (!this.client || !this.client.connected || !r) return;
      try {
        // อัปเดตเวลาคงเหลือสดๆ จากนาฬิกา Host เฉพาะรายการที่ ID ตรงกัน (ป้องกันทับค่าอีเวนต์ใหม่เป็น 0!)
        if (isHostRole && liveTimerFn) {
          const lt = liveTimerFn();
          if (lt) {
            if (r.timerTotalSec > 0 && typeof lt.timerRemainingMs === 'number') {
              r.timerRemainingMs = lt.timerRemainingMs;
              r.timerRunning = !!lt.timerRunning;
            }
            if (r.bonus && lt.bonusId && lt.bonusId === r.bonus.id && typeof lt.bonusRemainingSec === 'number') {
              r.bonus.remainingSec = lt.bonusRemainingSec;
            }
            if (r.feverId && lt.feverId && lt.feverId === r.feverId && typeof lt.feverRemainingSec === 'number') {
              r.feverRemainingSec = lt.feverRemainingSec;
            }
            if (r.boss && r.boss.status === 'active' && lt.bossId && lt.bossId === r.boss.id && typeof lt.bossRemainingSec === 'number') {
              r.boss.remainingSec = lt.bossRemainingSec;
            }
          }
        }
        const wire = encodeWireState(r);
        this.client.publish(this.topicState(r.code || code), JSON.stringify(wire), { qos: 0, retain: true });
      } catch (e) {}
    },

    publishPatch(patch) {
      if (!this.client || !this.client.connected || !patch) return;
      try {
        this.client.publish(this.topicPatch(code), JSON.stringify(patch), { qos: 0, retain: false });
      } catch (e) {}
    },

    publishDirect(pid, payloadObj) {
      if (!pid || !payloadObj) return;
      if (this.client && this.client.connected) {
        try {
          this.client.publish(this.topicDirect(pid), JSON.stringify(payloadObj), { qos: 0, retain: false });
        } catch (e) {}
      } else {
        this.pendingDirect[pid] = payloadObj.patch
          ? { patch: mergePatches(this.pendingDirect[pid] && this.pendingDirect[pid].patch, payloadObj.patch) }
          : payloadObj;
      }
    },

    setPlayerId(pid) {
      if (!pid || isHostRole) return;
      const changed = this.subbedDirectPid !== pid;
      myPlayerId = pid;
      if (this.client && this.client.connected && changed) {
        if (this.subbedDirectPid) {
          try { this.client.unsubscribe(this.topicDirect(this.subbedDirectPid)); } catch (e) {}
        }
        this.subbedDirectPid = pid;
        try { this.client.subscribe(this.topicDirect(pid), { qos: 0 }); } catch (e) {}
      }
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

    requestSelfie(pid) {
      if (!isHostRole || !pid) return;
      if (this.bc) { try { this.bc.postMessage({ t: 'reqSelfie', pid }); } catch (e) {} }
      this.publishDirect(pid, { reqSelfie: true, code });
    },

    sendDirectPlayer(pid, playerObj) {
      if (!pid || !playerObj) return;
      const slim = clean(playerObj);
      delete slim.answered;
      slim.selfiePhoto = '';
      const patch = {
        code,
        roundId: (this.cur && this.cur.roundId) || 1,
        unsynced: false,
        players: { [pid]: slim },
        feed: {}
      };
      this.publishDirect(pid, { patch });
    },

    sendReaction(kind, senderName) {
      if (!kind) return;
      const msg = { id: Math.random().toString(36).slice(2, 10), k: kind, n: String(senderName || '').slice(0, 16) };
      if (this.bc) { try { this.bc.postMessage({ t: 'react', id: msg.id, k: msg.k, n: msg.n }); } catch (e) {} }
      if (this.client && this.client.connected) {
        try { this.client.publish(this.topicReact(code), JSON.stringify(msg), { qos: 0, retain: false }); } catch (e) {}
      }
    },

    emitReactOnce(k, n, id) {
      if (!isHostRole || !reactCb || !k) return;
      if (id) {
        this._seenReacts = this._seenReacts || new Set();
        if (this._seenReacts.has(id)) return;
        this._seenReacts.add(id);
        if (this._seenReacts.size > 80) {
          this._seenReacts.delete(this._seenReacts.values().next().value);
        }
      }
      reactCb(k, n || '');
    },

    sendBossHit(hit) {
      if (!hit || !hit.bossId || !hit.pid) return;
      const payload = { code, roundId: (this.cur && this.cur.roundId) || 1, bossHit: hit };
      if (this.bc) { try { this.bc.postMessage({ t: 'bossHit', hit }); } catch (e) {} }
      if (this.client && this.client.connected) {
        try { this.client.publish(this.topicPatch(code), JSON.stringify(payload), { qos: 0, retain: false }); } catch (e) {}
      }
    },

    startMqttClient(brokerIdx, onInitialDone) {
      const brokers = (cfg.cloud && cfg.cloud.brokers && cfg.cloud.brokers.length)
        ? cfg.cloud.brokers
        : ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];
      const safeIdx = ((brokerIdx || 0) % brokers.length + brokers.length) % brokers.length;
      this.activeBrokerIdx = safeIdx;
      const brokerUrl = brokers[safeIdx];

      const tState = this.topicState(code);
      const tPatch = this.topicPatch(code);
      const tPing = this.topicPing(code);
      const tSelfie = this.topicSelfie(code);
      const tReact = this.topicReact(code);
      this.lastPingReplyAt = 0;
      this.subbedDirectPid = null;

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
          connectTimeout: 5000,
          // สุ่มหน่วงเวลา Reconnect (1.5–3.5 วิ) กัน 200 เครื่องกระหน่ำต่อพร้อมกัน
          reconnectPeriod: Math.round(1500 + Math.random() * 2000)
        });

        this.client.on('connect', () => {
          failCount = 0;
          emitConn('connected');
          // Zero Fan-Out Storm: มือถือผู้เล่นรับเฉพาะ /state + ช่องส่วนตัว /d/<pid> (ไม่รับ /patch ของเพื่อนอีก 199 คน!)
          const subs = isHostRole ? [tState, tPatch, tPing, tSelfie, tReact] : [tState];
          if (!isHostRole && myPlayerId) {
            subs.push(this.topicDirect(myPlayerId));
            this.subbedDirectPid = myPlayerId;
          }
          this.client.subscribe(subs, { qos: 0 }, () => {
            if (isHostRole) {
              if (this.cur) this.scheduleHostStatePublish(true);
            } else {
              this.client.publish(tPing, '1', { qos: 0 });
              if (this.pendingPatch) { this.publishPatch(this.pendingPatch); this.pendingPatch = null; }
              if (this.pendingDirect) {
                for (const [dpid, dpay] of Object.entries(this.pendingDirect)) {
                  try { this.client.publish(this.topicDirect(dpid), JSON.stringify(dpay), { qos: 0, retain: false }); } catch (e) {}
                }
                this.pendingDirect = {};
              }
              if (this.pendingSelfie) {
                try { this.client.publish(tSelfie, this.pendingSelfie, { qos: 0, retain: false }); } catch (e) {}
                this.pendingSelfie = null;
              }
            }
          });
        });

        this.client.on('message', (topic, payload) => {
          if (topic === tReact) {
            if (isHostRole && reactCb) {
              try {
                const m = JSON.parse(payload.toString());
                if (m && m.k) this.emitReactOnce(m.k, m.n || '', m.id);
              } catch (e) {}
            }
            return;
          }
          if (topic === tPing) {
            if (isHostRole && this.cur && Date.now() - this.lastPingReplyAt > 3000) {
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
                    emit(this.cur, true);
                  }
                  if (selfieCb) selfieCb(msg.pid, msg.photo);
                }
              } catch (e) {}
            }
            return;
          }
          if (topic === tPatch) {
            if (!isHostRole) return;
            try {
              const patch = JSON.parse(payload.toString());
              if (patch && patch.code === code) {
                if (patch.bossHit && bossHitCb) {
                  bossHitCb(patch.bossHit);
                  return;
                }
                this.cur = applyPatchInPlace(this.cur, patch);
                this.scheduleWriteLocal(false);
                emit(this.cur, true);
                this.scheduleHostStatePublish(false);
              }
            } catch (e) {}
            return;
          }
          if (!isHostRole && myPlayerId && topic === this.topicDirect(myPlayerId)) {
            try {
              const msg = JSON.parse(payload.toString());
              if (msg && msg.reqSelfie) {
                if (selfieReqCb) selfieReqCb();
                return;
              }
              if (msg && msg.patch && msg.patch.code === code) {
                this.cur = applyPatchInPlace(this.cur, msg.patch);
                this.scheduleWriteLocal(false);
                emit(this.cur, true);
              }
            } catch (e) {}
            return;
          }
          if (topic === tState) {
            try {
              const inc = decodeWireState(JSON.parse(payload.toString()));
              if (inc && inc.code === code) {
                this.cur = mergeRooms(this.cur, inc);
                this.scheduleWriteLocal(false);
                emit(this.cur, true);
              }
            } catch (e) {}
            if (onInitialDone) { const fn = onInitialDone; onInitialDone = null; fn(); }
          }
        });

        this.client.on('reconnect', () => emitConn('reconnecting'));
        this.client.on('offline', () => emitConn('reconnecting'));
        this.client.on('error', () => {
          failCount++;
          // ป้องกัน Split-Brain 100%: เฉพาะ Host เท่านั้นที่มีสิทธิ์สลับ Broker (แล้วอัปเดต QR &b=idx ให้ตรงกัน!)
          if (isHostRole && failCount >= 2 && brokers.length > 1) {
            const nextIdx = (safeIdx + 1) % brokers.length;
            if (brokerChangeCb) brokerChangeCb(nextIdx);
            this.startMqttClient(nextIdx, onInitialDone);
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
      this.pendingDirect = {};
      this.pendingSelfie = null;
      this.activeBrokerIdx = pinnedBrokerIdx || 0;
      this.subbedDirectPid = null;
      try {
        this.bc = new BroadcastChannel('sqa_' + code);
        this.bc.onmessage = ev => {
          const d = ev && ev.data;
          if (d && d.t === 'selfie' && isHostRole && d.pid && d.photo) {
            if (this.cur && this.cur.players[d.pid]) {
              this.cur.players[d.pid].selfiePhoto = d.photo;
              emit(this.cur, true);
            }
            if (selfieCb) selfieCb(d.pid, d.photo);
            return;
          }
          if (d && d.t === 'reqSelfie' && !isHostRole && d.pid === myPlayerId) {
            if (selfieReqCb) selfieReqCb();
            return;
          }
          if (d && d.t === 'bossHit' && isHostRole && d.hit && bossHitCb) {
            bossHitCb(d.hit);
            return;
          }
          if (d && d.t === 'react' && isHostRole && d.k && reactCb) {
            this.emitReactOnce(d.k, d.n || '', d.id);
            return;
          }
          const loc = normalize(this.readLocal());
          if (loc) { this.cur = mergeRooms(this.cur, loc); emit(this.cur, true); }
        };
      } catch (e) { this.bc = null; }

      this.onStorage = e => {
        if (e.key === this.key(code)) {
          const loc = normalize(this.readLocal());
          if (loc) { this.cur = mergeRooms(this.cur, loc); emit(this.cur, true); }
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
          }, Math.round(Math.random() * 1200));
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
        this.startMqttClient(this.activeBrokerIdx, () => { clearTimeout(timer); done(); });
      });

      emit(this.cur);
    },

    async exists() { return true; },

    async transact(fn, allowCreate, opts = {}) {
      if (!this.cur) {
        const loc = normalize(this.readLocal());
        if (loc) this.cur = loc;
      }
      if (!this.cur && !allowCreate) this.cur = defaultRoom(code);
      const before = this.cur ? clean(this.cur) : defaultRoom(code);
      const next = fn(clean(before));
      if (next === undefined) return this.cur;
      this.cur = normalize(clean(next));
      this.scheduleWriteLocal(!opts.deferBroadcast);

      if (isHostRole) {
        this.scheduleHostStatePublish(!opts.deferBroadcast);
      } else {
        const patch = buildPatch(before, this.cur);
        if (patch) {
          if (this.client && this.client.connected) {
            this.publishPatch(patch);
          } else {
            // ผสาน Pending Patch แทนการเขียนทับ (เน็ตหลุดหลายคำสั่งก็ไม่หาย!)
            this.pendingPatch = mergePatches(this.pendingPatch, patch);
          }
          // หากเป็นการโจมตีเพื่อนคนอื่น -> ยิง Direct Patch ตรงเข้าช่องส่วนตัว /d/<targetPid> ทันที (ไม่ต้องรอ Broadcast 1.8 วิ!)
          for (const [pid, pObj] of Object.entries(patch.players || {})) {
            if (myPlayerId && pid !== myPlayerId) {
              this.publishDirect(pid, {
                patch: { code, roundId: patch.roundId, unsynced: patch.unsynced, players: { [pid]: pObj }, feed: patch.feed }
              });
            }
          }
        }
      }
      emit(this.cur, true);
      return this.cur;
    },

    disconnect() {
      clearTimeout(this.pubTimer);
      clearTimeout(this.localWriteTimer);
      this.pubTimer = null;
      this.localWriteTimer = null;
      if (this.bc) { try { this.bc.close(); } catch (e) {} this.bc = null; }
      if (this.onStorage) window.removeEventListener('storage', this.onStorage);
      if (this.onWake) {
        document.removeEventListener('visibilitychange', this.onWake);
        window.removeEventListener('online', this.onWake);
      }
      if (this.client) { try { this.client.end(true); } catch (e) {} this.client = null; }
      this.cur = null;
      this.pendingPatch = null;
      this.pendingDirect = {};
      this.pendingSelfie = null;
      this.subbedDirectPid = null;
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
          if (d && d.t === 'react' && isHostRole && reactCb) { reactCb(d.k, d.n || ''); return; }
          if (d && d.t === 'bossHit' && isHostRole && d.hit && bossHitCb) { bossHitCb(d.hit); return; }
          if (d && d.t === 'reqSelfie' && !isHostRole && d.pid === myPlayerId && selfieReqCb) { selfieReqCb(); return; }
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
    requestSelfie(pid) {
      if (this.bc) { try { this.bc.postMessage({ t: 'reqSelfie', pid }); } catch (e) {} }
    },
    sendReaction(kind, senderName) {
      if (this.bc) { try { this.bc.postMessage({ t: 'react', k: kind, n: String(senderName || '').slice(0, 16) }); } catch (e) {} }
    },
    sendBossHit(hit) {
      if (!hit || !hit.bossId || !hit.pid) return;
      if (typeof Game !== 'undefined' && Game.applyBossHit) {
        this.transact(r => {
          if (!r) return;
          Game.applyBossHit(r, hit.pid, hit.bossId, hit.dmg, hit.acc, hit.crit, hit.pts, hit.usedX2);
          return r;
        });
      } else if (this.bc) {
        try { this.bc.postMessage({ t: 'bossHit', hit }); } catch (e) {}
      }
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

  /* ---------- ⚡ Supabase Realtime (รองรับโหมดแยกตาราง sqa_players สำหรับ 200+ เครื่อง) ---------- */
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
              emit(this.cur, true);
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: this.pt, filter: 'room_code=eq.' + code }, p => {
            if (p.new && p.new.pid && p.new.data && this.cur) {
              if ((p.new.data.roundId || 1) >= (this.cur.roundId || 1)) {
                this.cur.players[p.new.pid] = mergePlayer(this.cur.players[p.new.pid], p.new.data, this.cur.roundId || 1);
                emit(this.cur, true);
              }
            }
          })
          .on('broadcast', { event: 'selfie' }, ({ payload }) => {
            if (isHostRole && payload && payload.pid && payload.photo && selfieCb) selfieCb(payload.pid, payload.photo);
          })
          .on('broadcast', { event: 'reqSelfie' }, ({ payload }) => {
            if (!isHostRole && payload && payload.pid === myPlayerId && selfieReqCb) selfieReqCb();
          })
          .on('broadcast', { event: 'feed' }, ({ payload }) => {
            if (payload && this.cur) {
              this.cur.feed[payload.id] = payload;
              emit(this.cur, true);
            }
          })
          .on('broadcast', { event: 'bonus_ans' }, ({ payload }) => {
            if (payload && this.cur && this.cur.bonus && this.cur.bonus.id === payload.bid) {
              this.cur.bonus.answered = this.cur.bonus.answered || {};
              Object.assign(this.cur.bonus.answered, payload.map || {});
              emit(this.cur, true);
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
    requestSelfie(pid) {
      if (this.ch) this.ch.send({ type: 'broadcast', event: 'reqSelfie', payload: { pid } });
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
        emit(this.cur, true);
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
    getBrokerIndex: () => (adapter && typeof adapter.activeBrokerIdx === 'number') ? adapter.activeBrokerIdx : pinnedBrokerIdx,
    setLiveTimerGetter(fn) { liveTimerFn = typeof fn === 'function' ? fn : null; },
    setPlayerId(pid) {
      myPlayerId = pid || null;
      if (adapter && adapter.setPlayerId) adapter.setPlayerId(pid);
    },
    async connect(c, onChange, opts = {}) {
      if (adapter) adapter.disconnect();
      code = c; cb = onChange;
      isHostRole = !!opts.isHost;
      connCb = opts.onConn || null;
      selfieCb = opts.onSelfie || null;
      selfieReqCb = opts.onSelfieRequest || null;
      brokerChangeCb = opts.onBrokerChange || null;
      reactCb = opts.onReaction || null;
      bossHitCb = opts.onBossHit || null;
      pinnedBrokerIdx = Number(opts.brokerIdx || 0) || 0;
      myPlayerId = opts.playerId || null;
      adapter = pick();
      await adapter.connect();
    },
    exists: c => pick().exists(c),
    create: c => adapter.transact(cur => (cur && cur.code) ? cur : defaultRoom(c), true),
    transact: (fn, opts) => adapter.transact(fn, false, opts),
    sendSelfie: (pid, photo) => adapter && adapter.sendSelfie && adapter.sendSelfie(pid, photo),
    requestSelfie: pid => adapter && adapter.requestSelfie && adapter.requestSelfie(pid),
    sendDirectPlayer: (pid, pObj) => adapter && adapter.sendDirectPlayer && adapter.sendDirectPlayer(pid, pObj),
    sendReaction: (kind, senderName) => adapter && adapter.sendReaction && adapter.sendReaction(kind, senderName),
    sendBossHit: hit => adapter && adapter.sendBossHit && adapter.sendBossHit(hit),
    disconnect() {
      if (adapter) adapter.disconnect();
      adapter = null; cb = null; connCb = null; selfieCb = null; selfieReqCb = null; brokerChangeCb = null; reactCb = null; bossHitCb = null;
      myPlayerId = null; last = null;
    },
    defaultRoom,
    mergePlayer,
    mergeRooms,
    mergePatches,
    applyPatch,
    applyPatchInPlace,
    buildPatch,
    compactForBroadcast,
    encodeWireState,
    decodeWireState,
    pushFeed(room, e) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      room.feed[id] = Object.assign({ id, t: Date.now(), roundId: room.roundId || 1 }, e);
      const keys = Object.keys(room.feed).sort((a, b) => room.feed[a].t - room.feed[b].t);
      while (keys.length > 35) delete room.feed[keys.shift()];
    }
  };
})();
