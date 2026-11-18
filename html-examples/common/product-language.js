// Also distributed as an ES module with the standalone Flamo Riffs site.
const endpoint = '/api/account/language';
const guestKey = 'flamo_guest_language';
const accountKey = id => 'flamo.language.account.' + id;
const supported = value => value === 'en' || value === 'zh-CN';

function cached(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function cache(key, value) {
  try { localStorage.setItem(key, value); } catch { /* Storage can be disabled. */ }
}

function guestLanguage() {
  let value;
  try { value = document.cookie.match(/(?:^|; )flamo_guest_language=(en|zh-CN)(?:;|$)/)?.[1]; } catch {}
  value ??= cached(guestKey);
  return supported(value) ? value : 'en';
}

function saveGuest(value) {
  cache(guestKey, value);
  try {
    const shared = ['flamo.dev', 'riffs.flamo.dev'].includes(location.hostname);
    document.cookie = guestKey + '=' + value + '; Max-Age=31536000; Path=/; SameSite=Lax' +
      (shared ? '; Domain=flamo.dev; Secure' : '');
  } catch {}
}

function websiteRequest(path, init) {
  const riffs = location.hostname === 'riffs.flamo.dev';
  const headers = new Headers(init.headers);
  // Only the Studio origin owns the Web login token. Riffs uses a scoped,
  // host-only cookie on the API origin and receives only the language record.
  const token = !riffs && cached('flamo_studio_token');
  if (token) headers.set('Authorization', 'Bearer ' + token);
  return fetch((riffs ? 'https://flamo.dev' : '') + path, { ...init, headers, credentials: 'include' });
}

class ProductLanguage extends EventTarget {
  value = guestLanguage();
  #session;
  #timer;

  #apply(value) {
    if (typeof document !== 'undefined') document.documentElement.lang = value;
    if (value === this.value) return;
    this.value = value;
    this.dispatchEvent(new Event('change'));
  }

  // expectedAccount is omitted by public sites, null for signed-out Studio,
  // or the current Studio user ID (also identifies the correct offline cache).
  start(request = websiteRequest, expectedAccount) {
    this.stop();
    this.#session = { request, expectedAccount, account: expectedAccount, generation: 0, writes: 0, queue: Promise.resolve() };
    const saved = expectedAccount && cached(accountKey(expectedAccount));
    this.#apply(expectedAccount ? (supported(saved) ? saved : 'en') : guestLanguage());
    window.addEventListener('focus', this.#refreshVisible);
    window.addEventListener('pageshow', this.#refreshVisible);
    window.addEventListener('online', this.#refreshVisible);
    window.addEventListener('storage', this.#storageChanged);
    document.addEventListener('visibilitychange', this.#refreshVisible);
    this.#timer = setInterval(this.#refreshVisible, 15000);
    return this.refresh();
  }

  stop() {
    this.#session = undefined;
    clearInterval(this.#timer);
    if (typeof window === 'undefined') return;
    window.removeEventListener('focus', this.#refreshVisible);
    window.removeEventListener('pageshow', this.#refreshVisible);
    window.removeEventListener('online', this.#refreshVisible);
    window.removeEventListener('storage', this.#storageChanged);
    document.removeEventListener('visibilitychange', this.#refreshVisible);
  }

  #refreshVisible = () => { if (!document.hidden) void this.refresh(); };
  #storageChanged = ({ key }) => {
    if (!key || key === guestKey || key === 'flamo_studio_token' || key === accountKey(this.#session?.account)) this.#refreshVisible();
  };

  async #read(session) {
    if (session.expectedAccount === null) return { accountId: null, language: null };
    const response = await session.request(endpoint, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw Error('Language preference unavailable');
    const record = await response.json();
    if (record.accountId === null && session.expectedAccount === undefined) return record;
    if (!record.accountId || !supported(record.language) ||
        (session.expectedAccount && session.expectedAccount !== record.accountId)) throw Error('Language account changed');
    return record;
  }

  #use(record, session) {
    session.account = record.accountId;
    if (record.accountId) cache(accountKey(record.accountId), record.language);
    this.#apply(record.accountId ? record.language : guestLanguage());
    this.dispatchEvent(new Event('preference-resolved'));
  }

  async refresh() {
    const session = this.#session;
    if (!session || session.writes) return;
    const generation = ++session.generation;
    try {
      const record = await this.#read(session);
      if (session === this.#session && generation === session.generation) this.#use(record, session);
    } catch { /* Keep the current language when a read fails. */ }
  }

  choose(value) {
    const session = this.#session;
    if (!session || !supported(value)) return Promise.reject(Error('Unsupported language'));
    session.generation++;
    session.writes++;
    const save = async () => {
      if (session !== this.#session) throw Error('Language account changed');
      // Read the current identity before writing. A login/logout in another
      // tab must never turn a pending choice into a write for another user.
      const record = await this.#read(session);
      if (session !== this.#session || (session.account !== undefined && record.accountId !== session.account)) {
        throw Error('Language account changed');
      }
      if (record.accountId) {
        const response = await session.request(endpoint, {
          method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(12000),
          headers: { 'Content-Type': 'application/json', 'X-Flamo-Language': '1' },
          body: JSON.stringify({ accountId: record.accountId, language: value }),
        });
        if (!response.ok) throw Error('Could not save language preference');
        const saved = await response.json();
        if (session !== this.#session || saved.accountId !== record.accountId || saved.language !== value) throw Error('Language account changed');
        this.#use(saved, session);
      } else {
        saveGuest(value);
        session.account = null;
        this.#apply(value);
      }
    };
    const result = session.queue.then(save).finally(() => { session.writes--; });
    session.queue = result.catch(() => { if (this.#session === session) void this.refresh(); });
    return result;
  }
}

export const language = new ProductLanguage();
