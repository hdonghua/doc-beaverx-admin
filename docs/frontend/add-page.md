# 新增页面

以 **工单列表** 为例，演示前端新增业务页面的标准步骤。

## 开发清单

1. 路由模块 `router/routes/modules/*.ts`
2. 页面 `views/模块/页面/index.vue`
3. API `api/server/模块/*.ts`
4. 权限常量 `constants/permissions.ts`（`v-permission` 用）
5. 国际化 `locale/zh-CN/menu.ts`（可选）
6. 后端菜单管理：配置相同 `path` / `component` / 权限

---

## 1. 定义路由

`src/router/routes/modules/ticket.ts`：

```typescript
import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const TICKET: AppRouteRecordRaw = {
  path: '/ticket',
  name: 'ticket',
  component: DEFAULT_LAYOUT,
  redirect: { name: 'WorkTicketList' },
  meta: {
    locale: 'menu.ticket',
    requiresAuth: true,
    icon: 'icon-customer-service',
    order: 4,
  },
  children: [
    {
      path: 'work',
      name: 'WorkTicketList',
      component: () => import('@/views/ticket/work/index.vue'),
      meta: {
        locale: 'menu.ticket.work',
        requiresAuth: true,
        roles: ['*'],
      },
    },
  ],
};

export default TICKET;
```

确保在 `app-menus` 或路由入口中 export 该模块。

---

## 2. API 封装

`src/api/server/ticket/work-ticket.ts`：

```typescript
import axios from 'axios';
import { ApiResponse } from '@/utils/request';
import { PagedResultDto, QueryPageRequest } from '@/types/page';

export interface WorkTicketDto {
  id: string;
  ticketNo: string;
  title: string;
  content: string;
  status: number;
  images: WorkTicketImageDto[];
  creationTime: string;
}

export function queryWorkTicketPage(req: QueryPageRequest & { keyword?: string }) {
  return axios.get<unknown, ApiResponse<PagedResultDto<WorkTicketDto>>>(
    '/api/WorkTicket/list',
    {
      params: {
        keyword: req.keyword || undefined,
        page: req.current,
        pageSize: req.pageSize,
      },
    }
  );
}

export function addWorkTicket(req: { title: string; content: string; images?: WorkTicketImageDto[] }) {
  return axios.post<typeof req, ApiResponse<WorkTicketDto>>('/api/WorkTicket', req);
}

export function deleteWorkTicket(id: string) {
  return axios.delete<string, ApiResponse<void>>(`/api/WorkTicket/${id}`);
}
```

---

## 3. 页面骨架

`src/views/ticket/work/index.vue` 典型结构：

```vue
<template>
  <PageContainer :breadcrumb="['menu.ticket', 'menu.ticket.work']">
    <a-card class="general-card">
      <!-- 搜索区 -->
      <a-form :model="query" layout="inline" class="search-form">
        <a-form-item>
          <a-input v-model="query.keyword" placeholder="工单号/标题" allow-clear />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="search">查询</a-button>
        </a-form-item>
      </a-form>

      <!-- 工具栏 -->
      <div class="toolbar">
        <a-button
          type="primary"
          v-permission="[Permissions.Ticket.Work.Create]"
          @click="handleAdd"
        >
          新增工单
        </a-button>
      </div>

      <!-- 表格 -->
      <a-table
        row-key="id"
        :loading="loading"
        :columns="columns"
        :data="list"
        :pagination="pagination"
        @page-change="onPageChange"
      />
    </a-card>
  </PageContainer>
</template>

<script lang="ts" setup>
  import { onMounted, reactive, ref } from 'vue';
  import PageContainer from '@/components/page-container/index.vue';
  import { Permissions } from '@/constants/permissions';
  import { queryWorkTicketPage, type WorkTicketDto } from '@/api/server/ticket/work-ticket';

  const loading = ref(false);
  const list = ref<WorkTicketDto[]>([]);
  const query = reactive({ keyword: '', current: 1, pageSize: 10 });
  const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: true });

  const loadData = async () => {
    loading.value = true;
    try {
      const { data } = await queryWorkTicketPage(query);
      list.value = data.items;
      pagination.total = data.totalCount;
      pagination.current = query.current;
    } finally {
      loading.value = false;
    }
  };

  const search = () => {
    query.current = 1;
    loadData();
  };

  const onPageChange = (page: number) => {
    query.current = page;
    loadData();
  };

  onMounted(loadData);
</script>
```

可参考 `src/views/system/config/index.vue` 作为更完整的 CRUD 模板。

---

## 4. 权限常量

`src/constants/permissions.ts`：

```typescript
Ticket: {
  Work: {
    List: 'ticket:work:list',
    Create: 'ticket:work:create',
    Update: 'ticket:work:update',
    Delete: 'ticket:work:delete',
  },
},
```

---

## 5. 后端菜单配置

在 **菜单管理**（或种子）中配置：

| 字段 | 示例 | 说明 |
|------|------|------|
| `component` | `ticket/work/index` | **必须**与 `views/ticket/work/index.vue` 对应 |
| `path` | `/ticket/work` | 路由地址，可自定义 |
| `perms` | `ticket:work:list` | 页面权限码 |

前端按 `component` 自动匹配 route name，**无需修改** `server-menu.ts`。

---

## 6. 国际化（可选）

`src/locale/zh-CN/menu.ts`：

```typescript
'menu.ticket': '工单管理',
'menu.ticket.work': '工单列表',
```

---

## 文件上传示例（最多 3 张图）

```typescript
import { uploadFile } from '@/api/server/common/file';
import { MAX_WORK_TICKET_IMAGES } from '@/api/server/ticket/work-ticket';

const customUpload = (option: RequestOption) => {
  const { fileItem, onSuccess, onError } = option;
  uploadFile(fileItem.file as File, 'work-ticket')
    .then(({ data }) => {
      uploadedImages.value.push(data);
      onSuccess?.(data);
    })
    .catch(onError);
};
```

模板中限制数量：

```vue
<a-upload
  :limit="MAX_WORK_TICKET_IMAGES"
  :custom-request="customUpload"
  list-type="picture-card"
/>
```

---

## 自测步骤

1. 后端种子已有 `/ticket/work` 菜单
2. 超级管理员登录，侧边栏可见「工单列表」
3. 能打开页面、列表有数据
4. 无 `create` 权限时「新增」按钮不显示

下一步：[服务端菜单详解](./server-menu) → [权限控制](./permission)
