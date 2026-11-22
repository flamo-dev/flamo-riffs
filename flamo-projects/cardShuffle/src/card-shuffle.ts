import { defineNodeScript } from '/vendor/flamo-runtime/index.es.js';

// The five designs repeat in the lower half of the imported stack. The final
// Focus pose is the visual seam back to the initial Focus pose.
const cards = ['1:1223', '1:1211', '1:1199', '1:1187', '1:1175', '1:1163'];
const stops = [0, 1600, 3100, 4600, 6100, 7600];
type Point = { x: number; y: number };
type Matrix = { m00: number; m01: number; m02: number; m10: number; m11: number; m12: number };

export default defineNodeScript({
  setup(_props, ctx) {
    const canvas = ctx.instance.canvas;
    const motion = ctx.figmaMotion, frame = ctx.sourceNodeId;
    if (!canvas || typeof motion.seek !== 'function') return;
    const travel = cards.slice(0, -1).map(id => ctx.figmaMotionTracks(id).find(t => t.field === 'MOTION_TRANSLATION_X'));
    if (travel.some(track => !track)) return;
    type Gesture = {
      pointer: number; index: number; start: Point; origin: number; time: number;
      dx: number; dy: number; version: number; matrix: Matrix; size: Point;
    };
    let held: Gesture | undefined;
    let settling: { gesture: Gesture; from: number; to: number; dx: number; dy: number; endX: number; start: number; duration: number } | undefined;
    let version = 0, disposed = false;
    const world = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return ctx.camera.screenToWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    function hit(point: Point, m: Matrix, size: Point) {
      const det = m.m00 * m.m11 - m.m01 * m.m10;
      if (Math.abs(det) < 1e-8) return false;
      const x = point.x - m.m02, y = point.y - m.m12;
      const u = (m.m11*x - m.m01*y)/det, v = (m.m00*y - m.m10*x)/det;
      return u >= 0 && u <= size.x && v >= 0 && v <= size.y;
    }
    function releasePointer() {
      const g = held;
      held = undefined;
      if (g && canvas!.hasPointerCapture(g.pointer)) canvas!.releasePointerCapture(g.pointer);
    }
    const off = motion.subscribe(frame, state => {
      if (state.status === 'playing' || state.status === 'unavailable') {
        version++; settling = undefined; releasePointer();
      }
    });
    // The original timeline owns the stack, shadows and dots. Only the card
    // under the finger gets a temporary signed drag offset.
    async function draw(g: Gesture, time: number, dx: number, dy: number, nativeOnly = false) {
      const tick = ++g.version;
      const generation = version;
      g.time = time;
      await motion.seek(frame, time);
      if (disposed || nativeOnly || generation !== version || tick !== g.version || motion.getState(frame).status === 'playing') return;
      const m = g.matrix, r = Math.max(-1, Math.min(1, dx / g.size.x)) * 0.34;
      const c = Math.cos(r), s = Math.sin(r);
      const m00=c*m.m00-s*m.m10, m01=c*m.m01-s*m.m11;
      const m10=s*m.m00+c*m.m10, m11=s*m.m01+c*m.m11;
      ctx.node(cards[g.index])?.set('TransformCpt.transform', {
        m00,m01,m10,m11,
        m02:m.m02+dx+(m.m00-m00)*g.size.x/2+(m.m01-m01)*g.size.y/2,
        m12:m.m12+dy+(m.m10-m10)*g.size.x/2+(m.m11-m11)*g.size.y/2,
      });
    }
    function down(e: PointerEvent) {
      if (held || !e.isPrimary || e.button !== 0) return;
      const state = motion.getState(frame);
      if (state.status === 'unavailable') return;
      const pt = world(e);
      const i = cards.findIndex(id => {
        const n = ctx.probe(id);
        return !!n && n.visible !== false && (n.opacity ?? 1) > 0.08 && hit(pt, n.worldTransform ?? n.transform, n.size);
      });
      if (i < 0) return;
      const index = i % (cards.length - 1);
      // A narrow exposed edge of a rear card is not a request to skip the deck.
      if (i > 0 && state.timeMs < stops[i-1]) return;
      const previous = i > 0 && ctx.probe(cards[i-1]);
      if (previous && (previous.opacity ?? 1)>0.95 && Math.abs(travel[i-1]!.sample(state.timeMs)[0])<80) return;
      const n = ctx.probe(cards[i])!;
      version++; settling=undefined;
      motion.pause(frame);
      const origin = i === cards.length-1 ? 0 : Math.min(state.timeMs, stops[index+1]);
      held = { pointer:e.pointerId,index,start:pt,origin,time:origin,dx:0,dy:0,version:0,matrix:{...n.transform},size:{...n.size} };
      if (i === cards.length-1) void draw(held, 0, 0, 0, true);
      canvas!.setPointerCapture(e.pointerId);
      e.stopImmediatePropagation();
      e.preventDefault();
    }
    function move(e: PointerEvent) {
      const g = held;
      if (!g || g.pointer !== e.pointerId) return;
      e.stopImmediatePropagation();
      const p = world(e);
      g.dx = p.x-g.start.x; g.dy = (p.y-g.start.y)*0.35;
      if (Math.abs(g.dx) < 2 && g.time === g.origin) return;
      const track = travel[g.index]!;
      const target = track.sample(g.origin)[0] + Math.abs(g.dx);
      // Invert the outgoing part of the authored curve so the stack advances
      // by distance while the front card stays attached to the pointer.
      let lo=g.origin, hi=stops[g.index+1];
      for (let j=0;j<16;j++) {
        const mid=(lo+hi)/2;
        if (track.sample(mid)[0] < target) lo=mid; else hi=mid;
      }
      void draw(g,(lo+hi)/2,g.dx,g.dy);
    }
    function finish(e: PointerEvent, cancel: boolean) {
      const g = held;
      if (!g || g.pointer !== e.pointerId) return;
      e.stopImmediatePropagation();
      releasePointer();
      if (g.time===g.origin && g.dx===0) return;
      const advance = !cancel && Math.abs(g.dx) >= g.size.x/8;
      settling={gesture:g,from:g.time,to:advance?stops[g.index+1]:g.origin,dx:g.dx,dy:g.dy,
        endX:advance?Math.sign(g.dx)*Math.max(Math.abs(g.dx),travel[g.index]!.sample(stops[g.index+1])[0]-travel[g.index]!.sample(g.origin)[0]):0,
        start:performance.now(),duration:advance?280:190};
    }
    const up=(e: PointerEvent)=>finish(e,false), cancel=(e: PointerEvent)=>finish(e,true);
    canvas.addEventListener('pointerdown',down,true);
    canvas.addEventListener('pointermove',move,true);
    canvas.addEventListener('pointerup',up,true);
    canvas.addEventListener('pointercancel',cancel,true);
    canvas.addEventListener('lostpointercapture',cancel,true);
    const stop=ctx.onUpdate(()=>{
      const a=settling;
      if (!a) return;
      const t=Math.min(1,(performance.now()-a.start)/a.duration), k=1-(1-t)**3;
      if(t===1) settling=undefined;
      void draw(a.gesture,a.from+(a.to-a.from)*k,a.dx+(a.endX-a.dx)*k,a.dy*(1-k),t===1);
    });
    ctx.dispose(()=>{
      disposed=true; version++; settling=undefined; releasePointer(); off(); stop();
      canvas.removeEventListener('pointerdown',down,true);
      canvas.removeEventListener('pointermove',move,true);
      canvas.removeEventListener('pointerup',up,true);
      canvas.removeEventListener('pointercancel',cancel,true);
      canvas.removeEventListener('lostpointercapture',cancel,true);
    });
  },
});

