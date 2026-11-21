import { defineNodeScript } from "/vendor/flamo-runtime/index.es.js";
import { dropTracks } from "./counter-motion";
import { BOARD, centers, LEVER, idleDigits, layer, drawLabels, drawLever, drawReel, makeConfetti, drawCelebration } from "./counter-machine";

function pick(n: number) { return Math.floor(Math.random() * n); }
function match(values: number[]) {
  const counts = Array(10).fill(0);
  for (const n of values) counts[n]++;
  const count = Math.max(...counts);
  const symbol = counts.indexOf(count);
  return { tier: count === 4 ? "jackpot" : count === 3 ? "triple" : "none",
    hits: count >= 3 ? values.flatMap((n,i) => n === symbol ? [i] : []) : [] };
}

// A quick arcade round: 75% ordinary, 20% three of a kind, 5% four of a kind.
// Choose exact matches, including nonadjacent triples. The final four digits are scored independently.
function drawResult() {
  const roll = Math.random();
  if (roll >= .75) {
    const n = pick(10);
    const numbers = [n,n,n,n];
    if (roll < .95) numbers[pick(4)] = (n + 1 + pick(9)) % 10;
    return numbers;
  }
  const numbers: number[] = [];
  for (let i=0; i<4; i++) {
    const allowed = Array.from({length:10},(_,j)=>j).filter(n=>numbers.filter(v=>v===n).length<2);
    numbers.push(allowed[pick(allowed.length)]);
  }
  return numbers;
}

// Retiming preserves the imported overshoot, recoil and settle instead of applying a new easing curve.
function travel(track: number[][], progress: number) {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;
  const last=track[track.length-1];
  const time=last[0]*progress;
  const right=track.findIndex(key=>key[0]>=time);
  const [t0,y0]=track[right-1], [t1,y1]=track[right];
  return (y0+(y1-y0)*(time-t0)/(t1-t0))/last[1];
}

