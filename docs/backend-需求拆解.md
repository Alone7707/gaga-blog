# 开源博客产品后端需求拆解

## 1. 文档目标与边界

本文基于现有 PRD、技术选型与协作规范，对开源博客产品的后端进行可执行级别的需求拆解。目标不是补充泛泛而谈的技术建议，而是为后续后端实现直接提供模块边界、数据模型、接口清单、权限规则、开发顺序与验收标准。

### 1.1 范围

本期覆盖 MVP + 已在现有文档中明确的 P1 级系统能力：

- 管理员登录与鉴权
- 文章、分类、标签管理
- 前台公开内容查询
- 评论提交、审核、基础反垃圾
- 搜索能力
- 站点设置
- 审计日志（基础）
- RSS / Sitemap 所需后端数据供给

### 1.2 非范围

以下不进入当前后端一期实现：

- 多租户
- 复杂审批流
- 富文本复杂编辑器服务端协同
- 附件中心完整体系
- 完整插件系统
- 高并发分布式架构

## 2. 技术方案建议

基于已有文档，后端技术主线保持：**Node.js + SQLite + Prisma**。

### 2.1 框架建议

建议一期采用 **NestJS + Fastify Adapter**，理由如下：

- 模块、控制器、服务、DTO、守卫边界清晰，便于长期维护
- 天然适合按 auth / post / comment / search 等模块拆分
- 便于统一处理鉴权、异常过滤、参数校验、OpenAPI 文档
- 后续若 SQLite 升级到 PostgreSQL，业务分层无需大改
- 相比 Express 手工分层，更适合开源项目协作和新人接手

### 2.2 落地原则

- HTTP 框架：NestJS + Fastify
- ORM：Prisma
- 数据库：SQLite（单站点、低到中等流量）
- 鉴权：JWT + HttpOnly Cookie
- 参数校验：class-validator / zod 二选一，建议优先 Nest 常规 DTO 方案
- 文档：Swagger/OpenAPI
- 搜索：SQLite FTS5 优先，不额外引入搜索中间件
- 日志：应用日志 + 审计日志分离

## 3. 后端模块边界

## 3.1 模块总览

建议后端按以下模块拆分：

1. app / common（应用基础层）
2. auth（认证鉴权）
3. user（管理员账户）
4. post（文章）
5. category（分类）
6. tag（标签）
7. comment（评论与审核）
8. search（搜索）
9. setting（站点配置）
10. seo-feed（RSS / Sitemap / robots 数据供给）
11. audit-log（审计日志）
12. health / system（健康检查与运行信息）

## 3.2 模块职责边界

### app / common

职责：

- 全局配置加载
- 统一响应结构
- 异常过滤与错误码映射
- 参数校验、分页参数解析、时间格式统一
- 限流、IP 提取、请求日志中间件

不负责：具体业务规则。

### auth

职责：

- 管理员登录/登出
- JWT 签发、刷新、失效控制
- Cookie 写入与校验
- 当前登录态查询

不负责：文章、评论等业务管理。

### user

职责：

- 管理员账户信息查询
- 初始化管理员
- 密码修改
- 用户状态启停（若一期保留单管理员，也建议数据模型预留）

### post

职责：

- 文章 CRUD
- 草稿/发布状态流转
- slug 生成与唯一性校验
- 摘要、封面、SEO 字段维护
- 文章与分类、标签关联
- 归档、相关文章基础能力

### category

职责：

- 分类 CRUD
- 分类 slug 管理
- 分类下文章统计
- 分类删除前关联校验

### tag

职责：

- 标签 CRUD
- 标签 slug 管理
- 标签与文章关联维护
- 标签热度统计（可由文章计数派生）

### comment

职责：

- 游客评论提交
- 评论审核、驳回、垃圾评论标记
- 单层回复控制
- 评论限流、敏感词、黑名单基础策略
- 评论列表查询（后台 / 前台）

### search

职责：

- 文章搜索索引维护
- 前台关键词搜索
- 标题 / 摘要 / 正文 / 标签联合匹配
- 搜索结果摘要截取与高亮片段生成

### setting

职责：

- 站点设置读写
- SEO 默认配置
- 评论开关与审核策略配置
- RSS / Sitemap / 主题预留配置

### seo-feed

职责：

- 输出 sitemap.xml、rss.xml、robots.txt 所需数据
- 规范化 canonical、lastmod、站点公开元信息

### audit-log

职责：

