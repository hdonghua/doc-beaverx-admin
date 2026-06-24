# BeaverX Admin 文档站

基于 [VitePress](https://vitepress.dev/) 的保姆级教程，帮助快速上手前后端项目。

## 本地开发

```bash
npm install
npm run docs:dev
```

默认访问：<http://localhost:5173>

## 构建与预览

```bash
npm run docs:build
npm run docs:preview
```

## 相关仓库

- 前端：[beaverx-vue-admin](https://github.com/hdonghua/beaverx-vue-admin)
- 后端：[BeaverX.Admin](https://github.com/hdonghua/BeaverX.Admin)（默认 `master` 为 PostgreSQL；MySQL 请切 **`master-mysql`** 分支，见文档 [MySQL 支持](/backend/mysql)）

界面截图放在仓库根目录 `imgs/`，运行 `npm run docs:dev` / `docs:build` 时会自动同步到 `docs/public/imgs/`。预览页见文档站「[功能预览](/guide/screenshots)」。
