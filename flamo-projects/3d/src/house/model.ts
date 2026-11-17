// Authored geometry and palette for this house, in metres; Y is up.
export type V3 = [number, number, number];
type RGB = [number, number, number];
export type HouseModel = { solid: Float32Array; plants: Float32Array; wind: Float32Array; counts: Record<string, number> };
export function makeHouse(seed = 731): HouseModel {
  let randomState = seed >>> 0;
  const random = () => { randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0; return randomState / 4294967296; };
  const between = (a:number,b:number) => a+(b-a)*random();
  const choose = <T,>(a:T[]) => a[Math.floor(random()*a.length)];
  const color = (hex:string):RGB => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255) as RGB;
  const palette = (s:string) => s.split(' ').map(color);
  const wood = palette('#6e5944 #604b3f #786048 #554338 #66503e #51433f');
  const roof = palette('#4c414d #5b4750 #443c4c #604a48 #584644 #38404a #70534a');
  const leaf = palette('#405841 #4d6848 #537951 #3b674e #73815a #2e443b #597561');
  const grass = palette('#a0ad88 #b2b790 #7e936e #728765 #697c53 #98a477 #c0bc8b');
  const trim = color('#403540'), stone = palette('#5e6970 #6b7475 #525e6b #768077 #464954');
  let destination:number[] = [];
  const solid = destination, plants:number[] = [], wind:number[] = [];
  let sway = 0, phase = 0;
  const subtract = (a:V3,b:V3):V3 => [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  const unit = (v:V3):V3 => {const l=Math.hypot(...v)||1; return v.map(x=>x/l) as V3;};
  const cross = (a:V3,b:V3):V3 => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  function triangle(a:V3,b:V3,c:V3,rgb:RGB,normal?:V3) {
    const n = normal || unit(cross(subtract(b,a),subtract(c,a)));
    for(const p of [a,b,c]) { destination.push(...p,...n,...rgb,1); if(destination===plants) wind.push(sway*Math.max(0,p[1]),phase); }
  }
  function quad(a:V3,b:V3,c:V3,d:V3,rgb:RGB,n?:V3){triangle(a,b,c,rgb,n);triangle(a,c,d,rgb,n);}
  function box(x:number,y:number,z:number,w:number,h:number,d:number,c:RGB) {
    const a=x-w/2,b=x+w/2,k=y-h/2,l=y+h/2,e=z-d/2,f=z+d/2;
    quad([a,k,f],[b,k,f],[b,l,f],[a,l,f],c,[0,0,1]);
    quad([b,k,e],[a,k,e],[a,l,e],[b,l,e],c,[0,0,-1]);
    quad([b,k,f],[b,k,e],[b,l,e],[b,l,f],c,[1,0,0]);
    quad([a,k,e],[a,k,f],[a,l,f],[a,l,e],c,[-1,0,0]);
    quad([a,l,f],[b,l,f],[b,l,e],[a,l,e],c,[0,1,0]);
  }
  function branch(a:V3,b:V3,r:number,c:RGB,sides=5) {
    const axis=unit(subtract(b,a)),u=unit(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),v=cross(axis,u);
    for(let i=0;i<sides;i++){
      const p=(center:V3,t:number,radius:number):V3=>center.map((n,j)=>n+radius*(u[j]*Math.cos(t)+v[j]*Math.sin(t))) as V3;
      const t=i/sides*Math.PI*2,tt=(i+1)/sides*Math.PI*2;
      quad(p(a,t,r),p(a,tt,r),p(b,tt,r*.65),p(b,t,r*.65),c);
    }
  }
  // Uneven, scalloped soil island with a visible purple-brown vertical rim.
  function radius(t:number){return 2.55+.22*Math.sin(t*3+.5)+.16*Math.cos(t*7)+.08*Math.sin(t*13);}
  function groundY(x:number,z:number){return .03*Math.sin(x*2+z*3)+.025*Math.cos(z*4);}
  const ground=palette('#79794f #79744b #716c46 #858357 #666347 #746f4b #696b4b');
  const soil=palette('#40323e #493842 #523e45 #594549 #39303a');
  for(let x=-3;x<3;x+=.105) for(let z=-3;z<3;z+=.105){
    const t=Math.atan2(z,x),r=Math.hypot(x,z);
    if(r>radius(t))continue;
    const c=r>radius(t)-.24?choose(soil):choose(ground);
    const shade=(Math.abs(x)<1.28&&Math.abs(z)<1.2)?.57:1;
    quad([x,groundY(x,z),z],[x,groundY(x,z+.107),z+.107],[x+.107,groundY(x+.107,z+.107),z+.107],[x+.107,groundY(x+.107,z),z],c.map(n=>n*shade) as RGB,[0,1,0]);
  }
  for(let i=0;i<150;i++){
    const t=i/150*Math.PI*2,u=(i+1)/150*Math.PI*2,r=radius(t),rr=radius(u);
    const a:V3=[Math.cos(t)*r,0,Math.sin(t)*r],b:V3=[Math.cos(u)*rr,0,Math.sin(u)*rr];
    quad(a,b,[b[0]*.97,-between(.26,.4),b[2]*.97],[a[0]*.97,-between(.26,.4),a[2]*.97],choose(soil));
  }
  // Foundation: uneven slate blocks, dark cellar openings and corner footings.
  box(0,.22,0,2.16,.43,2.04,color('#3e3c45'));
  for(let level=0;level<3;level++) for(let i=0;i<12;i++) {
    const x=-1.02+i*.185+(level%2)*.06;
    box(x,.07+level*.135,1.035,.17,.115,.05,choose(stone));
    box(1.095,.07+level*.135,x,.045,.115,.17,choose(stone));
  }
  box(0,.15,1.08,.53,.18,.05,color('#241f2b'));
  // Horizontal siding. The window openings are actual holes in the boards.
  const bottom=.45, top=2.82;
  for(let row=0;row<20;row++){
    const y=bottom+row*.118,h=.102,c=choose(wood),inWindow=y>1.21&&y<2.28;
    if(inWindow){for(const s of [-1,1]){box(s*.8,y,1.01,.48,h,.095,c);box(1.07,y,s*.76,.095,h,.46,c);}}
    else {box(0,y,1.01,2.08,h,.095,c);box(1.07,y,0,.095,h,2.0,c);}
    box(0,y,-1.01,2.08,h,.08,choose(wood));box(-1.07,y,0,.08,h,2,choose(wood));
    for(let j=0;j<9;j++){
      let x=between(-1,1);if(inWindow&&Math.abs(x)<.59)continue;
      const grain=color(random()>.5?'#96816a':'#39313b');
      box(x,y+between(-.035,.035),1.064,between(.035,.22),.008,.005,grain);
      if(random()>.6)box(1.123,y+between(-.035,.035),x,.005,.008,between(.04,.18),grain);
    }
  }
  // Heavier beams at corners and under the eaves.
  for(const x of [-1.12,1.12])for(const z of [-1.05,1.05]){
    box(x,1.62,z,.095,2.62,.10,trim);box(x+.026,1.62,z+.026,.025,2.62,.027,color('#827159'));
  }
  for(const y of [.47,2.8]){box(0,y,1.085,2.31,.085,.10,trim);box(1.145,y,0,.10,.085,2.19,trim);}
  // Glazing stays behind the frame. Damage reads as a worn pane, not loose triangles.
  function window(side:boolean){
    const map=(p:V3):V3=>side?[p[2]+.055,p[1],p[0]]:p;
    const normal:V3=side?[1,0,0]:[0,0,1];
    const face=(a:V3,b:V3,c:V3,d:V3,col:RGB)=>quad(map(a),map(b),map(c),map(d),col,normal);
    face([-.53,1.2,1.065],[.53,1.2,1.065],[.53,2.33,1.065],[-.53,2.33,1.065],color('#18171f'));
    const bar=(x:number,y:number,w:number,h:number,col:RGB)=>side?box(1.15,y,x,.07,h,w,col):box(x,y,1.095,w,h,.07,col);
    for(const x of [-.54,.54])bar(x,1.765,.063,1.19,trim);
    for(const y of [1.18,2.35])bar(0,y,1.17,.066,trim);
    bar(0,1.76,.048,1.17,color('#5b505b'));bar(0,1.75,1.08,.047,color('#61545f'));
    bar(0,1.14,1.25,.065,color('#827567'));
    type P2=[number,number];
    const glassZ=1.083;
    const perimeter:P2[]=[[-1,-1],[-.33,-1],[.33,-1],[1,-1],[1,-.33],[1,.33],[1,1],[.33,1],[-.33,1],[-1,1],[-1,.33],[-1,-.33]];
    // Asymmetric remnants stay attached to the sash; all triangles share a normal/color.
    const fracture:P2[]=[[-.73,-.83],[-.24,-.59],[.39,-.74],[.81,-.81],[.58,-.30],[.77,.22],[.65,.76],[.27,.52],[-.21,.81],[-.76,.66],[-.57,.19],[-.82,-.26]];
    function stroke(points:P2[],width:number,shade:string){
      for(let i=1;i<points.length;i++){
        const a=points[i-1],b=points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
        const dx=-(b[1]-a[1])/length*width/2,dy=(b[0]-a[0])/length*width/2;
        face([a[0]-dx,a[1]-dy,glassZ+.003],[b[0]-dx,b[1]-dy,glassZ+.003],
          [b[0]+dx,b[1]+dy,glassZ+.003],[a[0]+dx,a[1]+dy,glassZ+.003],color(shade));
      }
    }
    function pane(cx:number,cy:number,damage:number,shade:string,flip=false){
      const point=(p:P2,z=glassZ):V3=>[cx+p[0]*.244,cy+p[1]*.27,z];
      const glass=color(shade);
      if(damage){
        const opening=fracture.map(([x,y]):P2=>[(flip?-x:x)*damage+(flip?-.10:.10),y*damage-.07]);
        // Let the missing portion reach the lower corner instead of looking like a punched hole.
        opening[1][1]=-1;opening[2][1]=-1;
        opening[3]=[flip?-1:1,-1];opening[4][0]=flip?-1:1;
        // Mirror both rings together to keep corresponding edges paired.
        const outer=perimeter.map(([x,y]):P2=>[flip?-x:x,y]);
        for(let i=0;i<outer.length;i++){
          const next=(i+1)%outer.length;
          const points=[outer[i],outer[next],opening[next],opening[i]];
          for(const [a,b,c] of [[0,1,2],[0,2,3]]){
            const p=points[a],q=points[b],r=points[c];
            const area=(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
            if(Math.abs(area)>1e-8)triangle(map(point(p)),map(point(q)),map(point(r)),glass,normal);
          }
        }
        // Only a few dull edge glints, never a bright outline around the entire hole.
        for(const i of [5,8]){
          const a=point(opening[i]),b=point(opening[i+1]);
          stroke([[a[0],a[1]],[b[0],b[1]]],.003,'#42464a');
        }
      }else{
        face(point([-1,-1]),point([1,-1]),point([1,1]),point([-1,1]),glass);
        // Small, broad reflection kept close to the pane's value.
        face(point([-.90,.34],glassZ+.001),point([-.46,.45],glassZ+.001),
          point([-.25,.94],glassZ+.001),point([-.74,.94],glassZ+.001),color('#343a40'));
        stroke([[cx+.03,cy+.27],[cx-.025,cy+.11],[cx+.015,cy+.04],[cx-.04,cy-.07]],.005,'#22252c');
      }
    }
    pane(-.267,2.047,side?0:.97,'#353a40');
    pane(.267,2.047,side?.82:0,'#30363d',true);
    pane(-.267,1.476,0,'#292f35');
    pane(.267,1.476,side?0:.64,'#30353b',true);
    // Tiny worn paint flecks soften the otherwise perfectly regular frame.
    bar(-.53,2.20,.025,.055,color('#625760'));
    bar(.53,1.37,.025,.036,color('#5e555b'));
    bar(-.31,1.18,.067,.013,color('#6c6264'));
  }
  window(false);window(true);
  // Back door completes the unseen sides for orbit inspection.
  box(0,1.17,-1.063,.65,1.46,.09,color('#3f3334'));
  for(let i=0;i<5;i++)box(-.26+i*.13,1.17,-1.115,.105,1.4,.012,choose(wood));
  box(.22,1.12,-1.145,.045,.045,.025,color('#93907a'));
  // A truncated hip roof. Each tile has its own raised edge and ridge seam.
  const edge=1.38,peak=.52,roofBase=2.91,roofHeight=1.12;
  box(0,2.89,0,2.84,.13,2.70,trim);
  function roofPoint(side:number,u:number,t:number,lift=0):V3 {
    const r=edge+(peak-edge)*t,p:V3=[u*r,roofBase+roofHeight*t+lift,r*.95];
    if(side===1)return [p[2],p[1],-p[0]];if(side===2)return [-p[0],p[1],-p[2]];if(side===3)return [-p[2],p[1],p[0]];return p;
  }
  for(let side=0;side<4;side++)for(let row=0;row<9;row++){
    const t=row/9,tt=(row+1)/9,n=16-row;
    for(let k=0;k<n;k++){
      const u=-1+2*k/n+.018,uu=-1+2*(k+1)/n-.018;
      const lift=between(.018,.035),c=choose(roof);
      const a=roofPoint(side,u,t,lift),b=roofPoint(side,uu,t,lift),cc=roofPoint(side,uu,tt,.008),d=roofPoint(side,u,tt,.008);
      quad(a,b,cc,d,c);
      branch(a,b,.012,color('#26232f'),3);
      if(random()>.4)branch(roofPoint(side,u+.017,t+.018,lift+.008),roofPoint(side,u+.017,tt-.015,.02),.007,color('#8c6d5e'),3);
    }
  }
  box(0,4.06,0,1.09,.08,1.04,color('#493f48'));
  for(let i=0;i<7;i++)box(-.48+i*.16,4.107,0,.135,.02,1.01,choose(roof));
  for(const s of [-1,1]) for(const z of [-1,1])branch([s*1.39,2.96,z*1.32],[s*.54,4.11,z*.51],.033,trim,5);
  // Worn path and broken steps in the near foreground.
  for(let i=0;i<7;i++){
    const z=1.55+i*.15,x=.6-Math.sin(i*.35)*.22,y=.02-i*.012;
    box(x,y,z,.58+between(-.10,.12),.055,.16,choose(stone));
    box(x+.02,y+.03,z,.40,.008,.015,color('#8b9385'));
  }
  // Picket fence behind the garden, with sloped/uneven tops.
  for(let i=0;i<20;i++){
    const x=-.2+i*.135,z=-2.02+.10*Math.sin(i*.16),h=between(.54,.78);
    branch([x,0,z],[x+between(-.035,.035),h,z],.025,color('#4c3b45'),4);
  }
  for(const y of [.22,.46])branch([-.23,y,-2.02],[2.39,y,-1.99],.024,color('#46333f'),4);
  // Branching tree to the left, silhouette extends above the roof.
  const treeBase:V3=[-1.53,.05,-.48];
  const trunk:V3[]=[treeBase,[-1.66,1.15,-.54],[-1.49,2.42,-.6],[-1.77,3.36,-.62],[-1.5,4.29,-.66],[-1.27,5.32,-.64]];
  for(let i=0;i<trunk.length-1;i++)branch(trunk[i],trunk[i+1],.09-i*.012,color('#403742'));
  const tips:V3[]=[];
  for(let i=0;i<32;i++){
    const level=between(1.5,5.15),t=level/5.3,base:V3=[-1.59+Math.sin(t*7)*.12,level,-.55];
    const angle=between(0,Math.PI*2),length=between(.3,.85)*(1-.45*t),tip:V3=[base[0]+Math.cos(angle)*length,level+between(.12,.5),base[2]+Math.sin(angle)*length];
    branch(base,tip,.018+(.03*(1-t)),color('#50424b'),4);tips.push(tip);
    for(let j=0;j<2;j++){
      const twig:V3=[tip[0]+between(-.28,.28),tip[1]+between(.05,.3),tip[2]+between(-.26,.26)];branch(tip,twig,.009,color('#4a3f48'),3);tips.push(twig);
    }
  }
  const staticTriangles=solid.length/30;
  destination=plants;
  function leafAt(p:V3,size:number,col:RGB){
    const angle=between(0,Math.PI*2),u:V3=[Math.cos(angle)*size,between(-.3,.3)*size,Math.sin(angle)*size];
    quad([p[0]-u[0],p[1]-u[1],p[2]-u[2]],[p[0],p[1]+size*.6,p[2]],[p[0]+u[0],p[1]+u[1],p[2]+u[2]],[p[0],p[1]-size*.7,p[2]],col,[.15,.9,.3]);
  }
  sway=.008;
  for(const tip of tips){phase=between(0,6.28);for(let i=0;i<13;i++)leafAt([tip[0]+between(-.30,.30),tip[1]+between(-.18,.3),tip[2]+between(-.27,.27)],between(.02,.05),choose(leaf));}
  // Ivy curtains: descend from the left eave and wrap the lower canopy.
  for(let strand=0;strand<25;strand++){
    const x=-1.32+between(-.48,.25),z=between(.4,1.25),length=between(.8,2.85);phase=between(0,6.28);sway=.003;
    for(let j=0;j<50;j++){
      const t=j/50,y=2.94-length*t;
      leafAt([x+Math.sin(t*12+strand)*.10,y,z+.2*Math.sin(t*4)],between(.035,.085),choose(leaf));
    }
  }
  for(let i=0;i<550;i++){
    const t=between(0,Math.PI*2),r=between(0,.67);phase=t;sway=.007;
    leafAt([-1.47+Math.cos(t)*r,1.82+between(-.35,.38),.72+Math.sin(t)*r],between(.045,.085),choose(leaf));
  }
  // Loose vines climbing the right wall and roof corner.
  for(let i=0;i<300;i++){
    const t=i/300,phi=between(0,6.28);sway=.004;phase=phi;
    leafAt([1.16+between(-.08,.12),.55+t*2.68,-.73+Math.sin(t*9)*.14+between(-.13,.13)],between(.025,.055),choose(leaf));
  }
  // Fine, irregular clumps of pale grass; preserve a winding path.
  let blades=0;
  for(let tuft=0;tuft<380;tuft++){
    const x=between(-2.7,2.7),z=between(-2.5,2.65),r=Math.hypot(x,z);
    if(r>radius(Math.atan2(z,x))-.04||(Math.abs(x)<1.27&&Math.abs(z)<1.18)||(z>1.24&&x>-.15&&x<1.28)||(r<2.1&&x>1.25&&z>.45))continue;
    const pale=x>1.15&&z>.0,edgeGrass=r>2.2;
    for(let i=0;i<between(9,23);i++){
      const bx=x+between(-.15,.15),bz=z+between(-.15,.15),by=groundY(bx,bz)+.025,h=between(.12,pale?.7:.4),w=between(.009,.024),bend=between(-.12,.12);
      const c=pale?choose(grass):edgeGrass?choose(palette('#685058 #80665f #4f424a #7e795c')):choose(leaf);
      sway=.07;phase=bx*2.4+bz*1.7;
      triangle([bx-w,by,bz],[bx+w,by,bz],[bx+bend,by+h,bz+between(-.06,.06)],c,[.1,.9,.4]);blades++;
    }
  }
  return {solid:new Float32Array(solid),plants:new Float32Array(plants),wind:new Float32Array(wind),counts:{staticTriangles,plantTriangles:plants.length/30,blades,treeLeafClusters:tips.length}};
}

export function houseCamera(yaw:number,zoom=1):Float32Array {
  // Orthographic projection with WebGPU 0..1 depth. View target slightly above the ground.
  const pitch=.40,dist=14,target:V3=[0,2.40,0],eye:V3=[Math.sin(yaw)*Math.cos(pitch)*dist,target[1]+Math.sin(pitch)*dist,Math.cos(yaw)*Math.cos(pitch)*dist];
  const z:V3=[(eye[0]-target[0])/dist,(eye[1]-target[1])/dist,(eye[2]-target[2])/dist],len=Math.hypot(z[0],z[2]);
  const x:V3=[z[2]/len,0,-z[0]/len],y:V3=[z[1]*x[2],z[2]*x[0]-z[0]*x[2],-z[1]*x[0]],scale=2/(7.45/zoom),near=.1,far=40;
  const dot=(a:V3,b:V3)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
  return new Float32Array([x[0]*scale,y[0]*scale,-z[0]/(far-near),0,x[1]*scale,y[1]*scale,-z[1]/(far-near),0,x[2]*scale,y[2]*scale,-z[2]/(far-near),0,-dot(x,eye)*scale,-dot(y,eye)*scale,(dot(z,eye)-near)/(far-near),1]);
}