- 记录后台关键操作日志
- 记录操作人、目标对象、操作类型、关键字段变更摘要

### health / system

职责：

- 健康检查
- 版本号、运行环境摘要输出
- 数据库连通性状态

## 4. 数据模型细化

以下为建议数据模型，字段名可按 Prisma 规范微调，但业务含义不应变化。

## 4.1 User（管理员账户）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | string | PK | 用户 ID，建议 cuid |
| username | string | unique, not null | 登录名 |
| displayName | string | not null | 展示名称 |
| passwordHash | string | not null | 密码哈希 |
| role | enum | not null | `SUPER_ADMIN` / `EDITOR` |
| status | enum | not null | `ACTIVE` / `DISABLED` |
| lastLoginAt | datetime | nullable | 最近登录时间 |
| createdAt | datetime | not null | 创建时间 |
| updatedAt | datetime | not null | 更新时间 |

说明：一期可只开放单管理员，但数据模型保留多管理员能力。

## 4.2 Post（文章）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | string | PK | 文章 ID |
| title | string | not null | 标题 |
| slug | string | unique, not null | URL slug |
| summary | string | nullable | 摘要 |
| contentMarkdown | text | not null | Markdown 正文 |
| contentHtml | text | nullable | 预渲染 HTML，可选 |
| coverImage | string | nullable | 封面图 URL |
| status | enum | not null | `DRAFT` / `PUBLISHED` / `ARCHIVED` |
| visibility | enum | not null | `PUBLIC` / `PRIVATE`，一期默认仅 PUBLIC |
| seoTitle | string | nullable | SEO 标题 |
| seoDescription | string | nullable | SEO 描述 |
| authorId | string | FK | 作者 ID |
| categoryId | string | FK nullable | 主分类 |
| publishedAt | datetime | nullable | 发布时间 |
| createdAt | datetime | not null | 创建时间 |
| updatedAt | datetime | not null | 更新时间 |
| deletedAt | datetime | nullable | 软删除时间 |

说明：

- 是否保留 `contentHtml` 可视实现决定；若首版仅前端渲染 Markdown，可先不落库
- 删除建议软删除，避免误删后无法恢复

## 4.3 Category（分类）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | string | PK | 分类 ID |
| name | string | unique, not null | 分类名 |
| slug | string | unique, not null | URL slug |
| description | string | nullable | 分类描述 |
| sortOrder | int | default 0 | 排序 |
| createdAt | datetime | not null | 创建时间 |
| updatedAt | datetime | not null | 更新时间 |

## 4.4 Tag（标签）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | string | PK | 标签 ID |
| name | string | unique, not null | 标签名 |
| slug | string | unique, not null | URL slug |
| createdAt | datetime | not null | 创建时间 |
| updatedAt | datetime | not null | 更新时间 |

## 4.5 PostTag（文章标签关系）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| postId | string | PK(FK) | 文章 ID |
| tagId | string | PK(FK) | 标签 ID |
| createdAt | datetime | not null | 创建时间 |

联合唯一键：`(postId, tagId)`。

## 4.6 Comment（评论）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | string | PK | 评论 ID |
| postId | string | FK, not null | 所属文章 |
| parentId | string | FK nullable | 父评论 ID，单层回复 |
| authorName | string | not null | 评论人昵称 |
| authorEmail | string | nullable | 邮箱，用于审核追踪，不前台明文展示 |
| authorWebsite | string | nullable | 个人网站 |
| content | text | not null | 评论内容 |
| status | enum | not null | `PENDING` / `APPROVED` / `REJECTED` / `SPAM` |
| reviewReason | string | nullable | 审核备注或命中规则摘要 |
| ipHash | string | nullable | IP 哈希值，避免明文持久化 |
| userAgent | string | nullable | UA 摘要 |
| createdAt | datetime | not null | 创建时间 |
| updatedAt | datetime | not null | 更新时间 |
| approvedAt | datetime | nullable | 审核通过时间 |
| reviewedBy | string | FK nullable | 审核人 |

说明：

- 前台不返回 `authorEmail`、`ipHash`
- `parentId` 仅允许指向顶层评论，一期不支持无限嵌套

## 4.7 Setting（站点配置）

建议采用 key-value + 分组方案，便于后续扩展。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | string | PK | 配置 ID |
| group | string | index | 配置分组 |
| key | string | unique | 配置键 |
| value | text | not null | JSON 序列化值 |
| isPublic | boolean | default false | 是否可被公开接口返回 |
| description | string | nullable | 描述 |
| updatedBy | string | FK nullable | 最后更新人 |
| createdAt | datetime | not null | 创建时间 |
| updatedAt | datetime | not null | 更新时间 |

