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
3. **新增页面**必须在 `PATH_TO_ROUTE_NAME` 中配置 path → 路由 name，否则 **403**

## 与本教程的关系

以下章节将**逐步**补充：

- [目录与核心机制](./structure)
- [启动与联调](./run-and-proxy)
- [新增页面与路由](./add-page)
- [对接服务端菜单](./server-menu)
- [权限指令](./permission)
