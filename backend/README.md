# Backend

开源博客产品的后端工程初始化版本，技术栈固定为 **NestJS + Prisma + SQLite**。

## 当前范围

本次覆盖前三个后端模块：**项目初始化与数据库基础层**、**鉴权与管理员初始化基础能力**、**文章模块骨架**。

已完成内容：

- 初始化 `backend` 工程
- 建立基础目录结构
- 接入 NestJS + Fastify
- 接入 Prisma + SQLite
- 落首版核心数据模型
- 提供统一响应结构、异常过滤器、健康检查接口
- 提供管理员初始化、登录、登出、当前登录态查询、密码修改接口
- 提供管理员侧文章创建、列表、详情、更新接口
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
      search/
      setting/
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

## 已提供的鉴权接口

### 初始化管理员

- `POST /api/admin/users/init`

### 认证接口

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`

### 用户接口

- `PATCH /api/admin/users/password`

### 文章接口

- `GET /api/admin/posts`
- `POST /api/admin/posts`
- `GET /api/admin/posts/:id`
- `PATCH /api/admin/posts/:id`

## 鉴权说明

- 管理员初始化接口仅允许在系统还没有任何用户时执行一次
- 登录成功后，服务端会通过 HttpOnly Cookie 写入 JWT
- 当前版本采用基础 JWT 方案，后续可在此基础上补充 refresh token、角色守卫与审计日志
- 密码采用带盐哈希存储，不会在接口响应中返回明文或哈希值

## 说明

- 当前阶段尚未开始文章 CRUD、评论审核等业务接口开发
- SQLite 数据文件已加入忽略规则，不进入版本库
- 代码注释统一使用中文，便于后续协作维护