## 4.8 AuditLog（审计日志）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | string | PK | 日志 ID |
| operatorId | string | FK nullable | 操作人 |
| action | string | index | 操作类型，如 `post.publish` |
| targetType | string | index | 目标资源类型 |
| targetId | string | nullable | 目标资源 ID |
| summary | string | not null | 操作摘要 |
| payload | text | nullable | 变更快照摘要 JSON |
| ipHash | string | nullable | IP 哈希 |
| createdAt | datetime | not null | 创建时间 |

## 4.9 SearchIndex（可选独立表）

若直接使用 SQLite FTS5 虚拟表，可不单独定义 Prisma 常规模型；若需要业务层维护，可增加中间表：

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| postId | string | PK(FK) | 文章 ID |
| title | text | not null | 标题索引文本 |
| summary | text | nullable | 摘要索引文本 |
| content | text | not null | 正文索引文本 |
| tagsText | text | nullable | 标签拼接文本 |
| updatedAt | datetime | not null | 索引更新时间 |

## 5. 关键关系与约束

- User 1:N Post
- User 1:N AuditLog
- Category 1:N Post
- Post N:N Tag（通过 PostTag）
- Post 1:N Comment
- Comment 1:N Comment（但业务限制只允许单层）
- User 1:N Comment.reviewedBy
- User 1:N Setting.updatedBy

约束建议：

- `Post.slug`、`Category.slug`、`Tag.slug` 必须唯一
- 已发布文章不可没有 `slug`
- 发布文章时允许 `summary` 为空，但服务端应自动截取摘要兜底
- 删除分类前需检查是否仍有关联文章
- 删除标签时自动解除文章关联即可，不强制阻塞
- 已审核评论再次修改状态需记录审计日志

## 6. API 清单

接口统一原则：

- 后台前缀：`/api/admin`
- 前台前缀：`/api/public`
- 健康检查：`/api/system`
- 响应结构统一，错误码统一

## 6.1 Auth / User

### 后台接口

- `POST /api/admin/auth/login` 登录
- `POST /api/admin/auth/logout` 登出
- `GET /api/admin/auth/me` 获取当前登录用户
- `POST /api/admin/auth/refresh` 刷新登录态
- `POST /api/admin/users/init` 初始化管理员（仅首次可用）
- `PATCH /api/admin/users/password` 修改密码

## 6.2 Post

### 后台接口

- `GET /api/admin/posts` 文章列表（支持状态、分类、标签、关键词筛选）
- `POST /api/admin/posts` 创建文章
- `GET /api/admin/posts/:id` 获取文章详情
- `PATCH /api/admin/posts/:id` 更新文章
- `DELETE /api/admin/posts/:id` 删除文章（软删除）
- `POST /api/admin/posts/:id/publish` 发布文章
- `POST /api/admin/posts/:id/unpublish` 下线文章
- `POST /api/admin/posts/:id/archive` 归档文章
- `POST /api/admin/posts/check-slug` 校验 slug 可用性

### 前台接口

- `GET /api/public/posts` 已发布文章列表
- `GET /api/public/posts/:slug` 文章详情
- `GET /api/public/posts/:slug/related` 相关文章
- `GET /api/public/archives` 归档列表

## 6.3 Category

### 后台接口

- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `GET /api/admin/categories/:id`
- `PATCH /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`

### 前台接口

- `GET /api/public/categories`
- `GET /api/public/categories/:slug/posts`

## 6.4 Tag

### 后台接口

- `GET /api/admin/tags`
- `POST /api/admin/tags`
- `GET /api/admin/tags/:id`
- `PATCH /api/admin/tags/:id`
- `DELETE /api/admin/tags/:id`

### 前台接口

- `GET /api/public/tags`
- `GET /api/public/tags/:slug/posts`

## 6.5 Comment

### 后台接口

- `GET /api/admin/comments` 评论列表（支持状态、文章、时间筛选）
- `GET /api/admin/comments/:id` 评论详情
- `POST /api/admin/comments/:id/approve` 审核通过
- `POST /api/admin/comments/:id/reject` 驳回评论
- `POST /api/admin/comments/:id/spam` 标记垃圾评论
- `DELETE /api/admin/comments/:id` 删除评论
- `POST /api/admin/comments/batch-review` 批量审核

### 前台接口

