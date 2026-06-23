# 前端概览

前端仓库：[beaverx-vue-admin](https://github.com/hdonghua/beaverx-vue-admin)

## 技术栈

- Vue 3 + TypeScript + Vite
- Arco Design Vue、Pinia、Vue Router
- Axios、SignalR、vue-i18n

## 核心机制（必读）

当 `settings.json` 中 `menuFromServer: true` 时：

1. 菜单来自 `GET /api/Menu/user-menus`
2. 路由是否可访问由 `allowedRouteNames` 控制
3. 后端菜单 `component` 与 `views/` 路径 **自动匹配** 静态路由 route name；`component` 配错会 **403**（`path` 可自定义）
4. 按钮权限使用 `constants/permissions.ts` + `v-permission`，须与后端 `RbacPermissionCodes` 一致

## 与本教程的关系

以下章节将**逐步**补充：

- [目录与核心机制](./structure)
- [启动与联调](./run-and-proxy)
- [新增页面与路由](./add-page)
- [对接服务端菜单](./server-menu)
- [权限指令](./permission)
