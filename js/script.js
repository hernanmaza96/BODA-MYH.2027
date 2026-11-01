'use strict';
/* ============================================================
TOASTS
============================================================ */
const Toast = (() => {
const ICONS = {
success: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>',
info:    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M11 12h1v5"/></svg>',
error:   '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.01"/></svg>',
heart:   '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 21s-7-4.5-9-9c-1.2-2.8.6-6 3.8-6C8.6 6 10 7 12 9c2-2 3.4-3 5.2-3 3.2 0 5 3.2 3.8 6-2 4.5-9 9-9 9z"/></svg>'
};
function getStack() {
let el = document.getElementById('toast-container');
if (!el) {
el = document.createElement('div');
el.id = 'toast-container';
el.className = 'toast-container';
el.setAttribute('aria-live', 'polite');
el.setAttribute('aria-atomic', 'true');
document.body.appendChild(el);
}
return el;
}
function dismiss(toast) {
if (!toast || toast.classList.contains('is-leaving')) return;
toast.classList.add('is-leaving');
toast.addEventListener('animationend', () => toast.remove(), { once: true });
}
function show(message, variant = 'info', duration = 2800) {
const stack = getStack();
const live = stack.querySelectorAll('.toast:not(.is-leaving)');
if (live.length >= 3) dismiss(live[0]);
const toast = document.createElement('div');
toast.className = `toast toast--${variant}`;
toast.innerHTML = `<span class="toast__icon">${ICONS[variant] || ICONS.info}</span><span class="toast__message"></span>`;
toast.querySelector('.toast__message').textContent = message;
stack.appendChild(toast);
const timer = setTimeout(() => dismiss(toast), duration);
toast.addEventListener('click', () => { clearTimeout(timer); dismiss(toast); });
return toast;
}
return { show, dismiss };
})();
/* ============================================================
FOCUS TRAP
============================================================ */
function trapFocus(container, e) {
if (e.key !== 'Tab' || !container) return;
const focusables = container.querySelectorAll(
'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
);
if (!focusables.length) return;
const list = Array.from(focusables).filter(el => el.offsetParent !== null);
if (!list.length) return;
const first = list[0], last = list[list.length - 1];
if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
}
/* ============================================================
CONFIG
============================================================ */
const CONFIG = {
phones: {
groom: '5492266661409',
bride: '5492266535128'
},
event: {
place: 'Urbana Lounge',
mapLink: 'https://www.google.com/maps?q=-37.8745289,-58.289135&z=17&hl=es',
isoTimestamp: '2027-02-20T19:00:00-03:00',
endTimestamp: '2027-02-21T01:00:00-03:00',
rsvpDeadline: '2027-01-10T23:59:59-03:00',
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
},
appsScript: {
url: 'https://script.google.com/macros/s/AKfycbwdqqHPoIuHWnnjDPbMWXhq8ovbwVPYuXX7i2mhZVkivZDf-DDfwqYvwuyS-j33DjmA/exec'
},
playlistApp: {
url: 'https://script.google.com/macros/s/AKfycbxe9DXL1m3cpvFdjk2MlwbC7QRvTSlmIo1z8Z4dgmOraBq5bxKCxzaQMZgtLMOImcz5JA/exec'
},
albumApp: {
url: 'https://script.google.com/macros/s/AKfycbxgI8da3FxHj3_4MjxPrbfEEEpMOzkhLDOOS6ua6xEVCMhlCSbIZDIgjiIDJClKrqLaaQ/exec'
}
};
const RSVP_STORAGE_KEY = 'mh-rsvp-v2';
const MUSIC_STORAGE_KEY = 'mh-music-v1';
const ENVELOPE_STORAGE_KEY = 'mh-opened-v1';
const PLAYLIST_DRAFT_KEY = 'mh-playlist-draft-v1';
const THEME_STORAGE_KEY = 'mh-theme-v1';
/* ============================================================
GOOGLE APPS SCRIPT — envío (RSVP)
============================================================ */
const SheetsAPI = (() => {
async function send(payload) {
const url = CONFIG.appsScript.url;
if (!url) { console.warn('[SheetsAPI] URL no configurada'); return { ok: false }; }
const body = JSON.stringify({
...payload,
userAgent: navigator.userAgent,
referrer: document.referrer || '',
pageUrl: location.href,
timestamp: new Date().toISOString()
});
try {
await fetch(url, {
method: 'POST',
mode: 'no-cors',
headers: { 'Content-Type': 'text/plain;charset=utf-8' },
body
});
return { ok: true };
} catch (err) {
try {
const params = new URLSearchParams({ payload: body });
const img = new Image();
img.src = `${url}?${params.toString()}`;
return { ok: true, fallback: true };
} catch (e2) {
console.warn('[SheetsAPI] Falló el envío', err);
return { ok: false, error: err };
}
}
}
return { send };
})();
/* ============================================================
DETECCIÓN DE HARDWARE LENTO
============================================================ */
(function detectLowEnd() {
try {
const lowCpu = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
const lowRam = navigator.deviceMemory && navigator.deviceMemory <= 2;
const saveData = navigator.connection && navigator.connection.saveData === true;
const slowNet = navigator.connection
&& navigator.connection.effectiveType
&& ['slow-2g', '2g'].includes(navigator.connection.effectiveType);
if (lowCpu || lowRam || saveData || slowNet) {
document.body.classList.add('low-end');
}
} catch (_) {}
})();
/* ============================================================
TEMA CLARO/OSCURO (automático según el sistema del celular)
============================================================ */
(function initTheme() {
const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
const updateMeta = (isLight) => {
const meta = document.querySelector('meta[name="theme-color"]');
if (meta) meta.content = isLight ? '#f2ecdc' : '#3a4020';
};
const applyTheme = (isLight) => {
if (isLight) {
document.body.classList.add('theme-light');
} else {
document.body.classList.remove('theme-light');
}
updateMeta(isLight);
};
applyTheme(mediaQuery.matches);
const onSystemThemeChange = (e) => applyTheme(e.matches);
if (typeof mediaQuery.addEventListener === 'function') {
mediaQuery.addEventListener('change', onSystemThemeChange);
} else if (typeof mediaQuery.addListener === 'function') {
mediaQuery.addListener(onSystemThemeChange);
}
try { localStorage.removeItem(THEME_STORAGE_KEY); } catch (_) {}
})();
/* ============================================================
APP
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const loader = document.getElementById('page-loader');
const testMode = new URLSearchParams(window.location.search).get('test');
if (testMode) {
document.body.dataset.testMode = testMode;
}
const BANNER_HTML =
'<div class="event-day-banner__glow" aria-hidden="true"></div>' +
'<div class="event-day-banner__inner">' +
'<span class="event-day-banner__kicker">' +
'<span class="event-day-banner__star" aria-hidden="true">✦</span>' +
'Hoy es el gran día' +
'<span class="event-day-banner__star" aria-hidden="true">✦</span>' +
'</span>' +
'<span class="event-day-banner__title">¡Nos casamos!</span>' +
'<span class="event-day-banner__names">María <em>&</em> Hernán</span>' +
'<span class="event-day-banner__subtitle">Los esperamos a las 19:00</span>' +
'</div>';
const POST_BANNER_HTML =
'<div class="event-day-banner__glow" aria-hidden="true"></div>' +
'<div class="event-day-banner__hearts" aria-hidden="true">' +
'<span class="event-day-banner__heart">♡</span>' +
'<span class="event-day-banner__heart">♡</span>' +
'<span class="event-day-banner__heart">♡</span>' +
'<span class="event-day-banner__heart">♡</span>' +
'</div>' +
'<div class="event-day-banner__inner">' +
'<span class="event-day-banner__kicker">' +
'<span class="event-day-banner__star" aria-hidden="true">✦</span>' +
'Un recuerdo para toda la vida' +
'<span class="event-day-banner__star" aria-hidden="true">✦</span>' +
'</span>' +
'<span class="event-day-banner__title">Gracias por acompañarnos en el día más feliz de nuestras vidas</span>' +
'<span class="event-day-banner__names">María <em>&</em> Hernán</span>' +
'<span class="event-day-banner__subtitle">Su presencia hizo que nuestro sueño fuera aún más hermoso</span>' +
'</div>';
if (testMode === 'event-day') {
document.body.classList.add('event-day');
const banner = document.getElementById('event-day-banner');
if (banner) {
banner.innerHTML = BANNER_HTML;
banner.removeAttribute('hidden');
banner.setAttribute('aria-hidden', 'false');
}
}
if (testMode === 'post-boda') {
document.body.classList.add('post-boda');
const banner = document.getElementById('event-day-banner');
if (banner) {
banner.classList.add('event-day-banner--post');
banner.innerHTML = POST_BANNER_HTML;
banner.removeAttribute('hidden');
banner.setAttribute('aria-hidden', 'false');
}
const skipBtn = document.getElementById('date-skip-btn');
if (skipBtn) skipBtn.removeAttribute('hidden');
const galleryAlbumCta = document.getElementById('gallery-album-cta');
if (galleryAlbumCta) galleryAlbumCta.removeAttribute('hidden');
const caption = document.querySelector('.countdown-caption');
if (caption) caption.textContent = '¡Nos casamos! Gracias por ser parte 💛';
}
const hideLoader = () => loader?.classList.add('is-hidden');
// El loader se oculta cuando el sobre cerrado ya está listo (así no aparece vacío ni "de golpe").
// Tope de seguridad de 4 s para no dejar la pantalla esperando si la conexión es muy lenta.
const closedEnvelopeImgs = Array.from(document.querySelectorAll('.env-front, .env-seal__half'));
const imgReady = img => new Promise(resolve => {
if (img.complete && img.naturalWidth > 0) { resolve(); return; }
img.addEventListener('load', resolve, { once: true });
img.addEventListener('error', resolve, { once: true });
});
const envelopeReady = Promise.all(closedEnvelopeImgs.map(imgReady));
const envelopeSettled = Promise.race([
envelopeReady.then(() => Promise.all(closedEnvelopeImgs.map(img => (img.decode ? img.decode().catch(() => {}) : null)))),
new Promise(resolve => setTimeout(resolve, 4000))
]);
envelopeSettled.then(() => setTimeout(hideLoader, 120));
/* ============================================================
REVEAL
============================================================ */
const closingCard = document.querySelector('.closing-content');
const reveal = Array.from(document.querySelectorAll('.reveal-card, .reveal-section')).filter(el => el !== closingCard);
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
/* ============================================================
ÚLTIMA PÁGINA — la animación se repite cada vez que se llega
y se desarma en orden inverso al irse (firma, texto, título, sello)
============================================================ */
if (closingCard) {
if (reducedMotion || !('IntersectionObserver' in window)) {
closingCard.classList.add('is-visible');
} else {
const ENTER_AT = 0.12;
const LEAVE_AT = 0.5;
const UNWIND_MS = 2400;
const FADE_MS = 1200;
let state = 'idle';
let prevRatio = 0;
let lastRatio = 0;
let timers = [];
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
const enter = () => {
clearTimers();
if (state === 'out') {
closingCard.classList.remove('is-visible', 'is-leaving');
void closingCard.offsetWidth;
}
state = 'in';
closingCard.classList.add('is-visible');
};
const leave = () => {
clearTimers();
state = 'out';
closingCard.classList.add('is-leaving');
timers.push(setTimeout(() => {
closingCard.classList.remove('is-visible');
timers.push(setTimeout(() => {
closingCard.classList.remove('is-leaving');
state = 'idle';
if (lastRatio >= ENTER_AT) enter();
}, FADE_MS));
}, UNWIND_MS));
};
new IntersectionObserver(entries => {
const entry = entries[entries.length - 1];
const r = entry.isIntersecting ? entry.intersectionRatio : 0;
const prev = prevRatio;
prevRatio = lastRatio = r;
if (state === 'in') {
if (r < ENTER_AT || (r < LEAVE_AT && prev >= LEAVE_AT)) leave();
} else if (state === 'out') {
if (r >= LEAVE_AT) enter();
} else if (r >= ENTER_AT) {
enter();
}
}, { threshold: [0, ENTER_AT, LEAVE_AT], rootMargin: '0px 0px -7% 0px' }).observe(closingCard);
}
}
/* ============================================================
SOBRE
============================================================ */
const opening = document.getElementById('envelope-opening');
const envelope = document.getElementById('opening-envelope');
const finishOpening = () => {
if (!opening || opening.dataset.closed === '1') return;
opening.dataset.closed = '1';
opening.classList.add('is-open');
document.body.classList.remove('invitation-locked');
setTimeout(() => opening.remove(), 1100);
};
/* ============================================================
MÚSICA
============================================================ */
const MUSIC_VOLUME = 0.42;
let musicFadeTimer = null;
let musicUserPaused = false;
let musicWanted = false;
let musicRetryArmed = false;
const fadeMusic = (audio, target, ms, done) => {
clearInterval(musicFadeTimer);
const from = audio.volume;
const start = Date.now();
musicFadeTimer = setInterval(() => {
const t = Math.min(1, (Date.now() - start) / ms);
try { audio.volume = from + (target - from) * t; } catch {}
if (t >= 1) {
clearInterval(musicFadeTimer);
if (done) done();
}
}, 40);
};
const armMusicRetry = () => {
if (musicRetryArmed) return;
musicRetryArmed = true;
const events = ['pointerup', 'touchend', 'click', 'keydown'];
const retry = (e) => {
if (e && e.target && e.target.closest && e.target.closest('#music-toggle')) return;
events.forEach(ev => window.removeEventListener(ev, retry, true));
musicRetryArmed = false;
startMusic();
};
events.forEach(ev => window.addEventListener(ev, retry, true));
};
function startMusic() {
const audio = document.getElementById('wedding-audio');
if (!audio || musicUserPaused || !audio.paused) return;
if (audio.error) { try { audio.load(); } catch {} }
try { audio.volume = 0; } catch {}
let p;
try { p = audio.play(); } catch { armMusicRetry(); return; }
musicWanted = true;
if (p && typeof p.then === 'function') {
p.then(() => fadeMusic(audio, MUSIC_VOLUME, 1500))
.catch(() => {
try { audio.volume = MUSIC_VOLUME; } catch {}
armMusicRetry();
});
} else {
fadeMusic(audio, MUSIC_VOLUME, 1500);
}
}
document.addEventListener('visibilitychange', () => {
if (document.visibilityState !== 'visible' || !musicWanted || musicUserPaused) return;
const audio = document.getElementById('wedding-audio');
if (!audio || !audio.paused) return;
try { audio.volume = MUSIC_VOLUME; } catch {}
const p = audio.play();
if (p && typeof p.catch === 'function') p.catch(() => armMusicRetry());
});
const openInvitation = () => {
if (!opening || !envelope || envelope.dataset.opening === '1') return;
envelope.dataset.opening = '1';
try { localStorage.setItem(ENVELOPE_STORAGE_KEY, '1'); } catch (_) {}
startMusic();
// Vibración corta cuando se rompe el sello (si el celular lo permite)
try { if (navigator.vibrate && !reducedMotion) navigator.vibrate([18, 45, 12]); } catch (_) {}
const beginOpening = () => {
envelope.classList.add('is-opening');
if (reducedMotion) {
opening.classList.add('is-instant');
setTimeout(finishOpening, 250);
return;
}
const HOLD_TIME = 6800;
setTimeout(() => opening.classList.add('is-zooming'), HOLD_TIME);
setTimeout(finishOpening, HOLD_TIME + 2000);
};
// Si alguna capa del sobre todavía no cargó, espera un instante (máx. 1,8 s) para que la apertura salga completa
const pendingImgs = Array.from(envelope.querySelectorAll('img')).filter(img => !(img.complete && img.naturalWidth > 0));
if (!pendingImgs.length) { beginOpening(); return; }
Promise.race([
Promise.all(pendingImgs.map(imgReady)),
new Promise(resolve => setTimeout(resolve, 1800))
]).then(beginOpening);
};
// La música se descarga DESPUÉS del sobre, para que no compita con las imágenes en la carga inicial.
const deferredAudio = document.getElementById('wedding-audio');
const loadAudioNow = () => {
if (!deferredAudio || deferredAudio.dataset.loading) return;
deferredAudio.dataset.loading = '1';
deferredAudio.preload = 'auto';
if (deferredAudio.paused && deferredAudio.readyState === 0) {
try { deferredAudio.load(); } catch (_) {}
}
};
envelopeSettled.then(() => setTimeout(loadAudioNow, 400));
['pointerdown', 'touchstart', 'keydown'].forEach(ev => window.addEventListener(ev, loadAudioNow, { once: true, passive: true }));
document.body.classList.add('invitation-locked');
startMusic();
envelope?.addEventListener('click', openInvitation);
envelope?.addEventListener('keydown', e => {
if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openInvitation(); }
});
setTimeout(() => {
if (document.getElementById('envelope-opening')) finishOpening();
}, 15000);
/* ============================================================
HELPERS
============================================================ */
const wait = (ms) => new Promise(res => setTimeout(res, ms));
function smoothScrollTo(el, offsetTop = 0) {
if (!el) return;
const rect = el.getBoundingClientRect();
const targetY = window.scrollY + rect.top - offsetTop;
window.scrollTo({ top: Math.max(0, targetY), behavior: reducedMotion ? 'auto' : 'smooth' });
}
function scrollToElCentered(el, ratio = 0.22) {
if (!el) return;
const rect = el.getBoundingClientRect();
const vh = window.innerHeight || document.documentElement.clientHeight;
const targetY = window.scrollY + rect.top - vh * ratio;
window.scrollTo({ top: Math.max(0, targetY), behavior: reducedMotion ? 'auto' : 'smooth' });
}
/* ============================================================
EVENT DAY + COUNTDOWN
============================================================ */
const countdown = document.getElementById('countdown');
let countdownTimer = null;
function checkEventDay() {
if (document.body.dataset.testMode) return;
const now = new Date();
const ev = new Date(CONFIG.event.isoTimestamp);
const endEv = new Date(CONFIG.event.endTimestamp);
const sameDay = now.getFullYear() === ev.getFullYear()
&& now.getMonth() === ev.getMonth()
&& now.getDate() === ev.getDate();
const isSameDayAnyTime = sameDay && !document.body.classList.contains('post-boda');
const banner = document.getElementById('event-day-banner');
if (isSameDayAnyTime) {
document.body.classList.add('event-day');
if (banner) {
banner.innerHTML = BANNER_HTML;
banner.removeAttribute('hidden');
banner.setAttribute('aria-hidden', 'false');
}
} else if (!document.body.classList.contains('post-boda')) {
document.body.classList.remove('event-day');
if (banner) {
banner.setAttribute('hidden', '');
banner.setAttribute('aria-hidden', 'true');
}
}
}
const startCountdown = () => {
if (!countdown || countdownTimer) return;
const target = new Date(countdown.dataset.countdownDate).getTime();
const ids = ['cd-days', 'cd-hours', 'cd-minutes', 'cd-seconds'].map(id => document.getElementById(id));
const caption = document.querySelector('.countdown-caption');
const update = () => {
const diff = Math.max(0, target - Date.now());
const days = Math.floor(diff / 86400000);
const hours = Math.floor(diff / 3600000) % 24;
const minutes = Math.floor(diff / 60000) % 60;
const seconds = Math.floor(diff / 1000) % 60;
[days, hours, minutes, seconds].forEach((value, i) => {
const el = ids[i];
if (!el) return;
const text = String(value).padStart(2, '0');
if (el.textContent === text && el.dataset.ready === '1') return;
const hadValue = el.dataset.ready === '1';
el.textContent = text;
el.dataset.ready = '1';
// Cambio suave al pasar cada número (no en la primera carga)
if (hadValue && !reducedMotion) {
el.classList.remove('is-tick');
void el.offsetWidth;
el.classList.add('is-tick');
}
});
if (caption) {
if (document.body.classList.contains('post-boda')) {
caption.textContent = '¡Nos casamos! Gracias por ser parte 💛';
} else if (document.body.classList.contains('event-day')) {
caption.textContent = '¡Hoy es el gran día! 🥂';
} else if (diff <= 0) {
caption.textContent = '¡El gran día llegó!';
} else {
caption.textContent = 'Faltan apenas unos días para nuestro gran día';
}
}
if (diff <= 0) { clearInterval(countdownTimer); countdownTimer = null; }
};
update();
countdownTimer = setInterval(update, 1000);
};
checkEventDay();
startCountdown();
/* ============================================================
TIMELINE VIVO
============================================================ */
const timeline = document.getElementById('timeline');
if (timeline) {
const items = Array.from(timeline.querySelectorAll('.timeline-item'));
let timelineTimer = null;
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
itemMinutes.forEach((mins, i) => { if (mins <= nowMinutes) currentIndex = i; });
items.forEach((it, i) => {
it.classList.remove('is-past', 'is-current');
if (i < currentIndex) it.classList.add('is-past');
else if (i === currentIndex) it.classList.add('is-current');
});
};
const startTimeline = () => {
if (timelineTimer) return;
updateTimeline();
timelineTimer = setInterval(updateTimeline, 30000);
};
const stopTimeline = () => {
if (timelineTimer) { clearInterval(timelineTimer); timelineTimer = null; }
};
updateTimeline();
startTimeline();
document.addEventListener('visibilitychange', () => {
if (document.hidden) stopTimeline();
else startTimeline();
});
}
/* ============================================================
RSVP DEADLINE
============================================================ */
const deadlineEl = document.getElementById('confirm-deadline');
if (deadlineEl) {
const deadlineStr = deadlineEl.dataset.deadline || CONFIG.event.rsvpDeadline;
const deadline = new Date(deadlineStr).getTime();
const now = Date.now();
const diffDays = Math.floor((deadline - now) / 86400000);
if (now > deadline) {
deadlineEl.classList.add('is-closed');
deadlineEl.innerHTML = 'RSVP · El plazo de confirmación cerró';
} else if (diffDays <= 30) {
deadlineEl.classList.add('is-soon');
deadlineEl.innerHTML = diffDays <= 0
? 'RSVP · ¡Último día para confirmar!'
: `RSVP · Faltan <strong>${diffDays} ${diffDays === 1 ? 'día' : 'días'}</strong> para confirmar`;
}
}
/* ============================================================
DESCUBRIR LA FECHA (con fade-in escalonado, sin typewriter)
============================================================ */
const dateBtn = document.getElementById('date-reveal-btn');
const dateSkipBtn = document.getElementById('date-skip-btn');
const dateContent = document.getElementById('date-reveal-content');
const datePre = document.getElementById('date-pre');
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
if (!petalsLayer || reducedMotion) return;
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
// ⬇️ NUEVO: muestra las frases completas con fade-in escalonado
const MESSAGE_LINES = [
'¡La ansiedad es parte del plan! 😂',
'Si ustedes están ansiosos por saber la fecha, imagínense cómo estamos nosotros.',
'Aunque, entre nosotros… ¡nos encanta tenerlos así de curiosos! ❤️',
'¿Están listos?'
];
async function showMessageAsync() {
if (!dateMessage) return;
dateMessage.removeAttribute('hidden');
dateMessage.setAttribute('aria-hidden', 'false');
await wait(80);
dateMessage.classList.add('is-visible');
// Activar shimmer dorado en el borde
dateMessage.classList.add('is-shimmering');
scrollToElCentered(dateMessage, 0.18);
await wait(500);
const lines = Array.from(dateMessage.querySelectorAll('[data-type-line]'));
// Aparición escalonada de cada línea (350ms entre cada una)
for (let i = 0; i < lines.length; i++) {
lines[i].textContent = MESSAGE_LINES[i] || '';
lines[i].classList.add('is-revealed');
await wait(380);
}
// ⬇️ TIEMPO DE LECTURA AUMENTADO: 7.5 segundos (antes 3.2s)
await wait(7500);
}
async function hideMessageAsync() {
if (!dateMessage) return;
// Quitar shimmer antes del fade-out
dateMessage.classList.remove('is-shimmering');
dateMessage.classList.add('is-hidden');
await wait(600);
dateMessage.classList.remove('is-visible');
dateMessage.classList.remove('is-hidden');
dateMessage.setAttribute('hidden', '');
dateMessage.setAttribute('aria-hidden', 'true');
dateMessage.querySelectorAll('[data-type-line]').forEach(p => {
p.textContent = '';
p.classList.remove('is-revealed');
});
}
function revealDateContent() {
if (!dateContent) return;
dateContent.removeAttribute('hidden');
startCountdown();
checkEventDay();
setTimeout(() => {
const calendar = dateContent.querySelector('.calendar') || dateContent;
const isMobile = window.innerWidth <= 720;
smoothScrollTo(calendar, isMobile ? 12 : 40);
}, 260);
}
async function runFullReveal() {
if (reducedMotion) { revealDateContent(); return; }
await runPreCountdownAsync();
await hidePreCounterAsync();
await showMessageAsync();
await hideMessageAsync();
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
// El texto de arriba y el botón se pliegan: quedan solo el título y la cuenta regresiva
if (datePre) {
datePre.classList.add('is-gone');
datePre.setAttribute('aria-hidden', 'true');
}
setTimeout(() => {
runFullReveal().catch(err => console.error('[reveal date]', err));
}, datePre ? 900 : 420);
});
}
dateSkipBtn?.addEventListener('click', () => {
dateBtn?.classList.add('is-hidden');
dateSkipBtn?.classList.add('is-hidden');
dateSkipBtn?.setAttribute('hidden', '');
if (datePre) { datePre.classList.add('is-gone'); datePre.setAttribute('aria-hidden', 'true'); }
revealDateContent();
const caption = document.querySelector('.countdown-caption');
if (caption) caption.textContent = '¡Nos casamos! Gracias por ser parte 💛';
});
/* ============================================================
CALENDARIO (Google + ICS)
============================================================ */
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
if (googleBtn) googleBtn.href = buildGoogleCalendarUrl();
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
Toast.show('Archivo .ics descargado', 'success');
});
/* ============================================================
PLAYLIST
============================================================ */
const playlistBtn = document.getElementById('playlist-btn');
const playlistModal = document.getElementById('playlist-modal');
const playlistOverlay = document.getElementById('playlist-overlay');
const playlistClose = document.getElementById('playlist-modal-close');
const playlistFrame = document.getElementById('playlist-frame');
const playlistLoader = document.getElementById('playlist-loader');
function buildPlaylistUrl() {
const base = CONFIG.playlistApp.url;
if (!base) return '';
const params = new URLSearchParams();
if (guestName && guestName !== CONFIG.guest.defaultName) {
params.set('n', guestName);
}
const qs = params.toString();
return qs ? `${base}?${qs}` : base;
}
function openPlaylistModal() {
if (!playlistModal) return;
playlistModal.classList.add('is-open');
playlistModal.setAttribute('aria-hidden', 'false');
document.body.classList.add('modal-open');
if (playlistFrame) {
const url = buildPlaylistUrl();
if (url) {
if (playlistLoader) playlistLoader.hidden = false;
playlistFrame.src = 'about:blank';
requestAnimationFrame(() => {
playlistFrame.src = url;
});
}
}
setTimeout(() => playlistClose?.focus(), 60);
}
function closePlaylistModal() {
if (!playlistModal) return;
playlistModal.classList.remove('is-open');
playlistModal.setAttribute('aria-hidden', 'true');
document.body.classList.remove('modal-open');
}
playlistBtn?.addEventListener('click', openPlaylistModal);
playlistClose?.addEventListener('click', closePlaylistModal);
playlistOverlay?.addEventListener('click', closePlaylistModal);
document.addEventListener('keydown', e => {
if (e.key === 'Escape' && playlistModal?.classList.contains('is-open')) closePlaylistModal();
});
playlistFrame?.addEventListener('load', () => {
if (playlistLoader) playlistLoader.hidden = true;
});
window.addEventListener('message', (e) => {
if (!e || !e.data || typeof e.data !== 'object') return;
if (e.data.type === 'playlist-success') {
Toast.show('¡Gracias! Recibimos tus recomendaciones 🎶', 'heart', 3400);
}
});
/* ============================================================
ÁLBUM
============================================================ */
const albumBtn = document.getElementById('album-btn');
const albumModal = document.getElementById('album-modal');
const albumOverlay = document.getElementById('album-overlay');
const albumClose = document.getElementById('album-modal-close');
const albumFrame = document.getElementById('album-frame');
const albumLoader = document.getElementById('album-loader');
function buildAlbumUrl() {
const base = CONFIG.albumApp.url;
if (!base) return '';
const params = new URLSearchParams();
if (guestName && guestName !== CONFIG.guest.defaultName) {
params.set('n', guestName);
}
const qs = params.toString();
return qs ? `${base}?${qs}` : base;
}
function openAlbumModal() {
if (!albumModal) return;
albumModal.classList.add('is-open');
albumModal.setAttribute('aria-hidden', 'false');
document.body.classList.add('modal-open');
if (albumFrame && !albumFrame.src) {
const url = buildAlbumUrl();
if (url) {
if (albumLoader) albumLoader.hidden = false;
albumFrame.src = url;
}
}
setTimeout(() => albumClose?.focus(), 60);
}
function closeAlbumModal() {
if (!albumModal) return;
albumModal.classList.remove('is-open');
albumModal.setAttribute('aria-hidden', 'true');
document.body.classList.remove('modal-open');
}
albumBtn?.addEventListener('click', openAlbumModal);
albumClose?.addEventListener('click', closeAlbumModal);
albumOverlay?.addEventListener('click', closeAlbumModal);
document.addEventListener('keydown', e => {
if (e.key === 'Escape' && albumModal?.classList.contains('is-open')) closeAlbumModal();
});
albumFrame?.addEventListener('load', () => {
if (albumLoader) albumLoader.hidden = true;
});
window.addEventListener('message', (e) => {
if (!e || !e.data || typeof e.data !== 'object') return;
if (e.data.type === 'album-success') {
const c = e.data.count || 0;
Toast.show(`¡Gracias! Recibimos ${c} ${c === 1 ? 'foto' : 'fotos'} 📸`, 'heart', 3400);
}
});
/* ============================================================
NAV FLOTANTE
============================================================ */
const nav = document.getElementById('floating-nav');
let navIdleTimer = null;
const wakeNav = () => {
if (!nav) return;
nav.classList.remove('is-idle');
clearTimeout(navIdleTimer);
navIdleTimer = setTimeout(() => nav.classList.add('is-idle'), 3500);
};
const toggleNav = () => {
if (!nav) return;
const show = window.scrollY > window.innerHeight * 0.5;
nav.classList.toggle('is-visible', show);
if (show) wakeNav();
else { clearTimeout(navIdleTimer); nav.classList.remove('is-idle'); }
};
window.addEventListener('scroll', toggleNav, { passive: true });
// Un toque o tecla en cualquier lado lo vuelve a mostrar
['touchstart', 'pointerdown', 'keydown'].forEach(ev =>
window.addEventListener(ev, () => { if (nav?.classList.contains('is-visible')) wakeNav(); }, { passive: true })
);
toggleNav();
// Marca en dorado la sección donde estás
const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
if (navLinks.length && 'IntersectionObserver' in window) {
let navCurrent = null;
const setNavActive = id => {
if (id === navCurrent) return;
navCurrent = id;
navLinks.forEach(link => {
const on = link.getAttribute('href') === `#${id}`;
link.classList.toggle('is-active', on);
if (on) {
link.setAttribute('aria-current', 'true');
if (nav.scrollWidth > nav.clientWidth) {
nav.scrollTo({ left: link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2, behavior: reducedMotion ? 'auto' : 'smooth' });
}
} else {
link.removeAttribute('aria-current');
}
});
};
const navObserver = new IntersectionObserver(entries => {
entries.forEach(entry => { if (entry.isIntersecting) setNavActive(entry.target.id); });
}, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
navLinks.forEach(link => {
const target = document.getElementById(link.getAttribute('href').slice(1));
if (target) navObserver.observe(target);
});
}
/* ============================================================
MÚSICA (toggle)
============================================================ */
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
// Se esconde mientras scrolleás y vuelve cuando frenás
if (musicPlayer) {
let musicAwayTimer = null;
window.addEventListener('scroll', () => {
musicPlayer.classList.add('is-away');
clearTimeout(musicAwayTimer);
musicAwayTimer = setTimeout(() => musicPlayer.classList.remove('is-away'), 1200);
}, { passive: true });
}
musicToggle?.addEventListener('click', async () => {
if (!music) return;
try {
if (music.paused) {
musicUserPaused = false;
musicWanted = true;
music.volume = 0;
await music.play();
fadeMusic(music, MUSIC_VOLUME, 1200);
} else {
musicUserPaused = true;
fadeMusic(music, 0, 350, () => music.pause());
}
} catch (_) {
setMusicState(false);
}
});
/* ============================================================
COPIAR DATOS BANCARIOS
============================================================ */
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
setTimeout(() => { button.textContent = original; button.classList.remove('is-copied'); }, 2200);
const label = button.dataset.copyLabel || 'Dato';
Toast.show(`${label} copiado al portapapeles`, 'success');
});
});
/* ============================================================
RSVP + PARAMS
============================================================ */
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
/* ----- refs DOM ----- */
const modal = document.getElementById('contact-modal');
const modalClose = document.getElementById('modal-close');
const modalOverlay = document.getElementById('modal-overlay');
const modalSummary = document.getElementById('modal-action-summary');
const confirmActions = document.getElementById('confirm-actions');
const confirmDone = document.getElementById('confirm-done');
const confirmDoneText = document.getElementById('confirm-done-text');
const confirmDoneReset = document.getElementById('confirm-done-reset');
const rsvpFormWrap = document.getElementById('rsvp-form-wrap');
const rsvpForm = document.getElementById('rsvp-form');
const rsvpName = document.getElementById('rsvp-name');
const rsvpGuests = document.getElementById('rsvp-guests');
const rsvpGuestsField = document.getElementById('rsvp-guests-field');
const rsvpAdditionalGuestsField = document.getElementById('rsvp-additional-guests-field');
const rsvpAdditionalGuests = document.getElementById('rsvp-additional-guests');
const rsvpMessage = document.getElementById('rsvp-message');
const rsvpContact = document.getElementById('rsvp-contact');
const rsvpSubmit = document.getElementById('rsvp-submit');
const rsvpSuccess = document.getElementById('rsvp-success');
const rsvpSuccessText = document.getElementById('rsvp-success-text');
const rsvpSuccessReset = document.getElementById('rsvp-success-reset');
const waOptionalGroom = document.getElementById('wa-optional-groom');
const waOptionalBride = document.getElementById('wa-optional-bride');
let action = 'all';
/* ----- helpers RSVP ----- */
function fillGuestsOptions(maxAllowed) {
if (!rsvpGuests) return;
rsvpGuests.innerHTML = '';
const min = 1;
const max = Math.max(min, maxAllowed);
for (let i = min; i <= max; i++) {
const opt = document.createElement('option');
opt.value = i;
opt.textContent = `${i} ${i === 1 ? 'persona' : 'personas'}`;
rsvpGuests.appendChild(opt);
}
rsvpGuests.value = max;
}
function updateAdditionalGuestFields() {
if (!rsvpAdditionalGuests || !rsvpAdditionalGuestsField) return;
const confirmedCount = action === 'none' ? 0 : Number(rsvpGuests?.value || 0);
const extraCount = totalGuests > 1 ? Math.max(0, confirmedCount - 1) : 0;
const currentFields = Array.from(rsvpAdditionalGuests.querySelectorAll('input'));
const currentValues = currentFields.map(input => input.value);
rsvpAdditionalGuestsField.hidden = extraCount === 0;
if (currentFields.length === extraCount) return;
rsvpAdditionalGuests.replaceChildren();
for (let index = 0; index < extraCount; index++) {
const field = document.createElement('div');
field.className = 'rsvp-additional-guests__field';
const inputId = `rsvp-additional-guest-${index + 1}`;
const label = document.createElement('label');
label.htmlFor = inputId;
label.textContent = `Acompañante ${index + 1}`;
const input = document.createElement('input');
input.type = 'text';
input.id = inputId;
input.name = 'additionalGuests[]';
input.placeholder = 'Nombre y apellido';
input.autocomplete = 'off';
input.required = true;
input.maxLength = 120;
input.value = currentValues[index] || '';
field.append(label, input);
rsvpAdditionalGuests.appendChild(field);
}
}
function buildMessageForRsvp(name, confirmedCount, additionalGuestNames = []) {
const safeName = name || guestName;
const attendeeNames = [safeName, ...additionalGuestNames].filter(Boolean).join(', ');
const attendeeLine = additionalGuestNames.length ? `\nNombres: ${attendeeNames}` : '';
if (action === 'all') {
return `¡Hola! Confirmo mi asistencia a la boda. 💍✨\n\nNombre: ${safeName}\nAsistentes: ${confirmedCount} ${confirmedCount === 1 ? 'persona' : 'personas'}${attendeeLine}\nLugar: ${EVENT_PLACE}\nUbicación: ${MAP_LINK}\n\n¡Nos vemos muy pronto!`;
}
if (action === 'less') {
return `¡Hola! Confirmo asistencia parcial a la boda. 💍✨\n\nNombre: ${safeName}\nAsistentes confirmados: ${confirmedCount} de ${totalGuests}${attendeeLine}\nLugar: ${EVENT_PLACE}\nUbicación: ${MAP_LINK}\n\n¡Muchas gracias!`;
}
return `¡Hola! Lamentablemente no podremos acompañarlos en la boda. ❤️\n\nNombre: ${safeName}\nLugar: ${EVENT_PLACE}\n\nLes deseamos lo mejor en este día tan especial.`;
}
function buildWhatsAppUrl(recipient, name, confirmedCount, additionalGuestNames) {
const phone = recipient === 'María' ? PHONE_BRIDE : PHONE_GROOM;
const msg = buildMessageForRsvp(name, confirmedCount, additionalGuestNames);
return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
function loadRsvp() {
try {
const raw = localStorage.getItem(RSVP_STORAGE_KEY);
return raw ? JSON.parse(raw) : null;
} catch { return null; }
}
function saveRsvp(data) {
try {
localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify({
...data,
guests: totalGuests,
totalGuests,
timestamp: Date.now()
}));
} catch {}
}
function clearRsvp() {
try { localStorage.removeItem(RSVP_STORAGE_KEY); } catch (_) {}
}
function getRsvpMessage(saved) {
if (!saved) return '';
const name = saved.name ? `, ${saved.name}` : '';
const additionalNames = Array.isArray(saved.additionalGuests) ? saved.additionalGuests.filter(Boolean) : [];
const attendeeNames = additionalNames.length ? ` Acompañantes: ${additionalNames.join(', ')}.` : '';
if (saved.action === 'all') {
return `¡Gracias${name}! Confirmamos tu asistencia para ${saved.confirmedGuests} ${saved.confirmedGuests === 1 ? 'persona' : 'personas'}.${attendeeNames} ¡Nos vemos pronto! ✨`;
}
if (saved.action === 'less') {
return `¡Gracias${name}! Confirmamos que asistirán ${saved.confirmedGuests} de ${saved.totalGuests} personas.${attendeeNames} ¡Gracias por avisarnos! ✨`;
}
return `Gracias${name} por avisarnos. Los vamos a extrañar. ❤️`;
}
function renderRsvpDone(saved) {
if (!confirmActions || !confirmDone) return;
confirmActions.hidden = true;
confirmDone.hidden = false;
if (confirmDoneText) confirmDoneText.textContent = getRsvpMessage(saved);
const path = confirmDone.querySelector('.confirm-done__check path');
if (path) { path.style.animation = 'none'; void path.offsetWidth; path.style.animation = ''; }
}
function renderRsvpActions() {
if (!confirmActions || !confirmDone) return;
confirmActions.hidden = false;
confirmDone.hidden = true;
}
const savedRsvp = loadRsvp();
if (savedRsvp) renderRsvpDone(savedRsvp);
else renderRsvpActions();
confirmDoneReset?.addEventListener('click', () => {
clearRsvp();
renderRsvpActions();
});
/* ============================================================
MODAL RSVP
============================================================ */
function openModal(type) {
action = type;
const titleEl = document.getElementById('modal-title');
if (type === 'all') {
if (titleEl) titleEl.textContent = 'Confirmá tu asistencia';
if (modalSummary) modalSummary.textContent = `Tu invitación es para ${totalGuests} ${totalGuests === 1 ? 'persona' : 'personas'}. Completá los datos para confirmar.`;
rsvpGuestsField?.removeAttribute('hidden');
fillGuestsOptions(totalGuests);
} else if (type === 'less') {
if (titleEl) titleEl.textContent = '¿Cuántas personas asistirán?';
if (modalSummary) modalSummary.textContent = `Tu invitación es para ${totalGuests} ${totalGuests === 1 ? 'persona' : 'personas'}. Indicá cuántas podrán venir.`;
rsvpGuestsField?.removeAttribute('hidden');
fillGuestsOptions(Math.max(1, totalGuests - 1));
} else {
if (titleEl) titleEl.textContent = 'Nos avisás que no van a poder';
if (modalSummary) modalSummary.textContent = 'Dejanos tu nombre y, si querés, un mensaje. Los vamos a extrañar.';
rsvpGuestsField?.setAttribute('hidden', '');
}
rsvpAdditionalGuests?.replaceChildren();
updateAdditionalGuestFields();
if (rsvpName) rsvpName.value = (guestName && guestName !== CONFIG.guest.defaultName) ? guestName : '';
if (rsvpMessage) rsvpMessage.value = '';
if (rsvpContact) rsvpContact.value = '';
rsvpFormWrap?.removeAttribute('hidden');
rsvpSuccess?.setAttribute('hidden', '');
rsvpSuccess?.setAttribute('aria-hidden', 'true');
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
rsvpGuests?.addEventListener('change', updateAdditionalGuestFields);
modalClose?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', closeModal);
document.addEventListener('keydown', e => {
if (e.key === 'Escape' && modal?.classList.contains('is-open')) closeModal();
});
/* ============================================================
SUBMIT DEL FORMULARIO RSVP
============================================================ */
rsvpForm?.addEventListener('submit', async e => {
e.preventDefault();
const name = String(rsvpName?.value || '').trim();
const message = String(rsvpMessage?.value || '').trim();
const contact = String(rsvpContact?.value || '').trim();
const confirmedCount = action === 'none' ? 0 : Number(rsvpGuests?.value || totalGuests);
const additionalGuestNames = Array.from(rsvpAdditionalGuests?.querySelectorAll('input') || [])
  .map(input => input.value.trim());
if (!name) {
Toast.show('Completá tu nombre para confirmar', 'info');
rsvpName?.focus();
return;
}
if (additionalGuestNames.some(guest => !guest)) {
Toast.show('Completá el nombre de cada persona que te acompaña', 'info');
Array.from(rsvpAdditionalGuests?.querySelectorAll('input') || [])
  .find(input => !input.value.trim())?.focus();
return;
}
if (rsvpSubmit) {
rsvpSubmit.disabled = true;
const span = rsvpSubmit.querySelector('span');
if (span) span.textContent = 'Enviando…';
}
saveRsvp({
action,
name,
contact,
confirmedGuests: confirmedCount,
additionalGuests: additionalGuestNames,
message
});
let statusText = 'confirmado';
if (action === 'less') statusText = 'confirmado parcialmente';
if (action === 'none') statusText = 'rechazado';
const res = await SheetsAPI.send({
type: 'rsvp',
name,
contact,
guests: totalGuests,
confirmedGuests: confirmedCount,
additionalGuests: additionalGuestNames,
status: statusText,
action,
message
});
if (rsvpSubmit) {
rsvpSubmit.disabled = false;
const span = rsvpSubmit.querySelector('span');
if (span) span.textContent = 'Confirmar';
}
rsvpFormWrap?.setAttribute('hidden', '');
rsvpSuccess?.removeAttribute('hidden');
rsvpSuccess?.setAttribute('aria-hidden', 'false');
const saved = loadRsvp();
if (rsvpSuccessText) rsvpSuccessText.textContent = getRsvpMessage(saved);
if (waOptionalGroom) waOptionalGroom.href = buildWhatsAppUrl('Hernán', name, confirmedCount, additionalGuestNames);
if (waOptionalBride) waOptionalBride.href = buildWhatsAppUrl('María', name, confirmedCount, additionalGuestNames);
renderRsvpDone(saved);
if (res.ok) {
Toast.show('¡Listo! Guardamos tu respuesta 💛', 'heart', 3200);
} else {
Toast.show('Guardamos tu respuesta localmente. Si querés, avisanos por WhatsApp.', 'info', 3600);
}
});
rsvpSuccessReset?.addEventListener('click', () => {
clearRsvp();
closeModal();
renderRsvpActions();
});
/* ============================================================
GALERÍA — lightbox desactivado (solo miniaturas)
============================================================ */
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
// ⬇️ LIGHTBOX DESACTIVADO
// galleryItems.forEach((item, i) => item.addEventListener('click', () => openLightbox(i)));
// ===== Galería: aparición de a una, fundido al cargar y fotos que no se pueden abrir =====
const galleryGrid = document.querySelector('.gallery-masonry');
if (galleryGrid && galleryItems.length) {
galleryGrid.classList.add('gallery-js');
galleryItems.forEach(item => {
// Sin menú de "abrir / descargar" al mantener presionado, ni arrastre
item.addEventListener('contextmenu', e => e.preventDefault());
item.addEventListener('dragstart', e => e.preventDefault());
const photo = item.querySelector('img');
if (!photo) return;
photo.setAttribute('draggable', 'false');
const markLoaded = () => photo.classList.add('is-loaded');
if (photo.complete && photo.naturalWidth > 0) markLoaded();
else {
photo.addEventListener('load', markLoaded, { once: true });
photo.addEventListener('error', markLoaded, { once: true });
}
});
const showGalleryItem = item => item.classList.add('is-in');
if (reducedMotion || !('IntersectionObserver' in window)) {
galleryItems.forEach(showGalleryItem);
} else {
const galleryObserver = new IntersectionObserver(entries => {
entries.forEach(entry => {
if (!entry.isIntersecting) return;
const item = entry.target;
const galleryIdx = galleryItems.indexOf(item);
// La foto principal entra sola; las demás, de a dos (la derecha un instante después)
item.style.setProperty('--d', `${galleryIdx === 0 ? 0 : ((galleryIdx - 1) % 2) * 0.14}s`);
showGalleryItem(item);
galleryObserver.unobserve(item);
});
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
galleryItems.forEach(item => galleryObserver.observe(item));
}
// Movimiento suave al scrollear: cada columna se desplaza apenas distinto (profundidad)
if (!reducedMotion && galleryItems.length > 1 && window.CSS && CSS.supports && CSS.supports('translate', '0 1px')) {
const PARALLAX_MAX = 26;
const PARALLAX_FACTOR = [0.012, 0.04];
let parallaxVisible = false;
let parallaxFrame = 0;
const updateParallax = () => {
parallaxFrame = 0;
if (document.body.classList.contains('low-end')) return;
const gridTop = galleryGrid.getBoundingClientRect().top;
const halfView = window.innerHeight / 2;
galleryItems.forEach((item, i) => {
if (i === 0) return;
const centerY = gridTop + item.offsetTop + item.offsetHeight / 2;
const shift = Math.max(-PARALLAX_MAX, Math.min(PARALLAX_MAX, (centerY - halfView) * PARALLAX_FACTOR[(i - 1) % 2]));
item.style.setProperty('--py', `${shift.toFixed(1)}px`);
});
};
const queueParallax = () => {
if (!parallaxVisible || parallaxFrame) return;
parallaxFrame = requestAnimationFrame(updateParallax);
};
if ('IntersectionObserver' in window) {
new IntersectionObserver(entries => {
parallaxVisible = entries.some(entry => entry.isIntersecting);
if (parallaxVisible) queueParallax();
}, { rootMargin: '200px 0px' }).observe(galleryGrid);
window.addEventListener('scroll', queueParallax, { passive: true });
window.addEventListener('resize', queueParallax, { passive: true });
}
}
}
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
/* ============================================================
MAPA
============================================================ */
const mapIframe = document.getElementById('map-iframe');
const mapToggle = document.getElementById('map-toggle');
const MAP_SRC_SAT = 'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d2456.3945676431235!2d-58.2901971582274!3d-37.873529537009674!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzfCsDUyJzI4LjMiUyA1OMKwMTcnMjAuOSJX!5e1!3m2!1ses!2sar!4v1792075270424!5m2!1ses!2sar&t=k';
const MAP_SRC_NORMAL = 'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d2456.3945676431235!2d-58.2901971582274!3d-37.873529537009674!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzfCsDUyJzI4LjMiUyA1OMKwMTcnMjAuOSJX!5e1!3m2!1ses!2sar!4v1792075270424!5m2!1ses!2sar';
let mapIsSat = false;
mapToggle?.addEventListener('click', () => {
if (!mapIframe) return;
mapIsSat = !mapIsSat;
mapIframe.src = mapIsSat ? MAP_SRC_SAT : MAP_SRC_NORMAL;
const label = mapToggle.querySelector('.map-toggle__label');
if (label) label.textContent = mapIsSat ? 'Mapa' : 'Satélite';
});
const mapLink = document.querySelector('.map-link');
mapLink?.addEventListener('keydown', e => {
if (e.key === 'Enter' || e.key === ' ') {
e.preventDefault();
window.open(mapLink.href, '_blank', 'noopener');
}
});
/* ============================================================
THEME-COLOR DINÁMICO
============================================================ */
const themeMeta = document.querySelector('meta[name="theme-color"]');
function updateThemeColor() {
if (!themeMeta) return;
const isLightTheme = document.body.classList.contains('theme-light');
if (isLightTheme) {
themeMeta.content = '#f2ecdc';
return;
}
const isDark = window.scrollY > window.innerHeight * 0.5;
themeMeta.content = isDark ? '#3a4020' : '#f1edd8';
}
window.addEventListener('scroll', updateThemeColor, { passive: true });
updateThemeColor();
/* ============================================================
TÍTULO ROTATIVO
============================================================ */
const TITLES = {
default: 'María & Hernán · Nuestra boda',
confirm: 'María & Hernán · Confirmá tu asistencia',
thanks: 'María & Hernán · ¡Gracias!'
};
let currentTitleKey = 'default';
function setTitle(key) {
if (currentTitleKey === key) return;
currentTitleKey = key;
document.title = TITLES[key] || TITLES.default;
}
const titleSections = [
{ el: document.getElementById('portada'), key: 'default' },
{ el: document.getElementById('confirmacion'), key: 'confirm' },
{ el: document.querySelector('.closing-section'), key: 'thanks' }
].filter(s => s.el);
if ('IntersectionObserver' in window && titleSections.length) {
const titleObs = new IntersectionObserver(entries => {
entries.forEach(entry => {
if (entry.isIntersecting) {
const found = titleSections.find(s => s.el === entry.target);
if (found) setTitle(found.key);
}
});
}, { threshold: 0.4 });
titleSections.forEach(s => titleObs.observe(s.el));
}
/* ============================================================
MODO POST-BODA
============================================================ */
function checkPostBoda() {
if (document.body.dataset.testMode) return;
const eventEnd = new Date(CONFIG.event.endTimestamp).getTime();
if (Date.now() > eventEnd) {
document.body.classList.add('post-boda');
const banner = document.getElementById('event-day-banner');
if (banner) {
banner.classList.add('event-day-banner--post');
banner.innerHTML = POST_BANNER_HTML;
banner.removeAttribute('hidden');
banner.setAttribute('aria-hidden', 'false');
}
const skipBtn = document.getElementById('date-skip-btn');
if (skipBtn) skipBtn.removeAttribute('hidden');
const galleryAlbumCta = document.getElementById('gallery-album-cta');
if (galleryAlbumCta) galleryAlbumCta.removeAttribute('hidden');
const caption = document.querySelector('.countdown-caption');
if (caption) caption.textContent = '¡Nos casamos! Gracias por ser parte 💛';
}
}
checkPostBoda();
/* ============================================================
EASTER EGG: KONAMI
============================================================ */
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let konamiIndex = 0;
document.addEventListener('keydown', e => {
const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
if (key === KONAMI[konamiIndex]) {
konamiIndex++;
if (konamiIndex === KONAMI.length) {
konamiIndex = 0;
triggerKonami();
}
} else {
konamiIndex = 0;
}
});
function triggerKonami() {
launchPetals(200);
const overlay = document.createElement('div');
overlay.className = 'konami-overlay is-active';
overlay.innerHTML = '<span class="konami-overlay__monogram">M <i>&</i> H</span>';
document.body.appendChild(overlay);
Toast.show('¡Encontraste el secreto! 💛', 'heart', 3000);
setTimeout(() => {
overlay.classList.remove('is-active');
setTimeout(() => overlay.remove(), 600);
}, 2500);
}
/* ============================================================
FOCUS TRAP GLOBAL
============================================================ */
document.addEventListener('keydown', e => {
if (e.key !== 'Tab') return;
const openModal = document.querySelector('.confirm-modal.is-open');
if (openModal) { trapFocus(openModal, e); return; }
if (lightbox?.classList.contains('is-open')) trapFocus(lightbox, e);
});
/* ============================================================
SERVICE WORKER
============================================================ */
if ('serviceWorker' in navigator) {
window.addEventListener('load', () => {
navigator.serviceWorker.register('sw.js').catch(() => {});
});
}
});