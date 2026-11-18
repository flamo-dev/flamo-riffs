import { language } from './product-language.js';

export { language };
export const text = (english, chinese) => language.value === 'zh-CN' ? chinese : english;

const bindings = [];
const textPairs = new WeakMap();
const attributes = ['aria-label', 'aria-valuetext', 'alt', 'content', 'loading-label', 'placeholder', 'title'];
const localizedElements = ['[data-zh]', ...attributes.map(name => '[data-zh-' + name + ']')].join(',');

// Keep the English HTML available to crawlers and preserve videos, focus and component instances on switch.
export function bindCopy(root) {
  for (const element of root.querySelectorAll(localizedElements)) {
    if (element.hasAttribute('data-zh')) {
      const nodes = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.data.trim());
      const pairs = nodes.map((node, index) => {
        const source = node.data;
        const translation = index === 0 ? element.dataset.zh : element.dataset.zhNext;
        if (!translation) return;
        const chinese = source.replace(source.trim(), translation);
        const update = () => {
          const value = text(source, chinese);
          if (node.data !== value) node.data = value;
        };
        bindings.push(update);
        update();
        return [source, chinese];
      });
      textPairs.set(element, pairs.filter(Boolean).flat().join(' '));
    }
    for (const name of attributes) {
      const chinese = element.getAttribute('data-zh-' + name);
      if (chinese === null) continue;
      const english = element.getAttribute(name);
      const update = () => {
        const value = text(english, chinese);
        if (element.getAttribute(name) !== value) element.setAttribute(name, value);
      };
      bindings.push(update);
      update();
    }
  }
}

export function searchableCopy(entry) {
  return [entry.textContent, entry.dataset.keywords, ...Array.from(entry.querySelectorAll('[data-zh]'), el => textPairs.get(el))].join(' ');
}

class LanguagePicker extends HTMLElement {
  connectedCallback() {
    if (!this.firstElementChild) {
      this.innerHTML = `<label class="riffs-language-control">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>
        <select><option value="en" lang="en">English</option><option value="zh-CN" lang="zh-CN">中文</option></select>
      </label><span class="riffs-language-error" role="alert" hidden></span>`;
      this.select = this.querySelector('select');
      this.error = this.querySelector('[role="alert"]');
      this.select.addEventListener('change', async () => {
        this.select.disabled = true;
        this.error.hidden = true;
        try {
          await language.choose(this.select.value);
        } catch {
          this.error.textContent = text('Could not save the language. Please try again.', '语言设置未能保存，请重试。');
          this.error.hidden = false;
        } finally {
          this.select.disabled = false;
          this.refresh();
        }
      });
    }
    this.refresh();
    language.addEventListener('change', this.refresh);
  }
  disconnectedCallback() {
    language.removeEventListener('change', this.refresh);
  }
  refresh = () => {
    this.select.value = language.value;
    this.select.ariaLabel = this.select.title = text('Change language', '切换语言');
  };
}
customElements.define('riffs-language-picker', LanguagePicker);
bindCopy(document);
function refreshCopy() {
  document.documentElement.lang = language.value;
  for (const update of bindings) update();
}
language.addEventListener('change', refreshCopy);
refreshCopy();

// A returning user may enter Riffs before visiting the updated Studio. Restore
// the old Web login on its owning origin before treating the visitor as a guest.
const officialOrigin = 'https://flamo.dev';
let restoration;
let checkedSession = false;
function restoreWebSession() {
  if (restoration) return restoration;
  restoration = new Promise(resolve => {
    const frame = document.createElement('iframe');
    frame.hidden = true;
    frame.title = 'Flamo language session';
    frame.referrerPolicy = 'origin';
    const finish = restored => {
      window.removeEventListener('message', receive);
      clearTimeout(timeout);
      frame.remove();
      resolve(restored);
    };
    const receive = event => {
      if (event.origin === officialOrigin && event.source === frame.contentWindow &&
          event.data?.type === 'flamo-language-session') finish(event.data.restored === true);
    };
    const timeout = setTimeout(() => finish(false), 6500);
    window.addEventListener('message', receive);
    frame.src = officialOrigin + '/language-session.html';
    document.body.append(frame);
  });
  return restoration;
}

async function galleryRequest(path, init) {
  const send = () => fetch(officialOrigin + path, { ...init, credentials: 'include' });
  const response = await send();
  if (checkedSession || init.method || !response.ok) return response;
  if ((await response.clone().json()).accountId !== null) {
    checkedSession = true;
    return response;
  }
  const restored = await restoreWebSession();
  checkedSession = true;
  return restored ? send() : response;
}
language.start(location.hostname === 'riffs.flamo.dev' ? galleryRequest : undefined);
