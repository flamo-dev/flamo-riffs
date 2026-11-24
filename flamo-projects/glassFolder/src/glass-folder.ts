import { defineNodeScript } from '/vendor/flamo-runtime/index.es.js';

export default defineNodeScript({
  setup(_, ctx) {
    const motion = ctx.figmaMotion,
      frame = ctx.sourceNodeId,
      hit = '1:80';
    const ids = ['1:83', '1:86', '1:89'];
    const files = ids.map(id => ctx.node(id));

    const hoverStart = 765,
      hoverEnd = 1415;
    const expandStart = 2077.954,
      expandEnd = 2797.954;

    let goal: 'rest' | 'hover' | 'expanded' | 'away' = 'rest';
    let inside = false,
      full = false;
    let finish: number | undefined;
    let stopFlyout: (() => void) | undefined;

    // 演示用的脉冲与光标不参与交互命中。
    for (const id of ['1:103', '1:104']) ctx.node(id)?.setInteractive({ pointerEvents: 'none' });
    ctx.node('1:104')?.setVisible(false);

    function clearFlyout() {
      stopFlyout?.();
      stopFlyout = undefined;
      for (const file of files) {
        file?.setVisible(true);
        file?.setOpacity(1);
      }
    }

    function range(from: number, to: number) {
      finish = to;
      void motion.playRange(frame, from, to);
    }

    function travel() {
      const t = motion.getState(frame).timeMs;
      if (goal === 'away' || full) return;
      if (goal === 'expanded') {
        if (t < hoverEnd) range(Math.max(hoverStart, t), hoverEnd);
        else if (t < expandEnd) range(Math.max(expandStart, t), expandEnd);
      } else if (t > expandStart) {
        range(Math.min(expandEnd, t), expandStart);
      } else {
        const end = goal === 'hover' ? hoverEnd : hoverStart;
        const from = Math.max(hoverStart, Math.min(hoverEnd, t));
        if (from !== end) range(from, end);
        else {
          finish = undefined;
          void motion.seek(frame, end);
        }
      }
    }

    function explode() {
      goal = 'away';
      finish = undefined;
      motion.pause(frame);
      const starts = ids.map(id => ctx.probe(id)?.transform);
      const since = performance.now();
      stopFlyout = ctx.onUpdate(() => {
        const t = Math.min(1, (performance.now() - since) / 460);
        const k = 1 - (1 - t) ** 3;
        files.forEach((file, i) => {
          const m = starts[i];
          if (!file || !m) return;
          file.set('TransformCpt.transform', {
            ...m,
            m02: m.m02 + (i - 1) * 245 * k,
            m12: m.m12 - (380 - i * 55) * k,
          });
          file.setOpacity(1 - k);
          if (t === 1) file.setVisible(false);
        });
        if (t === 1) {
          stopFlyout?.();
          stopFlyout = undefined;
        }
      });
    }

    ctx.onNode(hit, 'pointerenter', () => {
      if (inside) return;
      inside = true;
      if (full) return;
      goal = 'hover';
      travel();
    });

    ctx.onNode(hit, 'pointerleave', () => {
      if (!inside) return;
      inside = false;
      if (full) return;
      const wasAway = goal === 'away';
      goal = 'rest';
      if (wasAway) {
        clearFlyout();
        void motion.seek(frame, hoverStart);
      } else travel();
    });

    ctx.onActivate(hit, () => {
      if (full || goal === 'away') return;
      if (goal === 'expanded') explode();
      else {
        goal = 'expanded';
        travel();
      }
    });

    const unsubscribe = motion.subscribe(frame, state => {
      if (state.playbackKind === 'full') {
        if (state.status === 'playing' && !full) {
          full = true;
          finish = undefined;
          goal = 'rest';
          clearFlyout();
        } else if (full && (state.status === 'ended' || state.status === 'paused')) {
          full = false;
          goal = inside ? 'hover' : 'rest';
          if (inside) range(hoverStart, hoverEnd);
          else void motion.seek(frame, hoverStart);
        }
      } else if (
        state.playbackKind === 'range' &&
        state.status === 'paused' &&
        finish !== undefined &&
        Math.abs(state.timeMs - finish) < 0.001
      ) {
        finish = undefined;
        if (
          (goal === 'expanded' && state.timeMs === hoverEnd) ||
          (goal === 'rest' && state.timeMs === expandStart)
        ) {
          travel();
        }
      }
    });

    ctx.dispose(() => {
      unsubscribe();
      stopFlyout?.();
    });
  },
});
