// raw/engineering/packages/shared/src/artifact-resources/geometry.ts
var arities = { M: 2, m: 2, L: 2, l: 2, H: 1, h: 1, V: 1, v: 1, C: 6, c: 6, S: 4, s: 4, Q: 4, q: 4, T: 2, t: 2, A: 7, a: 7, Z: 0, z: 0 };
var finite = (n) => typeof n === "number" && Number.isFinite(n);
var bad = () => {
  throw new Error("Artifact resources: invalid geometry block");
};
function decodeGeometry(kind, data, count) {
  if (!Number.isSafeInteger(count) || count < 0 || count > 64 * 1024 * 1024) bad();
  const stride = kind.endsWith("32") ? 4 : 8, view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let at = 0, consumed = 0;
  const claim = (bytes, values = 1) => {
    if (at + bytes > data.length || consumed + values > count) bad();
    consumed += values;
  };
  const u32 = () => {
    claim(4);
    const n = view.getUint32(at, true);
    at += 4;
    return n;
  };
  const number = (size = stride) => {
    claim(size);
    const n = size === 4 ? view.getFloat32(at, true) : view.getFloat64(at, true);
    at += size;
    if (!finite(n)) bad();
    return n;
  };
  if (kind.startsWith("commands")) {
    const result = [];
    while (at < data.length) {
      claim(1);
      const op = String.fromCharCode(data[at++]);
      if (!Object.hasOwn(arities, op)) bad();
      result.push(op);
      for (let i = 0; i < arities[op]; i++) result.push(number());
    }
    if (consumed !== count) bad();
    return result;
  }
  const vertexCount = u32(), segmentCount = u32(), regionCount = u32();
  if (vertexCount * (4 + 2 * stride) + segmentCount * (12 + 4 * stride) + regionCount * 13 > data.length - at) bad();
  const vertices = [], segments = [], regions = [];
  for (let i = 0; i < vertexCount; i++) vertices.push({ styleID: u32(), x: number(), y: number() });
  for (let i = 0; i < segmentCount; i++) {
    const styleID = u32(), start = { vertex: u32(), dx: number(), dy: number() }, end = { vertex: u32(), dx: number(), dy: number() };
    if (start.vertex >= vertexCount || end.vertex >= vertexCount) bad();
    segments.push({ styleID, start, end });
  }
  for (let i = 0; i < regionCount; i++) {
    const styleID = number(8);
    claim(1);
    const rule = data[at++];
    if (rule > 1) bad();
    const loopCount = u32(), loops = [];
    if (loopCount * 4 > data.length - at) bad();
    for (let j = 0; j < loopCount; j++) {
      const indexCount = u32(), indices = [];
      if (indexCount * 4 > data.length - at) bad();
      for (let k = 0; k < indexCount; k++) {
        const n = u32();
        if (n >= segmentCount) bad();
        indices.push(n);
      }
      loops.push({ segments: indices });
    }
    regions.push({ styleID, windingRule: rule ? "NONZERO" : "ODD", loops });
  }
  if (at !== data.length || consumed !== count) bad();
  return { vertices, segments, regions };
}

// node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function abytes(b, ...lengths) {
  if (!isBytes(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error("digestInto() expects output buffer of length at least " + min);
  }
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  abytes(data);
  return data;
}
var Hash = class {
};
function createHasher(hashCons) {
  const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
  const tmp = hashCons();
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = () => hashCons();
  return hashC;
}

