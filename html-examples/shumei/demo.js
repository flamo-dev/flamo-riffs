import { sampleInterval } from '../common/demo-screen.js';
import { bindCoalSlots, updateCoalSlots } from './coal-slots.js';
import './flamo-coal-system-web-component/dist/flamo-coal-system.js';

const belts = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B', '6C', '6D'];
const alarmTypes = ['PDSLBJ', 'PDDMBJ', 'PDPPBJ', 'PDYHBJ', 'RYRQBJ'];
const robotReadings = {
  DL: 4, DY: 48, DCWD: 28, DJ1WD: 38, DJ2WD: 39, HJWD: 23, HJSD: 53,
  'PM2.5Z': 14, PM10Z: 29, PM100Z: 42, JWND: 0.12, YQND: 20.8,
  AQND: 1.6, LHQND: 0.3, EYHTND: 440, YYHTND: 2.4,
};

// Keys below address artwork in the exported diagram. Each sample is built locally.
function sample(step) {
  const values = {};
  const lane = step % 4 < 2 ? 'A' : 'B';
  const outlet = 'ABCD'[step % 4];
  const bin = 'ABCDEF'[step % 6];
  const wave = (phase, base, amplitude) => base + amplitude * Math.sin(step * 0.47 + phase);
  for (const [i, belt] of belts.entries()) {
    const running = belt[1] === (belt[0] === '6' ? outlet : lane);
    values[`YXZT_${belt}PDYX`] = running;
    values[`DJDL_${belt}PDDJDL`] = running ? wave(i, 64, 8) : 0;
    for (const [j, alarm] of alarmTypes.entries()) {
      values[`#${belt}PDBJ_${alarm}`] = i === step % belts.length && j === step % alarmTypes.length;
    }
  }
  for (const side of 'AB') {
    const active = side === lane;
    for (const feeder of [1, 2]) {
      values[`GMJ_1${side}PD#${feeder}GMJWZ`] = wave(feeder, 26, 24);
      values[`GMJ_1${side}PD#${feeder}GMJYX`] = active;
    }
    values[`PDTBSSZZ_1${side}WZ1SC`] = active;
    values[`PDTBSSZZ_1${side}WZ2SH`] = !active;
    for (const stage of [1, 2, 3]) {
      for (const next of 'AB') {
        values[`LM_${stage}${side}PDLMZ${stage + 1}${next}PD`] = active && next === side;
      }
      if (stage > 1) values[`ST_${stage}${side}ST`] = { left: active && side === 'A', right: active && side === 'B' };
    }
    values[`YXZT_${side}GZSYX`] = active;
    values[`YXZT_${side}SMJYX`] = active;
    values[`LM_4${side}PDLMZ${side}GZS`] = active;
    values[`LM_${side}GZSLMZ${side}SMJ`] = active;
    values[`LM_${side}SMJLMZ5${side}PD`] = active;
    values[`LM_${side}GZSLMZ5${side}PD`] = false;
    for (const next of 'ABCD') {
      const feeding = active && next === outlet;
      values[`LM_5${side}PDLMZ6${next}PD`] = feeding;
      if (next !== 'A') setPlough(`5${side}PD6${next}`, feeding);
    }
  }
  function setPlough(name, lowered) {
    const id = `LMQ_${name}LMQ`;
    values[id] = lowered;
    values[id + 'LDW'] = lowered;
    values[id + 'TDW'] = !lowered;
  }
  for (const [i, side] of Array.from('ABCD').entries()) {
    const bank = i < 2 ? 1 : 2;
    for (const letter of 'ABCDEF') {
      const feeding = outlet === side && letter === bin;
      values[`LM_6${side}PDLMZ${bank}${letter}YMC`] = feeding;
      if (letter !== 'A') setPlough(`6${side}PD${letter}`, feeding);
      values[`YMCLW_${bank}${letter}YMCLW`] = wave(bank + letter.charCodeAt(0), 8, 3);
    }
  }
  values.SW_XFGWSX = wave(0, 1.25, 0.45);
  values.JQR_YXZT = step % 5 !== 4;
  values.JQR_CWBJ = step % 11 === 7;
  values.JQR_GZBJ = step % 13 === 9;
  values.JQR_DCDL = 94 - step % 37;
  values.JQR_LJLC = 1200 + step;
  for (const [i, [name, base]] of Object.entries(robotReadings).entries()) {
    values['JQR_' + name] = wave(i, base, base * 0.04);
  }
  return values;
}

const diagram = document.querySelector('flamo-coal-system');
const slots = bindCoalSlots(diagram);
let step = 0;
let timer;
let drawing = false;

async function render() {
  if (drawing || diagram.dataset.flamoState !== 'ready') return;
  drawing = true;
  try {
    const values = sample(step++);
    await diagram.applyPointValues(Object.entries(values).map(([id, value]) => ({ id, value })));
    updateCoalSlots(slots, values);
  } finally {
    drawing = false;
  }
}
function start() {
  if (timer || diagram.dataset.flamoState !== 'ready') return;
  render();
  timer = setInterval(render, sampleInterval);
}
function stop() {
  clearInterval(timer);
  timer = undefined;
}
diagram.addEventListener('flamo-ready', start);
diagram.addEventListener('flamo-disconnected', stop);
window.addEventListener('pagehide', stop);
window.addEventListener('pageshow', start);
start();
