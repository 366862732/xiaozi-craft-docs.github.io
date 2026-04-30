import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.6ab74304.js";
const __pageData = JSON.parse('{"title":"\u5F15\u8A00","description":"","frontmatter":{},"headers":[{"level":2,"title":"\u8BF4\u660E","slug":"\u8BF4\u660E","link":"#\u8BF4\u660E","children":[]}],"relativePath":"xiaozi craft/intro.md"}');
const _sfc_main = { name: "xiaozi craft/intro.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="\u5F15\u8A00" tabindex="-1">\u5F15\u8A00 <a class="header-anchor" href="#\u5F15\u8A00" aria-hidden="true">#</a></h1><p>\u8FD9\u91CC\u7528\u4E8E\u7F16\u5199 <code>xiaozi craft</code> \u6574\u5408\u5305\u5F00\u53D1\u76F8\u5173\u8BF4\u660E\u3002</p><h2 id="\u8BF4\u660E" tabindex="-1">\u8BF4\u660E <a class="header-anchor" href="#\u8BF4\u660E" aria-hidden="true">#</a></h2><ul><li>\u8FD9\u4E2A\u76EE\u5F55\u5DF2\u7ECF\u540C\u6B65\u4E3A\u5F53\u524D\u4FDD\u7559\u7684\u5F00\u53D1\u6587\u6863\u5165\u53E3</li><li>\u5DE6\u4FA7\u5BFC\u822A\u53EA\u4FDD\u7559\u73B0\u6709\u76EE\u5F55\u5BF9\u5E94\u7684\u9875\u9762\u94FE\u63A5</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("xiaozi craft/intro.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const intro = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  intro as default
};
