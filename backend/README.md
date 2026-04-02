# Backend

开源博客产品的后端工程初始化版本，技术栈固定为 **NestJS + Prisma + SQLite**。

## 当前范围

本次只覆盖第一个后端模块：**项目初始化与数据库基础层**。

已完成内容：

- 初始化 `backend` 工程
- 建立基础目录结构
- 接入 NestJS + Fastify
- 接入 Prisma + SQLite
- 落首版核心数据模型
- 提供统一响应结构、异常过滤器、健康检查接口
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

安装完成后会自动执行 `prisma generate`。此外，`dev` 启动前也会自动触发一次 `prisma generate`，用于兜底修复 Prisma Client 缺失问题。

如果你希望手动生成，也可以执行：

```bash
pnpm prisma:generate
```

### 2. 执行数据库迁移

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

> `predev` 会在 `dev` 之前自动执行一次 `prisma generate`，用于兜底修复 Prisma Client 缺失问题。

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

## 说明

- 当前阶段尚未开始鉴权、文章 CRUD、评论审核等业务接口开发
- SQLite 数据文件已加入忽略规则，不进入版本库
- 代码注释统一使用中文，便于后续协作维护
