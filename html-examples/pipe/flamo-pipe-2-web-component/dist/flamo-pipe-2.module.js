// CDN addresses are configured at the top of dist/cdn-config.js.
import { FLAMO_CDN_URLS as __flamoCdn } from "./cdn-config.js";
const { "createFlamoRuntime": createFlamoRuntime, "createFlamoResourcePool": createFlamoResourcePool, "createInteractionTargetController": createInteractionTargetController, "materializeCurrentArtifactComponent": materializeCurrentArtifactComponent, "prepareFigmaSceneNodes": prepareFigmaSceneNodes, "registerProxyBinding": registerProxyBinding, "unregisterProxyBinding": unregisterProxyBinding, "batchUnregisterProxyBindings": batchUnregisterProxyBindings, "dispatchEntityEvent": dispatchEntityEvent, "updateEntityReactiveState": updateEntityReactiveState, "createEntityHandle": createEntityHandle, "computed": computed, "reactive": reactive, "ref": ref, "watch": watch, "getGlobalEventBridge": getGlobalEventBridge, "FlamoConfig": FlamoConfig } = await import(__flamoCdn["runtime"]);
import * as interactions from "./interactions/index.js";
const { "attachComponentViewport": attachComponentViewport } = await import(__flamoCdn["viewport"]);
import { loadPackagedArtifact } from './component-resources.js';

