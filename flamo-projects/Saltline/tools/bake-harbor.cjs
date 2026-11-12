// Rebuild the authored assets from the adjacent reference with a development installation of Playwright.
// node tools/bake-harbor.cjs [output-directory]
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { gzipSync } = require('node:zlib');
const { chromium } = require('playwright-core');

async function sampleBerth() {
  const g = window.__G, T = g.THREE, renderer = g.renderer;
  renderer.setAnimationLoop(null);
  g.scene.updateMatrixWorld(true);
  const tile = 256, columns = 8;
  const atlas = document.createElement('canvas');
  atlas.width = columns * tile; atlas.height = 16 * tile;
  const paint = atlas.getContext('2d'), slots = new Map();
  const target = new T.WebGLRenderTarget(tile,tile,{depthBuffer:false});
  const sampler = new T.ShaderMaterial({
    uniforms:{source:{value:null}, tint:{value:new T.Color()}, mode:{value:0}, keepAlpha:{value:0}},
    vertexShader:'varying vec2 coord; void main(){coord=uv; gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:'varying vec2 coord; uniform sampler2D source; uniform vec3 tint; uniform float mode,keepAlpha; void main(){vec4 s=texture2D(source,coord); vec3 c=s.rgb*tint; if(mode==1.)c=s.rgb+tint*s.a; if(mode==2.)c=mix(s.rgb,tint*clamp(dot(s.rgb,vec3(.333))/.19,.55,1.35),s.a*.96); gl_FragColor=vec4(pow(max(c,vec3(0.)),vec3(0.4545)),mix(1.,s.a,keepAlpha));}'
  });
  const plane = new T.Mesh(new T.PlaneGeometry(2,2),sampler), camera = new T.Camera();
  const pixels = new Uint8Array(tile*tile*4);
  paint.fillStyle = 'white'; paint.fillRect(0,0,tile,tile);
  function tileFor(m) {
    const texture=m.map;
    if (!texture) return 0;
    const key=texture.uuid+':'+m.color.getHexString();
    if (slots.has(key)) return slots.get(key);
    const id = slots.size + 1;
    if (id >= columns*16) throw Error('Material atlas full');
    sampler.uniforms.source.value = texture;
    sampler.uniforms.tint.value.copy(m.color); sampler.uniforms.mode.value=Number(m.defines?.SL_TINT||0); sampler.uniforms.keepAlpha.value=/decal|label/.test(m.name)||m.alphaTest>0?1:0;
    renderer.setRenderTarget(target); renderer.render(plane,camera);
    renderer.readRenderTargetPixels(target,0,0,tile,tile,pixels);
    // Row zero in the source atlas corresponds to texture coordinate v=0.
    paint.putImageData(new ImageData(new Uint8ClampedArray(pixels),tile,tile),(id%columns)*tile,Math.floor(id/columns)*tile);
    slots.set(key,id); return id;
  }
  const vertexBytes=[], indices=[], byVertex=new Map(), mats=new Set();
  const output=new ArrayBuffer(24), view=new DataView(output), octets=new Uint8Array(output);
  const pos=new T.Vector3(), normal=new T.Vector3(), tint=new T.Color(), normalMatrix=new T.Matrix3();
  let solidIndices=0;
  const meshes=[];
  g.scene.traverseVisible(mesh=>{
    if (!mesh.isMesh || mesh.layers.mask!==1 || mesh.isInstancedMesh) return;
    const m=mesh.material;
    if (!m || Array.isArray(m) || !m.name || m.type==='ShaderMaterial' || /^(?:apron_wet|sea|fx_|pac9_|glove_|chainlink|tarp$)/.test(m.name)) return;
    if (m.transparent && !/decal|label/.test(m.name)) return;
    meshes.push(mesh);
  });
  const isDecal=m=>/decal|label/.test(m.name);
  const sorted=meshes.sort((a,b)=>Number(isDecal(a.material))-Number(isDecal(b.material)));
  for (const mesh of sorted) {
    const geom=mesh.geometry, p=geom.attributes.position, n=geom.attributes.normal;
    if (!p || !n) continue;
    normalMatrix.getNormalMatrix(mesh.matrixWorld);
    const m=mesh.material, uv=geom.attributes.uv, colors=geom.attributes.color;
    const decal=isDecal(m), cache=new Map(), index=geom.index;
    let layer;
    function vertex(j) {
      if (cache.has(j)) return cache.get(j);
      pos.fromBufferAttribute(p,j).applyMatrix4(mesh.matrixWorld);
      normal.fromBufferAttribute(n,j).applyMatrix3(normalMatrix).normalize();
      for (const [k,x] of [pos.x,pos.y,pos.z].entries()) view.setInt16(k*2,Math.max(-32767,Math.min(32767,Math.round(x*192))),true);
      view.setInt16(6,layer,true);
      for (const [k,x] of [normal.x,normal.y,normal.z].entries()) view.setInt8(8+k,Math.round(x*127));
      view.setInt8(11,decal?127:0);
      if(m.map)tint.setRGB(1,1,1);else tint.copy(m.color);
      if(m.vertexColors && colors) tint.multiply(new T.Color().fromBufferAttribute(colors,j));
      for (const [k,x] of [tint.r,tint.g,tint.b].entries()) view.setUint8(12+k,Math.round(255*Math.pow(Math.min(1,Math.max(0,x)),1/2.2)));
      view.setUint8(15,Math.round(255*(m.roughness??.65)));
      let u=uv?uv.getX(j):0, v=uv?uv.getY(j):0;
      if (m.defines && 'SL_TRIPLANAR' in m.defines) {
        const scale=m.userData.sl.uSlUv.value.z;
        if(Math.abs(normal.y)>.65){u=pos.x;v=pos.z;}else if(Math.abs(normal.x)>.65){u=pos.z;v=pos.y;}else{u=pos.x;v=pos.y;}
        u*=scale;v*=scale;
      }
      view.setFloat32(16,Math.round(u*512)/512,true);view.setFloat32(20,Math.round(v*512)/512,true);
      const key=String.fromCharCode(...octets);let id=byVertex.get(key);
      if(id===undefined){id=vertexBytes.length/24;byVertex.set(key,id);vertexBytes.push(...octets);}
      cache.set(j,id);return id;
    }
    const bounds=new T.Box3().setFromObject(mesh);
    if(bounds.min.distanceTo(bounds.max)>700)continue;
    const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
    for(let i=0;i<(index?index.count:p.count);i+=3){
      const ia=index?index.getX(i):i, ib=index?index.getX(i+1):i+1, ic=index?index.getX(i+2):i+2;
      a.fromBufferAttribute(p,ia).applyMatrix4(mesh.matrixWorld);b.fromBufferAttribute(p,ib).applyMatrix4(mesh.matrixWorld);c.fromBufferAttribute(p,ic).applyMatrix4(mesh.matrixWorld);
      const x=(a.x+b.x+c.x)/3,z=(a.z+b.z+c.z)/3;
      if(x<-65||x>165||Math.abs(z)>115) continue;
      const distance=Math.max(-41-x,x-37,-32-z,z-32,0);
      if(distance>0 && !decal && !/crane|backdrop|roof|sign|cable/.test(mesh.name+" "+mesh.parent?.name+" "+m.name) && Math.max(a.distanceToSquared(b),b.distanceToSquared(c),c.distanceToSquared(a))<Math.min(2.5,distance*.048)**2) continue;
      if(layer===undefined){layer=tileFor(m);mats.add(m.name);}
      indices.push(vertex(ia),vertex(ib),vertex(ic));
    }
    if(!decal)solidIndices=indices.length;
  }
  const bytes64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s);};
  const walls=g.physics.boxes.filter(b=>!b.bulletOnly && b.max.y>.42 && b.min.y<1.65 && b.min.x<1 && b.max.x>-39 && b.min.z<14 && b.max.z>0).map(b=>[b.min.x,b.min.z,b.max.x,b.max.z].map(x=>Math.round(x*100)/100));
  const xyz=v=>[v.x,v.y,v.z];
  const level={playerStart:{pos:xyz(g.level.playerStart.pos),yaw:g.level.playerStart.yaw},objectives:g.level.objectives.map(o=>({id:o.id,label:o.label,zone:o.zone,pos:xyz(o.pos)})),extraction:{pos:xyz(g.level.extraction.pos),radius:g.level.extraction.radius},enemySpawns:g.level.enemySpawns.map(o=>({...o,pos:xyz(o.pos)})),zones:g.level.zones,cinematicPath:g.level.cinematicPath,coverPoints:g.level.coverPoints.map(xyz),interiorBoxes:g.level.interiorBoxes.map(o=>({min:xyz(o.min),max:xyz(o.max)})),boxes:g.physics.boxes.map(b=>[xyz(b.min),xyz(b.max),{surface:b.surface,tag:b.tag,noNav:b.noNav,bulletOnly:b.bulletOnly,playerOnly:b.playerOnly}])};
  const actualRows=Math.ceil((slots.size+1)/columns);
  const used=document.createElement('canvas');used.width=atlas.width;used.height=actualRows*tile;used.getContext('2d').drawImage(atlas,0,0);
  return {level,vertices:bytes64(new Uint8Array(vertexBytes)),indices:bytes64(new Uint8Array(new Uint32Array(indices).buffer)),solidIndices,atlas:used.toDataURL('image/webp',.89),rows:actualRows,walls,materials:[...mats]};
}

