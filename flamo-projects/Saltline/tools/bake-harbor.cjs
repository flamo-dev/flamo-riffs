// Rebuild using Playwright, sharp, acorn and eslint-scope. Set SALTLINE_REFERENCE_HTML for an external reference.
// node tools/bake-harbor.cjs [output-directory]
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { chromium } = require('playwright-core');

async function sampleBerth() {
  const g = window.__G, T = g.THREE, renderer = g.renderer;
  renderer.setAnimationLoop(null);
  g.scene.updateMatrixWorld(true);
  const tile = 128, columns = 8;
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
  const meshLayers = [], extras=[];
  g.scene.traverseVisible(mesh=>{
    const m=mesh.material;
    if (!mesh.isMesh || mesh.layers.mask!==1 || mesh.isInstancedMesh || !m || Array.isArray(m) ||
        !m.name || m.type==='ShaderMaterial' || /^(?:apron_wet|sea|fx_|pac9_|glove_|chainlink|tarp$)/.test(m.name) ||
        (m.transparent && !/decal|label/.test(m.name))) return;
    let root=mesh;
    while(root.parent && root.parent!==g.scene)root=root.parent;
    if(root.name!=='level' && root.name!=='backdrop'){
      const geom=mesh.geometry,attributes={};
      for(const name of ['position','normal','uv','color']){
        const a=geom.attributes[name];if(a)attributes[name]=[a.itemSize,Array.from(a.array)];
      }
      extras.push({parent:mesh.parent?.name||'',name:mesh.name,material:m.name,roughness:m.roughness,
        color:m.color.toArray(),vertexColors:m.vertexColors,map:!!m.map,attributes,
        indices:geom.index?Array.from(geom.index.array):null,matrix:mesh.matrixWorld.toArray()});
    }
    meshLayers.push([mesh.parent?.name || '',mesh.name,m.name,tileFor(m)]);
  });
  const walls=g.physics.boxes.filter(b=>!b.bulletOnly && b.max.y>.42 && b.min.y<1.65 && b.min.x<1 && b.max.x>-39 && b.min.z<14 && b.max.z>0).map(b=>[b.min.x,b.min.z,b.max.x,b.max.z].map(x=>Math.round(x*100)/100));
  const xyz=v=>[v.x,v.y,v.z];
  const level={playerStart:{pos:xyz(g.level.playerStart.pos),yaw:g.level.playerStart.yaw},objectives:g.level.objectives.map(o=>({id:o.id,label:o.label,zone:o.zone,pos:xyz(o.pos)})),extraction:{pos:xyz(g.level.extraction.pos),radius:g.level.extraction.radius},enemySpawns:g.level.enemySpawns.map(o=>({...o,pos:xyz(o.pos)})),zones:g.level.zones,cinematicPath:g.level.cinematicPath,coverPoints:g.level.coverPoints.map(xyz),interiorBoxes:g.level.interiorBoxes.map(o=>({min:xyz(o.min),max:xyz(o.max)})),boxes:g.physics.boxes.map(b=>[xyz(b.min),xyz(b.max),{surface:b.surface,tag:b.tag,noNav:b.noNav,bulletOnly:b.bulletOnly,playerOnly:b.playerOnly}])};
  const actualRows=Math.ceil((slots.size+1)/columns);
  const used=document.createElement('canvas');used.width=atlas.width;used.height=actualRows*tile;used.getContext('2d').drawImage(atlas,0,0);
  return {level,meshLayers,extras,materials:window.harborPalette,atlas:used.toDataURL('image/png'),rows:actualRows,walls};
}

// Record material identity and label dimensions, which affect merging and UV layout.
// Pixel generation stays in the baker. The worker uses the authored atlas directly.
function recordMaterials(materials) {
  const rows=[],calls={},ids=new Map();
  window.harborPalette={rows,calls,names:materials.names};
  for(const method of ['get','emissive','decal','label','number','tileOf']){
    const original=materials[method];
    if(!original)continue;
    materials[method]=function(...args){
      const result=original.apply(materials,args);
      const key=JSON.stringify([method,...args]);
      if(Object.hasOwn(calls,key))return result;
      if(method==='tileOf'){calls[key]=result;return result;}
      const m=result?.material || result;if(!m)return result;
      if(!ids.has(m)){
        ids.set(m,rows.length);
        rows.push({name:m.name,basic:!!m.isMeshBasicMaterial,color:m.color.toArray(),roughness:m.roughness,
          vertexColors:m.vertexColors,transparent:m.transparent,defines:m.defines,alphaTest:m.alphaTest,
          userData:m.userData?.sl?{interior:m.userData.interior,tile:m.userData.tile,
            scale:m.userData.sl.uSlUv.value.z}:null,
          image:m.map?[m.map.image?.width||1,m.map.image?.height||1]:null,aspect:result.aspect});
      }
      calls[key]=ids.get(m);return result;
    };
  }
  return materials;
}

(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:960,height:540}});
    const reference=new URL('https://saltline-bake.invalid/');
    reference.search='shot=1&q=low&seed=4207&noaudio=1&noweapon=1';
    const html=require('./branding.cjs').readReference();
    const hook='()=>Gg(t)';
    if (!html.includes(hook))throw Error('Missing reference material initialization');
    await page.route(reference.href,route=>route.fulfill({contentType:'text/html; charset=utf-8',
      body:html.replace(hook,()=> 'async()=>('+recordMaterials.toString()+')(await Gg(t))')}));
    await page.goto(reference.href);
    await page.waitForFunction(()=>window.__ready || window.__fatal,null,{timeout:150000});
    const sample=await page.evaluate(sampleBerth);
    const dir=path.resolve(process.argv[2]||path.join(__dirname,'../src/harbor/baked'));
    fs.mkdirSync(dir,{recursive:true});
    const {level,atlas,meshLayers,extras,materials,rows,walls}=sample;
    const pixels=Buffer.from(atlas.slice(atlas.indexOf(',')+1),'base64');
    const texture=await sharp(pixels).avif({quality:60,effort:6,chromaSubsampling:'4:4:4'}).toBuffer();
    const atlasURL='data:image/avif;base64,'+texture.toString('base64');
    fs.writeFileSync(path.join(dir,'level.ts'),'export default '+JSON.stringify(level)+';\n');
    fs.writeFileSync(path.join(dir,'scene.ts'),'export const packedScene='+JSON.stringify({rows,walls,tile:128})+
      ';\nexport const atlasURL='+JSON.stringify(atlasURL)+';\nexport const recipe='+JSON.stringify({meshLayers,materials,extras})+';\n');
    require('./compile-harbor.cjs').writeHarborWorker(dir);
    console.log(JSON.stringify({meshes:meshLayers.length,materials:materials.rows.length,tiles:rows*8,atlasBytes:texture.byteLength}));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
