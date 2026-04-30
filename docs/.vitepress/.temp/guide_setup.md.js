import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.6ab74304.js";
const __pageData = JSON.parse('{"title":"\u73AF\u5883\u642D\u5EFA","description":"","frontmatter":{},"headers":[{"level":2,"title":"\u5FC5\u9700\u73AF\u5883","slug":"\u5FC5\u9700\u73AF\u5883","link":"#\u5FC5\u9700\u73AF\u5883","children":[]},{"level":2,"title":"\u5B89\u88C5\u4F9D\u8D56","slug":"\u5B89\u88C5\u4F9D\u8D56","link":"#\u5B89\u88C5\u4F9D\u8D56","children":[]},{"level":2,"title":"\u672C\u5730\u9884\u89C8","slug":"\u672C\u5730\u9884\u89C8","link":"#\u672C\u5730\u9884\u89C8","children":[]}],"relativePath":"guide/setup.md"}');
const _sfc_main = { name: "guide/setup.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="\u73AF\u5883\u642D\u5EFA" tabindex="-1">\u73AF\u5883\u642D\u5EFA <a class="header-anchor" href="#\u73AF\u5883\u642D\u5EFA" aria-hidden="true">#</a></h1><p>\u5F00\u59CB\u9605\u8BFB\u6216\u7EF4\u62A4\u6587\u6863\u524D\uFF0C\u8BF7\u5148\u51C6\u5907\u4EE5\u4E0B\u73AF\u5883\uFF1A</p><h2 id="\u5FC5\u9700\u73AF\u5883" tabindex="-1">\u5FC5\u9700\u73AF\u5883 <a class="header-anchor" href="#\u5FC5\u9700\u73AF\u5883" aria-hidden="true">#</a></h2><ul><li>Node.js 18 \u53CA\u4EE5\u4E0A</li><li>npm \u6216 pnpm</li></ul><h2 id="\u5B89\u88C5\u4F9D\u8D56" tabindex="-1">\u5B89\u88C5\u4F9D\u8D56 <a class="header-anchor" href="#\u5B89\u88C5\u4F9D\u8D56" aria-hidden="true">#</a></h2><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki"><code><span class="line"><span style="${ssrRenderStyle({ "color": "#A6ACCD" })}">npm install</span></span>
<span class="line"></span></code></pre></div><h2 id="\u672C\u5730\u9884\u89C8" tabindex="-1">\u672C\u5730\u9884\u89C8 <a class="header-anchor" href="#\u672C\u5730\u9884\u89C8" aria-hidden="true">#</a></h2><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki"><code><span class="line"><span style="${ssrRenderStyle({ "color": "#A6ACCD" })}">npm run dev</span></span>
<span class="line"></span></code></pre></div><p>\u5982\u679C\u547D\u4EE4\u6267\u884C\u6210\u529F\uFF0C\u6D4F\u89C8\u5668\u4E2D\u6253\u5F00\u672C\u5730\u5730\u5740\u540E\uFF0C\u5C31\u53EF\u4EE5\u770B\u5230\u5DE6\u4FA7\u6587\u6863\u5BFC\u822A\u3002</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/setup.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const setup = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  setup as default
};
