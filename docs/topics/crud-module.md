# 专题：从零完成 CRUD 模块

本章串联前后端，以 **系统配置 Config**（简单）和 **工单 WorkTicket**（带上传）为例，走完 CRUD 全流程。

## 架构总览

```
PostgreSQL
    ↑
AdminDbContext ← WorkTicket 实体
    ↑
WorkTicketAppService ← 业务逻辑
    ↑
WorkTicketController ← REST + RequirePermission
    ↑
work-ticket.ts ← axios
    ↑
views/ticket/work/index.vue ← 页面
```

---

## 后端四件套

### 实体

```csharp
public class WorkTicket : FullAuditedEntity
{
    public string TicketNo { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public WorkTicketStatus Status { get; set; }
}
```

### AppService 分页

```csharp
public async Task<PagedResultDto<WorkTicketDto>> GetListAsync(
    WorkTicketQueryDto input,
    CancellationToken cancellationToken = default)
{
    var query = _workTicketRepository.GetQueryable().AsNoTracking();

    if (!string.IsNullOrWhiteSpace(input.Keyword))
    {
        var kw = input.Keyword.Trim();
        query = query.Where(x =>
            x.TicketNo.Contains(kw) ||
            x.Title.Contains(kw) ||
            x.Content.Contains(kw));
    }

    if (input.Status.HasValue)
        query = query.Where(x => x.Status == input.Status.Value);

    var (skip, take) = RbacQueryHelper.GetPaging(input);
    var total = await query.LongCountAsync(cancellationToken);
    var items = await query
        .OrderByDescending(x => x.CreationTime)
        .Skip(skip).Take(take)
        .ToListAsync(cancellationToken);

    return new PagedResultDto<WorkTicketDto>(
        total,
        items.Select(ToDto).ToList());
}
```

### Controller 全套端点

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/api/WorkTicket/list` | `ticket:work:list` |
| GET | `/api/WorkTicket/{id}` | `ticket:work:list` |
| POST | `/api/WorkTicket` | `ticket:work:create` |
| PUT | `/api/WorkTicket/{id}` | `ticket:work:update` |
| DELETE | `/api/WorkTicket/{id}` | `ticket:work:delete` |

### 迁移

```bash
dotnet ef migrations add AddWorkTicket \
  --project BeaverX.Admin.EntityFrameworkCore \
  --startup-project BeaverX.Admin.Http.Host

dotnet ef database update \
  --project BeaverX.Admin.EntityFrameworkCore \
  --startup-project BeaverX.Admin.Http.Host
```

---

## 前端四件套

### API

```typescript
export function queryWorkTicketPage(req: QueryWorkTicketPageRequest) {
  return axios.get('/api/WorkTicket/list', {
    params: { page: req.current, pageSize: req.pageSize, keyword: req.keyword },
  });
}

export function addWorkTicket(req: CreateWorkTicketRequest) {
  return axios.post('/api/WorkTicket', req);
}

export function updateWorkTicket(req: UpdateWorkTicketRequest) {
  const { id, ...body } = req;
  return axios.put(`/api/WorkTicket/${id}`, body);
}

export function deleteWorkTicket(id: EntityId) {
  return axios.delete(`/api/WorkTicket/${id}`);
}
```

### 列表页模式

1. `query` 响应式对象存筛选 + 分页
2. `loadData()` 调 API 填 `list` 和 `pagination.total`
3. 表格 `@page-change` 更新 `query.current` 再 `loadData`
4. 弹窗表单：`handleAdd` / `handleEdit` / `handleSubmit`
5. 删除：`Modal.confirm` + `deleteWorkTicket`

### 参考文件

| 复杂度 | 参考页面 |
|--------|----------|
| 标准 CRUD | `src/views/system/config/index.vue` |
| 带字典 | `src/views/ticket/work/index.vue` |
| 带上传 | `src/views/ticket/work/index.vue` |
| 独立处理流 | `src/views/ticket/process/index.vue` |

---

## 更简单示例：系统配置

后端：`ConfigController` + `ConfigAppService`  
前端：`src/views/system/config/index.vue`  
菜单 component：`system/config/index`

适合第一次练手，无文件上传。

---

## 开发顺序建议

1. 后端实体 + 迁移 + 跑通 Swagger/Postman
2. 权限码 + Controller
3. RbacDataSeeder 菜单
4. 前端路由 + API + 页面
5. 后端菜单 `component` 与 `views/` 对齐 + `Permissions` 常量
6. 角色分配 + 联调

---

## 验收清单

- [ ] 列表分页、关键字搜索
- [ ] 新增 / 编辑 / 删除
- [ ] 无权限用户看不到按钮、调 API 返回 403
- [ ] 后端菜单 `component` 与 `views/` 一致，无 403 误拦
- [ ] 字典项（如有）在 `DictDataSeeder` 已配置

下一步：[菜单 + 权限 + 页面一条龙](./menu-permission-page)
