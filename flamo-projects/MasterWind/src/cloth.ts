import { clamp, smooth, wind, ground, type Run } from './wind';

type XY=[number,number];
type Air=ReturnType<typeof wind>;
export const pennant={x:507,y:ground(507)-80};

export function ribbonLoad(air:Air){
  return {across:air.across,strength:clamp(Math.hypot(air.across,air.up*.38)/302),
    reach:Math.tanh(air.across/90),lift:clamp(air.up/365,-.5,1),curl:air.curl};
}
// Both the pennant and the loose painted hems carry the crest away from their tie.
export function ripple(u:number,time:number,curl:number,phase=0){
  return Math.sin(u*8-time*5+curl+phase);
}

interface Piece {
  root:XY; axis:number; length:number; halfWidth:number; weight:number; delay:number;
  spread:number; phase:number; outline:XY[];
  rearMount?:{seam:number;rest:number;looseFrom:number};
}
const originalCape:XY[]=[[109,100],[155,94],[195,68],[277,65],[277,169],[184,169],[165,170],[139,170],[127,166],[124,158],[120,150],[115,136],[107,128]];
export const pieces:Piece[]=[
  {root:[66,30],axis:-.015,length:129,halfWidth:14,weight:.28,delay:.24,spread:.27,phase:.38,rearMount:{seam:3.66,rest:2.82,looseFrom:.31},
   outline:[[96,27],[102,25],[106,26],[114,25],[122,22],[130,23],[136,27],[143,30],[153,29],[161,23],[174,20],[192,23],[197,38],[149,42],[115,40],[100,30]]},
  {root:[65,29],axis:-.17,length:97,halfWidth:20,weight:.34,delay:.27,spread:.48,phase:.73,rearMount:{seam:3.72,rest:3.12,looseFrom:.34},
   outline:[[59,29],[57,21],[62,13],[108,0],[158,0],[160,23],[132,26],[123,23],[112,23],[104,25],[98,29],[87,31.2],[76,33],[66,32.1],[62,31]]},
  {root:[152,216],axis:.10,length:64,halfWidth:25,weight:.48,delay:.18,spread:.86,phase:1.10,rearMount:{seam:2.63,rest:2.23,looseFrom:.28},
   outline:[[151.5,214],[159,214],[178,202],[209,201],[217,216],[216,242],[187,243],[163,230],[153,222]]},
  {root:[69,231],axis:1.97,length:32,halfWidth:14,weight:.72,delay:.14,spread:.34,phase:1.65,
   outline:[[66,229],[72,229],[70,240],[65,252],[62,258],[59,258],[58,255],[55,256],[54,252],[51,253],[50,249],[59,240]]},
  {root:[33,222],axis:2.00,length:21,halfWidth:8,weight:.75,delay:.12,spread:.34,phase:2.1,
   outline:[[31,222],[35,223],[32,234],[30,239],[25,240],[23,237],[22,233],[25,228]]},
];