export const flamoComponentManifest = {
  "schemaVersion": 1,
  "kind": "flamo.web-component",
  "viewport": {
    "pan": false,
    "zoom": false,
    "fit": "contain",
    "transparentBackground": true
  },
  "projectId": "9c6e9c90-5573-4133-961c-0a2091f5083d",
  "tagName": "flamo-pipe-2",
  "className": "FlamoPipe2Element",
  "packageName": "@flamo-components/flamo-pipe-2",
  "name": "Pipe-2",
  "generatedAt": "2026-11-09T02:37:40.789Z",
  "source": {
    "kind": "local-fig",
    "id": "0206b9df-14d3-4714-913e-66eeef8dfebf",
    "name": "管道"
  },
  "entry": "dist/flamo-pipe-2.js",
  "types": "dist/flamo-pipe-2.d.ts",
  "surface": {
    "componentPropertiesVersion": "1.0"
  },
  "resources": [],
  "scripts": [
    {
      "id": "managed:hmi.pipe-flow@2.2.0",
      "compiled": ".flamo/interaction-library/managed/behaviors/hmi.pipe-flow/2.2.0.js",
      "kind": "managed",
      "language": "js",
      "behaviorRef": "hmi.pipe-flow",
      "version": "2.2.0"
    }
  ],
  "slots": {},
  "startup": {
    "deferredPaintNodeIds": [
      "21:5"
    ]
  },
  "documentation": {
    "schemaVersion": 1,
    "interactions": "interactions.json",
    "guide": "INTERACTIONS.md",
    "api": "INTERACTION_API.md",
    "integrity": "sha256:3aad36f81aa8c38297a984308c64b3b622ae917ff97c97d06b27ec4ab68a907e"
  },
  "integration": {
    "projectId": "9c6e9c90-5573-4133-961c-0a2091f5083d",
    "contractId": "sha256:978f06c44be8b40833b40723eb22593567d230a399cc3b4d8ef2d4b3b9007439",
    "artifactRevision": "local-4b0a3b2770efb30e3021"
  },
  "interactionTargets": {},
  "assets": [],
  "compiledResources": {
    "schema": "flamo.resources/2",
    "manifest": "dist/resources/artifact.json",
    "integrity": "sha256:93d0abbb0905a2891debd306cc68f6945715cd34485b7d03cdc031c77a4fa2fb",
    "report": {
      "compiler": "flamo.runtime-resources/1",
      "revision": "local-4b0a3b2770efb30e3021",
      "manifestBytes": 8390,
      "binaryBytes": 9896,
      "blocks": 5,
      "references": 6,
      "retained": [
        "selected dependency closure",
        "dynamic scripts and variables",
        "unknown extensions"
      ],
      "decoding": "instance-owned mutable arrays"
    }
  },
  "packaging": {
    "sourceMap": false,
    "includeResources": false,
    "cdnBase": "http://localhost:8080/common/",
    "sharedResources": {
      "runtime": "http://localhost:8080/common/flamo-runtime/index.es.js?v=6d2ff1a7ac46cbf71db7bc0e5e550b1103dfff6826484a351327f677c7d408f6",
      "viewport": "http://localhost:8080/common/component-viewport.js?v=7f533668b721e562ddf4b4d8b1b520b1b229234216c8393b7cf1cf5192a1ccd0"
    },
    "interactions": "local",
    "boundaryNodeId": "21:3",
    "sourceArtifact": "view/data/artifact.flamo.json",
    "artifactRevision": "local-4b0a3b2770efb30e3021"
  },
  "contract": {
    "components": [],
    "bindings": []
  },
  "ai": {
    "entry": "AGENTS.md",
    "usage": "README.md",
    "typeHints": "dist/flamo-pipe-2.d.ts"
  },
  "foundation": {
    "ref": {
      "schemaVersion": 1,
      "namespace": "project.9c6e9c90-5573-4133-961c-0a2091f5083d",
      "id": "component-flamo-pipe-2",
      "version": "0.1.0",
      "exportName": "Pipe2",
      "artifactRevision": "local-4b0a3b2770efb30e3021",
      "artifactHash": "sha256:349f2d9be38361b35e2d4ec8b7cee7c471dd86e426f3f2e28bb77becc8e6128d",
      "runtimeAbi": "runtime-v1",
      "componentAbi": "sha256:61887a960f599e7f7d3c6d2afcb619575fcbf8181fcbcb289c62d15ce60fcc98"
    },
    "componentRef": "flamo://components/project.9c6e9c90-5573-4133-961c-0a2091f5083d/component-flamo-pipe-2@0.1.0#Pipe2",
    "surfaceHash": "sha256:61887a960f599e7f7d3c6d2afcb619575fcbf8181fcbcb289c62d15ce60fcc98",
    "compositionHash": "sha256:f2e3a842f3ffc5dad86175646812d5154e840e04c4fb5c4a1dca8f96baba9e2f",
    "runtimeAbi": "runtime-v1",
    "componentAbi": "sha256:61887a960f599e7f7d3c6d2afcb619575fcbf8181fcbcb289c62d15ce60fcc98"
  },
  "distribution": {
    "loader": "dist/flamo-pipe-2.loader.js",
    "loadingStyles": "dist/component-loading.css",
    "browserEsm": "dist/flamo-pipe-2.module.js",
    "browserEsmManifest": "dist/flamo-pipe-2.browser-manifest.json",
    "thinSingleJs": "dist/flamo-pipe-2.thin.js",
    "thinSingleJsModule": "dist/flamo-pipe-2.thin.module.js",
    "thinSingleJsManifest": "dist/flamo-pipe-2.thin.browser-manifest.json",
    "customElementsManifest": "custom-elements.json"
  }
};
const imageAssets = [];
const publicSurface = flamoComponentManifest.surface ?? {};
const w3cSurface = {"properties":[],"attributes":[],"events":[],"methods":[],"slots":[]};
const packagingSlots = flamoComponentManifest.slots ?? {};

