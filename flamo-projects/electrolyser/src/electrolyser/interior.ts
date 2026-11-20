import { Shop, add, cross, sub, unit, type Mat, type V } from './mesh';
import { station } from './parts';

function brickwork(s:Shop, xs:number[], pitch:number) {
  // Transverse insulating courses fit inside the sloping shell. Stagger their joints.
  for(let course=0;course<2;course++){
    const y=.164+course*.122;
    for(let row=0;row<5;row++){
      const z=(row-2)*.754;
      for(let i=0;i<14;i++){
        const x=(i-6.5)*pitch*2;
        s.select('insulation',`第${course+1}层 / ${row+1}-${i+1}`,[x*.11,course*.14,z*.28]);
        s.box([x,y,z],[pitch*2-.008,.118,.748],'insulation',.009,.89+s.rand()*.17);
      }
    }
  }
  for(const [i,x] of xs.entries()){
    const id=String(i+1).padStart(2,'0'),spread=x*.15;
    // The collector enters a groove below its carbon block.
    s.select('collector',id,[spread,0,0]);
    s.box([x,.442,0],[.160,.151,4.53],'duct',.009);
    for(const sign of [-1,1])s.box([x,.444,sign*2.235],[.19,.174,.071],'castIron',.009);
    s.select('lining','槽底 '+id,[spread,0,0]);
    s.box([x,.647,0],[pitch-.009,.276,3.82],'graphite',.018,.92+s.rand()*.12);
    for(const sign of [-1,1]){
      s.box([x+sign*(pitch/4+.044),.438,0],[(pitch-.185)/2,.138,3.82],'graphite',.010);
      s.select('lining',station(sign,i)+' 侧衬',[spread,0,sign*.68]);
      s.profile(x,pitch-.009,[[.386,sign*1.87],[.39,sign*2.04],[1.48,sign*2.19],[1.48,sign*2.045],[.786,sign*1.89]],'graphite',.88+s.rand()*.16);
      s.select('lining','槽底 '+id,[spread,0,0]);
    }
  }
  for(const sign of [-1,1]){
    s.select('lining',sign>0?'后端衬':'前端衬',[sign*1.9,0,0]);
    s.box([sign*10.98,.99,0],[.24,.98,4.05],'graphite',.032);
  }
}

function liquidAndLedge(s:Shop, xs:number[], pitch:number) {
  const length=xs.length*pitch;
  s.select('aluminium');
  s.profile(0,length,[[.786,-1.87],[.786,1.87],[1.036,1.80],[1.036,-1.80]],'aluminium');
  s.select('bath');
  // The upper part of the bath wraps the two rows of immersed anodes.
  const floor=1.037, lower=1.145, upper=1.41;
  s.box([0,(floor+lower)/2,0],[length,lower-floor,3.60],'bath',.011);
  for(const [z,w] of [[0,.47],[-1.697,.205],[1.697,.205]]){
    s.box([0,(upper+lower)/2,z],[length,upper-lower,w],'bath',.013);
  }
  for(let i=0;i<=xs.length;i++){
    const x=(i-xs.length/2)*pitch;
    const width=i===0||i===xs.length?.028:.056;
    const centre=x+(i===0?width/2:i===xs.length?-width/2:0);
    for(const sign of [-1,1])s.box([centre,(upper+lower)/2,sign*.916],[width,upper-lower,1.36],'bath',.008);
  }
  for(const sign of [-1,1]){
    s.select('ledge',sign>0?'过道侧':'背侧',[0,0,sign*1.80]);
    // A continuous uneven ridge follows the frozen edge of the bath.
    const bands:V[][]=[];
    const count=xs.length*3;
    for(let i=0;i<=count;i++){
      const x=length*(i/count-.5),wave=.5+.5*Math.sin(i*.89)*Math.cos(i*.31);
      bands.push([[x,.785,sign*1.87],[x,.786,sign*1.912],[x,1.46,sign*2.04],
        [x,1.446+.045*wave,sign*(1.86+.053*wave)],[x,1.37,sign*(1.76+.055*wave)],[x,1.04,sign*1.80]]);
    }
    for(let i=1;i<bands.length;i++)for(let j=0;j<6;j++){
      const k=(j+1)%6, a=bands[i-1][j],b=bands[i][j],c=bands[i][k];
      const outward=unit(cross(sub(b,a),sub(c,a))).map(v=>v*sign) as V;
      s.face('ledge',[a,b,c,bands[i-1][k]],outward,.88+s.rand()*.17);
    }
    s.face('ledge',bands[0],[-1,0,0]);s.face('ledge',bands[bands.length-1],[1,0,0]);
  }
}

function rectangularRing(x:number,z:number,y:number,w:number,d:number):V[]{
  return [[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2]];
}
function joinRings(s:Shop,lo:V[],hi:V[],material:Mat,reverse=false){
  for(let i=0;i<4;i++){
    const j=(i+1)%4,n=unit(cross(sub(hi[i],lo[i]),sub(lo[j],lo[i])));
    s.face(material,[lo[i],hi[i],hi[j],lo[j]],reverse?[-n[0],-n[1],-n[2]]:n);
  }
}

