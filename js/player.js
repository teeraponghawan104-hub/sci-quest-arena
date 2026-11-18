/* Sci-Quest! — Student Mobile-First Controller (Kahoot! Edition) */
(() => {
  const qs = new URLSearchParams(location.search);
  const initRoom = (qs.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  let pendingCard = normCode(qs.get('card'));

  const $ = id => document.getElementById(id);
  const el = {
    loginView: $('loginView'),
    gameView: $('gameView'),
    loginModeBadge: $('loginModeBadge'),
    loginMuteBtn: $('loginMuteBtn'),
    gameMuteBtn: $('gameMuteBtn'),
    joinForm: $('joinForm'),
    joinRoomInput: $('joinRoomInput'),
    joinNameInput: $('joinNameInput'),
    avatarGrid: $('avatarGrid'),
    pickedAvPreview: $('pickedAvPreview'),
    hdrAvatar: $('hdrAvatar'),
    hdrName: $('hdrName'),
    hdrRank: $('hdrRank'),
    hdrRoom: $('hdrRoom'),
    hdrScore: $('hdrScore'),
    buffPills: $('buffPills'),
    scanPanel: $('scanPanel'),
    questionPanel: $('questionPanel'),
    progressText: $('progressText'),
    openScannerBtn: $('openScannerBtn'),
    scannerBox: $('scannerBox'),
    closeScannerBtn: $('closeScannerBtn'),
    cardCodeForm: $('cardCodeForm'),
    cardCodeInput: $('cardCodeInput'),
    allCardsGrid: $('allCardsGrid'),
    qHeader: $('qHeader'),
    qCodeBadge: $('qCodeBadge'),
    qLevelBadge: $('qLevelBadge'),
    qPointsBadge: $('qPointsBadge'),
    qFilmBadge: $('qFilmBadge'),
    qText: $('qText'),
    hintToggleBtn: $('hintToggleBtn'),
    hintBox: $('hintBox'),
    answerForm: $('answerForm'),
    answerInput: $('answerInput'),
    submitAnswerBtn: $('submitAnswerBtn'),
    gradeResult: $('gradeResult'),
    gradeTierLabel: $('gradeTierLabel'),
    gradePctText: $('gradePctText'),
    gradeBar: $('gradeBar'),
    gradeKeywords: $('gradeKeywords'),
    gradeOutcomeBox: $('gradeOutcomeBox'),
    modelAnswerBox: $('modelAnswerBox'),
    modelAnswerText: $('modelAnswerText'),
    nextCardBtn: $('nextCardBtn'),
    itemDock: $('itemDock'),
    targetModal: $('targetModal'),
    targetModalTitle: $('targetModalTitle'),
    targetModalDesc: $('targetModalDesc'),
    targetList: $('targetList'),
    bonusOverlay: $('bonusOverlay'),
    bonusStepQ: $('bonusStepQ'),
    bonusStepBox: $('bonusStepBox'),
    bonusOverlayFilm: $('bonusOverlayFilm'),
    bonusOverlayQ: $('bonusOverlayQ'),
    bonusNeedPct: $('bonusNeedPct'),
    bonusForm: $('bonusForm'),
    bonusInput: $('bonusInput'),
    bonusGradeBox: $('bonusGradeBox'),
    bonusGradeLabel: $('bonusGradeLabel'),
    bonusGradePct: $('bonusGradePct'),
    bonusGradeBar: $('bonusGradeBar'),
    bonusGradeKw: $('bonusGradeKw'),
    mysteryTitle: $('mysteryTitle'),
    mysteryBoxVisual: $('mysteryBoxVisual'),
    mysteryReward: $('mysteryReward'),
    rewardEmoji: $('rewardEmoji'),
    rewardName: $('rewardName'),
    rewardDesc: $('rewardDesc'),
    openMysteryBtn: $('openMysteryBtn'),
    closeMysteryBtn: $('closeMysteryBtn'),
    iceOverlay: $('iceOverlay'),
    frozenByText: $('frozenByText'),
    smashIceBtn: $('smashIceBtn'),
    iceLeftText: $('iceLeftText'),
    stateOverlay: $('stateOverlay'),
    stateIcon: $('stateIcon'),
    stateTitle: $('stateTitle'),
    stateDesc: $('stateDesc'),
    stateExtra: $('stateExtra')
  };

  el.loginModeBadge.textContent = modeLabel();
  if (initRoom) el.joinRoomInput.value = initRoom;

  function syncMute() {
    const ic = SFX.muted ? '🔇' : '🔊';
    el.loginMuteBtn.textContent = ic;
    el.gameMuteBtn.textContent = ic;
  }
  syncMute();
  [el.loginMuteBtn, el.gameMuteBtn].forEach(b => b.addEventListener('click', () => { SFX.toggleMute(); syncMute(); }));

  let selectedAv = rand(AVATARS.length);
  function renderAvatarPicker() {
    el.pickedAvPreview.textContent = `เลือกแล้ว: ${AVATARS[selectedAv].e}`;
    el.avatarGrid.innerHTML = AVATARS.map((a, i) => `
      <button type="button" data-av="${i}" class="av-btn ${i === selectedAv ? 'selected' : ''}" style="background:${a.bg}">${a.e}</button>
    `).join('');
    el.avatarGrid.querySelectorAll('[data-av]').forEach(btn => {
      btn.addEventListener('click', () => {
        SFX.click();
        selectedAv = Number(btn.dataset.av);
        renderAvatarPicker();
      });
    });
  }
  renderAvatarPicker();

  let roomCode = initRoom;
  let myId = null;
  let prevScore = null;
  let prevShields = null;
  let wasFrozen = false;
  let iceHits = 0;
  let currentQ = null;
  let activeBonusId = null;
  let mysteryItemPending = null;
  let mysteryOpen = false;
  let qrScanner = null;

  function showView(view) {
    el.loginView.classList.toggle('hidden', view !== 'login');
    el.gameView.classList.toggle('hidden', view !== 'game');
  }

  function leaveRoomToLogin(notice = '') {
    stopScanner();
    if (roomCode) sessionStorage.removeItem('sqa_pid_' + roomCode);
    Sync.disconnect();
    myId = null;
    prevScore = null;
    prevShields = null;
    wasFrozen = false;
    currentQ = null;
    activeBonusId = null;
    el.iceOverlay.classList.add('hidden');
    el.bonusOverlay.classList.add('hidden');
    el.stateOverlay.classList.add('hidden');
    el.questionPanel.classList.add('hidden');
    el.scanPanel.classList.remove('hidden');
    showView('login');
    if (notice) toast(notice, 'info', 3200);
  }

  async function tryRestoreSession() {
    if (!initRoom) return;
    const savedId = sessionStorage.getItem('sqa_pid_' + initRoom);
    if (!savedId) return;
    try {
      const ok = await Sync.exists(initRoom);
      if (!ok) return;
      myId = savedId;
      roomCode = initRoom;
      await Sync.connect(roomCode, onRoomUpdate);
      // หากเกมในห้องเดิมจบไปแล้ว หรือผู้เล่นถูกล้างออกแล้ว ให้กลับไปหน้าล็อกอินใหม่ทันที ไม่ค้างหน้าเดิม
      if (Sync.room && Sync.room.status !== 'ended' && Sync.room.players[myId]) {
        showView('game');
      } else {
        leaveRoomToLogin();
      }
    } catch (e) {
      leaveRoomToLogin();
    }
  }

  el.joinForm.addEventListener('submit', async e => {
    e.preventDefault();
    const code = el.joinRoomInput.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const name = el.joinNameInput.value.trim();
    if (!code || !name) {
      SFX.wrong();
      toast('กรุณากรอก Game PIN และชื่อเล่น', 'error');
      return;
    }

    const btn = $('joinSubmitBtn');
    btn.disabled = true;
    try {
      const exists = await Sync.exists(code);
      if (!exists) {
        SFX.wrong();
        bump(el.joinForm, 'shake');
        toast(`ไม่พบ Game PIN "${code}" กรุณาเช็กรหัสบนจอครู`, 'error', 3200);
        btn.disabled = false;
        return;
      }

      roomCode = code;
      myId = 'p_' + uid();
      await Sync.connect(code, onRoomUpdate);
      await Sync.transact(room => {
        if (!room) return;
        // หากห้องเดิมค้างสถานะ ended อยู่ ให้ล้างห้องเป็น lobby อัตโนมัติเมื่อมีผู้เล่นใหม่เข้า
        if (room.status === 'ended') {
          const now = Date.now();
          room.status = 'lobby';
          room.bonus = null;
          room.endedAt = null;
          room.usedBonus = {};
          room.players = {};
          room.feed = {};
          room.resetAt = now;
        }
        room.players[myId] = Game.newPlayer(myId, name, selectedAv, false);
        Sync.pushFeed(room, { type: 'join', a: name, ai: myId, av: selectedAv });
        return room;
      });
      sessionStorage.setItem('sqa_pid_' + code, myId);
      SFX.join();
      showView('game');
    } catch (err) {
      SFX.wrong();
      toast('เชื่อมต่อห้องไม่สำเร็จ กรุณาลองใหม่', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  $('leaveBtn').addEventListener('click', () => {
    SFX.click();
    leaveRoomToLogin();
  });

  function openQuestion(rawCode) {
    const code = normCode(rawCode);
    const q = code && QUESTION_MAP[code];
    if (!q) {
      SFX.wrong();
      bump(el.cardCodeForm, 'shake');
      toast('ไม่พบรหัสการ์ดนี้ (ลอง G-01 ถึง R-12)', 'error');
      return;
    }
    const me = Sync.room && Sync.room.players[myId];
    if (me && me.answered[q.id]) {
      SFX.partial();
      toast(`การ์ด ${prettyCode(q.id)} ตอบได้ +${me.answered[q.id]} แต้มไปแล้ว! ลองใบใหม่เลย`, 'warn');
      return;
    }

    currentQ = q;
    const c = COLORS[q.color];
    const f = FILMS[q.film];
    const isX2 = !!(me && me.x2Active);
    const ptsShow = isX2 ? `${c.points * 2} แต้ม (⚡x2!)` : `${c.points} แต้ม`;

    el.qHeader.style.background = c.bg;
    el.qHeader.style.color = c.text;
    el.qCodeBadge.textContent = `${c.shape} ${prettyCode(q.id)}`;
    el.qLevelBadge.textContent = `${c.name} • ${c.level}`;
    el.qPointsBadge.textContent = ptsShow;
    el.qFilmBadge.style.background = f.color;
    el.qFilmBadge.textContent = `${f.emoji} ${f.short}`;
    el.qText.textContent = q.q;

    const needCount = q.need || (q.kw.length >= 4 ? q.kw.length - 1 : q.kw.length);
    el.hintBox.classList.add('hidden');
    el.hintBox.textContent = `คำตอบนี้มีแนวคิดสำคัญทั้งหมด ${q.kw.length} ประเด็น ลองอธิบายให้ครบอย่างน้อย ${needCount} ประเด็นด้วยภาษาของคุณเองนะ!`;

    el.answerInput.value = '';
    el.answerInput.disabled = false;
    el.submitAnswerBtn.disabled = false;
    el.submitAnswerBtn.classList.remove('hidden');
    el.gradeResult.classList.add('hidden');
    el.modelAnswerBox.classList.add('hidden');
    el.nextCardBtn.classList.add('hidden');

    el.scanPanel.classList.add('hidden');
    el.questionPanel.classList.remove('hidden');
    SFX.pop();
    setTimeout(() => el.answerInput.focus(), 120);
  }

  function backToScan() {
    SFX.click();
    currentQ = null;
    el.questionPanel.classList.add('hidden');
    el.scanPanel.classList.remove('hidden');
  }
  $('backToScanBtn').addEventListener('click', backToScan);
  el.nextCardBtn.addEventListener('click', backToScan);
  el.hintToggleBtn.addEventListener('click', () => {
    SFX.click();
    el.hintBox.classList.toggle('hidden');
  });

  el.cardCodeForm.addEventListener('submit', e => {
    e.preventDefault();
    const val = el.cardCodeInput.value.trim();
    if (!val) return;
    el.cardCodeInput.value = '';
    openQuestion(val);
  });

  document.querySelectorAll('[data-pick-color]').forEach(btn => {
    btn.addEventListener('click', () => {
      const col = btn.dataset.pickColor;
      const me = Sync.room && Sync.room.players[myId];
      const pool = QUESTIONS.filter(q => q.color === col && !(me && me.answered[q.id]));
      if (!pool.length) {
        toast(`คุณตอบการ์ด${COLORS[col].name}ครบทุกใบแล้ว!`, 'success');
        return;
      }
      openQuestion(pool[rand(pool.length)].id);
    });
  });

  async function stopScanner() {
    el.scannerBox.classList.add('hidden');
    if (!qrScanner) return;
    try { await qrScanner.stop(); } catch (e) {}
    try { qrScanner.clear(); } catch (e) {}
    qrScanner = null;
  }

  el.openScannerBtn.addEventListener('click', async () => {
    SFX.click();
    if (!window.Html5Qrcode) {
      toast('ยังโหลดตัวสแกนกล้องไม่สำเร็จ กรุณาพิมพ์รหัสการ์ดแทน', 'warn');
      return;
    }
    el.scannerBox.classList.remove('hidden');
    try {
      qrScanner = new Html5Qrcode('reader');
      await qrScanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        async decoded => {
          let extracted = decoded;
          try {
            const u = new URL(decoded);
            if (u.searchParams.get('card')) extracted = u.searchParams.get('card');
          } catch (e) {}
          const code = normCode(extracted);
          if (!code || !QUESTION_MAP[code]) return;
          await stopScanner();
          openQuestion(code);
        }
      );
    } catch (err) {
      await stopScanner();
      toast('เปิดกล้องไม่ได้ (กรุณาอนุญาตสิทธิ์กล้อง หรือพิมพ์รหัสการ์ดด้านล่าง)', 'warn', 3500);
    }
  });
  $('closeScannerBtn').addEventListener('click', () => { SFX.click(); stopScanner(); });

  el.answerForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!currentQ) return;
    const ans = el.answerInput.value.trim();
    if (!ans) {
      SFX.wrong();
      bump(el.answerInput, 'shake');
      toast('พิมพ์คำตอบก่อนกดส่งนะ', 'warn');
      return;
    }

    const res = Grader.grade(ans, currentQ);
    el.gradeResult.classList.remove('hidden');
    el.gradeTierLabel.textContent = res.label;
    el.gradeTierLabel.style.color = res.color;
    el.gradePctText.textContent = `${res.accuracy}%`;
    el.gradePctText.style.color = res.color;

    el.gradeBar.style.transition = 'none';
    el.gradeBar.style.width = '0%';
    el.gradeBar.style.background = res.color;
    requestAnimationFrame(() => {
      el.gradeBar.style.transition = '';
      el.gradeBar.style.width = `${res.accuracy}%`;
    });

    el.gradeKeywords.innerHTML = res.concepts.map(c => c.credit > 0
      ? `<span class="kw-chip bg-[#26890c] text-white">✓ ${esc(c.label)}</span>`
      : `<span class="kw-chip bg-neutral-200 text-neutral-500">○ ${esc(c.label)}</span>`
    ).join('');

    if (res.multiplier === 0) {
      SFX.wrong();
      bump(el.gradeResult, 'shake');
      el.gradeOutcomeBox.className = 'rounded-[4px] p-3 text-sm bg-[#e21b3c] text-white font-extrabold';
      el.gradeOutcomeBox.textContent = 'ความแม่นยำยังไม่ถึง 25% — ลองเพิ่มคำสำคัญแล้วส่งใหม่ได้เลย!';
      return;
    }

    el.answerInput.disabled = true;
    el.submitAnswerBtn.disabled = true;
    el.submitAnswerBtn.classList.add('hidden');

    const luckyItem = (currentQ.color === 'red' && Math.random() < Game.cfg.redItemChance)
      ? Game.randomItem() : null;

    let applied = null;
    await Sync.transact(room => {
      if (!room) return;
      applied = Game.applyAnswer(room, myId, currentQ, res.multiplier, res.accuracy, luckyItem);
      return room;
    });

    const pts = applied ? applied.pts : Math.round(COLORS[currentQ.color].points * res.multiplier);
    const doubled = applied ? applied.doubled : false;
    if (res.accuracy >= 80) SFX.correct();
    else SFX.partial();

    el.gradeOutcomeBox.className = 'rounded-[4px] p-3 text-sm bg-[#26890c] text-white font-extrabold flex items-center justify-between';
    el.gradeOutcomeBox.innerHTML = `
      <span>ถูกต้อง! คะแนนที่ได้รับ</span>
      <span class="font-display text-xl font-black">+${pts}${doubled ? ' <span class="x2tag text-xs">x2!</span>' : ''}</span>`;

    el.modelAnswerText.textContent = currentQ.model;
    el.modelAnswerBox.classList.remove('hidden');
    el.nextCardBtn.classList.remove('hidden');

    if (luckyItem) {
      setTimeout(() => showMysteryBox(luckyItem, '🎁 โบนัสพิเศษจากการ์ดสีแดง!'), 650);
    }
  });

  function showMysteryBox(itemKey, title) {
    mysteryItemPending = itemKey;
    mysteryOpen = true;
    el.bonusStepQ.classList.add('hidden');
    el.bonusStepBox.classList.remove('hidden');
    el.mysteryTitle.textContent = title || '🎉 ยินดีด้วย! กดเปิดกล่องสุ่ม!';
    el.mysteryBoxVisual.textContent = '🎁';
    el.mysteryBoxVisual.className = 'text-8xl select-none cursor-pointer box-shake inline-block my-2';
    el.mysteryReward.classList.add('hidden');
    el.openMysteryBtn.classList.remove('hidden');
    el.closeMysteryBtn.classList.add('hidden');
    el.bonusOverlay.classList.remove('hidden');
  }

  function openMysteryBoxNow() {
    if (!mysteryItemPending) return;
    const it = ITEMS[mysteryItemPending];
    el.mysteryBoxVisual.className = 'text-8xl select-none inline-block my-2 box-open';
    el.openMysteryBtn.classList.add('hidden');
    SFX.item();
    confetti(2000, 90);
    setTimeout(() => {
      el.mysteryBoxVisual.classList.add('hidden');
      el.rewardEmoji.textContent = it.emoji;
      el.rewardName.textContent = `ได้รับ "${it.name}"!`;
      el.rewardDesc.textContent = it.desc;
      el.mysteryReward.classList.remove('hidden');
      el.closeMysteryBtn.classList.remove('hidden');
    }, 380);
  }
  el.openMysteryBtn.addEventListener('click', openMysteryBoxNow);
  el.mysteryBoxVisual.addEventListener('click', openMysteryBoxNow);
  el.closeMysteryBtn.addEventListener('click', () => {
    SFX.click();
    mysteryOpen = false;
    mysteryItemPending = null;
    el.mysteryBoxVisual.classList.remove('hidden');
    el.bonusOverlay.classList.add('hidden');
  });

  el.bonusForm.addEventListener('submit', async e => {
    e.preventDefault();
    const room = Sync.room;
    if (!room || !room.bonus) return;
    const bq = BONUS_MAP[room.bonus.qid];
    if (!bq) return;
    const ans = el.bonusInput.value.trim();
    if (!ans) { SFX.wrong(); return; }

    const res = Grader.grade(ans, bq);
    el.bonusGradeBox.classList.remove('hidden');
    el.bonusGradeLabel.textContent = res.label;
    el.bonusGradeLabel.style.color = res.color;
    el.bonusGradePct.textContent = `${res.accuracy}%`;
    el.bonusGradePct.style.color = res.color;
    el.bonusGradeBar.style.width = `${res.accuracy}%`;
    el.bonusGradeBar.style.background = res.color;
    el.bonusGradeKw.innerHTML = res.concepts.map(c => c.credit > 0
      ? `<span class="kw-chip !text-xs bg-[#26890c] text-white">✓ ${esc(c.label)}</span>`
      : `<span class="kw-chip !text-xs bg-neutral-200 text-neutral-500">○ ${esc(c.label)}</span>`
    ).join('');

    if (res.accuracy < Game.cfg.bonusPassThreshold) {
      SFX.wrong();
      toast(`ต้องแม่นยำอย่างน้อย ${Game.cfg.bonusPassThreshold}% ลองเติมคำสำคัญอีกนิด!`, 'warn');
      return;
    }

    const reward = Game.randomItem();
    const bid = room.bonus.id;
    let ok = false;
    await Sync.transact(r => {
      ok = Game.applyBonusWin(r, myId, bid, res.accuracy, reward);
      return r;
    });
    if (ok) {
      SFX.correct();
      showMysteryBox(reward, '★ ตอบโบนัสผ่าน! เปิดกล่องสุ่มเลย!');
    } else {
      el.bonusOverlay.classList.add('hidden');
      toast('คุณรับรางวัลโบนัสรอบนี้ไปแล้ว', 'info');
    }
  });

  function renderItemDock(me) {
    el.itemDock.innerHTML = ITEM_KEYS.map(k => {
      const it = ITEMS[k];
      const count = (me.items && me.items[k]) || 0;
      const isX2On = k === 'x2' && me.x2Active;
      return `
        <button data-item="${k}" class="item-btn relative py-2.5 px-1 flex flex-col items-center justify-center text-white ${count === 0 && !isX2On ? 'empty' : ''}"
          style="background:${it.color};box-shadow:0 4px 0 ${it.dark}">
          <span class="absolute top-1 left-1.5 text-[10px] font-black opacity-60">${it.shape}</span>
          ${count > 0 ? `<span class="item-badge">${count}</span>` : ''}
          <span class="text-2xl leading-none mb-0.5">${it.emoji}</span>
          <span class="text-[11px] font-display font-extrabold leading-tight">${isX2On ? 'x2 เปิดอยู่!' : it.name}</span>
        </button>`;
    }).join('');

    el.itemDock.querySelectorAll('[data-item]').forEach(btn => {
      btn.addEventListener('click', () => handleItemTap(btn.dataset.item));
    });
  }

  async function handleItemTap(kind) {
    const room = Sync.room;
    const me = room && room.players[myId];
    if (!me) return;
    const count = (me.items && me.items[kind]) || 0;

    if (kind === 'shield') {
      SFX.click();
      toast(count > 0 ? `🛡️ มีโล่ ${count} อัน — ป้องกันอัตโนมัติเมื่อโดนเพื่อนแกล้ง!` : 'ยังไม่มีโล่ป้องกัน (หาได้จากโบนัสหรือการ์ดแดง)', 'info');
      return;
    }
    if (count <= 0) {
      SFX.wrong();
      toast(`ยังไม่มีไอเทม ${ITEMS[kind].name} (ลุ้นจากโบนัสหรือการ์ดแดง!)`, 'warn');
      return;
    }

    if (kind === 'x2') {
      if (me.x2Active) { toast('⚡ คูณสองเปิดใช้งานอยู่แล้ว! ตอบข้อต่อไปได้เลย', 'info'); return; }
      await Sync.transact(r => { Game.useX2(r, myId); return r; });
      SFX.item();
      toast('⚡ เปิดใช้งานคูณสอง! การ์ดใบถัดไปได้ 2 เท่า', 'success');
      if (currentQ && !el.questionPanel.classList.contains('hidden')) {
        const c = COLORS[currentQ.color];
        el.qPointsBadge.textContent = `${c.points * 2} แต้ม (⚡x2!)`;
      }
      return;
    }

    const others = Game.ranking(room).filter(p => p.id !== myId);
    if (!others.length) {
      SFX.wrong();
      toast('ยังไม่มีเพื่อนคนอื่นในห้องให้ใช้ไอเทมนี้', 'warn');
      return;
    }
    SFX.pop();
    el.targetModalTitle.textContent = `${ITEMS[kind].emoji} เลือกเพื่อนที่จะ${ITEMS[kind].name}`;
    el.targetModalDesc.textContent = ITEMS[kind].desc;
    el.targetList.innerHTML = others.map(t => `
      <button data-target="${t.id}" class="w-full p-2.5 rounded-[4px] bg-neutral-100 hover:bg-neutral-200 border-2 border-neutral-300 hover:border-[#333] transition flex items-center justify-between gap-2 text-left">
        <div class="flex items-center gap-2.5 min-w-0">
          ${avatarHtml(t.avatar, 40)}
          <div class="min-w-0">
            <div class="font-display font-extrabold text-[#333] truncate">${esc(t.name)}</div>
            <div class="text-xs font-bold text-neutral-500">${t.score.toLocaleString()} แต้ม ${t.frozen ? '• ❄️ แช่แข็งอยู่' : ''}</div>
          </div>
        </div>
        <span class="btn-3d k-btn-red px-3 py-1.5 text-xs shrink-0">เลือก!</span>
      </button>`).join('');

    el.targetList.querySelectorAll('[data-target]').forEach(b => {
      b.addEventListener('click', async () => {
        const tid = b.dataset.target;
        el.targetModal.classList.add('hidden');
        let res = null;
        await Sync.transact(r => { res = Game.applyAttack(r, myId, tid, kind); return r; });
        if (!res) return;
        if (res.result === 'blocked') {
          SFX.block();
          toast('🛡️ เพื่อนมีโล่ป้องกัน! การโจมตีถูกสกัดไว้ได้', 'warn');
        } else if (res.result === 'steal') {
          SFX.whoosh();
          toast(`💰 ขโมยมาได้ +${res.amt} แต้ม!`, 'success');
        } else {
          SFX.whoosh();
          toast('❄️ ส่งพายุน้ำแข็งแช่แข็งหน้าจอเพื่อนแล้ว!', 'ice');
        }
      });
    });
    el.targetModal.classList.remove('hidden');
  }
  $('closeTargetModal').addEventListener('click', () => { SFX.click(); el.targetModal.classList.add('hidden'); });
  el.targetModal.addEventListener('click', e => { if (e.target === el.targetModal) el.targetModal.classList.add('hidden'); });

  el.smashIceBtn.addEventListener('click', async () => {
    if (!wasFrozen) return;
    iceHits++;
    const crackEl = $('crack' + Math.min(5, iceHits));
    if (crackEl) crackEl.classList.add('on');
    const left = Math.max(0, Game.cfg.freezeHits - iceHits);
    el.iceLeftText.textContent = String(left);
    SFX.crack();
    bump(el.smashIceBtn, 'shake');

    if (iceHits >= Game.cfg.freezeHits) {
      SFX.shatter();
      el.iceOverlay.classList.add('shatter-out');
      await Sync.transact(r => { Game.unfreeze(r, myId); return r; });
      setTimeout(() => {
        el.iceOverlay.classList.add('hidden');
        el.iceOverlay.classList.remove('shatter-out');
        wasFrozen = false;
      }, 320);
    }
  });

  function onRoomUpdate(room) {
    if (!room || !myId) return;
    const me = room.players[myId];
    if (!me) {
      // ครูได้กดเริ่มเกมใหม่ / ล้างห้องแล้ว -> พากลับหน้าล็อกอินอัตโนมัติ
      leaveRoomToLogin('🔄 เริ่มเกมรอบใหม่แล้ว! กรุณาใส่ชื่อเข้าร่วมอีกครั้ง');
      return;
    }

    const ranked = Game.ranking(room);
    const rankIdx = ranked.findIndex(p => p.id === myId);

    el.hdrAvatar.innerHTML = avatarHtml(me.avatar, 38);
    el.hdrName.textContent = me.name;
    el.hdrRoom.textContent = room.code;
    el.hdrRank.textContent = `#${rankIdx + 1}/${ranked.length}`;
    el.hdrScore.textContent = me.score.toLocaleString();

    if (prevScore !== null && me.score !== prevScore) {
      bump(el.hdrScore);
      if (me.score < prevScore) {
        SFX.stolen();
        toast(`😱 โดนเพื่อนขโมยไป ${prevScore - me.score} แต้ม!`, 'error', 3200);
      }
    }
    const curShields = me.items?.shield || 0;
    if (prevShields !== null && curShields < prevShields) {
      SFX.block();
      toast('🛡️ โล่ป้องกันช่วยสกัดการโจมตีของเพื่อนไว้ได้!', 'info', 3200);
    }
    prevScore = me.score;
    prevShields = curShields;

    const pills = [];
    if (me.x2Active) pills.push('<span class="px-2.5 py-1 rounded-[4px] bg-[#d89e00] text-white font-extrabold text-xs">⚡ คูณสองพร้อมทำงาน (ข้อถัดไป x2)</span>');
    if (curShields > 0) pills.push(`<span class="px-2.5 py-1 rounded-[4px] bg-[#1368ce] text-white font-extrabold text-xs">🛡️ โล่ป้องกัน x${curShields}</span>`);
    el.buffPills.innerHTML = pills.join('');
    el.buffPills.classList.toggle('hidden', pills.length === 0);

    const doneCount = Object.keys(me.answered || {}).length;
    el.progressText.textContent = `${doneCount} / ${QUESTIONS.length} การ์ด`;
    el.allCardsGrid.innerHTML = QUESTIONS.map(q => {
      const c = COLORS[q.color];
      const done = !!me.answered[q.id];
      return `<button type="button" data-card-pick="${q.id}"
        class="py-1.5 rounded-[4px] text-[11px] font-display font-black transition ${done ? 'opacity-40 ring-2 ring-white' : 'hover:brightness-110'}"
        style="background:${c.bg};color:${c.text}">${q.id}${done ? '✓' : ''}</button>`;
    }).join('');
    el.allCardsGrid.querySelectorAll('[data-card-pick]').forEach(b => {
      b.addEventListener('click', () => openQuestion(b.dataset.cardPick));
    });

    renderItemDock(me);

    if (me.frozen && room.status === 'playing' && !wasFrozen) {
      wasFrozen = true;
      iceHits = 0;
      for (let i = 1; i <= 5; i++) $('crack' + i).classList.remove('on');
      el.frozenByText.textContent = me.frozenBy || 'เพื่อน';
      el.iceLeftText.textContent = String(Game.cfg.freezeHits);
      el.iceOverlay.classList.remove('hidden', 'shatter-out');
      SFX.freeze();
    } else if ((!me.frozen || room.status !== 'playing') && wasFrozen) {
      wasFrozen = false;
      el.iceOverlay.classList.add('hidden');
    }

    if (room.status === 'lobby') {
      el.stateIcon.textContent = '🎉';
      el.stateTitle.textContent = "You're in! เข้าห้องแล้ว!";
      el.stateDesc.textContent = `เห็นชื่อของคุณบนหน้าจอครูไหม? รอครูกดเริ่มเกมสักครู่ (${ranked.length} คนในห้อง)`;
      el.stateExtra.innerHTML = `<div class="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-[#333] text-white font-black text-base">${AVATARS[me.avatar].e} ${esc(me.name)}</div>`;
      el.stateOverlay.classList.remove('hidden');
    } else if (room.status === 'paused') {
      el.stateIcon.textContent = '⏸️';
      el.stateTitle.textContent = 'เกมหยุดชั่วคราว';
      el.stateDesc.textContent = 'เงยหน้าดูหน้าจอครูสักครู่นะ เดี๋ยวกลับมาลุยต่อ!';
      el.stateExtra.innerHTML = '';
      el.stateOverlay.classList.remove('hidden');
    } else if (room.status === 'ended') {
      if (roomCode) sessionStorage.removeItem('sqa_pid_' + roomCode);
      el.stateIcon.textContent = rankIdx === 0 ? '🥇' : (rankIdx === 1 ? '🥈' : (rankIdx === 2 ? '🥉' : '🏁'));
      el.stateTitle.textContent = `ได้อันดับ #${rankIdx + 1}`;
      el.stateDesc.textContent = `คะแนนรวมของคุณคือ ${me.score.toLocaleString()} แต้ม`;
      el.stateExtra.innerHTML = `
        <div class="bg-neutral-100 rounded-[4px] p-3 text-left space-y-1.5 mb-3">
          <div class="text-xs font-extrabold uppercase text-neutral-500">Podium Top 3</div>
          ${ranked.slice(0, 3).map((p, i) => `
            <div class="flex items-center justify-between text-sm font-extrabold text-[#333]">
              <span>${['🥇 #1', '🥈 #2', '🥉 #3'][i]} ${esc(p.name)}</span>
              <span class="tabular">${p.score.toLocaleString()}</span>
            </div>`).join('')}
        </div>
        <button id="endLeaveBtn" type="button" class="btn-3d k-btn-green w-full py-3.5 text-base">
          🔄 ออกจากห้อง / เล่นรอบใหม่
        </button>`;
      const endBtn = $('endLeaveBtn');
      if (endBtn) endBtn.addEventListener('click', () => { SFX.click(); leaveRoomToLogin(); });
      el.stateOverlay.classList.remove('hidden');
    } else {
      el.stateOverlay.classList.add('hidden');
      if (pendingCard) {
        const c = pendingCard;
        pendingCard = null;
        openQuestion(c);
      }
    }

    if (!mysteryOpen) {
      if (room.status === 'playing' && room.bonus && !(room.bonus.answered || {})[myId]) {
        const bq = BONUS_MAP[room.bonus.qid];
        if (bq && activeBonusId !== room.bonus.id) {
          activeBonusId = room.bonus.id;
          const f = FILMS[bq.film];
          el.bonusOverlayFilm.textContent = `${f.emoji} ${f.short}`;
          el.bonusOverlayQ.textContent = bq.q;
          el.bonusNeedPct.textContent = String(Game.cfg.bonusPassThreshold);
          el.bonusInput.value = '';
          el.bonusGradeBox.classList.add('hidden');
          el.bonusStepBox.classList.add('hidden');
          el.bonusStepQ.classList.remove('hidden');
          el.bonusOverlay.classList.remove('hidden');
          SFX.bonus();
        }
      } else {
        activeBonusId = null;
        el.bonusOverlay.classList.add('hidden');
      }
    }
  }

  refreshIcons();
  tryRestoreSession();
})();
