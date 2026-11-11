// Browser-only loading shell for exported Custom Elements. No Runtime dependency.
export function observeComponentLoading(host, { timeoutMs = 45000 } = {}) {
  const status = host.parentElement?.querySelector('[data-flamo-status]');
  const message = status?.querySelector('[data-flamo-message]');
  const retry = status?.querySelector('button');
  let timer;
  const update = (state, text) => {
    clearTimeout(timer);
    host.setAttribute('data-flamo-state', state);
    host.setAttribute('aria-busy', String(state === 'loading' || state === 'static'));
    host.inert = state !== 'ready';
    if (status) {
      status.hidden = state === 'ready';
      status.dataset.state = state;
    }
    if (message) message.textContent = text;
    if (retry) retry.hidden = state !== 'error';
  };
  const fail = (text = '组件加载失败，请刷新重试') => update('error', text);
  const loading = () => {
    update('loading', host.getAttribute('loading-label') || '正在加载组件…');
    timer = setTimeout(() => fail('加载时间较长，请检查网络后刷新重试'), timeoutMs);
  };
  const ready = () => update('ready', '');
  const staticReady = () => {
    update('static', '正在初始化动态效果…');
    timer = setTimeout(() => fail('动态效果初始化时间较长，请刷新重试'), timeoutMs);
  };
  const error = () => fail();
  const reload = () => location.reload();
  host.addEventListener('flamo-loading', loading);
  host.addEventListener('flamo-ready', ready);
  host.addEventListener('flamo-static-ready', staticReady);
  host.addEventListener('flamo-error', error);
  retry?.addEventListener('click', reload);
  if (host.getAttribute('data-flamo-state') === 'ready') ready();
  else if (host.getAttribute('data-flamo-state') === 'static') staticReady();
  else if (host.getAttribute('data-flamo-state') === 'error') error();
  else loading();
  return { fail, dispose() {
    clearTimeout(timer);
    host.removeEventListener('flamo-loading', loading);
    host.removeEventListener('flamo-ready', ready);
    host.removeEventListener('flamo-static-ready', staticReady);
    host.removeEventListener('flamo-error', error);
    retry?.removeEventListener('click', reload);
  } };
}

export function loadFlamoComponent(tagName, load) {
  const watched = new Map();
  let failed = false;
  const scan = () => {
    for (const [host, watcher] of watched) {
      if (!host.isConnected) { watcher.dispose(); watched.delete(host); }
    }
    for (const host of document.querySelectorAll(tagName)) {
      if (watched.has(host)) continue;
      const watcher = observeComponentLoading(host);
      watched.set(host, watcher);
      if (failed) watcher.fail();
    }
  };
  scan();
  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  return Promise.resolve().then(load).catch(error => {
    failed = true;
    for (const watcher of watched.values()) watcher.fail();
    console.error('[Flamo] Component module failed to load', error);
  });
}

loadFlamoComponent("flamo-pipe-1", () => import('./flamo-pipe-1.js'));
