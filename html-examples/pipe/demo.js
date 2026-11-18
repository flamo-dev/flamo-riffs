import { language, text } from '../common/riffs-language.js';
import { attachPipePreview } from './preview-viewport.js';

// Exact behavior roots from the installed exports. These packages have no
// element-level surface methods; the managed pipe scripts expose RuntimeNode
// methods. Resolve within each element's own instance, never by global name.
const components = {
  '1': { nodes: ['13:15'], contract: 'sha256:569f9f8ff80050d0129b59adcc91635b69b5d3b6e9d31ec46df62323626fa03c' },
  '2': { nodes: ['21:3'], contract: 'sha256:e1ccd6358dfdca6a857d12ea5696ce53c2f2edb174fcb8d9dfde11903a9fc263' },
  '3': { nodes: ['10:11'], contract: 'sha256:b216118d3100de60d188b42d4f1d04ef2096d8036348887e8652461c19a7f815' },
  '4': { nodes: ['94:21'], contract: 'sha256:35f73cadd61da17f49d4f7cbd7f47115589c8f7db18b94bca70b76aa15b3c471' },
  group: { nodes: ['23:7', '23:10', '23:14', '23:18'], contract: 'sha256:28d7d4ea924aa9f3ed45223b5d13649e1d485ada56c4d6e217f1e91b9f7abad8' },
};

const cards = [...document.querySelectorAll('[data-pipe]')];
function updateOverview() {
  const running = cards.filter(card => card.dataset.running === 'true').length;
  const ready = cards.filter(card => card.dataset.ready === 'true').length;
  const failed = cards.filter(card => card.dataset.failed === 'true').length;
  document.querySelector('#running-count').textContent = String(running).padStart(2, '0');
  document.querySelector('#workspace-status').textContent = failed
    ? text(`${ready} / 5 ready · ${failed} to retry`, `${ready} / 5 已就绪 · ${failed} 个组件待重试`)
    : ready === cards.length ? text('All ready · Independent controls', '全部就绪 · 独立控制')
      : text(`${ready} / 5 ready`, `${ready} / 5 组件已就绪`);
}

language.addEventListener('change', updateOverview);

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
    overlay.hidden = false;
    card.querySelector('.loading-indicator').hidden = true;
    card.querySelector('.retry').hidden = false;
    renderLabels();
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
    renderLabels();
    updateOverview();
  }

  function renderLabels() {
    const pill = card.querySelector('[data-state-label]');
    if (card.dataset.ready !== 'true') {
      const failed = card.dataset.failed === 'true';
      pill.textContent = failed ? text('Unavailable', '暂不可用') : text('Loading', '加载中');
      card.querySelector('[data-loading-message]').textContent = failed
        ? text('Component unavailable. Reload to try again.', '组件暂不可用，请刷新重试')
        : key === 'group' ? text('Loading pipe network…', '正在加载管网…') : text('Loading pipe…', '正在加载管道…');
      if (failed) errorMessage.textContent = location.protocol === 'file:'
        ? text('Open this page through a local HTTP server.', '请通过本地 HTTP 服务打开此页面。')
        : text('Could not load or control this component. Check the resource server and reload.', '加载或控制失败，请检查本地资源服务后刷新重试。');
      return;
    }
    const running = card.dataset.running === 'true';
    const forward = card.dataset.direction === 'forward';
    const flow = card.dataset.direction === 'mixed' ? text('Mixed', '混合') : forward ? text('Forward', '正向') : text('Reverse', '反向');
    const next = forward ? text('Reverse', '反向') : text('Forward', '正向');
    const action = running ? text('Pause', '暂停') : text('Start', '开始');
    const name = card.querySelector('h3').textContent;
    pill.textContent = running ? text('Running', '运行中') : text('Paused', '已暂停');
    play.querySelector('span').textContent = action;
    play.querySelector('use').setAttribute('href', running ? '#icon-pause' : '#icon-play');
    play.setAttribute('aria-label', text(action + ' ' + name, action + name));
    direction.querySelector('span').textContent = flow;
    direction.querySelector('use').setAttribute('href', forward ? '#icon-forward' : '#icon-reverse');
    direction.title = text(flow + ' flow. Switch to ' + next + '.', '当前' + flow + '，点击切换为' + next);
    direction.setAttribute('aria-label', name + ' · ' + direction.title);
  }

  language.addEventListener('change', renderLabels);
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
    renderLabels();
    overlay.hidden = false;
    errorMessage.hidden = true;
    card.querySelector('.loading-indicator').hidden = false;
    card.querySelector('.retry').hidden = true;
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
