// Localized text shared by the asset baker and the gameplay compiler.
function brand(html) {
  return html.replace(/<div class="panel-b about-copy"[\s\S]*?<\/div>/, `<div class="panel-b about-copy" data-pane="about" hidden>
    <h3>关于 Saltline</h3>
    <p>本次重构使用 GPT-6 和 Flamo 重新绘制港区、角色与武器，测试 Flamo 的实时渲染表现，以及 AI 参与场景制作、游戏逻辑集成和交付的能力。</p>
    <p>Flamo 是互动场景的创作与运行工具，可将设计、脚本和 WebGPU 画面组织成可嵌入网页的 Web Component。<a href="https://flamo.dev/" target="_blank" rel="noopener noreferrer">访问 Flamo 官网 ↗</a></p>
    <p>原作是 Felix Rieseberg 发布的浏览器游戏 <a href="https://claude.ai/artifact/BGY1SztrAYcJQHSsnHHGmp" target="_blank" rel="noopener noreferrer">《Saltline》↗</a>。本版本沿用原作的港区设计、任务、战斗与音效。</p>
  </div>`)
    .replaceAll('使用 Fable5.2 自主研发 · 国产第一人称射击游戏 · 开发体验版','使用 GPT-6 和 Flamo 重构渲染 · 第一人称射击游戏')
    .replace(/几猫<span class="m-subtitle">3A大作<\/span>/g,'SALTLINE')
    .replaceAll('几猫3A大作','Saltline')
    .replaceAll('几猫','Flamo');
}
module.exports={brand};
