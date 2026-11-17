import { defineNodeScript } from '/vendor/flamo-runtime/index.js';
import { mountDevice } from './device';
export default defineNodeScript({ setup(props, ctx) { return mountDevice(ctx, props, {"kind": "plough", "parts": ["94:101201", "94:101199", "94:101200"]}); } });
