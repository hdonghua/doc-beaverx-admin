# 新增菜单与权限

后端菜单与权限是 RBAC 的核心：**菜单决定侧边栏展示**，**权限码决定 API 与按钮**。

## 整体流程

```
1. Domain.Shared：权限码
2. RbacDataSeeder / 菜单管理：菜单 + 按钮
3. 角色分配
4. 前端静态路由 + `Permissions` 常量对齐
```

---

## 1. 权限码（Domain.Shared）

`BeaverX.Admin.Domain.Shared/Rbac/RbacPermissionCodes.cs`：

```csharp
public static class Ticket
{
    public static class Work
    {
        public const string List = "ticket:work:list";
        public const string Create = "ticket:work:create";
        public const string Update = "ticket:work:update";
        public const string Delete = "ticket:work:delete";
        public const string Process = "ticket:work:process";
    }
}
```

**约定**：`模块:资源:操作`，全小写，冒号分隔。

---

## 2. 菜单种子（RbacDataSeeder）

在 `SeedAsync` 中调用你的菜单方法：

```csharp
newMenuIds.AddRange(await EnsureTicketMenusAsync(cancellationToken));
```

### 目录菜单

```csharp
private async Task<(long DirectoryId, List<long> NewMenuIds)> EnsureTicketDirectoryAsync(
    CancellationToken cancellationToken)
{
    var existingId = await _menuRepository.GetQueryable()
        .AsNoTracking()
        .Where(x => x.Path == "/ticket" && x.MenuType == MenuType.Directory)
        .Select(x => x.Id)
        .FirstOrDefaultAsync(cancellationToken);

    if (existingId > 0)
        return (existingId, []);

    var ticketDir = await InsertMenuAsync(new Menu
    {
        Name = "工单管理",
        MenuType = MenuType.Directory,
        Path = "/ticket",
        Icon = "customer-service",
        Sort = 15,
        IsVisible = true
    }, cancellationToken);

    return (ticketDir.Id, [ticketDir.Id]);
}
```

### 页面菜单 + 按钮

```csharp
var workPage = await InsertMenuAsync(new Menu
{
    ParentId = parentId,
    Name = "工单列表",
    MenuType = MenuType.Menu,
    Perms = RbacPermissionCodes.Ticket.Work.List,  // 页面权限 = list
    Path = "/ticket/work",
    Component = "ticket/work/index",                 // 对应 views 路径
    Icon = "file",
    Sort = 1
}, cancellationToken);

await InsertManyAsync([
    Btn(workPage.Id, "工单新增", RbacPermissionCodes.Ticket.Work.Create, 1),
    Btn(workPage.Id, "工单修改", RbacPermissionCodes.Ticket.Work.Update, 2),
    Btn(workPage.Id, "工单删除", RbacPermissionCodes.Ticket.Work.Delete, 3),
], cancellationToken);
```

### 菜单类型说明

| MenuType | 用途 | 是否出现在侧边栏 |
|----------|------|------------------|
| Directory | 目录（无 component） | 是 |
| Menu | 页面 | 是 |
| Button | 按钮权限 | 否（仅作权限点） |

`Component` 字段写法：`views` 下相对路径，不含 `.vue`，如 `ticket/work/index` → `src/views/ticket/work/index.vue`。

---

## 3. Controller 绑定权限

```csharp
[RequirePermission(RbacPermissionCodes.Ticket.Work.List)]
[HttpGet("list")]
public Task<PagedResultDto<WorkTicketDto>> GetListAsync(...) => ...;

[RequirePermission(RbacPermissionCodes.Ticket.Work.Create)]
[HttpPost]
public Task<WorkTicketDto> CreateAsync(...) => ...;
```

页面级用 `list`，增删改查分别用 `create/update/delete`。

---

## 4. 角色分配

种子数据会把新菜单 ID 赋给超级管理员。普通角色需在 **系统管理 → 角色管理** 中勾选菜单。

用户登录后，`/api/Auth/me` 返回 `permissions` 数组，前端据此控制按钮。

---

## 5. 前端对齐（必做）

### component 与 views 一致

后端菜单 `component` 须与 `views/` 路径一致，例如：

| 后端 `component` | 前端视图 | 自动匹配 |
|------------------|----------|----------|
| `ticket/work/index` | `views/ticket/work/index.vue` | `WorkTicketList` |

`path` 可自定义（如 `/my-tickets`），不参与匹配。`server-menu.ts` 按 `component` 推导 route name，并补全父级 Layout。

### Permissions 常量

`src/constants/permissions.ts`：

```typescript
Ticket: {
  Work: {
    List: 'ticket:work:list',
    Create: 'ticket:work:create',
    Update: 'ticket:work:update',
    Delete: 'ticket:work:delete',
    Process: 'ticket:work:process',
  },
},
```

---

## 常见问题

| 现象 | 原因 |
|------|------|
| 侧边栏无菜单 | 种子未执行 / 角色未分配 / `isEnabled=false` |
| 菜单有、点进去 403 | 后端 `component` 与 `views/` 路径不一致 |
| 按钮不显示 | 用户无对应 button 权限码 |
| API 403 | Controller `[RequirePermission]` 与用户权限不匹配 |

重启后端后种子会自动补全新菜单（幂等：已存在则跳过）。

下一步：[数据库迁移](./migration)
