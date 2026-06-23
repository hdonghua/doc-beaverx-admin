# 权限控制

BeaverX 前端权限与后端 `RbacPermissionCodes` **字符串完全一致**，分路由级与元素级两层。

## 权限数据来源

登录后 `/api/Auth/me` 返回用户 `permissions: string[]`，存入 Pinia `userStore`。

```typescript
// 示例：用户 permissions 片段
['ticket:work:list', 'ticket:work:create', 'system:user:list']
```

---

## 1. 路由级（能否进页面）

由服务端菜单 + `allowedRouteNames` 控制，见 [服务端菜单](./server-menu)。

用户无某页面菜单权限时，侧边栏不显示，直接访问 URL 会跳转 403。

---

## 2. 按钮级 v-permission

指令定义：`src/directive/permission/index.ts`

```typescript
import { hasPermission, normalizePermissionCodes } from '@/utils/permission-check';

function checkPermission(el: HTMLElement, binding: DirectiveBinding) {
  const permissionValues = normalizePermissionCodes(binding.value);
  if (!hasPermission(permissionValues) && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}
```

**无权限时元素从 DOM 移除**（不是 disabled）。

### 用法

```vue
<script setup>
  import { Permissions } from '@/constants/permissions';
</script>

<template>
  <a-button v-permission="[Permissions.Ticket.Work.Create]">
    新增工单
  </a-button>

  <a-button v-permission="[Permissions.Ticket.Work.Delete]">
    删除
  </a-button>
</template>
```

也支持裸字符串（不推荐，易拼错）：

```vue
<a-button v-permission="['ticket:work:delete']">删除</a-button>
```

---

## 3. 脚本内判断 hasPermission

指令无法用于复杂逻辑时，用 hook：

```typescript
import usePermission from '@/hooks/permission';
import { Permissions } from '@/constants/permissions';

const { hasPermission, hasAllPermissions } = usePermission();

if (hasPermission(Permissions.Ticket.Work.Update)) {
  // 显示编辑入口
}

// 需同时拥有多个权限
if (hasAllPermissions([
  Permissions.System.User.List,
  Permissions.System.User.ResetPassword,
])) {
  // ...
}
```

底层实现 `src/utils/permission-check.ts`：

```typescript
export function hasPermission(
  value: string | string[],
  mode: PermissionCheckMode = 'any'
): boolean {
  const codes = normalizePermissionCodes(value);
  const userPerms = useUserStore().permissions ?? [];
  if (mode === 'all') {
    return codes.every((c) => userPerms.includes(c));
  }
  return codes.some((c) => userPerms.includes(c));
}
```

---

## 4. Permissions 常量

`src/constants/permissions.ts` 与后端一一对应：

```typescript
export const Permissions = {
  Ticket: {
    Work: {
      List: 'ticket:work:list',
      Create: 'ticket:work:create',
      Update: 'ticket:work:update',
      Delete: 'ticket:work:delete',
      Process: 'ticket:work:process',
    },
  },
} as const;
```

**新增权限时前后端必须同步修改。**

---

## 5. 后端 API 权限

即使前端隐藏按钮，用户仍可能直接调 API。后端 Controller 必须用 `[RequirePermission]`：

```csharp
[RequirePermission(RbacPermissionCodes.Ticket.Work.Delete)]
[HttpDelete("{id}")]
public Task DeleteAsync(long id, CancellationToken cancellationToken)
    => _workTicketAppService.DeleteAsync(id, cancellationToken);
```

安全原则：**前端控体验，后端控安全**。

---

## 权限与菜单类型

| 类型 | perms 用途 |
|------|-----------|
| 页面 Menu | 列表权限，如 `ticket:work:list` |
| 按钮 Button | 操作权限，如 `ticket:work:create` |

角色分配菜单时，勾选页面会自动关联其下按钮（取决于角色管理 UI 实现）。

---

## 演示页

`src/views/components/permission/index.vue` 提供可交互的 `v-permission` 示例，在「组件总览 → 权限演示」查看。

下一步：[专题：完整 CRUD](../topics/crud-module)
