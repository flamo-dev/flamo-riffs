const form = document.querySelector('.search');
const input = form.elements.q;
const entries = Array.from(document.querySelectorAll('.entry'));
const empty = document.querySelector('#empty');
const normalize = value => value.normalize('NFKC').trim().toLowerCase();
const records = entries.map(entry => {
  const text = normalize(entry.innerText + ' ' + entry.dataset.keywords);
  const video = entry.querySelector('video');
  const toggle = entry.querySelector('.preview');
  if (!video || !toggle) return {text, setVisible(visible) { entry.hidden = !visible; }};
  let pausedByUser = false;
  function updateButton() {
    toggle.textContent = video.paused ? '播放预览' : '暂停预览';
  }
  video.addEventListener('play', updateButton);
  video.addEventListener('pause', updateButton);
  updateButton();
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    pausedByUser = !video.paused;
    if (pausedByUser) video.pause();
    else video.play().catch(updateButton);
  });
  function setVisible(visible) {
    if (entry.hidden === !visible) return;
    entry.hidden = !visible;
    video.autoplay = visible && !pausedByUser;
    if (!visible) video.pause();
    else if (!pausedByUser) video.play().catch(updateButton);
  }
  return {text, setVisible};
});
function filter(updateUrl = true) {
  const words = normalize(input.value).split(/\s+/).filter(Boolean);
  let count = 0;
  for (const {text, setVisible} of records) {
    const matches = words.every(word => text.includes(word));
    setVisible(matches);
    if (matches) count++;
  }
  empty.hidden = count !== 0;
  document.querySelector('#count').textContent = String(count).padStart(2, '0');
  document.querySelector('#count').setAttribute('aria-label', count + ' 个作品');
  if (updateUrl) {
    const url = new URL(location.href);
    if (input.value.trim()) url.searchParams.set('q', input.value.trim()); else url.searchParams.delete('q');
    history.replaceState(null, '', url);
  }
}
function restore() { input.value = new URL(location.href).searchParams.get('q') || ''; filter(false); }
form.addEventListener('submit', e => { e.preventDefault(); filter(); });
input.addEventListener('input', () => filter());
empty.querySelector('button').addEventListener('click', () => { input.value = ''; filter(); input.focus(); });
document.addEventListener('keydown', e => {
  if (e.key === '/' && !e.altKey && !e.ctrlKey && !e.metaKey && document.activeElement !== input) { e.preventDefault(); input.focus(); }
});
window.addEventListener('pageshow', event => {
  if (event.persisted) restore();
});
// The search field can receive input before this deferred script downloads.
if (input.value) filter();
else restore();
