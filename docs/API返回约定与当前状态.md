# API 返回约定与当前状态

本文档用于收口当前仓库内前后台接口的统一响应 envelope、常见字段约定，以及已经落地的公开接口 / 后台核心接口返回结构。

> 基准实现位置：
> - 后端统一成功包裹：`backend/src/common/interceptors/transform-response.interceptor.ts`
> - 后端统一错误包裹：`backend/src/common/filters/http-exception.filter.ts`
> - 前端统一解包：`frontend/src/api/http.ts`

---

## 1. 顶层 envelope 约定

### 1.1 成功响应

后端所有成功响应都会先经过全局拦截器包装，统一结构如下：

```json
{
  "code": "OK",
  "message": "success",
  "data": {},
  "requestId": "req_xxx"
}
```

字段说明：

- `code`：成功时固定为 `OK`
- `message`：成功时固定为 `success`
- `data`：真正的业务数据主体
- `requestId`：请求追踪 id，便于联调和排查日志

前端约定：

- `frontend/src/api/http.ts` 中的 `request<T>()` 会统一返回 `response.data.data`
- 页面层和具体 API 模块默认**不再关心**顶层 `code/message/requestId`
- 因此前端看到的“接口返回”通常是**解包后的业务 data**，不是 HTTP 原始包体

### 1.2 错误响应

错误响应由全局异常过滤器统一整理，当前结构如下：

```json
{
  "code": "BAD_REQUEST",
  "message": "请求失败原因",
  "data": null,
  "requestId": "req_xxx",
  "errors": []
}
```

字段说明：

- `code`：业务错误码；若业务模块显式抛出 `code`，则优先保留，否则按 HTTP 状态码映射
- `message`：错误信息，可能是字符串，也可能是字符串数组
- `data`：错误时固定为 `null`
- `requestId`：请求追踪 id
- `errors`：可选字段，主要用于 DTO 校验等附加错误明细

当前已确认的通用错误码映射：

- `400 -> BAD_REQUEST`
- `401 -> UNAUTHORIZED`
- `403 -> FORBIDDEN`
- `404 -> NOT_FOUND`
- `409 -> CONFLICT`
- `429 -> RATE_LIMITED`
- 其他 -> `INTERNAL_ERROR`

### 1.3 前端错误消费约定

前端 Axios 响应拦截器当前行为：

- 若返回 `401`，会触发 `authStore.markUnauthenticated()`
- 抛给业务层的错误对象默认只保留 `message`
- 页面层当前**通常拿不到完整错误 envelope**，只消费最终 message

这意味着：

- 若后续页面需要基于 `code` 做细粒度交互，需扩展 `frontend/src/api/http.ts`
- 当前联调阶段优先保证 `message` 明确、稳定、可读

---

## 2. 当前 data 层返回风格

虽然顶层 envelope 已统一，但 `data` 内部的业务结构当前仍分为两类：

### 2.1 直接返回对象 / 列表主体

适用于列表、统计、概览、设置集合等接口。

典型形式：

```json
{
  "list": [],
  "pagination": {}
}
```

或：

```json
{
  "stats": {},
  "recentPosts": [],
  "recentComments": []
}
```

或：

```json
{
  "groups": [],
  "items": []
}
```

### 2.2 带业务键包裹的详情 / 动作响应

适用于详情、创建、更新、审核动作等接口。

典型形式：

```json
{
  "post": {}
}
```

```json
{
  "comment": {}
}
```

```json
{
  "overview": {}
}
```

```json
{
  "page": {}
}
```

### 2.3 当前结论

**顶层 envelope 已统一，data 内部业务键尚未完全统一。**

当前推荐记忆方式：

- **列表接口**：优先返回 `list + pagination`
- **统计/概览接口**：优先返回 `stats` 或语义化聚合对象
- **详情接口**：常见为 `{ post }`、`{ comment }`、`{ page }`
- **创建/更新/动作接口**：通常沿用详情键名，如 `{ post }`、`{ category }`、`{ tag }`、`{ comment }`

因此前端 API 层需要在少数接口上显式解包，不能假设所有 `data` 都是“平铺对象”。

---

## 3. 分页 pagination 统一字段

当前前后台列表接口普遍采用如下分页结构：

```json
{
  "page": 1,
  "pageSize": 10,
  "total": 25,
  "totalPages": 3
}
```

