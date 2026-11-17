import { slotStyles } from './robot-template.js';

const hostStyles = `
[data-coal-slot] {box-sizing:border-box;font-family:"Microsoft YaHei",sans-serif}
.robot-panel{--robot-reading-font-size:13px}
.robot-panel .robot-bg{width:97%;height:42%;padding:6px 2px}
.robot-panel .robot-bg::before{height:4px}
.robot-panel .robot-bg::after{width:4px}
.robot-panel .robot-bg .bg-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(9,minmax(0,1fr));gap:2px 12px}
.robot-panel .robot-bg .bg-grid .kcard{min-width:0;gap:2px;padding:2px 1px;line-height:18px}
.robot-panel .robot-bg .bg-grid .kcard .k-ico{display:flex;align-items:center;justify-content:center;width:8px;height:8px;flex-basis:8px;line-height:0}
.robot-panel .robot-bg .bg-grid .kcard .k-ico svg{display:block;width:8px;height:8px}
.robot-panel .robot-bg .bg-grid .kcard .k-name{min-width:max-content;font-size:var(--robot-reading-font-size);letter-spacing:0;overflow:visible;text-overflow:clip}
.robot-panel .robot-bg .bg-grid .kcard .k-val{min-width:0;margin-left:auto;font-size:var(--robot-reading-font-size);height:18px;line-height:18px;align-items:baseline;justify-content:flex-end;text-align:right;white-space:nowrap}
/* Keep each reading and its unit together against the cell's right edge. */
.robot-panel .robot-bg .bg-grid .kcard .k-val [data-value]{flex:0 0 auto;min-width:0;text-align:right}
.robot-panel .robot-bg .bg-grid .kcard .k-val .u{flex:0 0 auto;min-width:0;font-size:inherit;margin-left:3px;text-align:right}
.robot-panel .robot-bg .bg-grid .kcard:has(.state-dot) .k-val{min-width:0;align-items:center}
.robot-panel .robot-bg .bg-grid .kcard .state-dot{width:10px;height:10px}
.robot-panel .panel-tag{font-size:15px}
.robot-panel .robot-foot{font-size:var(--robot-reading-font-size)}
.robot-panel[data-robot-state="running"] [data-robot-status]{color:#ff5757}
.coal-reading{width:100%;height:100%;display:flex;align-items:center;gap:4px;color:#09BAEB;font-size:15px;font-weight:700;line-height:18px;white-space:nowrap}
.coal-reading [data-value]{flex:1;min-width:0;text-align:center}
.coal-gauge{position:relative;width:10px;flex-shrink:0;height:100%;min-height:18px;border:1px solid #09BAEB;background:#07344a;overflow:hidden}
.coal-gauge-fill{position:absolute;inset:auto 0 0;background:linear-gradient(0deg,#057891,#09BAEB);height:0}
.coal-water{--water-light:#9af5ff;--water-mid:#0db5d5;--water-deep:#056680;position:relative;isolation:isolate;justify-content:center;padding:6px 0 0;filter:drop-shadow(2px 5px 3px #00152280)}
/* Elliptical rims and curved highlights give the tank a cylindrical profile. */
.coal-water::before{content:"";position:absolute;z-index:4;inset:0 0 auto;height:14px;border:1px solid #9addec;border-radius:50%;box-sizing:border-box;background:radial-gradient(ellipse at 50% 70%,#10394c 35%,#2b657b 75%,#78bece);box-shadow:inset 0 2px 2px #c5f8ff40,0 1px 1px #001a2d80}
.coal-water::after{content:"";position:absolute;z-index:3;inset:auto 0 0;height:14px;border:1px solid #74c6d9;border-top-color:transparent;border-radius:50%;box-sizing:border-box;pointer-events:none}
.coal-water .coal-gauge{position:absolute;inset:7px 0 0;width:auto;height:auto;min-height:0;border:1px solid #6fc7dc;border-top:0;border-radius:0 0 50% 50% / 0 0 7px 7px;background:linear-gradient(90deg,#092b40,#24586e 24%,#174459 53%,#08293e 92%,#275b6f);overflow:hidden;box-shadow:inset 2px 0 3px #b6f5ff24}
.coal-water .coal-gauge::after{content:"";position:absolute;z-index:2;inset:0;border-radius:inherit;background:linear-gradient(90deg,#00182735,transparent 12%,#d0fbff30 22%,#d0fbff0a 36%,transparent 50%,#00182745 88%,#a2efff20);pointer-events:none}
.coal-water .coal-gauge-fill{background:linear-gradient(90deg,#00374c55,#ffffff15 26%,transparent 50%,#00273966),linear-gradient(0deg,var(--water-deep),var(--water-mid));border-radius:0 0 50% 50% / 0 0 7px 7px;box-shadow:inset 0 -1px #82e4ee70}
.coal-water .coal-gauge-fill::before{content:"";position:absolute;inset:0 0 auto;height:14px;max-height:100%;border:1px solid var(--water-light);border-radius:50%;background:radial-gradient(ellipse at 40% 35%,var(--water-light),var(--water-mid) 80%);box-shadow:0 2px 3px #003e5550;box-sizing:border-box}
.coal-water [data-value]{position:relative;z-index:5;color:#effcff;text-shadow:0 1px 3px #002239,0 0 5px #002239}
.coal-reading[data-limit="high"] .coal-gauge-fill,.coal-reading[data-limit="low"] .coal-gauge-fill{background:#f3aa45}
.coal-water[data-limit="high"],.coal-water[data-limit="low"]{--water-light:#ffe0a3;--water-mid:#f3aa45;--water-deep:#996021}
.coal-water[data-limit="high"] .coal-gauge-fill,.coal-water[data-limit="low"] .coal-gauge-fill{background:linear-gradient(0deg,var(--water-deep),var(--water-mid))}
.coal-reading[data-limit="unknown"] .coal-gauge{border-style:dashed}
.coal-alarms{position:relative;width:100%;height:100%;color:#ffaf70;pointer-events:none}
.coal-alarms svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.coal-alarm-box{position:absolute;box-sizing:border-box;width:118px;min-height:28px;padding:7px 10px;border:1px solid #e97841;border-radius:7px;background:#281e24;box-shadow:0 0 9px #f9753420;font-size:14px;line-height:20px}
.coal-alarm-box span{display:block;white-space:nowrap}
.coal-alarm-box span[hidden],.coal-alarms[hidden]{display:none!important}
`;