(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:960,height:540}});
    const reference=pathToFileURL(path.resolve(__dirname,'../Saltline.html'));
    reference.search='shot=1&q=low&seed=4207&noaudio=1&noweapon=1';
    await page.route(reference.href,route=>route.fulfill({contentType:'text/html; charset=utf-8',body:require('./branding.cjs').brand(fs.readFileSync(path.resolve(__dirname,'../Saltline.html'),'utf8'))}));
    await page.goto(reference.href);
    await page.waitForFunction(()=>window.__ready || window.__fatal,null,{timeout:150000});
    const sample=await page.evaluate(sampleBerth);
    const dir=path.resolve(process.argv[2]||path.join(__dirname,'../src/harbor/baked'));
    fs.mkdirSync(dir,{recursive:true});
    const vertices=Buffer.from(sample.vertices,'base64'),indices=Buffer.from(sample.indices,'base64');
    const blob=gzipSync(Buffer.concat([vertices,indices]),{level:9}).toString('base64');
    const chunks=blob.match(/.{1,480000}/g);
    chunks.forEach((chunk,i)=>fs.writeFileSync(path.join(dir,'mesh-'+i+'.ts'),"export default '"+chunk+"';\n"));
    fs.writeFileSync(path.join(dir,'level.ts'),'export default '+JSON.stringify(sample.level)+';\\n'.replace('\\n','\n'));
    const imports=chunks.map((_,i)=>"import part"+i+" from './mesh-"+i+"';").join('\n');
    const data={vertexBytes:vertices.length,indexCount:indices.length/4,solidIndices:sample.solidIndices,rows:sample.rows,walls:sample.walls};
    fs.writeFileSync(path.join(dir,'scene.ts'),imports+'\nexport const meshData=['+chunks.map((_,i)=>'part'+i).join(',')+"].join('');\nexport const packedScene="+JSON.stringify(data)+";\nexport const atlasURL='"+sample.atlas+"';\n");
    console.log(JSON.stringify({...data,walls:sample.walls.length,materials:sample.materials.length,compressedCharacters:blob.length,parts:chunks.length}));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