/** Embedded into each exported wrapper; depends only on public instance APIs. */
function installComponentPublicSurface(ElementClass, surface, definitions) {
  const values = new WeakMap();
  const collected = new WeakMap();
  const properties = new Map(surface.properties.map(property => [property.name, property]));
  const attributes = new Map(surface.attributes.map(attribute => [attribute.name, attribute.property]));
  const names = [...properties.keys(), ...surface.methods.map(method => method.name)];
  const used = new Set();
  for (const name of names) {
    if (used.has(name) || name in ElementClass.prototype || name.startsWith('_') ||
        ['ready', 'runtime', 'instance', 'app', 'flamo', 'canvas'].includes(name)) {
      throw new Error('FLAMO_PUBLIC_MEMBER_CONFLICT: ' + name);
    }
    used.add(name);
  }
  if (attributes.size !== surface.attributes.length || attributes.has('paused')) {
    throw new Error('FLAMO_PUBLIC_ATTRIBUTE_CONFLICT');
  }
  const state = element => {
    if (!values.has(element)) values.set(element, new Map());
    return values.get(element);
  };
  const fromAttribute = (element, property) => {
    const raw = property.attribute ? element.getAttribute(property.attribute) : null;
    if (raw === null) {
      const value = definitions[property.name]?.default;
      return value && typeof value === 'object' ? structuredClone(value) : value;
    }
    const definition = definitions[property.name] ?? {};
    const type = definition.schema?.type ?? definition.type;
    if (type === 'boolean') return raw === '' || raw === 'true';
    if (type === 'number' || type === 'integer') {
      const number = Number(raw);
      return Number.isFinite(number) ? number : raw;
    }
    return raw;
  };
  const write = (element, name, value) => {
    // Let Runtime validation throw before retaining a rejected value.
    if (element.isConnected && element.instance) element.instance.set(name, value);
    state(element).set(name, value);
    if (element.isConnected && element.instance) element.syncSlots();
  };
  const collect = element => Object.fromEntries([...properties].map(([name, property]) =>
    [name, state(element).has(name) ? state(element).get(name) : fromAttribute(element, property)])
    .filter(([, value]) => value !== undefined));
  for (const [name, property] of properties) {
    Object.defineProperty(ElementClass.prototype, name, {
      configurable: true, enumerable: true,
      get() {
        if (this.isConnected && this.instance) return this.instance.get(name);
        return state(this).has(name) ? state(this).get(name) : fromAttribute(this, property);
      },
      set(value) { write(this, name, value); },
    });
  }
  for (const method of surface.methods) {
    Object.defineProperty(ElementClass.prototype, method.name, {
      configurable: true, writable: true,
      value(...args) {
        if (!this.isConnected || this.getAttribute('data-flamo-state') !== 'ready' || !this.instance) {
          const error = new Error('FLAMO_COMPONENT_NOT_READY: await element.ready before calling ' + method.name);
          if (/=>\s*Promise\s*</.test(method.signature)) return Promise.reject(error);
          throw error;
        }
        return this.instance.call(method.name, ...args);
      },
    });
  }
  return {
    upgrade(element) {
      // Values assigned before customElements.define shadow prototype setters.
      for (const name of properties.keys()) {
        if (!Object.prototype.hasOwnProperty.call(element, name)) continue;
        const value = element[name];
        delete element[name];
        element[name] = value;
      }
    },
    collect(element) {
      const props = collect(element);
      collected.set(element, new Map(state(element)));
      return props;
    },
    attributeChanged(element, attribute) {
      const name = attributes.get(attribute);
      if (name !== undefined) write(element, name, fromAttribute(element, properties.get(name)));
    },
    flush(element) {
      // A host can change props while runtime.create is awaiting scene readiness.
      const initial = collected.get(element) ?? new Map();
      for (const [name, value] of state(element)) {
        if (!initial.has(name) || !Object.is(initial.get(name), value)) element.instance.set(name, value);
      }
    },
  };
}


function normalizeToNodeArray(raw) {
  if (Array.isArray(raw)) return prepareFigmaSceneNodes(raw);
  if (raw?.scene?.nodes) return prepareFigmaSceneNodes(raw.scene.nodes);
  if (raw?.document?.children) return prepareFigmaSceneNodes(raw.document.children);
  if (raw?.type && typeof raw.type === 'string') return prepareFigmaSceneNodes([raw]);
  return [];
}

function registerPackagedAssets(imageRegistry) {
  for (const image of imageAssets) {
    imageRegistry.registerUrl(image.hash, new URL('./' + image.packagedPath, import.meta.url).href);
  }
}

