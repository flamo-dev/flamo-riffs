import { text, language } from '../common/riffs-language.js';
export const dimensions = [
  [['Safety', '安全'], '#4baaff'], [['Efficiency', '经济'], '#ffd166'], [['Parameters', '参数'], '#4eea8c'], [['Faults', '故障'], '#ff8a65'], [['Reliability', '可靠'], '#bb9aff'],
];

// A score is a function of the sample time, so current readings and history agree.
export function metric(sample, group, dimension, unit) {
  const phase = group * 1.31 + dimension * 0.95 + unit * 2;
  return 83.5 + 4 * Math.sin(sample / 85 + group * 0.65 + unit) + 6 * Math.sin(sample / 127 + phase)
    + 3 * Math.sin(sample / 29 + phase * 2) + 1.2 * Math.sin(sample / 4 + phase) + 2 * Math.sin(sample * 0.3 + unit);
}

const chart = document.querySelector('#trendChart');
const metrics = document.querySelector('#trendMetrics');
let timeFormat;
function formatTime() { timeFormat = new Intl.DateTimeFormat(language.value, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); }
formatTime();
language.addEventListener('change', formatTime);

export function renderTrend(sample, interval, group, unit) {
  const minutes = Array.from({ length: 61 }, (_, i) => sample - (60 - i) * 60000 / interval);
  const x = i => 28 + i * 7;
  const y = score => 12 + (100 - score) * 5;
  const axis = [65, 75, 85, 95].map(score =>
    `<path d="M28 ${y(score)}h420"/><text x="3" y="${y(score) + 3}">${score}</text>`
  ).join('');
  const labels = [0, 15, 30, 45, 60].map(i =>
    `<text x="${x(i)}" y="205" text-anchor="middle">${timeFormat.format(minutes[i] * interval)}</text>`
  ).join('');
  const lines = dimensions.map(([, color], d) => {
    const points = minutes.map((t, i) => `${x(i)},${y(metric(t, group, d, unit)).toFixed(2)}`);
    return `<polyline fill="none" stroke="${color}" stroke-width="2" points="${points.join(' ')}"/>
      <circle cx="${x(60)}" cy="${y(metric(sample, group, d, unit))}" r="3" fill="${color}"/>`;
  }).join('');
  const hover = minutes.map((t, i) => {
    const values = dimensions.map(([name], d) => `${text(...name)} ${metric(t, group, d, unit).toFixed(1)}`);
    return `<rect x="${x(i) - 3.5}" y="0" width="7" height="192" fill="transparent">
      <title>${timeFormat.format(t * interval)}　${values.join('　')}</title></rect>`;
  }).join('');
  chart.innerHTML = `<svg viewBox="0 0 474 213" preserveAspectRatio="none" role="img" aria-label="${text('Five simulated health indicators over the past hour', '最近一小时的五项模拟得分')}">
    <g class="chart-axis">${axis}${labels}</g>${lines}${hover}</svg>`;
  metrics.innerHTML = dimensions.map(([name, color], d) =>
    `<div class="trend-metric" style="--mc:${color}"><span class="m-name">${text(...name)}</span>
      <span class="m-val">${metric(sample, group, d, unit).toFixed(1)}</span></div>`
  ).join('');
}
