// Source/seed/binding checks only; NOT a Runtime or pixel acceptance test.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const script=read('src/nodes/star-sea/script.ts'),viewport=read('src/nodes/star-sea/viewport.ts');
const artifact=JSON.parse(read('view/data/artifact.flamo.json'));
const root=artifact.nodeArtifacts['778376733:1'];
const binding=JSON.parse(read('view/data/bindings.json')).bindings.find(b=>b.nodeId==='778376733:1');
assert.equal(root.scripts[0].src,'src/nodes/star-sea/script.ts');
assert.equal(binding.src,root.scripts[0].src);assert.deepEqual(binding.roles,root.roles);
assert.deepEqual(root.interactions[0].roleBindings,root.roles);
const contract=JSON.parse(read('src/interactions/contracts/dream-star-sea.behavior.json'));
assert.equal(root.interactions[0].behaviorRef,contract.id);assert.equal(root.interactions[0].version,contract.version);
const nodes=new Map();function walk(n,parent){const id=`${n.guid.sessionID}:${n.guid.localID}`;nodes.set(id,{...n,parent});for(const c of n.children??[])walk(c,id);}
for(const n of artifact.scene.nodes)walk(n,null);
for(const id of Object.values(root.roles))assert(nodes.has(id));
const hud=[22,23,24,25,26,27,28,33,34].map(n=>`778376733:${n}`);
for(const id of ['778376733:20','778376733:21']){let n=nodes.get(id);while(n){assert(!hud.includes(`${n.guid.sessionID}:${n.guid.localID}`));n=nodes.get(n.parent);}}
for(const [id,n] of nodes)if(n.type==='TEXT')assert(hud.includes(id),`Unexpected text: ${id}`);
// Execute the actual seed-selection expressions, without initializing the Runtime.
const choose=new Function('location','createViewport','ctx','crypto',
 script.slice(script.indexOf(' const query='),script.indexOf('painter.world.reset(initialSeed)'))+'return {wallpaper,initialSeed};');
let calls=0;const crypto={getRandomValues(a){calls++;a[0]=12345;return a;}};
function run(search){calls=0;return choose({search},()=>({}),{},crypto);}
for(const [raw,value] of [['0',0],['4294967295',4294967295],['20261003',20261003],['00042',42]]){
 assert.deepEqual(run(`?wallpaper=1&seed=${raw}`),{wallpaper:true,initialSeed:value});assert.equal(calls,0);
}
for(const raw of ['', '-1','4294967296','1.2','1e3','NaN','Infinity','%2B1','%201','0x20','１２']){
 assert.equal(run(`?wallpaper=1&seed=${raw}`).initialSeed,12345);assert.equal(calls,1);
}
for(const q of ['', '?seed=20261003','?wallpaper=0&seed=0','?wallpaper=true&seed=0','?wallpaper=01&seed=0']){
 assert.deepEqual(run(q),{wallpaper:false,initialSeed:12345});assert.equal(calls,1);
}
assert.equal(run('?wallpaper=1').initialSeed,12345);
assert(viewport.includes('wallpaper?undefined:ctx.scene.create'));
assert(viewport.includes('if(wallpaper)return false;'));
assert(viewport.includes('[22,23,24,25,26,27,28,33,34]'));
assert(viewport.includes('node.setVisible(false)'));
assert(viewport.includes('node.setVisible(visible)'));
assert(viewport.includes('nodes(20)?.setSize(w,h);nodes(21)?.setSize(w,h);'));
assert(!/(?<!\?)brand\.(setSize|setPosition|remove)/.test(viewport));
assert(script.includes("if(interactive){"));
assert(script.includes("const interactive=!wallpaper||query.get('interactive')==='1';"));
assert(script.includes('nebulaTime+=dt;nebula.setTime(nebulaTime)'));
assert(script.includes('painter.render('));
console.log(JSON.stringify({status:'pass',scope:'source, seed expressions, artifact ancestry and existing bindings only',revision:artifact.metadata.revision,previewVerified:false}));
