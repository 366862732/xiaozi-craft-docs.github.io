import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.6ab74304.js";
const __pageData = JSON.parse('{"title":"\u4E8B\u4EF6\u76D1\u542C","description":"","frontmatter":{},"headers":[],"relativePath":"guide/events.md"}');
const _sfc_main = { name: "guide/events.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="\u4E8B\u4EF6\u76D1\u542C" tabindex="-1">\u4E8B\u4EF6\u76D1\u542C <a class="header-anchor" href="#\u4E8B\u4EF6\u76D1\u542C" aria-hidden="true">#</a></h1><p>\u8FD9\u91CC\u53EF\u4EE5\u8865\u5145\u4E8B\u4EF6\u76F8\u5173\u6587\u6863\uFF0C\u4F8B\u5982\uFF1A</p><ul><li>\u4E8B\u4EF6\u6CE8\u518C</li><li>\u56DE\u8C03\u5904\u7406</li><li>\u8C03\u8BD5\u65B9\u6CD5</li></ul><p>\u521B\u5EFA\u8FD9\u4E2A\u9875\u9762\u540E\uFF0C\u5DE6\u4FA7\u5BFC\u822A\u4E2D\u7684 <code>\u4E8B\u4EF6\u76D1\u542C</code> \u9879\u5C31\u53EF\u4EE5\u6B63\u5E38\u70B9\u51FB\u8FDB\u5165\u3002</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("guide/events.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const events = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  events as default
};
