// @ts-nocheck
import { threeLicense } from './three-license';
import { simulation } from './generated/simulation';
import layout from '../harbor/baked/level';
import { mountInterface } from './interface';

function effects(api,g) {
  const root=new api.Group(),cube=new api.Box(1,1,1),sphere=new api.Sphere(1,6,4),particles=[];
  root.name='Impacts and ballistics';g.scene.add(root);
  const mats=new Map(),random=g.rng.fork();
  function spawn(pos,color,size,life,velocity,shape=cube,bright=false){
    if(particles.length>=140)retire(0);
    const key=color+'-'+bright;
    if(!mats.has(key))mats.set(key,bright?new api.Unlit({color:new api.Color(color).multiplyScalar(3)}):new api.Material({color}));
    const mesh=new api.Mesh(shape,mats.get(key));mesh.position.copy(pos);mesh.scale.setScalar(size);root.add(mesh);
    particles.push({mesh,life,velocity});return mesh;
  }
  function retire(i){root.remove(particles[i].mesh);particles.splice(i,1);}
  function burst(pos,count,color,speed,size,life,bright=false){
    for(let j=0;j<count;j++)spawn(pos,color,size*(.5+random()),life*(.5+random()),new api.V3(random()-.5,random()*.85,random()-.5).multiplyScalar(speed),sphere,bright);
  }
  const fx={
    tracer(a,b,opt={}){let dir=b.clone().sub(a),dist=dir.length();if(dist<.02)return;dir.multiplyScalar(1/dist);
      const len=Math.min(dist,3.5),mesh=spawn(a,opt.color||0xffad61,.02,Math.min(.22,dist/170),dir.clone().multiplyScalar(opt.speed||170),cube,true);
      mesh.position.addScaledVector(dir,len*.5);mesh.lookAt(b);mesh.scale.set(.018,.018,len);},
    muzzleFlash(pos,dir,opt={}){const m=spawn(pos,0xffac42,.065*(opt.scale||1),.045,null,sphere,true);m.scale.z*=2.2;},
    smoke(pos,opt={}){const m=spawn(pos,opt.color||0x777a78,(opt.size||.18)*.35,Math.min(opt.life||.35,.75),new api.V3(.03,opt.rise||.35,.03),sphere);},
    shell(pos,vel){spawn(pos,0xb89a62,.045,.38,vel.clone()).scale.y*=.42;},
    sparks(pos,dir,count=4){burst(pos,Math.min(12,count),0xffa647,3,.023,.16,true);},
    debris(pos){burst(pos,4,0x66584c,2,.05,.43);},dust(pos){burst(pos,3,0x7e7871,.8,.06,.26);},
    explosion(pos,amount=1){burst(pos,12,0xfb803c,6,.11*amount,.3,true);burst(pos,6,0x555452,2,.18,.68);},
    reset(){while(particles.length)retire(particles.length-1);},
    update(dt){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;if(p.life<=0)retire(i);else if(p.velocity)p.mesh.position.addScaledVector(p.velocity,dt);}}
  };
  g.events.on('impact',hit=>{if(hit.surface==='metal'||hit.enemy)fx.sparks(hit.point,hit.normal);else fx.dust(hit.point);});return fx;
}

// The start action runs synchronously inside the browser gesture, including keyboard activation.
function prepareAudio(api, game, host, onDispose) {
  const pending=api.silentAudio();
  let volume=.8,intensity=.15,paused=false,context;
  pending.setVolume=value=>{volume=value;};
  pending.setIntensity=value=>{intensity=value;};
  pending.setPaused=value=>{paused=value;};
  function activate(){
    if(navigator.userActivation && !navigator.userActivation.isActive)return;
    const Constructor=window.AudioContext || window.webkitAudioContext;
    if(!Constructor)return;
    if(context){if(context.state!=='running')void context.resume().catch(()=>{});return;}
    context=new Constructor({latencyHint:'interactive'});
    if(context.state!=='running')void context.resume().catch(()=>{});
    const audio=api.audioGraph(game,context,null);
    audio.setVolume(volume);audio.setIntensity(intensity);audio.setPaused(paused);
    game.audio=audio;audio.resume();
  }
  pending.resume=activate;
  const gesture=e=>{if(e.isTrusted)activate();};
  for(const type of ['click','keydown'])host.addEventListener(type,gesture,true);
  onDispose(()=>{for(const type of ['click','keydown'])host.removeEventListener(type,gesture,true);if(context&&context.state!=='closed')void context.close();});
  return pending;
}