- `GET /api/public/posts/:slug/comments` 获取公开评论列表
- `POST /api/public/posts/:slug/comments` 提交评论

## 6.6 Search

### 后台接口

- `POST /api/admin/search/rebuild` 重建搜索索引
- `GET /api/admin/search/stats` 获取索引状态

### 前台接口

- `GET /api/public/search?q=关键词&page=1&pageSize=10`

## 6.7 Setting

### 后台接口

- `GET /api/admin/settings` 获取后台全部配置
- `PATCH /api/admin/settings` 批量更新配置
- `GET /api/admin/settings/groups/:group`

### 前台接口

- `GET /api/public/site` 获取站点公开配置

## 6.8 SEO / Feed / System

### 公开接口

- `GET /rss.xml`
- `GET /sitemap.xml`
- `GET /robots.txt`
- `GET /api/system/health`
- `GET /api/system/version`

## 6.9 AuditLog

### 后台接口

- `GET /api/admin/audit-logs` 操作日志列表
- `GET /api/admin/audit-logs/:id` 操作日志详情

## 7. API 字段与交互约定

## 7.1 分页参数统一

列表接口统一支持：

- `page`：页码，从 1 开始
- `pageSize`：每页条数，默认 10，最大 100
- `sortBy`：排序字段
- `sortOrder`：`asc` / `desc`

统一分页返回：

```json
{
  "code": "OK",
  "message": "success",
  "data": {
    "list": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 0,
      "totalPages": 0
    }
  },
  "requestId": "req_xxx"
}
```

## 7.2 写接口返回约定

- 创建成功：返回完整资源对象或最小关键对象（含 id）
- 更新成功：返回最新对象
- 删除成功：返回空对象 `{}` 或最小确认对象
- 批量操作：返回成功数、失败数、失败明细

## 8. 权限模型

## 8.1 角色定义

一期建议至少保留两个角色：

- `SUPER_ADMIN`：站点最高权限
- `EDITOR`：内容管理权限

虽然 PRD 以“管理员”描述为主，但角色预留有利于后续演进。

## 8.2 权限矩阵

| 能力 | SUPER_ADMIN | EDITOR | 游客 |
|---|---|---|---|
| 登录后台 | 是 | 是 | 否 |
| 管理文章 | 是 | 是 | 否 |
| 管理分类标签 | 是 | 是 | 否 |
| 审核评论 | 是 | 是 | 否 |
| 查看审计日志 | 是 | 否 | 否 |
| 修改站点设置 | 是 | 否 | 否 |
| 初始化管理员 | 是 | 否 | 否 |
| 浏览公开内容 | 是 | 是 | 是 |
| 提交评论 | 否 | 否 | 是 |

## 8.3 鉴权规则

- 后台全部接口默认要求登录
- 站点设置、审计日志、用户管理仅 `SUPER_ADMIN` 可用
- 评论提交为匿名开放接口，但需限流与内容校验
- 公开内容接口不要求登录，只返回已发布且公开的数据

## 9. 评论审核与搜索设计

## 9.1 评论审核流程设计

评论状态流转：

`PENDING -> APPROVED / REJECTED / SPAM`

提交链路：

1. 游客提交评论
2. 服务端执行基础校验：
   - 文章是否存在且已发布
   - 内容长度是否合法
   - parentId 是否存在且符合单层回复约束
3. 执行风控规则：
   - IP 级限流
   - 同内容短时重复拦截
   - 敏感词命中
   - 黑名单邮箱 / 域名 / UA 拦截
4. 根据配置决定：
   - 默认进入 `PENDING`
   - 若命中高风险规则直接进入 `SPAM`
   - 若配置允许“可信评论免审”，可直接 `APPROVED`（一期建议先不开）
5. 后台审核后对前台可见

## 9.2 评论审核规则建议

基础规则：

- 单 IP 每分钟最多提交 3 次
- 同邮箱 / 同内容 10 分钟内重复提交直接拦截
- 内容长度限制：2~1000 字
- HTML 标签全部转义，仅保留纯文本
- 敏感词命中后保留评论，但状态置为 `PENDING` 或 `SPAM`

后台审核能力：

- 支持按状态筛选
- 支持查看命中规则摘要
- 支持批量通过 / 驳回 / 标记垃圾
- 审核动作写入审计日志

## 9.3 搜索设计

推荐方案：**SQLite FTS5 + 应用层补充过滤**。

索引范围：

- 文章标题
- 摘要
- Markdown 正文（可做简单清洗）
- 标签名称拼接字段

