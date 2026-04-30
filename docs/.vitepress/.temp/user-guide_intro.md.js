import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.6ab74304.js";
const __pageData = JSON.parse('{"title":"\u5F15\u8A00","description":"","frontmatter":{},"headers":[{"level":2,"title":"\u8BF4\u660E","slug":"\u8BF4\u660E","link":"#\u8BF4\u660E","children":[]}],"relativePath":"user-guide/intro.md"}');
const _sfc_main = { name: "user-guide/intro.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="\u5F15\u8A00" tabindex="-1">\u5F15\u8A00 <a class="header-anchor" href="#\u5F15\u8A00" aria-hidden="true">#</a></h1><p>\u8FD9\u91CC\u662F\u7528\u6237\u6307\u5357\u5165\u53E3\u9875\uFF0C\u7528\u6765\u627F\u63A5\u5DE6\u4FA7\u5BFC\u822A\u7684\u4E3B\u76EE\u5F55\u3002</p><h2 id="\u8BF4\u660E" tabindex="-1">\u8BF4\u660E <a class="header-anchor" href="#\u8BF4\u660E" aria-hidden="true">#</a></h2><ul><li>\u8FD9\u91CC\u4F1A\u653E\u73A9\u5BB6\u6216\u4F7F\u7528\u8005\u6700\u5148\u63A5\u89E6\u5230\u7684\u5185\u5BB9</li><li>\u5DE6\u4FA7\u7ED3\u6784\u5DF2\u6309\u4F60\u63D0\u4F9B\u7684\u622A\u56FE\u98CE\u683C\u6574\u7406\u4E3A\u5206\u7EC4\u5BFC\u822A</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("user-guide/intro.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const intro = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  intro as default
};