// node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/_md.js
function setBigUint64(view, byteOffset, value, isLE) {
  if (typeof view.setBigUint64 === "function")
    return view.setBigUint64(byteOffset, value, isLE);
  const _32n = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n & _u32_max);
  const wl = Number(value & _u32_max);
  const h = isLE ? 4 : 0;
  const l = isLE ? 0 : 4;
  view.setUint32(byteOffset + h, wh, isLE);
  view.setUint32(byteOffset + l, wl, isLE);
}
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var HashMD = class extends Hash {
  constructor(blockLen, outputLen, padOffset, isLE) {
    super();
    this.finished = false;
    this.length = 0;
    this.pos = 0;
    this.destroyed = false;
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    aexists(this);
    data = toBytes(data);
    abytes(data);
    const { view, buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    clean(this.buffer.subarray(pos));
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      pos = 0;
    }
    for (let i = pos; i < blockLen; i++)
      buffer[i] = 0;
    setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
    this.process(view, 0);
    const oview = createView(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to || (to = new this.constructor());
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    if (length % blockLen)
      to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);

// node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/sha2.js
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA256 = class extends HashMD {
  constructor(outputLen = 32) {
    super(64, outputLen, 8, false);
    this.A = SHA256_IV[0] | 0;
    this.B = SHA256_IV[1] | 0;
    this.C = SHA256_IV[2] | 0;
    this.D = SHA256_IV[3] | 0;
    this.E = SHA256_IV[4] | 0;
    this.F = SHA256_IV[5] | 0;
    this.G = SHA256_IV[6] | 0;
    this.H = SHA256_IV[7] | 0;
  }
  get() {
    const { A, B, C, D, E, F, G, H } = this;
    return [A, B, C, D, E, F, G, H];
  }
  // prettier-ignore
  set(A, B, C, D, E, F, G, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G | 0;
    this.H = H | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA256_W[i] = view.getUint32(offset, false);
    for (let i = 16; i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G, H } = this;
    for (let i = 0; i < 64; i++) {
      const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
      const T2 = sigma0 + Maj(A, B, C) | 0;
      H = G;
      G = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G = G + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G, H);
  }
  roundClean() {
    clean(SHA256_W);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean(this.buffer);
  }
};
var sha256 = /* @__PURE__ */ createHasher(() => new SHA256());

// node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/sha256.js
var sha2562 = sha256;

// raw/engineering/packages/shared/src/sha256.ts
async function sha256Digest(bytes) {
  const subtle = globalThis.crypto?.subtle;
  if (typeof subtle?.digest === "function") {
    return new Uint8Array(await subtle.digest("SHA-256", bytes));
  }
  return sha2562(bytes);
}

// raw/engineering/packages/shared/src/artifact-resources/index.ts
var RESOURCE_SCHEMA = "flamo.resources/2";
var DEFAULT_LIMITS = { maxBytes: 512 * 1024 * 1024, maxValues: 64 * 1024 * 1024, maxBindings: 1e5, maxDepth: 256 };
var OPS = "MmLlHhVvCcSsQqTtAaZz";
var HASH = /^[a-f0-9]{64}$/;
var own = (o, key) => Object.prototype.hasOwnProperty.call(o, key);
var fail = (message) => {
  throw new Error(`Artifact resources: ${message}`);
};
var checkAbort = (signal) => signal?.throwIfAborted();
async function resourceHash(bytes) {
  const hash = await sha256Digest(bytes);
  return Array.from(hash, (b) => b.toString(16).padStart(2, "0")).join("");
}
function join(parts, size) {
  const out = new Uint8Array(size);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}
var ResourceDocument = class {
  constructor(manifest, readChunk, limits = {}) {
    this.manifest = manifest;
    this.readChunk = readChunk;
    this.limits = { ...DEFAULT_LIMITS, ...limits };
    if (manifest?.schema !== RESOURCE_SCHEMA) fail("unsupported schema");
    if (!Array.isArray(manifest.blocks) || !Array.isArray(manifest.bindings) || !manifest.chunks || typeof manifest.chunks !== "object") fail("invalid index");
    if (manifest.bindings.length > this.limits.maxBindings || manifest.blocks.length > this.limits.maxBindings) fail("index exceeds budget");
    let totalBytes = 0, totalValues = 0;
    for (const [hash, size] of Object.entries(manifest.chunks)) {
      if (!HASH.test(hash) || !Number.isSafeInteger(size) || size < 0) fail("invalid chunk");
      totalBytes += size;
    }
    if (totalBytes > this.limits.maxBytes) fail("byte budget exceeded");
    for (const b of manifest.blocks) {
      const kinds = ["u8", "f32", "f64", "path32", "path64", "commands32", "commands64", "network32", "network64"];
      if (!b || !kinds.includes(b.kind) || !HASH.test(b.hash) || !own(manifest.chunks, b.chunk)) fail("invalid block");
      if (![b.count, b.offset, b.byteLength].every((n) => Number.isSafeInteger(n) && n >= 0) || b.offset + b.byteLength > manifest.chunks[b.chunk]) fail("invalid block bounds");
      const stride = b.kind === "u8" ? 1 : b.kind.endsWith("32") ? 4 : 8;
      if (b.kind.startsWith("network") || b.kind.startsWith("commands")) {
        if (b.byteLength < b.count || b.byteLength > b.count * 8) fail("invalid geometry length");
      } else if (b.kind.startsWith("path") ? b.byteLength < b.count || b.byteLength > b.count * (stride + 1) : b.byteLength !== b.count * stride) fail("invalid block length");
    }
    this.document = structuredClone(manifest.document);
    const paths = /* @__PURE__ */ new Set();
    for (const binding of manifest.bindings) {
      if (!binding || !Array.isArray(binding.path) || !binding.path.length || binding.path.length > this.limits.maxDepth || !binding.path.every((k) => typeof k === "string") || !["array", "indexed-object", "number", "object"].includes(binding.form) || !Number.isSafeInteger(binding.resource) || !manifest.blocks[binding.resource]) fail("invalid binding");
      if (binding.form === "object" !== manifest.blocks[binding.resource].kind.startsWith("network")) fail("invalid geometry binding");
      if (manifest.blocks[binding.resource].kind.startsWith("commands") && binding.form !== "array") fail("invalid command binding");
      if (binding.form === "number" && (manifest.blocks[binding.resource].count !== 1 || manifest.blocks[binding.resource].kind.startsWith("path"))) fail("invalid scalar binding");
      totalValues += manifest.blocks[binding.resource].count;
      if (totalValues > this.limits.maxValues) fail("decoded value budget exceeded");
      const identity = JSON.stringify(binding.path);
      if (paths.has(identity)) fail("duplicate binding");
      paths.add(identity);
      let parent = this.document;
      for (const key2 of binding.path.slice(0, -1)) {
        if (!parent || typeof parent !== "object" || !own(parent, key2)) fail("invalid binding path");
        const descriptor = Object.getOwnPropertyDescriptor(parent, key2);
        if (!("value" in descriptor)) fail("overlapping binding");
        parent = descriptor.value;
      }
      const key = binding.path[binding.path.length - 1];
      if (!parent || typeof parent !== "object" || !own(parent, key) || Object.getOwnPropertyDescriptor(parent, key)?.value !== null) fail("binding must replace a null placeholder");
      const field = { binding, parent, key, loaded: false };
      this.fields.push(field);
      Object.defineProperty(parent, key, { configurable: true, enumerable: true, get: () => fail("resource has not been loaded"), set: () => fail("load resource before editing") });
    }
  }
  document;
  limits;
  bytes = /* @__PURE__ */ new Map();
  pending = /* @__PURE__ */ new Map();
  fields = [];
  async load(paths = [[]], signal) {
    checkAbort(signal);
    const fields = this.fields.filter((f) => !f.loaded && paths.some((p) => p.every((k, i) => f.binding.path[i] === k)));
    const chunks2 = [...new Set(fields.map((f) => this.manifest.blocks[f.binding.resource].chunk))];
    let cursor = 0;
    const requests = await Promise.allSettled(Array.from({ length: Math.min(4, chunks2.length) }, async () => {
      while (cursor < chunks2.length) {
        checkAbort(signal);
        const hash = chunks2[cursor++];
        if (this.bytes.has(hash)) continue;
        let pending = this.pending.get(hash);
        if (!pending) {
          pending = (async () => {
            const data = await this.readChunk(hash, signal);
            checkAbort(signal);
            if (data.length !== this.manifest.chunks[hash] || await resourceHash(data) !== hash) fail("chunk integrity mismatch");
            this.bytes.set(hash, data);
          })().finally(() => this.pending.delete(hash));
          this.pending.set(hash, pending);
        }
        await pending;
      }
    }));
    const failed = requests.find((result) => result.status === "rejected");
    if (failed) throw failed.reason;
    let deadline = performance.now() + 8;
    for (const field of fields) {
      checkAbort(signal);
      if (field.loaded) continue;
      const b = this.manifest.blocks[field.binding.resource], chunk = this.bytes.get(b.chunk);
      const data = chunk.subarray(b.offset, b.offset + b.byteLength);
      if (await resourceHash(data) !== b.hash) fail("block integrity mismatch");
      if (b.kind.startsWith("network") || b.kind.startsWith("commands")) {
        const value2 = decodeGeometry(b.kind, data, b.count);
        Object.defineProperty(field.parent, field.key, { configurable: true, enumerable: true, writable: true, value: value2 });
        field.loaded = true;
        if (performance.now() >= deadline) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          deadline = performance.now() + 8;
        }
        continue;
      }
      const view = new DataView(data.buffer, data.byteOffset, data.length), values = new Array(b.count);
      const stride = b.kind === "u8" ? 1 : b.kind.endsWith("32") ? 4 : 8;
      let at = 0;
      for (let i = 0; i < b.count; i++) {
        if (i % 16384 === 0 && performance.now() >= deadline) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          checkAbort(signal);
          deadline = performance.now() + 8;
        }
        if (at >= data.length) fail("truncated block");
        if (b.kind.startsWith("path")) {
          const tag = data[at++];
          if (tag) {
            if (tag > OPS.length) fail("invalid path opcode");
            values[i] = OPS[tag - 1];
            continue;
          }
        }
        if (at + stride > data.length) fail("truncated coordinate");
        const value2 = stride === 1 ? data[at] : stride === 4 ? view.getFloat32(at, true) : view.getFloat64(at, true);
        if (!Number.isFinite(value2)) fail("non-finite coordinate");
        values[i] = value2;
        at += stride;
      }
      if (at !== data.length) fail("trailing block data");
      const value = field.binding.form === "number" ? values[0] : field.binding.form === "array" ? values : Object.fromEntries(values.map((v, i) => [i, v]));
      Object.defineProperty(field.parent, field.key, { configurable: true, enumerable: true, writable: true, value });
      field.loaded = true;
      if (performance.now() >= deadline) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        deadline = performance.now() + 8;
      }
    }
  }
  /** Bytes may be discarded after full hydration; editor-owned arrays remain. */
  releaseBytes() {
    this.bytes.clear();
  }
};
async function readResourceResponse(response, maxBytes, signal) {
  if (!response.ok) fail(`HTTP ${response.status}`);
  const declared = Number(response.headers.get("Content-Length"));
  if (declared > maxBytes) fail("response exceeds byte budget");
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader(), parts = [];
  let size = 0;
  const abort = () => {
    void reader.cancel(signal?.reason);
  };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    while (true) {
      checkAbort(signal);
      const next = await reader.read();
      checkAbort(signal);
      if (next.done) break;
      size += next.value.length;
      if (size > maxBytes) fail("response exceeds byte budget");
      parts.push(next.value);
    }
    return join(parts, size);
  } finally {
    signal?.removeEventListener("abort", abort);
    await reader.cancel().catch(() => void 0);
    reader.releaseLock();
  }
}

