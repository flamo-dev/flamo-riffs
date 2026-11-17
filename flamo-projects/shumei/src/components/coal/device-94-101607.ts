import { defineNodeScript } from '/vendor/flamo-runtime/index.js';
import { mountDevice } from './device';
export default defineNodeScript({ setup(props, ctx) { return mountDevice(ctx, props, {"kind": "motor", "on": ["307:482"], "off": ["307:458"]}); } });
