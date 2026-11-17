export const slotStyles = `
.robot-panel {
    position: relative;
    border-radius: 10px;
    background:
      radial-gradient(120% 80% at 50% 0%, rgba(0, 60, 120, 0.25) 0%, transparent 60%),
      linear-gradient(180deg, #052443 0%, #052443 100%);
    border: 1px solid rgba(0, 180, 255, 0.22);
    box-shadow: inset 0 0 30px rgba(0, 50, 100, 0.35);
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .panel-tag {
    position: absolute; top: 0; left: 0; z-index: 3;
    padding: 5px 16px 5px 12px;
    font-size: 13px; font-weight: 700; letter-spacing: 2px; color: #d8f2ff;
    background: linear-gradient(90deg, rgba(0, 120, 200, 0.55), rgba(0, 60, 130, 0.15));
    border-right: 1px solid rgba(0, 200, 255, 0.35);
    border-bottom: 1px solid rgba(0, 200, 255, 0.35);
    border-radius: 0 0 8px 0;
    clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
    text-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
  }
  .robot-panel .corner { position: absolute; width: 14px; height: 14px; border-color: #00d4ff; opacity: 0.7; z-index: 3; }
  .robot-panel .c-tl { top: 3px; left: 3px; border-top: 2px solid; border-left: 2px solid; border-top-left-radius: 6px; }
  .robot-panel .c-br { bottom: 3px; right: 3px; border-bottom: 2px solid; border-right: 2px solid; border-bottom-right-radius: 6px; }
  .robot-stage { position: relative; z-index: 1; flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }
  .robot-svg { width: 100%; height: 100%; max-height: 100%; }
  .robot-bg {
    position: absolute;
    top: 53%; left: 50%;
    transform: translate(-50%, -50%);
    width: 86%;
    height: 35%;
    margin-top: 18px; margin-right: 18px;
    z-index: 0;
    display: flex; flex-direction: column;
    border-radius: 10px;
    background:
      radial-gradient(140% 100% at 50% 0%, rgba(0, 70, 140, 0.28) 0%, transparent 55%),
      linear-gradient(165deg, #0c2338 0%, #071527 55%, #04101f 100%);
    border: 1px solid rgba(70, 200, 255, 0.20);
    box-shadow:
      inset 0 1px 0 rgba(140, 220, 255, 0.12),
      10px 14px 30px rgba(0, 0, 0, 0.55);
    padding: 12px 16px 14px;
    pointer-events: none;
  }
  .robot-bg::before {
    content: "";
    position: absolute;
    bottom: 100%; left: 0;
    width: 100%; height: 18px;
    background: linear-gradient(180deg, #25628f 0%, #123d63 100%);
    border: 1px solid rgba(70, 200, 255, 0.16);
    border-bottom: none;
    border-radius: 10px 10px 0 0;
    transform: skewX(-45deg);
    transform-origin: 0 100%;
    pointer-events: none;
  }
  .robot-bg::after {
    content: "";
    position: absolute;
    top: 0; left: 100%;
    width: 18px; height: 100%;
    background: linear-gradient(90deg, #0a2a44 0%, #051523 100%);
    border: 1px solid rgba(70, 200, 255, 0.12);
    border-left: none;
    border-radius: 0 10px 10px 0;
    transform: skewY(-45deg);
    transform-origin: 0 0;
    pointer-events: none;
  }
  .robot-bg .bg-title {
    flex: 0 0 auto;
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 6px;
    padding-bottom: 5px;
    border-bottom: 1px solid rgba(70, 200, 255, 0.20);
  }
  .robot-bg .bg-title .t-ico {
    color: #00d4ff;
    filter: drop-shadow(0 0 6px rgba(0, 212, 255, 0.7));
  }
  .robot-bg .bg-title h3 {
    margin: 0;
    font-size: 12px; font-weight: 700; letter-spacing: 2px;
    color: #d8f2ff; text-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
  }
  .robot-bg .bg-title .live-tag {
    margin-left: auto;
    font-family: Consolas, monospace;
    font-size: 10px; color: #4eea8c; letter-spacing: 1px;
  }
  .robot-bg .bg-grid {
    flex: 1 1 0;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 1fr;
    gap: 4px 8px;
    overflow: hidden;
  }
  .robot-bg .bg-grid .kcard {
    background: linear-gradient(90deg, rgba(0, 60, 110, 0.30), rgba(0, 30, 60, 0.10));
    border: 1px solid rgba(70, 200, 255, 0.14);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 10px; color: #8db8d8;
    display: flex; align-items: center; gap: 6px;
  }
  .robot-bg .bg-grid .kcard .k-ico {
    width: 14px; height: 14px;
    flex: 0 0 14px;
    color: #4ec9ff;
  }
  .robot-bg .bg-grid .kcard .k-ico svg { width: 16px; height: 16px; }
  .robot-bg .bg-grid .kcard .k-name {
    flex: 1; min-width: 0;
    font-size: 10px; color: #8db8d8; letter-spacing: 0.3px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .robot-bg .bg-grid .kcard .k-val {
    flex: 0 0 auto;
    font-family: Consolas, monospace;
    font-size: 12px; font-weight: 700; line-height: 12px;
    color: #4EC9FF;
    display: inline-flex;
    align-items: flex-end;
    justify-content: flex-end;
    height: 14px;
    min-width: 70px;
  }
  .robot-stage > .robot-foreground {
    position: absolute;
    top: 0; right: 0; bottom: 0; left: 0;
    z-index: 2;
    pointer-events: none;
  }
  .robot-foreground > .robot-svg { display: block; }
  .robot-foot {
    position: relative; z-index: 2;
    flex: 0 0 auto;
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 16px;
    border-top: 1px solid rgba(0, 180, 255, 0.18);
    background: rgba(0, 20, 45, 0.55);
    font-size: 11.5px; color: #8db8d8; letter-spacing: 1px;
  }
  .robot-foot b { color: #4eea8c; font-family: Consolas, monospace; }
  .robot-foot .mode { color: #00d4ff; font-weight: 700; }
  .live-dot {
    display: inline-block; width: 7px; height: 7px; border-radius: 50%;
    background: #4eea8c; box-shadow: 0 0 6px #4eea8c;
    margin-right: 6px; animation: blink 1.2s steps(2, start) infinite;
  }
  @keyframes blink { 50% { opacity: 0.15; } }
  .k-val .u {
    font-size: 9.5px; font-weight: 400; font-style: normal;
    color: #7f9db8; margin-left: 3px; text-shadow: none; letter-spacing: 0;
  }
  .k-val .state-dot {
    display: inline-block;
    width: 14px; height: 14px;
    border-radius: 50%;
    margin-left: 2px;
    flex-shrink: 0;
  }
  .k-val .state-dot.false {
    background: #6f7d8a;
    box-shadow: 0 0 4px rgba(111, 125, 138, 0.45);
  }
  .k-val .state-dot.run {
    background: #4eea8c;
    box-shadow: 0 0 6px rgba(78, 234, 140, 0.55);
  }
  .k-val .state-dot.true {
    background: #ff5757;
    box-shadow: 0 0 8px rgba(255, 87, 87, 0.7);
    animation: statePulse 1s ease-in-out infinite;
  }
  @keyframes statePulse {
    0%, 100% { opacity: 1;    box-shadow: 0 0 8px  rgba(255, 87, 87, 0.7); }
    50%      { opacity: 0.55; box-shadow: 0 0 14px rgba(255, 87, 87, 0.9); }
  }
  .robot-move { animation: patrol 14s ease-in-out infinite; }
  @keyframes patrol {
    0%, 100% { transform: translateX(0); }
    42%, 58% { transform: translateX(120px); }
  }
  .wheel { animation: rot 2.6s linear infinite; }
  @keyframes rot { to { transform: rotate(360deg); } }
  .wheel, .sweep, .scan-cone, .ring, .core, .ledbar, .coal-g, .belt-dash, .lens {
    transform-box: fill-box;
  }
  .wheel { transform-origin: center; }
  .ring { transform-origin: center; animation: ring 2.4s ease-out infinite; opacity: 0; }
  .ring.r2 { animation-delay: 0.8s; }
  .ring.r3 { animation-delay: 1.6s; }
  @keyframes ring {
    0%   { transform: scale(0.25); opacity: 0.9; }
    100% { transform: scale(1.5); opacity: 0; }
  }
  .core { transform-origin: center; }
  .core-ring { animation: corePulse 2s ease-in-out infinite, coreStroke 14s ease-in-out infinite; }
  .core-dot  { animation: corePulse 2s ease-in-out infinite, coreFill 14s ease-in-out infinite; }
  @keyframes corePulse {
    0%, 100% { transform: scale(0.9); opacity: 0.75; }
    50%      { transform: scale(1.12); opacity: 1; }
  }
  @keyframes coreStroke {
    0%, 40%   { stroke: #4eea8c; }
    45%, 55%  { stroke: #6f7d8a; }
    60%, 100% { stroke: #4eea8c; }
  }
  @keyframes coreFill {
    0%, 40%   { fill: #4eea8c; }
    45%, 55%  { fill: #6f7d8a; }
    60%, 100% { fill: #4eea8c; }
  }
  .ledbar { stroke-dasharray: 16 8; animation: dashmove 0.9s linear infinite; }
  @keyframes dashmove { to { stroke-dashoffset: -24; } }
  .scan-cone { transform-origin: 50% 0%; animation: conePulse 2.2s ease-in-out infinite; }
  @keyframes conePulse {
    0%, 100% { opacity: 0.18; transform: scaleX(0.85); }
    50%      { opacity: 0.55; transform: scaleX(1.08); }
  }
  .sweep { transform-origin: 50% 0%; animation: sweep 3.2s ease-in-out infinite alternate; }
  @keyframes sweep {
    from { transform: skewX(-10deg); }
    to   { transform: skewX(10deg); }
  }
  .lens { animation: lensGlow 1.8s ease-in-out infinite; }
  @keyframes lensGlow {
    0%, 100% { opacity: 0.65; }
    50%      { opacity: 1; }
  }
  .belt-dash { animation: beltmove 1.1s linear infinite; }
  @keyframes beltmove { to { stroke-dashoffset: -24; } }
  .coal-g { animation: coalmove 5s linear infinite; }
  .coal-g.c2 { animation-delay: -1.7s; }
  .coal-g.c3 { animation-delay: -3.4s; }
  @keyframes coalmove {
    from { transform: translateX(-30px); opacity: 0; }
    12%  { opacity: 1; }
    88%  { opacity: 1; }
    to   { transform: translateX(300px); opacity: 0; }
  }
  .beacon { animation: beaconBlink 1s steps(2, start) infinite; }
  @keyframes beaconBlink { 50% { opacity: 0.2; } }
  .arc { animation: arcFlow 1.4s linear infinite; }
  @keyframes arcFlow {
    0%, 100% { opacity: 0.25; }
    50%      { opacity: 0.9; }
  }
.robot-panel { width:100%;height:100%;box-sizing:border-box;font-family:'Microsoft YaHei',sans-serif;color:#8db8d8; }
.robot-panel *, .robot-panel *::before, .robot-panel *::after {box-sizing:border-box;}
.robot-panel [data-motion="paused"] *, .robot-panel[data-motion="paused"] * {animation-play-state:paused!important;}
.robot-panel .state-dot.unknown{background:#7b8999;box-shadow:none;}
.robot-panel .k-val b{font-size:inherit;color:inherit;}
.robot-panel:not([data-robot-state="running"]) :is(.scan-cone,.sweep,.beacon){visibility:hidden;}
.coal-reading{display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#4ec9ff;font:14px Consolas,monospace;white-space:nowrap;}
.coal-reading[data-limit="low"],.coal-reading[data-limit="high"]{color:#ff5757;}
.coal-alarms{display:flex;flex-direction:column;justify-content:center;width:100%;height:100%;color:#ff5757;font:12px 'Microsoft YaHei',sans-serif;}
.coal-alarms [hidden]{display:none!important;}
.coal-alarms .unknown{color:#899db1;}
`;