export default defineNodeScript({
  setup(_props, ctx) {
    const canvas = ctx.instance.canvas;
    if (!canvas) return;
    // Hide just the imported question and number layers while this game is mounted.
    const source = [...Array.from({length:18},(_,i)=>2747+i),...Array.from({length:17},(_,i)=>2768+i),2786,2791]
      .map(id=>ctx.node("1:"+id)).filter(Boolean);
    const visibility = source.map(node=>node.design().compositing?.visible ?? true);
    source.forEach(n=>n.setVisible(false));
    ctx.dispose(()=>source.forEach((n,i)=>n.setVisible(visibility[i])));

    const labels = layer(ctx,"scoreboard",0,0,BOARD.width,BOARD.height,1.3);
    const reels = centers.map((x,i)=>layer(ctx,"reel-" + (i+1),x-95,289,190,300,1.75));
    const lever = layer(ctx,"lever",LEVER.x-95,195,190,415,1.8);
    const effects = layer(ctx,"celebration",0,0,BOARD.width,BOARD.height);
    const durations = [1.18,1.43,1.69,1.98];
    let values = idleDigits.slice();
    let round: null | { start: number; from: number[]; result: number[]; steps: number[]; landed: boolean[] } = null;
    let spins=0, wins=0, pull=0, pointer: number | null=null, startY=0;
    let ignoredPointer: number | null=null;
    let triggered=false;
    let returnStart=-1, returnFrom=0, keyStart=-1, fxStart=-1;
    let particles: ReturnType<typeof makeConfetti> = [];
    let outcome = { tier:"ready", hits:[] as number[] };
    let message="下拉摇杆，试试手气";
    let active = true, originalMode = false;
    let repaintTime = -1;

    const clock=()=>performance.now()/1000;
    function paintLever() { lever.paint(g=>drawLever(g,pull,pull>=.62,!!round)); }
    function paintLabels() { labels.paint(g=>drawLabels(g,spins,wins,message,outcome.tier)); }
    function paintReel(i:number,phase:number,landed:boolean) {
      reels[i].paint(g=>drawReel(g,phase,i<2,landed,outcome.hits.includes(i),outcome.tier==="jackpot"));
    }
    function beginReturn(now:number) { returnFrom=pull; returnStart=now; }
    function releaseCapture() {
      const id = pointer; pointer=null;
      if (id!==null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    }
    function startSpin(now:number) {
      if (round) return;
      const target=drawResult();
      const steps=target.map((digit,i)=>10+(digit-values[i]+10)%10);
      round={start:now,from:values.slice(),result:target,steps,landed:[false,false,false,false]};
      outcome={tier:"spinning",hits:[]};
      spins++;message="转轴落数中…";
      if (fxStart>=0) effects.paint(()=>{});
      fxStart=-1;
      paintLabels();reels.forEach((_,i)=>paintReel(i,values[i],false));paintLever();
      ctx.trace("counter.spin",{spin:spins});
    }
    function finish(now:number) {
      values=round!.result;round=null;
      outcome=match(values);
      if (outcome.tier==="none") message="未命中，再拉一次";
      else {
        wins++;
        const jackpot=outcome.tier==="jackpot";
        message=jackpot ? "四同头奖！" : "三同获胜！";
        particles=makeConfetti(outcome.hits.map(i=>centers[i]),jackpot);
        fxStart=now;
      }
      paintLabels();paintLever();values.forEach((n,i)=>paintReel(i,n,true));
      live.textContent=values.join("，")+"。"+message;
      ctx.trace("counter.result",{spin:spins,digits:values.slice(),tier:outcome.tier,hits:outcome.hits.slice(),wins});
    }

    // Flamo camera coordinates stay correct in both the fitted preview and a transformed host.
    function point(e:PointerEvent) {
      const rect=canvas.getBoundingClientRect();
      const p=ctx.camera.screenToWorld({x:e.clientX-rect.left,y:e.clientY-rect.top});
      const m=ctx.probe()?.worldTransform;
      if (!m) return {x:p.x/2,y:p.y/2};
      const det=m.m00*m.m11-m.m01*m.m10;
      const x=p.x-m.m02,y=p.y-m.m12;
      return {x:(m.m11*x-m.m01*y)/(2*det),y:(-m.m10*x+m.m00*y)/(2*det)};
    }
    const hit=(p:{x:number;y:number})=>Math.hypot(p.x-LEVER.x,p.y-(LEVER.top+pull*LEVER.travel))<=55;
    // At window capture, a Web Component retargets canvas events to its host.
    function startsOnCanvas(e: PointerEvent) {
      return e.composedPath()[0] === canvas;
    }
    function onDown(e:PointerEvent) {
      if (originalMode || !startsOnCanvas(e) || !e.isPrimary || e.button!==0 || pointer!==null) return;
      const p=point(e);
      if (Math.abs(p.x-LEVER.x)>75 || p.y<205 || p.y>590) return;
      e.stopImmediatePropagation();e.preventDefault();
      if(round || keyStart>=0 || !hit(p)) {
        ignoredPointer=e.pointerId;canvas.setPointerCapture(e.pointerId);return;
      }
      triggered=false;pointer=e.pointerId;startY=p.y-pull*LEVER.travel;returnStart=-1;
      canvas.setPointerCapture(e.pointerId);canvas.style.cursor="grabbing";
      canvas.focus({preventScroll:true});e.preventDefault();
    }
    function onMove(e:PointerEvent) {
      if(e.pointerId===ignoredPointer) {e.stopImmediatePropagation();return;}
      if (pointer!==e.pointerId) {
        if (!originalMode && pointer===null && startsOnCanvas(e) && !round && hit(point(e))) {
          e.stopImmediatePropagation();canvas.style.cursor="grab";
        } else if (canvas.style.cursor==="grab") canvas.style.cursor=oldCursor;
        return;
      }
      e.stopImmediatePropagation();
      pull=Math.min(1,Math.max(0,(point(e).y-startY)/LEVER.travel));paintLever();
      if (!triggered && pull >= .62) { triggered=true;startSpin(clock()); }
      e.preventDefault();
    }
    function onEnd(e:PointerEvent) {
      if(e.pointerId===ignoredPointer) {
        ignoredPointer=null;e.stopImmediatePropagation();
        if(canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
        return;
      }
      if (pointer!==e.pointerId) return;
      e.stopImmediatePropagation();
      if(e.type==="pointerup") onMove(e);
      if(pointer===e.pointerId) {releaseCapture();beginReturn(clock());}
      canvas.style.cursor=oldCursor;
    }
    function onKey(e:KeyboardEvent) {
      if(e.code!=="Space" && e.key!=="Enter") return;
      e.preventDefault();
      if(originalMode) {showOriginal(false);return;}
      if(e.repeat || round || pointer!==null || keyStart>=0) return;
      returnStart=-1;keyStart=clock();
    }

    const oldCursor=canvas.style.cursor, oldTouch=canvas.style.touchAction;
    const oldTab=canvas.getAttribute("tabindex"), oldLabel=canvas.getAttribute("aria-label");
    canvas.style.touchAction="none";canvas.tabIndex=0;
    canvas.setAttribute("aria-label","Counter Drop 四位老虎机。向下拉动橙色摇杆，或按空格、回车开始。三个相同获胜，四个相同获头奖。");
    const live=document.createElement("span");
    live.setAttribute("role","status");live.setAttribute("aria-live","polite");
    Object.assign(live.style,{position:"absolute",width:"1px",height:"1px",overflow:"hidden",clipPath:"inset(50%)"});
    canvas.insertAdjacentElement("afterend",live);
    const events=new AbortController(), options={signal:events.signal};
    // Claim only lever gestures before Preview's camera starts panning the canvas.
    const pointerOptions={...options,capture:true,passive:false};
    window.addEventListener("pointerdown",onDown,pointerOptions);
    window.addEventListener("pointermove",onMove,pointerOptions);
    for(const event of ["pointerup","pointercancel","lostpointercapture"]) window.addEventListener(event,onEnd,pointerOptions);
    canvas.addEventListener("keydown",onKey,options);
    const cancelGesture=()=>{if(pointer!==null){releaseCapture();beginReturn(clock());}canvas.style.cursor=oldCursor;};
    window.addEventListener("blur",cancelGesture,options);

    // The standard Flamo Motion control still opens the unmodified imported sequence.
    // Keep both paths usable when a preview mounts its transport after script setup.
    const back=document.createElement("button");
    back.type="button";back.textContent="返回游戏";back.setAttribute("aria-label","返回 Counter Drop 游戏");
    const layers=[labels,lever,...reels,effects];
    let transport: HTMLButtonElement | null=null;
    function showOriginal(show:boolean, controls?:HTMLElement) {
      if(!show && originalMode && transport && /暂停|pause|Ⅱ|⏸/i.test(transport.title+" "+transport.textContent)) transport.click();
      originalMode=show;
      source.forEach((n,i)=>n.setVisible(show && visibility[i]));
      layers.forEach(layer=>layer.node.setVisible(!show));
      if(show && controls) {
        cancelGesture();
        transport=controls.querySelector("button");
        if(transport) back.style.cssText=transport.style.cssText;
        controls.prepend(back);
      } else {back.remove();canvas.focus({preventScroll:true});}
    }
    back.addEventListener("click",()=>showOriginal(false),options);
    canvas.parentElement?.addEventListener("click",e=>{
      const button=(e.target as Element)?.closest("button");
      const controls=button?.closest<HTMLElement>("[data-flamo-motion-controls]");
      if(controls && button!==back && !originalMode) showOriginal(true,controls);
    },{...options,capture:true});
    ctx.dispose(()=>{
      active=false;events.abort();releaseCapture();live.remove();back.remove();
      canvas.style.cursor=oldCursor;canvas.style.touchAction=oldTouch;
      if(oldTab===null) canvas.removeAttribute("tabindex");else canvas.setAttribute("tabindex",oldTab);
      if(oldLabel===null) canvas.removeAttribute("aria-label");else canvas.setAttribute("aria-label",oldLabel);
    });
    paintLabels();paintLever();values.forEach((n,i)=>paintReel(i,n,false));
    ctx.onUpdate(()=>{
      if (!active || (!round && returnStart<0 && keyStart<0 && fxStart<0)) return;
      const now=clock();
      if(now-repaintTime<1/50) return;
      repaintTime=now;
      if(keyStart>=0) {
        pull=Math.min(1,(now-keyStart)/.18);paintLever();
        if(pull>=1) {keyStart=-1;startSpin(now);beginReturn(now);}
      }
      if(returnStart>=0) {
        const u=Math.min(1,(now-returnStart)/.42);
        pull=returnFrom*(1-u)*(1-u);paintLever();if(u>=1)returnStart=-1;
      }
      if(round) {
        const spin=round;
        for(let i=0;i<4;i++) {
          if(spin.landed[i]) continue;
          const u=Math.min(1,Math.max(0,(now-spin.start-i*.07)/durations[i]));
          spin.landed[i]=u>=1;
          paintReel(i,spin.from[i]+spin.steps[i]*travel(dropTracks[i%2],u),spin.landed[i]);
        }
        if(spin.landed.every(Boolean)) finish(now);
      }
      if(fxStart>=0) {
        const t=now-fxStart, jackpot=outcome.tier==="jackpot";
        if(t>(jackpot ? 3.25 : 1.65)) {effects.paint(()=>{});fxStart=-1;}
        else effects.paint(g=>drawCelebration(g,t,particles,jackpot,outcome.hits.map(i=>centers[i])));
      }
    });
  },
});