function clip(ink:OffscreenCanvasRenderingContext2D,pts:XY[]){
  ink.beginPath();pts.forEach(([x,y],i)=>i?ink.lineTo(x,y):ink.moveTo(x,y));ink.closePath();ink.clip();
}
export function cutStation(atlas:ImageBitmap|OffscreenCanvas){
  // The first tile uses the original 277 × 360 body coordinates. The second
  // contains the whole worn cape, from the front fastening to the last fringe.
  const blank=()=>new OffscreenCanvas(277,360);
  const art=blank();art.getContext('2d')!.drawImage(atlas,0,0,277,360,0,0,277,360);
  const body=blank(),base=body.getContext('2d')!;base.drawImage(art,0,0);
  base.save();clip(base,originalCape);base.clearRect(0,0,art.width,art.height);base.restore();
  const panel=new OffscreenCanvas(300,200);
  panel.getContext('2d')!.drawImage(atlas,277,0,300,200,0,0,300,200);
  const layers=pieces.map((piece,i)=>{
    base.save();clip(base,piece.outline);
    base.clearRect(0,0,art.width,art.height);
    // These two short waist ties lie on top of the tunic in the original painting.
    if(i>=3)base.drawImage(art,-(i===3?13:7),-2);
    base.restore();
    const layer=blank(),ink=layer.getContext('2d')!;
    if(i===0){
      // The painted ribbon emerges from under the black tuft. Continue the hidden
      // length to the knot so the two overlapping strands can separate in a gust.
      ink.strokeStyle='#983b28';ink.lineWidth=2.1;ink.lineCap='round';
      ink.beginPath();ink.moveTo(65,30);ink.bezierCurveTo(78,28,85,24,102,27);ink.stroke();
    }
    ink.save();clip(ink,piece.outline);ink.drawImage(art,0,0);ink.restore();
    return layer;
  });
  // Only items on the near side cover the returning cloth. The neck and the
  // hem share one painted panel throughout the turn.
  const foreground=blank(),front=foreground.getContext('2d')!;
  for(const outline of [
    [[84,150],[93,136],[112,130],[126,143],[135,164],[172,163],[174,183],[143,211],[153,226],[142,234],[118,215],[114,198],[94,177],[82,168]],
    [[49,185],[58,177],[71,177],[77,189],[73,205],[78,212],[67,230],[52,238],[38,230],[34,215],[41,201],[49,198]],
  ] as XY[][]){
    front.save();clip(front,outline);front.drawImage(body,0,0);front.restore();
  }
  // Sample broad light and shadow from the painted torso. The shader uses only
  // its luminance inside the contact area, leaving the cape's own dye and alpha intact.
  const relief=blank(),light=relief.getContext('2d')!;
  light.filter='blur(4px)';
  light.drawImage(atlas,277,200,277,145,0,50,277,145);
  return {body,layers:[panel,...layers],foreground,relief};
}

// Sample the same local wind at earlier instants for successive lengths of cloth.
// The history is sampled in seconds, so neither a frame drop nor a reversal can
// make the flutter jump phase. Each rail is integrated at constant material length.
export function clothHistory(s:Run){
  const x=s.mode==='wait'?pennant.x:s.x,y=s.mode==='wait'?pennant.y:s.y-65;
  return Array.from({length:13},(_,i)=>ribbonLoad(wind(x,y,s.time-i*.04,s.seed)));
}
type History=ReturnType<typeof clothHistory>;
export function clothStrip(piece:Piece,cols:number,rows:number){
  const margin=5,span=piece.length+margin,cs=Math.cos(piece.axis),sn=Math.sin(piece.axis);
  // Texture coordinates belong to the original painting. The worn direction is
  // a separate frame, so turning the cloth never mirrors the face or the grip.
  const seam=piece.rearMount?.seam??piece.axis;
  const handed=piece.rearMount?-1:1;
  const rails=[new Float32Array((cols+1)*4),new Float32Array((cols+1)*4)];
  const points=Array.from({length:(cols+1)*(rows+1)},(_,i)=>{
    const col=i%(cols+1),u=col/cols,v=Math.floor(i/(cols+1))/rows;
    const along=span*u-margin,side=(v*2-1)*piece.halfWidth;
    return {col,v,side,u:(piece.root[0]+along*cs-side*sn)/277,vTex:(piece.root[1]+along*sn+side*cs)/360};
  });
  function update(history:History,t:number){
    rails.forEach((rail,edge)=>{
      let x=piece.root[0]-margin*Math.cos(seam),y=piece.root[1]-margin*Math.sin(seam);
      for(let j=0;j<=cols;j++){
        const u=clamp(((j-.5)*span/cols-margin)/piece.length);
        const h=u*piece.delay/.04,k=Math.floor(h),frac=h-k;
        const a=history[k],b=history[k+1],reach=a.reach+(b.reach-a.reach)*frac;
        const lift=a.lift+(b.lift-a.lift)*frac,load=a.strength+(b.strength-a.strength)*frac;
        const curl=a.curl+(b.curl-a.curl)*frac;
        const free=smooth(0,.18,u);
        const sag=(.26+.09*piece.weight)*(1-load)+.055*piece.weight-lift*.23*Math.abs(reach);
        const heading=reach>=0?Math.atan2(sag,reach):Math.PI-Math.atan2(sag,-reach);
        const phase=piece.phase+(edge-.5)*piece.spread;
        const slope=ripple(u,t,curl,phase+Math.PI*.5);
        const curlTip=Math.sin(14*u-6.8*t+phase+curl);
        const wave=(slope*(.17+.42*load)+curlTip*u*.11*load)*(.28+.72*u);
        let angle=piece.axis+free*(heading-piece.axis+reach*wave);
        const mount=piece.rearMount;
        if(mount){
          const rest=mount.seam+(mount.rest-mount.seam)*smooth(.12,.84,u);
          // The free end may curl forward, while the sewn portion stays behind the
          // shoulder, crown or sword hand. A slack wind settles into the worn drape.
          const loose=smooth(mount.looseFrom,1,u);
          const pull=loose*clamp(Math.abs(reach)*(.38+.62*load));
          angle=rest+(heading-rest)*pull
            +free*(reach*wave*.85+lift*.19+curlTip*.035);
        }
        if(j){x+=span/cols*Math.cos(angle);y+=span/cols*Math.sin(angle);}
        const k4=j*4;rail[k4]=x;rail[k4+1]=y;
        rail[k4+2]=-handed*Math.sin(angle);rail[k4+3]=handed*Math.cos(angle);
      }
    });
  }
  return {points,update,rails};
}

