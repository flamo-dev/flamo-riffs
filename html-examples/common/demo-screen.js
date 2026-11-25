import { language } from './riffs-language.js';

// Both diagrams use a 1920 × 1080 design surface.
const cockpit = document.querySelector('.cockpit');
const viewport = cockpit.parentElement;
function fitScreen() {
  const scale = Math.min(viewport.clientWidth / 1920, viewport.clientHeight / 1080);
  cockpit.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
fitScreen();
new ResizeObserver(fitScreen).observe(viewport);

const time = document.querySelector('.clock .time');
const date = document.querySelector('.clock .date');
let day;
function setClockLocale() {
  day = new Intl.DateTimeFormat(language.value, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  refreshClock();
}
let clockTimer;
function refreshClock() {
  clearTimeout(clockTimer);
  const now = new Date();
  time.textContent = now.toLocaleTimeString(language.value, { hourCycle: 'h23' });
  date.textContent = day.format(now);
  clockTimer = setTimeout(refreshClock, 1000 - now.getMilliseconds());
}
setClockLocale();
language.addEventListener('change', setClockLocale);
window.addEventListener('pageshow', refreshClock);
window.addEventListener('pagehide', () => clearTimeout(clockTimer));

export const sampleInterval = 3000;
