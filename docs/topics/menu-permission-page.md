# 专题：菜单 + 权限 + 页面一条龙

新增一个可上线功能的**最小闭环**：后端菜单种子 → 前端路由 → 权限按钮 → 联调通过。

以「工单管理」模块为例，按顺序操作即可复制到自己的业务。

---

## 第一步：定义权限码

`Domain.Shared/Rbac/RbacPermissionCodes.cs`

```csharp
public static class Ticket
{
    public static class Work
    {
        public const string List = "ticket:work:list";
        public const string Create = "ticket:work:create";
        public const string Update = "ticket:work:update";
        public const string Delete = "ticket:work:delete";
    }
}
```

---

## 第二步：种子菜单

`Application/Rbac/RbacDataSeeder.cs`

```csharp
// SeedAsync 内
newMenuIds.AddRange(await EnsureTicketMenusAsync(cancellationToken));
```

目录 + 页面 + 按钮（完整片段）：

```csharp
var ticketDir = await InsertMenuAsync(new Menu
{
    Name = "工单管理",
    MenuType = MenuType.Directory,
    Path = "/ticket",
    Icon = "customer-service",
    Sort = 15,
}, cancellationToken);

var workPage = await InsertMenuAsync(new Menu
{
    ParentId = ticketDir.Id,
    Name = "工单列表",
    MenuType = MenuType.Menu,
    Perms = RbacPermissionCodes.Ticket.Work.List,
    Path = "/ticket/work",
    Component = "ticket/work/index",
    Icon = "file",
    Sort = 1,
}, cancellationToken);

await InsertManyAsync([
    Btn(workPage.Id, "工单新增", RbacPermissionCodes.Ticket.Work.Create, 1),
    Btn(workPage.Id, "工单修改", RbacPermissionCodes.Ticket.Work.Update, 2),
    Btn(workPage.Id, "工单删除", RbacPermissionCodes.Ticket.Work.Delete, 3),
], cancellationToken);
```

重启 API，种子幂等写入。

---

## 第三步：Controller 挂权限

```csharp
[RequirePermission(RbacPermissionCodes.Ticket.Work.List)]
[HttpGet("list")]
public Task<PagedResultDto<WorkTicketDto>> GetListAsync(...) => ...;
```

每个 API 与按钮权限一一对应。

---

## 第四步：前端路由

`router/routes/modules/ticket.ts` — `name: 'WorkTicketList'`

`views/ticket/work/index.vue` — 页面实现

---

## 第五步：PATH_TO_ROUTE_NAME

```typescript
'/ticket': 'ticket',
'/ticket/work': 'WorkTicketList',
```

**三者必须一致**：后端 `path`、映射表 key、路由 `name`。

---

## 第六步：Permissions 常量

```typescript
Ticket: {
  Work: {
    List: 'ticket:work:list',
    Create: 'ticket:work:create',
    Update: 'ticket:work:update',
    Delete: 'ticket:work:delete',
  },
},
```

---

## 第七步：页面按钮

```vue
<a-button v-permission="[Permissions.Ticket.Work.Create]" @click="handleAdd">
  新增
</a-button>
```

---

## 第八步：角色与验证

1. 使用 **admin** 登录（超级管理员自动拥有新菜单）
2. 侧边栏出现「工单管理 → 工单列表」
3. 点击进入，列表正常
4. 新建角色仅勾选 `list`，确认「新增」按钮消失
5. 用开发者工具直接 `POST /api/WorkTicket`，应 403

---

## 对照表（复制填自己的模块）

| 项 | 工单示例 | 你的模块 |
|----|----------|----------|
| 目录 path | `/ticket` | |
| 页面 path | `/ticket/work` | |
| component | `ticket/work/index` | |
| 路由 name | `WorkTicketList` | |
| list 权限 | `ticket:work:list` | |
| API | `/api/WorkTicket/list` | |

---

## 常见遗漏

1. 只加了后端菜单，没加前端路由 → 404  
2. 加了路由，没加 `PATH_TO_ROUTE_NAME` → 403  
3. 权限码前后端大小写不一致 → 按钮永远不显示  
4. 普通角色未分配菜单 → 侧边栏没有入口  

完成以上八步，即完成一个标准的 BeaverX 业务页面上线闭环。
