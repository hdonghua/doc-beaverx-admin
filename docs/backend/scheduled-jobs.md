# 定时任务（Hangfire）

BeaverX.Admin 使用 [Hangfire](https://www.hangfire.io/) + PostgreSQL 实现周期性任务，支持 **两种方式**：

| 方式 | 适用场景 | 配置入口 |
|------|----------|----------|
| **后台 HTTP API 任务** | 运维可在管理端调整 Cron、URL；定时调用 HTTP 接口 | 管理端「系统管理 → 定时任务」或 REST API |
| **代码 `IRecurringJob`** | 复杂业务逻辑、访问 DI/数据库、无需暴露 HTTP | 实现接口并注册到 DI |

两种方式可并存，Hangfire Job Id 规则不同，互不冲突。

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│  Hangfire Server（随 API 进程启动）                            │
├─────────────────────────────────────────────────────────────┤
│  后台任务  scheduled-job:{id}  →  HttpApiScheduledJobRunner │
│  代码任务  {类型全名}           →  CodeRecurringJobRunner    │
├─────────────────────────────────────────────────────────────┤
│  存储：PostgreSQL（schema 见 Hangfire:SchemaName，默认 hangfire）│
│  面板：/hangfire（HTTP Basic，见 appsettings Hangfire:Auth）   │
└─────────────────────────────────────────────────────────────┘
```

| 组件 | 说明 |
|------|------|
| `sys_scheduled_jobs` | 后台 HTTP 任务业务表 |
| `sys_scheduled_job_logs` | 执行日志（含手动触发） |
| `ScheduledJobAppService` | CRUD、同步 Hangfire、手动触发 |
| `ScheduledJobSyncHostedService` | 启动时将数据库任务注册到 Hangfire |
| `CodeRecurringJobSyncHostedService` | 启动时将 `IRecurringJob` 注册到 Hangfire |
| `SampleDailyRecurringJob` | 代码任务示例 |

---

## 方式一：后台 HTTP API 定时任务

适合「定时 ping 某个 URL、调用 Webhook、触发无鉴权内部接口」等，**无需改代码、无需重新发布**。

### 管理端操作

1. 使用 `admin` 登录，进入 **系统管理 → 定时任务**（`/system/job`）
2. 点击 **新增任务**，填写：
   - **任务编码**（唯一，如 `sync-external-data`）
   - **Cron 表达式**（标准五段，如 `0 */5 * * *` 每 5 分钟）
   - **时区**（默认 `Asia/Shanghai`，可改）
   - **HTTP 方法 / URL / 请求头 / Body**
   - **超时秒数**（默认 30）
3. 保存后自动写入 `sys_scheduled_jobs` 并注册 Hangfire
4. 可 **手动触发**、查看 **执行日志**、启用/禁用

### REST API

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/ScheduledJob/list` | `system:job:list` | 分页列表 |
| GET | `/api/ScheduledJob/{id}` | `system:job:list` | 详情 |
| GET | `/api/ScheduledJob/{id}/logs` | `system:job:list` | 执行日志 |
| POST | `/api/ScheduledJob` | `system:job:create` | 新增 |
| PUT | `/api/ScheduledJob/{id}` | `system:job:update` | 更新 |
| DELETE | `/api/ScheduledJob/{id}` | `system:job:delete` | 删除 |
| POST | `/api/ScheduledJob/{id}/trigger` | `system:job:trigger` | 立即执行一次 |
| POST | `/api/ScheduledJob/validate-cron` | `system:job:list` | 校验 Cron 并预览下次执行时间 |

### 创建示例

```http
POST /api/ScheduledJob
Authorization: Bearer {token}
Content-Type: application/json

{
  "jobCode": "health-check",
  "name": "健康检查",
  "jobType": 1,
  "cronExpression": "0 */5 * * *",
  "timeZoneId": "Asia/Shanghai",
  "isEnabled": true,
  "httpMethod": 1,
  "httpUrl": "http://localhost:5216/api/Health",
  "httpHeadersJson": "{\"X-Custom\":\"demo\"}",
  "httpBody": null,
  "timeoutSeconds": 30
}
```

`jobType` 当前仅支持 `1`（`HttpApi`）。`httpMethod`：`1=GET`、`2=POST`、`3=PUT`、`4=DELETE`。

### 执行与日志

- Hangfire 触发 → `HttpApiScheduledJobRunner.ExecuteAsync(jobId)` → 发起 HTTP 请求
- 结果写入 `sys_scheduled_job_logs`（状态码、耗时、响应摘要）
- 任务表更新 `LastRunTime` / `LastRunStatus` / `LastRunMessage`
- 禁用任务不会自动执行，但可手动触发

### 启动同步

`appsettings.json`：

```json
{
  "Hangfire": {
    "SyncBusinessJobsOnStartup": true,
    "BusinessJobStartupSyncMode": "MergeFromHangfire"
  }
}
```

| 配置 | 说明 |
|------|------|
| `SyncBusinessJobsOnStartup` | 启动时把 `sys_scheduled_jobs` 同步到 Hangfire |
| `BusinessJobStartupSyncMode` | `MergeFromHangfire`：若 Hangfire 面板已改 Cron，回写数据库后再注册；否则以数据库为准覆盖 |

Hangfire 中后台任务的 Recurring Job Id 为 **`scheduled-job:{数据库Id}`**。

---

## 方式二：代码实现 `IRecurringJob`

适合定时清理、聚合统计、写库等 **内部业务逻辑**，可注入 `IRepository`、`IAppService` 等。

### 步骤

**1. 实现接口**（`Application` 或独立类库）：

```csharp
using BeaverX.Admin.Application.Contracts.Scheduling;
using Microsoft.Extensions.Logging;

namespace BeaverX.Admin.Application.Scheduling.Jobs;

/// <summary>
/// 示例：每天 UTC 0 点执行。
/// </summary>
public class SampleDailyRecurringJob : IRecurringJob
{
    private readonly ILogger<SampleDailyRecurringJob> _logger;

    public SampleDailyRecurringJob(ILogger<SampleDailyRecurringJob> logger)
    {
        _logger = logger;
    }

    public string CronExpression => "0 0 * * *";

    public Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Sample daily recurring job executed at {Time:O}", DateTime.UtcNow);
        return Task.CompletedTask;
    }
}
```

**2. 无需手动注册 DI**

`IRecurringJob` 继承 `IScopedDependency`，BeaverX 会自动扫描注册。

**3. 启动自动同步**

`CodeRecurringJobSyncHostedService` 在应用启动时：

- 收集容器中所有 `IRecurringJob` 实现
- 以 **类型全名** 作为 Hangfire Recurring Job Id
- 调用 `HangfireRecurringJobStartup.AddOrUpdateIfNotExists` 注册（**首次**写入 Cron；若 Hangfire 面板已存在同 Id 任务则**不覆盖**，保留运维在面板上的 Cron 修改）

**4. 执行链路**

```
Hangfire 触发
  → CodeRecurringJobRunner.ExecuteAsync(类型全名)
  → 从 DI 解析对应 IRecurringJob
  → ExecuteAsync()
```

### 注意事项

- `CronExpression` 不能为空，否则跳过注册
- 默认时区为 **服务器本地时区**（`TimeZoneInfo.Local`）
- 任务应 **幂等**、可重入；多实例部署时 Hangfire 可能并发执行，需自行防重
- 代码任务 **不会** 出现在管理端「定时任务」列表（该列表仅 `sys_scheduled_jobs`）
- 可在 Hangfire Dashboard（`/hangfire`）查看执行记录、暂停、改 Cron

项目内参考：`BeaverX.Admin.Application/Scheduling/Jobs/SampleDailyRecurringJob.cs`

---

## 两种方式对比

| | HTTP API 任务 | `IRecurringJob` |
|---|---------------|-----------------|
| 配置 | 管理端 / API | 代码 + 发布 |
| Hangfire Id | `scheduled-job:{id}` | `{命名空间.类名}` |
| 业务表 | `sys_scheduled_jobs` | 无 |
| 执行日志（业务表） | 有 | 无（看 Hangfire 面板） |
| 典型用途 | Webhook、健康检查、调外部 API | 清数据、同步、内部批处理 |

---

## Hangfire Dashboard

`appsettings.json` 片段：

```json
{
  "Hangfire": {
    "EnableDashboard": true,
    "DashboardPath": "/hangfire",
    "Auth": {
      "Enabled": true,
      "Username": "hangfire",
      "Password": "hangfire123"
    }
  }
}
```

浏览器访问 `http://localhost:5216/hangfire`，使用配置的账号密码（与业务 JWT **无关**）。

面板支持暂停/恢复周期性任务、修改 Cron（代码任务在重启时若 Id 已存在则保留面板 Cron）。

---

## 权限码

定义于 `RbacPermissionCodes.System.Job`：

| 权限码 | 说明 |
|--------|------|
| `system:job:list` | 列表、详情、日志、校验 Cron |
| `system:job:create` | 新增 |
| `system:job:update` | 编辑 |
| `system:job:delete` | 删除 |
| `system:job:trigger` | 手动触发 |

---

## 常见问题

| 现象 | 排查 |
|------|------|
| 任务从不执行 | API 进程是否运行 Hangfire Server；任务是否启用；Cron 是否正确 |
| 管理端改了 Cron 重启被还原 | 检查 `BusinessJobStartupSyncMode`；`MergeFromHangfire` 会以 Hangfire 为准回写 |
| 代码任务改了 Cron 不生效 | 启动使用 `AddOrUpdateIfNotExists`，已存在的 Job 不会覆盖；在 Dashboard 删除后重启，或改 Job Id（改类名/命名空间） |
| HTTP 任务 401 | 被调 URL 是否需要鉴权；可配 `httpHeadersJson` 传 Token |
| 多实例重复执行 | Hangfire 分布式锁 + 任务内幂等设计 |

---

## 相关源码

| 路径 | 说明 |
|------|------|
| `Application.Contracts/Scheduling/IRecurringJob.cs` | 代码任务契约 |
| `Application/Scheduling/ScheduledJobAppService.cs` | 后台任务业务 |
| `Infrastructure/Scheduling/HttpApiScheduledJobRunner.cs` | HTTP 执行器 |
| `Infrastructure/Scheduling/CodeRecurringJobRunner.cs` | 代码任务执行器 |
| `Http.Api/Controllers/ScheduledJobController.cs` | REST API |