function electrodeAssemblies(s:Shop,xs:number[],pitch:number) {
  for(const [i,x] of xs.entries())for(const sign of [-1,1]){
    const id=station(sign,i),z=sign*.921;
    s.select('carbon',id,[x*.17,0,sign*1.05]);
    const low=rectangularRing(x,z,1.146,pitch-.071,1.34);
    const shoulder=rectangularRing(x,z,1.945,pitch-.071,1.34);
    const top=rectangularRing(x,z,2.024,pitch-.18,1.20);
    joinRings(s,low,shoulder,'anode');joinRings(s,shoulder,top,'anode');
    s.face('anode',low,[0,-1,0]);
    // Each iron stub sits in a blind socket in the baked carbon.
    const halfWidth=(pitch-.18)/2;
    for(const [slot,dz] of [-.31,0,.31].entries()){
      const cz=z+dz,y=2.024;
      const zlo=slot===0?z-.60:cz-.155,zhi=slot===2?z+.60:cz+.155;
      const rim:V[]=[],hole:V[]=[],bottom:V[]=[];
      const outer=rectangularRing(x,(zlo+zhi)/2,y,2*halfWidth,zhi-zlo);
      for(let edge=0;edge<4;edge++)for(let segment=0;segment<6;segment++){
        const a=outer[edge],b=outer[(edge+1)%4],t=segment/6;
        const rx=a[0]+(b[0]-a[0])*t,rz=a[2]+(b[2]-a[2])*t;
        const length=Math.hypot(rx-x,rz-cz);
        rim.push([rx,y,rz]);hole.push([x+(rx-x)*.105/length,y,cz+(rz-cz)*.105/length]);
        bottom.push([x+(rx-x)*.095/length,y-.145,cz+(rz-cz)*.095/length]);
      }
      for(let j=0;j<hole.length;j++){
        const k=(j+1)%hole.length;
        s.face('anode',[rim[j],rim[k],hole[k],hole[j]],[0,1,0]);
        s.face('graphite',[hole[j],hole[k],bottom[k],bottom[j]],unit([x-hole[j][0],0,cz-hole[j][2]]));
      }
      s.face('graphite',bottom,[0,1,0]);
    }
    s.select('stem',id,[x*.16,0,sign*1.70]);
    s.box([x,2.57,z],[.203,.43,.230],'stem',.022);
    s.box([x,2.37,z],[.266,.09,.29],'castIron',.014);
    s.box([x,2.30,z],[.23,.13,.79],'castIron',.031);
    for(const dz of [-.31,0,.31]){
      s.pipe([[x,2.28,z+dz],[x,1.981,z+dz]],.088,'castIron',12);
      s.pipe([[x,2.018,z+dz],[x,2.067,z+dz]],.119,'joint',12);
    }
  }
}

function feedUnits(s:Shop) {
  for(let i=0;i<7;i++){
    const x=(i-3)*3.05,id=String(i+1).padStart(2,'0'),spread=x*.16;
    s.select('hopper',id,[spread,0,0]);
    const outlet=rectangularRing(x,0,3.02,.18,.16),waist=rectangularRing(x,0,3.74,.88,.64),rim=rectangularRing(x,0,4.85,.88,.64);
    joinRings(s,outlet,waist,'al');joinRings(s,waist,rim,'frame');
    const inner=rectangularRing(x,0,4.85,.842,.602),throat=rectangularRing(x,0,3.74,.842,.602);
    joinRings(s,throat,inner,'al',true);joinRings(s,outlet,throat,'al',true);
    for(let j=0;j<4;j++)s.face('zinc',[rim[j],rim[(j+1)%4],inner[(j+1)%4],inner[j]],[0,1,0]);
    s.pipe([[x,2.92,0],[x,3.04,0]],.105,'duct',16);
    s.pipe([[x,2.95,0],[x+.025,2.84,0],[x+.43,1.90,0],[x+.45,1.77,0]],.075,'duct',14);
    s.select('alumina',id,[spread,0,0]);
    const bed=rectangularRing(x,0,4.54,.828,.587);
    joinRings(s,rectangularRing(x,0,3.17,.26,.22),bed,'alumina');
    const tip:V=[x-.072,4.69,.018];
    for(let j=0;j<4;j++)s.face('alumina',[bed[j],bed[(j+1)%4],tip],[0,1,0],.94+j*.018);
    s.face('alumina',rectangularRing(x,0,3.17,.26,.22),[0,-1,0]);
    // A point feeder discharges beside the vertical punch, between both anode rows.
    const rod=x+.62;
    s.select('breaker',id,[spread,0,0]);
    s.pipe([[rod,3.83,0],[rod,1.67,0]],.060,'dark',16);
    s.pipe([[rod,1.99,0],[rod,1.64,0]],.088,'castIron',12);
    s.pipe([[rod,1.68,0],[rod,1.53,0]],.064,'joint',10);
    s.select('cylinder',id,[spread,0,0]);
    s.pipe([[rod,3.74,0],[rod,4.78,0]],.117,'al',20);
    for(const y of [3.80,4.70])s.box([rod,y,0],[.292,.112,.292],'ribs',.019);
    for(const dx of [-.11,.11])for(const dz of [-.11,.11])
      s.pipe([[rod+dx,3.77,dz],[rod+dx,4.78,dz]],.012,'zinc',8);
  }
}
export function interiors(s:Shop,xs:number[],pitch:number){
  brickwork(s,xs,pitch);
  liquidAndLedge(s,xs,pitch);
  electrodeAssemblies(s,xs,pitch);
  feedUnits(s);
}
