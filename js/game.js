/* Sci-Quest! — กติกาเกมและระบบไอเทม 8 ชนิด (ใช้ร่วมกันทั้งผู้เล่นและบอทจำลองฝั่งครู)
 * ทุกฟังก์ชัน apply* จะอัปเดต updatedAt ของผู้เล่นเพื่อรองรับการ Merge ข้ามอุปกรณ์แบบ Real-time */
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

  return {
    cfg,
    emptyItems,
    newPlayer(id, name, avatar, isBot = false) {
      const now = Date.now();
      const items = emptyItems();
      // แจกไอเทมต้อนรับสุ่ม 1 ชิ้น + แจกไอเทม "แชะหน้าตลก (selfie)" 1 ชิ้นให้ลองเล่นสนุกได้ทันที!
      items[ITEM_KEYS[rand(ITEM_KEYS.length)]] = 1;
      items.selfie = (items.selfie || 0) + 1;
      return {
        id, name, avatar, isBot, score: 0, items,
        x2Active: false,
        frozen: false, frozenBy: '',
        blinded: false, blindedBy: '',
        flipped: false, flippedBy: '',
        selfieLocked: false, selfieFrom: '', selfieStatus: '', selfiePhoto: '',
        zappedAt: 0, zappedBy: '',
        answered: {}, joinedAt: now, updatedAt: now
      };
    },
    randomItem: () => ITEM_KEYS[rand(ITEM_KEYS.length)],
    ranking: room => Object.values(room.players || {}).sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt),

    applyAnswer(room, pid, q, mult, acc, item) {
      const me = room.players[pid];
      if (!me || me.answered[q.id]) return null;
      let pts = Math.round(COLORS[q.color].points * mult), doubled = false;
      if (me.x2Active) { pts *= 2; doubled = true; me.x2Active = false; }
      me.score += pts;
      me.answered[q.id] = pts;
      me.updatedAt = Date.now();
      Sync.pushFeed(room, { type: 'score', ...feedBase(me, pid), pts, color: q.color, acc, doubled });
      if (item) {
        me.items[item] = (me.items[item] || 0) + 1;
        Sync.pushFeed(room, { type: 'item', ...feedBase(me, pid), item, src: 'red' });
      }
      return { pts, doubled };
    },

    useX2(room, pid) {
      const me = room.players[pid];
      if (!me || (me.items.x2 || 0) <= 0 || me.x2Active) return false;
      me.items.x2--; me.x2Active = true;
      me.updatedAt = Date.now();
      Sync.pushFeed(room, { type: 'x2', ...feedBase(me, pid) });
      return true;
    },

    useBoost(room, pid) {
      const me = room.players[pid];
      if (!me || (me.items.boost || 0) <= 0) return null;
      me.items.boost--;
      const pts = cfg.boostAmount;
      me.score += pts;
      me.updatedAt = Date.now();
      Sync.pushFeed(room, { type: 'boost', ...feedBase(me, pid), pts });
      return { pts };
    },

    applyAttack(room, aid, tid, kind) {
      const a = room.players[aid], t = room.players[tid];
      if (!a || !t || aid === tid || (a.items[kind] || 0) <= 0) return null;
      const now = Date.now();
      a.items[kind]--;
      a.updatedAt = now;
      t.updatedAt = now;
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
        t.zappedAt = now;
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
      me.updatedAt = Date.now();
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
      p.updatedAt = Date.now();
      Sync.pushFeed(room, { type: 'selfieApproved', ...feedBase(p, pid) });
      return true;
    },

    rejectSelfie(room, pid) {
      const p = room.players[pid];
      if (!p || !p.selfieLocked) return false;
      p.selfieStatus = 'waiting_photo';
      p.selfiePhoto = '';
      p.updatedAt = Date.now();
      Sync.pushFeed(room, { type: 'selfieRejected', ...feedBase(p, pid) });
      return true;
    },

    giftRandomItemToAll(room) {
      const now = Date.now();
      const list = Object.values(room.players || {});
      if (!list.length) return 0;
      list.forEach(p => {
        const it = ITEM_KEYS[rand(ITEM_KEYS.length)];
        p.items[it] = (p.items[it] || 0) + 1;
        p.updatedAt = now;
      });
      Sync.pushFeed(room, { type: 'giftAll' });
      return list.length;
    },

    applyBonusWin(room, pid, bid, acc, item) {
      const me = room.players[pid];
      if (!me || !room.bonus || room.bonus.id !== bid) return false;
      room.bonus.answered = room.bonus.answered || {};
      if (room.bonus.answered[pid]) return false;
      room.bonus.answered[pid] = acc;
      me.items[item] = (me.items[item] || 0) + 1;
      me.updatedAt = Date.now();
      Sync.pushFeed(room, { type: 'bonusWin', ...feedBase(me, pid), item });
      return true;
    },

    unfreeze(room, pid) {
      const me = room.players[pid];
      if (!me || !me.frozen) return false;
      me.frozen = false; me.frozenBy = '';
      me.updatedAt = Date.now();
      Sync.pushFeed(room, { type: 'unfreeze', ...feedBase(me, pid) });
      return true;
    },

    unblind(room, pid) {
      const me = room.players[pid];
      if (!me || !me.blinded) return false;
      me.blinded = false; me.blindedBy = '';
      me.updatedAt = Date.now();
      Sync.pushFeed(room, { type: 'unblind', ...feedBase(me, pid) });
      return true;
    },

    unflip(room, pid) {
      const me = room.players[pid];
      if (!me || !me.flipped) return false;
      me.flipped = false; me.flippedBy = '';
      me.updatedAt = Date.now();
      Sync.pushFeed(room, { type: 'unflip', ...feedBase(me, pid) });
      return true;
    }
  };
})();