export async function createGame(host:HTMLElement,onDispose:(fn:()=>void)=>void){
  const ui=mountInterface(host);onDispose(ui.dispose);
  const a=simulation(ui.environment),vec=(arr)=>new a.V3(...arr);
  const g={params:{},events:a.events(),rng:a.rng(4207),time:{t:0,dt:0,frame:0,real:0},quality:a.quality('medium'),
    scene:new a.Scene(),camera:new a.Camera(a.settings.fov,16/9,.07,280),viewCamera:new a.Camera(a.settings.viewFov||55,16/9,.01,10),renderer:{domElement:ui.view}};
  g.camera.rotation.order='YXZ';g.scene.add(g.camera);
  g.render={post:{saturation:1,fade:0},setQuality:q=>{g.quality=q;},lightPool:{acquire:()=>null,flash(pos,color,intensity,range,life){g.render.flash=life;}}};
  const colors={gunmetal:0x546069,armor_white:0xd6d5cb,anodized_black:0x313a40,rubber:0x25282b,glove_fabric:0x292724,brass:0xc49a49};
  const materials=new Map();
  g.mats={get(name,opt={}){if(!materials.has(name))materials.set(name,new a.Material({color:colors[name]||0xb5b4ac,vertexColors:!!opt.vertexColors}));return materials.get(name);},
    label(text){const canvas=document.createElement('canvas');canvas.width=160;canvas.height=48;const ctx=canvas.getContext('2d');ctx.font='bold 40px monospace';ctx.fillStyle='#22292b';ctx.textAlign='center';ctx.fillText(text,80,38);const material=new a.Unlit({color:0xffffff,transparent:true});material.map={image:canvas};material.name=text;return {aspect:3.2,material};},
    emissive(color,n){return new a.Unlit({color:new a.Color(color).multiplyScalar(n)});}};
  g.physics=a.physics(g);for(const [min,max,opts] of layout.boxes)g.physics.addBox(min,max,opts);
  const positioned=o=>({...o,pos:vec(o.pos)}),lamp=new a.Sphere(.115,10,6);
  g.level={...layout,playerStart:positioned(layout.playerStart),extraction:positioned(layout.extraction),objectives:layout.objectives.map(o=>{
    const objective=positioned(o),mat=new a.Unlit({color:0xff8e2b}),mesh=new a.Mesh(lamp,mat);
    mesh.position.copy(objective.pos);mesh.position.y+=1.45;g.scene.add(mesh);
    mesh.userData.setState=state=>mat.color.setHex(state==='cut'?0x203739:0xff8e2b);objective.object=mesh;return objective;
  }),enemySpawns:layout.enemySpawns.map(positioned),coverPoints:layout.coverPoints.map(vec),
    interiorBoxes:layout.interiorBoxes.map(b=>({min:vec(b.min),max:vec(b.max)})),
    groundSurfaceAt(x,z){return x>30?'water':x>16?'metal':'concrete';}};
  g.ground={isPuddle(x,z){return Math.abs(z-6)<2&&x<9;}};
  g.physics.build();g.input=a.input(g);g.fx=effects(a,g);g.audio=prepareAudio(a,g,host,onDispose);
  g.player=a.player(g);g.combat=a.combat(g);g.weapon=await a.weapon(g);g.enemies=await a.enemies(g);g.hud=a.hud(g);g.game=a.game(g);
  return {g,thirdPartyNotices:[threeLicense],update(delta){
    const dt=Math.min(.05,Math.max(0,delta));g.time.dt=dt;g.time.t+=dt;g.time.frame++;g.time.real=performance.now()/1000;
    g.input.update(dt);const play=g.game.update(dt)!==false;
    if(play&&g.game.state!=='title'&&g.game.state!=='paused'){g.player.update(dt);g.weapon.update(dt);g.enemies.update(dt);}
    if(g.game.state!=='paused')g.fx.update(dt);
    g.scene.updateMatrixWorld(true);g.audio.update(dt);g.hud.update(dt);g.input.endFrame();g.render.flash=Math.max(0,(g.render.flash||0)-dt);
  }};
}
