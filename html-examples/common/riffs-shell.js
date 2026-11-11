// Shared landmarks for all Riffs pages. Relative links follow the hosting origin.
const brand = '<img src="/common/logo.png" width="29" height="29" alt=""><b>flamo</b>';
document.querySelector('[data-riffs-header]').innerHTML = `
  <a class="riffs-skip" href="#main">跳到主要内容</a>
  <nav class="riffs-wrap riffs-nav" aria-label="主导航">
    <a class="riffs-brand" href="/" aria-label="Flamo 创意首页">${brand}<i>/</i><span>Riffs</span></a>
    <div><a class="riffs-current" href="/home/" ${location.pathname.startsWith('/pipe') ? '' : 'aria-current="page"'}>创意集</a>
    <a class="riffs-external" href="https://flamo.dev/">Flamo 官网 <span aria-hidden="true">↗</span></a>
    <a class="riffs-github" href="https://github.com/flamo-dev/flamo-riffs" aria-label="Flamo Riffs 的 GitHub 仓库" title="Flamo Riffs 的 GitHub 仓库">
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
      </svg>
    </a></div>
  </nav>`;
document.querySelector('[data-riffs-footer]').innerHTML = `
  <div class="riffs-wrap riffs-foot"><a class="riffs-brand" href="/" aria-label="Flamo 创意首页">${brand}</a>
    <span>Riffs <i>/</i> 创意实验集</span>
    <small>Copyright (c) 2025-present <a href="mailto:support@flamo.dev">support@flamo.dev</a></small>
    <a href="https://flamo.dev/">Flamo 官网 ↗</a></div>`;
