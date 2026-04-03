# Backend

开源博客产品的后端工程初始化版本，技术栈固定为 **NestJS + Prisma + SQLite**。

## 当前范围

本次覆盖第十三个后端模块：**评论统计与公开站点信息消费配套收尾**。当前累计已完成：**项目初始化与数据库基础层**、**鉴权与管理员初始化基础能力**、**文章模块骨架**、**公开侧文章查询模块**、**分类管理模块**、**标签管理模块**、**公开归档模块**、**公开搜索模块**、**公开分类/标签聚合模块**、**评论基础模块**、**站点设置模块**、**评论统计与公开站点概览接口**。

已完成内容：

- 初始化 `backend` 工程
- 建立基础目录结构
- 接入 NestJS + Fastify
- 接入 Prisma + SQLite
- 落首版核心数据模型
- 提供统一响应结构、异常过滤器、健康检查接口
- 提供管理员初始化、登录、登出、当前登录态查询、密码修改接口
- 提供管理员侧文章创建、列表、详情、更新、发布、下线、归档、软删除接口
- 提供公开侧文章列表、详情、归档、搜索、分类/标签聚合接口
- 提供公开评论提交接口，支持匿名提交与单层回复校验
- 提供后台评论列表、评论详情、评论审核接口
- 提供后台评论统计概览接口，便于审核台直接消费卡片数据
- 评论公开展示仅返回已审核通过内容
- 评论提交补充基础去重与父评论合法性校验
- 提供公开站点设置接口与站点概览接口，便于前台首页/页脚直接消费
- 提供基于 JWT + HttpOnly Cookie 的基础鉴权链路
- 提供基础启动与数据库脚本

## 目录结构

```text
backend/
  prisma/
    migrations/
    schema.prisma
  src/
    common/
      filters/
      interceptors/
      types/
    modules/
      auth/
      category/
      comment/
      health/
      post/
      public-archive/
      public-comment/
      public-post/
      public-search/
      public-taxonomy/
      tag/
      user/
    prisma/
      prisma.module.ts
      prisma.service.ts
    app.controller.ts
    app.module.ts
    main.ts
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

如果你使用的是 `pnpm`：

```bash
pnpm install
```

安装完成后会自动执行 `prisma generate`。此外，`dev` 启动前也会自动触发一次 `prisma generate`，用于兜底修复 Prisma Client 缺失问题。

如果你希望手动生成，也可以执行：

```bash
pnpm prisma:generate
```

### 2. 执行数据库迁移

首次执行迁移前，如果仓库里还没有 `.env`，脚本会自动从 `.env.example` 生成一份默认 `.env`。

```bash
npm run prisma:migrate -- --name init
```

如果你使用 `pnpm`，等价命令为：

```bash
pnpm prisma:migrate -- --name init
```

### 3. 启动开发环境

```bash
npm run dev
```

如果你使用 `pnpm`，等价命令为：

```bash
pnpm dev
```

> 如果刚刚拉取了新代码，且 `package.json` 发生变化，请先重新执行一次 `pnpm install` 再启动。

> `predev` 会在 `dev` 之前自动检查 `.env`、必要时自动生成，再执行 `prisma generate`，用于兜底修复环境变量和 Prisma Client 缺失问题。

默认访问地址：

- API 服务：`http://localhost:3000`
- Swagger 文档：`http://localhost:3000/docs`
- 健康检查：`http://localhost:3000/api/system/health`

## 当前数据模型

已落库模型：

- `User`
- `Post`
- `Category`
- `Tag`
- `PostTag`
- `Comment`
- `Setting`

同时补充了系统初始化阶段常用的枚举：

- `UserRole`
- `UserStatus`
- `PostStatus`
- `PostVisibility`
- `CommentStatus`

## 已提供的接口

### 初始化管理员

- `POST /api/admin/users/init`

### 认证接口

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`

### 用户接口

- `PATCH /api/admin/users/password`

### 管理员文章接口

- `GET /api/admin/posts`
- `POST /api/admin/posts`
- `GET /api/admin/posts/:id`
- `PATCH /api/admin/posts/:id`
- `PATCH /api/admin/posts/:id/publish`
- `PATCH /api/admin/posts/:id/unpublish`
- `PATCH /api/admin/posts/:id/archive`
- `DELETE /api/admin/posts/:id`

### 管理员分类与标签接口

- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PATCH /api/admin/categories/:id`
- `GET /api/admin/tags`
- `POST /api/admin/tags`
- `PATCH /api/admin/tags/:id`

### 管理员评论接口

- `GET /api/admin/comments/stats`
- `GET /api/admin/comments`
- `GET /api/admin/comments/:id`
- `POST /api/admin/comments/:id/approve`
- `POST /api/admin/comments/:id/reject`
- `POST /api/admin/comments/:id/spam`

### 公开文章接口

- `GET /api/public/posts`
- `GET /api/public/posts/:slug`
- `GET /api/public/archives`
- `GET /api/public/search`
- `GET /api/public/categories`
- `GET /api/public/categories/:slug/posts`
- `GET /api/public/tags`
- `GET /api/public/tags/:slug/posts`

### 公开评论接口

- `GET /api/public/posts/:slug/comments`
- `POST /api/public/posts/:slug/comments`

### 公开站点接口

- `GET /api/public/site`
- `GET /api/public/site/overview`

## 评论模块说明

- 公开评论提交无需登录，默认进入 `PENDING` 待审核状态
- 公开评论列表仅返回 `APPROVED` 的顶层评论与已通过回复
- 当前版本仅支持**单层回复**，回复目标必须是同文章下的顶层评论
- 评论内容会先去除 HTML 标签，再做长度校验
- 针对相同文章做了 10 分钟内重复内容的基础拦截，命中条件为相同邮箱或相同 IP 哈希
- 后台可按状态、文章、关键词查询评论，并执行通过 / 驳回 / 标记垃圾评论

## 鉴权说明

- 管理员初始化接口仅允许在系统还没有任何用户时执行一次
- 登录成功后，服务端会通过 HttpOnly Cookie 写入 JWT
- 评论后台审核接口走现有管理员鉴权
- 密码采用带盐哈希存储，不会在接口响应中返回明文或哈希值

## 说明

- 本次评论统计与公开站点概览收尾未发生 Prisma schema 变更，因此无需新增 migration
- SQLite 数据文件已加入忽略规则，不进入版本库
- 代码注释统一使用中文，便于后续协作维护
- 当前子环境内 `node` / `npm` 命令未挂入 PATH，暂未能完成本地构建校验；主会话可在具备 Node PATH 的终端执行 `npm run build` 复核
