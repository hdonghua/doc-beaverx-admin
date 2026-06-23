# 10 分钟跑起来

按顺序执行以下步骤，可在本地完整体验 BeaverX Admin。

## 1. 配置数据库

编辑 `BeaverX.Admin.Http.Host/appsettings.Development.json`：

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=beaverx-admin;Username=postgres;Password=你的密码"
  }
}
```

## 2. 执行迁移并启动后端

```bash
cd BeaverX.Admin

dotnet ef database update \
  --project BeaverX.Admin.EntityFrameworkCore \
  --startup-project BeaverX.Admin.Http.Host

dotnet run --project BeaverX.Admin.Http.Host
```

看到 API 监听 `http://localhost:5216` 即成功。首次启动会自动执行种子数据（用户、菜单、字典等）。

## 3. 配置并启动前端

```bash
cd beaverx-vue-admin
npm install
```

确认 `.env.development` 中：

```ini
VITE_API_BASE_URL=http://localhost:5216
```

启动：

```bash
npm run dev
```

浏览器打开 `http://localhost:5173`，使用 **admin / Admin@123** 登录。

## 4. 验证清单

- [ ] 能打开登录页并登录成功
- [ ] 左侧出现「系统管理」等菜单
- [ ] 打开用户管理、字典管理等页面无 403

## 常见问题

| 现象 | 处理 |
|------|------|
| 前端 401 / 无法登录 | 检查 `VITE_API_BASE_URL`、后端是否启动、CORS |
| 数据库连接失败 | 检查 PostgreSQL 服务、连接串、库是否已创建 |
| 迁移报错 | 确认 .NET SDK 版本与 EF 工具已安装 |

::: info 教程待续
后续章节将详细讲解 [后端开发](/backend/) 与 [前端开发](/frontend/)，以及 [加菜单加权限](/topics/menu-permission-page) 的完整流程。
:::
