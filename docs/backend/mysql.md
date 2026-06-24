# MySQL 支持

BeaverX.Admin 除默认的 **PostgreSQL**（`master` 分支）外，提供 **MySQL 8+** 版本，代码在独立分支维护。

| 分支 | 数据库 |
|------|--------|
| `master` | PostgreSQL |
| **`master-mysql`** | **MySQL** |

前端 [beaverx-vue-admin](https://github.com/hdonghua/beaverx-vue-admin) **无需修改**，只需后端切到对应分支并配置连接串。

::: tip 在线演示
[beaverxadmin.com](https://beaverxadmin.com/) 使用 **MySQL** 分支（`master-mysql`）部署。
:::

## 1. 切换分支

```bash
git clone https://github.com/hdonghua/BeaverX.Admin.git
cd BeaverX.Admin

git fetch origin
git checkout master-mysql
```

若本地已有仓库：

```bash
git fetch origin
git checkout master-mysql
git pull origin master-mysql
```

## 2. 环境要求

- MySQL **8.0+**（或兼容的 MariaDB，需自行验证）
- 已创建空库，例如 `beaverx-admin`
- [.NET 10 SDK](https://dotnet.microsoft.com/download)

## 3. 配置连接串

`BeaverX.Admin.Http.Host/appsettings.Development.json`：

```json
{
  "ConnectionStrings": {
    "Default": "Server=localhost;Port=3306;Database=beaverx-admin;User=root;Password=你的密码;Allow User Variables=True;"
  }
}
```

| 参数 | 说明 |
|------|------|
| `Allow User Variables=True` | **Hangfire.MySql 必需**，否则定时任务存储无法正常工作 |

## 4. 迁移与启动

与 PostgreSQL 相同：

```bash
cd BeaverX.Admin

dotnet ef database update \
  --project BeaverX.Admin.EntityFrameworkCore \
  --startup-project BeaverX.Admin.Http.Host

dotnet run --project BeaverX.Admin.Http.Host
```

默认管理员：**admin / Admin@123**

## 与 `master`（PostgreSQL）的差异

| 组件 | PostgreSQL（`master`） | MySQL（`master-mysql`） |
|------|------------------------|-------------------------|
| EF Core 模块 | `BeaverXEntityFrameworkCorePostgreSqlModule` | `BeaverXEntityFrameworkCoreMySqlModule` |
| DbDriver | `AdminPostgreSqlDbDriverOptionsBuilder` | `AdminMySqlDbDriverOptionsBuilder` |
| Hangfire | PostgreSQL | MySQL |
| CAP 存储 | PostgreSQL | MySQL |
| 连接串示例 | `Host=...;Port=5432;...` | `Server=...;Port=3306;...` |

业务 API、权限、菜单、前端对接方式**完全一致**。

## 时间字段（UTC）

MySQL 的 `DATETIME` 不带时区。`master-mysql` 分支已做：

- 写入库前：`UtcDateTimeSaveChangesInterceptor` 统一为 UTC
- API 返回：全局 UTC JSON 序列化（ISO 8601，带 `Z` 后缀）

避免前端出现「差 8 小时」等问题。

## 注意事项

1. **不要**在 `master` 与 `master-mysql` 之间共用同一套 EF 迁移文件做库切换；应使用目标分支自带的 Migrations。
2. 从 PostgreSQL 迁数据到 MySQL 需自行导出/导入，项目不提供自动迁移工具。
3. 本地开发 PostgreSQL、生产 MySQL 时：开发用 `master`，部署前切 `master-mysql` 并重新跑迁移。

## 常见问题

| 现象 | 处理 |
|------|------|
| Hangfire 启动报错 | 连接串是否包含 `Allow User Variables=True` |
| 时间少/多 8 小时 | 确认使用 `master-mysql` 最新代码（含 UTC 序列化） |
| 迁移失败 | 空库是否已创建；MySQL 用户是否有 DDL 权限 |
| 仍连 PostgreSQL | 确认已 `git checkout master-mysql` 并重新编译 |

返回 [启动与配置](./run-and-config) · [数据库迁移](./migration)
