// Both diagrams use a 1920 × 1080 design surface.
const cockpit = document.querySelector('.cockpit');
function fitScreen() {
  const scale = Math.min(innerWidth / 1920, innerHeight / 1080);
  cockpit.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
fitScreen();
window.addEventListener('resize', fitScreen);

const time = document.querySelector('.clock .time');
const date = document.querySelector('.clock .date');
const day = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
let clockTimer;
function refreshClock() {
  clearTimeout(clockTimer);
  const now = new Date();
  time.textContent = now.toLocaleTimeString('zh-CN', { hour12: false });
  date.textContent = day.format(now);
  clockTimer = setTimeout(refreshClock, 1000 - now.getMilliseconds());
}
refreshClock();
window.addEventListener('pageshow', refreshClock);
window.addEventListener('pagehide', () => clearTimeout(clockTimer));

export const sampleInterval = 3000;
