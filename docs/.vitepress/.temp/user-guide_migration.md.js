import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.6ab74304.js";
const __pageData = JSON.parse('{"title":"\u6574\u5408\u5305\u8FC1\u79FB\u6307\u5357","description":"","frontmatter":{},"headers":[],"relativePath":"user-guide/migration.md"}');
const _sfc_main = { name: "user-guide/migration.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="\u6574\u5408\u5305\u8FC1\u79FB\u6307\u5357" tabindex="-1">\u6574\u5408\u5305\u8FC1\u79FB\u6307\u5357 <a class="header-anchor" href="#\u6574\u5408\u5305\u8FC1\u79FB\u6307\u5357" aria-hidden="true">#</a></h1><p>\u8FD9\u91CC\u7528\u4E8E\u6574\u7406\u6574\u5408\u5305\u8FC1\u79FB\u76F8\u5173\u8BF4\u660E\u3002</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("user-guide/migration.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const migration = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  migration as default
};
