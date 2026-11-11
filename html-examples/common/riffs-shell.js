// Shared landmarks for all Riffs pages. Relative links follow the hosting origin.
const brand = '<img src="/common/logo.png" width="29" height="29" alt=""><b>flamo</b>';
document.querySelector('[data-riffs-header]').innerHTML = `
  <a class="riffs-skip" href="#main">跳到主要内容</a>
  <nav class="riffs-wrap riffs-nav" aria-label="主导航">
    <a class="riffs-brand" href="/" aria-label="Flamo 创意首页">${brand}<i>/</i><span>Riffs</span></a>
    <div><a class="riffs-current" href="/home/" ${location.pathname.startsWith('/pipe') ? '' : 'aria-current="page"'}>创意集</a>
    <a class="riffs-external" href="https://flamo.dev/">Flamo 官网 <span aria-hidden="true">↗</span></a></div>
  </nav>`;
document.querySelector('[data-riffs-footer]').innerHTML = `
  <div class="riffs-wrap riffs-foot"><a class="riffs-brand" href="/" aria-label="Flamo 创意首页">${brand}</a>
    <span>Riffs <i>/</i> 创意实验集</span>
    <small>Copyright (c) 2025-present <a href="mailto:support@flamo.dev">support@flamo.dev</a></small>
    <a href="https://flamo.dev/">Flamo 官网 ↗</a></div>`;
