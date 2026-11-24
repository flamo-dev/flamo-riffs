# Motion folder

Use `bindMotionFolder` on the frame that owns the Figma Motion timeline. The hit area stays in place while the item layers move. Choose two ordered moving intervals on the timeline for the lift and spread. The helper skips the hold between them and reverses from the current playhead on pointer leave.

The [Glass Folder demo](https://riffs.flamo.dev/glass-folder/) uses Nastaran Jamali’s Figma design. The mouse interaction was added using WorkBuddy, DeepSeek and Flamo. Its project-specific bindings are shown below.

```ts
import { defineNodeScript } from '/vendor/flamo-runtime/index.es.js';
import { bindMotionFolder } from '@flamo/interaction-library/base';

export default defineNodeScript({
  setup(_, ctx) {
    for (const id of ['1:103', '1:104']) {
      ctx.node(id)?.setInteractive({ pointerEvents: 'none' });
    }
    ctx.node('1:104')?.setVisible(false);
    bindMotionFolder(ctx, {
      hit: '1:80',
      hover: [765, 1415],
      expand: [2077.954, 2797.954],
      flyoutMs: 460,
      items: [
        { id: '1:83', dx: -245, dy: -380 },
        { id: '1:86', dx: 0, dy: -325 },
        { id: '1:89', dx: 245, dy: -270 },
      ],
    });
  },
});
```

For another design, bind its own hit area and item IDs. Specify motion ranges and flight duration in milliseconds. Each offset is measured in the item’s parent coordinates. Keep decorative cursors and pulses out of hit testing.

In Preview, hover and leave halfway through the lift, then hover again. Click once to spread the items. Click again while they are still spreading to see them fly from their current rendered poses. Leaving restores the items and rearms the gesture. During full timeline playback, the timeline owns the frame until it ends or is paused.
