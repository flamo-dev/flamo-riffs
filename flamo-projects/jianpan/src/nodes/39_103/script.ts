import { defineNodeScript } from '/vendor/flamo-runtime/index.es.js';

// Exact names from annotation-83196c71c9844925. IDs live only in artifact roles.
const properties = [
  "ltzq1Show",
  "ltzs1Show",
  "ltzs2zShow",
  "ltzs2yShow",
  "ltzs3Show",
  "ltzs4Show",
  "ltzf1Show",
  "ltzf2Show",
  "ltzf3Show",
  "ltzf4Show",
  "ltzy1Show",
  "ltzy2Show",
  "ltzy3Show"
] as const;
type Props = { [K in typeof properties[number]]: boolean };

export default defineNodeScript<Props>({
  setup(props, ctx) {
    // Resolve all roles before any mutation, so a broken mapping fails atomically.
    const targets = properties.map(property => {
      const handle = ctx.role(property);
      if (!handle) throw new Error('Jianpan2 visibility role missing: ' + property);
      return { property, handle, previous: handle.get('NodeCpt.visible') };
    });
    for (const { property, handle, previous } of targets) {
      const apply = (value: unknown) => {
        if (typeof value === 'boolean') handle.setVisible(value);
      };
      apply(props[property]);
      const stop = ctx.watch(() => props[property], apply);
      ctx.dispose(() => {
        stop();
        if (typeof previous === 'boolean') handle.setVisible(previous);
      });
    }
  },
});
