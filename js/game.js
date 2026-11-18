/* Sci-Quest Arena — กติกาเกม (ใช้ร่วมกันทั้งผู้เล่นและบอทจำลองฝั่งครู)
 * ทุกฟังก์ชัน apply* จะแก้ไข room ภายใน Sync.transact() */
const Game = (() => {
  const cfg = Object.assign({ redItemChance: .4, stealAmount: 100, freezeHits: 5, bonusPassThreshold: 50 },
    (window.SQA_CONFIG || {}).game || {});

  const feedBase = (p, pid) => ({ a: p.name, ai: pid, av: p.avatar });

  return {
    cfg,
    newPlayer(id, name, avatar, isBot = false) {
      return { id, name, avatar, isBot, score: 0, items: { x2: 0, shield: 0, steal: 0, freeze: 0 },
        x2Active: false, frozen: false, frozenBy: '', answered: {}, joinedAt: Date.now() };
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
      Sync.pushFeed(room, { type: 'score', ...feedBase(me, pid), pts, color: q.color, acc, doubled });
      if (item) {
        me.items[item] = (me.items[item] || 0) + 1;
        Sync.pushFeed(room, { type: 'item', ...feedBase(me, pid), item, src: 'red' });
      }
      return { pts, doubled };
    },

    useX2(room, pid) {
      const me = room.players[pid];
      if (!me || me.items.x2 <= 0 || me.x2Active) return false;
      me.items.x2--; me.x2Active = true;
      Sync.pushFeed(room, { type: 'x2', ...feedBase(me, pid) });
      return true;
    },

    applyAttack(room, aid, tid, kind) {
      const a = room.players[aid], t = room.players[tid];
      if (!a || !t || aid === tid || (a.items[kind] || 0) <= 0) return null;
      a.items[kind]--;
      const base = { ...feedBase(a, aid), b: t.name, bi: tid, bv: t.avatar };
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
      t.frozen = true; t.frozenBy = a.name;
      Sync.pushFeed(room, { type: 'freeze', ...base });
      return { result: 'freeze' };
    },

    applyBonusWin(room, pid, bid, acc, item) {
      const me = room.players[pid];
      if (!me || !room.bonus || room.bonus.id !== bid) return false;
      room.bonus.answered = room.bonus.answered || {};
      if (room.bonus.answered[pid]) return false;
      room.bonus.answered[pid] = acc;
      me.items[item] = (me.items[item] || 0) + 1;
      Sync.pushFeed(room, { type: 'bonusWin', ...feedBase(me, pid), item });
      return true;
    },

    unfreeze(room, pid) {
      const me = room.players[pid];
      if (!me || !me.frozen) return false;
      me.frozen = false; me.frozenBy = '';
      Sync.pushFeed(room, { type: 'unfreeze', ...feedBase(me, pid) });
      return true;
    }
  };
})();
