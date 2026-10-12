'use strict';

const CONFIG = {
  phones: {
    groom: '5492266661409',
    bride: '5492266535128'
  },
  event: {
    place: 'Urbana Lounge',
    mapLink: 'https://maps.app.goo.gl/ZsN1QgvrcwLaLR7JA',
    isoTimestamp: '2027-02-20T19:00:00-03:00',
    calendar: {
      title: 'Boda de María & Hernán',
      location: 'Urbana Lounge',
      description: 'Ceremonia y recepción en Urbana Lounge. ¡Te esperamos para celebrar juntos!',
      startLocal: '20270220T190000',
      endLocal: '20270221T010000',
      tzid: 'America/Argentina/Buenos_Aires'
    }
  },
  guest: {
    defaultName: 'Familia Invitada',
    defaultCount: 1
  }
};

const RSVP_STORAGE_KEY = 'mh-rsvp-v1';

document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = document.getElementById('page-loader');

  const hideLoader = () => loader?.classList.add('is-hidden');
  window.addEventListener('load', () => setTimeout(hideLoader, 220), { once: true });
  setTimeout(hideLoader, 1500);

  const reveal = document.querySelectorAll('.reveal-card, .reveal-section');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    reveal.forEach(el => observer.observe(el));
  } else {
    reveal.forEach(el => el.classList.add('is-visible'));
  }

  const opening = document.getElementById('envelope-opening');
  const envelope = document.getElementById('opening-envelope');

  const finishOpening = () => {
    if (!opening) return;
    opening.remove();
    document.body.classList.remove('invitation-locked');
  };

  const openInvitation = () => {
    if (!opening || !envelope || envelope.classList.contains('is-opening')) return;

    envelope.classList.add('is-opening');

    const openingMusic = document.getElementById('wedding-audio');
    if (openingMusic) {
      openingMusic.volume = 0.78;
      const p = openingMusic.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }

    if (reducedMotion) {
      opening.classList.add('is-instant');
      setTimeout(finishOpening, 200);
      return;
    }

    const HOLD_TIME = 6800;
    setTimeout(() => opening.classList.add('is-zooming'), HOLD_TIME);
    setTimeout(finishOpening, HOLD_TIME + 2000);
  };

  document.body.classList.add('invitation-locked');
  envelope?.addEventListener('click', openInvitation);
  envelope?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openInvitation(); }
  });

  const wait = (ms) => new Promise(res => setTimeout(res, ms));

  function smoothScrollTo(el, offsetTop = 0) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const targetY = window.scrollY + rect.top - offsetTop;
    window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
  }

  function scrollToElCentered(el, ratio = 0.22) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const targetY = window.scrollY + rect.top - vh * ratio;
    window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
  }

  const countdown = document.getElementById('countdown');
  let countdownTimer = null;
  const startCountdown = () => {
    if (!countdown || countdownTimer) return;
    const target = new Date(countdown.dataset.countdownDate).getTime();
    const ids = ['cd-days', 'cd-hours', 'cd-minutes', 'cd-seconds'].map(id => document.getElementById(id));
    const update = () => {
      const diff = Math.max(0, target - Date.now());
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor(diff / 3600000) % 24;
      const minutes = Math.floor(diff / 60000) % 60;
      const seconds = Math.floor(diff / 1000) % 60;
      [days, hours, minutes, seconds].forEach((value, i) => {
        if (ids[i]) ids[i].textContent = String(value).padStart(2, '0');
      });
      if (diff <= 0) clearInterval(countdownTimer);
    };
    update();
    countdownTimer = setInterval(update, 1000);
  };
  startCountdown();

  const timeline = document.getElementById('timeline');
  if (timeline) {
    const items = Array.from(timeline.querySelectorAll('.timeline-item'));

    const updateTimeline = () => {
      const now = new Date();
      const eventDate = new Date(CONFIG.event.isoTimestamp);

      const sameDay = now.getFullYear() === eventDate.getFullYear()
        && now.getMonth() === eventDate.getMonth()
        && now.getDate() === eventDate.getDate();

      if (!sameDay) {
        items.forEach(it => it.classList.remove('is-past', 'is-current'));
        return;
      }

      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      let currentIndex = -1;
      const itemMinutes = items.map(it => {
        const [h, m] = (it.dataset.time || '00:00').split(':').map(Number);
        return h * 60 + m;
      });

      itemMinutes.forEach((mins, i) => {
        if (mins <= nowMinutes) currentIndex = i;
      });

      items.forEach((it, i) => {
        it.classList.remove('is-past', 'is-current');
        if (i < currentIndex) it.classList.add('is-past');
        else if (i === currentIndex) it.classList.add('is-current');
      });
    };

    updateTimeline();
    setInterval(updateTimeline, 30000);
  }

  const dateBtn = document.getElementById('date-reveal-btn');
  const dateContent = document.getElementById('date-reveal-content');
  const preCounter = document.getElementById('date-precounter');
  const preCounterNum = document.getElementById('date-precounter-num');
  const preCounterHint = document.getElementById('date-precounter-hint');
  const dateMessage = document.getElementById('date-message');
  const petalsLayer = document.getElementById('petals-layer');

  const TICK_MS = 1400;

  const restartTickAnim = (el) => {
    if (!el) return;
    el.classList.remove('is-ticking');
    void el.offsetWidth;
    el.classList.add('is-ticking');
  };

  function launchPetals(total = 80) {
    if (!petalsLayer) return;
    petalsLayer.innerHTML = '';
    petalsLayer.classList.add('is-active');

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < total; i++) {
      const petal = document.createElement('span');
      petal.className = 'petal';

      const left = Math.random() * 100;
      const size = 10 + Math.random() * 14;
      const duration = 4.5 + Math.random() * 4;
      const delay = Math.random() * 2.2;
      const drift = (Math.random() - 0.5) * 220;
      const rot = 360 + Math.random() * 900;
      const scale = 0.75 + Math.random() * 0.55;

      petal.style.left = left + 'vw';
      petal.style.width = size + 'px';
      petal.style.height = (size * 1.15) + 'px';
      petal.style.setProperty('--duration', duration + 's');
      petal.style.setProperty('--delay', delay + 's');
      petal.style.setProperty('--drift', drift + 'px');
      petal.style.setProperty('--rot', rot + 'deg');
      petal.style.setProperty('--scale', scale.toFixed(2));

      fragment.appendChild(petal);
    }
    petalsLayer.appendChild(fragment);

    const totalTime = 4500 + 4000 + 2200 + 800;
    setTimeout(() => {
      petalsLayer.classList.remove('is-active');
      petalsLayer.innerHTML = '';
    }, totalTime);
  }

  async function runPreCountdownAsync() {
    if (!preCounter || !preCounterNum) return;

    preCounter.removeAttribute('hidden');
    preCounter.setAttribute('aria-hidden', 'false');
    preCounter.classList.remove('is-hidden');

    await wait(80);
    scrollToElCentered(preCounter, 0.22);

    let n = 10;
    preCounterNum.textContent = String(n);
    restartTickAnim(preCounterNum);
    await wait(TICK_MS);

    while (n > 0) {
      n--;
      preCounterNum.textContent = String(n);
      restartTickAnim(preCounterNum);
      await wait(TICK_MS);
    }

    await wait(700);
  }

  async function hidePreCounterAsync() {
    if (!preCounter) return;
    preCounter.classList.add('is-hidden');
    await wait(600);
    preCounter.setAttribute('hidden', '');
    preCounter.setAttribute('aria-hidden', 'true');
    preCounter.classList.remove('is-hidden');
  }

  async function typeLine(el, text, baseSpeed = 42) {
    if (!el) return;
    const chars = Array.from(text);
    el.textContent = '';
    el.classList.add('is-typing');

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      el.textContent += ch;

      let delay = baseSpeed;
      if (ch === '.' || ch === '!' || ch === '?' || ch === '…') delay = 340;
      else if (ch === ',' || ch === ';' || ch === ':') delay = 190;

      delay += Math.random() * 18;
      await wait(delay);
    }

    el.classList.remove('is-typing');
  }

  const TYPEWRITER_LINES = [
    '¡La ansiedad es parte del plan! 😂',
    'Si ustedes están ansiosos por saber la fecha, imagínense cómo estamos nosotros.',
    'Aunque, entre nosotros… ¡nos encanta tenerlos así de curiosos! ❤️',
    '¿Están listos?'
  ];

  async function showTypewriterAsync() {
    if (!dateMessage) return;

    dateMessage.removeAttribute('hidden');
    dateMessage.setAttribute('aria-hidden', 'false');

    await wait(80);
    dateMessage.classList.add('is-visible');

    scrollToElCentered(dateMessage, 0.18);
    await wait(500);

    const lines = Array.from(dateMessage.querySelectorAll('[data-type-line]'));

    for (let i = 0; i < lines.length; i++) {
      const text = TYPEWRITER_LINES[i] || '';
      const speed = text.length > 55 ? 38 : 46;
      await typeLine(lines[i], text, speed);

      if (i < lines.length - 1) {
        await wait(520);
      }
    }

    await wait(1400);
  }

  async function hideTypewriterAsync() {
    if (!dateMessage) return;
    dateMessage.classList.add('is-hidden');
    await wait(600);
    dateMessage.classList.remove('is-visible');
    dateMessage.classList.remove('is-hidden');
    dateMessage.setAttribute('hidden', '');
    dateMessage.setAttribute('aria-hidden', 'true');
    dateMessage.querySelectorAll('[data-type-line]').forEach(p => p.textContent = '');
  }

  function revealDateContent() {
    if (!dateContent) return;
    dateContent.removeAttribute('hidden');
    startCountdown();

    setTimeout(() => {
      const calendar = dateContent.querySelector('.calendar') || dateContent;
      const isMobile = window.innerWidth <= 720;
      const offset = isMobile ? 12 : 40;
      smoothScrollTo(calendar, offset);
    }, 260);
  }

  async function runFullReveal() {
    await runPreCountdownAsync();
    await hidePreCounterAsync();
    await showTypewriterAsync();
    await hideTypewriterAsync();

    if (preCounterHint) preCounterHint.textContent = 'Ahora sí…';
    await runPreCountdownAsync();

    launchPetals();
    await wait(700);

    await hidePreCounterAsync();
    revealDateContent();
  }

  if (dateBtn && dateContent) {
    dateBtn.addEventListener('click', () => {
      if (dateBtn.classList.contains('is-hidden')) return;

      dateBtn.classList.add('is-hidden');
      dateBtn.setAttribute('aria-expanded', 'true');

      setTimeout(() => {
        runFullReveal().catch(err => console.error('[reveal date]', err));
      }, 420);
    });
  }

  const cal = CONFIG.event.calendar;

  function buildGoogleCalendarUrl() {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: cal.title,
      dates: `${cal.startLocal}/${cal.endLocal}`,
      ctz: cal.tzid,
      details: cal.description,
      location: cal.location
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  function buildIcsContent() {
    const uid = `${Date.now()}@maria-y-hernan-boda`;
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Maria y Hernan//Boda//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${cal.startLocal}Z`,
      `DTSTART;TZID=${cal.tzid}:${cal.startLocal}`,
      `DTEND;TZID=${cal.tzid}:${cal.endLocal}`,
      `SUMMARY:${cal.title}`,
      `LOCATION:${cal.location}`,
      `DESCRIPTION:${cal.description.replace(/\n/g, '\\n')}`,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Recordatorio',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  const googleBtn = document.getElementById('add-google-calendar');
  if (googleBtn) {
    googleBtn.href = buildGoogleCalendarUrl();
  }

  const icsBtn = document.getElementById('add-ics-calendar');
  icsBtn?.addEventListener('click', () => {
    const content = buildIcsContent();
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'boda-maria-hernan.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  const playlistBtn = document.getElementById('playlist-btn');
  const playlistModal = document.getElementById('playlist-modal');
  const playlistOverlay = document.getElementById('playlist-overlay');
  const playlistClose = document.getElementById('playlist-modal-close');
  const playlistForm = document.getElementById('playlist-form');
  const playlistSongsContainer = document.getElementById('playlist-songs');
  const playlistAddBtn = document.getElementById('playlist-add');
  const playlistSuccess = document.getElementById('playlist-success');

  let songIndex = 0;
  let successTimer = null;

  function createSongBlock(index) {
    const block = document.createElement('div');
    block.className = 'playlist-song';
    block.setAttribute('data-song-block', '');

    const songId = `playlist-song-${index}`;
    const artistId = `playlist-artist-${index}`;

    block.innerHTML = `
      <div class="playlist-song__head">
        <span class="playlist-song__num">Canción ${index + 1}</span>
        <button type="button" class="playlist-song__remove" aria-label="Quitar esta canción" data-remove-song hidden>×</button>
      </div>
      <div class="playlist-field">
        <label for="${songId}">Título <span>· opcional</span></label>
        <input type="text" id="${songId}" name="song[]" placeholder="Ej: Bailando Bachata" autocomplete="off" />
      </div>
      <div class="playlist-field">
        <label for="${artistId}">Artista <span>· opcional</span></label>
        <input type="text" id="${artistId}" name="artist[]" placeholder="Ej: Chayanne" autocomplete="off" />
      </div>
    `;
    return block;
  }

  function refreshSongNumbers() {
    if (!playlistSongsContainer) return;
    const blocks = playlistSongsContainer.querySelectorAll('[data-song-block]');
    const total = blocks.length;
    blocks.forEach((block, i) => {
      const num = block.querySelector('.playlist-song__num');
      if (num) num.textContent = `Canción ${i + 1}`;
      const removeBtn = block.querySelector('[data-remove-song]');
      if (removeBtn) {
        removeBtn.hidden = (total === 1);
      }
    });
  }

  function resetSongs() {
    if (!playlistSongsContainer) return;
    playlistSongsContainer.innerHTML = '';
    songIndex = 0;
    playlistSongsContainer.appendChild(createSongBlock(0));
    refreshSongNumbers();
  }

  function addSongBlock() {
    if (!playlistSongsContainer) return;
    songIndex++;
    const block = createSongBlock(songIndex);
    playlistSongsContainer.appendChild(block);
    refreshSongNumbers();
    setTimeout(() => {
      const input = block.querySelector('input');
      if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input.focus();
      }
    }, 60);
  }

  resetSongs();

  playlistAddBtn?.addEventListener('click', addSongBlock);

  playlistSongsContainer?.addEventListener('click', e => {
    const removeBtn = e.target.closest('[data-remove-song]');
    if (!removeBtn) return;
    const blocks = playlistSongsContainer.querySelectorAll('[data-song-block]');
    if (blocks.length <= 1) return;
    const block = removeBtn.closest('[data-song-block]');
    if (!block) return;

    block.style.transition = 'opacity .25s ease, transform .25s ease';
    block.style.opacity = '0';
    block.style.transform = 'translateY(-6px)';
    setTimeout(() => {
      block.remove();
      refreshSongNumbers();
    }, 220);
  });

  function openPlaylistModal() {
    if (!playlistModal) return;
    playlistModal.classList.add('is-open');
    playlistModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setTimeout(() => {
      const first = document.getElementById('playlist-song-0');
      first?.focus();
    }, 60);
  }
  function closePlaylistModal() {
    if (!playlistModal) return;
    playlistModal.classList.remove('is-open');
    playlistModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (successTimer) {
      clearTimeout(successTimer);
      successTimer = null;
    }
    setTimeout(() => {
      if (playlistSuccess) {
        playlistSuccess.hidden = true;
        playlistSuccess.setAttribute('aria-hidden', 'true');
      }
      if (playlistForm) playlistForm.hidden = false;
    }, 300);
  }

  playlistBtn?.addEventListener('click', openPlaylistModal);
  playlistClose?.addEventListener('click', closePlaylistModal);
  playlistOverlay?.addEventListener('click', closePlaylistModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && playlistModal?.classList.contains('is-open')) closePlaylistModal();
  });

  playlistForm?.addEventListener('submit', e => {
    e.preventDefault();

    const data = new FormData(playlistForm);
    const songs = data.getAll('song[]').map(s => String(s).trim());
    const artists = data.getAll('artist[]').map(s => String(s).trim());
    const name = String(data.get('name') || '').trim();
    const message = String(data.get('message') || '').trim();

    const entries = [];
    const max = Math.max(songs.length, artists.length);
    for (let i = 0; i < max; i++) {
      const s = songs[i] || '';
      const a = artists[i] || '';
      if (s || a) entries.push({ song: s, artist: a });
    }

    let text = '';

    if (entries.length === 0) {
      text = '¡Hola! Quiero recomendar una canción para la playlist de la boda 🎶';
    } else if (entries.length === 1) {
      const e0 = entries[0];
      text = '¡Hola! Quiero recomendar una canción para la playlist de la boda 🎶\n\n';
      if (e0.song)   text += `🎵 Canción: ${e0.song}\n`;
      if (e0.artist) text += `🎤 Artista: ${e0.artist}\n`;
    } else {
      text = `¡Hola! Quiero recomendar ${entries.length} canciones para la playlist de la boda 🎶\n\n`;
      entries.forEach((entry, i) => {
        const parts = [];
        if (entry.song)   parts.push(entry.song);
        if (entry.artist) parts.push(entry.artist);
        text += `${i + 1}. 🎵 ${parts.join(' · ')}\n`;
      });
    }

    if (name)    text += `\n🙋 De parte de: ${name}`;
    if (message) text += `\n💌 Mensaje: ${message}`;

    if (entries.length > 0) text += '\n\n¡Gracias!';

    window.open(`https://wa.me/${CONFIG.phones.bride}?text=${encodeURIComponent(text)}`, '_blank');

    if (playlistForm && playlistSuccess) {
      playlistForm.hidden = true;
      playlistSuccess.hidden = false;
      playlistSuccess.setAttribute('aria-hidden', 'false');
      const path = playlistSuccess.querySelector('.playlist-success__check path');
      if (path) {
        path.style.animation = 'none';
        void path.offsetWidth;
        path.style.animation = '';
      }
      playlistForm.reset();
      resetSongs();

      successTimer = setTimeout(() => {
        closePlaylistModal();
      }, 2600);
    } else {
      playlistForm.reset();
      resetSongs();
      setTimeout(() => closePlaylistModal(), 300);
    }
  });

  const nav = document.getElementById('floating-nav');
  const toggleNav = () => nav?.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.5);
  window.addEventListener('scroll', toggleNav, { passive: true });
  toggleNav();

  const music = document.getElementById('wedding-audio');
  const musicPlayer = document.getElementById('music-player');
  const musicToggle = document.getElementById('music-toggle');
  function setMusicState(playing) {
    musicPlayer?.classList.toggle('is-playing', playing);
    musicToggle?.setAttribute('aria-pressed', String(playing));
    musicToggle?.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
  }
  music?.addEventListener('play', () => setMusicState(true));
  music?.addEventListener('pause', () => setMusicState(false));
  musicToggle?.addEventListener('click', async () => {
    if (!music) return;
    try {
      if (music.paused) await music.play(); else music.pause();
    } catch (_) {
      setMusicState(false);
    }
  });

  document.querySelectorAll('.copy-button').forEach(button => {
    button.addEventListener('click', async () => {
      const target = document.getElementById(button.dataset.copyTarget);
      if (!target) return;
      const text = target.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        const range = document.createRange();
        range.selectNodeContents(target);
        const selection = window.getSelection();
        selection.removeAllRanges(); selection.addRange(range);
        document.execCommand('copy'); selection.removeAllRanges();
      }
      const original = button.textContent;
      button.textContent = '¡Copiado!';
      button.classList.add('is-copied');
      setTimeout(() => { button.textContent = original; button.classList.remove('is-copied'); }, 1700);
    });
  });

  const params = new URLSearchParams(window.location.search);
  const guestName = (params.get('n') || CONFIG.guest.defaultName).trim();
  const parsedCount = Number(params.get('c'));
  const totalGuests = Number.isFinite(parsedCount) && parsedCount > 0 ? Math.floor(parsedCount) : CONFIG.guest.defaultCount;
  const guestText = document.getElementById('confirm-guest-text');
  if (guestText) guestText.textContent = `Tu invitación es para ${totalGuests} ${totalGuests === 1 ? 'persona' : 'personas'}.`;

  const PHONE_GROOM = CONFIG.phones.groom;
  const PHONE_BRIDE = CONFIG.phones.bride;
  const EVENT_PLACE = CONFIG.event.place;
  const MAP_LINK = CONFIG.event.mapLink;

  const modal = document.getElementById('contact-modal');
  const modalClose = document.getElementById('modal-close');
  const modalOverlay = document.getElementById('modal-overlay');
  const summary = document.getElementById('modal-action-summary');
  const lessContainer = document.getElementById('less-guests-container');
  const lessSelect = document.getElementById('less-guests-select');
  const groomLink = document.getElementById('whatsapp-groom');
  const brideLink = document.getElementById('whatsapp-bride');
  const confirmActions = document.getElementById('confirm-actions');
  const confirmDone = document.getElementById('confirm-done');
  const confirmDoneText = document.getElementById('confirm-done-text');
  const confirmDoneReset = document.getElementById('confirm-done-reset');
  let action = 'all';

  function setupLessGuests() {
    if (!lessSelect) return;
    lessSelect.innerHTML = '';
    for (let i = 1; i < totalGuests; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${i} ${i === 1 ? 'persona' : 'personas'}`;
      lessSelect.appendChild(option);
    }
    if (!lessSelect.options.length) {
      const option = document.createElement('option');
      option.value = 1;
      option.textContent = '1 persona';
      lessSelect.appendChild(option);
    }
  }

  function buildMessage() {
    if (action === 'all') return `¡Hola! Confirmo mi asistencia a la boda. 💍✨\n\nNombre: ${guestName}\nAsistentes: ${totalGuests} ${totalGuests === 1 ? 'persona' : 'personas'}\nLugar: ${EVENT_PLACE}\nUbicación: ${MAP_LINK}\n\n¡Nos vemos muy pronto!`;
    if (action === 'less') {
      const selected = Number(lessSelect?.value || 1);
      return `¡Hola! Confirmo asistencia parcial a la boda. 💍✨\n\nNombre: ${guestName}\nAsistentes confirmados: ${selected} de ${totalGuests}\nLugar: ${EVENT_PLACE}\nUbicación: ${MAP_LINK}\n\n¡Muchas gracias!`;
    }
    return `¡Hola! Lamentablemente no podremos acompañarlos en la boda. ❤️\n\nNombre: ${guestName}\nLugar: ${EVENT_PLACE}\n\nLes deseamos lo mejor en este día tan especial.`;
  }

  function updateWhatsAppLinks() {
    const encoded = encodeURIComponent(buildMessage());
    if (groomLink) groomLink.href = `https://wa.me/${PHONE_GROOM}?text=${encoded}`;
    if (brideLink) brideLink.href = `https://wa.me/${PHONE_BRIDE}?text=${encoded}`;
  }

  function loadRsvp() {
    try {
      const raw = localStorage.getItem(RSVP_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveRsvp(type, count) {
    try {
      localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify({
        type,
        count: count || 0,
        guests: totalGuests,
        name: guestName,
        timestamp: Date.now()
      }));
    } catch (_) {}
  }

  function clearRsvp() {
    try { localStorage.removeItem(RSVP_STORAGE_KEY); } catch (_) {}
  }

  function getRsvpMessage(saved) {
    if (!saved) return '';
    if (saved.type === 'all') {
      return `Confirmaste tu asistencia para ${saved.guests} ${saved.guests === 1 ? 'persona' : 'personas'}. ¡Nos vemos pronto! ✨`;
    }
    if (saved.type === 'less') {
      return `Confirmaste que asistirán ${saved.count} de ${saved.guests} personas. ¡Gracias por avisarnos! ✨`;
    }
    return `Registramos que no podrán acompañarnos. Gracias por avisarnos. ❤️`;
  }

  function renderRsvpDone(saved) {
    if (!confirmActions || !confirmDone) return;
    confirmActions.hidden = true;
    confirmDone.hidden = false;
    if (confirmDoneText) confirmDoneText.textContent = getRsvpMessage(saved);

    const path = confirmDone.querySelector('.confirm-done__check path');
    if (path) {
      path.style.animation = 'none';
      void path.offsetWidth;
      path.style.animation = '';
    }
  }

  function renderRsvpActions() {
    if (!confirmActions || !confirmDone) return;
    confirmActions.hidden = false;
    confirmDone.hidden = true;
  }

  const savedRsvp = loadRsvp();
  if (savedRsvp) {
    renderRsvpDone(savedRsvp);
  } else {
    renderRsvpActions();
  }

  confirmDoneReset?.addEventListener('click', () => {
    clearRsvp();
    renderRsvpActions();
  });

  function openModal(type) {
    action = type;
    if (type === 'all') {
      if (summary) summary.textContent = `Confirmando asistencia para ${totalGuests} ${totalGuests === 1 ? 'persona' : 'personas'}.`;
      lessContainer?.setAttribute('hidden', '');
    } else if (type === 'less') {
      if (summary) summary.textContent = 'Elegí cuántas personas asistirán.';
      setupLessGuests();
      lessContainer?.removeAttribute('hidden');
    } else {
      if (summary) summary.textContent = 'Vamos a enviar que no podremos acompañarlos.';
      lessContainer?.setAttribute('hidden', '');
    }
    updateWhatsAppLinks();
    modal?.classList.add('is-open');
    modal?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setTimeout(() => modalClose?.focus(), 50);
  }
  function closeModal() {
    modal?.classList.remove('is-open');
    modal?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }
  document.getElementById('btn-confirm-all')?.addEventListener('click', () => openModal('all'));
  document.getElementById('btn-confirm-less')?.addEventListener('click', () => openModal('less'));
  document.getElementById('btn-decline')?.addEventListener('click', () => openModal('none'));
  modalClose?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', closeModal);
  lessSelect?.addEventListener('change', updateWhatsAppLinks);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal?.classList.contains('is-open')) closeModal();
  });

  groomLink?.addEventListener('click', () => {
    const count = action === 'less' ? Number(lessSelect?.value || 1) : totalGuests;
    saveRsvp(action, count);
    setTimeout(() => {
      renderRsvpDone(loadRsvp());
    }, 400);
  });
  brideLink?.addEventListener('click', () => {
    const count = action === 'less' ? Number(lessSelect?.value || 1) : totalGuests;
    saveRsvp(action, count);
    setTimeout(() => {
      renderRsvpDone(loadRsvp());
    }, 400);
  });

  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCount = document.getElementById('lightbox-count');
  let lightboxIndex = 0;
  let lastFocused = null;

  function showPhoto(index) {
    if (!lightboxImg || !galleryItems.length) return;
    lightboxIndex = (index + galleryItems.length) % galleryItems.length;
    const photo = galleryItems[lightboxIndex].querySelector('img');
    lightboxImg.src = photo.getAttribute('src');
    lightboxImg.alt = photo.alt;
    if (lightboxCount) {
      lightboxCount.textContent = `${String(lightboxIndex + 1).padStart(2, '0')} / ${String(galleryItems.length).padStart(2, '0')}`;
    }
    const fig = lightbox.querySelector('.lightbox__figure');
    if (fig) {
      fig.style.animation = 'none';
      void fig.offsetWidth;
      fig.style.animation = '';
    }
  }
  function openLightbox(index) {
    if (!lightbox) return;
    lastFocused = document.activeElement;
    showPhoto(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    document.getElementById('lightbox-close')?.focus();
  }
  function closeLightbox() {
    lightbox?.classList.remove('is-open');
    lightbox?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    lastFocused?.focus?.();
  }
  galleryItems.forEach((item, i) => item.addEventListener('click', () => openLightbox(i)));
  document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev')?.addEventListener('click', () => showPhoto(lightboxIndex - 1));
  document.getElementById('lightbox-next')?.addEventListener('click', () => showPhoto(lightboxIndex + 1));
  lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lightbox?.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPhoto(lightboxIndex - 1);
    if (e.key === 'ArrowRight') showPhoto(lightboxIndex + 1);
  });
  let touchStartX = 0;
  lightbox?.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  lightbox?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) showPhoto(lightboxIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });

  const mapLink = document.querySelector('.map-link');
  mapLink?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.open(mapLink.href, '_blank', 'noopener');
    }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
});