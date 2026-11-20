import { Shop, add, mul, unit, sub, type V, type P, type Mat } from './mesh';
import { interiors } from './interior';
import { station } from './parts';
import { glyphs } from './stencils';

export const pot = { length:22.96, width:4.66, height:1.599 };
const pitch=.774, stations=28;
const xs=Array.from({length:stations},(_,i)=>(i-(stations-1)/2)*pitch);

function mark(s:Shop,text:string,origin:V,right:V,normal:V,height:number,mat:Mat){
  const chars=[...text],gap=.15;
  const width=chars.reduce((v,k)=>v+glyphs[k][0]+gap,-gap);
  let x=-width/2;
  for(const ch of chars){const [w,xy,ix]=glyphs[ch];
    const b=s.batch(mat),start=b.pos.length/3;
    for(let j=0;j<xy.length;j+=2){b.pos.push(...add(add(origin,mul(right,(x+xy[j])*height)),[0,xy[j+1]*height,0]));b.normal.push(...normal);b.tint.push(1);}
    for(let j=0;j<ix.length;j+=3){
      const a=ix[j],c=ix[j+1],d=ix[j+2],area=(xy[c*2]-xy[a*2])*(xy[d*2+1]-xy[a*2+1])-(xy[c*2+1]-xy[a*2+1])*(xy[d*2]-xy[a*2]);
      if(area*(right[0]*normal[2]-right[2]*normal[0])>0)b.index.push(start+a,start+c,start+d);else b.index.push(start+a,start+d,start+c);}
    x+=w+gap;
  }
}
function stud(s:Shop,p:V,n:V,r=.038){s.pipe([p,add(p,mul(n,r*.41))],r*1.28,'joint',10);s.pipe([add(p,mul(n,r*.33)),add(p,mul(n,r*1.12))],r,'zinc',6,1,true);}
function collar(s:Shop,p:V,d:V,r:number,w:number,m:Mat){s.pipe([add(p,mul(d,-w/2)),add(p,mul(d,w/2))],r,m,20);}
function shell(s:Shop){
  s.select('shell');
  const {length:L,width:W,height:H}=pot;
  // Form the vessel with a bottom and four walls. The lip has an open centre.
  s.box([0,.081,0],[L-.12,.052,3.83],'shell',.012);
  for(const sign of [-1,1]){
    const edge:P[]=[[.055,1.89],[.055,1.93],[.29,2.11],[1.30,2.28],[H-.06,2.28],
      [H-.06,2.235],[1.30,2.235],[.31,2.065]];
    s.profile(0,L-.12,edge.map(([y,z])=>[y,z*sign]),'shell');
    s.box([0,H-.055,sign*(W/2-.085)],[L,.11,.17],'ribs',.012);
    s.box([sign*(L/2-.09),H-.055,0],[.18,.11,W-.34],'ribs',.012);
  }
  s.box([0,.034,0],[L-.32,.068,3.88],'dark',.012);
  for(const d of [-1,1]){
    for(const y of [.29,.77,1.29])s.box([0,y,d*(1.98+y*.19)],[L-.26,.089,.15],'ribs',.009);
    for(let i=0;i<28;i++){const x=xs[i],tone=.83+s.rand()*.22;
      s.profile(x,.095,[[.11,d*1.93],[.14,d*2.02],[.39,d*2.17],[1.38,d*2.325],[1.49,d*2.325],[1.49,d*2.21],[.41,d*2.055]],'ribs',tone);
      if(i%2===0){
        s.box([x,.61,d*2.16],[.40,.26,.18],'dark',.016);
        s.box([x,.62,d*2.26],[.31,.165,.14],'duct',.009);
      }}
    s.box([d*(L/2-.091),.79,0],[.095,1.45,3.91],'shell',.04);
    s.box([d*(L/2-.022),.31,0],[.041,.061,4.065],'dark',.006);
    for(let j=-2;j<=2;j++){const z=j*.81;
      s.box([d*(L/2-.019),.76,z],[.038,1.31,.089],'ribs',.008);

      stud(s,[d*(L/2-.059),1.19,z],[d,0,0],.044);}

  }
}
// Cross section of a closed removable hood, inner shoulder to outer toe.
const hood:P[]=[[3.34,.68],[3.32,.85],[3.25,1.08],[3.12,1.30],[2.90,1.55],[2.64,1.78],[2.44,1.90],[1.80,2.23],[1.73,2.23]];
function sheet(s:Shop,x:number,w:number,line:P[],th:number,d:number,m:Mat,tone=1){
 const outer=line.map(([y,z])=>[y,z*d] as P);const inner=[...line].reverse().map(([y,z])=>[y-th*.55,(z-th)*d] as P);
 s.profile(x,w,[...outer,...inner],m,tone);
}
function hoods(s:Shop){
  for(const d of [-1,1]){
    s.select('sill',station(d,0),[0,0,-5.0-d*.85]);
    s.box([0,1.665,d*2.12],[pot.length-.29,.095,.38],'gasket');
    s.box([0,1.69,d*2.17],[pot.length-.30,.045,.30],'al',.006);
    for(let i=0;i<stations;i++){
      const x=xs[i],w=pitch-.024,tone=.90+s.rand()*.16;
      const rackX=-16.4+((i%7)-3)*.90;
      const rackZ=(Math.floor(i/7)-1.5)*2.25-1.9;
      s.select('hood',station(d,i),[rackX-x,d>0?4.6:7.2,rackZ-d*1.49]);
      sheet(s,x,w,hood,.035,d,'hood',tone);
      const visor:P[]=[[3.355,.70],[3.347,.85],[3.27,1.10],[3.14,1.35],[2.983,1.58],[2.84,1.76],[2.84,1.84],[2.811,1.85]];
      sheet(s,x,w-.008,visor,.032,d,'hood',tone*.94);
      s.box([x,2.806,d*1.815],[w-.03,.051,.062],'joint',.006);
      for(const dx of [-.242,0,.242]){
        sheet(s,x+dx,.026,visor.map(([y,z])=>[y+.012,z+.008] as P),.028,d,'trim',tone);
        s.beam([x+dx,2.81,d*1.81],[x+dx,2.595,d*1.83],.027,.034,'al');
      }
      // Standing seams, centre stiffener, pressed hems, two lifting lugs.
      for(const dx of [-w*.48,0,w*.48]){
        const seam=hood.map(([y,z])=>[y+.016,z+.018] as P);
        sheet(s,x+dx,dx===0?.036:.025,seam,.039,d,'trim',tone);
      }
      for(const j of [0,4,6,8]){const [y,z]=hood[j];s.box([x,y+.008,d*(z+.018)],[w,.035,.035],'trim',.005,tone);}
      for(const dx of [-.19,.19]){
        s.box([x+dx,2.88,d*1.594],[.062,.073,.041],'al',.008);
        s.beam([x+dx,2.885,d*1.59],[x+dx,2.808,d*1.69],.029,.032,'trim');
        s.pipe([[x+dx,2.816,d*1.665],[x+dx,2.79,d*1.70]],.020,'zinc',8);
      }
      s.pipe([[x-.19,2.80,d*1.69],[x+.19,2.80,d*1.69]],.015,'zinc',8);
      for(const dx of [-.30,.30]){
        for(const j of [4,6]){const [y,z]=hood[j];stud(s,[x+dx,y+.015,d*(z+.040)],[0,.47,d*.88],.012);}
      }
      for(const dx of [-.31,.31])s.pipe([[x+dx,1.77,d*2.266],[x+dx,1.71,d*2.266]],.022,'dark',8);
    }
    const end=stations*pitch*.5;
    for(const side of [-1,1]) {
      s.select('hood',station(d,side<0?28:29)+' 端封板',[-16.4+side*3.55-side*(end+.025),d>0?4.6:7.2,-1.9-d*.95]);
      s.profile(side*(end+.025),.045,[[1.70,d*.45],[3.30,d*.45],...hood.map(([y,z])=>[y,d*z] as P)],'hood',.85);
      s.box([side*(end+.066),2.25,d*.98],[.04,.98,.064],'al');
    }
  }
}
function superstructure(s:Shop){
  s.select('casing');
  s.box([0,4.34,0],[21.76,2.08,1.25],'frame',.05);
  s.box([0,5.397,0],[21.92,.11,1.47],'ribs',.022);
  s.box([0,3.30,0],[21.87,.16,1.39],'dark');
  for(const d of [-1,1]){
    for(let j=0;j<7;j++){
      const x=(j-3)*3.095;
      s.select('casing');
      s.box([x,4.36,d*.635],[3.018,1.86,.036],'frame',.025,.87+s.rand()*.18);
      s.select('rail',station(d,j),[x*.17,0,d*2.8]);
      s.box([x,4.337,d*.699],[3.093,.60,.205],'al',.026,.95+s.rand()*.07);
    }
    const end=10.976*d;
    s.select('frame',d<0?'前端':'后端',[d*3.8,0,-1.5]);
    // End portal: twin legs, open access below the lintel, recessed black centre.
    s.box([end,3.32,0],[.22,.27,2.03],'ribs',.023);
    for(const q of [-1,1]){
      s.profile(end,.255,[[1.62,q*.95],[1.62,q*.73],[3.34,q*.72],[3.35,q*.96]],'frame');
      s.profile(end-.035*d,.24,[[3.35,q*1.01],[3.35,q*.48],[5.39,q*.32],[5.39,q*.85]],'ribs');
      s.box([end,1.655,q*.85],[.39,.11,.42],'ribs');
      s.profile(end+.123*d,.034,[[3.16,q*.69],[3.16,q*.40],[2.80,q*.69]],'ribs');
      stud(s,[end+.14*d,3.31,q*.80],[d,0,0],.044);
      s.pipe([[end+.17*d,3.56,q*.94],[end+.17*d,3.54,q*1.01],[end+.17*d,2.99,q*1.01]],.014,'zinc',8);
    }
    s.box([end+.105*d,5.22,0],[.080,.44,1.95],'frame',.016);
    mark(s,'HZ1102',[end+.148*d,5.083,0],[0,0,-d],[d,0,0],.276,'chalk');
    mark(s,'1102',[end+.112*d,3.225,0],[0,0,-d],[d,0,0],.089,'chalk');
    s.box([end,5.49,0],[.25,.074,.58],'dark');
    for(const q of [-1,0,1]){
      s.box([end+.007*d,5.565,q*.175],[.155,.115,.125],'lamp',.012);
      s.box([end+.010*d,5.631,q*.175],[.151,.021,.124],'zinc',.003);}
  }
}
function anodes(s:Shop){
  for(const d of [-1,1]){

    for(let i=0;i<stations;i++){
      const x=xs[i],y=4.13,top=5.15+(s.rand()-.5)*.13,z=d*.936,tone=.88+s.rand()*.19;
      s.select('stem',station(d,i),[x*.16,0,d*1.70]);
      s.box([x,(2.78+top)/2,z],[.201,top-2.78,.234],'stem',.031,tone);
      s.box([x,3.21,z],[.255,.12,.269],'joint',.016);
      s.pipe([[x,top-.102,d*1.053],[x,top-.102,d*1.059]],.031,'dark',12);
      s.select('clamp',station(d,i),[x*.22,0,d*3.15]);
      s.box([x,y+.019,d*.90],[.39,.28,.27],'al',.027,tone);
      s.box([x,y+.002,d*1.045],[.352,.159,.10],'dark',.016);
      for(const dx of [-.126,.126]){
        s.box([x+dx,y-.076,d*1.094],[.074,.21,.076],'al',.022);
        stud(s,[x+dx,y-.030,d*1.136],[0,0,d],.035);
      }
      s.pipe([[x,y+.018,d*1.067],[x,y+.14,d*1.11],[x,y+.195,d*1.113]],.029,'dark',8);
      s.pipe([[x-.057,y+.195,d*1.113],[x+.057,y+.195,d*1.113]],.019,'zinc',8);
      s.select('rail',station(d,Math.floor(i/4)),[(Math.floor(i/4)-3)*3.095*.17,0,d*2.8]);
      mark(s,String(d===1?stations-i:i+1),[x+.26*d,4.145,d*.809],[d,0,0],[0,0,d],.082,'red');
      s.select('stem',station(d,i),[x*.16,0,d*1.70]);
      if(i%3!==1){mark(s,'A',[x,4.59,d*1.055],[d,0,0],[0,0,d],.060,'red');
        mark(s,String(1130+((i*137+566)%671)),[x,4.51,d*1.055],[d,0,0],[0,0,d],.037,'red');}
    }
  }
}
const strap:P[]=[[4.36,1.05],[4.40,1.13],[4.49,1.21],[4.54,1.31],[4.56,1.42],[4.55,1.54],[4.49,1.68],[4.39,1.83],[4.27,1.95],[4.15,2.08],[4.07,2.21]];
function busbars(s:Shop){

  for(let j=0;j<7;j++){
    const x=(j-3)*pitch*4;
    const rack:V=[15.4+(j%2)*1.48-x,0,(Math.floor(j/2)-1.5)*2.05-3.0];
    // The vertical riser splits into two packs of parallel aluminium leaves.
    for(const dx of [-.132,.132]){
      s.select('flex',station(1,j)+(dx<0?' 左叠片':' 右叠片'),[rack[0]+dx*1.5,0,rack[2]]);
      for(let k=0;k<13;k++){
        const offset=(k-6)*.0148;
        const path=strap.map(([y,z],i)=>[y+offset,z+Math.max(0,i-5)*.0007*k] as P);
        const section=[...path,...[...path].reverse().map(([y,z])=>[y-.0117,z] as P)];
        s.profile(x+dx,.246,section,'foil',.89+s.rand()*.13);
      }
      s.select('bus',station(1,j),rack);
      s.profile(x+dx,.252,[[4.20,2.02],[4.14,2.28],[3.18,3.14],[2.10,3.14],[2.10,2.88],[3.07,2.88],[3.95,2.07]],'al',.96+s.rand()*.09);
      s.box([x+dx,1.92,3.008],[.254,.51,.28],'al',.012);
    }
    s.box([x,1.595,3.012],[.61,.14,.46],'dark',.012);
    s.box([x,1.70,3.01],[.55,.10,.39],'al',.008);
    for(const z of [2.91,3.12])for(const dx of [-.23,.23])stud(s,[x+dx,1.75,z],[0,1,0],.028);
    for(const dx of [-.247,.247])for(const y of [2.28,2.59,2.89]){
      stud(s,[x+dx,y,3.142],[0,0,1],.020);}
    s.box([x,2.38,3.146],[.47,.25,.026],'trim',.010);
    s.box([x,2.02,3.164],[.178,.17,.032],'joint',.016);
    s.box([x,2.03,3.185],[.136,.116,.017],'al',.010);
    for(const dx of [-.315,.315]){
      s.box([x+dx,2.02,3.045],[.109,.42,.48],'ochre',.020);
      s.box([x+dx*1.17,2.035,3.050],[.014,.26,.32],'dark',.005);
      for(const z of [2.973,3.125])stud(s,[x+dx*1.20,2.03,z],[Math.sign(dx),0,0],.038);
    }
    // Two dark inset connector plates follow the outside elbow.
    for(const y of [3.34,3.63]){
      const z=3.14-(y-3.18)*.90;
      s.beam([x,y-.078,z+.083],[x,y+.076,z-.056],.32,.022,'dark');
      for(const dx of [-.112,.112])stud(s,[x+dx,y,z+.032],[0,.68,.73],.023);
    }
    // Brackets below the gratings carry the riser behind each guard.
    s.box([x,.98,2.70],[.42,1.10,.40],'frame',.018);
    s.beam([x,.47,2.22],[x,1.48,2.99],.29,.16,'ribs');
    for(const dx of [-.18,.18])s.box([x+dx,1.31,2.83],[.09,.42,.67],'duct');
  }
}
function grating(s:Shop){

  for(const d of [-1,1]){
    s.select('walkway',station(d,0)+' 纵梁',[0,0,-6.5-d*2.6]);
    const mid=d*(d===1?2.64:2.47),w=d===1?.82:.48;
    for(const e of [-1,1])s.box([0,1.557,mid+e*w/2],[22.09,.078,.043],'ribs',.004);
    for(let j=0;j<14;j++){
      const x=(j-6.5)*1.564;
      s.select('walkway',station(d,j),[x*.12,0,-6.5-d*2.6+1.2*d]);
      s.box([x-.775,1.538,mid],[.047,.135,w],'dark',.005);
      for(let k=0;k<20;k++){const xx=x+(k-9.5)*.077;s.box([xx,1.565,mid],[.011,.065,w-.04],'zinc',0,.72);}
      for(const f of [-.35,-.12,.12,.35])s.box([x,1.591,mid+w*f],[1.56,.016,.011],'joint',0);
    }
  }
}
function roof(s:Shop){
  s.select('services');
  for(const q of [-1,1]){
    const z=q*.70;
    s.pipe([[-10.73,5.78,z],[10.73,5.78,z]],q===1?.071:.103,'duct',16);
    s.pipe([[-10.72,5.99,z*.93],[10.72,5.99,z*.93]],.044,'zinc',12);
    for(let j=0;j<8;j++){const x=(j-3.5)*2.91;
      s.box([x,5.62,z*.89],[.076,.39,.085],'ribs');
      s.box([x,5.72,z],[.14,.054,.28],'zinc',.006);
      collar(s,[x,5.78,z],[1,0,0],q===1?.082:.115,.063,'zinc');
      if(j%2===1)collar(s,[x+.48,5.78,z],[1,0,0],q===1?.093:.125,.105,'rust');
    }
  }
  s.box([0,6.117,-.41],[21.40,.108,.12],'green',.009);
  s.box([0,6.067,-.41],[21.45,.030,.18],'green',.004);
  for(let j=0;j<7;j++){
    const x=(j-3)*3.05;
    s.box([x,5.56,0],[.49,.16,.47],'ribs',.016);
    s.pipe([[x,5.55,0],[x,5.94,0]],.098,'al',16);
    collar(s,[x,5.63,0],[0,1,0],.144,.061,'zinc');
    s.pipe([[x,5.93,0],[x,6.02,0]],.047,'dark',10);
    s.pipe([[x-.048,5.80,.03],[x-.20,5.87,.16],[x-.33,5.86,.25],[x-.42,5.71,.31],[x-.48,5.53,.37],[x-.61,5.47,.39],[x-.72,5.54,.44],[x-.77,5.75,.58]],.017,'black',8);
    s.pipe([[x+.10,5.70,.02],[x+.18,5.64,.12],[x+.24,5.55,.28],[x+.36,5.57,.47],[x+.43,5.76,.64]],.013,'black',8);
    s.box([x-.31,5.80,-.41],[.055,.56,.067],'ribs',.005);
  }
  for(const x of [-8.9,0,8.9]){
    s.box([x,5.68,.38],[.57,.19,.31],'frame',.022);
    s.pipe([[x-.082,5.83,.40],[x+.38,5.83,.40]],.126,'al',20);
    for(let k=0;k<7;k++)collar(s,[x-.06+k*.062,5.83,.4],[1,0,0],.143,.018,'joint');
    s.box([x+.13,5.98,.40],[.18,.10,.15],'frame');
    s.pipe([[x-.23,5.76,.2],[x-.23,6.27,.2]],.066,'stem',14);
  }
  // Isolate the two take-offs at their bolted ends.

  for(const q of [-1,1]){
    s.select('flue',q<0?'一号':'二号',[0,0,q*.85]);
    const a:V=[10.25,4.93,q*.40],b:V=[11.57,5.43,q*.75],d=unit(sub(b,a));
    s.pipe([a,b],.27,'duct',32);const end=add(b,mul(d,.043));
    collar(s,b,d,.315,.09,'rust');s.pipe([end,add(end,mul(d,.004))],.238,'gasket',32);
    const u:V=unit([d[2],0,-d[0]]),v:V=unit([d[1]*u[2],d[2]*u[0]-d[0]*u[2],-d[1]*u[0]]);
    for(let k=0;k<8;k++){const ang=k*Math.PI/4;stud(s,add(end,add(mul(u,.285*Math.cos(ang)),mul(v,.285*Math.sin(ang)))),d,.021);}
  }
}
export function buildCell(){const s=new Shop();shell(s);hoods(s);superstructure(s);anodes(s);busbars(s);grating(s);roof(s);interiors(s,xs,pitch);return [...s.batches.values()];}
