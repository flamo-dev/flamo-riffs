import { attachPipePreview } from './preview-viewport.js';

// Exact behavior roots from the installed exports. These packages have no
// element-level surface methods; the managed pipe scripts expose RuntimeNode
// methods. Resolve within each element's own instance, never by global name.
const components = {
  '1': { nodes: ['13:15'], contract: 'sha256:87bf73edc181620df2b90ecadb733ebf7a0d70092d48aeb74af6495ddd8e73bd' },
  '2': { nodes: ['21:3'], contract: 'sha256:978f06c44be8b40833b40723eb22593567d230a399cc3b4d8ef2d4b3b9007439' },
  '3': { nodes: ['10:11'], contract: 'sha256:6b28aa86dc1d1d5f533dd1e7b48abc2182c49ba0b3d413128e4077177eb97c83' },
  '4': { nodes: ['94:21'], contract: 'sha256:c3e02a5ce2301bd12dc9c67a79d81d43e9aeb386e34474dff18e1299a0f327f0' },
  group: { nodes: ['23:7', '23:10', '23:14', '23:18'], contract: 'sha256:f945c5ee7bad5322d40c9b2633f653a316d8013a008a726f826ebe2db3be90f7' },
};

const cards = [...document.querySelectorAll('[data-pipe]')];
function updateOverview() {
  const running = cards.filter(card => card.dataset.running === 'true').length;
  const ready = cards.filter(card => card.dataset.ready === 'true').length;
  const failed = cards.filter(card => card.dataset.failed === 'true').length;
  document.querySelector('#running-count').textContent = String(running).padStart(2, '0');
  document.querySelector('#workspace-status').textContent = failed
    ? `${ready} / 5 已就绪 · ${failed} 个组件待重试`
    : ready === cards.length ? '全部就绪 · 独立控制' : `${ready} / 5 组件已就绪`;
}