// raw/engineering/packages/shared/src/artifact-resources/component-loader.ts
var manifests = /* @__PURE__ */ new Map();
var pendingChunks = /* @__PURE__ */ new Map();
var chunks = /* @__PURE__ */ new Map();
var MAX_CACHE_BYTES = 32 * 1024 * 1024;
var cachedBytes = 0;
function waitForResource(pending, signal) {
  if (!signal) return pending;
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    pending.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}
function loadChunk(url, hash, length, signal) {
  signal?.throwIfAborted();
  const key = `${url}:${hash}:${length}`;
  const hit = chunks.get(key);
  if (hit) {
    chunks.delete(key);
    chunks.set(key, hit);
    return Promise.resolve(hit);
  }
  let pending = pendingChunks.get(key);
  if (!pending) {
    pending = (async () => {
      const timeout = AbortSignal.timeout(3e4);
      const bytes = await readResourceResponse(await fetch(url, { signal: timeout }), length, timeout);
      if (bytes.byteLength !== length || await resourceHash(bytes) !== hash) throw new Error("Component resource chunk integrity mismatch");
      if (bytes.byteLength <= MAX_CACHE_BYTES) {
        while (chunks.size && (cachedBytes + bytes.byteLength > MAX_CACHE_BYTES || chunks.size >= 128)) {
          const oldest = chunks.keys().next().value;
          cachedBytes -= chunks.get(oldest).byteLength;
          chunks.delete(oldest);
        }
        chunks.set(key, bytes);
        cachedBytes += bytes.byteLength;
      }
      return bytes;
    })().finally(() => pendingChunks.delete(key));
    pendingChunks.set(key, pending);
  }
  return waitForResource(pending, signal);
}
async function loadPackagedArtifact(moduleUrl, manifestHash, signal) {
  signal?.throwIfAborted();
  const url = new URL("./resources/artifact.json", moduleUrl).href;
  const key = `${url}:${manifestHash}`;
  let pending = manifests.get(key);
  if (!pending) {
    pending = (async () => {
      const timeout = AbortSignal.timeout(3e4);
      const bytes = await readResourceResponse(await fetch(url, { signal: timeout }), 64 * 1024 * 1024, timeout);
      if (await resourceHash(bytes) !== manifestHash) throw new Error("Component resource manifest integrity mismatch");
      return JSON.parse(new TextDecoder().decode(bytes));
    })().catch((error) => {
      manifests.delete(key);
      throw error;
    });
    manifests.set(key, pending);
  }
  const manifest = await waitForResource(pending, signal);
  signal?.throwIfAborted();
  const source = new ResourceDocument(manifest, async (hash, readSignal) => {
    return loadChunk(new URL(`./resources/${hash}.bin`, moduleUrl).href, hash, manifest.chunks[hash], readSignal);
  });
  await source.load(void 0, signal);
  source.releaseBytes();
  return source.document;
}
export {
  loadPackagedArtifact
};
/*! Bundled license information:

@noble/hashes/esm/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
