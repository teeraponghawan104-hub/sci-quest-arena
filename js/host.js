/* Sci-Quest! — Host Big Screen Controller (Kahoot! Edition) */
(() => {
  const qs = new URLSearchParams(location.search);
  const forceNew = qs.get('new') === '1';
  const initTeamParam = qs.get('team');
  const resolveInitialTeamMode = (fallback = true) => (initTeamParam === '0' ? false : (initTeamParam === '1' ? true : fallback));
  let roomCode = (qs.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (!roomCode) {
    roomCode = String(1000 + rand(9000));
  }
  history.replaceState(null, '', `?room=${roomCode}`);

  let activeBrokerIdx = 0;
  let joinUrl = withExternalBrowser(`${baseUrl()}player.html?room=${encodeURIComponent(roomCode)}`);
  const cardsUrl = `${baseUrl()}cards.html?room=${encodeURIComponent(roomCode)}`;

  const $ = id => document.getElementById(id);
  const el = {
    modeBadge: $('modeBadge'),
    hostConnDot: $('hostConnDot'),
    hostConnText: $('hostConnText'),
    statusBadge: $('statusBadge'),
    playerCountBadge: $('playerCountBadge'),
    matchTimeSelect: $('matchTimeSelect'),
    matchTimerPill: $('matchTimerPill'),
    roomPinText: $('roomPinText'),
    emptyPin: $('emptyPin'),
    qrPreview: $('qrPreview'),
    qrModal: $('qrModal'),
    qrModalPin: $('qrModalPin'),
    qrModalBox: $('qrModalBox'),
    qrModalUrl: $('qrModalUrl'),
    openPlayerLink: $('openPlayerLink'),
    openCardsLink: $('openCardsLink'),
    playPauseBtn: $('playPauseBtn'),
    bonusBtn: $('bonusBtn'),
    podiumBtn: $('podiumBtn'),
    addBotsBtn: $('addBotsBtn'),
    simToggleBtn: $('simToggleBtn'),
    resetBtn: $('resetBtn'),
    activeBonusBar: $('activeBonusBar'),
    hostBonusRing: $('hostBonusRing'),
    hostBonusBar: $('hostBonusBar'),
    bonusDurTag: $('bonusDurTag'),
    bonusFilmTag: $('bonusFilmTag'),
    bonusQuestionText: $('bonusQuestionText'),
    bonusWinCount: $('bonusWinCount'),
    closeBonusBtn: $('closeBonusBtn'),
    lbEmpty: $('lbEmpty'),
    lbWrap: $('lbWrap'),
    feedList: $('feedList'),
    battleBanner: $('battleBanner'),
    bonusModal: $('bonusModal'),
    bonusChoices: $('bonusChoices'),
    podiumOverlay: $('podiumOverlay'),
    podiumStage: $('podiumStage'),
    podiumRest: $('podiumRest'),
    muteBtn: $('muteBtn')
  };

  el.modeBadge.innerHTML = modeBadgeHtml();
  el.roomPinText.textContent = roomCode;
  el.emptyPin.textContent = roomCode;
  el.qrModalPin.textContent = roomCode;
  el.qrModalUrl.textContent = joinUrl;
  el.openPlayerLink.href = joinUrl;
  el.openCardsLink.href = cardsUrl;

  function renderQr(container, text, size) {
    if (window.qrcode) {
      const qr = qrcode(0, 'M');
      qr.addData(text);
      qr.make();
      container.innerHTML = qr.createSvgTag({ scalable: true, margin: 4 });
      const svg = container.querySelector('svg');
      if (svg) { svg.style.width = '100%'; svg.style.height = '100%'; svg.style.display = 'block'; }
      return;
    }
    const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=16&data=${encodeURIComponent(text)}`;
    container.innerHTML = `<img src="${src}" alt="QR ${esc(roomCode)}" class="w-full h-full object-contain"
      onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'text-xs font-extrabold text-[#333] text-center p-2',textContent:'PIN: ${esc(roomCode)}'}))">`;
  }
  function refreshJoinLinks(brokerIdx = 0) {
    activeBrokerIdx = Number(brokerIdx || 0) || 0;
    const bParam = activeBrokerIdx > 0 ? `&b=${activeBrokerIdx}` : '';
    joinUrl = withExternalBrowser(`${baseUrl()}player.html?room=${encodeURIComponent(roomCode)}${bParam}`);
    el.qrModalUrl.textContent = joinUrl;
    el.openPlayerLink.href = joinUrl;
    if (el.openCardsLink) el.openCardsLink.href = `${baseUrl()}cards.html?room=${encodeURIComponent(roomCode)}${bParam}`;
    renderQr(el.qrPreview, joinUrl, 120);
    renderQr(el.qrModalBox, joinUrl, 300);
  }
  refreshJoinLinks(0);

  function syncMute() {
    syncVolumeControls();
    const bgmBtn = $('bgmBtn');
    const voiceBtn = $('voiceBtn');
    if (bgmBtn) {
      bgmBtn.innerHTML = `${uiIconHtml('music', 15)}<span>${SFX.bgmOn && !SFX.muted ? 'เพลง: เปิด' : 'เพลง: ปิด'}</span>`;
      bgmBtn.style.opacity = SFX.bgmOn && !SFX.muted ? '1' : '0.55';
    }
    if (voiceBtn) {
      voiceBtn.innerHTML = `${uiIconHtml('mic', 15)}<span>${SFX.voiceOn && !SFX.muted ? 'พากย์: เปิด' : 'พากย์: ปิด'}</span>`;
      voiceBtn.style.opacity = SFX.voiceOn && !SFX.muted ? '1' : '0.55';
    }
  }
  syncMute();
  SFX.onChange(syncMute);
  SFX.startBgm('play');
  $('bgmBtn')?.addEventListener('click', () => { SFX.click(); SFX.toggleBgm(); syncMute(); });
  $('voiceBtn')?.addEventListener('click', () => { SFX.click(); SFX.toggleVoice(); syncMute(); });

  function copyJoinLink() {
    SFX.click();
    navigator.clipboard?.writeText(joinUrl).then(
      () => toast('คัดลอกลิงก์เข้าห้องเรียบร้อยแล้ว', 'success'),
      () => toast(`Game PIN: ${roomCode}`, 'info')
    );
  }
  $('copyLinkBtn').addEventListener('click', copyJoinLink);
  $('qrModalCopy').addEventListener('click', copyJoinLink);

  $('openQrBtn').addEventListener('click', () => { SFX.pop(); el.qrModal.classList.remove('hidden'); });
  $('closeQrModal').addEventListener('click', () => { SFX.click(); el.qrModal.classList.add('hidden'); });
  el.qrModal.addEventListener('click', e => { if (e.target === el.qrModal) el.qrModal.classList.add('hidden'); });

  const ROW_STEP = 78;
  const rowNodes = new Map();
  const prevRanks = new Map();
  const prevScores = new Map();
  const seenFeedIds = new Set();
  let initialLoad = true;
  let lastPodiumShown = false;
  let bannerTimer = null;
  let simTimer = null;

  const STATUS_UI = {
    lobby:   { text: 'LOBBY • รอเริ่มเกม',   cls: 'bg-[#ffa602] text-[#333333]' },
    playing: { text: 'LIVE • กำลังแข่งขัน!', cls: 'bg-[#26890c] text-white' },
    paused:  { text: 'PAUSED • หยุดชั่วคราว', cls: 'bg-[#1368ce] text-white' },
    ended:   { text: 'ENDED • จบเกมแล้ว',    cls: 'bg-[#e21b3c] text-white' }
  };

  function showBattleBanner(html, toneHex) {
    clearTimeout(bannerTimer);
    el.battleBanner.innerHTML = `
      <div class="pop-in px-6 py-3.5 rounded-[4px] text-white font-display font-black text-lg sm:text-xl shadow-[0_6px_0_rgba(0,0,0,0.35)] border-2 border-white flex items-center gap-3"
           style="background:${toneHex}">
        ${html}
      </div>`;
    el.battleBanner.classList.remove('hidden');
    bannerTimer = setTimeout(() => el.battleBanner.classList.add('hidden'), 3200);
  }

  const MAX_VISIBLE_ROWS = 15;
  const selfiePhotoCache = new Map();
  const lastAvatarReqAt = new Map();
  const hostAnswerStats = new Map();
  let allRanksOpen = false;
  let allTeamsOpen = false;
  let modTargetPid = null;
  let debriefOpen = false;
  let rebalancingTeams = false;
  const safeName = n => (window.NameFilter ? NameFilter.sanitize(n) : String(n || ''));

  function recordAnswerStat(stat) {
    if (!stat || !stat.qid) return;
    const qid = String(stat.qid);
    const qObj = (typeof QUESTION_MAP !== 'undefined' && QUESTION_MAP[qid]) || (typeof BONUS_MAP !== 'undefined' && BONUS_MAP[qid]) || null;
    const film = stat.film || (qObj && qObj.film) || 'f1';
    const acc = Math.max(0, Math.min(100, Math.round(Number(stat.acc || 0))));
    const pass = !!stat.pass;
    const cur = hostAnswerStats.get(qid) || { qid, film, attempts: 0, passes: 0, misses: 0, totalAcc: 0 };
    cur.attempts += 1;
    if (pass) cur.passes += 1; else cur.misses += 1;
    cur.totalAcc += acc;
    hostAnswerStats.set(qid, cur);
    if (debriefOpen) renderDebriefModal();
  }

  function renderAllRanksModal() {
    const modal = $('allRanksModal');
    if (!modal || modal.classList.contains('hidden') || !Sync.room) return;
    const all = Game.ranking(Sync.room);
    const q = ($('allRanksSearch')?.value || '').trim().toLowerCase();
    const filtered = q ? all.filter(p => (p.name || '').toLowerCase().includes(q)) : all;
    const isTeamMode = !!Sync.room.teamMode;
    $('allRanksCount').textContent = `แสดง ${filtered.length} จากผู้เข้าแข่งขันทั้งหมด ${all.length} คน (คลิก "จัดการ" เพื่อซ่อนรูป/เปลี่ยนชื่อ/เตะออก)`;
    $('allRanksList').innerHTML = filtered.map(p => {
      const rank = all.indexOf(p) + 1;
      const ansCnt = p.answeredCount ?? Object.keys(p.answered || {}).length;
      return `
        <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-[4px] bg-neutral-100 border border-neutral-200 text-sm">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-8 h-8 rounded-[4px] bg-[#333] text-white font-display font-black text-xs grid place-items-center shrink-0">#${rank}</span>
            ${avatarHtml(p.avatar, 32, '', p.photoBlocked ? '' : p.id)}
            <div class="min-w-0">
              <div class="font-display font-extrabold text-[#333] truncate flex items-center gap-1.5 flex-wrap">
                <span>${esc(safeName(p.name))}</span>
                ${isTeamMode && p.team ? teamBadgeHtml(p.team, true) : ''}
                ${p.isBot ? '<span class="text-[10px] bg-neutral-300 px-1 rounded">BOT</span>' : ''}
              </div>
              <div class="text-[11px] font-bold text-neutral-500 inline-flex items-center gap-1">${uiIconHtml('cards', 12)}<span>${ansCnt}/${QUESTIONS.length}</span></div>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="font-display font-black text-lg text-[#46178f] tabular">${p.score.toLocaleString()}</span>
            <button type="button" data-mod-pid="${esc(p.id)}" class="btn-3d k-btn-dark px-2.5 py-1 text-[11px]">จัดการ</button>
          </div>
        </div>`;
    }).join('') || '<div class="text-center text-neutral-400 font-bold py-6">ไม่พบรายชื่อที่ค้นหา</div>';
    $('allRanksList').querySelectorAll('[data-mod-pid]').forEach(btn => {
      btn.addEventListener('click', () => openModModal(btn.dataset.modPid));
    });
  }

  $('openAllRanksBtn')?.addEventListener('click', () => {
    SFX.pop();
    allRanksOpen = true;
    $('allRanksModal').classList.remove('hidden');
    renderAllRanksModal();
    setTimeout(() => $('allRanksSearch')?.focus(), 80);
  });
  $('closeAllRanksModal')?.addEventListener('click', () => {
    SFX.click();
    allRanksOpen = false;
    $('allRanksModal').classList.add('hidden');
  });
  $('allRanksModal')?.addEventListener('click', e => {
    if (e.target === $('allRanksModal')) { allRanksOpen = false; $('allRanksModal').classList.add('hidden'); }
  });
  $('allRanksSearch')?.addEventListener('input', renderAllRanksModal);

  function renderLeaderboard(room) {
    const allPlayers = Game.ranking(room);
    el.playerCountBadge.innerHTML = `${uiIconHtml('users', 16, 'text-[#ffa602]')}<span>${allPlayers.length} คน</span>`;

    if (!allPlayers.length) {
      el.lbEmpty.classList.remove('hidden');
      el.lbWrap.classList.add('hidden');
      $('lbOverflowBar')?.classList.add('hidden');
      for (const n of rowNodes.values()) n.remove();
      rowNodes.clear();
      prevRanks.clear();
      prevScores.clear();
      return;
    }

    // แสดง Top 15 แบบ Animation ลื่น 60 FPS แม้ห้องมี 200 คน!
    const players = allPlayers.slice(0, MAX_VISIBLE_ROWS);
    el.lbEmpty.classList.add('hidden');
    el.lbWrap.classList.remove('hidden');
    el.lbWrap.style.height = `${players.length * ROW_STEP}px`;

    const overflowBar = $('lbOverflowBar');
    if (overflowBar) {
      if (allPlayers.length > MAX_VISIBLE_ROWS) {
        overflowBar.classList.remove('hidden');
        $('lbOverflowText').innerHTML = `${uiIconHtml('trophyMini', 15, 'text-[#ffa602]')}<span>แสดง Top ${MAX_VISIBLE_ROWS} จากผู้เข้าแข่งขันทั้งหมด ${allPlayers.length} คน</span>`;
      } else {
        overflowBar.classList.add('hidden');
      }
    }
    if (allRanksOpen) renderAllRanksModal();

    const activeIds = new Set(players.map(p => p.id));
    for (const [id, node] of rowNodes.entries()) {
      if (!activeIds.has(id)) {
        node.remove();
        rowNodes.delete(id);
        prevRanks.delete(id);
        prevScores.delete(id);
      }
    }

    players.forEach((p, idx) => {
      const rank = idx + 1;
      let row = rowNodes.get(p.id);
      if (!row) {
        row = document.createElement('div');
        row.className = 'lb-row can-mod h-[68px] px-3.5 sm:px-4 flex items-center justify-between gap-3 bg-white text-[#333333]';
        row.title = 'คลิกเพื่อจัดการผู้เล่น (ซ่อนรูป / เปลี่ยนชื่อ / ย้ายทีม / เตะออก)';
        row.style.transform = `translateY(${idx * ROW_STEP}px)`;
        row.innerHTML = `
          <div class="flex items-center gap-3 min-w-0">
            <div data-rank class="w-10 h-10 rounded-[4px] grid place-items-center font-display font-black text-lg shrink-0 text-white"></div>
            <div data-av></div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span data-name class="font-display font-extrabold text-base sm:text-lg truncate text-[#333]"></span>
                <span data-team></span>
                <span data-bot class="hidden px-1.5 py-0.5 rounded-[3px] bg-neutral-200 text-neutral-700 text-[10px] font-black">BOT</span>
              </div>
              <div data-badges class="flex items-center gap-1.5 flex-wrap text-[11px] font-extrabold mt-0.5"></div>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div data-score class="font-display font-black text-2xl sm:text-3xl text-[#333333] tabular leading-none">0</div>
          </div>`;
        row.addEventListener('click', () => openModModal(p.id));
        el.lbWrap.appendChild(row);
        rowNodes.set(p.id, row);
      }

      row.style.transform = `translateY(${idx * ROW_STEP}px)`;
      row.style.zIndex = String(players.length - idx);

      const rankBox = row.querySelector('[data-rank]');
      row.classList.remove('medal-1', 'medal-2', 'medal-3');
      if (rank === 1) {
        row.classList.add('medal-1');
        rankBox.style.background = '#d89e00';
        rankBox.textContent = '1';
      } else if (rank === 2) {
        row.classList.add('medal-2');
        rankBox.style.background = '#1368ce';
        rankBox.textContent = '2';
      } else if (rank === 3) {
        row.classList.add('medal-3');
        rankBox.style.background = '#26890c';
        rankBox.textContent = '3';
      } else {
        rankBox.style.background = '#333333';
        rankBox.textContent = String(rank);
      }

      const avBox = row.querySelector('[data-av]');
      const hasPhot = !p.photoBlocked && SQA_PHOTOS.has(p.id);
      if (!p.photoBlocked && p.hasPhoto && !hasPhot) {
        const nowReq = Date.now();
        if (nowReq - (lastAvatarReqAt.get(p.id) || 0) > 4500) {
          lastAvatarReqAt.set(p.id, nowReq);
          Sync.requestAvatar(p.id);
        }
      }
      const avSig = `${p.avatar}_${hasPhot ? 1 : 0}_${p.photoBlocked ? 1 : 0}`;
      if (avBox.dataset.avIdx !== avSig) {
        avBox.dataset.avIdx = avSig;
        avBox.innerHTML = avatarHtml(p.avatar, 44, '', p.photoBlocked ? '' : p.id);
      }
      row.querySelector('[data-name]').textContent = safeName(p.name);
      const teamSlot = row.querySelector('[data-team]');
      if (teamSlot) {
        const tSig = room.teamMode ? (p.team || '') : '';
        if (teamSlot.dataset.t !== tSig) {
          teamSlot.dataset.t = tSig;
          teamSlot.innerHTML = tSig ? teamBadgeHtml(tSig, true) : '';
        }
      }
      row.querySelector('[data-bot]').classList.toggle('hidden', !p.isBot);

      const answeredCount = p.answeredCount ?? Object.keys(p.answered || {}).length;
      const pills = [`<span class="px-2 py-0.5 rounded-[4px] bg-neutral-200 text-[#333] inline-flex items-center gap-1">${uiIconHtml('cards', 12)}<span>${answeredCount}/${QUESTIONS.length}</span></span>`];
      if ((p.streak || 0) >= 2) pills.push(`<span class="px-2 py-0.5 rounded-[4px] bg-[#f97316] text-white inline-flex items-center gap-1 font-black">${uiIconHtml('flameMini', 13, 'text-[#fde047]')}<span>${p.streak}× คอมโบ</span></span>`);
      if (p.x2Active) pills.push(`<span class="px-2 py-0.5 rounded-[4px] bg-[#d89e00] text-white inline-flex items-center gap-1">${itemIconHtml('x2', 14)}<span>x2</span></span>`);
      if ((p.items?.shield || 0) > 0) pills.push(`<span class="px-2 py-0.5 rounded-[4px] bg-[#1368ce] text-white inline-flex items-center gap-1">${itemIconHtml('shield', 14)}<span>x${p.items.shield}</span></span>`);
      if (p.frozen) pills.push(`<span class="px-2 py-0.5 rounded-[4px] bg-[#e21b3c] text-white animate-pulse inline-flex items-center gap-1">${itemIconHtml('freeze', 14)}<span>แช่แข็ง!</span></span>`);
      if (p.blinded) pills.push(`<span class="px-2 py-0.5 rounded-[4px] bg-[#864cbf] text-white animate-pulse inline-flex items-center gap-1">${itemIconHtml('blind', 14)}<span>โดนหมอกบัง!</span></span>`);
      if (p.flipped) pills.push(`<span class="px-2 py-0.5 rounded-[4px] bg-[#e05a00] text-white animate-pulse inline-flex items-center gap-1">${itemIconHtml('flip', 14)}<span>จอตีลังกา!</span></span>`);
      if (p.selfieLocked) {
        pills.push(p.selfieStatus === 'pending_review'
          ? `<span class="px-2 py-0.5 rounded-[4px] bg-[#ffa602] text-[#333] animate-bounce inline-flex items-center gap-1">${itemIconHtml('selfie', 14)}<span>รอครูอนุมัติรูป!</span></span>`
          : `<span class="px-2 py-0.5 rounded-[4px] bg-[#c026d3] text-white animate-pulse inline-flex items-center gap-1">${itemIconHtml('selfie', 14)}<span>กำลังถ่ายหน้าตลก...</span></span>`);
      }
      row.querySelector('[data-badges]').innerHTML = pills.join('');

      const scoreEl = row.querySelector('[data-score]');
      const oldScore = prevScores.get(p.id);
      const oldRank = prevRanks.get(p.id);
      scoreEl.textContent = p.score.toLocaleString();

      if (oldScore !== undefined && p.score !== oldScore) {
        const diff = p.score - oldScore;
        bump(scoreEl);
        const bubble = document.createElement('div');
        bubble.className = 'plus-bubble';
        bubble.style.color = diff > 0 ? '#26890c' : '#e21b3c';
        bubble.textContent = `${diff > 0 ? '+' : ''}${diff}`;
        row.appendChild(bubble);
        setTimeout(() => bubble.remove(), 1400);
      }
      if (oldRank !== undefined && rank !== oldRank) {
        row.classList.remove('flash-up', 'flash-down');
        void row.offsetWidth;
        row.classList.add(rank < oldRank ? 'flash-up' : 'flash-down');
      }

      prevRanks.set(p.id, rank);
      prevScores.set(p.id, p.score);
    });
  }

  function renderFeed(room) {
    const entries = Object.values(room.feed || {}).sort((a, b) => b.t - a.t);
    if (!entries.length) {
      el.feedList.innerHTML = '<div class="text-center text-white/60 text-sm font-bold py-10">ยังไม่มีความเคลื่อนไหว...</div>';
      return;
    }

    if (initialLoad) {
      entries.forEach(e => seenFeedIds.add(e.id));
    } else {
      const fresh = entries.filter(e => !seenFeedIds.has(e.id)).reverse();
      fresh.forEach(e => seenFeedIds.add(e.id));
      // กันเสียงพากย์/SFX รัวล้นเมื่อผู้เล่น 200 คนเข้าห้องหรือตอบถูกพร้อมกัน (เล่นเฉพาะ 2 เหตุการณ์ล่าสุดต่อรอบ)
      const audioEvents = fresh.length > 4 ? fresh.slice(-2) : fresh;
      audioEvents.forEach(e => {
        const v = feedView(e);
        if (e.type === 'join') { SFX.join(); SFX.announce('join', e); }
        else if (e.type === 'score') { SFX.coin(); SFX.announce('score', e); }
        else if (e.type === 'item' || e.type === 'bonusWin') { SFX.item(); }
        else if (e.type === 'steal') { SFX.stolen(); showBattleBanner(`<span class="sqa-ico">${itemIconHtml('steal', 30)}</span><span>${v.html}</span>`, TONES.emerald); SFX.announce('steal', e); }
        else if (e.type === 'freeze') { SFX.freeze(); showBattleBanner(`<span class="sqa-ico">${itemIconHtml('freeze', 30)}</span><span>${v.html}</span>`, TONES.red); SFX.announce('freeze', e); }
        else if (e.type === 'blind') { SFX.splat(); showBattleBanner(`<span class="sqa-ico">${itemIconHtml('blind', 30)}</span><span>${v.html}</span>`, '#864cbf'); SFX.announce('blind', e); }
        else if (e.type === 'flip') { SFX.dizzy(); showBattleBanner(`<span class="sqa-ico">${itemIconHtml('flip', 30)}</span><span>${v.html}</span>`, '#e05a00'); SFX.announce('flip', e); }
        else if (e.type === 'zap') { SFX.zap(); showBattleBanner(`<span class="sqa-ico">${itemIconHtml('zap', 30)}</span><span>${v.html}</span>`, '#008299'); SFX.announce('zap', e); }
        else if (e.type === 'boost') { SFX.potion(); showBattleBanner(`<span class="sqa-ico">${itemIconHtml('boost', 30)}</span><span>${v.html}</span>`, '#198038'); SFX.announce('boost', e); }
        else if (e.type === 'selfie') { SFX.shutter(); showBattleBanner(`<span class="sqa-ico">${itemIconHtml('selfie', 30)}</span><span>${v.html}</span>`, '#c026d3'); SFX.announce('selfie', e); }
        else if (e.type === 'selfieSent') { SFX.shutter(); showBattleBanner(`<span class="sqa-ico">${heroIconHtml('funnyFace', 30)}</span><span>${v.html}</span>`, '#c026d3'); SFX.announce('selfieSent', e); }
        else if (e.type === 'selfieApproved') { SFX.correct(); SFX.announce('selfieApproved', e); }
        else if (e.type === 'selfieRejected') { SFX.wrong(); SFX.announce('selfieRejected', e); }
        else if (e.type === 'giftAll') { SFX.item(); showBattleBanner(`<span class="sqa-ico">${heroIconHtml('giftBox', 30)}</span><span>${v.html}</span>`, TONES.amber); SFX.announce('giftAll', e); }
        else if (e.type === 'fever') { SFX.fanfare(); showBattleBanner(`<span class="sqa-ico">${heroIconHtml('feverBolt', 32)}</span><span>${v.html}</span>`, TONES.red); SFX.announce('fever', e); }
        else if (e.type === 'underdog') { SFX.item(); showBattleBanner(`<span class="sqa-ico">${heroIconHtml('rocketBoost', 32)}</span><span>${v.html}</span>`, TONES.green); SFX.announce('underdog', e); }
        else if (e.type === 'freezeTop') { SFX.freeze(); showBattleBanner(`<span class="sqa-ico">${itemIconHtml('freeze', 32)}</span><span>${v.html}</span>`, TONES.cyan); SFX.announce('freezeTop', e); }
        else if (e.type === 'streak') { SFX.announce('streak', e); }
        else if (e.type === 'block') { SFX.block(); showBattleBanner(`<span class="sqa-ico">${itemIconHtml('shield', 30)}</span><span>${v.html}</span>`, TONES.blue); SFX.announce('block', e); }
        else if (e.type === 'bonus') { SFX.bonus(); showBattleBanner(`<span class="sqa-ico">${heroIconHtml('giftBox', 30)}</span><span>${v.html}</span>`, TONES.amber); SFX.announce('bonus', e); }
        else if (e.type === 'bossStart') { SFX.drum(); showBattleBanner(`<span class="sqa-ico">${heroIconHtml('bossRaid', 32)}</span><span>${v.html}</span>`, TONES.red); SFX.announce('bossStart', e); }
        else if (e.type === 'bossAttack') {
          if (e.kind === 'flip') SFX.dizzy();
          else if (e.kind === 'blind') SFX.splat();
          else if (e.kind === 'zap') SFX.zap();
          else SFX.freeze();
          showBattleBanner(`<span class="sqa-ico">${heroIconHtml('bossRaid', 32)}</span><span>${v.html}</span>`, TONES.red);
          SFX.announce('bossAttack', e);
        }
        else if (e.type === 'bossWin') { SFX.fanfare(); confetti(3200, 150); showBattleBanner(`<span class="sqa-ico">${heroIconHtml('trophy', 32)}</span><span>${v.html}</span>`, TONES.green); SFX.announce('bossWin', e); }
        else if (e.type === 'bossFail') { SFX.wrong(); showBattleBanner(`<span class="sqa-ico">${heroIconHtml('bossRaid', 32)}</span><span>${v.html}</span>`, TONES.slate); SFX.announce('bossFail', e); }
      });
    }

    el.feedList.innerHTML = entries.map(e => {
      const v = feedView(e);
      const tone = TONES[v.tone] || TONES.slate;
      const tStr = new Date(e.t).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `
        <div class="feed-in rounded-[4px] p-2.5 bg-white text-[#333333] border-l-8 flex items-start gap-2.5 text-sm shadow-[0_3px_0_rgba(0,0,0,0.22)]" style="border-color:${tone}">
          <span class="w-6 h-6 rounded-[3px] text-white text-xs font-black grid place-items-center shrink-0 mt-0.5" style="background:${tone}">${v.emoji}</span>
          <div class="flex-1 leading-snug font-medium">${v.html}</div>
          <span class="text-[10px] font-bold text-neutral-400 shrink-0 mt-0.5 tabular">${tStr}</span>
        </div>`;
    }).join('');
  }

  // ---------------- ⏱️ ระบบจับเวลาเกม + จับเวลาคำถามโบนัส (10 / 20 / 30 วิ) ----------------
  let selectedBonusSec = 'auto'; // 'auto' | 10 | 20 | 30
  let matchRemainingMs = 0;
  let matchLastTickAt = 0;
  let matchLastSyncAt = 0;
  let lastMatchBeepSec = -1;
  let matchEnding = false;

  let trackedBonusId = null;
  let bonusDurationMs = 20000;
  let bonusRemainingMs = 0;
  let bonusLastTickAt = 0;
  let bonusLastSyncAt = 0;
  let lastBonusBeepSec = -1;
  let bonusClosing = false;

  let trackedFeverId = '';
  let feverRemainingMs = 0;
  let feverLastTickAt = 0;
  let feverLastSyncAt = 0;
  let feverEnding = false;

  let trackedBossId = '';
  let trackedBossArtKey = '';
  let bossRemainingMs = 0;
  let bossLastTickAt = 0;
  let bossLastSyncAt = 0;
  let bossEnding = false;
  let bossChargeMs = 0;
  let lastBossBeepSec = -1;
  let bossAttackBusy = false;
  let lastBossHitRenderId = '';
  let lastBossAttackRenderId = '';
  let bossEnragedAnnouncedId = '';
  const seenBossHitIds = new Set();

  function triggerBossLungeVisual() {
    const sprite = $('hostBossArt');
    if (!sprite) return;
    sprite.classList.remove('boss-lunge', 'boss-hit');
    void sprite.offsetWidth;
    sprite.classList.add('boss-lunge');
  }

  async function fireBossAttackNow() {
    if (bossAttackBusy) return;
    const cur = Sync.room;
    if (!cur || !cur.boss || cur.boss.status !== 'active') return;
    bossAttackBusy = true;
    bossChargeMs = 0;
    try {
      let res = null;
      await Sync.transact(room => {
        if (!room || !room.boss || room.boss.status !== 'active') return;
        res = Game.triggerBossAttack(room);
        return room;
      });
      if (res && res.affected && res.affected.length) {
        triggerBossLungeVisual();
        res.affected.forEach(p => Sync.sendDirectPlayer(p.id, p));
      }
    } finally {
      bossAttackBusy = false;
    }
  }

  function spawnBossDmgPopup(hit) {
    const layer = $('hostBossDmgLayer');
    const sprite = $('hostBossArt');
    if (sprite) {
      sprite.classList.remove('boss-hit');
      void sprite.offsetWidth;
      sprite.classList.add('boss-hit');
    }
    if (!layer || !hit) return;
    const pop = document.createElement('div');
    pop.className = 'boss-dmg-pop';
    const xOff = 32 + Math.random() * 36;
    pop.style.left = `${xOff.toFixed(1)}%`;
    pop.innerHTML = `
      <div class="px-2.5 py-1 rounded-[6px] font-display font-black text-lg sm:text-xl shadow-lg border-2 border-white ${hit.crit ? 'bg-[#facc15] text-[#1e1b2e]' : 'bg-[#e21b3c] text-white'}">
        -${Number(hit.dmg || 0)}!${hit.crit ? ' CRIT!' : ''}
      </div>
      <div class="text-center mt-0.5">
        <span class="px-1.5 py-0.5 rounded bg-[#1e1b2e]/90 text-white font-display font-bold text-[10px]">${esc(hit.name || '')}</span>
      </div>`;
    layer.appendChild(pop);
    setTimeout(() => pop.remove(), 1400);
  }

  function renderBossStage(room) {
    const stage = $('activeBossStage');
    if (!stage) return;
    const b = room && room.boss;
    if (!b || !b.id || room.status === 'ended') {
      stage.classList.add('hidden');
      trackedBossId = '';
      trackedBossArtKey = '';
      bossRemainingMs = 0;
      bossEnding = false;
      return;
    }

    const meta = BOSSES[b.key] || BOSSES.dr_glitch;
    const film = FILMS[meta.film] || FILMS.f1;
    const pct = Math.max(0, Math.min(100, Math.round((b.hp / Math.max(1, b.maxHp)) * 100)));
    const isEnraged = b.status === 'active' && pct <= 35;

    if (trackedBossId !== b.id) {
      trackedBossId = b.id;
      bossRemainingMs = Math.max(0, Number(b.remainingSec ?? b.durationSec ?? 90)) * 1000;
      bossLastTickAt = Date.now();
      bossLastSyncAt = Date.now();
      bossEnding = b.status !== 'active';
      bossChargeMs = 0;
      lastBossBeepSec = -1;
      lastBossHitRenderId = b.lastHit ? b.lastHit.id : '';
      lastBossAttackRenderId = b.lastAttack ? b.lastAttack.id : '';
    }

    stage.style.setProperty('--boss-color', meta.color);
    stage.style.setProperty('--boss-glow', meta.color + '77');
    stage.classList.remove('hidden', 'boss-enraged', 'boss-defeated');
    if (isEnraged) {
      stage.classList.add('boss-enraged');
      if (bossEnragedAnnouncedId !== b.id) {
        bossEnragedAnnouncedId = b.id;
        SFX.announce('bossEnrage', { bossKey: b.key });
      }
    }
    if (b.status === 'defeated') stage.classList.add('boss-defeated');

    const artEl = $('hostBossArt');
    if (artEl && trackedBossArtKey !== `${b.key}_${b.status}`) {
      trackedBossArtKey = `${b.key}_${b.status}`;
      artEl.innerHTML = b.status === 'defeated'
        ? `<div class="relative flex flex-col items-center">${heroIconHtml('trophy', 124, 'crown-float')}<span class="mt-1 px-3 py-0.5 rounded-full bg-[#facc15] text-[#1e1b2e] font-display font-black text-xs shadow">DEFEATED!</span></div>`
        : bossArtHtml(b.key, 196);
    }

    if (b.lastHit && b.lastHit.id && b.lastHit.id !== lastBossHitRenderId) {
      lastBossHitRenderId = b.lastHit.id;
      spawnBossDmgPopup(b.lastHit);
      if (b.lastHit.crit) SFX.zap(); else SFX.pop();
    }
    if (b.lastAttack && b.lastAttack.id && b.lastAttack.id !== lastBossAttackRenderId) {
      lastBossAttackRenderId = b.lastAttack.id;
      triggerBossLungeVisual();
    }

    const chargeWrap = $('hostBossChargeWrap');
    const atkNowBtn = $('bossAttackNowBtn');
    const skillNameEl = $('hostBossSkillName');
    if (chargeWrap) chargeWrap.classList.toggle('hidden', b.status !== 'active');
    if (atkNowBtn) atkNowBtn.classList.toggle('hidden', b.status !== 'active');
    if (skillNameEl && meta.attack) skillNameEl.textContent = meta.attack.name;

    $('hostBossName').textContent = meta.name;
    $('hostBossTitle').textContent = meta.title;
    $('hostBossFilmTag').innerHTML = `${filmIconHtml(meta.film, 16)}<span>${esc(film.short)}</span>`;
    $('hostBossEnrageTag').classList.toggle('hidden', !isEnraged);

    const statusBadge = $('hostBossStatusBadge');
    const subtitle = $('hostBossSubtitle');
    const timerEl = $('hostBossTimer');
    const closeBtn = $('closeBossBtn');

    if (b.status === 'defeated') {
      statusBadge.style.background = '#26890c';
      statusBadge.innerHTML = `${heroIconHtml('trophy', 16)}<span>ปราบบอสสำเร็จ! VICTORY!</span>`;
      subtitle.textContent = `สุดยอดมาก! ทุกคนที่ร่วมสู้ (${b.contributorsCount || 0} คน) รับโบนัส +${b.coopReward || 300} แต้ม + ไอเทมสุ่มแล้ว! (MVP รับเพิ่มสูงสุด +200!)`;
      timerEl.textContent = 'WIN!';
      closeBtn.textContent = 'ปิดหน้าต่างชัยชนะ';
    } else if (b.status === 'escaped') {
      statusBadge.style.background = '#475569';
      statusBadge.innerHTML = `${heroIconHtml('bossRaid', 16)}<span>หมดเวลา RAID • บอสหนีไปได้!</span>`;
      subtitle.textContent = `เกือบปราบได้แล้ว! เหลือเลือดอีก ${b.hp.toLocaleString()} HP — ทุกคนที่ช่วยตีรับปลอบใจ +50 แต้มแล้ว!`;
      timerEl.textContent = '00:00';
      closeBtn.textContent = 'ปิดหน้าต่างบอส';
    } else {
      statusBadge.style.background = meta.color;
      statusBadge.innerHTML = `${heroIconHtml('bossRaid', 16)}<span>CO-OP BOSS RAID!</span>`;
      subtitle.textContent = `${meta.tagline} • ปราบได้ทั้งห้องรับ +${b.coopReward || 300} แต้ม + ไอเทม! (MVP +200!)`;
      timerEl.textContent = formatClock(bossRemainingMs);
      closeBtn.textContent = 'ปิดบอส';
    }

    $('hostBossHpText').textContent = `${Number(b.hp || 0).toLocaleString()} / ${Number(b.maxHp || 0).toLocaleString()} HP (${pct}%)`;
    $('hostBossHpFill').style.width = `${pct}%`;
    $('hostBossHitCount').textContent = `${Number(b.hitCount || 0)} ฮิต`;
    $('hostBossStats').innerHTML = `${uiIconHtml('users', 14, 'text-[#fde047]')}<span>ร่วมโจมตีแล้ว ${Number(b.contributorsCount || 0)} คน</span>`;

    const mvps = (b.topDmg || []).slice(0, 3);
    const mvpList = $('hostBossMvpList');
    const medals = ['medal1', 'medal2', 'medal3'];
    if (!mvps.length) {
      mvpList.innerHTML = '<div class="text-center text-white/60 py-3 font-bold">รอการโจมตีแรกจากนักเรียน...</div>';
    } else {
      mvpList.innerHTML = mvps.map((m, idx) => `
        <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[5px] bg-white/10 text-white">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="sqa-ico shrink-0">${heroIconHtml(medals[idx] || 'trophy', 20)}</span>
            ${avatarHtml(m.avatar, 24, '', (room.players[m.id] && room.players[m.id].photoBlocked) ? '' : m.id)}
            <span class="font-display font-extrabold truncate">${esc(safeName(m.name))}</span>
          </div>
          <span class="font-display font-black text-[#fde047] tabular shrink-0">${Number(m.dmg || 0).toLocaleString()}</span>
        </div>`).join('');
    }
  }

  function renderFeverBar(room) {
    const bar = $('activeFeverBar');
    const txt = $('hostFeverTimer');
    if (!bar || !txt) return;
    if (!room || !room.feverId || (room.feverRemainingSec || 0) <= 0 || room.status === 'ended') {
      bar.classList.add('hidden');
      trackedFeverId = '';
      feverRemainingMs = 0;
      feverEnding = false;
      return;
    }
    if (trackedFeverId !== room.feverId) {
      trackedFeverId = room.feverId;
      feverRemainingMs = Number(room.feverRemainingSec || 60) * 1000;
      feverLastTickAt = Date.now();
      feverLastSyncAt = Date.now();
      feverEnding = false;
    }
    bar.classList.remove('hidden');
    txt.textContent = formatClock(feverRemainingMs);
  }

  function renderMatchTimerUI(room) {
    const totalSec = (room && room.timerTotalSec) || 0;
    if (!totalSec) {
      el.matchTimerPill.classList.add('hidden');
      el.matchTimerPill.classList.remove('timer-pill-urgent');
      return;
    }
    el.matchTimerPill.classList.remove('hidden');
    el.matchTimerPill.innerHTML = `${uiIconHtml('clock', 16)}<span>${formatClock(matchRemainingMs)}</span>`;
    const secLeft = Math.ceil(matchRemainingMs / 1000);
    el.matchTimerPill.classList.toggle('timer-pill-urgent', secLeft <= 30 && room && room.status === 'playing');
  }

  function renderBonusTimerUI() {
    if (!trackedBonusId) return;
    const secLeft = Math.max(0, Math.ceil(bonusRemainingMs / 1000));
    const pct = Math.max(0, Math.min(100, (bonusRemainingMs / Math.max(1000, bonusDurationMs)) * 100));
    el.hostBonusRing.textContent = String(secLeft);
    el.hostBonusRing.classList.toggle('warn', secLeft <= 8 && secLeft > 5);
    el.hostBonusRing.classList.toggle('urgent', secLeft <= 5);
    el.hostBonusBar.style.width = `${pct}%`;
    el.hostBonusBar.style.background = secLeft <= 5 ? '#e21b3c' : (secLeft <= 8 ? '#d89e00' : '#46178f');
  }

  function renderBonusBar(room) {
    if (!room.bonus) {
      el.activeBonusBar.classList.add('hidden');
      trackedBonusId = null;
      bonusRemainingMs = 0;
      bonusClosing = false;
      return;
    }
    const bq = BONUS_MAP[room.bonus.qid];
    if (!bq) return;
    const film = FILMS[bq.film];
    const durSec = Number(room.bonus.durationSec || bq.sec || 20);
    if (trackedBonusId !== room.bonus.id) {
      trackedBonusId = room.bonus.id;
      bonusDurationMs = durSec * 1000;
      bonusRemainingMs = Number(room.bonus.remainingSec ?? durSec) * 1000;
      bonusLastTickAt = Date.now();
      bonusLastSyncAt = Date.now();
      lastBonusBeepSec = -1;
      bonusClosing = false;
    }
    el.activeBonusBar.classList.remove('hidden');
    el.bonusDurTag.innerHTML = `${uiIconHtml('clock', 13)}<span>${durSec} วินาที</span>`;
    el.bonusFilmTag.innerHTML = `${filmIconHtml(bq.film, 18)}<span>${esc(film.short)}</span>`;
    el.bonusQuestionText.textContent = bq.q;
    el.bonusWinCount.textContent = String(Object.keys(room.bonus.answered || {}).length);
    renderBonusTimerUI();
  }

  // ตัวนับเวลาหลักฝั่งครู (ทำงานทุก 200ms เพื่อความลื่นไหล และซิงก์ลงห้องแบบประหยัดแบนด์วิดท์)
  setInterval(async () => {
    const room = Sync.room;
    if (!room) return;
    const now = Date.now();

    // 1) นับเวลาถอยหลังของเกมหลัก
    if (room.status === 'playing' && room.timerTotalSec > 0) {
      const dt = matchLastTickAt ? Math.min(1000, now - matchLastTickAt) : 0;
      matchLastTickAt = now;
      matchRemainingMs = Math.max(0, matchRemainingMs - dt);
      renderMatchTimerUI(room);

      const secLeft = Math.ceil(matchRemainingMs / 1000);
      if (secLeft > 0 && secLeft <= 10 && secLeft !== lastMatchBeepSec) {
        lastMatchBeepSec = secLeft;
        SFX.click();
      }

      if (matchRemainingMs <= 0 && !matchEnding) {
        matchEnding = true;
        SFX.drum();
        await Sync.transact(r => {
          if (!r || r.status === 'ended') return;
          r.status = 'ended';
          r.endedAt = Date.now();
          r.timerRemainingMs = 0;
          r.timerRunning = false;
          r.bonus = null;
          r.boss = null;
          r.feverId = '';
          r.feverRemainingSec = 0;
          r.hostUpdatedAt = Date.now();
          Sync.pushFeed(r, { type: 'info', text: 'หมดเวลาการแข่งขัน! สรุปผลโพเดียม 1–2–3!' });
          return r;
        });
        toast(`${uiIconHtml('trophyMini', 16)}<span>หมดเวลาการแข่งขันแล้ว! สรุปผลผู้ชนะทันที</span>`, 'info', 4000);
        return;
      }

      // ซิงก์เวลาคงเหลือให้มือถือเด็กทุก 15 วินาที (มือถือเด็กนับเวลาเองทุก 200ms อยู่แล้ว -> ลดทราฟฟิก 3 เท่า!)
      if (now - matchLastSyncAt >= 15000) {
        matchLastSyncAt = now;
        await Sync.transact(r => {
          if (!r || r.status !== 'playing' || !r.timerTotalSec) return;
          r.timerRemainingMs = Math.round(matchRemainingMs);
          r.timerRunning = true;
          r.hostUpdatedAt = Date.now();
          return r;
        }, { deferBroadcast: true });
      }
    } else {
      matchLastTickAt = now;
    }

    // 2) นับเวลาถอยหลังของคำถามโบนัสพิเศษ (10 / 20 / 30 วิ)
    if (room.status === 'playing' && room.bonus && trackedBonusId === room.bonus.id) {
      const dt = bonusLastTickAt ? Math.min(1000, now - bonusLastTickAt) : 0;
      bonusLastTickAt = now;
      bonusRemainingMs = Math.max(0, bonusRemainingMs - dt);
      renderBonusTimerUI();

      const bSec = Math.ceil(bonusRemainingMs / 1000);
      if (bSec > 0 && bSec <= 5 && bSec !== lastBonusBeepSec) {
        lastBonusBeepSec = bSec;
        SFX.click();
      }

      if (bonusRemainingMs <= 0 && !bonusClosing) {
        bonusClosing = true;
        const winCnt = Object.keys(room.bonus.answered || {}).length;
        SFX.drum();
        await Sync.transact(r => {
          if (!r || !r.bonus || r.bonus.id !== trackedBonusId) return;
          r.bonus = null;
          r.hostUpdatedAt = Date.now();
          Sync.pushFeed(r, { type: 'info', text: `หมดเวลาคำถามโบนัส! มีผู้ตอบผ่าน ${winCnt} คน` });
          return r;
        });
        toast(`${uiIconHtml('clock', 16)}<span>หมดเวลาคำถามโบนัส! มีผู้ตอบผ่าน ${winCnt} คน</span>`, 'warn', 3200);
      } else if (now - bonusLastSyncAt >= 5000) {
        bonusLastSyncAt = now;
        await Sync.transact(r => {
          if (!r || !r.bonus || r.bonus.id !== trackedBonusId) return;
          r.bonus.remainingSec = Math.max(1, Math.ceil(bonusRemainingMs / 1000));
          r.hostUpdatedAt = Date.now();
          return r;
        }, { deferBroadcast: true });
      }
    } else {
      bonusLastTickAt = now;
    }

    // 3) นับเวลาถอยหลังของ FEVER TIME x2 ทั้งห้อง
    if (room.status === 'playing' && trackedFeverId && room.feverId === trackedFeverId) {
      const dt = feverLastTickAt ? Math.min(1000, now - feverLastTickAt) : 0;
      feverLastTickAt = now;
      feverRemainingMs = Math.max(0, feverRemainingMs - dt);
      const txt = $('hostFeverTimer');
      if (txt) txt.textContent = formatClock(feverRemainingMs);
      if (feverRemainingMs <= 0 && !feverEnding) {
        feverEnding = true;
        await Sync.transact(r => {
          if (!r || r.feverId !== trackedFeverId) return;
          r.feverId = '';
          r.feverRemainingSec = 0;
          r.hostUpdatedAt = Date.now();
          Sync.pushFeed(r, { type: 'info', text: 'จบช่วง FEVER TIME x2 แล้ว! กลับสู่คะแนนปกติ' });
          return r;
        });
        toast(`${heroIconHtml('feverBolt', 18)}<span>จบช่วง FEVER TIME x2 แล้ว!</span>`, 'info', 2500);
      } else if (now - feverLastSyncAt >= 6000) {
        feverLastSyncAt = now;
        await Sync.transact(r => {
          if (!r || r.feverId !== trackedFeverId) return;
          r.feverRemainingSec = Math.max(1, Math.ceil(feverRemainingMs / 1000));
          r.hostUpdatedAt = Date.now();
          return r;
        }, { deferBroadcast: true });
      }
    } else {
      feverLastTickAt = now;
    }

    // 4) นับเวลาถอยหลังของ Co-Op Boss Raid
    if (room.status === 'playing' && room.boss && room.boss.status === 'active' && trackedBossId === room.boss.id) {
      const dt = bossLastTickAt ? Math.min(1000, now - bossLastTickAt) : 0;
      bossLastTickAt = now;
      bossRemainingMs = Math.max(0, bossRemainingMs - dt);
      const tEl = $('hostBossTimer');
      if (tEl) tEl.textContent = formatClock(bossRemainingMs);
      const bSec = Math.ceil(bossRemainingMs / 1000);
      if (bSec > 0 && bSec <= 10 && bSec !== lastBossBeepSec) {
        lastBossBeepSec = bSec;
        SFX.click();
      }
      // ชาร์จเกจท่าไม้ตายของบอส (16 วิปกติ / 11 วิเมื่อคลั่ง HP <= 35%) -> ปล่อยโจมตีผู้เล่นอัตโนมัติ!
      if (!bossEnding && Object.keys(room.players || {}).length > 0) {
        const enraged = (room.boss.hp / Math.max(1, room.boss.maxHp)) <= 0.35;
        const chargeMax = enraged ? 11000 : 16000;
        bossChargeMs += dt;
        const cPct = Math.min(100, Math.round((bossChargeMs / chargeMax) * 100));
        const cBar = $('hostBossChargeBar');
        const cSec = $('hostBossChargeSec');
        if (cBar) cBar.style.width = `${cPct}%`;
        if (cSec) {
          const leftS = Math.max(0, Math.ceil((chargeMax - bossChargeMs) / 1000));
          cSec.textContent = leftS <= 3 ? `เตรียมปล่อยท่าไม้ตายใน ${leftS} วิ!` : `โจมตีในอีก ${leftS} วิ`;
        }
        if (bossChargeMs >= chargeMax) {
          fireBossAttackNow();
        }
      }
      if (bossRemainingMs <= 0 && !bossEnding) {
        bossEnding = true;
        SFX.wrong();
        await Sync.transact(r => {
          if (!r || !r.boss || r.boss.id !== trackedBossId || r.boss.status !== 'active') return;
          Game.resolveBossTimeout(r);
          return r;
        });
      } else if (now - bossLastSyncAt >= 5000) {
        bossLastSyncAt = now;
        await Sync.transact(r => {
          if (!r || !r.boss || r.boss.id !== trackedBossId || r.boss.status !== 'active') return;
          r.boss.remainingSec = Math.max(1, Math.ceil(bossRemainingMs / 1000));
          r.hostUpdatedAt = Date.now();
          return r;
        }, { deferBroadcast: true });
      }
    } else {
      bossLastTickAt = now;
    }
  }, 200);

  // ตั้งเวลาเกมจาก dropdown
  el.matchTimeSelect?.addEventListener('change', async () => {
    SFX.click();
    let val = el.matchTimeSelect.value;
    let totalSec = 0;
    if (val === 'custom') {
      const mins = Number(prompt('กำหนดเวลาการแข่งขันกี่นาที? (เช่น 7 หรือ 12)', '10'));
      if (!mins || mins <= 0 || mins > 180) {
        el.matchTimeSelect.value = String((Sync.room && Sync.room.timerTotalSec) || 0);
        return;
      }
      totalSec = Math.round(mins * 60);
      // เพิ่มตัวเลือก custom ชั่วคราวให้แสดงตรงใน dropdown
      let opt = el.matchTimeSelect.querySelector('option[data-custom]');
      if (!opt) {
        opt = document.createElement('option');
        opt.dataset.custom = '1';
        el.matchTimeSelect.insertBefore(opt, el.matchTimeSelect.lastElementChild);
      }
      opt.value = String(totalSec);
      opt.textContent = `${mins} นาที`;
      el.matchTimeSelect.value = String(totalSec);
    } else {
      totalSec = Number(val) || 0;
    }

    matchRemainingMs = totalSec * 1000;
    matchLastTickAt = Date.now();
    matchLastSyncAt = Date.now();
    matchEnding = false;
    lastMatchBeepSec = -1;

    await Sync.transact(room => {
      if (!room) return;
      room.timerTotalSec = totalSec;
      room.timerRemainingMs = totalSec * 1000;
      room.timerRunning = room.status === 'playing' && totalSec > 0;
      room.timerEpoch = (room.timerEpoch || 1) + 1;
      room.hostUpdatedAt = Date.now();
      return room;
    });
    renderMatchTimerUI(Sync.room);
    toast(totalSec > 0 ? `${uiIconHtml('clock', 16)}<span>ตั้งเวลาเกมเป็น ${formatClock(totalSec * 1000)} (หมดเวลาสรุปผลอัตโนมัติ)</span>` : `${uiIconHtml('clock', 16)}<span>เปลี่ยนเป็นไม่จำกัดเวลา</span>`, 'info');
  });

  let lastRenderedStatus = '';
  function renderControls(room) {
    if (room.status === lastRenderedStatus) return;
    lastRenderedStatus = room.status;
    const st = STATUS_UI[room.status] || STATUS_UI.lobby;
    el.statusBadge.textContent = st.text;
    el.statusBadge.className = `px-3 py-2 rounded-[4px] text-xs sm:text-sm font-extrabold uppercase ${st.cls}`;

    const btn = el.playPauseBtn;
    if (room.status === 'playing') {
      btn.className = 'btn-3d k-btn-blue px-4 py-2.5 text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap shrink-0';
      btn.innerHTML = `${uiIconHtml('pause', 15)}<span>หยุดเกมชั่วคราว</span>`;
    } else if (room.status === 'paused') {
      btn.className = 'btn-3d k-btn-green px-4 py-2.5 text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap shrink-0';
      btn.innerHTML = `${uiIconHtml('play', 15)}<span>เล่นต่อ!</span>`;
    } else {
      btn.className = 'btn-3d k-btn-green px-4 py-2.5 text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap shrink-0';
      btn.innerHTML = `${uiIconHtml('play', 15)}<span>เริ่มเกม!</span>`;
    }
  }

  function showPodium(room) {
    const ranked = Game.ranking(room);
    const teamSumEl = $('podiumTeamSummary');
    if (teamSumEl) {
      if (room.teamMode) {
        const tRank = Game.teamRanking(room);
        const champ = tRank[0];
        const champMembers = (champ.memberList || []).slice(0, 5).map(m => esc(safeName(m.name))).join(' • ');
        teamSumEl.classList.remove('hidden');
        teamSumEl.innerHTML = `
          <div class="rounded-[10px] p-4 border-4 border-[#fde047] shadow-2xl text-white text-left space-y-3" style="background:linear-gradient(135deg,${champ.color} 0%,${champ.dark} 100%)">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                ${heroIconHtml('trophy', 40, 'crown-float')}
                <div class="min-w-0">
                  <div class="text-[11px] font-extrabold uppercase tracking-wider text-[#fde047]">TEAM BATTLE CHAMPION • ทีมแชมป์จาก 25 ทีม!</div>
                  <div class="font-display text-2xl sm:text-3xl font-black leading-tight truncate">${champ.shape} ${esc(champ.full)}</div>
                  ${champMembers ? `<div class="text-[11px] font-bold text-white/85 truncate mt-0.5">${champMembers}</div>` : ''}
                </div>
              </div>
              <div class="bg-black/30 rounded-[8px] px-4 py-1.5 text-right shrink-0">
                <div class="font-display text-2xl sm:text-3xl font-black text-[#fde047] tabular leading-none">${champ.score.toLocaleString()}</div>
                <div class="text-[11px] font-bold text-white/85">คะแนนรวม (${champ.members}/5 คน)</div>
              </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
              ${tRank.slice(0, 5).map((t, i) => `
                <div class="rounded-[6px] px-2.5 py-2 flex items-center justify-between gap-1.5 ${i === 0 ? 'bg-white text-[#333] shadow' : 'bg-black/25 text-white'}">
                  <div class="min-w-0">
                    <div class="text-[10px] font-black opacity-75">#${i + 1} • ${t.members}/5 คน</div>
                    <div class="font-display font-black text-xs sm:text-sm truncate">${t.shape} ${esc(t.name)}</div>
                  </div>
                  <div class="font-display font-black text-sm sm:text-base tabular shrink-0">${t.score.toLocaleString()}</div>
                </div>`).join('')}
            </div>
            <div class="flex justify-end">
              <button id="podiumAllTeamsBtn" type="button" class="btn-3d k-btn-white px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5">
                ${uiIconHtml('users', 14)}<span>ดูอันดับครบทั้ง 25 ทีม</span>
              </button>
            </div>
          </div>`;
        $('podiumAllTeamsBtn')?.addEventListener('click', openAllTeamsModal);
      } else {
        teamSumEl.classList.add('hidden');
      }
    }

    const order = [1, 0, 2]; // ซ้าย #2, กลาง #1, ขวา #3
    const heights = ['h-40', 'h-56', 'h-32'];
    const nums = ['2', '1', '3'];
    const medals = ['medal2', 'medal1', 'medal3'];
    const blockColors = ['#1368ce', '#d89e00', '#26890c'];
    const delays = ['.2s', '.45s', '.05s'];

    el.podiumStage.innerHTML = order.map((rankIdx, colIdx) => {
      const p = ranked[rankIdx];
      if (!p) {
        return `<div class="flex flex-col items-center opacity-40">
          <div class="text-sm font-bold text-white mb-2">-</div>
          <div class="w-full ${heights[colIdx]} rounded-t-[8px] bg-[#25076b] grid place-items-center font-display font-black text-3xl">${nums[colIdx]}</div>
        </div>`;
      }
      const isChamp = rankIdx === 0;
      return `
        <div class="flex flex-col items-center">
          <div class="drop-in relative flex flex-col items-center mb-3" style="animation-delay:${delays[colIdx]}">
            ${isChamp ? `<div class="sunburst-halo" style="top:-62px;left:50%;margin-left:-120px;"></div>` : ''}
            ${isChamp ? `<div class="relative z-10 -mb-2.5 crown-float">${heroIconHtml('crown', 48)}</div>` : ''}
            <div class="relative z-10">${avatarHtml(p.avatar, isChamp ? 84 : 64, 'border-4 border-white', p.photoBlocked ? '' : p.id)}</div>
            <div class="relative z-10 bg-white text-[#333] px-3 py-1 rounded-[6px] font-display font-black text-base sm:text-lg mt-2 shadow inline-flex items-center gap-1.5">${esc(safeName(p.name))}${room.teamMode && p.team ? teamBadgeHtml(p.team, true) : ''}</div>
          </div>
          <div class="podium-col w-full ${heights[colIdx]} flex flex-col items-center justify-start pt-3 px-2 text-white"
               style="background:${blockColors[colIdx]};animation-delay:${delays[colIdx]}">
            <div class="mb-1 drop-shadow-[0_3px_0_rgba(0,0,0,0.28)]">${heroIconHtml(medals[colIdx], isChamp ? 58 : 48)}</div>
            <div class="font-display font-black text-lg sm:text-xl tabular">${p.score.toLocaleString()}</div>
            <div class="text-[11px] font-bold uppercase opacity-85">คะแนน</div>
          </div>
        </div>`;
    }).join('');

    const rest = ranked.slice(3, 33);
    if (rest.length) {
      el.podiumRest.classList.remove('hidden');
      const moreBtn = ranked.length > 33
        ? `<button id="podiumAllRanksBtn" type="button" class="btn-3d k-btn-white w-full mt-2 py-2 text-xs inline-flex items-center justify-center gap-1.5">${uiIconHtml('search', 14)}<span>ดูอันดับทั้งหมดครบ ${ranked.length} คน</span></button>`
        : '';
      el.podiumRest.innerHTML = `<div class="font-display font-black text-sm text-[#ffa602] mb-2 uppercase">Runner-ups (อันดับ 4–${Math.min(33, ranked.length)} จาก ${ranked.length} คน)</div>
        <div class="space-y-1.5 max-h-40 overflow-y-auto">` +
        rest.map((p, i) => `
          <div class="flex items-center justify-between text-sm bg-white text-[#333] font-bold rounded-[4px] px-3 py-1.5">
            <div class="flex items-center gap-2">
              <span class="font-black text-neutral-500">#${i + 4}</span>
              ${avatarHtml(p.avatar, 26, '', p.photoBlocked ? '' : p.id)}
              <span>${esc(safeName(p.name))}</span>
            </div>
            <span class="font-display font-black text-[#333] tabular">${p.score.toLocaleString()}</span>
          </div>`).join('') + '</div>' + moreBtn;
      $('podiumAllRanksBtn')?.addEventListener('click', () => {
        SFX.pop();
        allRanksOpen = true;
        $('allRanksModal').classList.remove('hidden');
        renderAllRanksModal();
      });
    } else {
      el.podiumRest.classList.add('hidden');
    }

    el.podiumOverlay.classList.remove('hidden');
    if (!lastPodiumShown) {
      lastPodiumShown = true;
      SFX.fanfare();
      SFX.startBgm('podium');
      const top = ranked[0];
      SFX.announce('podium', { winner: top ? top.name : '', score: top ? top.score : 0 });
      confetti(3800, 180);
    }
  }

  let currentReviewPid = null;
  const botSelfieTimers = new Set();
  const lastSelfieReqAt = new Map();

  function renderSelfieReview(room) {
    const modal = $('selfieReviewModal');
    if (!modal || room.status === 'ended') {
      modal?.classList.add('hidden');
      currentReviewPid = null;
      return;
    }

    const now = Date.now();
    // 1) หากบอทโดนสั่งถ่ายรูปหน้าตลก ให้บอทสร้างรูปส่งอัตโนมัติ
    // 2) หากผู้เล่นจริงส่งสถานะ pending_review แล้วแต่รูปตกหล่นกลางทาง (QoS 0) -> ขอส่งซ้ำอัตโนมัติ!
    for (const p of Object.values(room.players || {})) {
      if (p.isBot && p.selfieLocked && p.selfieStatus === 'waiting_photo' && !botSelfieTimers.has(p.id)) {
        botSelfieTimers.add(p.id);
        setTimeout(async () => {
          botSelfieTimers.delete(p.id);
          const photo = makeFunnyFaceDataUrl(p.name, p.avatar);
          selfiePhotoCache.set(p.id, photo);
          await Sync.transact(r => {
            if (r && r.players[p.id] && r.players[p.id].selfieLocked && r.players[p.id].selfieStatus === 'waiting_photo') {
              Game.submitSelfie(r, p.id, 'host_cached');
            }
            return r;
          });
        }, 1400);
      } else if (!p.isBot && p.selfieLocked && p.selfieStatus === 'pending_review' && !selfiePhotoCache.get(p.id) && !(p.selfiePhoto && p.selfiePhoto.startsWith('data:'))) {
        if (now - (lastSelfieReqAt.get(p.id) || 0) > 4000) {
          lastSelfieReqAt.set(p.id, now);
          Sync.requestSelfie(p.id);
        }
      }
    }

    const pending = Object.values(room.players || {}).filter(
      p => p.selfieLocked && p.selfieStatus === 'pending_review' && (selfiePhotoCache.get(p.id) || (p.selfiePhoto && p.selfiePhoto.startsWith('data:')))
    );

    if (!pending.length) {
      modal.classList.add('hidden');
      currentReviewPid = null;
      return;
    }

    const target = pending.find(p => p.id === currentReviewPid) || pending[0];
    currentReviewPid = target.id;
    const imgSrc = selfiePhotoCache.get(target.id) || target.selfiePhoto;

    $('selfieQueueBadge').textContent = `รอตรวจ 1 / ${pending.length}`;
    $('selfieReviewAvatar').innerHTML = avatarHtml(target.avatar, 54, '', target.photoBlocked ? '' : target.id);
    $('selfieReviewName').textContent = safeName(target.name);
    $('selfieReviewFrom').textContent = `โดนสั่งถ่ายหน้าตลกโดย: ${safeName(target.selfieFrom || 'เพื่อน')}`;
    $('selfieReviewImg').src = imgSrc;
    modal.classList.remove('hidden');
  }

  $('approveSelfieBtn')?.addEventListener('click', async () => {
    if (!currentReviewPid) return;
    const pid = currentReviewPid;
    selfiePhotoCache.delete(pid);
    lastSelfieReqAt.delete(pid);
    let updatedPlayer = null;
    await Sync.transact(room => {
      if (!room) return;
      Game.approveSelfie(room, pid);
      updatedPlayer = room.players[pid];
      return room;
    });
    if (updatedPlayer) Sync.sendDirectPlayer(pid, updatedPlayer);
    toast(`${uiIconHtml('check', 16)}<span>อนุญาตให้ผู้เล่นกลับเข้าเล่นต่อแล้ว!</span>`, 'success');
  });

  $('rejectSelfieBtn')?.addEventListener('click', async () => {
    if (!currentReviewPid) return;
    const pid = currentReviewPid;
    selfiePhotoCache.delete(pid);
    lastSelfieReqAt.delete(pid);
    let updatedPlayer = null;
    await Sync.transact(room => {
      if (!room) return;
      Game.rejectSelfie(room, pid);
      updatedPlayer = room.players[pid];
      return room;
    });
    if (updatedPlayer) Sync.sendDirectPlayer(pid, updatedPlayer);
    toast(`${heroIconHtml('funnyFace', 18)}<span>สั่งให้ผู้เล่นถ่ายรูปหน้าตลกส่งมาใหม่แล้ว!</span>`, 'warn');
  });

  let rafRenderId = 0;
  let queuedRoom = null;
  function onRoomUpdate(room) {
    if (!room) return;
    queuedRoom = room;
    if (rafRenderId) return;
    rafRenderId = requestAnimationFrame(() => {
      rafRenderId = 0;
      const r = queuedRoom;
      if (!r) return;
      applyRoomRender(r);
    });
  }

  // ---------------- โหมดแบ่งทีม 25 ทีม (ทีมละไม่เกิน 5 คน) ----------------
  function renderAllTeamsModal() {
    const modal = $('allTeamsModal');
    if (!modal || modal.classList.contains('hidden') || !Sync.room) return;
    const tRank = Game.teamRanking(Sync.room);
    const q = ($('allTeamsSearch')?.value || '').trim().toLowerCase();
    const filtered = q
      ? tRank.filter(t =>
          t.name.toLowerCase().includes(q) ||
          t.codename.toLowerCase().includes(q) ||
          String(t.num) === q ||
          (t.memberList || []).some(m => safeName(m.name).toLowerCase().includes(q))
        )
      : tRank;
    const activeTeams = tRank.filter(t => t.members > 0).length;
    const totalMembers = Object.keys(Sync.room.players || {}).length;
    const sub = $('allTeamsSub');
    if (sub) sub.textContent = `มีทีมที่เข้าร่วม ${activeTeams}/25 ทีม • รวม ${totalMembers}/125 คน (จำกัดทีมละไม่เกิน 5 คน • คลิกชื่อเพื่อจัดการ)`;

    const listEl = $('allTeamsList');
    if (!listEl) return;
    listEl.innerHTML = filtered.map(t => {
      const rank = tRank.indexOf(t) + 1;
      const memberHtml = (t.memberList || []).length
        ? t.memberList.map(m => `
            <button type="button" data-team-mod-pid="${esc(m.id)}" class="px-2 py-1 rounded-[4px] bg-neutral-100 hover:bg-[#ffa602]/25 border border-neutral-200 text-xs font-bold text-[#333] inline-flex items-center gap-1 max-w-full transition">
              <span class="truncate max-w-[110px]">${esc(safeName(m.name))}</span>
              <span class="font-display font-black text-[11px] text-[#46178f] tabular">${m.score.toLocaleString()}</span>
            </button>`).join('')
        : '<span class="text-[11px] font-bold text-neutral-400">ยังไม่มีสมาชิก (ว่าง 5 ที่)</span>';
      return `
        <div class="rounded-[8px] border-2 bg-white p-3 space-y-2 shadow-sm" style="border-color:${t.color}66">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="px-1.5 py-0.5 rounded-[4px] bg-[#1e1b2e] text-white font-display font-black text-[11px] shrink-0">#${rank}</span>
              <span class="px-2 py-0.5 rounded-[4px] font-display font-black text-xs text-white truncate" style="background:${t.color}">${t.shape} ${esc(t.full)}</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="px-2 py-0.5 rounded-[4px] text-[11px] font-black ${t.isFull ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-neutral-100 text-[#333]'}">${t.members}/5${t.isFull ? ' เต็ม' : ''}</span>
              <span class="font-display font-black text-base text-[#333] tabular">${t.score.toLocaleString()}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-1">${memberHtml}</div>
        </div>`;
    }).join('') || '<div class="col-span-full text-center text-neutral-400 font-bold py-6">ไม่พบทีมหรือรายชื่อที่ค้นหา</div>';

    listEl.querySelectorAll('[data-team-mod-pid]').forEach(btn => {
      btn.addEventListener('click', () => {
        allTeamsOpen = false;
        $('allTeamsModal')?.classList.add('hidden');
        openModModal(btn.dataset.teamModPid);
      });
    });
  }

  function openAllTeamsModal() {
    SFX.pop();
    allTeamsOpen = true;
    $('allTeamsModal')?.classList.remove('hidden');
    renderAllTeamsModal();
    setTimeout(() => $('allTeamsSearch')?.focus(), 80);
  }
  $('closeAllTeamsModal')?.addEventListener('click', () => { SFX.click(); allTeamsOpen = false; $('allTeamsModal')?.classList.add('hidden'); });
  $('allTeamsModal')?.addEventListener('click', e => { if (e.target === $('allTeamsModal')) { allTeamsOpen = false; $('allTeamsModal')?.classList.add('hidden'); } });
  $('allTeamsSearch')?.addEventListener('input', renderAllTeamsModal);

  function renderTeamStrip(room) {
    const strip = $('teamScoreStrip');
    const btn = $('teamModeBtn');
    const lbl = $('teamModeLabel');
    const on = !!(room && room.teamMode);
    if (btn && lbl) {
      lbl.textContent = on ? 'โหมด: 25 ทีม (≤5)' : 'โหมด: เดี่ยว';
      btn.className = `btn-3d ${on ? 'k-btn-yellow' : 'k-btn-dark'} px-3 py-2 text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap shrink-0`;
    }
    if (!strip) return;
    if (!on) {
      strip.classList.add('hidden');
      return;
    }
    strip.classList.remove('hidden');
    const tRank = Game.teamRanking(room);
    const activeTeams = tRank.filter(t => t.members > 0).length;
    const totalMembers = Object.keys(room.players || {}).length;
    const maxScore = Math.max(1, tRank[0] ? tRank[0].score : 1);
    const hasScores = tRank.some(t => t.score > 0);
    const top4Html = tRank.slice(0, 4).map((t, idx) => {
      const pct = hasScores ? Math.max(6, Math.round((t.score / maxScore) * 100)) : 0;
      const isLead = idx === 0 && t.score > 0;
      const topTxt = t.topPlayer ? `MVP: ${esc(safeName(t.topPlayer.name))}` : 'รอสมาชิกเข้าทีม';
      return `
        <div class="team-strip-card ${isLead ? 'team-leader' : ''} p-3 text-white relative overflow-hidden" style="background:linear-gradient(155deg,${t.color} 0%,${t.dark} 100%)">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="px-1.5 py-0.5 rounded-[4px] bg-black/30 font-display font-black text-[11px]">#${idx + 1}</span>
                <span class="font-display font-black text-base sm:text-lg truncate">${t.shape} ${esc(t.name)}</span>
                ${isLead ? uiIconHtml('crownMini', 15, 'text-[#fde047] shrink-0') : ''}
              </div>
              <div class="text-[11px] font-bold text-white/85 truncate mt-0.5">${t.members}/5 คน • ${topTxt}</div>
            </div>
            <div class="text-right shrink-0">
              <div class="font-display font-black text-2xl sm:text-3xl leading-none tabular">${t.score.toLocaleString()}</div>
              <div class="text-[10px] font-bold text-white/75 uppercase">แต้มรวม</div>
            </div>
          </div>
          <div class="w-full h-2 rounded-full bg-black/30 overflow-hidden mt-2.5">
            <div class="h-full rounded-full bg-white/90 transition-all duration-500" style="width:${pct}%"></div>
          </div>
        </div>`;
    }).join('');

    const byKey = {};
    tRank.forEach(t => { byKey[t.key] = t; });
    const matrixHtml = TEAM_KEYS.map(k => {
      const t = byKey[k];
      const active = t.members > 0;
      return `
        <button type="button" data-open-teams class="rounded-[5px] px-2 py-1.5 text-left transition flex items-center justify-between gap-1 text-white ${active ? 'hover:brightness-110' : 'opacity-45 hover:opacity-80'}" style="background:${t.color};box-shadow:0 2px 0 ${t.dark}">
          <span class="font-display font-black text-[11px] truncate">${t.shape} ${t.num}</span>
          <span class="text-[10px] font-extrabold tabular shrink-0">${t.members}/5${t.score > 0 ? ` • ${t.score}` : ''}</span>
        </button>`;
    }).join('');

    strip.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="px-2.5 py-1 rounded-[5px] bg-[#ffa602] text-[#1e1b2e] font-display font-black text-xs uppercase inline-flex items-center gap-1.5">
            ${uiIconHtml('users', 14)}<span>TEAM BATTLE • 25 ทีม (ทีมละไม่เกิน 5 คน)</span>
          </span>
          <span class="text-xs font-extrabold text-white/85">เข้าร่วมแล้ว ${activeTeams}/25 ทีม • รวม ${totalMembers}/125 คน</span>
        </div>
        <button id="openAllTeamsBtn" type="button" class="btn-3d k-btn-white px-3 py-1.5 text-xs inline-flex items-center gap-1.5 whitespace-nowrap">
          ${uiIconHtml('search', 13)}<span>ดูครบทั้ง 25 ทีม / สมาชิก</span>
        </button>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5">${top4Html}</div>
      <div class="grid grid-cols-5 gap-1.5">${matrixHtml}</div>`;

    $('openAllTeamsBtn')?.addEventListener('click', openAllTeamsModal);
    strip.querySelectorAll('[data-open-teams]').forEach(b => b.addEventListener('click', openAllTeamsModal));
    if (allTeamsOpen) renderAllTeamsModal();
  }

  $('teamModeBtn')?.addEventListener('click', async () => {
    SFX.pop();
    const cur = Sync.room;
    const nextOn = !(cur && cur.teamMode);
    let res = { ok: true, updated: [] };
    await Sync.transact(room => {
      if (!room) return;
      res = Game.enableTeamMode(room, nextOn);
      if (!res.ok) return undefined;
      return room;
    });
    if (!res.ok && res.reason === 'too_many_players') {
      SFX.wrong();
      toast('มีผู้เล่นเกิน 125 คน (25 ทีม × 5 คน) กรุณาใช้โหมดเดี่ยวหรือลดจำนวนบอทก่อน', 'error', 4000);
      return;
    }
    const assigned = res.updated || [];
    if (assigned.length && assigned.length <= 40) {
      assigned.forEach(p => Sync.sendDirectPlayer(p.id, p));
    }
    toast(
      nextOn
        ? `${uiIconHtml('users', 16)}<span>เปิดโหมดแบ่งทีม 25 ทีม (ทีมละไม่เกิน 5 คน) แล้ว!</span>`
        : `${uiIconHtml('users', 16)}<span>สลับกลับเป็นโหมดแข่งเดี่ยวเรียบร้อย</span>`,
      'success'
    );
  });

  // ---------------- ปุ่มคุมห้องสำหรับครู (Teacher Moderation Modal) ----------------
  function refreshModModal() {
    const modal = $('modModal');
    if (!modal || modal.classList.contains('hidden') || !modTargetPid || !Sync.room) return;
    const p = Sync.room.players[modTargetPid];
    if (!p) {
      modal.classList.add('hidden');
      modTargetPid = null;
      return;
    }
    $('modPlayerAvatar').innerHTML = avatarHtml(p.avatar, 52, '', p.photoBlocked ? '' : p.id);
    $('modPlayerName').textContent = safeName(p.name);
    $('modPlayerTeamPill').innerHTML = Sync.room.teamMode && p.team ? teamBadgeHtml(p.team, true) : '';
    const ansCnt = p.answeredCount ?? Object.keys(p.answered || {}).length;
    const photStatus = p.photoBlocked ? 'ถูกซ่อนรูป' : (SQA_PHOTOS.has(p.id) || p.hasPhoto ? 'ใช้รูปตัวเอง' : 'มาสคอต');
    $('modPlayerMeta').textContent = `${p.score.toLocaleString()} แต้ม • ${ansCnt}/${QUESTIONS.length} การ์ด • โปรไฟล์: ${photStatus}`;

    const hideLbl = $('modHidePhotoLabel');
    const hideBtn = $('modHidePhotoBtn');
    if (hideLbl && hideBtn) {
      hideLbl.textContent = p.photoBlocked ? 'อนุญาตให้ใช้รูปโปรไฟล์อีกครั้ง' : 'ซ่อนรูป (สลับกลับเป็นมาสคอต)';
      hideBtn.className = `btn-3d ${p.photoBlocked ? 'k-btn-green' : 'k-btn-yellow'} flex-1 py-2.5 text-xs sm:text-sm inline-flex items-center justify-center gap-1.5`;
    }

    const teamWrap = $('modTeamWrap');
    const teamGrid = $('modTeamGrid');
    if (teamWrap && teamGrid) {
      if (Sync.room.teamMode) {
        teamWrap.classList.remove('hidden');
        const counts = Game.teamCounts(Sync.room, p.id);
        const cap = Game.MAX_TEAM_SIZE || 5;
        teamGrid.innerHTML = TEAM_KEYS.map(k => {
          const t = TEAMS[k];
          const active = p.team === k;
          const cnt = counts[k] || 0;
          const full = !active && cnt >= cap;
          const shownCnt = active ? cnt + 1 : cnt;
          return `<button type="button" data-mod-team="${k}" ${full ? 'disabled title="ทีมนี้เต็ม 5/5 คนแล้ว"' : `title="${esc(t.full)}"`} class="py-1.5 px-1 rounded-[5px] font-display font-black text-[11px] leading-tight text-white transition flex flex-col items-center justify-center ${active ? 'ring-4 ring-[#1e1b2e]' : (full ? 'opacity-35 cursor-not-allowed' : 'opacity-85 hover:opacity-100')}" style="background:${t.color};box-shadow:0 2px 0 ${t.dark}"><span>${t.shape} ${t.num}${active ? ' ✓' : ''}</span><span class="text-[9px] font-bold opacity-90">${full ? 'เต็ม' : `${shownCnt}/${cap}`}</span></button>`;
        }).join('');
        teamGrid.querySelectorAll('[data-mod-team]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const tKey = btn.dataset.modTeam;
            let res = null;
            await Sync.transact(room => {
              if (!room) return;
              res = Game.setPlayerTeam(room, modTargetPid, tKey, true);
              if (!res || !res.ok) return undefined;
              return room;
            });
            if (!res || !res.ok) {
              SFX.wrong();
              toast(`${TEAMS[tKey].name} เต็มครบ 5/5 คนแล้ว!`, 'warn');
              refreshModModal();
              return;
            }
            if (res.player) Sync.sendDirectPlayer(res.player.id, res.player);
            SFX.pop();
            refreshModModal();
            toast(`ย้าย ${esc(safeName(p.name))} ไป ${TEAMS[tKey].name} แล้ว`, 'success');
          });
        });
      } else {
        teamWrap.classList.add('hidden');
      }
    }
  }

  function openModModal(pid) {
    if (!pid || !Sync.room || !Sync.room.players[pid]) return;
    SFX.pop();
    modTargetPid = pid;
    const p = Sync.room.players[pid];
    const inp = $('modRenameInput');
    if (inp) inp.value = p.name || '';
    $('modModal')?.classList.remove('hidden');
    refreshModModal();
  }

  $('closeModModal')?.addEventListener('click', () => { SFX.click(); modTargetPid = null; $('modModal')?.classList.add('hidden'); });
  $('modModal')?.addEventListener('click', e => { if (e.target === $('modModal')) { modTargetPid = null; $('modModal')?.classList.add('hidden'); } });

  $('modHidePhotoBtn')?.addEventListener('click', async () => {
    if (!modTargetPid || !Sync.room || !Sync.room.players[modTargetPid]) return;
    const curBlocked = !!Sync.room.players[modTargetPid].photoBlocked;
    const nextBlocked = !curBlocked;
    if (nextBlocked) SQA_PHOTOS.del(modTargetPid);
    let upd = null;
    await Sync.transact(room => {
      if (!room) return;
      upd = Game.moderateHidePhoto(room, modTargetPid, nextBlocked);
      return room;
    });
    if (upd) Sync.sendDirectPlayer(upd.id, upd);
    SFX.pop();
    refreshModModal();
    toast(nextBlocked ? 'ซ่อนรูปโปรไฟล์แล้ว (สลับกลับเป็นมาสคอตทันที!)' : 'ปลดล็อกอนุญาตให้ผู้เล่นใช้รูปโปรไฟล์ได้แล้ว', 'info');
  });

  async function applyModRename(newName) {
    if (!modTargetPid || !Sync.room || !Sync.room.players[modTargetPid]) return;
    let upd = null;
    await Sync.transact(room => {
      if (!room) return;
      upd = Game.moderateRename(room, modTargetPid, newName);
      return room;
    });
    if (upd) {
      Sync.sendDirectPlayer(upd.id, upd);
      const inp = $('modRenameInput');
      if (inp) inp.value = upd.name;
    }
    SFX.pop();
    refreshModModal();
    toast(`เปลี่ยนชื่อเป็น "${esc(upd ? upd.name : newName)}" เรียบร้อย`, 'success');
  }
  $('modRenameSaveBtn')?.addEventListener('click', () => {
    const val = ($('modRenameInput')?.value || '').trim();
    if (!val) { toast('กรุณาพิมพ์ชื่อใหม่ก่อนบันทึก', 'warn'); return; }
    applyModRename(val);
  });
  $('modRenameSafeBtn')?.addEventListener('click', () => applyModRename('นักเรียนน่ารัก'));

  document.querySelectorAll('[data-mod-score]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!modTargetPid || !Sync.room || !Sync.room.players[modTargetPid]) return;
      const val = btn.dataset.modScore;
      const isReset = val === 'reset';
      const delta = isReset ? 0 : Number(val);
      let upd = null;
      await Sync.transact(room => {
        if (!room) return;
        upd = Game.moderateScore(room, modTargetPid, delta, isReset);
        return room;
      });
      if (upd) Sync.sendDirectPlayer(upd.id, upd);
      SFX.pop();
      refreshModModal();
      toast(isReset ? 'รีเซ็ตคะแนนเป็น 0 แล้ว' : `ปรับคะแนน ${delta > 0 ? '+' : ''}${delta} แต้มแล้ว`, 'info');
    });
  });

  $('modKickBtn')?.addEventListener('click', async () => {
    if (!modTargetPid || !Sync.room || !Sync.room.players[modTargetPid]) return;
    const pid = modTargetPid;
    const pName = safeName(Sync.room.players[pid].name);
    if (!window.confirm(`ยืนยันเตะ "${pName}" ออกจากห้องนี้หรือไม่?`)) return;
    SQA_PHOTOS.del(pid);
    selfiePhotoCache.delete(pid);
    lastAvatarReqAt.delete(pid);
    await Sync.transact(room => {
      if (!room) return;
      Game.moderateKick(room, pid);
      return room;
    });
    Sync.sendKick(pid);
    modTargetPid = null;
    $('modModal')?.classList.add('hidden');
    SFX.wrong();
    toast(`เตะ "${esc(pName)}" ออกจากห้องเรียบร้อยแล้ว`, 'warn');
  });

  // ---------------- สรุปประเด็นที่เด็กตอบพลาดบ่อยสุดหลังจบเกม (Teacher Debrief!) ----------------
  function renderDebriefModal() {
    const body = $('debriefBody');
    if (!body) return;
    const rows = Array.from(hostAnswerStats.values());
    if (!rows.length) {
      body.innerHTML = `
        <div class="text-center py-12 px-4 bg-neutral-100 rounded-[8px] border-2 border-dashed border-neutral-300 space-y-2">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#46178f]/10 text-[#46178f] mb-1">${uiIconHtml('target', 28)}</div>
          <div class="font-display text-lg font-black text-[#333]">ยังไม่มีสถิติการตอบคำถามในรอบนี้</div>
          <p class="text-xs sm:text-sm font-semibold text-neutral-500 max-w-md mx-auto">เมื่อนักเรียน (หรือบอทจำลอง) เริ่มส่งคำตอบ ระบบจะเก็บสถิติความแม่นยำและข้อที่ตอบพลาดบ่อยให้อัตโนมัติแบบเรียลไทม์ครับ!</p>
        </div>`;
      return;
    }

    const totalAttempts = rows.reduce((s, r) => s + r.attempts, 0);
    const totalPasses = rows.reduce((s, r) => s + r.passes, 0);
    const totalAccSum = rows.reduce((s, r) => s + r.totalAcc, 0);
    const avgAcc = Math.round(totalAccSum / Math.max(1, totalAttempts));
    const passRate = Math.round((totalPasses / Math.max(1, totalAttempts)) * 100);

    // สรุปรายภาพยนตร์วิทยาศาสตร์ 4 เรื่อง
    const filmRows = Object.entries(FILMS).map(([fk, f]) => {
      const subset = rows.filter(r => r.film === fk);
      const att = subset.reduce((s, r) => s + r.attempts, 0);
      const acc = att > 0 ? Math.round(subset.reduce((s, r) => s + r.totalAcc, 0) / att) : null;
      const mis = subset.reduce((s, r) => s + r.misses, 0);
      return { key: fk, film: f, attempts: att, avgAcc: acc, misses: mis };
    });
    const activeFilms = filmRows.filter(f => f.attempts > 0);
    const weakestFilm = activeFilms.length ? [...activeFilms].sort((a, b) => a.avgAcc - b.avgAcc)[0] : null;

    // เรียงคำถามจากความแม่นยำเฉลี่ยต่ำสุด + จำนวนคนตอบพลาดมากสุด (Top 5 Misconceptions)
    const enriched = rows.map(r => {
      const qObj = (typeof QUESTION_MAP !== 'undefined' && QUESTION_MAP[r.qid]) || (typeof BONUS_MAP !== 'undefined' && BONUS_MAP[r.qid]) || null;
      const qAvg = Math.round(r.totalAcc / Math.max(1, r.attempts));
      return { ...r, avgAcc: qAvg, qObj };
    });
    const hotspots = [...enriched]
      .sort((a, b) => a.avgAcc - b.avgAcc || b.misses - a.misses)
      .slice(0, 5);
    const strengths = [...enriched]
      .filter(r => r.avgAcc >= 70)
      .sort((a, b) => b.avgAcc - a.avgAcc || b.attempts - a.attempts)
      .slice(0, 3);

    body.innerHTML = `
      <!-- 4 KPI ภาพรวมทั้งห้อง -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div class="rounded-[8px] p-3 bg-[#46178f] text-white">
          <div class="text-[11px] font-extrabold text-white/75 uppercase">คำตอบทั้งหมด</div>
          <div class="font-display text-2xl font-black tabular mt-0.5">${totalAttempts.toLocaleString()}</div>
          <div class="text-[10px] font-bold text-white/75">จาก ${rows.length} การ์ดคำถาม</div>
        </div>
        <div class="rounded-[8px] p-3 bg-[#1368ce] text-white">
          <div class="text-[11px] font-extrabold text-white/75 uppercase">ความแม่นยำเฉลี่ย</div>
          <div class="font-display text-2xl font-black tabular mt-0.5">${avgAcc}%</div>
          <div class="text-[10px] font-bold text-white/75">ภาพรวมทั้งห้องเรียน</div>
        </div>
        <div class="rounded-[8px] p-3 bg-[#26890c] text-white">
          <div class="text-[11px] font-extrabold text-white/75 uppercase">อัตราตอบผ่าน</div>
          <div class="font-display text-2xl font-black tabular mt-0.5">${passRate}%</div>
          <div class="text-[10px] font-bold text-white/75">ผ่าน ${totalPasses} / พลาด ${totalAttempts - totalPasses}</div>
        </div>
        <div class="rounded-[8px] p-3 bg-[#e21b3c] text-white">
          <div class="text-[11px] font-extrabold text-white/75 uppercase">เรื่องที่ควรทบทวน</div>
          <div class="font-display text-sm font-black leading-tight mt-1 truncate">${weakestFilm ? esc(weakestFilm.film.short) : '-'}</div>
          <div class="text-[11px] font-bold text-[#fde047] mt-0.5">${weakestFilm ? `เฉลี่ย ${weakestFilm.avgAcc}% (${weakestFilm.misses} พลาด)` : ''}</div>
        </div>
      </div>

      <!-- ความเข้าใจแยกตามภาพยนตร์ 4 เรื่อง -->
      <div class="bg-neutral-100 rounded-[8px] p-3.5 border border-neutral-200 space-y-2.5">
        <div class="font-display font-black text-sm text-[#333] uppercase">ความเข้าใจแยกตามภาพยนตร์วิทยาศาสตร์ 4 เรื่อง</div>
        <div class="grid sm:grid-cols-2 gap-2.5">
          ${filmRows.map(fr => `
            <div class="bg-white rounded-[6px] p-2.5 border border-neutral-200 space-y-1.5">
              <div class="flex items-center justify-between gap-2 text-xs font-extrabold">
                <span class="inline-flex items-center gap-1.5 text-[#333] truncate">${filmIconHtml(fr.key, 16)}<span class="truncate">${esc(fr.film.short)}</span></span>
                <span class="font-display font-black shrink-0 tabular" style="color:${fr.avgAcc === null ? '#9ca3af' : (fr.avgAcc < 50 ? '#e21b3c' : (fr.avgAcc < 75 ? '#d89e00' : '#26890c'))}">${fr.avgAcc === null ? 'ยังไม่ตอบ' : `${fr.avgAcc}%`}</span>
              </div>
              <div class="debrief-bar-track">
                <div class="debrief-bar-fill" style="width:${fr.avgAcc ?? 0}%;background:${fr.film.color}"></div>
              </div>
              <div class="text-[10px] font-bold text-neutral-500 flex justify-between">
                <span>${esc(fr.film.topic)}</span>
                <span class="shrink-0 ml-2">${fr.attempts} ครั้ง</span>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Top 5 คำถามที่พลาดบ่อย / แม่นยำต่ำสุด (พร้อมเฉลยต้นแบบให้ครูชวนคุย!) -->
      <div class="space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="font-display font-black text-base text-[#e21b3c] inline-flex items-center gap-1.5">
            ${uiIconHtml('bolt', 16)}<span>Top ${hotspots.length} ประเด็นที่ควรชวนคุยทบทวน (ความแม่นยำต่ำสุด)</span>
          </div>
          <span class="text-[11px] font-bold text-neutral-500">แสดงเฉลยต้นแบบสำหรับครูอธิบายหน้าห้อง</span>
        </div>
        ${hotspots.map((h, i) => {
          const f = FILMS[h.film] || FILMS.f1;
          const colHex = h.avgAcc < 45 ? '#e21b3c' : (h.avgAcc < 70 ? '#d89e00' : '#26890c');
          return `
            <div class="rounded-[8px] border-2 bg-white p-3.5 space-y-2 shadow-sm" style="border-color:${colHex}55">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="px-2 py-0.5 rounded-[4px] bg-[#1e1b2e] text-white font-display font-black text-xs">#${i + 1} • ${esc(prettyCode(h.qid) || h.qid)}</span>
                  <span class="px-2 py-0.5 rounded-[4px] text-white font-extrabold text-[11px] inline-flex items-center gap-1" style="background:${f.color}">${filmIconHtml(h.film, 13)}<span>${esc(f.short)}</span></span>
                </div>
                <div class="flex items-center gap-2 text-xs font-extrabold">
                  <span class="px-2 py-0.5 rounded-[4px] text-white font-display font-black tabular" style="background:${colHex}">แม่นยำเฉลี่ย ${h.avgAcc}%</span>
                  <span class="text-neutral-500">ตอบ ${h.attempts} ครั้ง (พลาด ${h.misses})</span>
                </div>
              </div>
              <div class="font-display font-extrabold text-sm sm:text-base text-[#333] leading-snug">${esc(h.qObj ? h.qObj.q : h.qid)}</div>
              ${h.qObj && h.qObj.model ? `
                <div class="rounded-[6px] bg-[#f0fdf4] border border-[#26890c]/40 p-2.5 text-xs sm:text-sm">
                  <span class="font-display font-black text-[#26890c] uppercase text-[11px] block mb-0.5">เฉลยต้นแบบสำหรับครูชวนคุย:</span>
                  <span class="font-bold text-[#1e1b2e]">${esc(h.qObj.model)}</span>
                </div>` : ''}
            </div>`;
        }).join('')}
      </div>

      ${strengths.length ? `
        <div class="rounded-[8px] bg-[#f0fdf4] border-2 border-[#26890c]/40 p-3.5 space-y-2">
          <div class="font-display font-black text-sm text-[#26890c] inline-flex items-center gap-1.5">${uiIconHtml('check', 15)}<span>จุดแข็งของห้อง! คำถามที่นักเรียนเข้าใจแม่นยำที่สุด</span></div>
          <div class="space-y-1.5">
            ${strengths.map(s => `
              <div class="bg-white rounded-[5px] px-3 py-2 flex items-center justify-between gap-2 text-xs sm:text-sm font-bold text-[#333] border border-[#26890c]/20">
                <span class="truncate"><b>${esc(prettyCode(s.qid) || s.qid)}</b> — ${esc(s.qObj ? s.qObj.q : s.qid)}</span>
                <span class="px-2 py-0.5 rounded bg-[#26890c] text-white font-display font-black text-xs shrink-0 tabular">${s.avgAcc}%</span>
              </div>`).join('')}
          </div>
        </div>` : ''}
    `;
  }

  function openDebriefModal() {
    SFX.pop();
    debriefOpen = true;
    $('debriefModal')?.classList.remove('hidden');
    renderDebriefModal();
  }
  $('openDebriefBtn')?.addEventListener('click', openDebriefModal);
  $('topDebriefBtn')?.addEventListener('click', openDebriefModal);
  $('closeDebriefModal')?.addEventListener('click', () => { SFX.click(); debriefOpen = false; $('debriefModal')?.classList.add('hidden'); });
  $('debriefModal')?.addEventListener('click', e => { if (e.target === $('debriefModal')) { debriefOpen = false; $('debriefModal')?.classList.add('hidden'); } });

  function applyRoomRender(room) {
    if (!room) return;
    // บังคับโควต้าทีมละไม่เกิน 5 คนฝั่ง Host อัตโนมัติ (กันกรณีเด็กหลายคนกดเข้าทีมที่ 5 พร้อมกัน)
    if (room.teamMode && !rebalancingTeams && Object.keys(room.players || {}).length <= TEAM_KEYS.length * (Game.MAX_TEAM_SIZE || 5)) {
      const counts = Game.teamCounts(room);
      const cap = Game.MAX_TEAM_SIZE || 5;
      const needsFix = Object.values(room.players || {}).some(p => !p.team || !TEAMS[p.team]) ||
        TEAM_KEYS.some(k => (counts[k] || 0) > cap);
      if (needsFix) {
        rebalancingTeams = true;
        let changed = [];
        Sync.transact(r => {
          if (!r || !r.teamMode) return undefined;
          changed = Game.enforceTeamCaps(r);
          return changed.length ? r : undefined;
        }).then(() => {
          changed.forEach(p => Sync.sendDirectPlayer(p.id, p));
        }).finally(() => {
          rebalancingTeams = false;
        });
      }
    }
    // ซิงก์ค่าเวลาเกมครั้งแรกที่โหลดห้อง (หรือเมื่อรีเซ็ต)
    if (initialLoad || room.status === 'lobby') {
      matchRemainingMs = room.timerRemainingMs || (room.timerTotalSec || 0) * 1000;
      matchEnding = false;
      if (el.matchTimeSelect) {
        const str = String(room.timerTotalSec || 0);
        if ([...el.matchTimeSelect.options].some(o => o.value === str)) el.matchTimeSelect.value = str;
      }
    }
    renderControls(room);
    renderMatchTimerUI(room);
    renderTeamStrip(room);
    renderLeaderboard(room);
    renderFeed(room);
    renderBonusBar(room);
    renderFeverBar(room);
    renderBossStage(room);
    renderSelfieReview(room);
    if (modTargetPid) refreshModModal();
    if (room.status === 'ended') {
      stopSim();
      showPodium(room);
    } else {
      lastPodiumShown = false;
      el.podiumOverlay.classList.add('hidden');
      if (room.status === 'paused') {
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
    }
    initialLoad = false;
  }

  el.playPauseBtn.addEventListener('click', async () => {
    SFX.pop();
    let newStatus = 'playing';
    matchLastTickAt = Date.now();
    bonusLastTickAt = Date.now();
    await Sync.transact(room => {
      if (!room) return;
      room.status = room.status === 'playing' ? 'paused' : 'playing';
      newStatus = room.status;
      if (room.timerTotalSec > 0) {
        if (matchRemainingMs <= 0) matchRemainingMs = room.timerTotalSec * 1000;
        room.timerRemainingMs = Math.round(matchRemainingMs);
        room.timerRunning = newStatus === 'playing';
      }
      room.hostUpdatedAt = Date.now();
      Sync.pushFeed(room, { type: 'info', text: room.status === 'playing' ? 'เริ่มการแข่งขันแล้ว! ลุยเลย!' : 'ครูหยุดเกมชั่วคราว' });
      return room;
    });
    SFX.announce(newStatus === 'playing' ? 'start' : 'pause');
  });

  $('giftAllBtn')?.addEventListener('click', async () => {
    SFX.item();
    let count = 0;
    let giftedList = [];
    await Sync.transact(room => {
      if (!room) return;
      count = Game.giftRandomItemToAll(room);
      room.hostUpdatedAt = Date.now();
      giftedList = Object.values(room.players || {});
      return room;
    });
    if (!count) toast('ยังไม่มีผู้เล่นในห้องให้แจกไอเทม', 'warn');
    else {
      if (giftedList.length <= 30) giftedList.forEach(p => Sync.sendDirectPlayer(p.id, p));
      toast(`${heroIconHtml('giftBox', 18)}<span>สุ่มแจกไอเทมให้ผู้เล่น ${count} คนเรียบร้อย!</span>`, 'success');
    }
  });

  // ===================== อัญเชิญบอสคำถามยักษ์ (Co-Op Boss Raid Summoner!) =====================
  const bossModal = $('bossModal');
  let selectedBossSec = 90;
  let selectedBossMult = 1;

  function renderBossModalGrid() {
    const pCount = Sync.room ? Object.keys(Sync.room.players || {}).length : 0;
    const estHp = Game.calcBossHp(pCount, selectedBossMult);
    const hpPreview = $('bossHpPreview');
    if (hpPreview) hpPreview.textContent = `${estHp.toLocaleString()} HP (${Math.max(1, pCount)} คน)`;

    const grid = $('bossPickerGrid');
    if (!grid) return;
    grid.innerHTML = BOSS_KEYS.map(key => {
      const b = BOSSES[key];
      const f = FILMS[b.film] || FILMS.f1;
      return `
        <button type="button" data-summon-boss="${b.key}" class="boss-card-pick p-3.5 text-left flex items-center gap-3">
          <div class="w-24 h-24 rounded-[8px] flex items-center justify-center shrink-0" style="background:radial-gradient(circle,${b.color}66 0%,#12042e 80%);border:2px solid ${b.color}">
            ${bossArtHtml(b.key, 92)}
          </div>
          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="px-2 py-0.5 rounded-[4px] text-[10px] font-extrabold text-white inline-flex items-center gap-1" style="background:${f.color}">${filmIconHtml(b.film, 13)}<span>${esc(f.short)}</span></span>
            </div>
            <div class="font-display text-base sm:text-lg font-black leading-tight text-white">${esc(b.name)}</div>
            <div class="text-xs font-extrabold text-[#fde047]">${esc(b.title)}</div>
            <div class="text-[11px] font-extrabold text-[#fca5a5] inline-flex items-center gap-1">${uiIconHtml('bolt', 12)}<span>ท่าไม้ตาย: ${esc(b.attack ? b.attack.name : '')}</span></div>
            <p class="text-[11px] font-medium text-white/80 leading-snug line-clamp-2">${esc(b.tagline)}</p>
          </div>
        </button>`;
    }).join('');
    grid.querySelectorAll('[data-summon-boss]').forEach(btn => {
      btn.addEventListener('click', () => launchBossRaid(btn.dataset.summonBoss));
    });
  }

  async function launchBossRaid(bossKey) {
    bossModal?.classList.add('hidden');
    SFX.drum();
    const meta = BOSSES[bossKey] || BOSSES.dr_glitch;
    await Sync.transact(room => {
      if (!room) return;
      Game.spawnBoss(room, meta.key, selectedBossSec, selectedBossMult, 300);
      return room;
    });
    toast(`${heroIconHtml('bossRaid', 20)}<span>อัญเชิญบอส ${esc(meta.name)} แล้ว! ช่วยกันตีทั้งห้องเลย!</span>`, 'error', 3600);
  }

  $('bossBtn')?.addEventListener('click', () => {
    SFX.pop();
    renderBossModalGrid();
    bossModal?.classList.remove('hidden');
  });
  $('closeBossModal')?.addEventListener('click', () => { SFX.click(); bossModal?.classList.add('hidden'); });
  bossModal?.addEventListener('click', e => { if (e.target === bossModal) bossModal.classList.add('hidden'); });

  document.querySelectorAll('.boss-sec-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      SFX.click();
      selectedBossSec = Number(btn.dataset.bossSec) || 90;
      document.querySelectorAll('.boss-sec-btn').forEach(b => {
        b.className = b === btn
          ? 'boss-sec-btn py-1.5 rounded-[4px] font-display font-black text-xs bg-[#46178f] text-white'
          : 'boss-sec-btn py-1.5 rounded-[4px] font-display font-black text-xs bg-white text-[#333] hover:bg-neutral-200';
      });
    });
  });
  document.querySelectorAll('.boss-mult-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      SFX.click();
      selectedBossMult = Number(btn.dataset.bossMult) || 1;
      document.querySelectorAll('.boss-mult-btn').forEach(b => {
        b.className = b === btn
          ? 'boss-mult-btn py-1.5 rounded-[4px] font-display font-black text-xs bg-[#e21b3c] text-white'
          : 'boss-mult-btn py-1.5 rounded-[4px] font-display font-black text-xs bg-white text-[#333] hover:bg-neutral-200';
      });
      renderBossModalGrid();
    });
  });
  $('randomBossBtn')?.addEventListener('click', () => {
    const key = BOSS_KEYS[rand(BOSS_KEYS.length)];
    launchBossRaid(key);
  });
  $('bossAttackNowBtn')?.addEventListener('click', () => {
    SFX.pop();
    fireBossAttackNow();
  });
  $('closeBossBtn')?.addEventListener('click', async () => {
    SFX.click();
    await Sync.transact(room => {
      if (!room) return;
      room.boss = null;
      room.hostUpdatedAt = Date.now();
      return room;
    });
  });

  // ===================== อีเวนต์ป่วนห้อง (Chaos Events!) =====================
  const chaosModal = $('chaosModal');
  $('chaosBtn')?.addEventListener('click', () => { SFX.pop(); chaosModal?.classList.remove('hidden'); });
  $('closeChaosModal')?.addEventListener('click', () => { SFX.click(); chaosModal?.classList.add('hidden'); });
  chaosModal?.addEventListener('click', e => { if (e.target === chaosModal) chaosModal.classList.add('hidden'); });

  $('evFeverBtn')?.addEventListener('click', async () => {
    chaosModal?.classList.add('hidden');
    SFX.fanfare();
    confetti(2200, 110);
    await Sync.transact(room => {
      if (!room) return;
      Game.triggerFever(room, 60);
      trackedFeverId = room.feverId;
      feverRemainingMs = 60000;
      feverLastTickAt = Date.now();
      feverLastSyncAt = Date.now();
      feverEnding = false;
      return room;
    });
    toast(`${heroIconHtml('feverBolt', 18)}<span>เปิดโหมด FEVER TIME x2 ทั้งห้อง 60 วินาที!</span>`, 'error', 3500);
  });

  $('stopFeverBtn')?.addEventListener('click', async () => {
    SFX.click();
    trackedFeverId = '';
    feverRemainingMs = 0;
    await Sync.transact(room => {
      if (!room) return;
      room.feverId = '';
      room.feverRemainingSec = 0;
      room.hostUpdatedAt = Date.now();
      return room;
    });
  });

  $('evUnderdogBtn')?.addEventListener('click', async () => {
    chaosModal?.classList.add('hidden');
    SFX.item();
    let res = { count: 0, targets: [] };
    await Sync.transact(room => {
      if (!room) return;
      res = Game.triggerUnderdogBoost(room);
      return room;
    });
    if (!res.count) {
      toast('ยังไม่มีผู้เล่นในห้องเลย ลองเชิญนักเรียนเข้าห้องก่อนนะ', 'warn');
    } else {
      res.targets.slice(0, 30).forEach(p => Sync.sendDirectPlayer(p.id, p));
      toast(`${heroIconHtml('rocketBoost', 18)}<span>ปล่อยพลังฮึดท้ายตาราง (+150 แต้ม + ไอเทมโจมตี) ให้ ${res.count} คนเรียบร้อย!</span>`, 'success', 3400);
    }
  });

  $('evFreezeTopBtn')?.addEventListener('click', async () => {
    chaosModal?.classList.add('hidden');
    SFX.freeze();
    let res = { total: 0, frozenCount: 0, blockedCount: 0, affected: [] };
    await Sync.transact(room => {
      if (!room) return;
      res = Game.triggerFreezeTop(room);
      return room;
    });
    if (!res.total) {
      toast('ยังไม่มีผู้เล่นในห้องให้แช่แข็ง', 'warn');
    } else {
      res.affected.forEach(p => Sync.sendDirectPlayer(p.id, p));
      const msg = res.blockedCount > 0
        ? `พายุแช่แข็งจ่าฝูง! แช่แข็ง ${res.frozenCount} คน (ติดโล่กันไว้ ${res.blockedCount} คน)`
        : `ปล่อยพายุแช่แข็งจ่าฝูง Top ${res.frozenCount} แล้ว!`;
      toast(`${itemIconHtml('freeze', 18)}<span>${msg}</span>`, 'ice', 3400);
    }
  });

  $('evGiftRainBtn')?.addEventListener('click', async () => {
    chaosModal?.classList.add('hidden');
    SFX.item();
    let count = 0;
    let giftedList = [];
    await Sync.transact(room => {
      if (!room) return;
      count = Game.giftRandomItemToAll(room);
      room.hostUpdatedAt = Date.now();
      giftedList = Object.values(room.players || {});
      return room;
    });
    if (!count) {
      toast('ยังไม่มีผู้เล่นในห้องให้แจกไอเทม', 'warn');
    } else {
      if (giftedList.length <= 30) giftedList.forEach(p => Sync.sendDirectPlayer(p.id, p));
      toast(`${heroIconHtml('giftBox', 18)}<span>ฝนไอเทมทั่วห้อง! แจกไอเทมสุ่มให้ ${count} คนเรียบร้อย!</span>`, 'success', 3400);
    }
  });

  // ===================== Classroom Live Reactions (สติกเกอร์เชียร์ลอยขึ้นจอครู!) =====================
  let activeReactCount = 0;
  const REACT_HERO_MAP = { fire: 'reactFire', laugh: 'reactLaugh', clap: 'reactClap', shock: 'reactShock' };
  function spawnReactionBubble(kind, senderName) {
    const heroName = REACT_HERO_MAP[kind];
    if (!heroName || activeReactCount >= 12) return;
    activeReactCount++;
    const div = document.createElement('div');
    div.className = 'react-bubble flex flex-col items-center';
    const rightPct = 4 + Math.random() * 28;
    div.style.right = `${rightPct.toFixed(1)}%`;
    div.innerHTML = `
      <div class="drop-shadow-[0_4px_0_rgba(0,0,0,0.3)]">${heroIconHtml(heroName, 54)}</div>
      ${senderName ? `<span class="mt-0.5 px-2 py-0.5 rounded-full bg-[#241f35]/90 text-white font-display font-extrabold text-[11px] border border-white/25 whitespace-nowrap shadow">${esc(safeName(senderName))}</span>` : ''}`;
    document.body.appendChild(div);
    setTimeout(() => {
      div.remove();
      activeReactCount = Math.max(0, activeReactCount - 1);
    }, 2650);
  }

  function renderBonusModalChoices() {
    const used = (Sync.room && Sync.room.usedBonus) || {};
    const timeStyle = sec => sec <= 10
      ? { bg: '#d89e00', txt: `${uiIconHtml('bolt', 12)}<span>10 วิ</span>` }
      : (sec <= 20 ? { bg: '#26890c', txt: `${uiIconHtml('clock', 12)}<span>20 วิ (ง่าย)</span>` } : { bg: '#e21b3c', txt: `${uiIconHtml('clock', 12)}<span>30 วิ (ยาก)</span>` });

    el.bonusChoices.innerHTML = BONUS_QUESTIONS.map(bq => {
      const f = FILMS[bq.film];
      const isUsed = !!used[bq.id];
      const effSec = selectedBonusSec === 'auto' ? (bq.sec || 20) : Number(selectedBonusSec);
      const ts = timeStyle(effSec);
      return `
        <button data-bid="${bq.id}" class="w-full text-left p-3 rounded-[6px] border-2 transition flex items-center justify-between gap-3 ${isUsed ? 'bg-neutral-100 border-neutral-300 opacity-60' : 'bg-white border-neutral-300 hover:border-[#46178f]'}">
          <div>
            <div class="flex items-center gap-1.5 flex-wrap mb-1">
              <span class="px-2 py-0.5 rounded-[4px] text-[11px] font-black text-white inline-flex items-center gap-1" style="background:${ts.bg}">${ts.txt}</span>
              <span class="px-2 py-0.5 rounded-[4px] text-[11px] font-extrabold text-white inline-flex items-center gap-1" style="background:${f.color}">${filmIconHtml(bq.film, 14)}<span>${esc(f.short)}</span></span>
              ${isUsed ? '<span class="text-[11px] font-extrabold text-neutral-500">ปล่อยไปแล้ว</span>' : ''}
            </div>
            <div class="font-bold text-[#333] text-sm sm:text-base">${esc(bq.q)}</div>
          </div>
          <span class="btn-3d k-btn-green px-3 py-1.5 text-xs shrink-0">ปล่อย (${effSec} วิ)</span>
        </button>`;
    }).join('');
    el.bonusChoices.querySelectorAll('[data-bid]').forEach(btn => {
      btn.addEventListener('click', () => launchBonus(btn.dataset.bid));
    });
  }

  document.querySelectorAll('.bonus-sec-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      SFX.click();
      selectedBonusSec = btn.dataset.bonusSec === 'auto' ? 'auto' : Number(btn.dataset.bonusSec);
      document.querySelectorAll('.bonus-sec-btn').forEach(b => {
        b.className = b === btn
          ? 'bonus-sec-btn py-2 px-2 rounded-[4px] font-display font-black text-xs bg-[#46178f] text-white inline-flex items-center justify-center gap-1'
          : 'bonus-sec-btn py-2 px-2 rounded-[4px] font-display font-black text-xs bg-white text-[#333] hover:bg-neutral-200 inline-flex items-center justify-center gap-1';
      });
      renderBonusModalChoices();
    });
  });

  function openBonusModal() {
    SFX.pop();
    renderBonusModalChoices();
    el.bonusModal.classList.remove('hidden');
  }

  async function launchBonus(qid) {
    el.bonusModal.classList.add('hidden');
    const bq = BONUS_MAP[qid];
    const durationSec = selectedBonusSec === 'auto' ? ((bq && bq.sec) || 20) : Number(selectedBonusSec);
    SFX.bonus();
    await Sync.transact(room => {
      if (!room) return;
      if (room.status === 'lobby' || room.status === 'paused') {
        room.status = 'playing';
        if (room.timerTotalSec > 0) room.timerRunning = true;
      }
      room.usedBonus[qid] = true;
      room.boss = null; // ปิดบอสเดิมไม่ให้หน้าต่างโบนัสกับบอสซ้อนทับกันบนมือถือ!
      room.bonus = { id: uid(), qid, durationSec, remainingSec: durationSec, startedAt: Date.now(), answered: {} };
      room.hostUpdatedAt = Date.now();
      Sync.pushFeed(room, { type: 'bonus', qid, sec: durationSec });
      return room;
    });
  }

  el.bonusBtn.addEventListener('click', openBonusModal);
  $('closeBonusModal').addEventListener('click', () => { SFX.click(); el.bonusModal.classList.add('hidden'); });
  el.bonusModal.addEventListener('click', e => { if (e.target === el.bonusModal) el.bonusModal.classList.add('hidden'); });

  $('randomBonusBtn').addEventListener('click', () => {
    const used = (Sync.room && Sync.room.usedBonus) || {};
    const avail = BONUS_QUESTIONS.filter(b => !used[b.id]);
    const pool = avail.length ? avail : BONUS_QUESTIONS;
    launchBonus(pool[rand(pool.length)].id);
  });

  el.closeBonusBtn.addEventListener('click', async () => {
    SFX.click();
    await Sync.transact(room => {
      if (!room) return;
      room.bonus = null;
      room.hostUpdatedAt = Date.now();
      return room;
    });
  });

    el.podiumBtn.addEventListener('click', async () => {
    SFX.drum();
    await Sync.transact(room => {
      if (!room) return;
      room.status = 'ended';
      room.endedAt = Date.now();
      room.bonus = null;
      room.boss = null;
      room.feverId = '';
      room.feverRemainingSec = 0;
      room.hostUpdatedAt = Date.now();
      return room;
    });
  });

  $('resumeFromPodiumBtn').addEventListener('click', async () => {
    SFX.click();
    await Sync.transact(room => {
      if (!room) return;
      room.status = 'playing';
      room.hostUpdatedAt = Date.now();
      return room;
    });
  });

  async function clearRoomForNewGame(silent = false) {
    if (!silent) SFX.pop();
    stopSim();
    matchEnding = false;
    lastMatchBeepSec = -1;
    lastBonusBeepSec = -1;
    lastBossBeepSec = -1;
    trackedBonusId = null;
    trackedFeverId = '';
    trackedBossId = '';
    trackedBossArtKey = '';
    bossChargeMs = 0;
    bossEnragedAnnouncedId = '';
    seenBossHitIds.clear();
    await Sync.transact(room => {
      const now = Date.now();
      const base = room || Sync.defaultRoom(roomCode);
      base.status = 'lobby';
      base.bonus = null;
      base.boss = null;
      base.feverId = '';
      base.feverRemainingSec = 0;
      base.endedAt = null;
      base.usedBonus = {};
      base.players = {};
      base.feed = {};
      base.kicked = {};
      base.timerRunning = false;
      base.timerRemainingMs = (base.timerTotalSec || 0) * 1000;
      base.timerEpoch = (base.timerEpoch || 1) + 1;
      base.hostUpdatedAt = now;
      base.roundId = (base.roundId || 1) + 1;
      if (silent && initTeamParam !== null) {
        base.teamMode = initTeamParam !== '0';
      } else {
        base.teamMode = typeof base.teamMode === 'boolean' ? base.teamMode : true;
      }
      return base;
    });
    matchRemainingMs = ((Sync.room && Sync.room.timerTotalSec) || 0) * 1000;
    seenFeedIds.clear();
    selfiePhotoCache.clear();
    lastAvatarReqAt.clear();
    hostAnswerStats.clear();
    SQA_PHOTOS.clear();
    modTargetPid = null;
    allTeamsOpen = false;
    debriefOpen = false;
    $('modModal')?.classList.add('hidden');
    $('allTeamsModal')?.classList.add('hidden');
    $('debriefModal')?.classList.add('hidden');
    lastPodiumShown = false;
    el.podiumOverlay.classList.add('hidden');
    if (!silent) toast(`${uiIconHtml('refresh', 16)}<span>เริ่มเกมใหม่และล้างข้อมูลเดิมเรียบร้อยแล้ว</span>`, 'success');
  }

  function createNewPinRoom() {
    SFX.pop();
    stopSim();
    let nextPin = String(1000 + rand(9000));
    while (nextPin === roomCode) nextPin = String(1000 + rand(9000));
    const teamFlag = (Sync.room && !Sync.room.teamMode) ? '0' : '1';
    location.href = `host.html?room=${nextPin}&new=1&team=${teamFlag}`;
  }

  $('newMatchBtn').addEventListener('click', () => clearRoomForNewGame(false));
  $('newPinBtn').addEventListener('click', createNewPinRoom);
  $('podiumNewPinBtn').addEventListener('click', createNewPinRoom);
  el.resetBtn.addEventListener('click', () => clearRoomForNewGame(false));

  // กดปุ่มลัด F เพื่อเข้า/ออกโหมดเต็มจอ
  document.addEventListener('keydown', e => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  const BOT_NAMES = ['มินนี่', 'บีมสายฟ้า', 'ข้าวปั้น', 'ต้นกล้า', 'พลอยใส', 'กายซ่า', 'โฟกัส', 'น้ำขิง', 'ปันปัน', 'เจได'];
  el.addBotsBtn.addEventListener('click', async () => {
    SFX.join();
    await Sync.transact(room => {
      if (!room) return;
      const takenNames = new Set(Object.values(room.players).map(p => p.name));
      const takenAvs = new Set(Object.values(room.players).map(p => p.avatar));
      let added = 0;
      for (const name of BOT_NAMES) {
        if (added >= 4) break;
        if (takenNames.has(name)) continue;
        let av = rand(AVATARS.length);
        for (let k = 0; k < AVATARS.length; k++) {
          const cand = (av + k) % AVATARS.length;
          if (!takenAvs.has(cand)) { av = cand; break; }
        }
        takenAvs.add(av);
        const id = 'bot_' + uid();
        const team = room.teamMode ? Game.pickBalancedTeam(room) : '';
        if (room.teamMode && !team) break;
        room.players[id] = Game.newPlayer(id, name, av, true, { team });
        Sync.pushFeed(room, { type: 'join', a: name, ai: id, av });
        added++;
      }
      if (room.status === 'lobby') {
        room.status = 'playing';
        room.hostUpdatedAt = Date.now();
      }
      return room;
    });
    toast('เพิ่มนักเรียนบอทจำลอง 4 คนแล้ว', 'success');
  });

  function stopSim() {
    if (!simTimer) return;
    clearInterval(simTimer);
    simTimer = null;
    el.simToggleBtn.className = 'btn-3d k-btn-dark px-3.5 py-2.5 text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap';
    el.simToggleBtn.innerHTML = `${uiIconHtml('play', 14, 'text-[#4ade80]')}<span>จำลองเล่นอัตโนมัติ</span>`;
  }

  async function runBotTick() {
    await Sync.transact(room => {
      if (!room || room.status !== 'playing') return;
      const players = Object.values(room.players || {});
      const bots = players.filter(p => p.isBot);
      if (!bots.length) return;
      const bot = bots[rand(bots.length)];

      if (bot.frozen) { Game.unfreeze(room, bot.id); return room; }
      if (bot.blinded) { Game.unblind(room, bot.id); return room; }
      if (bot.flipped) { Game.unflip(room, bot.id); return room; }
      if (bot.selfieLocked) return; // บอทรอส่งรูปและรอครูกดอนุญาตบนหน้าจอใหญ่

      // หากมีบอสคำถามกำลังบุกห้อง ให้บอทร่วมแรงช่วยกันโจมตีบอสด้วย!
      if (room.boss && room.boss.status === 'active' && Math.random() < 0.78) {
        const acc = 45 + rand(55);
        const calc = Game.calcBossDamage(acc, !!bot.x2Active);
        if (calc.dmg > 0) {
          Game.applyBossHit(room, bot.id, room.boss.id, calc.dmg, acc, calc.crit, calc.pts, !!bot.x2Active);
          return room;
        }
      }

      if (room.bonus && !(room.bonus.answered || {})[bot.id] && Math.random() < 0.7) {
        Game.applyBonusWin(room, bot.id, room.bonus.id, 75 + rand(25), Game.randomItem());
        return room;
      }

      if (bot.items.x2 > 0 && !bot.x2Active && Math.random() < 0.65) {
        Game.useX2(room, bot.id);
        return room;
      }

      if ((bot.items.boost || 0) > 0 && Math.random() < 0.6) {
        Game.useBoost(room, bot.id);
        return room;
      }

      const others = players.filter(p => p.id !== bot.id && !(room.teamMode && bot.team && p.team === bot.team));
      const atkKinds = ['steal', 'freeze', 'blind', 'flip', 'zap', 'selfie'].filter(k => (bot.items[k] || 0) > 0);
      if (others.length && atkKinds.length && Math.random() < 0.6) {
        const kind = atkKinds[rand(atkKinds.length)];
        const target = others.sort((a, b) => b.score - a.score)[0];
        Game.applyAttack(room, bot.id, target.id, kind);
        return room;
      }

      const avail = QUESTIONS.filter(q => !bot.answered[q.id]);
      if (!avail.length) return;
      const q = avail[rand(avail.length)];
      const roll = Math.random();
      const mult = roll > 0.45 ? 1 : (roll > 0.15 ? 0.7 : 0.4);
      const acc = mult === 1 ? 84 + rand(16) : (mult === 0.7 ? 56 + rand(20) : 32 + rand(15));
      const item = (q.color === 'red' && Math.random() < Game.cfg.redItemChance) ? Game.randomItem() : null;
      Game.applyAnswer(room, bot.id, q, mult, acc, item);
      recordAnswerStat({ qid: q.id, film: q.film, acc, pass: mult > 0 });
      return room;
    });
  }

  el.simToggleBtn.addEventListener('click', async () => {
    SFX.click();
    if (simTimer) {
      stopSim();
      return;
    }
    const r = Sync.room;
    if (!r || !Object.values(r.players).some(p => p.isBot)) {
      el.addBotsBtn.click();
    } else if (r.status !== 'playing') {
      await Sync.transact(room => {
        if (room) { room.status = 'playing'; room.hostUpdatedAt = Date.now(); }
        return room;
      });
    }
    el.simToggleBtn.className = 'btn-3d k-btn-red px-3.5 py-2.5 text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap';
    el.simToggleBtn.innerHTML = `${uiIconHtml('stop', 14)}<span>หยุดจำลองอัตโนมัติ</span>`;
    simTimer = setInterval(runBotTick, 2100);
    runBotTick();
  });

  function onConnStatus(st) {
    if (!el.hostConnDot || !el.hostConnText) return;
    if (st === 'connected') {
      el.hostConnDot.className = 'conn-dot conn-ok';
      el.hostConnText.textContent = 'ออนไลน์';
    } else if (st === 'reconnecting') {
      el.hostConnDot.className = 'conn-dot conn-wait';
      el.hostConnText.textContent = 'กำลังต่อใหม่...';
    } else {
      el.hostConnDot.className = 'conn-dot conn-off';
      el.hostConnText.textContent = 'ออฟไลน์';
    }
  }

  (async () => {
    Sync.setLiveTimerGetter(() => ({
      timerRemainingMs: Math.round(matchRemainingMs),
      timerRunning: !!(Sync.room && Sync.room.status === 'playing' && (Sync.room.timerTotalSec || 0) > 0),
      bonusId: trackedBonusId,
      bonusRemainingSec: trackedBonusId ? Math.max(1, Math.ceil(bonusRemainingMs / 1000)) : null,
      feverId: trackedFeverId,
      feverRemainingSec: trackedFeverId ? Math.max(0, Math.ceil(feverRemainingMs / 1000)) : null,
      bossId: trackedBossId,
      bossRemainingSec: trackedBossId ? Math.max(0, Math.ceil(bossRemainingMs / 1000)) : null
    }));
    await Sync.connect(roomCode, onRoomUpdate, {
      isHost: true,
      onConn: onConnStatus,
      onBrokerChange: idx => {
        refreshJoinLinks(idx);
        toast(`${uiIconHtml('refresh', 16)}<span>สลับเซิร์ฟเวอร์สำรองอัตโนมัติ (อัปเดต QR Code แล้ว)</span>`, 'info', 3000);
      },
      onReaction: (kind, senderName) => {
        spawnReactionBubble(kind, senderName);
      },
      onBossHit: hit => {
        if (!hit || !hit.bossId || !hit.pid) return;
        if (hit.hitId) {
          if (seenBossHitIds.has(hit.hitId)) return;
          seenBossHitIds.add(hit.hitId);
          if (seenBossHitIds.size > 400) {
            const first = seenBossHitIds.values().next().value;
            seenBossHitIds.delete(first);
          }
        }
        let defeatedNow = false;
        Sync.transact(room => {
          if (!room || !room.boss || room.boss.id !== hit.bossId || room.boss.status !== 'active') return;
          const res = Game.applyBossHit(room, hit.pid, hit.bossId, hit.dmg, hit.acc, hit.crit, hit.pts, hit.usedX2);
          if (res && res.defeated) defeatedNow = true;
          return room;
        }, { deferBroadcast: !defeatedNow });
      },
      onSelfie: (pid, photo) => {
        selfiePhotoCache.set(pid, photo);
        lastSelfieReqAt.delete(pid);
        if (Sync.room) renderSelfieReview(Sync.room);
      },
      onAnswerStat: stat => {
        recordAnswerStat(stat);
      },
      onAvatar: (pid, photo) => {
        if (Sync.room && Sync.room.players[pid] && Sync.room.players[pid].photoBlocked) return;
        SQA_PHOTOS.set(pid, photo);
        lastAvatarReqAt.delete(pid);
        if (Sync.room) {
          renderLeaderboard(Sync.room);
          renderBossStage(Sync.room);
          if (modTargetPid === pid) refreshModModal();
          if (Sync.room.status === 'ended') showPodium(Sync.room);
        }
      }
    });
    if (!Sync.room) {
      await Sync.create(roomCode);
      await Sync.transact(r => {
        const base = r || Sync.defaultRoom(roomCode);
        base.teamMode = resolveInitialTeamMode(true);
        base.hostUpdatedAt = Date.now();
        return base;
      });
    } else if (forceNew || Sync.room.status === 'ended') {
      await clearRoomForNewGame(true);
    }
    refreshIcons();
  })();
})();
