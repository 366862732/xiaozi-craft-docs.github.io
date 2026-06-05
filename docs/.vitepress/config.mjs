import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'xiaozi craft技术文档',
  description: 'xiaozi craft的开发文档',
  base: '/xiaozi-craft-docs.github.io/',

  locales: {
    root: {
      label: '中文',
      lang: 'zh-CN',
      title: 'xiaozi craft技术文档',
      description: 'xiaozi craft的开发文档',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: '维基', link: '/user-guide/intro' },
          { text: '开发文档', link: '/xiaozi%20craft/intro' },
          { text: 'English', link: '/en/' }
        ],
        sidebar: {
          '/user-guide/': [
            {
              text: '用户指南',
              items: [
                { text: '引言', link: '/user-guide/intro' },
                { text: '整合包迁移指南', link: '/user-guide/migration' },
                {
                  text: '安装教程',
                  items: [
                    { text: '客户端', link: '/user-guide/install/client' },
                    { text: '服务端', link: '/user-guide/install/server' }
                  ]
                },
                { text: 'JVM 参数', link: '/user-guide/jvm' }
              ]
            }
          ],
          '/guide/': [
            {
              text: '开发指南',
              items: [
                { text: '介绍', link: '/guide/intro' },
                { text: '快速开始', link: '/guide/quickstart' },
                { text: '环境搭建', link: '/guide/setup' },
                { text: '项目结构', link: '/guide/structure' }
              ]
            }
          ],
          '/xiaozi%20craft/': [
            {
              text: '相关信息',
              items: [
                { text: '引言', link: '/xiaozi%20craft/intro' }
              ]
            }
          ]
        },
        socialLinks: [
          { icon: 'github', link: 'https://github.com/366862732' }
        ]
      }
    },
    en: {
      label: 'English',
      lang: 'en-US',
      title: 'xiaozi craft Technical Documentation',
      description: 'Development documentation for xiaozi craft',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Wiki', link: '/en/user-guide/intro' },
          { text: 'Dev Docs', link: '/en/xiaozi%20craft/intro' },
          { text: '中文', link: '/user-guide/intro' }
        ],
        sidebar: {
          '/en/user-guide/': [
            {
              text: 'User Guide',
              items: [
                { text: 'Introduction', link: '/en/user-guide/intro' },
                { text: 'Migration Guide', link: '/en/user-guide/migration' },
                {
                  text: 'Installation',
                  items: [
                    { text: 'Client', link: '/en/user-guide/install/client' },
                    { text: 'Server', link: '/en/user-guide/install/server' }
                  ]
                },
                { text: 'JVM Arguments', link: '/en/user-guide/jvm' }
              ]
            }
          ],
          '/en/guide/': [
            {
              text: 'Development Guide',
              items: [
                { text: 'Overview', link: '/en/guide/intro' },
                { text: 'Quick Start', link: '/en/guide/quickstart' },
                { text: 'Environment Setup', link: '/en/guide/setup' },
                { text: 'Project Structure', link: '/en/guide/structure' }
              ]
            }
          ],
          '/en/xiaozi%20craft/': [
            {
              text: 'Related Info',
              items: [
                { text: 'Introduction', link: '/en/xiaozi%20craft/intro' }
              ]
            }
          ]
        },
        socialLinks: [
          { icon: 'github', link: 'https://github.com/366862732' }
        ]
      }
    }
  }
})
