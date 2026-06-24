# 启动与配置

## 核心配置文件

主配置：`BeaverX.Admin.Http.Host/appsettings.json`  
开发覆盖：`appsettings.Development.json`（本地数据库、JWT 密钥等）

### 数据库连接串

**PostgreSQL**（`master` 分支）：

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=beaverx-admin;Username=postgres;Password=你的密码"
  }
}
```

**MySQL**（`master-mysql` 分支，需先 `git checkout master-mysql`）：

```json
{
  "ConnectionStrings": {
    "Default": "Server=localhost;Port=3306;Database=beaverx-admin;User=root;Password=你的密码;Allow User Variables=True;"
  }
}
```

完整说明见 [MySQL 支持](./mysql)。

### JWT

```json
{
  "Jwt": {
    "Issuer": "BeaverX.Admin",
    "Audience": "BeaverX.Admin.Client",
    "SecretKey": "请替换为足够长的随机字符串",
    "AccessTokenExpirationMinutes": 60,
    "RefreshTokenExpirationDays": 7
  }
}
```

### CORS（允许前端跨域）

```json
{
  "CorsOrgins": "http://localhost:5173"
}
```

多个来源用英文逗号分隔。

### MinIO（可选，文件上传）

```json
{
  "Minio": {
    "Endpoint": "localhost:9000",
    "AccessKey": "minioadmin",
    "SecretKey": "minioadmin",
    "Bucket": "beaverx-admin",
    "UseSsl": false
  }
}
```

未配置 MinIO 时，部分上传功能可能不可用，核心 RBAC 不受影响。

## 启动命令

```bash
cd BeaverX.Admin

# 首次：执行迁移
dotnet ef database update \
  --project BeaverX.Admin.EntityFrameworkCore \
  --startup-project BeaverX.Admin.Http.Host

# 启动 API
dotnet run --project BeaverX.Admin.Http.Host
```

默认地址见 `Properties/launchSettings.json`，一般为 `http://localhost:5216`。

## 启动时自动种子

`DataSeederHostService` 会执行所有 `IDataSeeder`：

- `RbacDataSeeder`：用户、角色、菜单、超级管理员
- `DictDataSeeder`：字典类型与数据

默认管理员：**admin / Admin@123**

## 日志

Serilog 输出到控制台与 `Logs/` 目录，排查接口错误时优先看日志。

## 与前端联调检查清单

| 检查项 | 说明 |
|--------|------|
| API 可访问 | 浏览器或 curl 访问 `http://localhost:5216` |
| CORS | 前端 origin 在 `CorsOrgins` 中 |
| 数据库 | 迁移成功、`sys_users` 有 admin |
| Token | 登录接口返回 `accessToken` |

下一步：[新增业务模块](./add-module)
