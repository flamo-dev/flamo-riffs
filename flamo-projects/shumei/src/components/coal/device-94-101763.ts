import { defineNodeScript } from '/vendor/flamo-runtime/index.js';
import { mountDevice } from './device';
export default defineNodeScript({ setup(props, ctx) { return mountDevice(ctx, props, {"kind": "tee", "on": ["241:320", "94:101760", "94:101759"], "off": ["94:101761", "241:319", "241:318"]}); } });
