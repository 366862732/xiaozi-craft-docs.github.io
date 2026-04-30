import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.6ab74304.js";
const __pageData = JSON.parse('{"title":"\u670D\u52A1\u7AEF","description":"","frontmatter":{},"headers":[],"relativePath":"user-guide/install/server.md"}');
const _sfc_main = { name: "user-guide/install/server.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="\u670D\u52A1\u7AEF" tabindex="-1">\u670D\u52A1\u7AEF <a class="header-anchor" href="#\u670D\u52A1\u7AEF" aria-hidden="true">#</a></h1><p>\u8FD9\u91CC\u7528\u4E8E\u7F16\u5199\u670D\u52A1\u7AEF\u5B89\u88C5\u6559\u7A0B\u3002</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("user-guide/install/server.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const server = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  server as default
};