for (const card of cards) {
  const key = card.dataset.pipe;
  const tag = `flamo-pipe-${key}`;
  const config = components[key];
  const element = card.querySelector(tag);
  const play = card.querySelector('[data-action="play"]');
  const direction = card.querySelector('[data-action="direction"]');
  const buttons = [play, direction];
  const overlay = card.querySelector('.loading-overlay');
  const errorMessage = card.querySelector('.card-error');
  let handles = [];
  let busy = false;
  let generation = 0;
  let timer;
  let disposePreview = () => {};

  function fail(error) {
    clearTimeout(timer);
    disposePreview();
    card.dataset.failed = 'true';
    card.dataset.ready = 'false';
    delete card.dataset.running;
    buttons.forEach(button => { button.disabled = true; });
    card.querySelector('[data-state-label]').textContent = '暂不可用';
    overlay.hidden = false;
    card.querySelector('.loading-indicator').hidden = true;
    card.querySelector('[data-loading-message]').textContent = '组件暂不可用，请刷新重试';
    card.querySelector('.retry').hidden = false;
    errorMessage.textContent = location.protocol === 'file:'
      ? '请通过本地 HTTP 服务打开此页面。'
      : '加载或控制失败，请检查本地资源服务后刷新重试。';
    errorMessage.hidden = false;
    console.error(`[Pipe demo] ${tag}`, error);
    updateOverview();
  }

  function readStates() {
    if (!handles.length) throw new Error('Pipe behavior is not ready');
    return handles.map(handle => {
      const state = handle.call('getFlowState');
      if (state?.ready === false || state?.error) throw new Error(state.error || 'Pipe motion is still initializing');
      if (!state || typeof state.running !== 'boolean' || !['forward', 'reverse'].includes(state.direction)) {
        throw new Error('Unexpected pipe state');
      }
      return state;
    });
  }

  function render() {
    const states = readStates();
    const running = states.every(state => state.running);
    const forward = states.every(state => state.direction === 'forward');
    const uniformDirection = states.every(state => state.direction === states[0].direction);
    card.dataset.running = String(running);
    card.dataset.direction = uniformDirection ? states[0].direction : 'mixed';
    card.querySelector('[data-state-label]').textContent = running ? '运行中' : '已暂停';
    play.querySelector('span').textContent = running ? '暂停' : '开始';
    play.querySelector('use').setAttribute('href', running ? '#icon-pause' : '#icon-play');
    play.setAttribute('aria-label', `${running ? '暂停' : '开始'}${card.querySelector('h3').textContent}`);
    direction.querySelector('span').textContent = !uniformDirection ? '混合' : forward ? '正向' : '反向';
    direction.querySelector('use').setAttribute('href', forward ? '#icon-forward' : '#icon-reverse');
    direction.title = `当前${!uniformDirection ? '混合方向' : forward ? '正向' : '反向'}，点击切换为${forward ? '反向' : '正向'}`;
    direction.setAttribute('aria-label', `${card.querySelector('h3').textContent}：${direction.title}`);
    updateOverview();
  }

  async function bind() {
    const current = ++generation;
    try {
      await element.ready;
      if (current !== generation || !element.isConnected) return;
      const actual = config.nodes.map(id => element.instance.scene.get(id));
      if (actual.some(handle => !handle)) throw new Error('Exported pipe node is missing');
      handles = actual;
      // Some managed motion scripts finish mounting their particle pool after
      // the custom element's ready event. Do not enable controls prematurely.
      const deadline = performance.now() + 10000;
      while (true) {
        if (current !== generation || !element.isConnected) return;
        try { readStates(); break; }
        catch (error) {
          if (performance.now() >= deadline) throw error;
          await new Promise(resolve => setTimeout(resolve, 80));
        }
      }
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        handles.forEach(handle => handle.call('stopFlow'));
      }
      disposePreview();
      disposePreview = attachPipePreview(element, config.nodes);
      clearTimeout(timer);
      card.dataset.ready = 'true';
      card.dataset.failed = 'false';
      overlay.hidden = true;
      errorMessage.hidden = true;
      element.inert = false;
      element.setAttribute('aria-busy', 'false');
      render();
      buttons.forEach(button => { button.disabled = false; });
    } catch (error) {
      if (current === generation) fail(error);
    }
  }

  function reset() {
    generation++;
    disposePreview();
    disposePreview = () => {};
    handles = [];
    card.dataset.ready = 'false';
    card.dataset.failed = 'false';
    delete card.dataset.running;
    buttons.forEach(button => { button.disabled = true; });
    card.querySelector('[data-state-label]').textContent = '加载中';
    overlay.hidden = false;
    errorMessage.hidden = true;
    card.querySelector('.loading-indicator').hidden = false;
    card.querySelector('.retry').hidden = true;
    card.querySelector('[data-loading-message]').textContent = '正在加载管道…';
    clearTimeout(timer);
    timer = setTimeout(() => fail(new Error('Component load timed out')), 45000);
    updateOverview();
  }

  async function control(action) {
    if (busy || card.dataset.ready !== 'true') return;
    busy = true;
    buttons.forEach(button => { button.disabled = true; });
    try {
      const before = readStates();
      if (action === 'play') {
        const method = before.every(state => state.running) ? 'stopFlow' : 'startFlow';
        handles.forEach(handle => handle.call(method));
        if (readStates().some(state => state.running !== (method === 'startFlow'))) {
          throw new Error('Pipe did not acknowledge playback change');
        }
      } else {
        const next = before.every(state => state.direction === 'forward') ? 'reverse' : 'forward';
        handles.forEach((handle, index) => {
          handle.call('setFlowState', { direction: next });
          if (!before[index].running) handle.call('stopFlow');
        });
        if (readStates().some((state, index) => state.direction !== next || state.running !== before[index].running)) {
          throw new Error('Pipe did not acknowledge direction change');
        }
      }
      render();
    } catch (error) { fail(error); }
    finally {
      busy = false;
      if (card.dataset.ready === 'true') buttons.forEach(button => { button.disabled = false; });
    }
  }

  play.addEventListener('click', () => control('play'));
  direction.addEventListener('click', () => control('direction'));
  card.querySelector('.retry').addEventListener('click', () => location.reload());
  element.addEventListener('flamo-loading', reset);
  element.addEventListener('flamo-ready', bind);
  element.addEventListener('flamo-error', event => fail(event.detail));
  for (const event of ['flamo-disconnected', 'flamo-destroyed']) {
    element.addEventListener(event, () => { reset(); clearTimeout(timer); });
  }
  reset();
  if (location.protocol === 'file:') {
    fail(new Error('HTTP server required'));
    continue;
  }
  // Import each package independently so one missing component cannot prevent
  // the remaining cards from loading. Keep generated exports byte-for-byte.
  (async () => {
    const base = `./${tag}-web-component/`;
    const response = await fetch(`${base}manifest.json`);
    if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
    const manifest = await response.json();
    if (manifest.integration?.contractId !== config.contract) throw new Error('Component contract changed; review node bindings before upgrading');
    await import(`${base}dist/${tag}.js`);
    await customElements.whenDefined(tag);
    if (element.getAttribute('data-flamo-state') === 'ready') await bind();
  })().catch(fail);
}