// Coordinates of the two painted edges at successive distances from the shoulder.
type CapeSection=[number,number,number,number];
const hanging:CapeSection[]=[
  [75,89.3,75,143],[45,97,55,148],[23,125,44,165],[17,165,44,195],
  [14,213,45,234],[11,267,42,279],[6,326,40,323],
];
const behind:CapeSection[]=[
  [75,89.3,75,143],[43,95,47,148],[4,108,6,155],[-38,119,-39,164],
  [-83,124,-87,174],[-132,121,-138,176],[-183,117,-188,177],
];
// In a following wind the upper stations lie on the shoulder blade and flank.
const pressed:CapeSection[]=[
  [75,89.3,75,143],[38,98,60,147],[24,137,64,162],[21,157,109,185],
  [54,194,147,196],[147,226,204,194],[255,212,276,149],
];
const paintEdges:XY[]=[[30,118],[37,125],[55,133],[83,148],[97,156],[115,165],[147,181]];

// Uniform cubic interpolation shares a tangent at each neighbouring section.
function sampleGuide(guide:ReadonlyArray<readonly number[]>,u:number,rootSlope:readonly number[]){
  const f=u*(guide.length-1),i=Math.min(guide.length-2,Math.floor(f)),s=f-i;
  const prev=guide[Math.max(0,i-1)],a=guide[i],b=guide[i+1],next=guide[Math.min(i+2,guide.length-1)];
  return a.map((value,j)=>{
    const m0=i===0?rootSlope[j]:(b[j]-prev[j])*.5;
    const m1=i+2===guide.length?b[j]-value:(next[j]-value)*.5;
    const delta=b[j]-value;
    return value+s*(m0+s*((3*delta-2*m0-m1)+s*(m0+m1-2*delta)));
  });
}

