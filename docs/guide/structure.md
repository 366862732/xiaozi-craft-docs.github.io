# 项目结构

当前文档项目的主要结构如下：

```text
docs/
  .vitepress/    # VitePress 配置
  guide/         # 指南文档
  index.md       # 首页
```

## 说明

- `.vitepress/config.ts` 用来配置顶部导航和左侧侧边栏
- `guide/` 目录中的每个 `.md` 文件会成为左侧菜单中的一个页面
- 只要页面被侧边栏引用并且文件存在，就会正常显示导航
