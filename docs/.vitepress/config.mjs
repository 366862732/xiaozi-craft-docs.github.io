import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'xiaozi craft技术文档',
  description: 'xiaozi craft的开发文档',
  base: '/xiaozi-craft-docs.github.io/',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '维基', link: '/user-guide/intro' },
      { text: '开发文档', link: '/xiaozi craft/intro' }
    ],

    sidebar: [
      {
        text: '用户指南',
        collapsed: false,
        items: [
          { text: '引言', link: '/user-guide/intro' },
          { text: '整合包迁移指南', link: '/user-guide/migration' },
          {
            text: '安装教程',
            collapsed: false,
            items: [
              { text: '客户端', link: '/user-guide/install/client' },
              { text: '服务端', link: '/user-guide/install/server' }
            ]
          },
          { text: 'JVM 参数', link: '/user-guide/jvm' }
        ]
      },
      {
        text: 'xiaozi craft整合包开发',
        collapsed: false,
        items: [
          {
            text: '相关信息',
            collapsed: false,
            items: [
              { text: '引言', link: '/xiaozi craft/intro' }
            ]
          },
          { text: '介绍', link: '/guide/intro' },
          { text: '快速开始', link: '/guide/quickstart' },
          { text: '环境搭建', link: '/guide/setup' },
          { text: '项目结构', link: '/guide/structure' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/366862732' }
    ]
  }
})
