import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.6ab74304.js";
const __pageData = JSON.parse('{"title":"\u5408\u6210\u914D\u65B9","description":"","frontmatter":{},"headers":[],"relativePath":"guide/recipes.md"}');
const _sfc_main = { name: "guide/recipes.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="\u5408\u6210\u914D\u65B9" tabindex="-1">\u5408\u6210\u914D\u65B9 <a class="header-anchor" href="#\u5408\u6210\u914D\u65B9" aria-hidden="true">#</a></h1><p>\u8FD9\u91CC\u53EF\u4EE5\u6574\u7406\u914D\u65B9\u7CFB\u7EDF\u7684\u6587\u6863\u5185\u5BB9\uFF0C\u4F8B\u5982\uFF1A</p><ul><li>\u914D\u65B9\u5B9A\u4E49\u683C\u5F0F</li><li>\u914D\u65B9\u52A0\u8F7D\u65B9\u5F0F</li><li>\u5E38\u89C1\u95EE\u9898\u4E0E\u6392\u67E5</li></ul><p>\u5F53\u524D\u5148\u63D0\u4F9B\u9875\u9762\u5360\u4F4D\uFF0C\u65B9\u4FBF\u5DE6\u4FA7\u5BFC\u822A\u5B8C\u6574\u663E\u793A\u3002</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/recipes.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const recipes = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  recipes as default
};
