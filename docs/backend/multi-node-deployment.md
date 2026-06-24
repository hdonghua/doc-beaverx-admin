# 多节点部署

本文说明 BeaverX.Admin 从**单实例**扩展到**多实例**（K8s 多 Pod、多台 VM、进程集群）时需要调整的配置。默认代码路径适合本地开发与单节点生产，无需改动。

## 单实例 vs 多节点

| 能力 | 单实例（默认） | 多节点必须处理 |
|------|----------------|----------------|
| 业务缓存 | `Cache:Driver = Memory` | 改为 **Redis** |
| SignalR 推送 | 本机 Hub | **Redis Backplane** |
| 在线用户列表 | 内存 `OnlineUserTracker` | **`RedisOnlineUserTracker`**（`IDatabase`） |
| CAP 导出队列 | 内存队列 | **Redis / RabbitMQ** 等 |
| 数据库 / JWT / MinIO | 已共享或无亲和 | 通常不变 |

未处理上述项时的典型现象：

- A 节点触发的导出完成，B 节点上的用户收不到 SignalR 通知
- 在线用户列表只显示连到当前节点的连接
- 导出任务只在某一个实例上被消费，或重复消费（需配合现有幂等）

## 前置条件

1. 所有 API 实例共用同一数据库（PostgreSQL 或 MySQL，见 [MySQL 支持](./mysql)）
2. 部署 **Redis**（缓存、SignalR Backplane、在线用户追踪可共用同一实例，建议用 `Cache:KeyPrefix` 区分键空间）
3. （若使用导出/上传）MinIO 对所有实例可达
4. 各实例 `appsettings` 中 JWT、CORS 一致

## 步骤一：缓存改为 Redis

`BeaverX.Admin.Http.Host/appsettings.json`（或环境变量）：

```json
{
  "Cache": {
    "Driver": "Redis",
    "KeyPrefix": "beaverx:admin:",
    "RedisConnectionString": "your-redis:6379,password=***"
  }
}
```

也可使用 `ConnectionStrings:Redis`，与 `Cache:RedisConnectionString` 二选一即可。

## 步骤二：SignalR Redis Backplane

打开 `BeaverX.Admin.Infrastructure/BeaverXAdminInfrastructureModule.cs`，在 NuGet 中增加：

```bash
dotnet add BeaverX.Admin.Infrastructure package Microsoft.AspNetCore.SignalR.StackExchangeRedis
```

修改 `AddSignalR()`：

```csharp
using BeaverX.Admin.Infrastructure.Realtime;
using StackExchange.Redis;

// ConfigureServices 内：
var redisConnection = RealtimeDistributedExtensions.ResolveRedisConnectionString(configuration);

services.AddSignalR()
    .AddStackExchangeRedis(redisConnection, options =>
    {
        options.Configuration.ChannelPrefix = RedisChannel.Literal("BeaverXAdmin:SignalR:");
    })
    .AddJsonProtocol(options =>
        JsonIdSerializationExtensions.ConfigureSnowflakeIdJsonSerialization(
            options.PayloadSerializerOptions));
```

说明：

- 无 Backplane 时，`SignalRRealtimeNotifier.SendToUserAsync` 只能找到**本节点**上的连接
- 配置 Backplane 后，任意节点发布的消息会广播到持有该用户连接的节点
- 前端 Hub 地址不变：`/hubs/notifications`

## 步骤三：分布式在线用户（IDatabase）

### 原理

- 接口：`IOnlineUserTracker`（Contracts）
- 默认：`OnlineUserTracker` — 进程内 `ConcurrentDictionary`
- 分布式：`RedisOnlineUserTracker` — 注入 StackExchange.Redis 的 **`IDatabase`**，数据存 Redis Hash：

  ```
  Key:   {Cache:KeyPrefix}online:connections
  Field: connectionId
  Value: JSON { userId, userName, nickName, connectedAt }
  ```

不使用 `IDistributedCache`，与业务缓存驱动解耦：即使 `Cache:Driver` 仍为 Memory，只要 Redis 可达即可单独启用在线用户追踪（生产环境仍建议缓存一并切 Redis）。

### 启用方式

在 **`BeaverX.Admin.Http.Host/BeaverXAdminHttpHostModule.cs`** 的 `ConfigureServices` 末尾添加（必须在 Infrastructure 模块注册之后）：

```csharp
using BeaverX.Admin.Infrastructure.Realtime;

public override void ConfigureServices(ServiceConfigurationContext context)
{
    var services = context.Services;
    var configuration = context.Configuration;

    // ... JWT、CORS 等现有代码 ...

    services.AddRedisOnlineUserTracker(configuration);
}
```

`AddRedisOnlineUserTracker`（`RealtimeDistributedExtensions`）会：

1. `TryAddSingleton<IConnectionMultiplexer>`
2. `TryAddSingleton<IDatabase>`（`multiplexer.GetDatabase()`）
3. `Replace` 默认的 `IOnlineUserTracker` → `RedisOnlineUserTracker`

**不要**在 Infrastructure 模块里改默认绑定；单实例部署保持原样即可。

### 验证

1. 启动两个 API 实例（不同端口），共用同一 Redis
2. 两个浏览器分别登录，各连一个实例的 SignalR
3. 调用在线用户查询 API（需相应权限）— 应看到两个用户、连接数合计正确
4. 踢下线或登出后，Hash 中对应 field 应被删除

## 步骤四：CAP 共享队列

编辑 `BeaverXAdminInfrastructureModule.ConfigureCap`，替换：

```csharp
options.UseInMemoryMessageQueue();
```

例如使用 Redis Streams（需对应 CAP 包）：

```csharp
options.UseRedis(redisConnectionString);
```

具体包名与版本以 [CAP 官方文档](https://cap.dotnetcore.xyz/) 为准。不改则导出消息无法跨节点投递。

## 负载均衡与 WebSocket

- 推荐：**SignalR Backplane + 普通轮询**，不强制会话粘性
- 若暂无法配置 Backplane，可临时对 `/hubs/*` 开启粘性会话，但在线用户与 CAP 问题仍需按上文处理

## 最小改造示例（Host 模块）

```csharp
public override void ConfigureServices(ServiceConfigurationContext context)
{
    var services = context.Services;
    var configuration = context.Configuration;

    // ... 现有 Authentication、Cors 等 ...

    // 多节点：分布式在线用户（单实例可省略）
    services.AddRedisOnlineUserTracker(configuration);
}
```

Infrastructure 模块内完成 SignalR Backplane 与 CAP 队列替换；Host 模块仅负责**可选**覆盖 `IOnlineUserTracker`。

## 相关源码

| 文件 | 说明 |
|------|------|
| `Infrastructure/Realtime/OnlineUserTracker.cs` | 默认内存实现 |
| `Infrastructure/Realtime/RedisOnlineUserTracker.cs` | Redis `IDatabase` 实现 |
| `Infrastructure/Realtime/RealtimeDistributedExtensions.cs` | `AddRedisOnlineUserTracker` |
| `Infrastructure/BeaverXAdminInfrastructureModule.cs` | SignalR、CAP、默认 Tracker 注册 |
| `Http.Host/BeaverXAdminHttpHostModule.cs` | 建议在此启用 Redis Tracker |

更多细节见后端仓库 [README — 多节点部署](https://github.com/hdonghua/BeaverX.Admin#多节点部署)。
