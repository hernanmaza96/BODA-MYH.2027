'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const loader = document.getElementById('page-loader');

  /* ---------- Carga inicial ---------- */
  window.addEventListener('load', () => {
    setTimeout(() => loader?.classList.add('is-hidden'), 220);
  }, { once: true });
  setTimeout(() => loader?.classList.add('is-hidden'), 1800);

  /* ---------- Reveal ---------- */
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

  /* ---------- Apertura cinematográfica de puertas ---------- */
  const hero = document.getElementById('hero');
  const leftDoor = document.querySelector('.door-left');
  const rightDoor = document.querySelector('.door-right');
  let raf = 0;

  function updateDoors() {
    raf = 0;
    if (!hero) return;
    const distance = Math.max(1, hero.offsetHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / distance));
    const eased = 1 - Math.pow(1 - progress, 2.2);
    root.style.setProperty('--door-progress', eased.toFixed(4));
    root.style.setProperty('--hero-fade', Math.max(0, 1 - eased * 1.35).toFixed(4));
    if (progress >= 0.985) {
      root.style.setProperty('--door-progress', '1');
      root.style.setProperty('--hero-fade', '0');
    }
  }
  function requestDoorUpdate() {
    if (!raf) raf = requestAnimationFrame(updateDoors);
  }
  if (hero && !reducedMotion) {
    window.addEventListener('scroll', requestDoorUpdate, { passive: true });
    window.addEventListener('resize', requestDoorUpdate, { passive: true });
    updateDoors();
  } else {
    root.style.setProperty('--door-progress', '0');
    root.style.setProperty('--hero-fade', '1');
  }

  /* ---------- Audio + apertura del sobre ---------- */
  const opening = document.getElementById('envelope-opening');
  const envelope = document.getElementById('opening-envelope');
  const music = document.getElementById('wedding-audio');
  const musicPlayer = document.getElementById('music-player');
  const musicToggle = document.getElementById('music-toggle');
  let audioReady = false;

  function setMusicState(playing) {
    musicPlayer?.classList.toggle('is-playing', playing);
    musicToggle?.setAttribute('aria-pressed', String(playing));
    musicToggle?.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
  }

  function prepareMusic() {
    if (!music) return;
    music.volume = 0.78;
    music.muted = false;
    music.setAttribute('playsinline', '');
    try { music.load(); } catch (_) {}
    audioReady = true;
  }

  async function playMusicFromUserGesture() {
    if (!music) return false;
    prepareMusic();
    try {
      await music.play();
      setMusicState(true);
      return true;
    } catch (error) {
      console.warn('La reproducción automática fue bloqueada por el navegador:', error);
      setMusicState(false);
      return false;
    }
  }

  prepareMusic();
  music?.addEventListener('canplay', () => { audioReady = true; });
  music?.addEventListener('play', () => setMusicState(true));
  music?.addEventListener('pause', () => setMusicState(false));
  music?.addEventListener('error', () => {
    setMusicState(false);
    console.warn('No se pudo cargar audio/bailando-bachata.mp3. Verificá que el archivo exista con ese nombre.');
  });

  const openInvitation = async () => {
    if (!opening || !envelope || envelope.classList.contains('is-opening')) return;

    /* IMPORTANTE: play() ocurre directamente dentro del gesto de clic/touch. */
    const musicPromise = playMusicFromUserGesture();

    envelope.classList.add('is-opening');
    document.body.classList.add('invitation-opening');

    setTimeout(() => opening.classList.add('is-open'), 900);
    setTimeout(() => {
      opening.remove();
      document.body.classList.remove('invitation-locked', 'invitation-opening');
    }, 1750);

    await musicPromise;
  };

  document.body.classList.add('invitation-locked');
  envelope?.addEventListener('pointerup', openInvitation, { once: true });
  envelope?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openInvitation();
    }
  });

  /* ---------- Cuenta regresiva ---------- */
  const countdown = document.getElementById('countdown');
  if (countdown) {
    const target = new Date(countdown.dataset.countdownDate).getTime();
    const ids = ['cd-days', 'cd-hours', 'cd-minutes', 'cd-seconds'].map(id => document.getElementById(id));
    const updateCountdown = () => {
      const diff = Math.max(0, target - Date.now());
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor(diff / 3600000) % 24;
      const minutes = Math.floor(diff / 60000) % 60;
      const seconds = Math.floor(diff / 1000) % 60;
      [days, hours, minutes, seconds].forEach((value, i) => { if (ids[i]) ids[i].textContent = String(value).padStart(2, '0'); });
      if (diff <= 0) clearInterval(timer);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
  }

  /* ---------- Navegación flotante ---------- */
  const nav = document.getElementById('floating-nav');
  const toggleNav = () => nav?.classList.toggle('is-visible', window.scrollY > window.innerHeight * .72);
  window.addEventListener('scroll', toggleNav, { passive: true });
  toggleNav();

  /* ---------- Botón de música ---------- */
  musicToggle?.addEventListener('click', async () => {
    if (!music) return;
    try {
      if (music.paused) {
        await playMusicFromUserGesture();
      } else {
        music.pause();
      }
    } catch (_) {
      setMusicState(false);
    }
  });

  /* ---------- Copiar datos bancarios ---------- */
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

  /* ---------- Confirmación WhatsApp ---------- */
  const params = new URLSearchParams(window.location.search);
  const guestName = (params.get('n') || 'Familia Invitada').trim();
  const parsedCount = Number(params.get('c'));
  const totalGuests = Number.isFinite(parsedCount) && parsedCount > 0 ? Math.floor(parsedCount) : 1;
  const guestText = document.getElementById('confirm-guest-text');
  if (guestText) guestText.textContent = `Tu invitación es para ${totalGuests} ${totalGuests === 1 ? 'persona' : 'personas'}.`;

  const PHONE_GROOM = '5492266661409';
  const PHONE_BRIDE = '5492266661409';
  const EVENT_DATE = '20 de febrero de 2027 · 19:00 hs';
  const EVENT_PLACE = 'Urbana Lounge';
  const MAP_LINK = 'https://maps.app.goo.gl/ZsN1QgvrcwLaLR7JA';
  const modal = document.getElementById('contact-modal');
  const modalClose = document.getElementById('modal-close');
  const modalOverlay = document.getElementById('modal-overlay');
  const summary = document.getElementById('modal-action-summary');
  const lessContainer = document.getElementById('less-guests-container');
  const lessSelect = document.getElementById('less-guests-select');
  const groomLink = document.getElementById('whatsapp-groom');
  const brideLink = document.getElementById('whatsapp-bride');
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
      const option = document.createElement('option'); option.value = 1; option.textContent = '1 persona'; lessSelect.appendChild(option);
    }
  }

  function buildMessage() {
    if (action === 'all') return `¡Hola! Confirmo mi asistencia a la boda. 💍✨\n\nNombre: ${guestName}\nAsistentes: ${totalGuests} ${totalGuests === 1 ? 'persona' : 'personas'}\nFecha: ${EVENT_DATE}\nLugar: ${EVENT_PLACE}\nUbicación: ${MAP_LINK}\n\n¡Nos vemos muy pronto!`;
    if (action === 'less') {
      const selected = Number(lessSelect?.value || 1);
      return `¡Hola! Confirmo asistencia parcial a la boda. 💍✨\n\nNombre: ${guestName}\nAsistentes confirmados: ${selected} de ${totalGuests}\nFecha: ${EVENT_DATE}\nLugar: ${EVENT_PLACE}\nUbicación: ${MAP_LINK}\n\n¡Muchas gracias!`;
    }
    return `¡Hola! Lamentablemente no podremos acompañarlos en la boda. ❤️\n\nNombre: ${guestName}\nFecha: ${EVENT_DATE}\nLugar: ${EVENT_PLACE}\n\nLes deseamos lo mejor en este día tan especial.`;
  }

  function updateWhatsAppLinks() {
    const encoded = encodeURIComponent(buildMessage());
    if (groomLink) groomLink.href = `https://wa.me/${PHONE_GROOM}?text=${encoded}`;
    if (brideLink) brideLink.href = `https://wa.me/${PHONE_BRIDE}?text=${encoded}`;
  }

  function openModal(type) {
    action = type;
    if (type === 'all') {
      summary.textContent = `Confirmando asistencia para ${totalGuests} ${totalGuests === 1 ? 'persona' : 'personas'}.`;
      lessContainer?.setAttribute('hidden', '');
    } else if (type === 'less') {
      summary.textContent = 'Elegí cuántas personas asistirán.';
      setupLessGuests();
      lessContainer?.removeAttribute('hidden');
    } else {
      summary.textContent = 'Vamos a enviar que no podremos acompañarlos.';
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
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal?.classList.contains('is-open')) closeModal(); });
  /* ---------- Playlist: sugerencias por WhatsApp ---------- */
  const playlistModal = document.getElementById('playlist-modal');
  const playlistOpen = document.getElementById('open-playlist-form');
  const playlistClose = document.getElementById('playlist-modal-close');
  const playlistOverlay = document.getElementById('playlist-modal-overlay');
  const playlistSend = document.getElementById('playlist-send');
  const playlistName = document.getElementById('playlist-name');
  const playlistSong = document.getElementById('playlist-song');
  const playlistArtist = document.getElementById('playlist-artist');
  const PLAYLIST_PHONE = '5492266661409';

  function openPlaylistModal() {
    playlistModal?.classList.add('is-open');
    playlistModal?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setTimeout(() => playlistName?.focus(), 80);
  }
  function closePlaylistModal() {
    playlistModal?.classList.remove('is-open');
    playlistModal?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }
  playlistOpen?.addEventListener('click', openPlaylistModal);
  playlistClose?.addEventListener('click', closePlaylistModal);
  playlistOverlay?.addEventListener('click', closePlaylistModal);
  playlistSend?.addEventListener('click', () => {
    const name = playlistName?.value.trim() || 'Un invitado';
    const song = playlistSong?.value.trim();
    const artist = playlistArtist?.value.trim() || 'Artista no indicado';
    if (!song) {
      playlistSong?.focus();
      playlistSong?.classList.add('is-required');
      setTimeout(() => playlistSong?.classList.remove('is-required'), 900);
      return;
    }
    const message = `🎶 Sugerencia para la playlist de María & Hernán\n\nNombre: ${name}\nCanción: ${song}\nArtista: ${artist}\n\n¡Espero que suene en la fiesta! 💍✨`;
    window.open(`https://wa.me/${PLAYLIST_PHONE}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    closePlaylistModal();
  });

  /* ---------- Guardar fecha / compartir ---------- */
  const saveDate = document.getElementById('save-date');
  const shareInvitation = document.getElementById('share-invitation');
  saveDate?.addEventListener('click', () => {
    const ics = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Maria y Hernan//Invitacion de boda//ES',
      'BEGIN:VEVENT','UID:maria-hernan-20270220@invitacion',
      'DTSTAMP:20260929T120000Z','DTSTART:20270220T190000','DTEND:20270221T020000',
      'SUMMARY:Boda de María & Hernán','LOCATION:Urbana Lounge',
      'DESCRIPTION:Ceremonia y recepción · 20 de febrero de 2027 · 19:00 hs',
      'END:VEVENT','END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'Maria-y-Hernan-20-02-2027.ics';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  });
  shareInvitation?.addEventListener('click', async () => {
    const shareData = {title:'María & Hernán · Nuestra boda', text:'Te compartimos nuestra invitación de boda 💍✨'};
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        const old = shareInvitation.innerHTML; shareInvitation.innerHTML = '<span>✓</span> Enlace copiado';
        setTimeout(() => { shareInvitation.innerHTML = old; }, 1800);
      }
    } catch (_) {}
  });

});
