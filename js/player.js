/* Sci-Quest! — Student Mobile-First Controller (Kahoot! Edition) */
(() => {
  const qs = new URLSearchParams(location.search);
  const initRoom = (qs.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const brokerIdx = qs.has('b') ? (Number(qs.get('b')) || 0) : 0;
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
    hdrTimerBar: $('hdrTimerBar'),
    hdrTimerFill: $('hdrTimerFill'),
    hdrTimer: $('hdrTimer'),
    hdrScore: $('hdrScore'),
    playerConnDot: $('playerConnDot'),
    lineBanner: $('lineBanner'),
    openExtBrowserBtn: $('openExtBrowserBtn'),
    dismissLineBanner: $('dismissLineBanner'),
    buffPills: $('buffPills'),
    scanPanel: $('scanPanel'),
    questionPanel: $('questionPanel'),
    progressText: $('progressText'),
    openScannerBtn: $('openScannerBtn'),
    qrFileInput: $('qrFileInput'),
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
    targetSearchInput: $('targetSearchInput'),
    targetRandomBtn: $('targetRandomBtn'),
    targetList: $('targetList'),
    bonusOverlay: $('bonusOverlay'),
    bonusStepQ: $('bonusStepQ'),
    bonusStepBox: $('bonusStepBox'),
    bonusOverlayDurBadge: $('bonusOverlayDurBadge'),
    bonusOverlayFilm: $('bonusOverlayFilm'),
    bonusOverlayQ: $('bonusOverlayQ'),
    playerBonusRing: $('playerBonusRing'),
    playerBonusBar: $('playerBonusBar'),
    bonusNeedPct: $('bonusNeedPct'),
    bonusForm: $('bonusForm'),
    bonusInput: $('bonusInput'),
    bonusSubmitBtn: $('bonusSubmitBtn'),
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
    blindOverlay: $('blindOverlay'),
    blindedByText: $('blindedByText'),
    wipeBlindBtn: $('wipeBlindBtn'),
    blindLeftText: $('blindLeftText'),
    flipOverlay: $('flipOverlay'),
    flippedByText: $('flippedByText'),
    repairFlipBtn: $('repairFlipBtn'),
    flipLeftText: $('flipLeftText'),
    selfieOverlay: $('selfieOverlay'),
    selfieByText: $('selfieByText'),
    selfieStepCamera: $('selfieStepCamera'),
    selfieStepWaiting: $('selfieStepWaiting'),
    selfieVideo: $('selfieVideo'),
    selfiePreviewImg: $('selfiePreviewImg'),
    selfieCamFallbackMsg: $('selfieCamFallbackMsg'),
    selfieSnapControls: $('selfieSnapControls'),
    selfieSendControls: $('selfieSendControls'),
    snapSelfieBtn: $('snapSelfieBtn'),
    selfieNativeCamBtn: $('selfieNativeCamBtn'),
    selfieFileInput: $('selfieFileInput'),
    mockSelfieBtn: $('mockSelfieBtn'),
    retakeSelfieBtn: $('retakeSelfieBtn'),
    sendSelfieBtn: $('sendSelfieBtn'),
    selfieWaitingImg: $('selfieWaitingImg'),
    changeSelfieBtn: $('changeSelfieBtn'),
    stateOverlay: $('stateOverlay'),
    stateIcon: $('stateIcon'),
    stateTitle: $('stateTitle'),
    stateDesc: $('stateDesc'),
    stateExtra: $('stateExtra')
  };

  el.loginModeBadge.innerHTML = modeBadgeHtml();
  if (initRoom) el.joinRoomInput.value = initRoom;

  // แจ้งเตือนเมื่อเปิดผ่าน LINE / In-App Browser พร้อมปุ่มเปิดออก Safari/Chrome ใน 1 แตะ
  if (isInAppBrowser() && el.lineBanner && el.openExtBrowserBtn) {
    el.openExtBrowserBtn.href = withExternalBrowser(location.href);
    el.lineBanner.classList.remove('hidden');
    el.dismissLineBanner?.addEventListener('click', () => el.lineBanner.classList.add('hidden'));
  }

  function syncMute() {
    syncVolumeControls();
    const bBtn = $('gameBgmBtn');
    const vBtn = $('gameVoiceBtn');
    if (bBtn) bBtn.style.opacity = SFX.bgmOn && !SFX.muted ? '1' : '0.45';
    if (vBtn) vBtn.style.opacity = SFX.voiceOn && !SFX.muted ? '1' : '0.45';
  }
  syncMute();
  SFX.onChange(syncMute);
  SFX.startBgm('play');
  $('gameBgmBtn')?.addEventListener('click', () => { SFX.click(); SFX.toggleBgm(); syncMute(); });
  $('gameVoiceBtn')?.addEventListener('click', () => { SFX.click(); SFX.toggleVoice(); syncMute(); });

  let selectedAv = rand(AVATARS.length);
  function renderAvatarPicker() {
    const cur = AVATARS[selectedAv] || AVATARS[0];
    el.pickedAvPreview.innerHTML = `${avatarHtml(selectedAv, 22)}<span>${esc(cur.name)}</span>`;
    el.avatarGrid.innerHTML = AVATARS.map((a, i) => `
      <button type="button" data-av="${i}" title="${esc(a.name)}" class="av-btn ${i === selectedAv ? 'selected' : ''}" style="background:${a.bg}">
        ${SQA_ART.avatarSvg(i, 54)}
      </button>
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
  let joinedRoundId = 1;
  let myLastSnapshot = null;
  let lastHealAt = 0;

  let playerMatchRemMs = 0;
  let playerMatchLastTickAt = 0;
  let playerMatchTotalSec = 0;
  let playerTimerEpoch = 0;
  let playerMatchSyncedOnce = false;

  let playerBonusDurMs = 20000;
  let playerBonusRemMs = 0;
  let playerBonusLastTickAt = 0;
  let bonusExpiredLocal = false;

  let playerFeverId = '';
  let playerFeverRemMs = 0;
  let playerFeverLastTickAt = 0;
  let lastReactAt = 0;

  function sendQuickReaction(kind) {
    const now = Date.now();
    if (now - lastReactAt < 1800) return;
    lastReactAt = now;
    const me = Sync.room && Sync.room.players[myId];
    SFX.pop();
    Sync.sendReaction(kind, me ? me.name : '');
    const map = { fire: 'reactFire', laugh: 'reactLaugh', clap: 'reactClap', shock: 'reactShock' };
    toast(`${heroIconHtml(map[kind] || 'reactFire', 22)}<span>ส่งเสียงเชียร์ขึ้นจอใหญ่ครูแล้ว!</span>`, 'info', 1400);
  }
  document.addEventListener('click', e => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-react]') : null;
    if (btn) sendQuickReaction(btn.dataset.react);
  });

  let prevScore = null;
  let prevShields = null;
  let prevZappedAt = 0;
  let wasFrozen = false;
  let iceHits = 0;
  let wasBlinded = false;
  let blindWipes = 0;
  let wasFlipped = false;
  let flipRepairs = 0;
  let wasSelfieLocked = false;
  let prevSelfieStatus = '';
  let selfieStream = null;
  let snappedSelfieDataUrl = '';
  let localSubmittedSelfieUrl = '';
  let lastRenderedCardsKey = '';
  let lastRenderedDockKey = '';
  let activeAttackKind = null;
  let currentQ = null;
  let activeBonusId = null;
  let mysteryItemPending = null;
  let mysteryOpen = false;
  let qrScanner = null;

  let lastSavedKey = '';
  function savePlayerSession(code, pid, roundId, snapshot, force = false) {
    const key = `${pid}|${roundId}|${snapshot ? (snapshot.rev || 0) : 0}|${snapshot ? (snapshot.score || 0) : 0}|${snapshot ? (snapshot.updatedAt || 0) : 0}`;
    if (!force && key === lastSavedKey) return;
    lastSavedKey = key;
    try {
      localStorage.setItem('sqa_session_' + code, JSON.stringify({
        id: pid, roundId: roundId || 1, snapshot: snapshot || null, savedAt: Date.now()
      }));
    } catch (e) {}
  }
  function handleSelfieResend() {
    if (!myId) return;
    const photo = localSubmittedSelfieUrl || (() => {
      try { return sessionStorage.getItem(`sqa_selfie_buf_${roomCode}_${myId}`) || ''; } catch (e) { return ''; }
    })();
    if (photo && Sync.room && Sync.room.players[myId] && Sync.room.players[myId].selfieLocked && Sync.room.players[myId].selfieStatus === 'pending_review') {
      Sync.sendSelfie(myId, photo);
    }
  }
  function readPlayerSession(code) {
    try {
      const raw = localStorage.getItem('sqa_session_' + code);
      if (raw) return JSON.parse(raw);
      const old = sessionStorage.getItem('sqa_pid_' + code);
      if (old) return { id: old, roundId: 1, snapshot: null };
    } catch (e) {}
    return null;
  }
  function clearPlayerSession(code) {
    try {
      if (code) {
        localStorage.removeItem('sqa_session_' + code);
        sessionStorage.removeItem('sqa_pid_' + code);
      }
    } catch (e) {}
  }

  function onPlayerConn(st) {
    if (el.playerConnDot) {
      el.playerConnDot.className = st === 'connected'
        ? 'conn-dot conn-ok'
        : (st === 'reconnecting' ? 'conn-dot conn-wait' : 'conn-dot conn-off');
    }
    if (st === 'connected' && myId) {
      Sync.setPlayerId(myId);
      handleSelfieResend();
    }
  }

  function showView(view) {
    el.loginView.classList.toggle('hidden', view !== 'login');
    el.gameView.classList.toggle('hidden', view !== 'game');
  }

  function leaveRoomToLogin(notice = '') {
    stopScanner();
    stopSelfieCamera();
    SFX.startBgm('play');
    clearPlayerSession(roomCode);
    Sync.disconnect();
    myId = null;
    myLastSnapshot = null;
    joinedRoundId = 1;
    prevScore = null;
    prevShields = null;
    prevZappedAt = 0;
    wasFrozen = false;
    wasBlinded = false;
    wasFlipped = false;
    wasSelfieLocked = false;
    prevSelfieStatus = '';
    localSubmittedSelfieUrl = '';
    lastRenderedCardsKey = '';
    lastRenderedDockKey = '';
    currentQ = null;
    activeBonusId = null;
    bonusExpiredLocal = false;
    el.iceOverlay.classList.add('hidden');
    el.blindOverlay.classList.add('hidden');
    el.flipOverlay.classList.add('hidden');
    el.selfieOverlay.classList.add('hidden');
    el.gameView.classList.remove('flipped-screen');
    el.bonusOverlay.classList.add('hidden');
    el.stateOverlay.classList.add('hidden');
    el.questionPanel.classList.add('hidden');
    el.scanPanel.classList.remove('hidden');
    el.hdrTimerBar?.classList.add('hidden');
    $('playerFeverBar')?.classList.add('hidden');
    playerFeverId = '';
    playerFeverRemMs = 0;
    playerMatchSyncedOnce = false;
    playerTimerEpoch = 0;
    showView('login');
    if (notice) toast(notice, 'info', 3200);
  }

  async function tryRestoreSession() {
    if (!initRoom) return;
    const saved = readPlayerSession(initRoom);
    if (!saved || !saved.id) return;
    // หากบันทึกไว้นานเกิน 6 ชั่วโมงแล้ว ให้ล็อกอินใหม่สะอาดๆ
    if (saved.savedAt && Date.now() - saved.savedAt > 6 * 3600 * 1000) {
      clearPlayerSession(initRoom);
      return;
    }
    try {
      const ok = await Sync.exists(initRoom);
      if (!ok) return;
      roomCode = initRoom;
      await Sync.connect(roomCode, onRoomUpdate, { isHost: false, brokerIdx, playerId: saved.id, onConn: onPlayerConn, onSelfieRequest: handleSelfieResend });
      const r = Sync.room;
      // หากห้องเล่นจบไปแล้ว หรือครูเริ่มรอบใหม่ (roundId สูงขึ้น) ให้เริ่มล็อกอินใหม่
      if (r && (r.status === 'ended' || (r.roundId || 1) > (saved.roundId || 1))) {
        leaveRoomToLogin();
        return;
      }
      if (r && r.players[saved.id]) {
        myId = saved.id;
        Sync.setPlayerId(myId);
        joinedRoundId = r.roundId || saved.roundId || 1;
        myLastSnapshot = JSON.parse(JSON.stringify(r.players[saved.id]));
        showView('game');
        applyPlayerRoomRender(r);
      } else if (saved.snapshot) {
        // กู้คืนผู้เล่นกลับเข้าห้องเดิมอัตโนมัติ (กรณีมือถือรีโหลดหน้าจาก LINE / ล็อกจอ)
        const restored = Object.assign({}, saved.snapshot, {
          roundId: (r && r.roundId) || saved.roundId || 1,
          rev: (saved.snapshot.rev || 0) + 1,
          updatedAt: Math.max((saved.snapshot.updatedAt || 0) + 1, Date.now())
        });
        await Sync.transact(room => {
          const base = room || Sync.defaultRoom(roomCode);
          if (!base.players[saved.id]) base.players[saved.id] = restored;
          return base;
        });
        myId = saved.id;
        Sync.setPlayerId(myId);
        joinedRoundId = (Sync.room && Sync.room.roundId) || 1;
        myLastSnapshot = restored;
        showView('game');
        applyPlayerRoomRender(Sync.room);
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
      myId = null;
      const newId = 'p_' + uid();
      await Sync.connect(code, onRoomUpdate, { isHost: false, brokerIdx, playerId: newId, onConn: onPlayerConn, onSelfieRequest: handleSelfieResend });
      await Sync.transact(room => {
        const base = room || Sync.defaultRoom(code);
        // ผู้เล่นจะไม่แก้ roundId หรือลบเพื่อนคนอื่นเด็ดขาด (ให้ Host เป็นผู้ควบคุมรอบเท่านั้น)
        const p = Game.newPlayer(newId, name, selectedAv, false);
        p.roundId = base.roundId || 1;
        base.players[newId] = p;
        Sync.pushFeed(base, { type: 'join', a: name, ai: newId, av: selectedAv });
        return base;
      });
      myId = newId;
      Sync.setPlayerId(myId);
      joinedRoundId = (Sync.room && Sync.room.roundId) || 1;
      myLastSnapshot = Sync.room && Sync.room.players[myId]
        ? JSON.parse(JSON.stringify(Sync.room.players[myId])) : null;
      savePlayerSession(code, myId, joinedRoundId, myLastSnapshot, true);
      SFX.join();
      showView('game');
      applyPlayerRoomRender(Sync.room);
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
    el.qHeader.style.background = c.bg;
    el.qHeader.style.color = c.text;
    el.qCodeBadge.textContent = `${c.shape} ${prettyCode(q.id)}`;
    el.qLevelBadge.textContent = `${c.name} • ${c.level}`;
    el.qPointsBadge.innerHTML = isX2
      ? `${itemIconHtml('x2', 15)}<span>${c.points * 2} แต้ม (x2!)</span>`
      : `<span>${c.points} แต้ม</span>`;
    el.qFilmBadge.style.background = f.color;
    el.qFilmBadge.innerHTML = `${filmIconHtml(q.film, 16)}<span>${esc(f.short)}</span>`;
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

  function extractCardFromQrText(decoded) {
    let extracted = decoded;
    try {
      const u = new URL(decoded);
      if (u.searchParams.get('card')) extracted = u.searchParams.get('card');
    } catch (e) {}
    return normCode(extracted);
  }

  el.openScannerBtn.addEventListener('click', async () => {
    SFX.click();
    if (!window.Html5Qrcode) {
      toast('ยังโหลดตัวสแกนไม่สำเร็จ กรุณาพิมพ์รหัสการ์ดด้านล่างแทน', 'warn');
      return;
    }
    // หากเปิดใน LINE ที่บล็อกกล้องสด ให้เปิดกล้องมือถือถ่ายภาพ QR แทนทันที!
    if (isLineBrowser()) {
      toast(`${uiIconHtml('phone', 16)}<span>เปิดผ่าน LINE — ใช้กล้องมือถือถ่ายรูป QR การ์ดได้เลย!</span>`, 'info', 2800);
      el.qrFileInput?.click();
      return;
    }
    el.scannerBox.classList.remove('hidden');
    try {
      qrScanner = new Html5Qrcode('reader');
      await qrScanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        async decoded => {
          const code = extractCardFromQrText(decoded);
          if (!code || !QUESTION_MAP[code]) return;
          await stopScanner();
          openQuestion(code);
        }
      );
    } catch (err) {
      await stopScanner();
      toast(`${uiIconHtml('camera', 16)}<span>กล้องสดถูกบล็อก — กดปุ่ม "ถ่ายรูป QR การ์ด" ด้านล่างแทนได้เลย!</span>`, 'warn', 3800);
    }
  });
  $('closeScannerBtn').addEventListener('click', () => { SFX.click(); stopScanner(); });

  // ถอดรหัส QR Code จากรูปถ่ายกล้องมือถือ (ทำงานได้ 100% แม้เปิดใน LINE!)
  el.qrFileInput?.addEventListener('change', async e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!window.Html5Qrcode) {
      toast('กรุณาพิมพ์รหัสการ์ดแทน (เช่น G-01)', 'warn');
      return;
    }
    toast(`${uiIconHtml('search', 16)}<span>กำลังอ่าน QR Code จากรูปถ่าย...</span>`, 'info', 1800);
    try {
      const reader = new Html5Qrcode('qrFileDecoder');
      const decoded = await reader.scanFile(file, false);
      try { reader.clear(); } catch (e2) {}
      const code = extractCardFromQrText(decoded);
      if (code && QUESTION_MAP[code]) {
        openQuestion(code);
      } else {
        SFX.wrong();
        toast('ไม่พบรหัสการ์ดคำถามในรูปนี้ ลองถ่ายใกล้ขึ้นอีกนิดนะ', 'error');
      }
    } catch (err) {
      SFX.wrong();
      toast('อ่าน QR จากรูปไม่สำเร็จ ลองถ่ายให้ชัดขึ้นหรือพิมพ์รหัสการ์ด (เช่น G-01)', 'warn', 3500);
    }
  });

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
      SFX.announce('gradeMiss');
      bump(el.gradeResult, 'shake');
      Sync.transact(r => { if (r) Game.resetStreak(r, myId); return r; });
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
    const streak = applied ? (applied.streak || 0) : 0;
    const streakBonus = applied ? (applied.streakBonus || 0) : 0;
    const finalItem = (applied && applied.rewardItem) || luckyItem;
    const fromStreak = !!(applied && applied.fromStreak);
    if (res.accuracy >= 80) { SFX.correct(); SFX.announce('gradePerfect'); }
    else if (res.accuracy >= 50) { SFX.partial(); SFX.announce('gradeClose'); }
    else { SFX.partial(); SFX.announce('gradePartial'); }

    el.gradeOutcomeBox.className = 'rounded-[5px] p-3 text-sm bg-[#26890c] text-white font-extrabold flex items-center justify-between gap-2';
    const streakTag = streak >= 2
      ? `<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#f97316] text-white text-[11px] font-black ml-1">${uiIconHtml('flameMini', 12, 'text-[#fde047]')} ${streak}× (+${streakBonus})</span>`
      : '';
    el.gradeOutcomeBox.innerHTML = `
      <span>ถูกต้อง! คะแนนที่ได้รับ${streakTag}</span>
      <span class="font-display text-xl font-black shrink-0">+${pts}${doubled ? ' <span class="x2tag text-xs">x2!</span>' : ''}</span>`;

    el.modelAnswerText.textContent = currentQ.model;
    el.modelAnswerBox.classList.remove('hidden');
    el.nextCardBtn.classList.remove('hidden');

    if (finalItem) {
      const boxTitle = fromStreak
        ? `คอมโบไฟลุก ${streak} ข้อติด! รับกล่องสุ่มฟรี!`
        : 'โบนัสพิเศษจากการ์ดสีแดง!';
      setTimeout(() => showMysteryBox(finalItem, boxTitle), 650);
    }
  });

  function showMysteryBox(itemKey, title) {
    mysteryItemPending = itemKey;
    mysteryOpen = true;
    el.bonusStepQ.classList.add('hidden');
    el.bonusStepBox.classList.remove('hidden');
    el.mysteryTitle.textContent = title || 'ยินดีด้วย! กดเปิดกล่องสุ่ม!';
    el.mysteryBoxVisual.innerHTML = heroIconHtml('giftBox', 124);
    el.mysteryBoxVisual.className = 'select-none cursor-pointer box-shake inline-flex items-center justify-center my-2';
    el.mysteryReward.classList.add('hidden');
    el.openMysteryBtn.classList.remove('hidden');
    el.closeMysteryBtn.classList.add('hidden');
    el.bonusOverlay.classList.remove('hidden');
  }

  function openMysteryBoxNow() {
    if (!mysteryItemPending) return;
    const it = ITEMS[mysteryItemPending];
    el.mysteryBoxVisual.className = 'select-none inline-flex items-center justify-center my-2 box-open';
    el.openMysteryBtn.classList.add('hidden');
    SFX.item();
    confetti(2000, 90);
    setTimeout(() => {
      el.mysteryBoxVisual.classList.add('hidden');
      el.rewardEmoji.style.background = it.color;
      el.rewardEmoji.innerHTML = itemIconHtml(it.key, 66);
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
    if (bonusExpiredLocal) {
      SFX.wrong();
      toast(`${uiIconHtml('clock', 16)}<span>หมดเวลาคำถามโบนัสแล้ว!</span>`, 'error');
      return;
    }
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
      showMysteryBox(reward, 'ตอบโบนัสผ่าน! เปิดกล่องสุ่มเลย!');
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
        <button data-item="${k}" class="item-btn relative py-1.5 px-1.5 flex items-center justify-center gap-1.5 text-white ${count === 0 && !isX2On ? 'empty' : 'item-owned'}"
          style="background:${it.color};box-shadow:inset 0 2px 0 rgba(255,255,255,0.22), 0 3px 0 ${it.dark}">
          ${count > 0 ? `<span class="item-badge">${count}</span>` : ''}
          <span class="w-6 h-6 rounded-[4px] bg-black/20 grid place-items-center shrink-0">${itemIconHtml(k, 20)}</span>
          <span class="text-[11px] font-display font-extrabold leading-tight truncate">${isX2On ? 'x2 เปิดอยู่!' : it.name}</span>
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
      toast(count > 0 ? `${itemIconHtml('shield', 18)}<span>มีโล่ ${count} อัน — ป้องกันการโจมตีทุกชนิดอัตโนมัติ!</span>` : 'ยังไม่มีโล่ป้องกัน (หาได้จากโบนัสหรือการ์ดแดง)', 'info');
      return;
    }
    if (count <= 0) {
      SFX.wrong();
      toast(`ยังไม่มีไอเทม ${ITEMS[kind].name} (ลุ้นจากโบนัสหรือการ์ดแดง!)`, 'warn');
      return;
    }

    if (kind === 'x2') {
      if (me.x2Active) { toast(`${itemIconHtml('x2', 18)}<span>คูณสองเปิดใช้งานอยู่แล้ว! ตอบข้อต่อไปได้เลย</span>`, 'info'); return; }
      await Sync.transact(r => { Game.useX2(r, myId); return r; });
      SFX.item();
      toast(`${itemIconHtml('x2', 18)}<span>เปิดใช้งานคูณสอง! การ์ดใบถัดไปได้ 2 เท่า</span>`, 'success');
      if (currentQ && !el.questionPanel.classList.contains('hidden')) {
        const c = COLORS[currentQ.color];
        el.qPointsBadge.innerHTML = `${itemIconHtml('x2', 15)}<span>${c.points * 2} แต้ม (x2!)</span>`;
      }
      return;
    }

    if (kind === 'boost') {
      let res = null;
      await Sync.transact(r => { res = Game.useBoost(r, myId); return r; });
      if (!res) return;
      SFX.potion();
      SFX.announce('boost', { a: me.name, pts: res.pts });
      if (currentQ && !el.questionPanel.classList.contains('hidden')) {
        const kwHints = currentQ.kw.slice(0, 2).map(g => `"${g[0]}"`).join(', ');
        el.hintBox.classList.remove('hidden');
        el.hintBox.innerHTML = `<span class="inline-flex items-center gap-1 font-bold text-[#198038]">${itemIconHtml('boost', 16)}<span>น้ำยาวิทย์ส่องพบคำสำคัญฟรี:</span></span> ลองใส่คำว่า <b>${esc(kwHints)}</b> ในคำตอบของคุณได้เลย!`;
        toast(`${itemIconHtml('boost', 18)}<span>ดื่มน้ำยาวิทย์! รับ +${res.pts} แต้ม & เปิดคำใบ้แล้ว!</span>`, 'success', 3200);
      } else {
        toast(`${itemIconHtml('boost', 18)}<span>ดื่มน้ำยาวิทย์! รับฟรี +${res.pts} แต้มทันที!</span>`, 'success');
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
    activeAttackKind = kind;
    el.targetModalTitle.innerHTML = `${itemIconHtml(kind, 24)}<span>เลือกเพื่อนที่จะใช้ "${ITEMS[kind].name}"</span>`;
    el.targetModalDesc.textContent = `${ITEMS[kind].desc} (แสดง Top 25 หรือพิมพ์ค้นหาชื่อจาก ${others.length} คน)`;
    if (el.targetSearchInput) el.targetSearchInput.value = '';

    const executeAttack = async tid => {
      const curRoom = Sync.room;
      const targetName = (curRoom && curRoom.players[tid] && curRoom.players[tid].name) || 'เพื่อน';
      el.targetModal.classList.add('hidden');
      let res = null;
      await Sync.transact(r => { res = Game.applyAttack(r, myId, tid, kind); return r; });
      if (!res) return;
      if (res.result === 'blocked') {
        SFX.block();
        SFX.announce('block', { a: me.name, b: targetName });
        toast(`${itemIconHtml('shield', 18)}<span>เพื่อนมีโล่ป้องกัน! การโจมตีถูกสกัดไว้ได้</span>`, 'warn');
      } else if (res.result === 'steal') {
        SFX.whoosh();
        SFX.announce('steal', { a: me.name, b: targetName, pts: res.amt });
        toast(`${itemIconHtml('steal', 18)}<span>ขโมยมาได้ +${res.amt} แต้ม!</span>`, 'success');
      } else if (res.result === 'zap') {
        SFX.zap();
        SFX.announce('zap', { a: me.name, b: targetName, pts: res.amt });
        toast(`${itemIconHtml('zap', 18)}<span>สายฟ้าฟาด! ลดแต้มเพื่อน -${res.amt} และเราได้ +${res.bonus} แต้ม!</span>`, 'success');
      } else if (res.result === 'blind') {
        SFX.splat();
        SFX.announce('blind', { a: me.name, b: targetName });
        toast(`${itemIconHtml('blind', 18)}<span>ปาระเบิดหมอกควันบังจอ ${esc(targetName)} แล้ว!</span>`, 'info');
      } else if (res.result === 'flip') {
        SFX.dizzy();
        SFX.announce('flip', { a: me.name, b: targetName });
        toast(`${itemIconHtml('flip', 18)}<span>ส่งไวรัสจอตีลังกา 180° ใส่ ${esc(targetName)} แล้ว!</span>`, 'warn');
      } else if (res.result === 'selfie') {
        SFX.shutter();
        SFX.announce('selfie', { a: me.name, b: targetName });
        toast(`${itemIconHtml('selfie', 18)}<span>สั่งให้ ${esc(targetName)} ถ่ายรูปหน้าตลกส่งขึ้นจอใหญ่ครูแล้ว!</span>`, 'info', 3200);
      } else {
        SFX.whoosh();
        SFX.announce('freeze', { a: me.name, b: targetName });
        toast(`${itemIconHtml('freeze', 18)}<span>ส่งพายุน้ำแข็งแช่แข็งหน้าจอ ${esc(targetName)} แล้ว!</span>`, 'ice');
      }
    };

    const renderTargetRows = () => {
      const q = (el.targetSearchInput?.value || '').trim().toLowerCase();
      const filtered = q ? others.filter(t => (t.name || '').toLowerCase().includes(q)) : others;
      const shown = filtered.slice(0, 25);
      el.targetList.innerHTML = shown.map((t, idx) => `
        <button data-target="${t.id}" class="w-full p-2.5 rounded-[6px] bg-neutral-100 hover:bg-neutral-200 border-2 border-neutral-300 hover:border-[#333] transition flex items-center justify-between gap-2 text-left">
          <div class="flex items-center gap-2.5 min-w-0">
            ${avatarHtml(t.avatar, 38)}
            <div class="min-w-0">
              <div class="font-display font-extrabold text-[#333] truncate inline-flex items-center gap-1">${!q && idx === 0 ? uiIconHtml('crownMini', 14, 'text-[#d89e00]') : ''}<span>${esc(t.name)}</span></div>
              <div class="text-xs font-bold text-neutral-500 inline-flex items-center gap-1">${t.score.toLocaleString()} แต้ม ${t.frozen ? itemIconHtml('freeze', 14) : ''} ${t.blinded ? itemIconHtml('blind', 14) : ''} ${t.flipped ? itemIconHtml('flip', 14) : ''}</div>
            </div>
          </div>
          <span class="btn-3d k-btn-red px-3 py-1.5 text-xs shrink-0">โจมตี!</span>
        </button>`).join('') || '<div class="text-center text-xs font-bold text-neutral-400 py-5">ไม่พบเพื่อนชื่อนี้</div>';
      el.targetList.querySelectorAll('[data-target]').forEach(b => {
        b.addEventListener('click', () => executeAttack(b.dataset.target));
      });
    };

    if (el.targetSearchInput) el.targetSearchInput.oninput = renderTargetRows;
    if (el.targetRandomBtn) {
      el.targetRandomBtn.onclick = () => {
        const pick = others[rand(others.length)];
        if (pick) executeAttack(pick.id);
      };
    }

    renderTargetRows();
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

  // เช็ดระเบิดหมอกควัน (6 ครั้ง)
  el.wipeBlindBtn.addEventListener('click', async () => {
    if (!wasBlinded) return;
    blindWipes++;
    const cloud = $('smokeCloud' + Math.min(6, blindWipes));
    if (cloud) { cloud.style.opacity = '0'; cloud.style.transform = 'scale(1.5)'; }
    const left = Math.max(0, Game.cfg.blindWipes - blindWipes);
    el.blindLeftText.textContent = String(left);
    SFX.click();
    bump(el.wipeBlindBtn, 'shake');

    if (blindWipes >= Game.cfg.blindWipes) {
      SFX.correct();
      el.blindOverlay.classList.add('shatter-out');
      await Sync.transact(r => { Game.unblind(r, myId); return r; });
      setTimeout(() => {
        el.blindOverlay.classList.add('hidden');
        el.blindOverlay.classList.remove('shatter-out');
        wasBlinded = false;
      }, 300);
    }
  });

  // ซ่อมหน้าจอตีลังกา 180° (4 ครั้ง)
  el.repairFlipBtn.addEventListener('click', async () => {
    if (!wasFlipped) return;
    flipRepairs++;
    const left = Math.max(0, Game.cfg.flipRepairs - flipRepairs);
    el.flipLeftText.textContent = String(left);
    SFX.click();
    bump(el.repairFlipBtn, 'shake');

    if (flipRepairs >= Game.cfg.flipRepairs) {
      SFX.correct();
      await Sync.transact(r => { Game.unflip(r, myId); return r; });
      wasFlipped = false;
      el.gameView.classList.remove('flipped-screen');
      el.flipOverlay.classList.add('hidden');
      toast(`${uiIconHtml('wrench', 16)}<span>ซ่อมหน้าจอกลับมาตั้งตรงแล้ว!</span>`, 'success');
    }
  });

  // ===================== ระบบกล้องถ่ายรูปหน้าตลก (Selfie Lock) =====================
  async function startSelfieCamera() {
    snappedSelfieDataUrl = '';
    el.selfiePreviewImg.classList.add('hidden');
    el.selfieVideo.classList.remove('hidden');
    el.selfieCamFallbackMsg?.classList.add('hidden');
    el.snapSelfieBtn.classList.remove('hidden');
    el.selfieSnapControls.classList.remove('hidden');
    el.selfieSendControls.classList.add('hidden');
    el.selfieStepWaiting.classList.add('hidden');
    el.selfieStepCamera.classList.remove('hidden');

    const activateNativeCamFallback = () => {
      el.selfieVideo.classList.add('hidden');
      el.selfieCamFallbackMsg?.classList.remove('hidden');
      el.snapSelfieBtn.classList.add('hidden');
      if (el.selfieNativeCamBtn) {
        el.selfieNativeCamBtn.className = 'btn-3d k-btn-green py-3.5 px-2 text-sm flex items-center justify-center gap-1 cursor-pointer col-span-2';
      }
    };

    if (isLineBrowser()) {
      // ใน LINE กล้องสดมักจอดำ -> สลับไปเน้นปุ่มเปิดกล้องมือถือ native ให้ใช้งานได้ทันที!
      activateNativeCamFallback();
      return;
    }

    if (selfieStream) return;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        selfieStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
          audio: false
        });
        el.selfieVideo.srcObject = selfieStream;
        if (el.selfieNativeCamBtn) {
          el.selfieNativeCamBtn.className = 'btn-3d k-btn-blue py-2.5 px-2 text-xs flex items-center justify-center gap-1 cursor-pointer';
        }
      } else {
        activateNativeCamFallback();
      }
    } catch (e) {
      activateNativeCamFallback();
    }
  }

  function stopSelfieCamera() {
    if (selfieStream) {
      try { selfieStream.getTracks().forEach(t => t.stop()); } catch (e) {}
      selfieStream = null;
    }
    if (el.selfieVideo) el.selfieVideo.srcObject = null;
  }

  function showSelfiePreview(dataUrl) {
    snappedSelfieDataUrl = dataUrl;
    el.selfiePreviewImg.src = dataUrl;
    el.selfiePreviewImg.classList.remove('hidden');
    el.selfieVideo.classList.add('hidden');
    el.selfieSnapControls.classList.add('hidden');
    el.selfieSendControls.classList.remove('hidden');
  }

  el.snapSelfieBtn.addEventListener('click', () => {
    SFX.shutter();
    const v = el.selfieVideo;
    if (!selfieStream || !v.videoWidth) {
      // กรณีเครื่องไม่มีกล้องเว็บแคม ให้สร้างภาพหน้าตลกจำลองทันที
      const me = Sync.room && Sync.room.players[myId];
      showSelfiePreview(makeFunnyFaceDataUrl(me ? me.name : 'Player', me ? me.avatar : 0));
      return;
    }
    const cv = document.createElement('canvas');
    cv.width = 360; cv.height = 360;
    const c = cv.getContext('2d');
    const vw = v.videoWidth, vh = v.videoHeight;
    const side = Math.min(vw, vh);
    const sx = (vw - side) / 2, sy = (vh - side) / 2;
    c.save();
    c.translate(360, 0);
    c.scale(-1, 1); // กลับซ้ายขวาเหมือนกระจกเซลฟี่
    c.drawImage(v, sx, sy, side, side, 0, 0, 360, 360);
    c.restore();
    // ใส่กรอบสติกเกอร์หน้าตลกเล็กน้อย
    c.fillStyle = 'rgba(0,0,0,0.55)';
    c.fillRect(0, 312, 360, 48);
    c.fillStyle = '#ffa602';
    c.font = 'bold 22px Kanit, sans-serif';
    c.textAlign = 'center';
    const me = Sync.room && Sync.room.players[myId];
    c.fillText(`หน้าตลกของ ${me ? me.name : ''}!`, 180, 343);
    showSelfiePreview(cv.toDataURL('image/jpeg', 0.65));
  });

  el.mockSelfieBtn.addEventListener('click', () => {
    SFX.shutter();
    const me = Sync.room && Sync.room.players[myId];
    showSelfiePreview(makeFunnyFaceDataUrl(me ? me.name : 'Player', me ? me.avatar : 0));
  });

  el.selfieFileInput.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = 360; cv.height = 360;
        const c = cv.getContext('2d');
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2, sy = (img.height - side) / 2;
        c.drawImage(img, sx, sy, side, side, 0, 0, 360, 360);
        SFX.shutter();
        showSelfiePreview(cv.toDataURL('image/jpeg', 0.65));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  el.retakeSelfieBtn.addEventListener('click', () => {
    SFX.click();
    startSelfieCamera();
  });

  el.changeSelfieBtn.addEventListener('click', () => {
    SFX.click();
    startSelfieCamera();
  });

  el.sendSelfieBtn.addEventListener('click', async () => {
    if (!snappedSelfieDataUrl) return;
    SFX.shutter();
    stopSelfieCamera();
    const photo = snappedSelfieDataUrl;
    localSubmittedSelfieUrl = photo;
    try { sessionStorage.setItem(`sqa_selfie_buf_${roomCode}_${myId}`, photo); } catch (e) {}
    // ส่งไฟล์รูปถ่ายตรงถึงหน้าจอครูผ่านช่อง /selfie เท่านั้น (ไม่กระจายไปโหลดบนมือถือเพื่อนอีก 199 เครื่อง!)
    Sync.sendSelfie(myId, photo);
    await Sync.transact(r => {
      if (r) Game.submitSelfie(r, myId, 'sent');
      return r;
    });
    el.selfieStepCamera.classList.add('hidden');
    el.selfieStepWaiting.classList.remove('hidden');
    el.selfieWaitingImg.src = photo;
    toast(`${itemIconHtml('selfie', 18)}<span>ส่งรูปหน้าตลกขึ้นจอใหญ่ครูแล้ว! รอครูกดอนุญาตนะ</span>`, 'info', 3200);
  });

  function renderPlayerTimers() {
    if (playerMatchTotalSec > 0 && el.hdrTimerBar && el.hdrTimer) {
      el.hdrTimerBar.classList.remove('hidden');
      el.hdrTimer.textContent = formatClock(playerMatchRemMs);
      const sec = Math.ceil(playerMatchRemMs / 1000);
      const urgent = sec <= 30 && Sync.room && Sync.room.status === 'playing';
      el.hdrTimer.classList.toggle('timer-pill-urgent', !!urgent);
      if (el.hdrTimerFill) {
        const pct = Math.max(0, Math.min(100, (playerMatchRemMs / Math.max(1000, playerMatchTotalSec * 1000)) * 100));
        el.hdrTimerFill.style.width = `${pct}%`;
        el.hdrTimerFill.style.background = urgent ? '#e21b3c' : '#ffa602';
      }
    } else if (el.hdrTimerBar) {
      el.hdrTimerBar.classList.add('hidden');
    }

    if (activeBonusId && el.playerBonusRing && el.playerBonusBar) {
      const sec = Math.max(0, Math.ceil(playerBonusRemMs / 1000));
      const pct = Math.max(0, Math.min(100, (playerBonusRemMs / Math.max(1000, playerBonusDurMs)) * 100));
      el.playerBonusRing.textContent = String(sec);
      el.playerBonusRing.classList.toggle('warn', sec <= 8 && sec > 5);
      el.playerBonusRing.classList.toggle('urgent', sec <= 5);
      el.playerBonusBar.style.width = `${pct}%`;
      el.playerBonusBar.style.background = sec <= 5 ? '#e21b3c' : (sec <= 8 ? '#d89e00' : '#46178f');

      if (playerBonusRemMs <= 0 && !bonusExpiredLocal) {
        bonusExpiredLocal = true;
        if (el.bonusSubmitBtn) {
          el.bonusSubmitBtn.disabled = true;
          el.bonusSubmitBtn.innerHTML = `${uiIconHtml('clock', 18)}<span>หมดเวลาแล้ว!</span>`;
        }
      }
    }
    const fBar = $('playerFeverBar');
    const fTxt = $('playerFeverTimer');
    if (fBar && fTxt) {
      if (playerFeverId && playerFeverRemMs > 0 && Sync.room && Sync.room.status !== 'ended') {
        fBar.classList.remove('hidden');
        fTxt.textContent = formatClock(playerFeverRemMs);
      } else {
        fBar.classList.add('hidden');
      }
    }

    const pbTimer = $('playerBossTimer');
    if (pbTimer && activeBossId && Sync.room && Sync.room.boss && Sync.room.boss.status === 'active') {
      pbTimer.textContent = formatClock(playerBossRemMs);
    }
  }

  // ===================== CO-OP BOSS RAID (ฝั่งมือถือผู้เล่น) =====================
  let activeBossId = '';
  let playerBossArtKey = '';
  let playerBossRemMs = 0;
  let playerBossLastTickAt = 0;
  let bossMinimized = false;
  let bossDismissedResultId = '';
  let bossMyLocalDmg = 0;
  let bossWaveNum = 1;
  let currentBossQ = null;
  const bossSeenQ = new Set();

  function spawnPlayerBossDmgPop(dmg, crit) {
    const sprite = $('playerBossArt');
    if (sprite) {
      sprite.classList.remove('boss-hit');
      void sprite.offsetWidth;
      sprite.classList.add('boss-hit');
    }
    const layer = $('playerBossDmgPop');
    if (!layer) return;
    const pop = document.createElement('div');
    pop.className = 'boss-dmg-pop';
    pop.innerHTML = `<div class="px-2 py-0.5 rounded-[5px] font-display font-black text-base shadow border-2 border-white ${crit ? 'bg-[#facc15] text-[#1e1b2e]' : 'bg-[#e21b3c] text-white'}">-${dmg}!${crit ? ' CRIT!' : ''}</div>`;
    layer.appendChild(pop);
    setTimeout(() => pop.remove(), 1350);
  }

  function loadNextBossWave(bossKey) {
    const q = Game.pickBossQuestion(bossKey, bossSeenQ);
    if (!q) return;
    currentBossQ = q;
    bossSeenQ.add(q.id);
    const film = FILMS[q.film] || FILMS.f1;
    const wb = $('playerBossWaveBadge');
    const fb = $('playerBossFilmBadge');
    const qt = $('playerBossQ');
    const inp = $('bossAnswerInput');
    const btn = $('bossAttackBtn');
    const resBox = $('bossHitResult');
    const nextBtn = $('bossNextWaveBtn');
    if (wb) wb.textContent = `ระลอกที่ ${bossWaveNum}`;
    if (fb) {
      fb.style.background = film.color;
      fb.innerHTML = `${filmIconHtml(q.film, 14)}<span>${esc(film.short)}</span>`;
    }
    if (qt) qt.textContent = q.q;
    if (inp) { inp.value = ''; inp.disabled = false; }
    if (btn) { btn.disabled = false; btn.classList.remove('hidden'); }
    if (resBox) resBox.classList.add('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');
  }

  $('bossMinimizeBtn')?.addEventListener('click', () => {
    SFX.click();
    bossMinimized = true;
    $('bossOverlay')?.classList.add('hidden');
    const room = Sync.room;
    if (room && room.boss && room.boss.status === 'active') {
      $('playerBossBanner')?.classList.remove('hidden');
    }
  });
  $('playerBossBanner')?.addEventListener('click', () => {
    SFX.pop();
    bossMinimized = false;
    $('playerBossBanner')?.classList.add('hidden');
    $('bossOverlay')?.classList.remove('hidden');
  });
  $('bossCloseResultBtn')?.addEventListener('click', () => {
    SFX.click();
    if (Sync.room && Sync.room.boss) bossDismissedResultId = Sync.room.boss.id;
    $('bossOverlay')?.classList.add('hidden');
    $('playerBossBanner')?.classList.add('hidden');
  });
  $('bossNextWaveBtn')?.addEventListener('click', () => {
    SFX.pop();
    const room = Sync.room;
    if (!room || !room.boss || room.boss.status !== 'active') return;
    bossWaveNum++;
    loadNextBossWave(room.boss.key);
    $('bossAnswerInput')?.focus();
  });

  $('bossAttackForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const room = Sync.room;
    const me = room && room.players[myId];
    if (!room || !me || !room.boss || room.boss.status !== 'active' || !currentBossQ) return;
    const inp = $('bossAnswerInput');
    const ans = (inp ? inp.value : '').trim();
    if (!ans) {
      SFX.wrong();
      if (inp) bump(inp, 'shake');
      toast('พิมพ์คำตอบก่อนโจมตีบอสนะ!', 'warn');
      return;
    }

    const grade = Grader.grade(ans, currentBossQ);
    const isFever = !!(room.feverId && (room.feverRemainingSec || 0) > 0);
    const hasBoost = !!(me.x2Active || isFever);
    const calc = Game.calcBossDamage(grade.accuracy, hasBoost);

    const resBox = $('bossHitResult');
    const tierEl = $('bossHitTier');
    const pctEl = $('bossHitPct');
    const barEl = $('bossHitBar');
    const kwEl = $('bossHitKw');
    const outEl = $('bossHitOutcome');
    const nextBtn = $('bossNextWaveBtn');
    const atkBtn = $('bossAttackBtn');

    if (resBox) resBox.classList.remove('hidden');
    if (tierEl) { tierEl.textContent = calc.dmg > 0 ? calc.tier : 'ป้องกันได้! ลองใหม่!'; tierEl.style.color = calc.dmg > 0 ? (calc.crit ? '#d89e00' : '#26890c') : '#e21b3c'; }
    if (pctEl) { pctEl.textContent = `${grade.accuracy}%`; pctEl.style.color = grade.color; }
    if (barEl) { barEl.style.width = `${grade.accuracy}%`; barEl.style.background = grade.color; }
    if (kwEl) {
      kwEl.innerHTML = grade.concepts.map(c => c.credit > 0
        ? `<span class="kw-chip !text-xs bg-[#26890c] text-white">✓ ${esc(c.label)}</span>`
        : `<span class="kw-chip !text-xs bg-neutral-200 text-neutral-500">○ ${esc(c.label)}</span>`
      ).join('');
    }

    if (calc.dmg <= 0) {
      SFX.wrong();
      if (outEl) {
        outEl.className = 'rounded-[5px] p-2.5 text-xs sm:text-sm bg-[#e21b3c] text-white font-extrabold';
        outEl.textContent = 'ความแม่นยำยังไม่ถึง 35% บอสบล็อกไว้ได้! ลองเติมคำสำคัญแล้วโจมตีใหม่เลย!';
      }
      return;
    }

    if (inp) inp.disabled = true;
    if (atkBtn) { atkBtn.disabled = true; atkBtn.classList.add('hidden'); }
    if (nextBtn) nextBtn.classList.remove('hidden');

    bossMyLocalDmg += calc.dmg;
    const myDmgEl = $('playerBossMyDmg');
    if (myDmgEl) myDmgEl.textContent = bossMyLocalDmg.toLocaleString();

    spawnPlayerBossDmgPop(calc.dmg, calc.crit);
    if (calc.crit) SFX.zap(); else SFX.correct();

    if (outEl) {
      outEl.className = 'rounded-[5px] p-2.5 text-sm font-extrabold flex items-center justify-between gap-2 ' + (calc.crit ? 'bg-[#d89e00] text-white' : 'bg-[#26890c] text-white');
      outEl.innerHTML = `<span>โจมตีบอสสำเร็จ! (+${calc.pts} แต้มทันที)</span><span class="font-display text-lg font-black shrink-0">-${calc.dmg} HP!</span>`;
    }

    Sync.sendBossHit({
      hitId: uid(),
      bossId: room.boss.id,
      pid: myId,
      dmg: calc.dmg,
      acc: grade.accuracy,
      crit: calc.crit,
      pts: calc.pts,
      usedX2: !!me.x2Active
    });
  });

  function renderPlayerBoss(room, me) {
    const ov = $('bossOverlay');
    const banner = $('playerBossBanner');
    if (!ov || !banner) return;
    const b = room && room.boss;
    if (!b || !b.id || room.status !== 'playing') {
      ov.classList.add('hidden');
      banner.classList.add('hidden');
      activeBossId = '';
      playerBossArtKey = '';
      bossMinimized = false;
      return;
    }

    const meta = BOSSES[b.key] || BOSSES.dr_glitch;
    const pct = Math.max(0, Math.min(100, Math.round((b.hp / Math.max(1, b.maxHp)) * 100)));
    const serverMyEntry = (b.dmgByPlayer && b.dmgByPlayer[myId]) || (b.topDmg || []).find(x => x.id === myId);
    if (serverMyEntry && serverMyEntry.dmg > bossMyLocalDmg) bossMyLocalDmg = serverMyEntry.dmg;

    if (activeBossId !== b.id) {
      activeBossId = b.id;
      bossMinimized = false;
      bossMyLocalDmg = serverMyEntry ? serverMyEntry.dmg : 0;
      bossWaveNum = 1;
      bossSeenQ.clear();
      playerBossRemMs = Math.max(0, Number(b.remainingSec ?? b.durationSec ?? 90)) * 1000;
      playerBossLastTickAt = Date.now();
      if (b.status === 'active') {
        loadNextBossWave(b.key);
        SFX.drum();
        toast(`${heroIconHtml('bossRaid', 20)}<span>บอส ${esc(meta.name)} บุกห้อง! ช่วยกันตอบคำถามปราบด่วน!</span>`, 'error', 3600);
      }
    } else if (b.status === 'active') {
      const incRem = Number(b.remainingSec ?? 0) * 1000;
      if (incRem < playerBossRemMs - 2500 || incRem > playerBossRemMs + 4500) playerBossRemMs = incRem;
    }

    const card = $('playerBossCard');
    const hdr = $('playerBossHeader');
    if (card) card.style.borderColor = b.status === 'defeated' ? '#facc15' : meta.color;
    if (hdr) hdr.style.background = `radial-gradient(circle at 25% 45%, ${meta.color}77 0%, #1c074a 60%, #10032b 100%)`;

    const artEl = $('playerBossArt');
    if (artEl && playerBossArtKey !== `${b.key}_${b.status}`) {
      playerBossArtKey = `${b.key}_${b.status}`;
      artEl.innerHTML = b.status === 'defeated'
        ? heroIconHtml('trophy', 88, 'crown-float')
        : bossArtHtml(b.key, 108);
    }

    $('playerBossName').textContent = meta.name;
    $('playerBossTitle').textContent = meta.title;
    $('playerBossHpText').textContent = `${Number(b.hp || 0).toLocaleString()} / ${Number(b.maxHp || 0).toLocaleString()}`;
    const hpFill = $('playerBossHpFill');
    if (hpFill) {
      hpFill.style.width = `${pct}%`;
      hpFill.style.setProperty('--boss-color', meta.color);
    }
    $('playerBossMyDmg').textContent = bossMyLocalDmg.toLocaleString();
    const isFever = !!(room.feverId && (room.feverRemainingSec || 0) > 0);
    $('playerBossBoostTag')?.classList.toggle('hidden', !(me.x2Active || isFever));

    $('playerBossBannerText').textContent = `${meta.name} กำลังบุก! แตะเพื่อช่วยกันตี!`;
    $('playerBossBannerHp').textContent = `${pct}% HP`;

    const fightEl = $('bossStepFight');
    const resEl = $('bossStepResult');
    if (b.status === 'active') {
      fightEl?.classList.remove('hidden');
      resEl?.classList.add('hidden');
      $('bossMinimizeBtn')?.classList.remove('hidden');
      if (bossMinimized) {
        ov.classList.add('hidden');
        banner.classList.remove('hidden');
      } else {
        banner.classList.add('hidden');
        ov.classList.remove('hidden');
      }
    } else {
      banner.classList.add('hidden');
      if (bossDismissedResultId === b.id) {
        ov.classList.add('hidden');
        return;
      }
      fightEl?.classList.add('hidden');
      resEl?.classList.remove('hidden');
      $('bossMinimizeBtn')?.classList.add('hidden');
      $('playerBossTimer').textContent = b.status === 'defeated' ? 'WIN!' : '00:00';

      const iconEl = $('bossResultIcon');
      const titleEl = $('bossResultTitle');
      const descEl = $('bossResultDesc');
      const mvpEl = $('bossResultMvp');

      if (b.status === 'defeated') {
        if (ov.classList.contains('hidden') || !ov.dataset.winConfetti || ov.dataset.winConfetti !== b.id) {
          ov.dataset.winConfetti = b.id;
          SFX.fanfare();
          confetti(2800, 120);
        }
        iconEl.innerHTML = heroIconHtml('trophy', 86, 'crown-float');
        titleEl.textContent = `ปราบ ${meta.name} สำเร็จ!`;
        const joined = bossMyLocalDmg > 0;
        const myRank = (b.topDmg || []).findIndex(x => x.id === myId);
        const mvpBonus = [200, 100, 50][myRank] || 0;
        descEl.textContent = joined
          ? `คุณทำดาเมจรวม ${bossMyLocalDmg.toLocaleString()} HP! รับโบนัสร่วมพลัง +${b.coopReward || 300} แต้ม${mvpBonus ? ` + โบนัส MVP #${myRank + 1} (+${mvpBonus} แต้ม!)` : ''} + ไอเทมสุ่ม 1 ชิ้น!`
          : `เพื่อน ๆ ในห้องร่วมพลังปราบบอสสำเร็จแล้ว! รอบหน้ามาร่วมตีชิงโบนัสกันนะ!`;
      } else {
        iconEl.innerHTML = bossArtHtml(b.key, 118);
        titleEl.textContent = 'หมดเวลา Raid! บอสหนีไปได้!';
        descEl.textContent = bossMyLocalDmg > 0
          ? `คุณช่วยทำดาเมจ ${bossMyLocalDmg.toLocaleString()} HP รับคะแนนปลอบใจ +50 แต้มแล้ว!`
          : `บอสหนีไปได้โดยเหลือเลือดอีก ${Number(b.hp || 0).toLocaleString()} HP`;
      }

      const medals = ['medal1', 'medal2', 'medal3'];
      const top3 = (b.topDmg || []).slice(0, 3);
      mvpEl.innerHTML = `<div class="text-xs font-extrabold uppercase text-neutral-500">Top 3 Boss Raid MVPs</div>` +
        (top3.length ? top3.map((m, i) => `
          <div class="flex items-center justify-between text-sm font-extrabold text-[#333]">
            <span class="inline-flex items-center gap-1.5">${heroIconHtml(medals[i] || 'trophy', 22)}<span>${esc(m.name)}</span></span>
            <span class="font-display font-black text-[#e21b3c] tabular">${Number(m.dmg || 0).toLocaleString()} DMG</span>
          </div>`).join('') : '<div class="text-xs text-neutral-500 font-bold">ไม่มีผู้ทำดาเมจในรอบนี้</div>');

      ov.classList.remove('hidden');
    }
  }

  // ตัวนับเวลาฝั่งมือถือผู้เล่น (ลื่นไหลทุก 200ms ไม่พึ่งนาฬิกาเครื่องข้ามอุปกรณ์)
  setInterval(() => {
    const room = Sync.room;
    if (!room || !myId) return;
    const now = Date.now();
    if (room.status === 'playing' && playerMatchTotalSec > 0) {
      const dt = playerMatchLastTickAt ? Math.min(1000, now - playerMatchLastTickAt) : 0;
      playerMatchLastTickAt = now;
      playerMatchRemMs = Math.max(0, playerMatchRemMs - dt);
    } else {
      playerMatchLastTickAt = now;
    }

    if (room.status === 'playing' && activeBonusId && !mysteryOpen && room.bonus && room.bonus.id === activeBonusId) {
      const dt = playerBonusLastTickAt ? Math.min(1000, now - playerBonusLastTickAt) : 0;
      playerBonusLastTickAt = now;
      playerBonusRemMs = Math.max(0, playerBonusRemMs - dt);
    } else {
      playerBonusLastTickAt = now;
    }

    if (room.status === 'playing' && playerFeverId && room.feverId === playerFeverId) {
      const dt = playerFeverLastTickAt ? Math.min(1000, now - playerFeverLastTickAt) : 0;
      playerFeverLastTickAt = now;
      playerFeverRemMs = Math.max(0, playerFeverRemMs - dt);
    } else {
      playerFeverLastTickAt = now;
    }

    if (room.status === 'playing' && activeBossId && room.boss && room.boss.id === activeBossId && room.boss.status === 'active') {
      const dt = playerBossLastTickAt ? Math.min(1000, now - playerBossLastTickAt) : 0;
      playerBossLastTickAt = now;
      playerBossRemMs = Math.max(0, playerBossRemMs - dt);
    } else {
      playerBossLastTickAt = now;
    }
    renderPlayerTimers();
  }, 200);

  let playerRafId = 0;
  let queuedPlayerRoom = null;
  function onRoomUpdate(room) {
    if (!room || !myId) return;
    queuedPlayerRoom = room;
    if (playerRafId) return;
    playerRafId = requestAnimationFrame(() => {
      playerRafId = 0;
      const r = queuedPlayerRoom;
      if (r && myId) applyPlayerRoomRender(r);
    });
  }

  function applyPlayerRoomRender(room) {
    if (!room || !myId) return;
    const me = room.players[myId];
    if (!me) {
      // เฉพาะกรณีที่ครูสั่งล้างห้อง/เริ่มรอบใหม่จริง (roundId สูงขึ้น) เท่านั้นจึงกลับหน้าล็อกอิน!
      if ((room.roundId || 1) > joinedRoundId) {
        leaveRoomToLogin(`${uiIconHtml('refresh', 16)}<span>ครูเริ่มเกมรอบใหม่แล้ว! กรุณาใส่ชื่อเข้าร่วมอีกครั้ง</span>`);
        return;
      }
      // หากอยู่รอบเดียวกันแต่แพ็กเก็ตชั่วคราวไม่มีชื่อเรา -> ซ่อมตัวเองอัตโนมัติ (ไม่เด้งออก!)
      if (myLastSnapshot && Date.now() - lastHealAt > 1500) {
        lastHealAt = Date.now();
        const backup = Object.assign({}, myLastSnapshot, {
          roundId: room.roundId || joinedRoundId,
          rev: (myLastSnapshot.rev || 0) + 1,
          updatedAt: Math.max((myLastSnapshot.updatedAt || 0) + 1, Date.now())
        });
        Sync.transact(r => {
          if (r && !r.players[myId] && (r.roundId || 1) <= joinedRoundId) {
            r.players[myId] = backup;
          }
          return r;
        });
      }
      return;
    }

    // อัปเดต snapshot และเซฟ Session ลง localStorage เฉพาะเมื่อข้อมูลเราเปลี่ยนจริง (ลดการเขียนดิสก์รัวบนมือถือ!)
    joinedRoundId = Math.max(joinedRoundId, room.roundId || 1);
    const meSig = `${me.rev || 0}|${me.hostRev || 0}|${me.score}|${me.updatedAt}`;
    if (!myLastSnapshot || myLastSnapshot._sig !== meSig) {
      myLastSnapshot = JSON.parse(JSON.stringify(me));
      myLastSnapshot._sig = meSig;
      savePlayerSession(room.code, myId, joinedRoundId, me);
    }

    // อัปเดตเวลาเกมจาก Host แบบไม่ดีดย้อนหลัง (ยึด timerEpoch และดึงลงเฉพาะตอนเวลาล้าหลัง)
    playerMatchTotalSec = Number(room.timerTotalSec || 0);
    if (playerMatchTotalSec > 0) {
      const incomingRem = Number(room.timerRemainingMs || 0);
      const incEpoch = Number(room.timerEpoch || 1);
      const epochChanged = !playerMatchSyncedOnce || incEpoch !== playerTimerEpoch;
      if (epochChanged || room.status !== 'playing') {
        playerMatchRemMs = incomingRem;
        playerTimerEpoch = incEpoch;
        playerMatchSyncedOnce = true;
      } else if (incomingRem < playerMatchRemMs - 1500 || incomingRem > playerMatchRemMs + 4500) {
        playerMatchRemMs = incomingRem;
      }
      playerMatchLastTickAt = Date.now();
    } else {
      playerMatchSyncedOnce = false;
    }

    // ซิงก์ช่วง FEVER TIME x2 จาก Host แบบไม่พึ่งนาฬิกาเครื่องข้ามอุปกรณ์
    if (room.feverId && (room.feverRemainingSec || 0) > 0 && room.status !== 'ended') {
      const incRem = Number(room.feverRemainingSec) * 1000;
      if (playerFeverId !== room.feverId) {
        playerFeverId = room.feverId;
        playerFeverRemMs = incRem;
        playerFeverLastTickAt = Date.now();
        SFX.fanfare();
        toast(`${heroIconHtml('feverBolt', 20)}<span>FEVER TIME! ตอบการ์ดได้คะแนน x2 ทั้งห้อง!</span>`, 'error', 3400);
      } else if (incRem < playerFeverRemMs - 2500 || incRem > playerFeverRemMs + 4500) {
        playerFeverRemMs = incRem;
      }
    } else {
      playerFeverId = '';
      playerFeverRemMs = 0;
    }
    renderPlayerTimers();

    const ranked = Game.ranking(room);
    const rankIdx = ranked.findIndex(p => p.id === myId);

    if (el.hdrAvatar.dataset.avIdx !== String(me.avatar)) {
      el.hdrAvatar.dataset.avIdx = String(me.avatar);
      el.hdrAvatar.innerHTML = avatarHtml(me.avatar, 36);
    }
    el.hdrName.textContent = me.name;
    el.hdrRoom.textContent = room.code;
    el.hdrRank.textContent = `#${rankIdx + 1}/${ranked.length}`;
    el.hdrScore.textContent = me.score.toLocaleString();

    if (prevScore !== null && me.score !== prevScore) {
      bump(el.hdrScore);
      if (me.score < prevScore) {
        SFX.stolen();
        toast(`${itemIconHtml('steal', 18)}<span>โดนเพื่อนลดแต้มไป ${prevScore - me.score} แต้ม!</span>`, 'error', 3200);
      }
    }
    const curShields = me.items?.shield || 0;
    if (prevShields !== null && curShields < prevShields) {
      SFX.block();
      toast(`${itemIconHtml('shield', 18)}<span>โล่ป้องกันช่วยสกัดการโจมตีของเพื่อนไว้ได้!</span>`, 'info', 3200);
    }
    prevScore = me.score;
    prevShields = curShields;

    const pills = [];
    if ((me.streak || 0) >= 2) pills.push(`<span class="px-2.5 py-1 rounded-[5px] bg-[#f97316] text-white font-extrabold text-xs inline-flex items-center gap-1 shadow">${uiIconHtml('flameMini', 14, 'text-[#fde047]')}<span>ไฟลุก! คอมโบ ${me.streak} ข้อติด</span></span>`);
    if (me.x2Active) pills.push(`<span class="px-2.5 py-1 rounded-[5px] bg-[#d89e00] text-white font-extrabold text-xs inline-flex items-center gap-1 shadow">${itemIconHtml('x2', 15)}<span>คูณสองพร้อมทำงาน (ข้อถัดไป x2)</span></span>`);
    if (curShields > 0) pills.push(`<span class="px-2.5 py-1 rounded-[5px] bg-[#1368ce] text-white font-extrabold text-xs inline-flex items-center gap-1 shadow">${itemIconHtml('shield', 15)}<span>โล่ป้องกัน x${curShields}</span></span>`);
    el.buffPills.innerHTML = pills.join('');
    el.buffPills.classList.toggle('hidden', pills.length === 0);

    const doneKeys = Object.keys(me.answered || {}).sort().join(',');
    const doneCount = Math.max(Number(me.answeredCount || 0), Object.keys(me.answered || {}).length);
    el.progressText.textContent = `${doneCount} / ${QUESTIONS.length} การ์ด`;
    if (doneKeys !== lastRenderedCardsKey) {
      lastRenderedCardsKey = doneKeys;
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
    }

    const dockKey = JSON.stringify(me.items) + '|' + (me.x2Active ? '1' : '0');
    if (dockKey !== lastRenderedDockKey) {
      lastRenderedDockKey = dockKey;
      renderItemDock(me);
    }

    if (me.frozen && room.status === 'playing' && !wasFrozen) {
      wasFrozen = true;
      iceHits = 0;
      for (let i = 1; i <= 5; i++) $('crack' + i).classList.remove('on');
      el.frozenByText.textContent = me.frozenBy || 'เพื่อน';
      el.iceLeftText.textContent = String(Game.cfg.freezeHits);
      el.iceOverlay.classList.remove('hidden', 'shatter-out');
      SFX.freeze();
      SFX.announce('freeze', { a: me.frozenBy || 'เพื่อน', b: me.name });
    } else if ((!me.frozen || room.status !== 'playing') && wasFrozen) {
      wasFrozen = false;
      el.iceOverlay.classList.add('hidden');
    }

    // ตรวจสถานะโดนระเบิดหมอกควัน
    if (me.blinded && room.status === 'playing' && !wasBlinded) {
      wasBlinded = true;
      blindWipes = 0;
      for (let i = 1; i <= 6; i++) {
        const c = $('smokeCloud' + i);
        if (c) { c.style.opacity = '0.9'; c.style.transform = 'scale(1)'; }
      }
      el.blindedByText.textContent = me.blindedBy || 'เพื่อน';
      el.blindLeftText.textContent = String(Game.cfg.blindWipes);
      el.blindOverlay.classList.remove('hidden', 'shatter-out');
      SFX.splat();
      SFX.announce('blind', { a: me.blindedBy || 'เพื่อน', b: me.name });
    } else if ((!me.blinded || room.status !== 'playing') && wasBlinded) {
      wasBlinded = false;
      el.blindOverlay.classList.add('hidden');
    }

    // ตรวจสถานะโดนไวรัสจอตีลังกา 180°
    if (me.flipped && room.status === 'playing' && !wasFlipped) {
      wasFlipped = true;
      flipRepairs = 0;
      el.flippedByText.textContent = me.flippedBy || 'เพื่อน';
      el.flipLeftText.textContent = String(Game.cfg.flipRepairs);
      el.gameView.classList.add('flipped-screen');
      el.flipOverlay.classList.remove('hidden');
      SFX.dizzy();
      SFX.announce('flip', { a: me.flippedBy || 'เพื่อน', b: me.name });
    } else if ((!me.flipped || room.status !== 'playing') && wasFlipped) {
      wasFlipped = false;
      el.gameView.classList.remove('flipped-screen');
      el.flipOverlay.classList.add('hidden');
    }

    // ตรวจสถานะโดนสั่งถ่ายรูปหน้าตลกส่งให้ครูอนุมัติ (Selfie Lock)
    if (me.selfieLocked && room.status === 'playing') {
      el.selfieByText.textContent = me.selfieFrom || 'เพื่อน';
      el.selfieOverlay.classList.remove('hidden');
      if (!wasSelfieLocked) {
        wasSelfieLocked = true;
        prevSelfieStatus = me.selfieStatus || 'waiting_photo';
        SFX.shutter();
        SFX.announce('selfie', { a: me.selfieFrom || 'เพื่อน', b: me.name });
        if (me.selfieStatus === 'pending_review') {
          stopSelfieCamera();
          el.selfieStepCamera.classList.add('hidden');
          el.selfieStepWaiting.classList.remove('hidden');
          const preview = localSubmittedSelfieUrl || (me.selfiePhoto && me.selfiePhoto.startsWith('data:') ? me.selfiePhoto : '');
          if (preview) el.selfieWaitingImg.src = preview;
        } else {
          startSelfieCamera();
        }
      } else if (me.selfieStatus !== prevSelfieStatus) {
        if (me.selfieStatus === 'pending_review') {
          stopSelfieCamera();
          el.selfieStepCamera.classList.add('hidden');
          el.selfieStepWaiting.classList.remove('hidden');
          const preview = localSubmittedSelfieUrl || (me.selfiePhoto && me.selfiePhoto.startsWith('data:') ? me.selfiePhoto : '');
          if (preview) el.selfieWaitingImg.src = preview;
        } else if (me.selfieStatus === 'waiting_photo' && prevSelfieStatus === 'pending_review') {
          SFX.wrong();
          toast(`${heroIconHtml('funnyFace', 18)}<span>ครูบอกว่ายังไม่ตลกพอ! ทำหน้าให้ฮากว่านี้แล้วถ่ายส่งใหม่!</span>`, 'error', 3600);
          startSelfieCamera();
        }
        prevSelfieStatus = me.selfieStatus;
      }
    } else if ((!me.selfieLocked || room.status !== 'playing') && wasSelfieLocked) {
      wasSelfieLocked = false;
      prevSelfieStatus = '';
      stopSelfieCamera();
      el.selfieOverlay.classList.add('hidden');
      if (room.status === 'playing') {
        SFX.correct();
        SFX.announce('selfieApproved', { a: me.name });
        toast(`${uiIconHtml('check', 16)}<span>ครูอนุญาตแล้ว! ลุยตอบคำถามต่อได้เลย!</span>`, 'success', 3200);
      }
    }

    // ตรวจสถานะโดนสายฟ้าฟาด
    if ((me.zappedAt || 0) > prevZappedAt && prevZappedAt > 0) {
      SFX.zap();
      el.gameView.classList.remove('zap-flash');
      void el.gameView.offsetWidth;
      el.gameView.classList.add('zap-flash');
      SFX.announce('zap', { a: me.zappedBy || 'เพื่อน', b: me.name, pts: Game.cfg.zapAmount });
    }
    prevZappedAt = me.zappedAt || Date.now();

    const lobbyReactBar = `
      <div class="pt-2 border-t border-neutral-200 mt-2">
        <div class="text-[11px] font-extrabold text-neutral-500 mb-1.5">ระหว่างรอ กดส่งสติกเกอร์เชียร์ขึ้นจอใหญ่ครูได้นะ!</div>
        <div class="flex items-center justify-center gap-2">
          <button type="button" data-react="fire" class="btn-3d k-btn-red w-12 h-11 grid place-items-center">${heroIconHtml('reactFire', 28)}</button>
          <button type="button" data-react="laugh" class="btn-3d k-btn-yellow w-12 h-11 grid place-items-center">${heroIconHtml('reactLaugh', 28)}</button>
          <button type="button" data-react="clap" class="btn-3d k-btn-green w-12 h-11 grid place-items-center">${heroIconHtml('reactClap', 28)}</button>
          <button type="button" data-react="shock" class="btn-3d k-btn-blue w-12 h-11 grid place-items-center">${heroIconHtml('reactShock', 28)}</button>
        </div>
      </div>`;

    if (room.status === 'lobby') {
      el.stateIcon.innerHTML = heroIconHtml('party', 80);
      el.stateTitle.textContent = "You're in! เข้าห้องแล้ว!";
      el.stateDesc.textContent = `เห็นชื่อของคุณบนหน้าจอครูไหม? รอครูกดเริ่มเกมสักครู่ (${ranked.length} คนในห้อง)`;
      el.stateExtra.innerHTML = `<div class="inline-flex items-center gap-2.5 px-4 py-2 rounded-[8px] bg-[#241f35] text-white font-black text-base shadow">${avatarHtml(me.avatar, 36)}<span>${esc(me.name)}</span></div>${lobbyReactBar}`;
      el.stateOverlay.classList.remove('hidden');
    } else if (room.status === 'paused') {
      el.stateIcon.innerHTML = heroIconHtml('pauseIcon', 76);
      el.stateTitle.textContent = 'เกมหยุดชั่วคราว';
      el.stateDesc.textContent = 'เงยหน้าดูหน้าจอครูสักครู่นะ เดี๋ยวกลับมาลุยต่อ!';
      el.stateExtra.innerHTML = lobbyReactBar;
      el.stateOverlay.classList.remove('hidden');
    } else if (room.status === 'ended') {
      clearPlayerSession(roomCode);
      const endHero = rankIdx === 0 ? 'medal1' : (rankIdx === 1 ? 'medal2' : (rankIdx === 2 ? 'medal3' : 'finishFlag'));
      el.stateIcon.innerHTML = heroIconHtml(endHero, 86);
      el.stateTitle.textContent = `ได้อันดับ #${rankIdx + 1}`;
      el.stateDesc.textContent = `คะแนนรวมของคุณคือ ${me.score.toLocaleString()} แต้ม`;
      const topMedals = ['medal1', 'medal2', 'medal3'];
      el.stateExtra.innerHTML = `
        <div class="bg-neutral-100 rounded-[6px] p-3 text-left space-y-1.5 mb-3">
          <div class="text-xs font-extrabold uppercase text-neutral-500">Podium Top 3</div>
          ${ranked.slice(0, 3).map((p, i) => `
            <div class="flex items-center justify-between text-sm font-extrabold text-[#333]">
              <span class="inline-flex items-center gap-1.5">${heroIconHtml(topMedals[i], 22)}<span>#${i + 1} ${esc(p.name)}</span></span>
              <span class="tabular">${p.score.toLocaleString()}</span>
            </div>`).join('')}
        </div>
        <button id="endLeaveBtn" type="button" class="btn-3d k-btn-green w-full py-3.5 text-base inline-flex items-center justify-center gap-2">
          ${uiIconHtml('refresh', 17)}<span>ออกจากห้อง / เล่นรอบใหม่</span>
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

    // เพลงประกอบตามสถานะเกม (เปิดเพลงทันทีตั้งแต่เข้าหน้าเว็บ/Lobby และเปลี่ยนเพลงเร้าใจเมื่อมีบอส โจทย์โบนัส หรือ Fever!)
    if (room.status === 'ended') {
      SFX.startBgm('podium');
    } else if (room.status === 'paused') {
      SFX.stopBgm();
    } else if (room.boss && room.boss.status === 'active') {
      SFX.startBgm('boss');
    } else if (room.bonus) {
      SFX.startBgm('bonus');
    } else if (room.feverId && (room.feverRemainingSec || 0) > 0) {
      SFX.startBgm('fever');
    } else {
      SFX.startBgm('play');
    }

    renderPlayerBoss(room, me);

    if (!mysteryOpen) {
      if (room.status === 'playing' && room.bonus && !(room.bonus.answered || {})[myId]) {
        const bq = BONUS_MAP[room.bonus.qid];
        if (bq && activeBonusId !== room.bonus.id) {
          activeBonusId = room.bonus.id;
          const durSec = Number(room.bonus.durationSec || bq.sec || 20);
          const remSec = Number(room.bonus.remainingSec ?? durSec);
          playerBonusDurMs = durSec * 1000;
          playerBonusRemMs = Math.min(durSec, Math.max(1, remSec)) * 1000;
          playerBonusLastTickAt = Date.now();
          bonusExpiredLocal = false;

          const f = FILMS[bq.film];
          el.bonusOverlayDurBadge.innerHTML = `${uiIconHtml('clock', 12)}<span>${durSec} วินาที</span>`;
          el.bonusOverlayFilm.innerHTML = `${filmIconHtml(bq.film, 16)}<span>${esc(f.short)}</span>`;
          el.bonusOverlayQ.textContent = bq.q;
          el.bonusNeedPct.textContent = String(Game.cfg.bonusPassThreshold);
          el.bonusInput.value = '';
          if (el.bonusSubmitBtn) {
            el.bonusSubmitBtn.disabled = false;
            el.bonusSubmitBtn.innerHTML = `${heroIconHtml('giftBox', 22)}<span>ส่งคำตอบโบนัส!</span>`;
          }
          el.bonusGradeBox.classList.add('hidden');
          el.bonusStepBox.classList.add('hidden');
          el.bonusStepQ.classList.remove('hidden');
          el.bonusOverlay.classList.remove('hidden');
          renderPlayerTimers();
          SFX.bonus();
          SFX.announce('bonus');
        }
      } else {
        activeBonusId = null;
        bonusExpiredLocal = false;
        el.bonusOverlay.classList.add('hidden');
      }
    }
  }

  refreshIcons();
  tryRestoreSession();
})();