不纳入首版索引：

- 评论正文
- 草稿文章
- 私有文章

索引策略：

- 文章创建/更新/发布时增量更新索引
- 文章删除/归档/下线时同步移除或降权
- 提供后台手动重建接口

查询策略：

- 仅检索 `PUBLISHED` 状态文章
- 结果按匹配度 + 发布时间综合排序
- 返回字段包含标题、slug、摘要、高亮片段、标签、发布时间
- 关键词为空时返回 400，不执行全表扫描

## 10. 配置项设计

建议配置按 group 分组。

## 10.1 site 基础站点配置

- `site.title`
- `site.subtitle`
- `site.description`
- `site.baseUrl`
- `site.logoUrl`
- `site.faviconUrl`
- `site.icp`（如无则空）
- `site.footerText`

## 10.2 seo 默认配置

- `seo.defaultTitle`
- `seo.defaultDescription`
- `seo.defaultOgImage`
- `seo.enableSitemap`
- `seo.enableRobots`
- `seo.enableRss`

## 10.3 comment 评论配置

- `comment.enabled`
- `comment.requireModeration`
- `comment.maxLength`
- `comment.rateLimitPerMinute`
- `comment.blockedKeywords`
- `comment.blockedEmailDomains`
- `comment.blockedIpHashes`
- `comment.allowGuestComment`

## 10.4 content 内容配置

- `content.defaultAuthorName`
- `content.autoGenerateSummary`
- `content.summaryLength`
- `content.relatedPostsLimit`
- `content.archivePageSize`

## 10.5 auth 安全配置

- `auth.jwtExpiresIn`
- `auth.refreshExpiresIn`
- `auth.cookieSecure`
- `auth.cookieSameSite`
- `auth.loginRateLimit`

注意：

- 真正的密钥类配置（如 JWT Secret）不进 Setting 表，应走环境变量
- Setting 表只保存可运营配置，不保存敏感凭据

## 11. 错误码与返回约定

## 11.1 成功返回结构

```json
{
  "code": "OK",
  "message": "success",
  "data": {},
  "requestId": "req_xxx"
}
```

## 11.2 失败返回结构

```json
{
  "code": "POST_NOT_FOUND",
  "message": "文章不存在",
  "data": null,
  "requestId": "req_xxx",
  "errors": [
    {
      "field": "postId",
      "reason": "invalid"
    }
  ]
}
```

## 11.3 错误码分层建议

### 通用

- `OK`
- `BAD_REQUEST`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

