import { sampleInterval } from '../common/demo-screen.js';
import { dimensions, metric, renderTrend } from './trend.js';

const groups = [
  '炉本体系统组', '风烟系统组', '制粉系统组', '炉启动系统组', '火检系统组', '脱硝系统组',
  '锅炉壁温系统组', '汽温控制系统组', '汽机本体系统组', '汽机辅助系统组', '主再旁系统组', '给泵给水系统组',
  '凝结水系统组', '省煤器系统组', '高压加热器系统', '低压加热器系统组', '辅汽系统组', '真空系统组',
  '干冷系统组', '空冷系统组', '发电机冷却系统组', '协调控制系统组', '发变组系统组', '厂用电系统组',
];
const kpis = {
  load: [410, 24, 2], steam_p: [18, 1.2, 2], steam_t: [535, 8, 1],
  reheat1: [7.5, 1, 2], reheat2: [0.72, 0.08, 2], feed_flow: [1240, 85, 2],
};
const diagram = document.querySelector('flamo-jianpan');
const devices = [...diagram.querySelectorAll('[data-device]')];
const deviceNames = [...new Set(devices.map(el => el.dataset.device))];
const flows = {
  ltzq1Show: ['ignition'], ltzs1Show: ['ANB', 'BNB'], ltzs2zShow: ['ANB'], ltzs2yShow: ['BNB'],
  ltzs3Show: ['ANB', 'BNB'], ltzs4Show: ['GSB'], ltzf1Show: ['AYCFJ'], ltzf2Show: ['ASFJ'],
  ltzf3Show: ['BSFJ'], ltzf4Show: ['BYCFJ'], ltzy1Show: ['AYFJ', 'BYFJ'], ltzy2Show: ['AYFJ'], ltzy3Show: ['BYFJ'],
};
const byId = id => document.getElementById(id);
let unit = new URLSearchParams(location.search).get('flag') === '2' ? 2 : 1;
let selected = 0;
let sample = Math.floor(Date.now() / sampleInterval);
let scores = [];

function updateBoiler() {
  const running = new Set(deviceNames.filter((_, i) => (sample + i + unit) % 5 < 3));
  for (const el of devices) {
    const state = running.has(el.dataset.device) ? 'running' : 'stopped';
    if (el.dataset.state === state) continue;
    el.dataset.state = state;
    el.title = (el.querySelector('[data-name]')?.dataset.name || el.dataset.name).replace(/[- ](停止|运行)$/, '')
      + (state === 'running' ? ' · 运行' : ' · 停止');
  }
  if (diagram.dataset.flamoState === 'ready') {
    for (const [property, names] of Object.entries(flows)) {
      const show = names.some(name => running.has(name));
      if (diagram[property] !== show) diagram[property] = show;
    }
  }
}
function prepareBoiler() {
  diagram.slotStyles = byId('boiler-state-styles').textContent;
  updateBoiler();
}
diagram.addEventListener('flamo-ready', prepareBoiler);
if (diagram.dataset.flamoState === 'ready') prepareBoiler();

function ring(name, index) {
  return `<button type="button" class="health-cell" data-group="${index}">
    <span class="health-ring"><svg viewBox="0 0 36 36"><circle class="ring-bg" cx="18" cy="18" r="15"/>
    <circle class="ring-fg" cx="18" cy="18" r="15"/></svg><span class="ring-text"></span></span>
    <span class="hc-name">${name}</span></button>`;
}
byId('healthPages').innerHTML = [0, 12].map(start =>
  `<div class="health-grid">${groups.slice(start, start + 12).map((name, i) => ring(name, start + i)).join('')}</div>`
).join('');
const cells = [...document.querySelectorAll('.health-cell')];
function showSelected() {
  cells.forEach((cell, i) => cell.classList.toggle('active', i === selected));
  byId('trendGroupName').textContent = groups[selected];
  byId('trendGroupScore').textContent = scores[selected].score.toFixed(1);
  renderTrend(sample, sampleInterval, selected, unit);
}
byId('healthPages').addEventListener('click', event => {
  const cell = event.target.closest('[data-group]');
  if (cell) { selected = Number(cell.dataset.group); showSelected(); }
});

function renderHealth() {
  scores = groups.map((name, i) => {
    const values = dimensions.map((_, d) => metric(sample, i, d, unit));
    const score = values.reduce((a, b) => a + b) / values.length;
    const cell = cells[i];
    cell.querySelector('.ring-text').textContent = score.toFixed(1);
    cell.querySelector('.ring-fg').setAttribute('stroke-dasharray', `${score * 0.942} 94.2`);
    cell.classList.toggle('level-warn', score < 90);
    return { name, score, values };
  });
  byId('healthOverallScore').textContent = (scores.reduce((sum, item) => sum + item.score, 0) / groups.length).toFixed(1);
  const lowest = [...scores].sort((a, b) => a.score - b.score).slice(0, 10);
  byId('top10List').innerHTML = lowest.map(({ name, score, values }, i) => {
    const reasons = dimensions.map(([label], d) => label + ' ' + values[d].toFixed(1)).join(' / ');
    return `<div class="top10-row" style="--score-color:${score >= 90 ? '#4eea8c' : '#ffd966'}">
      <div class="rank">${i + 1}</div><div class="info"><div class="name">${name}</div>
      <div class="bar"><div class="bar-fill" style="width:${(score - 60) * 2.5}%"></div></div>
      <div class="reasons">各项得分　${reasons}</div></div><div class="sc">${score.toFixed(1)}</div></div>`;
  }).join('');
  showSelected();
}