字段定义：

- `page`：当前页码，从 1 开始
- `pageSize`：每页条数
- `total`：总记录数
- `totalPages`：总页数；当 `total = 0` 时，当前实现返回 `0`

当前已采用该分页结构的接口包括：

### 公开接口

- `GET /api/public/posts`
- `GET /api/public/categories/:slug/posts`
- `GET /api/public/tags/:slug/posts`
- `GET /api/public/search`
- `GET /api/public/archives`

### 后台接口

- `GET /api/admin/posts`
- `GET /api/admin/comments`
- `GET /api/admin/categories`
- `GET /api/admin/tags`

备注：

- `GET /api/public/archives` 当前**不分页**，返回 `list + total`
- `GET /api/public/posts/:slug/comments` 当前**不分页**，返回 `list`
- 仪表盘、站点设置、站点概览、统计接口也不使用 `pagination`

---

## 4. 公开接口返回约定

## 4.1 公开文章列表 `GET /api/public/posts`

data 结构：

```json
{
  "list": [
    {
      "id": "",
      "title": "",
      "slug": "",
      "summary": null,
      "coverImage": null,
      "publishedAt": null,
      "createdAt": "",
      "updatedAt": "",
      "author": {
        "id": "",
        "displayName": ""
      },
      "category": {
        "id": "",
        "name": "",
        "slug": ""
      },
      "tags": [
        {
          "id": "",
          "name": "",
          "slug": ""
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

说明：

- 只返回 `PUBLISHED + PUBLIC + publishedAt <= now + deletedAt = null` 的文章
- `summary`、`coverImage`、`publishedAt` 允许为 `null`
- `author` 为最小公开作者信息，仅含 `id/displayName`
- `category` 允许为 `null`
- `tags` 始终为数组

前端现状：

- `frontend/src/api/public.ts` 已对 `list/pagination` 做兜底 normalize

## 4.2 公开文章详情 `GET /api/public/posts/:slug`

data 结构：

```json
{
  "post": {
    "id": "",
    "title": "",
    "slug": "",
    "summary": null,
    "contentMarkdown": "",
    "contentHtml": null,
    "coverImage": null,
    "seoTitle": null,
    "seoDescription": null,
    "publishedAt": null,
    "createdAt": "",
    "updatedAt": "",
    "author": {
      "id": "",
      "displayName": ""
    },
    "category": {
      "id": "",
      "name": "",
      "slug": "",
      "description": null
    },
    "tags": []
  }
}
```

说明：

- 当前详情接口是**带 `post` 包裹**，不是平铺详情对象
- 该问题已在前端 `getPublicPostDetail()` 中统一解包
- 不存在或不可见时抛出：`POST_NOT_FOUND`

## 4.3 公开分类列表 `GET /api/public/categories`

data 结构：

```json
{
  "list": [
    {
      "id": "",
      "name": "",
      "slug": "",
      "description": null,
      "sortOrder": 0,
      "postCount": 0,
      "createdAt": "",
      "updatedAt": ""
    }
  ]
}
```

说明：

- `postCount` 仅统计公开且已发布文章
- 当前无分页

## 4.4 公开分类文章列表 `GET /api/public/categories/:slug/posts`

data 结构：

```json
{
  "category": {
    "id": "",
    "name": "",
    "slug": "",
    "description": null,
    "sortOrder": 0,
    "createdAt": "",
    "updatedAt": ""
  },
  "list": [],
  "pagination": {}
}
```

说明：

- `category` 为当前分类元信息
- `list` 中每项结构与公开文章列表一致
- 分类不存在时抛出：`CATEGORY_NOT_FOUND`

## 4.5 公开标签列表 `GET /api/public/tags`

data 结构：

```json
{
  "list": [
    {
      "id": "",
      "name": "",
      "slug": "",
      "postCount": 0,
      "createdAt": "",
      "updatedAt": ""
    }
  ]
}
```

说明：

- 当前按公开文章使用次数倒序返回
- 当前无分页

## 4.6 公开标签文章列表 `GET /api/public/tags/:slug/posts`

data 结构：

```json
{
  "tag": {
    "id": "",
    "name": "",
    "slug": "",
    "createdAt": "",
    "updatedAt": ""
  },
  "list": [],
  "pagination": {}
}
```

说明：

- `tag` 为当前标签元信息
- 标签不存在时抛出：`TAG_NOT_FOUND`

## 4.7 公开搜索 `GET /api/public/search`

data 结构：

```json
{
  "keyword": "Vue",
  "list": [
    {
      "id": "",
      "title": "",
      "slug": "",
      "summary": "",
      "excerpt": "",
      "coverImage": null,
      "publishedAt": "",
      "createdAt": "",
      "updatedAt": "",
      "author": {
        "id": "",
        "displayName": ""
      },
      "category": null,
      "tags": []
    }
  ],
  "pagination": {}
}
```

说明：

- 查询参数为 `q`
- 业务返回字段名为 `keyword`，值为 trim 后的搜索词
- `excerpt` 为后端生成的纯文本截断片段
- 未传关键词时抛出：`SEARCH_QUERY_EMPTY`

## 4.8 公开归档 `GET /api/public/archives`

data 结构：

```json
{
  "list": [
    {
      "year": "2026",
      "count": 3,
      "months": [
        {
          "month": "2026-04",
          "monthLabel": "2026-04",
          "count": 2,
          "posts": []
        }
      ]
    }
  ],
  "total": 3,
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

说明：

- 当前按 `year -> months -> posts` 分桶
- `posts` 项不含 author，但含 `category/tags`
- 当前已支持分页，分页大小优先读取后台设置 `content.archivePageSize`
- 前端 `frontend/src/api/public.ts` 已兼容旧回包，联调期即使缺少 `pagination` 也不会导致页面空白

## 4.9 公开评论列表 `GET /api/public/posts/:slug/comments`

data 结构：

```json
{
  "list": [
    {
      "id": "",
      "parentId": null,
      "authorName": "",
      "authorWebsite": null,
      "content": "",
      "createdAt": "",
      "replies": [
        {
          "id": "",
          "parentId": "",
          "authorName": "",
          "authorWebsite": null,
          "content": "",
          "createdAt": ""
        }
      ]
    }
  ]
}
```

说明：

- 只返回已审核通过的顶层评论及其已通过的单层回复
- 当前无分页
- 前端已对 `list` 做数组兜底

## 4.10 公开评论创建 `POST /api/public/posts/:slug/comments`

data 结构：

```json
{
  "comment": {
    "id": "",
    "status": "PENDING",
    "createdAt": "",
    "postId": "",
    "parentId": null,
    "authorName": "",
    "content": "",
    "reviewMessage": "评论已提交，等待管理员审核"
  }
}
```

说明：

- 当前创建后默认进入 `PENDING`
- 仅支持回复文章下的**顶层评论**
- 常见业务错误码：
  - `POST_NOT_FOUND`
  - `COMMENT_CONTENT_INVALID`
  - `COMMENT_PARENT_INVALID`
  - `COMMENT_DUPLICATED`

## 4.11 公开站点设置 `GET /api/public/site`

data 结构：

```json
{
  "groups": [
    {
      "group": "site",
      "items": []
    }
  ],
  "values": {
    "site": {},
    "seo": {},
    "comment": {},
    "content": {},
    "static": {}
  }
}
```

说明：

- 仅返回 `isPublic = true` 的设置项
- `values` 是前端优先消费的聚合结果
- `groups` 保留原始分组视角，便于后续扩展

## 4.12 站点概览 `GET /api/public/site/overview`

data 结构：

```json
{
  "overview": {
    "site": {},
    "seo": {},
    "comment": {},
    "content": {},
    "static": {},
    "stats": {
      "publishedPostCount": 0,
      "approvedCommentCount": 0
    },
    "latestPublishedPost": {
      "id": "",
      "title": "",
      "slug": "",
      "publishedAt": ""
    }
  }
}
```

说明：

- 当前首页、公共布局、About 页面都会消费该接口或其相关数据
- `latestPublishedPost` 允许为 `null`
- 前端已对 `stats` 和 `latestPublishedPost` 做兜底 normalize

## 4.13 About 静态页 `GET /api/public/site/pages/about`

data 结构：

```json
{
  "page": {
    "slug": "about",
    "title": "关于我",
    "summary": null,
    "content": null,
    "seoTitle": "关于我",
    "seoDescription": null,
    "updatedAt": null
  }
}
```

说明：

- 当前静态页最小支持只有 `about`
- 其他 slug 会抛出：`STATIC_PAGE_NOT_FOUND`
- 前端已对标题、SEO 标题、时间字段做兜底 normalize

---

## 5. 后台核心接口返回约定

## 5.1 后台仪表盘概览 `GET /api/admin/dashboard/overview`

data 结构：

```json
{
  "stats": {
    "posts": {
      "total": 0,
      "published": 0,
      "draft": 0
    },
    "categories": {
      "total": 0
    },
    "tags": {
      "total": 0
    },
    "comments": {
      "total": 0,
      "pending": 0,
      "approved": 0
    }
  },
  "recentPosts": [],
  "recentComments": []
}
```

说明：

- 这是**直接对象返回**，没有 `overview` 包裹
- `recentPosts` / `recentComments` 为后台首页最近动态
- `recentComments.authorEmail` 在后端与前端类型中均按 `string | null` 处理

## 5.2 后台文章列表 `GET /api/admin/posts`

data 结构：

```json
{
  "list": [
    {
      "id": "",
      "title": "",
      "slug": "",
      "summary": null,
      "status": "DRAFT",
      "visibility": "PUBLIC",
      "publishedAt": null,
      "createdAt": "",
      "updatedAt": "",
      "coverImage": null,
      "author": {},
      "category": null,
      "counts": {
        "comments": 0,
        "tags": 0
      }
    }
  ],
  "pagination": {}
}
```

说明：

- 为直接列表对象，不带 `post` 包裹
- 前端已对 `list/pagination` 做最小兜底

## 5.3 后台文章详情 `GET /api/admin/posts/:id`

data 结构：

```json
{
  "post": {
    "id": "",
    "title": "",
    "slug": "",
    "summary": null,
    "deletedAt": null,
    "contentMarkdown": "",
    "contentHtml": null,
    "coverImage": null,
    "status": "DRAFT",
    "visibility": "PUBLIC",
    "seoTitle": null,
    "seoDescription": null,
    "publishedAt": null,
    "createdAt": "",
    "updatedAt": "",
    "author": {},
    "category": null,
    "tags": []
  }
}
```

说明：

- 详情接口为 `{ post }` 包裹
- 创建、更新、发布、下线、归档动作也都返回 `{ post }`

## 5.4 后台文章创建 / 更新 / 动作

接口：

- `POST /api/admin/posts`
- `PATCH /api/admin/posts/:id`
- `PATCH /api/admin/posts/:id/publish`
- `PATCH /api/admin/posts/:id/unpublish`
- `PATCH /api/admin/posts/:id/archive`
- `DELETE /api/admin/posts/:id`

data 结构统一为：

```json
{
  "post": {}
}
```

说明：

- 当前后台文章状态流转已经明确拆分为“内容保存”和“独立动作”两类
- 常见业务错误码：
  - `POST_NOT_FOUND`
  - `POST_STATUS_INVALID`
  - `POST_PUBLISH_INVALID`
  - `POST_SLUG_CONFLICT`
  - `CATEGORY_NOT_FOUND`
  - `TAG_NOT_FOUND`

## 5.5 后台评论统计 `GET /api/admin/comments/stats`

data 结构：

```json
{
  "stats": {
    "total": 0,
    "pending": 0,
    "approved": 0,
    "rejected": 0,
    "spam": 0,
    "pendingRate": 0,
    "approvedRate": 0,
    "latestComment": null
  }
}
```

说明：

- 统计接口带 `stats` 包裹
- `latestComment` 允许为 `null`

## 5.6 后台评论列表 `GET /api/admin/comments`

data 结构：

```json
{
  "list": [],
  "pagination": {}
}
```

说明：

- 为直接列表对象，不带 `comment` 包裹
- 列表项含 `replyCount` 与 `approvedReplyCount`
- `authorEmail`、`authorWebsite`、`ipHash`、`userAgent` 都允许为 `null`

## 5.7 后台评论详情与审核动作

接口：

- `GET /api/admin/comments/:id`
- `POST /api/admin/comments/:id/reply`
- `POST /api/admin/comments/:id/approve`
- `POST /api/admin/comments/:id/reject`
- `POST /api/admin/comments/:id/spam`

data 结构统一为：

```json
{
  "comment": {
    "id": "",
    "postId": "",
    "parentId": null,
    "authorName": "",
    "authorEmail": null,
    "authorWebsite": null,
    "content": "",
    "status": "PENDING",
    "reviewReason": null,
    "ipHash": null,
    "userAgent": null,
    "createdAt": "",
    "updatedAt": "",
    "approvedAt": null,
    "post": {},
    "parent": null,
    "reviewedBy": null,
    "replies": []
  }
}
```

说明：

- `POST /api/admin/comments/:id/reply` 与详情/审核动作一样，统一返回 `{ comment }`
- 管理员回复当前仅支持顶层评论，创建后默认进入 `APPROVED`，并出现在详情 `replies` 中
- 评论不存在时抛出：`COMMENT_NOT_FOUND`
- 对回复目标不合法时会抛出：`COMMENT_REPLY_TARGET_INVALID`

## 5.8 后台站点设置 `GET /api/admin/settings`

data 结构：

```json
{
  "groups": [
    {
      "group": "site",
      "items": []
    }
  ],
  "items": []
}
```

说明：

- 直接返回设置集合，不带 `settings` 包裹
- `GET /api/admin/settings/groups/:group` 则返回单个分组对象：

```json
{
  "group": "site",
  "items": []
}
```

- `PATCH /api/admin/settings` 当前返回更新后的完整设置集合，即与 `GET /api/admin/settings` 同结构

## 5.9 后台分类接口

接口：

- `GET /api/admin/categories` ->

```json
{
  "list": [],
  "pagination": {}
}
```

- `POST /api/admin/categories` ->

```json
{
  "category": {}
}
```

- `PATCH /api/admin/categories/:id` ->

```json
{
  "category": {}
}
```

说明：

- 当前没有后台分类详情单独接口
- 常见业务错误码：`CATEGORY_NOT_FOUND`、`CATEGORY_NAME_CONFLICT`、`CATEGORY_SLUG_CONFLICT`

## 5.10 后台标签接口

接口：

- `GET /api/admin/tags` ->

```json
{
  "list": [],
  "pagination": {}
}
```

- `POST /api/admin/tags` ->

```json
{
  "tag": {}
}
```

- `PATCH /api/admin/tags/:id` ->

```json
{
  "tag": {}
}
```

说明：

- 当前没有后台标签详情单独接口
- 常见业务错误码：`TAG_NOT_FOUND`、`TAG_NAME_CONFLICT`、`TAG_SLUG_CONFLICT`

---

## 6. 前端 API 层当前解包与兜底状态

### 已统一处理顶层 envelope

- `frontend/src/api/http.ts` 已统一解包 `data`
- 业务 API 不需要再手动写 `response.data.data`

### 已显式处理业务键包裹的接口

- `getPublicPostDetail()` -> 解包 `response.post`
- `createPublicComment()` -> 解包 `response.comment`
- `getPublicSiteOverview()` -> 解包 `response.overview`
- `getPublicStaticPage()` -> 解包 `response.page`

### 已补充最小结构兜底的接口

- 公开文章列表：`list/pagination`
- 公开分类文章列表：`list/pagination`
- 公开标签文章列表：`list/pagination`
- 公开搜索：`keyword/list/pagination`
- 公开归档：`list/total/pagination`
- 公开评论列表：`list`
- 公开 site overview：`stats/latestPublishedPost`
- 后台文章列表：`list/pagination`

### 仍需持续注意的点

- 后台仪表盘、设置、评论等接口目前主要依赖“代码事实稳定”，还没有统一的 normalize 层
- 新页面联调时不要假设后台所有详情接口都平铺返回
- 类型定义个别地方与后端存在轻微空值偏差，应以后端代码事实为准

---

## 7. 当前状态结论

截至本轮文档收口，项目内接口返回现状可总结为：

1. **顶层成功/失败 envelope 已统一**
2. **列表分页字段已基本统一为 `list + pagination`**
3. **公开主链路（posts / taxonomy / search / archives / comments / site / about）均已接通**
4. **后台核心链路（dashboard / posts / comments / settings / taxonomy）均已具备可联调结构**
5. **data 内部业务键仍存在“平铺对象”和“语义包裹对象”并存的情况，这是当前最需要明确记忆的契约事实**

简化记忆：

- 看见列表接口，先找 `list/pagination`
- 看见详情或动作接口，优先警惕 `{ post } / { comment } / { page } / { overview } / { stats }`
- 遇到不确定的接口，以 controller 返回值和前端 API 封装为准，不凭想当然推断
