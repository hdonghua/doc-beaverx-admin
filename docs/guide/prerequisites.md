# 环境准备

在跑项目前，请确认本机已安装以下工具。

## 必装

| 工具 | 版本建议 | 用途 |
|------|----------|------|
| [Node.js](https://nodejs.org/) | 20.19+（Vite 8 要求，推荐 22 LTS） | 前端与文档站 |
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.x | 后端 API |
| [PostgreSQL](https://www.postgresql.org/) | 14+ | 业务数据库（后端 **`master`** 分支） |
| [MySQL](https://www.mysql.com/) | 8+ | 业务数据库（后端 **`master-mysql`** 分支，见 [MySQL 支持](/backend/mysql)） |

## 可选

| 工具 | 用途 |
|------|------|
| [MinIO](https://min.io/) | 文件上传（不配也可先跑通核心功能） |
| [pgAdmin](https://www.pgadmin.org/) / DBeaver | 可视化管理数据库 |

## 克隆代码

```bash
# 后端（PostgreSQL 默认 master；MySQL 见下方）
git clone https://github.com/hdonghua/BeaverX.Admin.git

# 若使用 MySQL：
# cd BeaverX.Admin && git checkout master-mysql

# 前端
git clone https://github.com/hdonghua/beaverx-vue-admin.git
```

下一步：[10 分钟跑起来](./quick-start)