const observations = [
  ['风机振动', 'mm/s', 2.5, '关注振动趋势'], ['给水温度', '℃', 172, '观察温度波动'],
  ['润滑油压', 'MPa', 0.32, '观察压力变化'], ['蒸汽流量', 't/h', 1220, '关注流量趋势'],
  ['泵轴温度', '℃', 45, '观察温升变化'], ['阀门开度', '%', 68, '关注开度波动'],
];
function renderMessages() {
  const time = new Date(sample * sampleInterval).toLocaleTimeString('zh-CN', { hour12: false });
  const rows = observations.map(([name, suffix, target, memo], i) => {
    const group = (sample + i * 3 + unit) % groups.length;
    const dimension = (i + unit) % dimensions.length;
    const value = target * (1 + 0.05 * Math.sin(sample / 3 + i + unit));
    return { name, suffix, target, value: value.toFixed(2), memo, group: groups[group],
      category: dimensions[dimension][0], score: scores[group].values[dimension].toFixed(1) };
  });
  const field = (label, value) => `<div class="m-item"><span class="m-label">${label}</span><span class="m-val">${value}</span></div>`;
  byId('alertsGrid').innerHTML = rows.map(row =>
    `<div class="alerts-row warn" data-cat="${row.category}"><div class="alerts-cat"><span class="ac-cat-text">${row.category}</span></div>
      <div class="alerts-info"><div class="ac-desc">${row.name}偏差</div><div class="ac-score"><span class="ac-score-val">${row.score}</span>分</div>
      ${field('模拟值', row.value + row.suffix)}${field('参考值', row.target + row.suffix)}${field('时间', time)}</div></div>`
  ).join('');
  byId('hintsPages').innerHTML = [0, 4].map(start => `<div class="hints-page"><div class="hint-grid">${rows.slice(start, start + 4).map(row =>
    `<div class="hint-leaf"><div class="hl-head"><div class="hl-info"><div class="hl-name">${row.name}</div>
      <div class="hl-desc">${row.value} ${row.suffix}</div></div><div class="hl-group-tag">${row.group}</div></div>
      <div class="hl-metrics">${field('模型提示', row.memo)}</div></div>`).join('')}</div></div>`).join('');
}

function carousel(container, pages, dots) {
  let page = 0;
  function show(index) {
    page = index;
    pages.style.transform = `translateX(-${page * 100}%)`;
    [...dots.children].forEach((dot, i) => {
      dot.classList.toggle('on', i === page);
      dot.setAttribute('aria-pressed', String(i === page));
    });
  }
  [...dots.children].forEach((dot, i) => dot.addEventListener('click', () => show(i)));
  show(0);
  return () => {
    if (!container.matches(':hover, :focus-within')) show((page + 1) % dots.children.length);
  };
}
const carousels = [
  carousel(byId('healthCarousel'), byId('healthPages'), byId('healthDots')),
  carousel(byId('hintsCarousel'), byId('hintsPages'), byId('hintsDots')),
];

// Scroll tall lists on the unattended display. Hover or manual scrolling pauses them.
function scrollList(list) {
  let resumeAt = 0;
  for (const event of ['wheel', 'touchmove', 'pointerdown']) {
    list.addEventListener(event, () => { resumeAt = performance.now() + 4000; }, { passive: true });
  }
  return () => {
    const max = list.scrollHeight - list.clientHeight;
    if (max < 2 || list.matches(':hover') || performance.now() < resumeAt) return;
    if (list.scrollTop >= max - 1) {
      list.scrollTop = 0;
      resumeAt = performance.now() + 1200;
    } else {
      list.scrollTop += 1;
      if (list.scrollTop >= max - 1) resumeAt = performance.now() + 1200;
    }
  };
}
const scrolling = [scrollList(byId('top10List')), scrollList(byId('alertsGrid'))];

function render() {
  for (const [i, card] of [...document.querySelectorAll('[data-kpi]')].entries()) {
    const [base, amplitude, digits] = kpis[card.dataset.kpi];
    card.querySelector('.val b').textContent = (base + amplitude * Math.sin(sample / 5 + unit + i)).toFixed(digits);
  }
  renderHealth();
  renderMessages();
  updateBoiler();
}
const tabs = [...document.querySelectorAll('[data-unit-id]')];
function selectUnit(id) {
  unit = id;
  tabs.forEach(tab => {
    const active = Number(tab.dataset.unitId) === unit;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', String(active));
  });
  render();
}
tabs.forEach(tab => tab.addEventListener('click', () => {
  selectUnit(Number(tab.dataset.unitId));
  const url = new URL(location.href);
  url.searchParams.set('flag', String(unit));
  history.replaceState(null, '', url);
}));
selectUnit(unit);

let sampleTimer, carouselTimer, scrollTimer;
function start() {
  if (sampleTimer) return;
  sampleTimer = setInterval(() => { sample++; render(); }, sampleInterval);
  carouselTimer = setInterval(() => carousels.forEach(advance => advance()), 5000);
  scrollTimer = setInterval(() => scrolling.forEach(advance => advance()), 70);
}
window.addEventListener('pagehide', () => {
  clearInterval(sampleTimer);
  clearInterval(carouselTimer);
  clearInterval(scrollTimer);
  sampleTimer = undefined;
});
window.addEventListener('pageshow', event => {
  if (event.persisted) { sample = Math.floor(Date.now() / sampleInterval); render(); }
  start();
});
start();
