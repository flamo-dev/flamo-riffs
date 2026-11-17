import { defineNodeScript } from '/vendor/flamo-runtime/index.js';
import { mountDevice } from './device';
export default defineNodeScript({ setup(props, ctx) { return mountDevice(ctx, props, {"kind": "feeder", "on": ["225:1068", "225:1086"], "off": ["225:1064", "225:1087"], "bars": ["334:338", "334:361"]}); } });
