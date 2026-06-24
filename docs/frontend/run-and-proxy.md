# 启动与 API 配置

## 环境要求

- Node.js 20.19+（Vite 8 要求，推荐 22 LTS）
- pnpm / npm / yarn 均可

## 安装与启动

```bash
cd beaverx-vue-admin
npm install
npm run dev
```

默认开发地址：`http://localhost:5173`

---

## API 地址配置

项目通过环境变量指定后端地址，**不使用 Vite proxy**，axios 直接请求 API。

`.env.development`：

```ini
VITE_API_BASE_URL=http://localhost:5216
```

`src/utils/request/index.ts` 读取并设置：

```typescript
if (import.meta.env.VITE_API_BASE_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
}
```

### 生产构建

创建 `.env.production`（或 CI 注入）：

```ini
VITE_API_BASE_URL=https://api.your-domain.com
```

```bash
npm run build
```

产物在 `dist/`，由 Nginx 等静态托管。

---

## 跨域说明

开发时浏览器从 `5173` 访问 `5216`，需后端配置 CORS：

```json
// BeaverX.Admin.Http.Host/appsettings.json
{
  "CorsOrgins": "http://localhost:5173"
}
```

若联调报 CORS 错误，检查：

1. 后端是否启动
2. `VITE_API_BASE_URL` 是否与后端端口一致
3. `CorsOrgins` 是否包含前端 origin（含协议、端口）

---

## Token 与请求头

登录成功后 Token 存入本地，axios 拦截器自动附加：

```http
Authorization: Bearer {accessToken}
```

Token 过期会走 `refresh-token.ts` 刷新逻辑。

---

## SignalR / 实时功能

`src/utils/realtime-hub.ts` 同样使用 `VITE_API_BASE_URL` 连接 Hub：

```typescript
const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
```

确保 WebSocket 未被代理错误拦截。

---

## 联调检查清单

| 步骤 | 命令 / 地址 |
|------|-------------|
| 启动 API | `dotnet run --project BeaverX.Admin.Http.Host` |
| 启动前端 | `npm run dev` |
| 登录 | admin / Admin@123 |
| 看网络面板 | 请求应指向 `localhost:5216/api/...` |

下一步：[新增页面](./add-page)