function propToAttribute(name) {
  return String(name).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

async function createArtifactForMount(signal) {
  const artifactData = await loadPackagedArtifact(import.meta.url, "93d0abbb0905a2891debd306cc68f6945715cd34485b7d03cdc031c77a4fa2fb", signal);
  if (artifactData?.scene?.nodes) {
    const name = flamoComponentManifest.name;
    const boundaryNodeId = flamoComponentManifest.packaging.boundaryNodeId;
    const selected = { ...artifactData,
      exports: { [name]: { name, boundaryNodeId, surface: publicSurface,
        surfaceRef: { kind: 'nodeArtifact', nodeId: boundaryNodeId, path: 'surface' } } },
      metadata: { ...artifactData.metadata, mainExport: name } };
    return materializeCurrentArtifactComponent(selected, name);
  }
  const boundaryNodeId = flamoComponentManifest.packaging?.boundaryNodeId ?? 'artifact:main';
  const exportName = flamoComponentManifest.name ?? 'FlamoComponent';
  return {
    kind: 'flamo.artifact',
    schemaVersion: '0.1',
    scene: {
      format: 'flamo-scene-v0',
      nodes: normalizeToNodeArray(artifactData?.scene?.nodes ?? []),
    },
    nodeArtifacts: {
      [boundaryNodeId]: {
        role: 'component',
        boundary: true,
        capabilities: ['localBehavior', 'publicSurface', 'exportable'],
        surface: publicSurface,
        backend: { kind: 'flamo' },
      },
    },
    exports: {
      [exportName]: {
        name: exportName,
        boundaryNodeId,
        tagName: flamoComponentManifest.tagName,
        surfaceRef: { kind: 'nodeArtifact', nodeId: boundaryNodeId, path: 'surface' },
      },
    },
    metadata: { mainExport: exportName },
  };
}

function createFlamoApi(app) {
  const flamoApi = {
    app,
    registerProxyBinding,
    unregisterProxyBinding,
    batchUnregisterProxyBindings,
    dispatchEntityEvent,
    updateEntityReactiveState,
    createEntityHandle,
    computed,
    reactive,
    ref,
    watch,
    getGlobalEventBridge,
    getBindingCount() {
      return app?._bindingSys?.environments?.size ?? 0;
    },
    hasBinding(nodeId) {
      return app?._bindingSys?.environments?.has(nodeId) ?? false;
    },
  };
  return flamoApi;
}

async function resolvePackagedNodeScript(script) {
  if (typeof interactions.resolveNodeScript === 'function') {
    const resolved = await interactions.resolveNodeScript(script);
    if (resolved) return resolved;
  }
  const compiled = script?.compiled || (script?.id ? '.flamo/generated/interactions/scripts/' + script.id + '/register.js' : '');
  const packagedPath = String(compiled).replace(/^\.flamo\/generated\/interactions\//, "./interactions/");
  if (!packagedPath || packagedPath === String(compiled)) return null;
  return import(packagedPath);
}

export class FlamoPipe2Element extends HTMLElement {
  static get observedAttributes() {
    return ['paused', ...w3cSurface.attributes.map(attribute => attribute.name)];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '<style>:host{display:block;position:relative;width:300px;height:150px;contain:content}.viewport{position:absolute;inset:0;overflow:hidden;opacity:0}:host([data-flamo-state="ready"]) .viewport,:host([data-flamo-state="static"]) .viewport{opacity:1}.canvas-layer{position:sticky;top:0;left:0;width:100%;height:0;z-index:1}canvas{display:block;position:absolute;top:0;left:0}.extent{pointer-events:none}.slot-collector{display:none}</style><div class="viewport" part="viewport" inert><div class="canvas-layer"><canvas part="canvas" tabindex="0"></canvas></div><div class="extent"></div></div><div class="slot-collector"><slot></slot></div>';
    this.canvas = this.shadowRoot.querySelector('canvas');
    this.ready = null;
    this.runtime = null;
    this.instance = null;
    this.app = null;
    this.flamo = null;
    this._slotDisposers = [];
    this._lifecycle = Promise.resolve();
    this._connectionVersion = 0;
    this._retainedApp = null;
    if (Object.prototype.hasOwnProperty.call(this, 'slotStyles')) {
      const styles = this.slotStyles;
      delete this.slotStyles;
      this.slotStyles = styles;
    }
  }

  get slotStyles() { return this._slotStyles ?? ''; }

  getInteractionTarget(targetId) {
    if (!this.isConnected || this.getAttribute('data-flamo-state') !== 'ready') return null;
    return this._interactionTargets?.get(targetId) ?? null;
  }

  inspectInteractionTargets() {
    return this._interactionTargets?.inspect() ?? { generation: 0, destroyed: true, diagnostics: {} };
  }

  set slotStyles(value) {
    if (typeof value !== 'string') throw new TypeError('slotStyles must be a CSS string');
    this._slotStyles = value;
    if (!this._slotStyleElement) {
      this._slotStyleElement = this.ownerDocument.createElement('style');
      this._slotStyleElement.dataset.flamoSlotStyles = '';
      this.shadowRoot.appendChild(this._slotStyleElement);
    }
    this._slotStyleElement.textContent = value;
  }

  connectedCallback() {
    publicBridge.upgrade(this);
    const version = ++this._connectionVersion;
    this.setLoadingState('loading');
    this.dispatchEvent(new CustomEvent('flamo-loading'));
    const mountTask = this._lifecycle
      .catch(() => undefined)
      .then(() => {
        if (!this.isConnected || version !== this._connectionVersion) return this;
        return this.mount();
      });
    this.ready = mountTask;
    this._lifecycle = mountTask.catch(() => undefined);
  }

  disconnectedCallback() {
    this.dispatchEvent(new CustomEvent('flamo-disconnected'));
    this._interactionTargets?.destroy();
    this._interactionTargets = null;
    ++this._connectionVersion;
    this._resourceAbort?.abort();
    this.setLoadingState('loading');
    this.ready = null;
    const destroyTask = this._lifecycle
      .catch(() => undefined)
      .then(() => this.destroy({ preserveReady: true }));
    this._lifecycle = destroyTask.catch(() => undefined);
  }

  attributeChangedCallback(name) {
    if (name === 'paused' && this.app) {
      if (this.hasAttribute('paused')) this.app.pause?.();
      else this.app.resume?.();
      return;
    }
    publicBridge.attributeChanged(this, name);
  }

  collectProps() {
    return publicBridge.collect(this);
  }

  connectSlotCollectors() {
    this._slotDisposers.forEach(dispose => dispose());
    this._slotDisposers = [];
    for (const slot of this.shadowRoot.querySelectorAll('slot')) {
      const listener = () => this.syncSlots();
      slot.addEventListener('slotchange', listener);
      this._slotDisposers.push(() => slot.removeEventListener('slotchange', listener));
    }
  }

  async mount() {
    const version = this._connectionVersion;
    this._resourceAbort = new AbortController();
    try {
      FlamoConfig.setAssetBase(new URL('.', new URL("http://localhost:8080/common/flamo-runtime/index.es.js?v=6d2ff1a7ac46cbf71db7bc0e5e550b1103dfff6826484a351327f677c7d408f6", import.meta.url)).href);
      // Pin CSS size before ECS observes the canvas. Its intrinsic bitmap size
      // must not feed back into CSS layout and grow by DPR on every frame.
      const viewport = this.shadowRoot.querySelector('.viewport');
      this.canvas.style.width = Math.max(1, viewport.clientWidth) + 'px';
      this.canvas.style.height = Math.max(1, viewport.clientHeight) + 'px';
      this._resourcePool ||= createFlamoResourcePool();
      // GPU acquisition and Artifact IO are independent. Reuse this pool's
      // in-flight promise; normal app creation still owns fallback/error handling.
      void this._resourcePool.getGpuResources().catch(() => {});
      registerPackagedAssets(this._resourcePool.imageRegistry);
      const artifact = await createArtifactForMount(this._resourceAbort.signal);
      if (version !== this._connectionVersion || !this.isConnected) return;
      this.runtime ||= createFlamoRuntime({
        canvas: this.canvas,
        resourcePool: this._resourcePool,
        shareApp: true,
        destroySharedAppOnIdle: false,
        // A disconnected Custom Element can reconnect; keep its ECS surface reusable.
        retainSharedCanvasOnIdle: true,
        nodeScriptResolver: resolvePackagedNodeScript,
        appConfig: {
          platform: 'web',
          transparentBackground: true,
          cameraControls: { pan: flamoComponentManifest.viewport.pan, zoom: flamoComponentManifest.viewport.zoom,
            nativeScroll: flamoComponentManifest.viewport.fit !== 'contain' },
          sceneOptions: { expandInstances: false },
          gameLoop: { fixedTimeStep: 1 / 60 },
        },
      });
      // A previous paused mount still owns the retained ECS canvas. Scene loading
      // needs frames before runtime.create resolves; restore paused after loading.
      this._retainedApp?.resume?.();
      let scenePrepared = false;
      const prepareScene = instance => {
        this.instance = instance;
        this.app = instance.app;
        this._retainedApp = this.app;
        publicBridge.flush(this);
        this._disposeViewport?.();
        this._disposeViewport = attachComponentViewport(this, this.app, () => {
          const root = this.instance.resolveNodeId(flamoComponentManifest.packaging.boundaryNodeId);
          return root ? this.app.getNodeProbeSnapshot(root)?.bounds : null;
        }, flamoComponentManifest.viewport);
        this.flamo = instance.createScopedFlamoApi(createFlamoApi(this.app));
        this.connectSlotCollectors();
        this.syncSlots();
        scenePrepared = true;
      };
      const assertConnected = () => {
        if (!this.isConnected || version !== this._connectionVersion) throw new DOMException('Component disconnected', 'AbortError');
      };
      this.instance = await this.runtime.create({
        artifact,
        target: this,
        host: this,
        props: this.collectProps(),
        nodeScriptResolver: resolvePackagedNodeScript,
        deferNodePaintUntilScripts: flamoComponentManifest.startup?.deferredPaintNodeIds ?? [],
        onSceneReady: async instance => {
          assertConnected();
          prepareScene(instance);
          await this.waitForSlotImages();
          await this.app.presentFrame();
          assertConnected();
          this.setLoadingState('static');
          this.dispatchEvent(new CustomEvent('flamo-static-ready', { detail: { manifest: flamoComponentManifest } }));
          // Yield a paint opportunity before the behavior initialization task.
          // A hidden tab must still be able to finish loading without rAF.
          await new Promise(resolve => {
            let frame;
            const signal = this._resourceAbort.signal;
            const finish = () => {
              cancelAnimationFrame(frame);
              document.removeEventListener('visibilitychange', visibility);
              signal.removeEventListener('abort', finish);
              resolve();
            };
            const visibility = () => { if (document.hidden) finish(); };
            if (document.hidden || signal.aborted) { resolve(); return; }
            document.addEventListener('visibilitychange', visibility);
            signal.addEventListener('abort', finish, { once: true });
            frame = requestAnimationFrame(() => { frame = requestAnimationFrame(finish); });
          });
          assertConnected();
          void interactions.preload?.().catch(() => {});
        },
      });
      // Older external Runtime versions do not call onSceneReady.
      if (!scenePrepared) prepareScene(this.instance);
      if (this.hasAttribute('paused')) this.app.pause?.();
      else this.app.resume?.();
      await this.instance.ready;
      publicBridge.flush(this);
      this.syncSlots();
      await this.reloadInteractions();
      await this.waitForSlotImages();
      await this.app.presentFrame();
      if (!this.isConnected || version !== this._connectionVersion) return this;
      this.setLoadingState('ready');
      this._interactionTargets?.destroy();
      this._interactionTargets = createInteractionTargetController(this.instance, flamoComponentManifest.interactionTargets ?? {}, detail => {
        this.dispatchEvent(new CustomEvent('flamo-interaction-targets-change', { detail }));
      });
      this.dispatchEvent(new CustomEvent('flamo-ready', { detail: { app: this.app, instance: this.instance, flamo: this.flamo, manifest: flamoComponentManifest } }));
      return this;
    } catch (error) {
      if (this.isConnected && version === this._connectionVersion) {
        this.setLoadingState('error');
        this.dispatchEvent(new CustomEvent('flamo-error', { detail: { error } }));
      }
      throw error;
    }
  }

  setLoadingState(state) {
    this.setAttribute('data-flamo-state', state);
    this.setAttribute('aria-busy', String(state === 'loading' || state === 'static'));
    this.inert = state !== 'ready';
    this.shadowRoot.querySelector('.viewport').inert = state !== 'ready';
  }

  async waitForSlotImages() {
    // DOM providers may move images into the shadow overlay during a frame.
    const images = new Set([...this.querySelectorAll('img'), ...this.shadowRoot.querySelectorAll('img')]);
    await Promise.all([...images].map(async image => {
      if (!image.complete) await new Promise(resolve => {
        const done = () => { image.removeEventListener('load', done); image.removeEventListener('error', done); resolve(); };
        image.addEventListener('load', done);
        image.addEventListener('error', done);
      });
      if (image.naturalWidth && image.decode) await image.decode().catch(() => undefined);
    }));
  }

  async reloadInteractions() {
    if (!this.flamo) return undefined;
    if (typeof interactions.activateLatest === 'function') return interactions.activateLatest(this.flamo);
    return undefined;
  }

  async destroy({ preserveReady = false } = {}) {
    this.dispatchEvent(new CustomEvent('flamo-destroyed'));
    this._interactionTargets?.destroy();
    this._interactionTargets = null;
    if (!preserveReady) this.setLoadingState('loading');
    this._disposeViewport?.();
    this._disposeViewport = null;
    const runtime = this.runtime;
    const instance = this.instance;
    const app = this.app;
    this._slotDisposers.forEach(dispose => dispose());
    this._slotDisposers = [];
    this.instance = null;
    this.app = null;
    this.flamo = null;
    if (!preserveReady) this.ready = null;
    if (runtime && instance) await runtime.destroy(instance);
    else if (app?.destroy) await app.destroy();
  }

  materializeSlotContent(slot, slotName) {
    const assigned = slot.assignedNodes({ flatten: true }).filter(node => node.nodeType !== Node.TEXT_NODE || node.textContent.trim());
    if (assigned.length === 0) {
      return packagingSlots[slotName]?.defaultContent ?? null;
    }
    if (assigned.length === 1 && assigned[0].nodeType === Node.TEXT_NODE) {
      return assigned[0].textContent;
    }
    return assigned.length === 1 ? assigned[0] : assigned;
  }

  applySlotProps(slotName, content) {
    const props = {};
    const slotIR = packagingSlots[slotName] ?? {};
    for (const [name, definition] of Object.entries(slotIR.props ?? {})) {
      if (definition?.from?.kind === 'prop') props[name] = this.instance?.get?.(definition.from.path);
      else if (definition?.from?.kind === 'literal') props[name] = definition.from.value;
      else if (Object.prototype.hasOwnProperty.call(definition ?? {}, 'default')) props[name] = definition.default;
    }
    const nodes = Array.isArray(content) ? content : [content];
    for (const node of nodes) {
      if (!node || typeof node !== 'object' || node.nodeType === Node.TEXT_NODE) continue;
      node.flamoSlotProps = props;
      for (const [name, value] of Object.entries(props)) {
        if (value === null || value === undefined || typeof value === 'object') continue;
        if (node.setAttribute) node.setAttribute('data-' + propToAttribute(name), String(value));
      }
      node.dispatchEvent?.(new CustomEvent('flamo-slot-props-change', {
        bubbles: true,
        composed: true,
        detail: { slot: slotName, props },
      }));
    }
  }

  syncSlots() {
    if (!this.instance) return;
    const assignments = Object.create(null);
    for (const slot of this.shadowRoot.querySelectorAll('slot')) {
      const name = slot.name || 'default';
      assignments[name] = this.materializeSlotContent(slot, name);
    }
    if (typeof this.instance.mountSlots === 'function') this.instance.mountSlots(assignments);
    else for (const [name, content] of Object.entries(assignments)) this.instance.mountSlot?.(name, content);
    for (const [name, content] of Object.entries(assignments)) this.applySlotProps(name, content);
  }
}

const publicBridge = installComponentPublicSurface(FlamoPipe2Element, w3cSurface, publicSurface.parameters ?? {});

export const componentRef = flamoComponentManifest.foundation.componentRef;
export const runtimeAbi = flamoComponentManifest.foundation.ref.runtimeAbi;
export const componentAbi = flamoComponentManifest.foundation.ref.componentAbi;
export const tagName = 'flamo-pipe-2';

export function registerFlamoComponent() {
  const existing = customElements.get('flamo-pipe-2');
  if (existing && existing !== FlamoPipe2Element) {
    throw new Error('Custom Element tag conflict: flamo-pipe-2');
  }
  if (!existing) customElements.define('flamo-pipe-2', FlamoPipe2Element);
}



export default FlamoPipe2Element;
