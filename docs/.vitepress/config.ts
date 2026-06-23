import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'zh-CN',
  title: 'BeaverX Admin',
  description: 'BeaverX Admin 前后端保姆级上手教程',
  lastUpdated: true,
  cleanUrls: true,

  head: [['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]],

  themeConfig: {
    logo: '/beaverx-admin-logo.png',
    siteTitle: 'BeaverX Admin',

    nav: [
      { text: '指南', link: '/guide/what-is', activeMatch: '/guide/' },
      { text: '后端教程', link: '/backend/', activeMatch: '/backend/' },
      { text: '前端教程', link: '/frontend/', activeMatch: '/frontend/' },
      { text: '实战专题', link: '/topics/', activeMatch: '/topics/' },
      {
        text: '源码',
        items: [
          {
            text: 'GitHub 前端',
            link: 'https://github.com/hdonghua/beaverx-vue-admin',
          },
          {
            text: 'GitHub 后端',
            link: 'https://github.com/hdonghua/BeaverX.Admin',
          },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '项目介绍', link: '/guide/what-is' },
            { text: '环境准备', link: '/guide/prerequisites' },
            { text: '10 分钟跑起来', link: '/guide/quick-start' },
          ],
        },
      ],
      '/backend/': [
        {
          text: '后端入门',
          collapsed: false,
          items: [
            { text: '概览', link: '/backend/' },
            { text: '解决方案结构', link: '/backend/structure' },
            { text: '启动与配置', link: '/backend/run-and-config' },
          ],
        },
        {
          text: '开发实战',
          collapsed: false,
          items: [
            { text: '新增业务模块', link: '/backend/add-module' },
            { text: '新增菜单与权限', link: '/backend/add-menu-permission' },
            { text: '数据库迁移', link: '/backend/migration' },
          ],
        },
      ],
      '/frontend/': [
        {
          text: '前端入门',
          collapsed: false,
          items: [
            { text: '概览', link: '/frontend/' },
            { text: '目录与核心机制', link: '/frontend/structure' },
            { text: '启动与联调', link: '/frontend/run-and-proxy' },
          ],
        },
        {
          text: '开发实战',
          collapsed: false,
          items: [
            { text: '新增页面与路由', link: '/frontend/add-page' },
            { text: '对接服务端菜单', link: '/frontend/server-menu' },
            { text: '权限指令 v-permission', link: '/frontend/permission' },
          ],
        },
      ],
      '/topics/': [
        {
          text: '端到端实战',
          collapsed: false,
          items: [
            { text: '专题概览', link: '/topics/' },
            { text: '从零加一个 CRUD 模块', link: '/topics/crud-module' },
            { text: '菜单 + 权限 + 前端页面', link: '/topics/menu-permission-page' },
          ],
        },
      ],
    },

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/hdonghua/beaverx-vue-admin',
      },
    ],

    footer: {
      message: 'BeaverX Admin 开源文档',
      copyright: 'Copyright © BeaverX',
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    outline: {
      label: '本页目录',
    },

    search: {
      provider: 'local',
    },
  },
});
