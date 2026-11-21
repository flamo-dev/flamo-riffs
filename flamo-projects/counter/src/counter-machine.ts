import { digits } from "./counter-motion";

export const BOARD = { width: 1419, height: 798.5 };
export const centers = [274, 459, 983, 1168];
export const LEVER = { x: 731, top: 287, travel: 208, pivot: 453 };
export const idleDigits = [0, 1, 2, 3];
const orange = "#ff7339";
const mono = 'Consolas, "Courier New", monospace';
const sans = 'Inter, "Segoe UI", "Microsoft YaHei", sans-serif';
type Brush = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function box(g: Brush, x: number, y: number, w: number, h: number, r: number, color: string | CanvasGradient) {
  g.fillStyle = color;
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}

function circle(g: Brush, x: number, y: number, r: number, color: string | CanvasGradient) {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

function label(g: Brush, str: string, x: number, y: number, size: number, color: string, weight = 600, align: CanvasTextAlign = "left", family = sans) {
  g.font = weight + " " + size + "px " + family;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillStyle = color;
  g.fillText(str, x, y);
}

function metal(g: Brush, x1: number, y1: number, x2: number, y2: number, stops: string[]) {
  const gradient = g.createLinearGradient(x1, y1, x2, y2);
  stops.forEach((value, i) => gradient.addColorStop(i / (stops.length - 1), value));
  return gradient;
}

// Keep the mechanical controls, reels, lettering and effects as separate Flamo scene images.
// Each has its own bounded texture, so spinning one reel does not redraw the whole scene.
export function layer(ctx, name: string, x: number, y: number, width: number, height: number, density = 1) {
  const w = Math.round(width * density);
  const h = Math.round(height * density);
  const surface = ctx.instance.app.createAnimationSurface({ id: ctx.instance.id + "-counter-" + name, width: w, height: h });
  const scratch = new OffscreenCanvas(w, h);
  const g = scratch.getContext("2d")!;
  const node = ctx.scene.create("image", {
    name: "Counter Drop / " + name,
    assetId: surface.id, position: { x: x * 2, y: y * 2 },
    size: { width: width * 2, height: height * 2 }, fit: "fill", lifecycle: "ephemeral", interactive: false,
  });
  ctx.scene.get(ctx.nodeId).append(node);
  ctx.dispose(() => { if (node.mounted) node.remove(); surface.dispose(); });
  return {
    node,
    paint(draw: (g: Brush) => void) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, w, h);
      g.save();
      g.scale(w / width, h / height);
      draw(g);
      g.restore();
      surface.clear();
      surface.draw(scratch);
      surface.commit();
    },
  };
}

export function drawLabels(g: Brush, spins: number, wins: number, message: string, result: string) {
  // The source's black/white split and its Flamo logo stay visible behind this layer.
  for (let i = 0; i < 3; i++) box(g, 103 + i * 10, 88 - 6 * i, 6, 12 + 6 * i, 3, orange);
  label(g, "Counter Drop", 150, 88, 44, "#fffaf4", 700);
  label(g, "局数", 960, 86, 18, "#636367");
  label(g, String(spins).padStart(2, "0"), 1010, 86, 31, "#232326", 700, "left", mono);
  label(g, "胜场", 1133, 86, 18, "#636367");
  label(g, String(wins).padStart(2, "0"), 1183, 86, 31, "#232326", 700, "left", mono);
  for (const [i, x] of [366, 1075].entries()) {
    const dark = i === 0;
    const c = dark ? "#d6d5d3" : "#4a4a4d";
    const line = dark ? "#454546" : "#d5d5d7";
    box(g, x - 163, 208, 65, 1.5, 0.75, line);
    box(g, x + 98, 208, 65, 1.5, 0.75, line);
    label(g, i === 0 ? "REELS  01–02" : "REELS  03–04", x, 207, 20, c, 600, "center", mono);
  }
  const statusColor = result === "jackpot" ? "#ffbe66" : result === "triple" ? "#ff9b56" : "#f0f0ee";
  circle(g, 146, 730, 6, result === "none" ? "#bebdc0" : orange);
  label(g, message, 169, 730, 27, statusColor);
  label(g, "三同获胜   /   四同头奖", 1290, 730, 24, "#3b3b3d", 600, "right");
}

