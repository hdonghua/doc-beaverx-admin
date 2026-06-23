# 解决方案结构

BeaverX.Admin 采用经典分层 + BeaverX 模块化框架，职责清晰、便于扩展。

## 项目一览

```
BeaverX.Admin/
├── BeaverX.Admin.Http.Host/             # 启动入口：Program、appsettings、中间件
├── BeaverX.Admin.Http.Api/              # Controller、鉴权 Filter
├── BeaverX.Admin.Application/           # AppService、Seeder、业务编排
├── BeaverX.Admin.Application.Contracts/ # DTO、IAppService、基础设施接口
├── BeaverX.Admin.Domain/                # 实体、领域对象
├── BeaverX.Admin.Domain.Shared/         # 权限码、枚举、跨层常量
├── BeaverX.Admin.EntityFrameworkCore/   # DbContext、EF 迁移
└── BeaverX.Admin.Infrastructure/       # MinIO、JWT、SignalR、CAP 等实现
```

## 各层职责

| 层级 | 做什么 | 不做什么 |
|------|--------|----------|
| **Http.Host** | 读取配置、注册模块、CORS、JWT、启动 Kestrel | 不写业务逻辑 |
| **Http.Api** | 暴露 REST API，`[RequirePermission]` 鉴权 | 不直接访问 DbContext |
| **Application** | 业务规则、分页查询、调用仓储 | 不关心 HTTP 细节 |
| **Application.Contracts** | 对外契约（接口 + DTO） | 无实现代码 |
| **Domain** | 实体定义 | 不依赖 EF / Web |
| **Domain.Shared** | `RbacPermissionCodes`、枚举 | 被各层引用 |
| **EntityFrameworkCore** | 表映射、迁移 | 不写业务 |
| **Infrastructure** | 技术组件实现 | 不写领域规则 |

## 请求链路（以工单为例）

```
浏览器 → WorkTicketController.GetListAsync
       → IWorkTicketAppService.GetListAsync
       → IRepository<WorkTicket>
       → AdminDbContext
       → PostgreSQL
```

Controller 示例（只做转发 + 权限）：

```csharp
[RequirePermission(RbacPermissionCodes.Ticket.Work.List)]
[HttpGet("list")]
public Task<PagedResultDto<WorkTicketDto>> GetListAsync(
    [FromQuery] WorkTicketQueryDto input,
    CancellationToken cancellationToken)
    => _workTicketAppService.GetListAsync(input, cancellationToken);
```

## 依赖注入约定

实现 `IScopedDependency` 的类会被 BeaverX 自动注册为 **Scoped** 服务，无需手写 `services.AddScoped`。

```csharp
public class WorkTicketAppService : IWorkTicketAppService, IScopedDependency
{
    // ...
}
```

`IDataSeeder` 实现类在应用启动时由 `DataSeederHostService` 统一执行（菜单、字典等种子数据）。

## 新增模块时改哪些项目

| 步骤 | 项目 |
|------|------|
| 实体、枚举 | Domain、Domain.Shared |
| DTO、接口 | Application.Contracts |
| 业务实现 | Application |
| API | Http.Api |
| 数据库 | EntityFrameworkCore（迁移） |
| 菜单种子 | Application（RbacDataSeeder） |

下一步：[启动与配置](./run-and-config) → [新增业务模块](./add-module)
