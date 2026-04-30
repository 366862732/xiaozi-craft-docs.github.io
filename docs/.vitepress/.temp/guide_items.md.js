import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.6ab74304.js";
const __pageData = JSON.parse('{"title":"\u7269\u54C1\u7CFB\u7EDF","description":"","frontmatter":{},"headers":[],"relativePath":"guide/items.md"}');
const _sfc_main = { name: "guide/items.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="\u7269\u54C1\u7CFB\u7EDF" tabindex="-1">\u7269\u54C1\u7CFB\u7EDF <a class="header-anchor" href="#\u7269\u54C1\u7CFB\u7EDF" aria-hidden="true">#</a></h1><p>\u8FD9\u91CC\u53EF\u4EE5\u7F16\u5199\u4E0E\u7269\u54C1\u76F8\u5173\u7684\u8BF4\u660E\uFF0C\u4F8B\u5982\uFF1A</p><ul><li>\u7269\u54C1\u6CE8\u518C\u65B9\u5F0F</li><li>\u7269\u54C1\u5C5E\u6027\u914D\u7F6E</li><li>\u7269\u54C1\u4F7F\u7528\u903B\u8F91</li></ul><p>\u4F60\u540E\u7EED\u8865\u5145\u5185\u5BB9\u540E\uFF0C\u8FD9\u4E00\u9875\u4F1A\u7EE7\u7EED\u4FDD\u7559\u5728\u5DE6\u4FA7\u5BFC\u822A\u4E2D\u3002</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/items.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const items = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  items as default
};