export function drawLever(g: Brush, pull: number, armed: boolean, busy: boolean) {
  // The small local coordinate system is centered on the axis of the original artwork.
  g.translate(-LEVER.x + 95, -195);
  const cx = LEVER.x;
  const y = LEVER.top + LEVER.travel * pull;
  const x = cx + 19 * Math.sin(pull * Math.PI);
  g.shadowColor = "#0006"; g.shadowBlur = 12; g.shadowOffsetY = 8;
  box(g, cx - 59, 212, 118, 381, 54, "#202023");
  g.shadowBlur = 0; g.shadowOffsetY = 0;
  box(g, cx - 59, 208, 118, 381, 54, metal(g, cx-59,208,cx+59,589, ["#aaaaac","#3c3c40","#1c1c20","#606064"]));
  box(g, cx - 56, 211, 112, 375, 52, "#28282b");
  box(g, cx - 50, 217, 100, 363, 47, metal(g,cx-50,217,cx+50,580,["#3b3b3f","#1c1c1f","#303034"]));
  for (const sy of [232,568]) {
    circle(g,cx,sy,4.5,"#17171b"); box(g,cx-2.8,sy-0.8,5.6,1.6,0.6,"#838387");
  }
  box(g, cx-16, 261, 32, 248, 16,"#5a5a5c");
  box(g, cx-13, 263, 26, 244, 13,"#0d0d10");
  for (let i=0; i<8; i++) {
    const yy=327+i*20;
    box(g,cx-41,yy,i%2 ? 6 : 10,2,1, i/8 < pull ? orange : "#757577");
  }
  const pivot = LEVER.pivot;
  circle(g,cx,pivot,32,"#161619");
  circle(g,cx,pivot-1,28,metal(g,cx-20,pivot-20,cx+20,pivot+20,["#b4b1ae","#626165","#2f2f34"]));
  circle(g,cx,pivot,20,"#29292d");
  g.save();
  g.translate(cx,pivot);
  g.rotate(Math.atan2(x-cx, pivot-y));
  const length=Math.hypot(x-cx,pivot-y);
  box(g,-10,-length,20,Math.max(20,length+10),10,metal(g,-10,0,10,0,["#444346","#b0a9a4","#f4e9dc","#928781","#393638"]));
  g.restore();
  g.shadowColor="#0007";g.shadowBlur=8;g.shadowOffsetY=7;
  circle(g,x,y+2,43,"#571c0e");g.shadowBlur=0;g.shadowOffsetY=0;
  const ball=g.createRadialGradient(x-15,y-20,2,x+2,y+8,50);
  ball.addColorStop(0,"#fff2d8"); ball.addColorStop(.15,"#ffa66b"); ball.addColorStop(.42,"#ff7835");
  ball.addColorStop(.75,"#e94e16");ball.addColorStop(1,"#892a11");
  circle(g,x,y,42,ball);
  g.beginPath();g.arc(x,y,37,3.65,5.04);g.lineWidth=2.4;g.strokeStyle="#ffdeb288";g.stroke();
  label(g, busy ? "运转中" : armed ? "已启动" : "下拉 ↓",cx,536,18,busy?"#b6b1ae":"#ffb884",700,"center");
}

