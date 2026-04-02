# 开源博客前端工程

这是开源博客产品的前端工程，当前完成第一阶段模块：项目初始化与基础布局。

## 已完成内容

- Vue 3 + Vite + TypeScript 工程初始化
- 接入 Vue Router、Pinia、UnoCSS
- 建立前后台双布局壳层
- 建立首页、文章详情、后台登录、后台仪表盘路由骨架
- 提供基础目录结构，便于后续模块持续扩展

## 目录说明

```text
src/
  components/   # 通用组件
  constants/    # 常量配置
  layouts/      # 前后台布局
  pages/        # 页面级组件
  router/       # 路由与守卫
  stores/       # Pinia 状态
  types/        # 类型定义
```

## 启动方式

```bash
npm install
npm run dev
```

## 当前说明

当前页面均为占位骨架，不包含真实接口调用，也未写入任何敏感凭据。
