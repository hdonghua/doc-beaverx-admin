# 目录与核心机制

前端基于 **Vue 3 + Vite + Arco Design**，采用「静态路由 + 服务端菜单」双轨机制。

## 目录结构

```
src/
├── api/server/          # 按业务模块划分的 API 封装
│   ├── rbac/            # 用户、角色、菜单
│   ├── ticket/          # 工单
│   └── common/          # 文件上传等
├── router/
│   ├── routes/modules/  # 按模块拆分的路由定义
│   ├── guard/           # 登录、权限守卫
│   └── static-menus.ts  # 纯前端静态菜单
├── views/               # 页面组件（与路由、菜单 component 对应）
├── components/          # 通用组件
├── constants/
│   └── permissions.ts   # 权限码常量（与后端一致）
├── utils/
│   ├── server-menu.ts   # 服务端菜单 → 路由树
│   └── request/         # axios 封装、Token 刷新
├── store/modules/       # Pinia：user、app 等
├── directive/permission/# v-permission 指令
└── config/settings.json # menuFromServer 等全局开关
```

---

## 核心机制：menuFromServer

`src/config/settings.json`：

```json
{
  "menuFromServer": true
}
```

为 `true` 时：

1. 登录后请求 `/api/Menu/user-menus` 获取菜单树
2. `server-menu.ts` 将菜单转为侧边栏结构
3. 路由守卫用 `allowedRouteNames` 校验页面访问权
4. 静态路由文件仍须预先注册（组件懒加载）

为 `false` 时：完全使用 `router/routes/modules/*` 本地菜单。

---

## 路由模块示例

`src/router/routes/modules/ticket.ts`：

```typescript
const TICKET: AppRouteRecordRaw = {
  path: '/ticket',
  name: 'ticket',
  component: DEFAULT_LAYOUT,
  redirect: { name: 'WorkTicketList' },
  meta: {
    locale: 'menu.ticket',
    requiresAuth: true,
    icon: 'icon-customer-service',
    order: 4,
  },
  children: [
    {
      path: 'work',
      name: 'WorkTicketList',
      component: () => import('@/views/ticket/work/index.vue'),
      meta: {
        locale: 'menu.ticket.work',
        requiresAuth: true,
        roles: ['*'],
      },
    },
  ],
};

export default TICKET;
```

新模块需在 `router/routes/index.ts`（或 `app-menus`）中 import 并合并。

---

## PATH_TO_ROUTE_NAME

后端菜单 `path` 必须映射到前端路由 `name`：

```typescript
// src/utils/server-menu.ts
const PATH_TO_ROUTE_NAME: Record<string, string> = {
  '/ticket/work': 'WorkTicketList',
};
```

**这是最常见的 403 原因。**

---

## 静态菜单（不依赖后端种子）

组件总览等演示页使用 `meta.staticMenu: true`：

```typescript
// router/routes/modules/components.ts
meta: {
  staticMenu: true,
  locale: 'menu.components',
}
```

`static-menus.ts` 会过滤并合并到侧边栏，同时加入 `allowedRouteNames`。

---

## API 层约定

`src/api/server/ticket/work-ticket.ts`：

```typescript
export function queryWorkTicketPage(req: QueryWorkTicketPageRequest) {
  return axios.get<..., ApiResponse<PagedResultDto<WorkTicketDto>>>(
    '/api/WorkTicket/list',
    {
      params: {
        keyword: req.keyword || undefined,
        page: req.current,
        pageSize: req.pageSize,
      },
    }
  );
}
```

- 路径与后端 Controller 一致
- 分页：`current` → 后端 `page`
- 响应统一 `ApiResponse<T>`

---

## 权限两层

| 层级 | 机制 | 作用 |
|------|------|------|
| 路由 | `allowedRouteNames` + 菜单 | 能否进入页面 |
| 按钮 | `v-permission` / `hasPermission` | 能否看到操作按钮 |

`meta.roles: ['*']` 只表示路由 meta 校验通过，**不替代**权限码。

下一步：[启动与 API 地址](./run-and-proxy) → [新增页面](./add-page)
