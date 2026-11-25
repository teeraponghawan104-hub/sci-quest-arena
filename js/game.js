/* Sci-Quest! — กติกาเกมและระบบไอเทม 9 ชนิด (ใช้ร่วมกันทั้งผู้เล่นและบอทจำลองฝั่งครู)
 * ทุกฟังก์ชัน apply* อัปเดตทั้ง Logical Revision (rev / hostRev) และ updatedAt
 * เพื่อป้องกันปัญหานาฬิกาเครื่องไม่ตรงกันข้ามอุปกรณ์ 200+ เครื่อง */
const Game = (() => {
  const cfg = Object.assign({
    redItemChance: .5,
    stealAmount: 100,
    zapAmount: 150,
    zapSelfBonus: 50,
    boostAmount: 120,
    freezeHits: 5,
    blindWipes: 6,
    flipRepairs: 4,
    bonusPassThreshold: 50
  }, (window.SQA_CONFIG || {}).game || {});

  const feedBase = (p, pid) => ({ a: p.name, ai: pid, av: p.avatar });
  const emptyItems = () => ({ x2: 0, shield: 0, steal: 0, freeze: 0, blind: 0, flip: 0, zap: 0, boost: 0, selfie: 0 });

  /* อัปเดต Logical Clock + Monotonic Timestamp (กันนาฬิกามือถือเด็กเดินเร็วกว่าเครื่องครู) */
  function touch(p, isHostAuthority = false) {
    if (!p) return;
    p.rev = (p.rev || 0) + 1;
    p.updatedAt = Math.max((p.updatedAt || 0) + 1, Date.now());
    if (isHostAuthority) p.hostRev = (p.hostRev || 0) + 1;
  }

  return {
    cfg,
    emptyItems,
    touch,
    newPlayer(id, name, avatar, isBot = false, opts = {}) {
      const now = Date.now();
      const items = emptyItems();
      // แจกไอเทมต้อนรับสุ่ม 1 ชิ้น + แจกไอเทม "แชะหน้าตลก (selfie)" 1 ชิ้นให้ลองเล่นสนุกได้ทันที!
      items[ITEM_KEYS[rand(ITEM_KEYS.length)]] = 1;
      items.selfie = (items.selfie || 0) + 1;
      return {
        id, name, avatar, isBot, score: 0, streak: 0, items,
        team: opts.team || '',
        hasPhoto: !!opts.hasPhoto,
        photoBlocked: false,
        deviceId: opts.deviceId || '',
        x2Active: false,
        frozen: false, frozenBy: '',
        blinded: false, blindedBy: '',
        flipped: false, flippedBy: '',
        selfieLocked: false, selfieFrom: '', selfieStatus: '', selfiePhoto: '',
        zappedAt: 0, zappedBy: '',
        answered: {}, answeredCount: 0,
        joinedAt: now, updatedAt: now, rev: 1, hostRev: 0
      };
    },
    randomItem: () => ITEM_KEYS[rand(ITEM_KEYS.length)],
    ranking: room => Object.values(room.players || {}).sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt),

    applyAnswer(room, pid, q, mult, acc, item) {
      const me = room.players[pid];
      if (!me || (me.answered && me.answered[q.id])) return null;
      me.answered = me.answered || {};
      const isFever = !!(room.feverId && (room.feverRemainingSec || 0) > 0);
      let pts = Math.round(COLORS[q.color].points * mult), doubled = false;
      if (isFever) { pts *= 2; doubled = true; }
      if (me.x2Active) { pts *= 2; doubled = true; me.x2Active = false; }

      // ระบบคอมโบตอบถูกต่อเนื่อง (Hot Streak!) + ดรอปไอเทมฟรีทุก 3 ข้อติด!
      let streakBonus = 0, streakItem = null;
      if (acc >= 50) {
        me.streak = (me.streak || 0) + 1;
        if (me.streak === 2) streakBonus = 30;
        else if (me.streak === 3) streakBonus = 60;
        else if (me.streak === 4) streakBonus = 80;
        else if (me.streak >= 5) streakBonus = 100;
        if (me.streak >= 3 && me.streak % 3 === 0 && !item) {
          streakItem = ITEM_KEYS[rand(ITEM_KEYS.length)];
        }
      } else {
        me.streak = 0;
      }

      const totalPts = pts + streakBonus;
      const rewardItem = item || streakItem;
      me.score += totalPts;
      me.answered[q.id] = totalPts;
      me.answeredCount = Math.max(Number(me.answeredCount || 0) + 1, Object.keys(me.answered).length);
      touch(me, false);
      Sync.pushFeed(room, { type: 'score', ...feedBase(me, pid), pts: totalPts, color: q.color, acc, doubled, fever: isFever, streak: me.streak });
      if (me.streak >= 3) {
        Sync.pushFeed(room, { type: 'streak', ...feedBase(me, pid), streak: me.streak, bonus: streakBonus });
      }
      if (rewardItem) {
        me.items[rewardItem] = (me.items[rewardItem] || 0) + 1;
        Sync.pushFeed(room, { type: 'item', ...feedBase(me, pid), item: rewardItem, src: streakItem ? 'streak' : 'red' });
      }
      return { pts: totalPts, doubled, fever: isFever, streak: me.streak, streakBonus, rewardItem, fromStreak: !!streakItem };
    },

    resetStreak(room, pid) {
      const me = room.players[pid];
      if (!me || !me.streak) return false;
      me.streak = 0;
      touch(me, false);
      return true;
    },

    useX2(room, pid) {
      const me = room.players[pid];
      if (!me || (me.items.x2 || 0) <= 0 || me.x2Active) return false;
      me.items.x2--; me.x2Active = true;
      touch(me, false);
      Sync.pushFeed(room, { type: 'x2', ...feedBase(me, pid) });
      return true;
    },

    useBoost(room, pid) {
      const me = room.players[pid];
      if (!me || (me.items.boost || 0) <= 0) return null;
      me.items.boost--;
      const pts = cfg.boostAmount;
      me.score += pts;
      touch(me, false);
      Sync.pushFeed(room, { type: 'boost', ...feedBase(me, pid), pts });
      return { pts };
    },

    applyAttack(room, aid, tid, kind) {
      const a = room.players[aid], t = room.players[tid];
      if (!a || !t || aid === tid || (a.items[kind] || 0) <= 0) return null;
      // ในโหมดแบ่งทีม 4 สี ห้ามโจมตีเพื่อนร่วมทีมเดียวกัน!
      if (room.teamMode && a.team && t.team && a.team === t.team) {
        return { result: 'sameTeam' };
      }
      const now = Date.now();
      a.items[kind]--;
      touch(a, false);
      touch(t, false);
      const base = { ...feedBase(a, aid), b: t.name, bi: tid, bv: t.avatar };

      // เช็คโล่ป้องกันของเป้าหมาย
      if ((t.items.shield || 0) > 0) {
        t.items.shield--;
        Sync.pushFeed(room, { type: 'block', ...base, kind });
        return { result: 'blocked' };
      }

      if (kind === 'steal') {
        const amt = Math.min(cfg.stealAmount, t.score);
        t.score -= amt; a.score += amt;
        Sync.pushFeed(room, { type: 'steal', ...base, pts: amt });
        return { result: 'steal', amt };
      }
      if (kind === 'zap') {
        const amt = Math.min(cfg.zapAmount, t.score);
        t.score -= amt;
        a.score += cfg.zapSelfBonus;
        t.zappedAt = Math.max((t.zappedAt || 0) + 1, now);
        t.zappedBy = a.name;
        Sync.pushFeed(room, { type: 'zap', ...base, pts: amt });
        return { result: 'zap', amt, bonus: cfg.zapSelfBonus };
      }
      if (kind === 'blind') {
        t.blinded = true;
        t.blindedBy = a.name;
        Sync.pushFeed(room, { type: 'blind', ...base });
        return { result: 'blind' };
      }
      if (kind === 'flip') {
        t.flipped = true;
        t.flippedBy = a.name;
        Sync.pushFeed(room, { type: 'flip', ...base });
        return { result: 'flip' };
      }
      if (kind === 'selfie') {
        t.selfieLocked = true;
        t.selfieFrom = a.name;
        t.selfieStatus = 'waiting_photo';
        t.selfiePhoto = '';
        Sync.pushFeed(room, { type: 'selfie', ...base });
        return { result: 'selfie' };
      }
      t.frozen = true; t.frozenBy = a.name;
      Sync.pushFeed(room, { type: 'freeze', ...base });
      return { result: 'freeze' };
    },

    submitSelfie(room, pid, photoDataUrl) {
      const me = room.players[pid];
      if (!me || !me.selfieLocked || !photoDataUrl) return false;
      me.selfiePhoto = photoDataUrl;
      me.selfieStatus = 'pending_review';
      touch(me, false);
      Sync.pushFeed(room, { type: 'selfieSent', ...feedBase(me, pid), b: me.selfieFrom || 'เพื่อน' });
      return true;
    },

    approveSelfie(room, pid) {
      const p = room.players[pid];
      if (!p || !p.selfieLocked) return false;
      p.selfieLocked = false;
      p.selfieStatus = '';
      p.selfiePhoto = '';
      p.selfieFrom = '';
      touch(p, true); // สิทธิ์ Host Authority ชนะนาฬิกาเครื่องลูกเสมอ!
      Sync.pushFeed(room, { type: 'selfieApproved', ...feedBase(p, pid) });
      return true;
    },

    rejectSelfie(room, pid) {
      const p = room.players[pid];
      if (!p || !p.selfieLocked) return false;
      p.selfieStatus = 'waiting_photo';
      p.selfiePhoto = '';
      touch(p, true); // สิทธิ์ Host Authority ชนะนาฬิกาเครื่องลูกเสมอ!
      Sync.pushFeed(room, { type: 'selfieRejected', ...feedBase(p, pid) });
      return true;
    },

    giftRandomItemToAll(room) {
      const list = Object.values(room.players || {});
      if (!list.length) return 0;
      list.forEach(p => {
        const it = ITEM_KEYS[rand(ITEM_KEYS.length)];
        p.items[it] = (p.items[it] || 0) + 1;
        touch(p, true);
      });
      Sync.pushFeed(room, { type: 'giftAll' });
      return list.length;
    },

    triggerFever(room, sec = 60) {
      if (!room) return false;
      if (room.status === 'lobby' || room.status === 'paused') {
        room.status = 'playing';
        if (room.timerTotalSec > 0) room.timerRunning = true;
      }
      room.feverId = 'fv_' + uid();
      room.feverRemainingSec = sec;
      room.hostUpdatedAt = Date.now();
      Sync.pushFeed(room, { type: 'fever', sec });
      return true;
    },

    triggerUnderdogBoost(room) {
      const ranked = this.ranking(room);
      if (!ranked.length) return { count: 0, targets: [] };
      if (room.status === 'lobby' || room.status === 'paused') {
        room.status = 'playing';
        if (room.timerTotalSec > 0) room.timerRunning = true;
      }
      const startIdx = ranked.length === 1 ? 0 : Math.floor(ranked.length / 2);
      const atkPool = ['steal', 'freeze', 'blind', 'flip', 'zap', 'selfie'];
      const targets = ranked.slice(startIdx);
      targets.forEach(p => {
        p.score += 150;
        const it = atkPool[rand(atkPool.length)];
        p.items[it] = (p.items[it] || 0) + 1;
        touch(p, true);
      });
      room.hostUpdatedAt = Date.now();
      Sync.pushFeed(room, { type: 'underdog', count: targets.length });
      return { count: targets.length, targets };
    },

    triggerFreezeTop(room) {
      const ranked = this.ranking(room);
      if (!ranked.length) return { total: 0, frozenCount: 0, blockedCount: 0, affected: [] };
      if (room.status === 'lobby' || room.status === 'paused') {
        room.status = 'playing';
        if (room.timerTotalSec > 0) room.timerRunning = true;
      }
      const top = ranked.slice(0, Math.min(3, ranked.length));
      let frozenCount = 0;
      let blockedCount = 0;
      top.forEach(p => {
        if ((p.items.shield || 0) > 0) {
          p.items.shield--;
          touch(p, true);
          blockedCount++;
          Sync.pushFeed(room, { type: 'block', a: 'พายุครู', b: p.name, kind: 'freeze' });
        } else {
          p.frozen = true;
          p.frozenBy = 'พายุแช่แข็งจ่าฝูง';
          touch(p, true);
          frozenCount++;
        }
      });
      room.hostUpdatedAt = Date.now();
      Sync.pushFeed(room, { type: 'freezeTop', count: frozenCount });
      return { total: top.length, frozenCount, blockedCount, affected: top };
    },

    applyBonusWin(room, pid, bid, acc, item) {
      const me = room.players[pid];
      if (!me || !room.bonus || room.bonus.id !== bid) return false;
      room.bonus.answered = room.bonus.answered || {};
      if (room.bonus.answered[pid]) return false;
      room.bonus.answered[pid] = acc;
      me.items[item] = (me.items[item] || 0) + 1;
      touch(me, false);
      Sync.pushFeed(room, { type: 'bonusWin', ...feedBase(me, pid), item });
      return true;
    },

    unfreeze(room, pid) {
      const me = room.players[pid];
      if (!me || !me.frozen) return false;
      me.frozen = false; me.frozenBy = '';
      touch(me, false);
      Sync.pushFeed(room, { type: 'unfreeze', ...feedBase(me, pid) });
      return true;
    },

    unblind(room, pid) {
      const me = room.players[pid];
      if (!me || !me.blinded) return false;
      me.blinded = false; me.blindedBy = '';
      touch(me, false);
      Sync.pushFeed(room, { type: 'unblind', ...feedBase(me, pid) });
      return true;
    },

    unflip(room, pid) {
      const me = room.players[pid];
      if (!me || !me.flipped) return false;
      me.flipped = false; me.flippedBy = '';
      touch(me, false);
      Sync.pushFeed(room, { type: 'unflip', ...feedBase(me, pid) });
      return true;
    },

    /* ---------------- ระบบ Co-Op Boss Raid (ช่วยกันทั้งห้องปราบบอสคำถาม!) ---------------- */
    calcBossHp(playerCount, mult = 1) {
      const n = Math.max(1, Number(playerCount) || 1);
      const raw = Math.max(450, n * 200) * Number(mult || 1);
      return Math.max(400, Math.round(raw / 50) * 50);
    },

    calcBossDamage(acc, hasBoost = false) {
      const boost = hasBoost ? 1.5 : 1;
      if (acc >= 80) return { dmg: Math.round(220 * boost), pts: 60, crit: true, tier: 'CRITICAL HIT!' };
      if (acc >= 55) return { dmg: Math.round(150 * boost), pts: 40, crit: false, tier: 'DIRECT HIT!' };
      if (acc >= 35) return { dmg: Math.round(90 * boost), pts: 20, crit: false, tier: 'GLANCING HIT!' };
      return { dmg: 0, pts: 0, crit: false, tier: 'MISS!' };
    },

    pickBossQuestion(bossKey, seenSet) {
      const bs = (typeof BOSSES !== 'undefined' && BOSSES[bossKey]) || null;
      const film = bs ? bs.film : null;
      const allPool = [...QUESTIONS, ...BONUS_QUESTIONS];
      const themePool = film ? allPool.filter(q => q.film === film) : allPool;
      const freshTheme = themePool.filter(q => !seenSet || !seenSet.has(q.id));
      if (freshTheme.length) return freshTheme[rand(freshTheme.length)];
      const freshAny = allPool.filter(q => !seenSet || !seenSet.has(q.id));
      if (freshAny.length) return freshAny[rand(freshAny.length)];
      return themePool[rand(themePool.length)] || allPool[rand(allPool.length)];
    },

    spawnBoss(room, bossKey, durationSec = 90, hpMult = 1, coopReward = 300) {
      if (!room) return null;
      const key = (typeof BOSSES !== 'undefined' && BOSSES[bossKey]) ? bossKey : 'dr_glitch';
      if (room.status === 'lobby' || room.status === 'paused') {
        room.status = 'playing';
        if (room.timerTotalSec > 0) room.timerRunning = true;
      }
      room.bonus = null; // ปิดคำถามโบนัสเดิมไม่ให้ทับกัน
      const pCount = Object.keys(room.players || {}).length;
      const maxHp = this.calcBossHp(pCount, hpMult);
      const dur = Math.max(30, Number(durationSec) || 90);
      const now = Date.now();
      room.boss = {
        id: 'bs_' + uid(),
        key,
        maxHp,
        hp: maxHp,
        durationSec: dur,
        remainingSec: dur,
        status: 'active',
        startedAt: now,
        hitCount: 0,
        coopReward: Number(coopReward) || 300,
        dmgByPlayer: {},
        topDmg: [],
        lastHit: null,
        contributorsCount: 0
      };
      room.hostUpdatedAt = now;
      Sync.pushFeed(room, { type: 'bossStart', bossKey: key, maxHp, sec: dur });
      return room.boss;
    },

    applyBossHit(room, pid, bossId, dmg, acc, crit = false, instantPts = 0, usedX2 = false) {
      if (!room || !room.boss || room.boss.id !== bossId || room.boss.status !== 'active') return null;
      const me = room.players[pid];
      const safeDmg = Math.max(0, Math.min(800, Math.round(Number(dmg) || 0)));
      if (!me || safeDmg <= 0) return null;

      room.boss.dmgByPlayer = room.boss.dmgByPlayer || {};
      const prev = room.boss.dmgByPlayer[pid] || { id: pid, name: me.name, avatar: me.avatar, dmg: 0, hits: 0 };
      prev.name = me.name;
      prev.avatar = me.avatar;
      prev.dmg += safeDmg;
      prev.hits += 1;
      room.boss.dmgByPlayer[pid] = prev;

      room.boss.hp = Math.max(0, Number(room.boss.hp || 0) - safeDmg);
      room.boss.hitCount = Number(room.boss.hitCount || 0) + 1;
      room.boss.topDmg = Object.values(room.boss.dmgByPlayer)
        .sort((a, b) => b.dmg - a.dmg)
        .slice(0, 5)
        .map(d => ({ id: d.id, name: d.name, avatar: d.avatar, dmg: d.dmg, hits: d.hits }));
      room.boss.contributorsCount = Object.keys(room.boss.dmgByPlayer).length;
      room.boss.lastHit = { id: uid(), pid, name: me.name, avatar: me.avatar, dmg: safeDmg, crit: !!crit, t: Date.now() };

      const addPts = Math.max(0, Math.min(200, Math.round(Number(instantPts) || 0)));
      me.score += addPts;
      if (usedX2 && me.x2Active) me.x2Active = false;
      touch(me, false);
      Sync.pushFeed(room, { type: 'bossHit', ...feedBase(me, pid), dmg: safeDmg, crit: !!crit, acc });

      let defeated = false;
      if (room.boss.hp <= 0) {
        this.resolveBossVictory(room);
        defeated = true;
      } else {
        room.hostUpdatedAt = Math.max((room.hostUpdatedAt || 0) + 1, Date.now());
      }
      return { dmg: safeDmg, pts: addPts, hpLeft: room.boss.hp, defeated, myTotalDmg: prev.dmg };
    },

    resolveBossVictory(room) {
      if (!room || !room.boss || room.boss.status !== 'active') return null;
      const b = room.boss;
      b.hp = 0;
      b.status = 'defeated';
      b.endedAt = Date.now();
      const sorted = Object.values(b.dmgByPlayer || {}).sort((a, b2) => b2.dmg - a.dmg);
      b.topDmg = sorted.slice(0, 5).map(d => ({ id: d.id, name: d.name, avatar: d.avatar, dmg: d.dmg, hits: d.hits }));
      b.contributorsCount = sorted.length;

      const coopReward = Number(b.coopReward) || 300;
      const mvpBonus = [200, 100, 50];
      sorted.forEach((entry, idx) => {
        const p = room.players[entry.id];
        if (!p) return;
        const extra = idx < mvpBonus.length ? mvpBonus[idx] : 0;
        p.score += coopReward + extra;
        const gift = ITEM_KEYS[rand(ITEM_KEYS.length)];
        p.items[gift] = (p.items[gift] || 0) + 1;
        touch(p, true);
      });
      room.hostUpdatedAt = Math.max((room.hostUpdatedAt || 0) + 1, Date.now());
      const top = sorted[0];
      Sync.pushFeed(room, {
        type: 'bossWin',
        bossKey: b.key,
        coopReward,
        mvpName: top ? top.name : '',
        mvpDmg: top ? top.dmg : 0,
        count: sorted.length
      });
      return { sorted, coopReward };
    },

    resolveBossTimeout(room) {
      if (!room || !room.boss || room.boss.status !== 'active') return false;
      const b = room.boss;
      b.status = 'escaped';
      b.remainingSec = 0;
      b.endedAt = Date.now();
      const sorted = Object.values(b.dmgByPlayer || {}).sort((a, b2) => b2.dmg - a.dmg);
      b.topDmg = sorted.slice(0, 5).map(d => ({ id: d.id, name: d.name, avatar: d.avatar, dmg: d.dmg, hits: d.hits }));
      b.contributorsCount = sorted.length;
      sorted.forEach(entry => {
        const p = room.players[entry.id];
        if (!p) return;
        p.score += 50;
        touch(p, true);
      });
      room.hostUpdatedAt = Math.max((room.hostUpdatedAt || 0) + 1, Date.now());
      Sync.pushFeed(room, { type: 'bossFail', bossKey: b.key, count: sorted.length });
      return true;
    },

    /* บอสปล่อยท่าไม้ตายประจำตัวโจมตีผู้เล่นในห้อง! (รองรับโล่ป้องกัน 100%) */
    triggerBossAttack(room) {
      if (!room || !room.boss || room.boss.status !== 'active') return null;
      const b = room.boss;
      const meta = (typeof BOSSES !== 'undefined' && BOSSES[b.key]) || { name: 'Boss', attack: { kind: 'freeze', name: 'พายุบอส' } };
      const atk = meta.attack || { kind: 'freeze', name: 'พายุบอส' };
      const kind = atk.kind;

      const allPlayers = Object.values(room.players || {});
      if (!allPlayers.length) return null;

      // เลือกเป้าหมายที่ยังไม่โดนท่าซ้ำอยู่ (เน้นสุ่มจากคนที่กำลังตีบอสหรืออันดับต้นๆ เพื่อความตื่นเต้น!)
      const eligible = allPlayers.filter(p => {
        if (p.selfieLocked) return false;
        if (kind === 'freeze' && p.frozen) return false;
        if (kind === 'blind' && p.blinded) return false;
        if (kind === 'flip' && p.flipped) return false;
        return true;
      });
      const pool = eligible.length ? eligible : allPlayers;

      // ให้โอกาสคนที่ติด Top Damage หรืออันดับสูงโดนบอสเล็งก่อน
      const dmgMap = b.dmgByPlayer || {};
      const sortedPool = [...pool].sort((a, b2) => {
        const da = (dmgMap[a.id] && dmgMap[a.id].dmg) || 0;
        const db = (dmgMap[b2.id] && dmgMap[b2.id].dmg) || 0;
        if (db !== da) return db - da;
        return (b2.score || 0) - (a.score || 0);
      });
      const maxTargets = Math.min(3, Math.max(1, Math.ceil(allPlayers.length * 0.35)));
      // ผสม Top + สุ่มเล็กน้อยเพื่อไม่ให้โดนคนเดิมซ้ำตลอด
      const topSlice = sortedPool.slice(0, Math.min(sortedPool.length, maxTargets + 2));
      for (let i = topSlice.length - 1; i > 0; i--) {
        const j = rand(i + 1);
        [topSlice[i], topSlice[j]] = [topSlice[j], topSlice[i]];
      }
      const targets = topSlice.slice(0, maxTargets);

      const hitPlayers = [];
      const blockedPlayers = [];
      const now = Date.now();

      targets.forEach(p => {
        if ((p.items.shield || 0) > 0) {
          p.items.shield--;
          touch(p, true);
          blockedPlayers.push(p);
          Sync.pushFeed(room, { type: 'block', a: meta.name, b: p.name, kind });
          return;
        }
        if (kind === 'flip') {
          p.flipped = true;
          p.flippedBy = meta.name;
        } else if (kind === 'blind') {
          p.blinded = true;
          p.blindedBy = meta.name;
        } else if (kind === 'zap') {
          const loss = Math.min(50, p.score || 0);
          p.score = Math.max(0, (p.score || 0) - loss);
          p.zappedAt = Math.max((p.zappedAt || 0) + 1, now);
          p.zappedBy = meta.name;
        } else {
          p.frozen = true;
          p.frozenBy = meta.name;
        }
        touch(p, true);
        hitPlayers.push(p);
      });

      b.attackCount = Number(b.attackCount || 0) + 1;
      b.lastAttack = {
        id: uid(),
        kind,
        label: atk.name,
        hitCount: hitPlayers.length,
        blockedCount: blockedPlayers.length,
        t: now
      };
      room.hostUpdatedAt = Math.max((room.hostUpdatedAt || 0) + 1, now);
      Sync.pushFeed(room, {
        type: 'bossAttack',
        bossKey: b.key,
        kind,
        hitCount: hitPlayers.length,
        blockedCount: blockedPlayers.length
      });
      return { kind, label: atk.name, bossName: meta.name, hitPlayers, blockedPlayers, affected: [...hitPlayers, ...blockedPlayers] };
    },

    /* บอสสวนกลับเมื่อนักเรียนตอบคำถามบอสพลาด (< 35%) */
    applyBossCounter(room, pid, bossId) {
      if (!room || !room.boss || room.boss.id !== bossId || room.boss.status !== 'active') return null;
      const me = room.players[pid];
      if (!me) return null;
      const loss = Math.min(25, me.score || 0);
      me.score = Math.max(0, (me.score || 0) - loss);
      touch(me, false);
      if (loss > 0) {
        Sync.pushFeed(room, { type: 'bossCounter', ...feedBase(me, pid), bossKey: room.boss.key, pts: loss });
      }
      return { loss, scoreLeft: me.score };
    },

    /* ---------------- โหมดแบ่งทีม 25 ทีม (ทีมละไม่เกิน 5 คน = สูงสุด 125 คน) ---------------- */
    MAX_TEAM_SIZE: (typeof TEAM_MAX_MEMBERS !== 'undefined' ? TEAM_MAX_MEMBERS : 5),

    teamCounts(room, excludePid = '') {
      const counts = {};
      TEAM_KEYS.forEach(k => { counts[k] = 0; });
      for (const p of Object.values((room && room.players) || {})) {
        if (!p || (excludePid && p.id === excludePid)) continue;
        if (counts[p.team] !== undefined) counts[p.team]++;
      }
      return counts;
    },

    isTeamFull(room, teamKey, excludePid = '') {
      if (!TEAMS[teamKey]) return true;
      const cap = this.MAX_TEAM_SIZE || 5;
      return (this.teamCounts(room, excludePid)[teamKey] || 0) >= cap;
    },

    pickBalancedTeam(room, excludePid = '') {
      const cap = this.MAX_TEAM_SIZE || 5;
      const counts = this.teamCounts(room, excludePid);
      const avail = TEAM_KEYS.filter(k => (counts[k] || 0) < cap);
      if (!avail.length) return '';
      let minC = Infinity;
      for (const k of avail) if (counts[k] < minC) minC = counts[k];
      const least = avail.filter(k => (counts[k] || 0) === minC);
      return least[rand(least.length)] || avail[0];
    },

    enableTeamMode(room, on = true) {
      if (!room) return { ok: false, updated: [] };
      const cap = this.MAX_TEAM_SIZE || 5;
      const all = Object.values(room.players || {}).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
      if (on && all.length > TEAM_KEYS.length * cap) {
        return { ok: false, reason: 'too_many_players', updated: [] };
      }
      room.teamMode = !!on;
      const updated = [];
      if (room.teamMode) {
        const counts = {};
        TEAM_KEYS.forEach(k => { counts[k] = 0; });
        // นับคนที่อยู่ทีมถูกต้องและยังไม่เกิน 5 ก่อน
        all.forEach(p => {
          if (p.team && TEAMS[p.team] && counts[p.team] < cap) {
            counts[p.team]++;
          } else {
            p.team = '';
          }
        });
        // จัดทีมสมดุลให้คนที่ยังไม่มีทีมหรือเกินโควต้า 5 คน
        all.forEach(p => {
          if (!p.team) {
            const avail = TEAM_KEYS.filter(k => counts[k] < cap);
            let minC = Infinity;
            for (const k of avail) if (counts[k] < minC) minC = counts[k];
            const picked = avail.find(k => counts[k] === minC) || '';
            p.team = picked;
            if (picked) counts[picked]++;
            touch(p, true);
            updated.push(p);
          }
        });
      }
      room.hostUpdatedAt = Math.max((room.hostUpdatedAt || 0) + 1, Date.now());
      Sync.pushFeed(room, { type: 'teamMode', on: room.teamMode });
      return { ok: true, updated };
    },

    setPlayerTeam(room, pid, teamKey, isHost = false) {
      const p = room && room.players && room.players[pid];
      if (!p || !TEAMS[teamKey]) return { ok: false, reason: 'invalid' };
      if (p.team === teamKey) return { ok: true, player: p };
      if (this.isTeamFull(room, teamKey, pid)) return { ok: false, reason: 'full' };
      p.team = teamKey;
      touch(p, !!isHost);
      if (isHost) room.hostUpdatedAt = Math.max((room.hostUpdatedAt || 0) + 1, Date.now());
      return { ok: true, player: p };
    },

    enforceTeamCaps(room) {
      if (!room || !room.teamMode) return [];
      const cap = this.MAX_TEAM_SIZE || 5;
      const byTeam = {};
      TEAM_KEYS.forEach(k => { byTeam[k] = []; });
      const needTeam = [];
      for (const p of Object.values(room.players || {})) {
        if (!p) continue;
        if (p.team && byTeam[p.team]) byTeam[p.team].push(p);
        else needTeam.push(p);
      }
      for (const k of TEAM_KEYS) {
        if (byTeam[k].length > cap) {
          byTeam[k].sort((a, b) => (b.hostRev || 0) - (a.hostRev || 0) || (a.joinedAt || 0) - (b.joinedAt || 0));
          const overflow = byTeam[k].slice(cap);
          byTeam[k] = byTeam[k].slice(0, cap);
          overflow.forEach(p => { p.team = ''; needTeam.push(p); });
        }
      }
      const changed = [];
      needTeam.forEach(p => {
        const nextTeam = this.pickBalancedTeam(room, p.id);
        if (nextTeam && p.team !== nextTeam) {
          p.team = nextTeam;
          touch(p, true);
          changed.push(p);
        }
      });
      if (changed.length) room.hostUpdatedAt = Math.max((room.hostUpdatedAt || 0) + 1, Date.now());
      return changed;
    },

    teamRanking(room) {
      const cap = this.MAX_TEAM_SIZE || 5;
      const agg = {};
      TEAM_KEYS.forEach(k => {
        agg[k] = { ...TEAMS[k], score: 0, members: 0, maxMembers: cap, isFull: false, avgScore: 0, topPlayer: null, memberList: [] };
      });
      for (const p of Object.values((room && room.players) || {})) {
        const k = (p && TEAMS[p.team]) ? p.team : null;
        if (!k) continue;
        agg[k].score += Number(p.score || 0);
        agg[k].members += 1;
        agg[k].memberList.push(p);
        if (!agg[k].topPlayer || (p.score || 0) > (agg[k].topPlayer.score || 0)) {
          agg[k].topPlayer = p;
        }
      }
      const list = TEAM_KEYS.map(k => {
        const t = agg[k];
        t.isFull = t.members >= cap;
        t.avgScore = t.members > 0 ? Math.round(t.score / t.members) : 0;
        t.memberList.sort((a, b) => (b.score || 0) - (a.score || 0) || (a.joinedAt || 0) - (b.joinedAt || 0));
        return t;
      });
      return list.sort((a, b) => b.score - a.score || b.members - a.members || a.num - b.num);
    },

    /* ---------------- ปุ่มคุมห้องสำหรับครู (Teacher Moderation) ---------------- */
    moderateHidePhoto(room, pid, blocked = true) {
      const p = room && room.players && room.players[pid];
      if (!p) return null;
      p.photoBlocked = !!blocked;
      if (p.photoBlocked) p.hasPhoto = false;
      touch(p, true);
      room.hostUpdatedAt = Math.max((room.hostUpdatedAt || 0) + 1, Date.now());
      return p;
    },

    moderateRename(room, pid, newName) {
      const p = room && room.players && room.players[pid];
      if (!p) return null;
      const cleanName = String(newName || '').trim().slice(0, 16) || 'นักเรียนน่ารัก';
      p.name = cleanName;
      touch(p, true);
      room.hostUpdatedAt = Math.max((room.hostUpdatedAt || 0) + 1, Date.now());
      return p;
    },

    moderateScore(room, pid, delta, reset = false) {
      const p = room && room.players && room.players[pid];
      if (!p) return null;
      p.score = reset ? 0 : Math.max(0, Number(p.score || 0) + Number(delta || 0));
      touch(p, true);
      room.hostUpdatedAt = Math.max((room.hostUpdatedAt || 0) + 1, Date.now());
      return p;
    },

    moderateKick(room, pid) {
      if (!room || !pid) return null;
      const p = room.players && room.players[pid];
      const name = p ? p.name : 'ผู้เล่น';
      if (room.players && room.players[pid]) delete room.players[pid];
      room.kicked = room.kicked || {};
      room.kicked[pid] = Date.now();
      const kKeys = Object.keys(room.kicked);
      while (kKeys.length > 50) delete room.kicked[kKeys.shift()];
      room.hostUpdatedAt = Math.max((room.hostUpdatedAt || 0) + 1, Date.now());
      Sync.pushFeed(room, { type: 'kick', a: name });
      return { pid, name };
    }
  };
})();
