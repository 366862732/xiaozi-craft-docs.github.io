import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.6ab74304.js";
const __pageData = JSON.parse('{"title":"\u65B9\u5757\u7CFB\u7EDF","description":"","frontmatter":{},"headers":[],"relativePath":"guide/blocks.md"}');
const _sfc_main = { name: "guide/blocks.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="\u65B9\u5757\u7CFB\u7EDF" tabindex="-1">\u65B9\u5757\u7CFB\u7EDF <a class="header-anchor" href="#\u65B9\u5757\u7CFB\u7EDF" aria-hidden="true">#</a></h1><p>\u8FD9\u91CC\u53EF\u4EE5\u7F16\u5199\u4E0E\u65B9\u5757\u76F8\u5173\u7684\u8BF4\u660E\uFF0C\u4F8B\u5982\uFF1A</p><ul><li>\u65B9\u5757\u6CE8\u518C</li><li>\u6750\u8D28\u4E0E\u5C5E\u6027</li><li>\u4EA4\u4E92\u884C\u4E3A</li></ul><p>\u8865\u5145\u5B9E\u9645\u5185\u5BB9\u540E\uFF0C\u8FD9\u4E00\u9875\u4F1A\u4F5C\u4E3A\u5DE6\u4FA7\u83DC\u5355\u4E2D\u7684\u72EC\u7ACB\u7AE0\u8282\u663E\u793A\u3002</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/blocks.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const blocks = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  blocks as default
};