// Interpolate direction and length separately so a turning strip keeps its width.
function turningVector(x:number,y:number,tx:number,ty:number){
  const start=Math.atan2(y,x),end=Math.atan2(ty,tx);
  const delta=end-start;
  return {start,turn:Math.atan2(Math.sin(delta),Math.cos(delta)),length:Math.hypot(x,y),stretch:Math.hypot(tx,ty)-Math.hypot(x,y)};
}
export function capePanel(cols:number){
  // Match the tangent of the fixed collar exactly where the free panel begins.
  const rootSlope=[-231/(hanging.length-1),0,-231/(hanging.length-1),0];
  let stillX=75,stillY=116.15,frontX=75,frontY=116.15;
  const columns=Array.from({length:cols+1},(_,i)=>{
    const x=141-297*i/cols,u=clamp((75-x)/231);
    const [top,bottom]=sampleGuide(paintEdges,u,[0,0]);
    const still=sampleGuide(hanging,u,rootSlope);
    const forward=sampleGuide(pressed,u,rootSlope);
    const sx=(still[0]+still[2])*.5,sy=(still[1]+still[3])*.5;
    const fx=(forward[0]+forward[2])*.5,fy=(forward[1]+forward[3])*.5;
    const step=turningVector(sx-stillX,sy-stillY,fx-frontX,fy-frontY);
    const span=turningVector(still[2]-still[0],still[3]-still[1],forward[2]-forward[0],forward[3]-forward[1]);
    stillX=sx;stillY=sy;frontX=fx;frontY=fy;
    return {u,top,bottom,still,back:sampleGuide(behind,u,rootSlope),step,span,
      x0:x,y0:71+.61*top,x1:x,y1:71+.61*bottom,shade:0};
  });
  let previousTime=NaN,lean=0;
  function update(history:History,t:number){
    const elapsed=t-previousTime;
    previousTime=t;
    // One signed deflection carries the whole panel through a reversal.
    // A delayed local sample adds a travelling ripple without folding a row over its neighbour.
    const side=history[0].across*.35+history[3].across*.4+history[7].across*.25;
    const lift=history[0].lift*.5+history[4].lift*.5;
    const target=Math.tanh(side/(108-24*lift));
    const inertia=.18+.32*(lean>0||target>0?smooth(-.1,.35,lean):0);
    const response=elapsed>=0&&elapsed<.6?1-Math.exp(-elapsed/inertia):1;
    lean+=(target-lean)*response;
    const load=smooth(0,1,Math.abs(lean));
    // Keep the delayed tip offset small relative to the local cloth width.
    const tipDrag=(history[9].across+history[12].across)*.5;
    const tipLean=Math.tanh(tipDrag/(108-24*lift));
    const lagX=6*(tipLean-lean);
    const contact=smooth(0,.76,load),hemLoad=smooth(.10,1,load);
    const turnLag=.16*(smooth(0,1,Math.max(0,tipLean))-load)*smooth(0,.25,lean);
    let spineX=75,spineY=116.15;
    for(const col of columns){
      const u=col.u;if(u===0)continue;
      const lag=u*9.5,k=Math.floor(lag),mix=lag-k;
      const a=history[k],b=history[k+1];
      const curl=a.curl+(b.curl-a.curl)*mix;
      const free=smooth(.53,.95,u)*(1-.32*smooth(0,.45,lean));
      const wave=free*load*(5*ripple(u,t,curl)+1.8*Math.sin(12*u-6.4*t+curl));
      const innerWave=free*load*(4.5*ripple(u,t,curl,.55)+1.4*Math.sin(12*u-6.4*t+curl+.35));
      const rise=lift*u*u*(10+6*load)*(lean>0?free:1);
      if(lean>0){
        // Wind takes up the slack against the body before it lifts the unsupported hem.
        const loose=smooth(.36,.78,u);
        const travel=clamp(contact+(hemLoad-contact)*loose+free*turnLag);
        const step=col.step,span=col.span;
        const heading=step.start+step.turn*travel,ds=step.length+step.stretch*travel;
        spineX+=ds*Math.cos(heading);spineY+=ds*Math.sin(heading);
        const cross=span.start+span.turn*travel,half=(span.length+span.stretch*travel)*.5;
        const dx=half*Math.cos(cross),dy=half*Math.sin(cross);
        col.x0=spineX-dx;col.y0=spineY-dy;
        col.x1=spineX+dx;col.y1=spineY+dy;
      }else{
        col.x0=col.still[0]+(col.back[0]-col.still[0])*load;
        col.y0=col.still[1]+(col.back[1]-col.still[1])*load;
        col.x1=col.still[2]+(col.back[2]-col.still[2])*load;
        col.y1=col.still[3]+(col.back[3]-col.still[3])*load;
      }
      col.x0+=free*lagX;col.x1+=free*lagX;
      col.y0+=wave-rise;col.y1+=innerWave-rise;
      col.shade=load*free*.075*ripple(u,t,curl);
    }
  }
  return {columns,update,get contact(){return smooth(0,.76,lean);}};
}
