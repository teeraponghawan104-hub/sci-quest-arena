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
    newPlayer(id, name, avatar, isBot = false) {
      const now = Date.now();
      const items = emptyItems();
      // แจกไอเทมต้อนรับสุ่ม 1 ชิ้น + แจกไอเทม "แชะหน้าตลก (selfie)" 1 ชิ้นให้ลองเล่นสนุกได้ทันที!
      items[ITEM_KEYS[rand(ITEM_KEYS.length)]] = 1;
      items.selfie = (items.selfie || 0) + 1;
      return {
        id, name, avatar, isBot, score: 0, streak: 0, items,
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
      if (room.status === 'lobby' || room.status === 'paused') room.status = 'playing';
      room.feverId = 'fv_' + uid();
      room.feverRemainingSec = sec;
      room.hostUpdatedAt = Date.now();
      Sync.pushFeed(room, { type: 'fever', sec });
      return true;
    },

    triggerUnderdogBoost(room) {
      const ranked = this.ranking(room);
      if (ranked.length < 2) return 0;
      const startIdx = Math.max(1, Math.floor(ranked.length / 2));
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
      return targets.length;
    },

    triggerFreezeTop(room) {
      const ranked = this.ranking(room);
      if (!ranked.length) return 0;
      const top = ranked.slice(0, Math.min(3, ranked.length));
      let frozenCount = 0;
      top.forEach(p => {
        if ((p.items.shield || 0) > 0) {
          p.items.shield--;
          touch(p, true);
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
      return top.length;
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
    }
  };
})();