// Slot mutations are observed and projected by the component. Even writing the
// same text/attribute can enqueue another projection, so only write real changes.
function setText(node, value) {
  if (node.textContent !== value) node.textContent = value;
}
function setAttribute(node, name, value) {
  if (node.getAttribute(name) !== value) node.setAttribute(name, value);
}
function setHidden(node, value) {
  if (node.hidden !== value) node.hidden = value;
}
function setStyle(node, name, value) {
  if (node.style[name] !== value) node.style[name] = value;
}

function positionAlarm(binding, rows) {
  if (binding.rowCount === rows) return;
  binding.rowCount = rows;
  const { box, polygon, viewBox, anchor } = binding;
  const { width: w, height: h } = viewBox;
  const [ax, ay] = anchor;
  const height = Math.max(28, 16 + rows * 20);
  const x = ax < w / 2 ? w - 126 : 8, y = ay < h / 2 ? h - height - 8 : 8;
  setStyle(box, 'left', `${x / w * 100}%`);
  setStyle(box, 'top', `${y / h * 100}%`);
  let points;
  if (Math.abs(ay / h - 0.5) > Math.abs(ax / w - 0.5)) {
    const bx = Math.max(x + 12, Math.min(x + 106, ax));
    const edge = ay < h / 2 ? y : y + height;
    points = `${bx - 6},${edge} ${ax},${ay} ${bx + 6},${edge}`;
  } else {
    const edge = ax < w / 2 ? x : x + 118;
    const join = Math.max(y + 12, Math.min(y + height - 12, ay));
    points = `${edge},${join - 6} ${ax},${ay} ${edge},${join + 6}`;
  }
  setAttribute(polygon, 'points', points);
}

