import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.6ab74304.js";
const __pageData = JSON.parse('{"title":"\u5FEB\u901F\u5F00\u59CB","description":"","frontmatter":{},"headers":[{"level":2,"title":"1. \u5B89\u88C5\u4F9D\u8D56","slug":"_1-\u5B89\u88C5\u4F9D\u8D56","link":"#_1-\u5B89\u88C5\u4F9D\u8D56","children":[]},{"level":2,"title":"2. \u542F\u52A8\u672C\u5730\u6587\u6863","slug":"_2-\u542F\u52A8\u672C\u5730\u6587\u6863","link":"#_2-\u542F\u52A8\u672C\u5730\u6587\u6863","children":[]},{"level":2,"title":"3. \u8BBF\u95EE\u9875\u9762","slug":"_3-\u8BBF\u95EE\u9875\u9762","link":"#_3-\u8BBF\u95EE\u9875\u9762","children":[]}],"relativePath":"guide/quickstart.md"}');
const _sfc_main = { name: "guide/quickstart.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="\u5FEB\u901F\u5F00\u59CB" tabindex="-1">\u5FEB\u901F\u5F00\u59CB <a class="header-anchor" href="#\u5FEB\u901F\u5F00\u59CB" aria-hidden="true">#</a></h1><p>\u6309\u7167\u4E0B\u9762\u7684\u6B65\u9AA4\uFF0C\u53EF\u4EE5\u5FEB\u901F\u67E5\u770B\u548C\u4F7F\u7528\u8FD9\u4EFD\u6587\u6863\u3002</p><h2 id="_1-\u5B89\u88C5\u4F9D\u8D56" tabindex="-1">1. \u5B89\u88C5\u4F9D\u8D56 <a class="header-anchor" href="#_1-\u5B89\u88C5\u4F9D\u8D56" aria-hidden="true">#</a></h2><p>\u5728\u9879\u76EE\u6839\u76EE\u5F55\u8FD0\u884C\uFF1A</p><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki"><code><span class="line"><span style="${ssrRenderStyle({ "color": "#A6ACCD" })}">npm install</span></span>
<span class="line"></span></code></pre></div><h2 id="_2-\u542F\u52A8\u672C\u5730\u6587\u6863" tabindex="-1">2. \u542F\u52A8\u672C\u5730\u6587\u6863 <a class="header-anchor" href="#_2-\u542F\u52A8\u672C\u5730\u6587\u6863" aria-hidden="true">#</a></h2><p>\u8FD0\u884C\u4EE5\u4E0B\u547D\u4EE4\u6253\u5F00\u672C\u5730\u9884\u89C8\uFF1A</p><div class="language-bash"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki"><code><span class="line"><span style="${ssrRenderStyle({ "color": "#A6ACCD" })}">npm run dev</span></span>
<span class="line"></span></code></pre></div><h2 id="_3-\u8BBF\u95EE\u9875\u9762" tabindex="-1">3. \u8BBF\u95EE\u9875\u9762 <a class="header-anchor" href="#_3-\u8BBF\u95EE\u9875\u9762" aria-hidden="true">#</a></h2><p>\u542F\u52A8\u6210\u529F\u540E\uFF0C\u6253\u5F00\u7EC8\u7AEF\u63D0\u793A\u7684\u672C\u5730\u5730\u5740\uFF0C\u8FDB\u5165 <code>\u5F00\u53D1\u6307\u5357</code> \u9875\u9762\u5373\u53EF\u770B\u5230\u5DE6\u4FA7\u5BFC\u822A\u680F\u3002</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/quickstart.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const quickstart = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  quickstart as default
};
