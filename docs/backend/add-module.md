# 新增业务模块

本章以 **工单 WorkTicket** 为例，演示从实体到 API 的完整后端开发流程。

## 开发清单

1. Domain.Shared：枚举
2. Domain：实体
3. Application.Contracts：DTO + 接口
4. Application：AppService
5. Http.Api：Controller
6. EntityFrameworkCore：DbContext + 迁移
7. Domain.Shared：权限码
8. RbacDataSeeder：菜单（见下一章）

---

## 1. 枚举 `WorkTicketStatus`

`BeaverX.Admin.Domain.Shared/Ticket/WorkTicketStatus.cs`：

```csharp
namespace BeaverX.Admin.Domain.Shared.Ticket;

public enum WorkTicketStatus
{
    Pending = 0,
    Processing = 1,
    Resolved = 2,
    Closed = 3
}
```

---

## 2. 实体 `WorkTicket`

`BeaverX.Admin.Domain/Ticket/WorkTicket.cs`：

```csharp
using BeaverX.Admin.Domain.Shared.Ticket;
using BeaverX.Domain.Entities;

namespace BeaverX.Admin.Domain.Ticket;

public class WorkTicket : FullAuditedEntity
{
    public string TicketNo { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public WorkTicketStatus Status { get; set; } = WorkTicketStatus.Pending;
    public long UserId { get; set; }
    public string? ImagesJson { get; set; }
}
```

`FullAuditedEntity` 已包含 `Id`、`CreationTime`、`CreatorId` 等审计字段。

---

## 3. DTO 与接口

`Application.Contracts/Ticket/Dtos/WorkTicketDtos.cs`：

```csharp
public class WorkTicketDto
{
    public long Id { get; set; }
    public string TicketNo { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public WorkTicketStatus Status { get; set; }
    public List<WorkTicketImageDto> Images { get; set; } = [];
    public DateTime CreationTime { get; set; }
}

public class WorkTicketQueryDto : PagedQueryDto
{
    public string? Keyword { get; set; }
    public WorkTicketStatus? Status { get; set; }
}

public class CreateWorkTicketDto
{
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public List<WorkTicketImageDto>? Images { get; set; }
}
```

`IWorkTicketAppService.cs`：

```csharp
public interface IWorkTicketAppService
{
    Task<PagedResultDto<WorkTicketDto>> GetListAsync(
        WorkTicketQueryDto input, CancellationToken cancellationToken = default);
    Task<WorkTicketDto> CreateAsync(
        CreateWorkTicketDto input, CancellationToken cancellationToken = default);
    // UpdateAsync、DeleteAsync ...
}
```

---

## 4. AppService 实现

`Application/Ticket/WorkTicketAppService.cs` 核心片段：

```csharp
public class WorkTicketAppService : IWorkTicketAppService, IScopedDependency
{
    private readonly IRepository<WorkTicket> _workTicketRepository;
    private readonly ICurrentUser _currentUser;

    public async Task<WorkTicketDto> CreateAsync(
        CreateWorkTicketDto input,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(input.Title))
            throw new BusinessException("工单标题不能为空");

        var entity = new WorkTicket
        {
            TicketNo = $"WT{DateTime.UtcNow:yyyyMMddHHmmss}",
            Title = input.Title.Trim(),
            Content = input.Content.Trim(),
            UserId = _currentUser.Id!.Value,
            ImagesJson = SerializeImages(input.Images)
        };

        await _workTicketRepository.InsertAsync(entity, cancellationToken: cancellationToken);
        return ToDto(entity);
    }
}
```

分页查询使用 `RbacQueryHelper.GetPaging` + `LongCountAsync`，与系统配置等模块一致。

---

## 5. Controller

`Http.Api/Controllers/WorkTicketController.cs`：

```csharp
public class WorkTicketController : BeaverXControllerBase
{
    private readonly IWorkTicketAppService _workTicketAppService;

    [RequirePermission(RbacPermissionCodes.Ticket.Work.List)]
    [HttpGet("list")]
    public Task<PagedResultDto<WorkTicketDto>> GetListAsync(
        [FromQuery] WorkTicketQueryDto input,
        CancellationToken cancellationToken)
        => _workTicketAppService.GetListAsync(input, cancellationToken);

    [RequirePermission(RbacPermissionCodes.Ticket.Work.Create)]
    [HttpPost]
    public Task<WorkTicketDto> CreateAsync(
        [FromBody] CreateWorkTicketDto input,
        CancellationToken cancellationToken)
        => _workTicketAppService.CreateAsync(input, cancellationToken);
}
```

路由约定：`WorkTicketController` → `/api/WorkTicket/*`（BeaverX 约定）。

---

## 6. DbContext 注册

`AdminDbContext.cs`：

```csharp
public DbSet<WorkTicket> WorkTickets => Set<WorkTicket>();

// OnModelCreating 内
modelBuilder.Entity<WorkTicket>(entity =>
{
    entity.ToTable("biz_work_tickets");
    entity.HasIndex(x => x.TicketNo).IsUnique();
    entity.Property(x => x.Title).HasMaxLength(128).IsRequired();
    entity.Property(x => x.Content).HasMaxLength(2000).IsRequired();
    entity.Property(x => x.ImagesJson).HasMaxLength(4000);
});
```

---

## 7. 权限码

`Domain.Shared/Rbac/RbacPermissionCodes.cs`：

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

命名规范：`模块:资源:操作`，与前端 `Permissions` 常量保持一致。

---

## 自测 API

启动后端后，用 Postman 或前端调用：

```http
GET /api/WorkTicket/list?page=1&pageSize=10
Authorization: Bearer {accessToken}
```

无权限返回 403；有 `ticket:work:list` 则返回分页数据。

下一步：[新增菜单与权限](./add-menu-permission) → [数据库迁移](./migration)
