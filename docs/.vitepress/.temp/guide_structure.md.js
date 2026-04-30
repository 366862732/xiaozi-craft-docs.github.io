import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.6ab74304.js";
const __pageData = JSON.parse('{"title":"\u9879\u76EE\u7ED3\u6784","description":"","frontmatter":{},"headers":[{"level":2,"title":"\u8BF4\u660E","slug":"\u8BF4\u660E","link":"#\u8BF4\u660E","children":[]}],"relativePath":"guide/structure.md"}');
const _sfc_main = { name: "guide/structure.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="\u9879\u76EE\u7ED3\u6784" tabindex="-1">\u9879\u76EE\u7ED3\u6784 <a class="header-anchor" href="#\u9879\u76EE\u7ED3\u6784" aria-hidden="true">#</a></h1><p>\u5F53\u524D\u6587\u6863\u9879\u76EE\u7684\u4E3B\u8981\u7ED3\u6784\u5982\u4E0B\uFF1A</p><div class="language-text"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki"><code><span class="line"><span style="${ssrRenderStyle({ "color": "#A6ACCD" })}">docs/</span></span>
<span class="line"><span style="${ssrRenderStyle({ "color": "#A6ACCD" })}">  .vitepress/    # VitePress \u914D\u7F6E</span></span>
<span class="line"><span style="${ssrRenderStyle({ "color": "#A6ACCD" })}">  guide/         # \u6307\u5357\u6587\u6863</span></span>
<span class="line"><span style="${ssrRenderStyle({ "color": "#A6ACCD" })}">  index.md       # \u9996\u9875</span></span>
<span class="line"><span style="${ssrRenderStyle({ "color": "#A6ACCD" })}"></span></span></code></pre></div><h2 id="\u8BF4\u660E" tabindex="-1">\u8BF4\u660E <a class="header-anchor" href="#\u8BF4\u660E" aria-hidden="true">#</a></h2><ul><li><code>.vitepress/config.ts</code> \u7528\u6765\u914D\u7F6E\u9876\u90E8\u5BFC\u822A\u548C\u5DE6\u4FA7\u4FA7\u8FB9\u680F</li><li><code>guide/</code> \u76EE\u5F55\u4E2D\u7684\u6BCF\u4E2A <code>.md</code> \u6587\u4EF6\u4F1A\u6210\u4E3A\u5DE6\u4FA7\u83DC\u5355\u4E2D\u7684\u4E00\u4E2A\u9875\u9762</li><li>\u53EA\u8981\u9875\u9762\u88AB\u4FA7\u8FB9\u680F\u5F15\u7528\u5E76\u4E14\u6587\u4EF6\u5B58\u5728\uFF0C\u5C31\u4F1A\u6B63\u5E38\u663E\u793A\u5BFC\u822A</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/structure.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const structure = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  structure as default
};
