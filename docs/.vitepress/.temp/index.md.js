import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.6ab74304.js";
const __pageData = JSON.parse('{"title":"\u6B22\u8FCE\u6765\u5230xiaozi craft\u7684\u6280\u672F\u6587\u6863","description":"","frontmatter":{},"headers":[{"level":3,"title":"\u67E5\u770B\u65C1\u8FB9\u7684\u6B65\u9AA4\uFF0C\u8BB0\u5F97\u4E00\u5B9A\u6309\u7167\u987A\u5E8F","slug":"\u67E5\u770B\u65C1\u8FB9\u7684\u6B65\u9AA4-\u8BB0\u5F97\u4E00\u5B9A\u6309\u7167\u987A\u5E8F","link":"#\u67E5\u770B\u65C1\u8FB9\u7684\u6B65\u9AA4-\u8BB0\u5F97\u4E00\u5B9A\u6309\u7167\u987A\u5E8F","children":[]}],"relativePath":"index.md"}');
const _sfc_main = { name: "index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="\u6B22\u8FCE\u6765\u5230xiaozi-craft\u7684\u6280\u672F\u6587\u6863" tabindex="-1">\u6B22\u8FCE\u6765\u5230xiaozi craft\u7684\u6280\u672F\u6587\u6863 <a class="header-anchor" href="#\u6B22\u8FCE\u6765\u5230xiaozi-craft\u7684\u6280\u672F\u6587\u6863" aria-hidden="true">#</a></h1><p>\u6211\u4EEC\u4F1A\u5728\u8FD9\u91CC\u89E3\u51B3\u4F60\u7684\u95EE\u9898,\u4ECE\u5B89\u88C5\u5230\u6E38\u73A9\u548C\u5E38\u89C1\u7684\u95EE\u9898</p><h3 id="\u67E5\u770B\u65C1\u8FB9\u7684\u6B65\u9AA4-\u8BB0\u5F97\u4E00\u5B9A\u6309\u7167\u987A\u5E8F" tabindex="-1">\u67E5\u770B\u65C1\u8FB9\u7684\u6B65\u9AA4\uFF0C\u8BB0\u5F97\u4E00\u5B9A\u6309\u7167\u987A\u5E8F <a class="header-anchor" href="#\u67E5\u770B\u65C1\u8FB9\u7684\u6B65\u9AA4-\u8BB0\u5F97\u4E00\u5B9A\u6309\u7167\u987A\u5E8F" aria-hidden="true">#</a></h3></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
