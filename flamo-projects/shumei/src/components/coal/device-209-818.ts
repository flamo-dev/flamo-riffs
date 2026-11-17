import { defineNodeScript } from '/vendor/flamo-runtime/index.js';
import { mountDevice } from './device';
export default defineNodeScript({ setup(props, ctx) { return mountDevice(ctx, props, {"kind": "crusher", "on": ["339:389"], "off": ["339:378"]}); } });
