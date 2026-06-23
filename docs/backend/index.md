# 后端概览

后端仓库：[BeaverX.Admin](https://github.com/hdonghua/BeaverX.Admin)

## 技术栈

- .NET 10、ASP.NET Core、BeaverX 模块化框架
- EF Core + PostgreSQL
- JWT + Refresh Token
- SignalR、Hangfire、CAP、MinIO（按模块启用）

## 分层一览

```
Http.Host        → 启动、配置、中间件
Http.Api         → Controller、鉴权
Application      → AppService、Seeder、业务编排
Application.Contracts → DTO、接口
Domain           → 实体
Domain.Shared    → 权限码、枚举
EntityFrameworkCore → DbContext、迁移
Infrastructure   → MinIO、JWT、SignalR 等实现
```

## 与本教程的关系

以下章节将**逐步**补充（当前为目录占位）：

- [解决方案结构](./structure)
- [启动与配置](./run-and-config)
- [新增业务模块](./add-module)
- [新增菜单与权限](./add-menu-permission)
- [数据库迁移](./migration)
- [多节点部署](./multi-node-deployment)

建议先完成 [10 分钟跑起来](/guide/quick-start)。