export function bindCoalSlots(element) {
  const bindings = [];
  for (const content of element.children) {
    const kind = content.dataset.coalKind;
    if (!kind || kind === 'legacy') continue;
    const binding = { kind, element: content };
    if (kind === 'reading') Object.assign(binding, {
      id: content.dataset.point, unit: content.dataset.unit, limit: content.dataset.limitKey,
      valueNode: content.querySelector('[data-value]'), gauge: content.querySelector('.coal-gauge'),
      fill: content.querySelector('.coal-gauge-fill'),
    });
    else if (kind === 'alarm') {
      Object.assign(binding, {
        anchor: content.dataset.anchor.split(',').map(Number),
        viewBox: content.querySelector('svg').viewBox.baseVal,
        rows: [...content.querySelectorAll('[data-point]')],
        box: content.querySelector('.coal-alarm-box'), polygon: content.querySelector('polygon'),
      });
    } else if (kind === 'robot') {
      binding.rows = [...content.querySelectorAll('[data-point]')].map(node => ({
        node, id: node.dataset.point, valueNode: node.querySelector('[data-value]'),
        status: node.querySelector('[data-robot-status]'), dot: node.querySelector('.state-dot'),
      }));
      binding.fill = content.querySelector('.batt-fill');
    }
    bindings.push(binding);
  }
  element.slotStyles = slotStyles + '\n' + hostStyles;
  return bindings;
}

function formatReading(value, decimals = 2) {
  return Number.isFinite(value) ? value.toFixed(decimals) : '--';
}

const readingRanges = { ymlclw: [0, 15], xfgwsxsw: [0, 2] };

export function updateCoalSlots(slots, values) {
  for (const binding of slots) {
    const element = binding.element;
    if (binding.kind === 'reading') {
      const value = values[binding.id];
      setText(binding.valueNode, `${formatReading(value)} ${binding.unit}`);
      const [min, max] = readingRanges[binding.limit] || [-Infinity, Infinity];
      setAttribute(element, 'data-limit', value === null ? 'unknown' : value < min ? 'low' : value > max ? 'high' : 'normal');
      const { gauge, fill } = binding;
      if (gauge) {
        const fraction = value === null || max <= min ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
        setStyle(fill, 'height', `${fraction * 100}%`);
        setHidden(fill, fraction === 0);
        setAttribute(gauge, 'aria-valuemin', String(min));
        setAttribute(gauge, 'aria-valuemax', String(max));
        setAttribute(gauge, 'aria-valuetext', value === null ? '未知' : `${value}${binding.unit}`);
        if (value === null) {
          if (gauge.hasAttribute('aria-valuenow')) gauge.removeAttribute('aria-valuenow');
        } else setAttribute(gauge, 'aria-valuenow', String(value));
      }
    } else if (binding.kind === 'alarm') {
      let activeCount = 0;
      for (const row of binding.rows) {
        const value = values[row.dataset.point];
        setHidden(row, value !== true);
        if (value === true) activeCount += 1;
      }
      setHidden(element, activeCount === 0);
      positionAlarm(binding, activeCount);
    } else if (binding.kind === 'robot') {
      const run = values.JQR_YXZT;
      setAttribute(element, 'data-robot-state', run === null ? 'unknown' : run ? 'running' : 'stopped');
      // Follow the running signal; retain the R-02 patrol and scanning animations.
      setAttribute(element, 'data-motion', run === true ? 'running' : 'paused');
      for (const { node, id, valueNode, status, dot } of binding.rows) {
        if (id === 'JQR_YXZT') setText(status, run === null ? '未知' : run ? '运行' : '停止');
        else if (id === 'JQR_CWBJ' || id === 'JQR_GZBJ') {
          const active = values[id];
          setAttribute(dot, 'class', `state-dot ${active === null ? 'unknown' : active ? 'true' : 'false'}`);
          setAttribute(dot, 'aria-label', active === null ? '未知' : active ? '报警' : '正常');
        } else if (id === 'JQR_DCDL') setText(node, `${formatReading(values[id], 0)}%`);
        else if (id === 'JQR_DCWD') setText(node, `${formatReading(values[id], 1)}℃`);
        else setText(valueNode, formatReading(values[id], id === 'JQR_LJLC' ? 0 : 1));
      }
      const battery = values.JQR_DCDL;
      const height = battery === null ? 0 : Math.max(0, Math.min(100, battery)) * 0.24;
      setAttribute(binding.fill, 'height', String(height));
      setAttribute(binding.fill, 'y', String(213 - height));
      setStyle(binding.fill, 'animation', 'none');
    }
  }
}
