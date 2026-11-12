// Runs once per scene, off the UI thread. Only final vertex/index buffers cross the boundary.
function materialLibrary({ rows, calls, names }) {
  const cache = new Map();
  function getMaterial(id) {
    if (cache.has(id)) return cache.get(id);
    const row = rows[id],
      m = row.basic ? new api.unlit() : new api.material();
    m.name = row.name;
    m.color.fromArray(row.color);
    m.vertexColors = row.vertexColors;
    m.transparent = row.transparent;
    m.roughness = row.roughness;
    m.defines = row.defines;
    m.alphaTest = row.alphaTest;
    if (row.userData)
      m.userData = {
        interior: row.userData.interior,
        tile: row.userData.tile,
        sl: { uSlUv: { value: new api.vector(1, 1, row.userData.scale) } },
      };
    if (row.image) m.map = new api.texture(new OffscreenCanvas(...row.image));
    cache.set(id, m);
    return m;
  }
  const library = { names };
  for (const name of ['get', 'emissive', 'decal', 'label', 'number', 'tileOf']) {
    library[name] = (...args) => {
      const key = JSON.stringify([name, ...args]);
      if (!Object.hasOwn(calls, key)) throw Error('Unrecorded harbour material ' + key);
      const id = calls[key];
      if (name === 'tileOf') return id;
      const material = getMaterial(id);
      return ['decal', 'label', 'number'].includes(name)
        ? { material, texture: material.map, aspect: rows[id].aspect }
        : material;
    };
  }
  return library;
}
async function buildHarbor({ materials, meshLayers, extras }) {
  const g = {
    params: { seed: '4207', q: 'low', shot: '1' },
    rng: api.rng(4207),
    scene: new api.scene(),
    quality: api.quality('low'),
    events: api.events(),
    time: { t: 0 },
  };
  g.mats = materialLibrary(materials);
  g.physics = api.physics(g);
  g.props = api.props(g);
  g.level = await api.level(g);
  g.backdrop = await api.backdrop(g);
  for (const extra of extras) {
    const geo = new api.geometry();
    for (const [key, [size, array]] of Object.entries(extra.attributes))
      geo.setAttribute(key, new api.attribute(new Float32Array(array), size));
    if (extra.indices) geo.setIndex(extra.indices);
    const material = new api.material();
    material.name = extra.material;
    material.roughness = extra.roughness;
    material.vertexColors = extra.vertexColors;
    material.color.fromArray(extra.color);
    if (extra.map) material.map = {};
    const mesh = new api.mesh(geo, material);
    mesh.name = extra.name;
    mesh.matrixAutoUpdate = false;
    mesh.matrix.fromArray(extra.matrix);
    const group = new api.group();
    group.name = extra.parent;
    group.add(mesh);
    g.scene.add(group);
  }
  g.scene.updateMatrixWorld(true);
  const layers = new Map();
  for (const [parent, name, mat, layer] of meshLayers) {
    const key = JSON.stringify([parent, name, mat]);
    if (!layers.has(key)) layers.set(key, []);
    layers.get(key).push(layer);
  }
  const meshes = [];
  g.scene.traverseVisible((mesh) => {
    if (!mesh.isMesh || mesh.layers.mask !== 1 || mesh.isInstancedMesh) return;
    const m = mesh.material,
      key = JSON.stringify([mesh.parent?.name || '', mesh.name, m?.name]);
    const queue = layers.get(key);
    if (queue?.length) meshes.push({ mesh, layer: queue.shift(), decal: /decal|label/.test(m.name) });
  });
  if (meshes.length !== meshLayers.length) throw Error('港区材质与几何版本不匹配');
  meshes.sort((a, b) => a.decal - b.decal);
  const capacity = meshes.reduce((n, { mesh }) => n + mesh.geometry.attributes.position.count, 0);
  const indexCapacity = meshes.reduce(
    (n, { mesh }) => n + (mesh.geometry.index?.count || mesh.geometry.attributes.position.count),
    0,
  );
  const vertexBuffer = new ArrayBuffer(capacity * 24),
    indices = new Uint32Array(indexCapacity);
  const shorts = new Int16Array(vertexBuffer),
    signed = new Int8Array(vertexBuffer),
    bytes = new Uint8Array(vertexBuffer),
    floats = new Float32Array(vertexBuffer);
  const normal = new api.vector(),
    a = new api.vector(),
    b = new api.vector(),
    c = new api.vector();
  // Merged source meshes often repeat every corner. Intern the final six GPU
  // words so the resident buffer stays as compact as the offline mesh bake.
  const words = new Uint32Array(vertexBuffer);
  const slots = new Uint32Array(2 ** Math.ceil(Math.log2(Math.max(2, capacity * 1.25))));
  const mask = slots.length - 1;
  let vertexCount = 0,
    indexCount = 0,
    solidIndices = 0;
  function internVertex() {
    const start = vertexCount * 6;
    let hash = 0x811c9dc5;
    for (let i = 0; i < 6; i++) hash = Math.imul(hash ^ words[start + i], 0x01000193);
    let slot = (hash ^ (hash >>> 16)) & mask;
    while (slots[slot]) {
      const id = slots[slot] - 1,
        other = id * 6;
      let i = 0;
      while (i < 6 && words[start + i] === words[other + i]) i++;
      if (i === 6) return id;
      slot = (slot + 1) & mask;
    }
    slots[slot] = vertexCount + 1;
    return vertexCount++;
  }
  for (const { mesh, layer, decal } of meshes) {
    const geom = mesh.geometry,
      { position: p, normal: n, uv, color } = geom.attributes,
      m = mesh.material,
      index = geom.index;
    geom.computeBoundingBox();
    const bounds = geom.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
    if (bounds.min.distanceTo(bounds.max) > 700) continue;
    const normalMatrix = new api.normalMatrix().getNormalMatrix(mesh.matrixWorld);
    const lookup = new Uint32Array(p.count),
      triplanar = m.defines && 'SL_TRIPLANAR' in m.defines;
    const scale = triplanar ? m.userData.sl.uSlUv.value.z : 1;
    function vertex(j, point) {
      const known = lookup[j];
      if (known) return known - 1;
      const id = vertexCount;
      const at = id * 24;
      const xyz = (v) => Math.max(-32767, Math.min(32767, Math.round(v * 192)));
      shorts[id * 12] = xyz(point.x);
      shorts[id * 12 + 1] = xyz(point.y);
      shorts[id * 12 + 2] = xyz(point.z);
      shorts[id * 12 + 3] = layer;
      normal.fromBufferAttribute(n, j).applyMatrix3(normalMatrix).normalize();
      signed[at + 8] = Math.round(normal.x * 127);
      signed[at + 9] = Math.round(normal.y * 127);
      signed[at + 10] = Math.round(normal.z * 127);
      signed[at + 11] = decal ? 127 : 0;
      const gamma = (v) => Math.round(255 * Math.min(1, Math.max(0, v)) ** (1 / 2.2)),
        vc = m.vertexColors && color;
      bytes[at + 12] = gamma((m.map ? 1 : m.color.r) * (vc ? color.getX(j) : 1));
      bytes[at + 13] = gamma((m.map ? 1 : m.color.g) * (vc ? color.getY(j) : 1));
      bytes[at + 14] = gamma((m.map ? 1 : m.color.b) * (vc ? color.getZ(j) : 1));
      bytes[at + 15] = Math.round(255 * (m.roughness ?? 0.65));
      let u = uv ? uv.getX(j) : 0,
        v = uv ? uv.getY(j) : 0;
      if (triplanar) {
        const horizontal = Math.abs(normal.y) > 0.65;
        u = (horizontal || Math.abs(normal.x) <= 0.65 ? point.x : point.z) * scale;
        v = (horizontal ? point.z : point.y) * scale;
      }
      floats[id * 6 + 4] = Math.round(u * 512) / 512;
      floats[id * 6 + 5] = Math.round(v * 512) / 512;
      const unique = internVertex();
      lookup[j] = unique + 1;
      return unique;
    }
    const filterSmall =
      !decal && !/crane|backdrop|roof|sign|cable/.test(mesh.name + ' ' + mesh.parent?.name + ' ' + m.name);
    const count = index ? index.count : p.count;
    for (let i = 0; i < count; i += 3) {
      const ia = index ? index.getX(i) : i,
        ib = index ? index.getX(i + 1) : i + 1,
        ic = index ? index.getX(i + 2) : i + 2;
      a.fromBufferAttribute(p, ia).applyMatrix4(mesh.matrixWorld);
      b.fromBufferAttribute(p, ib).applyMatrix4(mesh.matrixWorld);
      c.fromBufferAttribute(p, ic).applyMatrix4(mesh.matrixWorld);
      const x = (a.x + b.x + c.x) / 3,
        z = (a.z + b.z + c.z) / 3;
      if (x < -65 || x > 165 || Math.abs(z) > 115) continue;
      const distance = Math.max(-41 - x, x - 37, -32 - z, z - 32, 0);
      if (
        distance > 0 &&
        filterSmall &&
        Math.max(a.distanceToSquared(b), b.distanceToSquared(c), c.distanceToSquared(a)) <
          Math.min(2.5, distance * 0.048) ** 2
      )
        continue;
      indices[indexCount++] = vertex(ia, a);
      indices[indexCount++] = vertex(ib, b);
      indices[indexCount++] = vertex(ic, c);
    }
    if (!decal) solidIndices = indexCount;
  }
  return {
    vertices: new Uint8Array(vertexBuffer, 0, vertexCount * 24),
    indices: indices.subarray(0, indexCount),
    solidIndices,
  };
}
self.onmessage = async (event) => {
  try {
    const data = await buildHarbor(event.data);
    self.postMessage(data, [data.vertices.buffer, data.indices.buffer]);
  } catch (error) {
    self.postMessage({ error: String(error.stack || error) });
  }
};
