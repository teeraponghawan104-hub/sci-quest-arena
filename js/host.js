/* Sci-Quest! — Host Big Screen Controller (Kahoot! Edition) */
(() => {
  const qs = new URLSearchParams(location.search);
  const forceNew = qs.get('new') === '1';
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
  let allRanksOpen = false;

  function renderAllRanksModal() {
    const modal = $('allRanksModal');
    if (!modal || modal.classList.contains('hidden') || !Sync.room) return;
    const all = Game.ranking(Sync.room);
    const q = ($('allRanksSearch')?.value || '').trim().toLowerCase();
    const filtered = q ? all.filter(p => (p.name || '').toLowerCase().includes(q)) : all;
    $('allRanksCount').textContent = `แสดง ${filtered.length} จากผู้เข้าแข่งขันทั้งหมด ${all.length} คน`;
    $('allRanksList').innerHTML = filtered.map(p => {
      const rank = all.indexOf(p) + 1;
      const ansCnt = p.answeredCount ?? Object.keys(p.answered || {}).length;
      return `
        <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-[4px] bg-neutral-100 border border-neutral-200 text-sm">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-8 h-8 rounded-[4px] bg-[#333] text-white font-display font-black text-xs grid place-items-center shrink-0">#${rank}</span>
            ${avatarHtml(p.avatar, 32)}
            <div class="min-w-0">
              <div class="font-display font-extrabold text-[#333] truncate">${esc(p.name)} ${p.isBot ? '<span class="text-[10px] bg-neutral-300 px-1 rounded">BOT</span>' : ''}</div>
              <div class="text-[11px] font-bold text-neutral-500 inline-flex items-center gap-1">${uiIconHtml('cards', 12)}<span>${ansCnt}/${QUESTIONS.length}</span></div>
            </div>
          </div>
          <span class="font-display font-black text-lg text-[#46178f] tabular shrink-0">${p.score.toLocaleString()}</span>
        </div>`;
    }).join('') || '<div class="text-center text-neutral-400 font-bold py-6">ไม่พบรายชื่อที่ค้นหา</div>';
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
        row.className = 'lb-row h-[68px] px-3.5 sm:px-4 flex items-center justify-between gap-3 bg-white text-[#333333]';
        row.style.transform = `translateY(${idx * ROW_STEP}px)`;
        row.innerHTML = `
          <div class="flex items-center gap-3 min-w-0">
            <div data-rank class="w-10 h-10 rounded-[4px] grid place-items-center font-display font-black text-lg shrink-0 text-white"></div>
            <div data-av></div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span data-name class="font-display font-extrabold text-base sm:text-lg truncate text-[#333]"></span>
                <span data-bot class="hidden px-1.5 py-0.5 rounded-[3px] bg-neutral-200 text-neutral-700 text-[10px] font-black">BOT</span>
              </div>
              <div data-badges class="flex items-center gap-1.5 flex-wrap text-[11px] font-extrabold mt-0.5"></div>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div data-score class="font-display font-black text-2xl sm:text-3xl text-[#333333] tabular leading-none">0</div>
          </div>`;
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
      if (avBox.dataset.avIdx !== String(p.avatar)) {
        avBox.dataset.avIdx = String(p.avatar);
        avBox.innerHTML = avatarHtml(p.avatar, 44);
      }
      row.querySelector('[data-name]').textContent = p.name;
      row.querySelector('[data-bot]').classList.toggle('hidden', !p.isBot);

      const answeredCount = p.answeredCount ?? Object.keys(p.answered || {}).length;
      const pills = [`<span class="px-2 py-0.5 rounded-[4px] bg-neutral-200 text-[#333] inline-flex items-center gap-1">${uiIconHtml('cards', 12)}<span>${answeredCount}/${QUESTIONS.length}</span></span>`];
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
        else if (e.type === 'block') { SFX.block(); showBattleBanner(`<span class="sqa-ico">${itemIconHtml('shield', 30)}</span><span>${v.html}</span>`, TONES.blue); SFX.announce('block', e); }
        else if (e.type === 'bonus') { SFX.bonus(); showBattleBanner(`<span class="sqa-ico">${heroIconHtml('giftBox', 30)}</span><span>${v.html}</span>`, TONES.amber); SFX.announce('bonus', e); }
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
      btn.className = 'btn-3d k-btn-blue px-5 py-2.5 text-sm sm:text-base flex items-center gap-1.5';
      btn.innerHTML = '<i data-lucide="pause" class="w-5 h-5"></i><span>หยุดเกมชั่วคราว</span>';
    } else if (room.status === 'paused') {
      btn.className = 'btn-3d k-btn-green px-5 py-2.5 text-sm sm:text-base flex items-center gap-1.5';
      btn.innerHTML = '<i data-lucide="play" class="w-5 h-5"></i><span>เล่นต่อ!</span>';
    } else {
      btn.className = 'btn-3d k-btn-green px-5 py-2.5 text-sm sm:text-base flex items-center gap-1.5';
      btn.innerHTML = '<i data-lucide="play" class="w-5 h-5"></i><span>เริ่มเกม!</span>';
    }
    refreshIcons();
  }

  function showPodium(room) {
    const ranked = Game.ranking(room);
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
            <div class="relative z-10">${avatarHtml(p.avatar, isChamp ? 84 : 64, 'border-4 border-white')}</div>
            <div class="relative z-10 bg-white text-[#333] px-3 py-1 rounded-[6px] font-display font-black text-base sm:text-lg mt-2 shadow">${esc(p.name)}</div>
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
              ${avatarHtml(p.avatar, 26)}
              <span>${esc(p.name)}</span>
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
    $('selfieReviewAvatar').innerHTML = avatarHtml(target.avatar, 54);
    $('selfieReviewName').textContent = target.name;
    $('selfieReviewFrom').textContent = `โดนสั่งถ่ายหน้าตลกโดย: ${target.selfieFrom || 'เพื่อน'}`;
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

  function applyRoomRender(room) {
    if (!room) return;
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
    renderLeaderboard(room);
    renderFeed(room);
    renderBonusBar(room);
    renderSelfieReview(room);
    if (room.status === 'ended') {
      stopSim();
      showPodium(room);
    } else {
      lastPodiumShown = false;
      el.podiumOverlay.classList.add('hidden');
      if (room.status === 'paused') {
        SFX.stopBgm();
      } else if (room.bonus) {
        SFX.startBgm('bonus');
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
    await Sync.transact(room => {
      if (!room) return;
      count = Game.giftRandomItemToAll(room);
      room.hostUpdatedAt = Date.now();
      return room;
    });
    if (!count) toast('ยังไม่มีผู้เล่นในห้องให้แจกไอเทม', 'warn');
    else toast(`${heroIconHtml('giftBox', 18)}<span>สุ่มแจกไอเทมให้ผู้เล่น ${count} คนเรียบร้อย!</span>`, 'success');
  });

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
    trackedBonusId = null;
    await Sync.transact(room => {
      const now = Date.now();
      const base = room || Sync.defaultRoom(roomCode);
      base.status = 'lobby';
      base.bonus = null;
      base.endedAt = null;
      base.usedBonus = {};
      base.players = {};
      base.feed = {};
      base.timerRunning = false;
      base.timerRemainingMs = (base.timerTotalSec || 0) * 1000;
      base.timerEpoch = (base.timerEpoch || 1) + 1;
      base.hostUpdatedAt = now;
      base.roundId = (base.roundId || 1) + 1;
      return base;
    });
    matchRemainingMs = ((Sync.room && Sync.room.timerTotalSec) || 0) * 1000;
    seenFeedIds.clear();
    selfiePhotoCache.clear();
    lastPodiumShown = false;
    el.podiumOverlay.classList.add('hidden');
    if (!silent) toast(`${uiIconHtml('refresh', 16)}<span>เริ่มเกมใหม่และล้างข้อมูลเดิมเรียบร้อยแล้ว</span>`, 'success');
  }

  function createNewPinRoom() {
    SFX.pop();
    stopSim();
    let nextPin = String(1000 + rand(9000));
    while (nextPin === roomCode) nextPin = String(1000 + rand(9000));
    location.href = `host.html?room=${nextPin}&new=1`;
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
        room.players[id] = Game.newPlayer(id, name, av, true);
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

      const others = players.filter(p => p.id !== bot.id);
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
      bonusRemainingSec: trackedBonusId ? Math.max(1, Math.ceil(bonusRemainingMs / 1000)) : null
    }));
    await Sync.connect(roomCode, onRoomUpdate, {
      isHost: true,
      onConn: onConnStatus,
      onBrokerChange: idx => {
        refreshJoinLinks(idx);
        toast(`${uiIconHtml('refresh', 16)}<span>สลับเซิร์ฟเวอร์สำรองอัตโนมัติ (อัปเดต QR Code แล้ว)</span>`, 'info', 3000);
      },
      onSelfie: (pid, photo) => {
        selfiePhotoCache.set(pid, photo);
        lastSelfieReqAt.delete(pid);
        if (Sync.room) renderSelfieReview(Sync.room);
      }
    });
    if (!Sync.room) {
      await Sync.transact(r => {
        const base = r || Sync.defaultRoom(roomCode);
        base.hostUpdatedAt = Date.now();
        return base;
      });
    } else if (forceNew || Sync.room.status === 'ended') {
      await clearRoomForNewGame(true);
    }
    refreshIcons();
  })();
})();
