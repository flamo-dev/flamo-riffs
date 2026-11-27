import { defineNodeScript } from '/vendor/flamo-runtime/index.es.js';
import { CLIP_SECONDS, renderMusic } from './night-window';

export default defineNodeScript({
  setup(_, ctx) {
    const frame = ctx.sourceNodeId;
    const motion = ctx.figmaMotion;
    const button = '1424823338:2';
    const playGlyph = ctx.node('1:657');
    const stopGlyph = ctx.node('1424823338:1');
    ctx.node(button)?.setInteractive({ mode: 'enabled', pointerEvents: 'box-only', hitTestWhenTransparent: true, cursor: 'pointer' });

    // The original timers use one styled text layer per second, animated in
    // opacity. Keep their existing positions, typography and transitions.
    const labels = (group: string) => ctx.mounted.children(group)?.children.map(child => child.entity) ?? [];
    const elapsedLabels = labels('1:706');
    const remainingLabels = labels('1:696');
    // Live browser text takes a solid ink. Sample the leading stop of the
    // original gradient before replacing the imported glyph cache.
    for (const label of [...elapsedLabels, ...remainingLabels]) {
      const ink = label.design().appearance?.fills?.[0]?.stops?.[0]?.color;
      if (ink) {
        label.setFill([{ kind: 'solid', visible: true, opacity: 1, blendMode: 'NORMAL', color: ink }]);
        label.setTextStyle({ color: ink });
      }
    }
    let lastSecond = -1;
    function displayTime(second: number) {
      if (second === lastSecond) return;
      lastSecond = second;
      const clock = (s: number) => '0:' + String(s).padStart(2, '0');
      for (const label of elapsedLabels) label.setText(clock(second), { preserveStyle: true });
      for (const label of remainingLabels) label.setText('-' + clock(CLIP_SECONDS - second), { preserveStyle: true });
    }

    let audio: AudioContext | undefined;
    let rendered: Promise<AudioBuffer> | undefined;
    let voice: AudioBufferSourceNode | undefined;
    let began = 0;
    let active = false;
    let version = 0;
    let disposed = false;
    let syncing = false;

    function glyph(playing: boolean) {
      playGlyph?.setVisible(!playing);
      stopGlyph?.setVisible(playing);
    }

    function silence() {
      if (!voice) return;
      voice.onended = null;
      voice.stop();
      voice.disconnect();
      voice = undefined;
    }
    function reset() {
      version++;
      active = false;
      silence();
      motion.pause(frame);
      void motion.seek(frame, 0);
      displayTime(0);
      glyph(false);
    }

    function followAudio(force = false) {
      if (!voice || !audio || syncing) return;
      const seconds = Math.max(0, audio.currentTime - began);
      if (seconds >= CLIP_SECONDS) { reset(); return; }
      displayTime(Math.floor(seconds));
      const state = motion.getState(frame);
      if (!state.durationMs) return;
      // Replay each authored turn at its original speed. The audio device
      // supplies absolute time, including after a tab has been suspended.
      const time = (seconds * 1000) % state.durationMs;
      if (!force && state.status === 'playing' && Math.abs(state.timeMs - time) < 250) return;
      syncing = true;
      const generation = version;
      void motion.playRange(frame, time, state.durationMs).catch(error => {
        if (version === generation && !disposed) {
          reset();
          console.error('Love Trip animation:', error);
        }
      }).finally(() => { syncing = false; });
    }

    function toggle() {
      if (active) { reset(); return; }
      const generation = ++version;
      active = true;
      glyph(true);
      void (async () => {
        try {
          audio ??= new AudioContext();
          // Request sound in the physical activation, before any awaits.
          const unlocked = audio.resume();
          rendered ??= renderMusic();
          const [, buffer] = await Promise.all([unlocked, rendered]);
          if (disposed || generation !== version) return;
          voice = audio.createBufferSource();
          voice.buffer = buffer;
          voice.connect(audio.destination);
          voice.onended = () => { if (version === generation && !disposed) reset(); };
          began = audio.currentTime;
          voice.start(began);
          followAudio(true);
        } catch (error) {
          if (version === generation && !disposed) {
            rendered = undefined;
            reset();
            console.error('Love Trip audio:', error);
          }
        }
      })();
    }

    displayTime(0);
    glyph(false);
    const off = ctx.onActivate(button, toggle);
    const transport = motion.subscribe(frame, state => {
      // The Preview toolbar shares the same transport as the physical button.
      if (disposed || syncing) return;
      if (!active && state.status === 'playing' && state.playbackKind === 'full') toggle();
      else if (active && voice && state.status === 'paused') reset();
    });
    const update = ctx.onUpdate(() => followAudio());
    return { dispose() {
      disposed = true;
      version++;
      off();
      update();
      transport();
      silence();
      if (audio) void audio.close();
    } };
  },
});
