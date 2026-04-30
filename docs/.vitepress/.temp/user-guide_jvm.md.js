import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.6ab74304.js";
const __pageData = JSON.parse('{"title":"JVM \u53C2\u6570","description":"","frontmatter":{},"headers":[],"relativePath":"user-guide/jvm.md"}');
const _sfc_main = { name: "user-guide/jvm.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="jvm-\u53C2\u6570" tabindex="-1">JVM \u53C2\u6570 <a class="header-anchor" href="#jvm-\u53C2\u6570" aria-hidden="true">#</a></h1><p>\u8FD9\u91CC\u7528\u4E8E\u7F16\u5199 JVM \u53C2\u6570\u5EFA\u8BAE\u4E0E\u8BF4\u660E\u3002</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("user-guide/jvm.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const jvm = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  jvm as default
};