### Auth

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_TOKEN_EXPIRED`
- `AUTH_TOKEN_INVALID`
- `AUTH_ACCOUNT_DISABLED`
- `AUTH_INIT_ALREADY_DONE`

### Post

- `POST_NOT_FOUND`
- `POST_SLUG_CONFLICT`
- `POST_STATUS_INVALID`
- `POST_NOT_PUBLISHED`

### Category / Tag

- `CATEGORY_NOT_FOUND`
- `CATEGORY_IN_USE`
- `TAG_NOT_FOUND`
- `TAG_NAME_CONFLICT`

### Comment

- `COMMENT_NOT_FOUND`
- `COMMENT_DISABLED`
- `COMMENT_CONTENT_INVALID`
- `COMMENT_RATE_LIMITED`
- `COMMENT_PARENT_INVALID`
- `COMMENT_REVIEW_STATUS_INVALID`

### Search / Setting

- `SEARCH_QUERY_EMPTY`
- `SETTING_KEY_INVALID`
- `SETTING_UPDATE_FORBIDDEN`

## 11.4 HTTP 状态码映射建议

- 200：查询/更新成功
- 201：创建成功
- 204：删除成功（若采用空响应）
- 400：参数错误、非法状态流转
- 401：未登录或 token 失效
- 403：无权限
- 404：资源不存在
- 409：唯一键冲突、资源使用中
- 429：限流
- 500：服务端异常

## 12. 后端分模块开发顺序

建议顺序按“先基础骨架，再关键链路，再外围能力”推进：

1. 项目初始化与公共基础层
2. Prisma + SQLite 数据层
3. Auth / User 模块
4. Post 模块
5. Category / Tag 模块
6. Comment 模块
7. Setting 模块
8. Search 模块
9. SEO / Feed 模块
10. AuditLog 模块
11. Swagger、测试与联调收口

### 顺序原因

- Auth 是后台全部能力前置依赖
- Post 是核心业务主链路
- Category / Tag 与 Post 耦合高，适合紧随其后
- Comment、Search、Setting 是 MVP 完整性所需
- SEO / Feed 与 AuditLog 可在主体稳定后补足

## 13. 每模块验收标准

## 13.1 项目初始化与公共基础层

验收标准：

- 项目可启动，具备基础目录结构
- 全局异常过滤、统一响应结构、请求日志可用
- Swagger 可访问
- `.env.example` 完整但不含敏感值

## 13.2 Prisma + SQLite 数据层

验收标准：

- Prisma schema 完整覆盖核心模型
- 迁移脚本可执行
- 本地 SQLite 可正常初始化
- 基础种子能力可创建管理员与默认配置

## 13.3 Auth / User

验收标准：

- 管理员可登录/登出
- Cookie 鉴权链路可用
- 未登录访问后台接口返回 401
- 首次初始化管理员仅可执行一次
- 密码存储为哈希，不返回给客户端

## 13.4 Post

验收标准：

- 文章 CRUD 可用
- 草稿与发布状态流转正确
- slug 唯一校验生效
- 前台仅能获取已发布文章
- 发布后文章可在公开详情页访问

## 13.5 Category / Tag

验收标准：

- 分类、标签 CRUD 可用
- 文章与分类标签关联正确
- 分类删除前占用校验正确
- 前台分类页、标签页数据接口可用

## 13.6 Comment

验收标准：

- 游客可提交评论
- 默认进入待审核或按配置进入预期状态
- 前台仅展示已审核评论
- 单层回复限制生效
- 限流与重复拦截规则有效

## 13.7 Setting

验收标准：

- 后台可读取并批量更新配置
- 公开接口仅返回 `isPublic=true` 配置
- 敏感配置不入库
- 配置变更写入审计日志

## 13.8 Search

验收标准：

- 已发布文章可被检索
- 草稿、下线文章不会出现在搜索结果中
- 搜索结果包含标题、摘要、slug 等必要字段
- 索引重建接口可用

## 13.9 SEO / Feed

验收标准：

- `rss.xml`、`sitemap.xml` 可访问
- 仅输出公开已发布文章
- `lastmod`、站点基础信息正确

## 13.10 AuditLog

验收标准：

- 关键后台操作可记录
- 能按时间、操作类型、操作人筛选
- 日志不记录敏感原文密码与密钥

## 13.11 Swagger / 测试 / 联调

验收标准：

- OpenAPI 文档覆盖全部开放接口
- 至少覆盖 auth、post、comment 的核心集成测试
- 前后端接口字段与错误码对齐

## 14. Git 提交粒度建议

结合仓库既有规范，建议按“一个模块一提交”执行，不混入跨模块大杂烩修改。

推荐提交序列示例：

1. `docs(backend): add backend requirement breakdown`
2. `feat(backend): init nestjs app skeleton`
3. `feat(backend): add prisma sqlite schema`
4. `feat(backend): add auth and user module`
5. `feat(backend): add post module`
6. `feat(backend): add category and tag module`
7. `feat(backend): add comment moderation module`
8. `feat(backend): add site setting module`
9. `feat(backend): add sqlite fts search module`
10. `feat(backend): add seo feed endpoints`
11. `feat(backend): add audit log module`
12. `test(backend): add core integration tests`
13. `docs(api): sync swagger and backend docs`

提交粒度要求：

- 一个 commit 只解决一个明确问题
- schema 变更与业务逻辑可以同提交，但不要跨多个独立模块
- 文档、接口、代码尽量同模块收口
- 禁止把敏感配置、数据库实体文件、远程仓库配置混入提交

## 15. 补充实现建议

- SQLite 层面开启 WAL 模式，提高读写并发容忍度
- 评论和登录接口必须启用限流
- 对外公开接口默认增加简单缓存头或应用层缓存预留
- 搜索结果和 RSS/Sitemap 生成逻辑应避免全量重复计算
- 文章发布、评论审核、设置更新应统一写审计日志

## 16. 结论

该博客后端一期应坚持“小而稳”的原则：

- 架构上，采用 NestJS 模块化边界，避免后续维护失控
- 存储上，以 SQLite + Prisma 满足单站点场景，同时为未来迁移 PostgreSQL 预留空间
- 业务上，优先做稳内容发布、评论审核、搜索与基础配置
- 协作上，按模块拆解、按模块验收、按模块提交，降低多人协作成本

这份文档可直接作为后续后端实现、接口设计和测试拆解的基线文档。