# 数据库迁移

BeaverX.Admin 使用 **EF Core**。默认 **`master`** 分支为 **PostgreSQL**；MySQL 请使用 **`master-mysql`** 分支（见 [MySQL 支持](./mysql)）。

## 常用命令

在解决方案根目录 `BeaverX.Admin/` 执行：

```bash
# 添加迁移（替换 MigrationName 为有意义的名字）
dotnet ef migrations add MigrationName \
  --project BeaverX.Admin.EntityFrameworkCore \
  --startup-project BeaverX.Admin.Http.Host

# 应用迁移到数据库
dotnet ef database update \
  --project BeaverX.Admin.EntityFrameworkCore \
  --startup-project BeaverX.Admin.Http.Host
```

## 新增实体完整示例

### 1. 实体 + DbContext 映射

`AdminDbContext.cs`：

```csharp
public DbSet<WorkTicket> WorkTickets => Set<WorkTicket>();

// OnModelCreating
modelBuilder.Entity<WorkTicket>(entity =>
{
    entity.ToTable("biz_work_tickets");
    entity.HasIndex(x => x.TicketNo).IsUnique();
    entity.Property(x => x.Title).HasMaxLength(128).IsRequired();
    entity.Property(x => x.Content).HasMaxLength(2000).IsRequired();
    entity.Property(x => x.ImagesJson).HasMaxLength(4000);
});
```

表名建议：`sys_` 系统表、`biz_` 业务表。

### 2. 生成迁移

```bash
dotnet ef migrations add AddWorkTicket \
  --project BeaverX.Admin.EntityFrameworkCore \
  --startup-project BeaverX.Admin.Http.Host
```

会在 `EntityFrameworkCore/Migrations/` 生成：

- `20260622120000_AddWorkTicket.cs` — Up/Down
- `AdminDbContextModelSnapshot.cs` — 模型快照

### 3. 检查迁移内容

打开生成的 `Up` 方法，确认建表、索引、字段类型符合预期：

```csharp
migrationBuilder.CreateTable(
    name: "biz_work_tickets",
    columns: table => new
    {
        Id = table.Column<long>(type: "bigint", nullable: false),
        TicketNo = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
        // ...
    },
    constraints: table =>
    {
        table.PrimaryKey("PK_biz_work_tickets", x => x.Id);
    });
```

### 4. 更新数据库

```bash
dotnet ef database update \
  --project BeaverX.Admin.EntityFrameworkCore \
  --startup-project BeaverX.Admin.Http.Host
```

---

## 开发环境技巧

### 回滚上一次迁移（未部署生产时）

```bash
dotnet ef database update PreviousMigrationName \
  --project BeaverX.Admin.EntityFrameworkCore \
  --startup-project BeaverX.Admin.Http.Host

dotnet ef migrations remove \
  --project BeaverX.Admin.EntityFrameworkCore \
  --startup-project BeaverX.Admin.Http.Host
```

### 连接串

迁移使用 `Http.Host` 的 `appsettings.Development.json` 中的 `ConnectionStrings:Default`。

---

## 注意事项

1. **种子数据 ≠ 迁移**：菜单、字典走 `IDataSeeder`，不写在迁移里。
2. **生产环境**：先备份，再在维护窗口执行 `database update`。
3. **合并迁移**：开发中期可 `remove` 后重新 `add`，上线前保持迁移历史清晰。
4. **长整型 ID**：PostgreSQL 用 `bigint`，前端注意 JSON 精度（项目已用 `LongIdJsonConverter`）。

---

## 仅改字段、不新表

修改实体属性后同样 `migrations add`，EF 会生成 `AddColumn` / `AlterColumn` 等操作。复杂变更（拆表、改类型）建议手写迁移或分步执行。

下一步：[前端目录结构](../frontend/structure)