const paths = digits.map(glyph => new Path2D(glyph.path));
export function drawReel(g: Brush, phase: number, dark: boolean, landed: boolean, winning: boolean, jackpot: boolean) {
  const index = Math.floor(phase);
  const fraction = phase - index;
  const color = winning ? dark ? "#ffbc67" : "#ab420e" : dark ? "#fffaf4" : "#252528";
  const centerY = 147;
  const pitch = 240;
  // Adjacent glyphs share a clipped window and travel down as the imported track advances.
  for (let j = 0; j <= 1; j++) {
    const dy=(fraction-j)*pitch;
    const digit=((index+j)%10+10)%10;
    if (Math.abs(dy) >= pitch) continue;
    const size=252;
    g.save();
    g.globalAlpha=Math.max(0, 1 - Math.pow(Math.abs(dy)/pitch,1.6));
    g.fillStyle=color;
    g.translate(95 - digits[digit].width*size/2, centerY + size*.365 + dy);
    g.scale(size,-size);
    g.fill(paths[digit]);
    g.restore();
  }
  const edge=g.createLinearGradient(0,0,0,288);
  edge.addColorStop(0,"transparent");edge.addColorStop(.14,"#000");
  edge.addColorStop(.86,"#000");edge.addColorStop(1,"transparent");
  g.save();g.globalCompositeOperation="destination-in";g.fillStyle=edge;
  g.fillRect(0,0,190,300);g.restore();
  const mark = winning ? (jackpot ? "#ff913b" : "#ffac62") : landed ? (dark ? "#ff8144" : "#e36932") : (dark ? "#645a55" : "#d5cfca");
  box(g, winning ? 66 : 82, 291, winning ? 58 : 26, 4, 2, mark);
}

export function makeConfetti(centres: number[], jackpot: boolean) {
  const colors = jackpot ? ["#ff8c40","#ffd364","#f8619a","#81d9db","#9b85ff"] : ["#ff9245","#ffd793","#e8b674"];
  const count=jackpot ? 108 : 36;
  return Array.from({length:count},(_,i)=>{
    const origin=centres[i%centres.length];
    const side=i%2 ? 1 : -1;
    return { x:origin, y:jackpot && i%3===0 ? 183 : 510, vx:side*(45+Math.random()*(jackpot?420:180)),
      vy:-(160+Math.random()*(jackpot?480:280)), angle:Math.random()*6, spin:(Math.random()-.5)*10,
      delay:jackpot ? Math.floor(i/36)*.29 : 0, color:colors[i%colors.length], size:3+Math.random()*5 };
  });
}

export function drawCelebration(g: Brush, t: number, pieces: ReturnType<typeof makeConfetti>, jackpot: boolean, hits: number[]) {
  const duration = jackpot ? 2.65 : 1.6;
  if (jackpot && t < 2.65) {
    g.save();
    const spectrum=g.createLinearGradient(120,160,1270,620);
    ["#ff7646","#ffce67","#ef75bd","#a18cff","#74dbd2"].forEach((c,i)=>spectrum.addColorStop(i/4,c));
    g.lineWidth=3;g.strokeStyle=spectrum;g.globalAlpha=Math.min(1,t*8,2.65-t)*.9;
    g.setLineDash([32,14]);g.lineDashOffset=-t*130;
    for(const x of [142,852]) {
      g.beginPath();g.roundRect(x,140,446,518,113);g.stroke();
    }
    g.restore();
  }
  for (const p of pieces) {
    const age=t-p.delay;
    if (age<0) continue;
    g.save();g.globalAlpha=Math.min(1,Math.max(0,(duration-age)*2.1));
    g.translate(p.x+p.vx*age,p.y+p.vy*age+225*age*age);
    g.rotate(p.angle+p.spin*age);
    box(g,-p.size*.45,-p.size,p.size*.9,p.size*2,1.3,p.color);g.restore();
  }
  // A second and third ripple belong exclusively to the four-of-a-kind fanfare.
  for (const x of hits) for (let i=0;i<(jackpot?3:1);i++) {
    const u=(t-i*.29)/.76;
    if(u<0 || u>=1) continue;
    g.save();g.globalAlpha=(1-u)*.66;g.lineWidth=4*(1-u)+.6;
    g.strokeStyle=jackpot ? ["#ff9f59","#ffd56b","#ec74b1"][i] : "#faac68";
    g.beginPath();g.arc(x,436,38+110*u,0,Math.PI*2);g.stroke();g.restore();
  }
}
