# 前端需求拆解（Vue 3）

## 1. 文档目标

基于现有 PRD、技术选型与模块协作文档，补充前端视角的可执行需求拆解。目标是让前端团队在 Vue 3 技术栈下，能够直接按模块推进设计、开发、联调与验收。

适用范围：
- 前台站点（public web）
- 后台管理端（admin web）
- 共享组件层、路由层、状态管理层、API 接入层

不包含：
- 后端表结构详细设计
- UI 视觉稿
- 复杂编辑器方案选型

---

## 2. 前端总体边界

### 2.1 技术约束

- 框架：Vue 3
- 构建：Vite
- 路由：Vue Router
- 状态管理：Pinia
- CSS 方案：UnoCSS（优先）或 Tailwind CSS 二选一
- Markdown 渲染：markdown-it
- HTTP 请求：axios 或基于 fetch 的统一封装

### 2.2 前端分层建议

```text
frontend/
  src/
    api/              # 接口封装
    components/       # 通用组件
    modules/          # 领域模块组件/逻辑
    layouts/          # 前台/后台布局
    pages/            # 页面级组件
    router/           # 路由定义与守卫
    stores/           # Pinia 状态
    utils/            # 工具函数
    composables/      # 复用逻辑
    constants/        # 常量枚举
    types/            # TS 类型
```

### 2.3 前端目标

- 前台阅读路径短，信息结构清晰
- 后台内容操作高频场景优先，减少多余跳转
- 保证 public/admin 模块边界清楚，可独立演进
- API、状态、组件复用边界明确，避免页面直接堆逻辑

---

## 3. 前台页面信息架构

## 3.1 一级页面

1. 首页
2. 文章详情页
3. 分类页
4. 标签页
5. 搜索页
6. 归档页
7. 关于页 / 自定义静态页
8. 404 页面

## 3.2 页面结构树

```text
前台站点
├─ 首页
│  ├─ 顶部导航
│  ├─ 站点简介区
│  ├─ 文章列表区
│  ├─ 分页区
│  └─ 页脚
├─ 文章详情页
│  ├─ 文章头图/标题区
│  ├─ 元信息区（发布时间/分类/标签）
│  ├─ Markdown 正文区
│  ├─ 目录导航区
│  ├─ 相关文章区（P1）
│  ├─ 评论区
│  └─ 上一篇/下一篇（可选）
├─ 分类页
│  ├─ 分类列表/当前分类说明
│  └─ 分类下文章列表
├─ 标签页
│  ├─ 标签云/标签列表
│  └─ 标签下文章列表
├─ 搜索页
│  ├─ 搜索输入区
│  ├─ 搜索结果列表
│  └─ 空结果态
├─ 归档页
│  └─ 按年月归档文章列表
├─ 关于页/静态页
│  └─ Markdown/富文本展示区
└─ 404 页面
   ├─ 错误提示
   └─ 返回首页入口
```

## 3.3 前台页面说明

### 首页

目标：承接主要流量入口，突出最新内容与站点定位。

核心信息：
- 站点名称、简介
- 最新/已发布文章列表
- 分类、标签入口
- 分页

关键交互：
- 点击文章卡片进入详情
- 点击分类/标签进行筛选跳转
- 分页切换

### 文章详情页

目标：保障阅读体验与内容消费效率。

核心信息：
- 标题、摘要、发布时间、分类、标签
- Markdown 正文
- 目录导航
- 评论列表与评论输入

关键交互：
- 锚点跳转目录
- 标签/分类点击跳转
- 提交评论
- SEO 元信息更新

### 分类页 / 标签页

目标：承接内容归类浏览。

核心信息：
- 当前分类/标签名称及说明
- 对应文章列表
- 分页

关键交互：
- 切换文章详情
- 返回全部内容视图

### 搜索页

目标：承接明确检索意图。

核心信息：
- 搜索词
- 命中文章标题、摘要、标签片段
- 结果数量

关键交互：
- 输入搜索关键词
- 回车/按钮触发搜索
- 点击结果进入详情

### 归档页

目标：支持按时间回溯内容。

核心信息：
- 年/月分组
- 每篇文章标题、发布时间

### 关于页 / 自定义静态页

目标：承载站点介绍、作者介绍、版权说明等相对稳定内容。

---

## 4. 后台管理端页面结构

## 4.1 一级页面

1. 登录页
2. 仪表盘
3. 文章管理
4. 文章编辑
5. 分类管理
6. 标签管理
7. 评论审核
8. 站点设置
9. 404 / 无权限页

## 4.2 后台结构树

```text
后台管理端
├─ 登录页
├─ 管理后台主框架
│  ├─ 侧边导航
│  ├─ 顶部操作栏
│  └─ 内容区
│     ├─ 仪表盘
│     ├─ 文章管理页
│     ├─ 文章编辑页
│     ├─ 分类管理页
│     ├─ 标签管理页
│     ├─ 评论审核页
│     └─ 站点设置页
├─ 404 页面
└─ 无权限页
```

## 4.3 后台页面说明

### 登录页

核心内容：
- 用户名
- 密码
- 登录按钮
- 错误提示

关键交互：
- 提交登录
- 登录成功后跳转仪表盘或原访问页

### 仪表盘

目标：作为后台总入口，先满足运营概览，不追求复杂 BI。

建议展示：
- 文章总数
- 已发布/草稿数
- 分类数、标签数
- 待审核评论数
- 最近文章列表
- 快捷操作入口（新建文章、去审核评论）

### 文章管理页

目标：承载高频内容管理操作，是后台核心页面。

列表字段建议：
- 标题
- 状态（草稿/已发布）
- 分类
- 标签
- 发布时间
- 更新时间
- 操作列

关键操作：
- 新建文章
- 搜索文章
- 按状态筛选
- 编辑
- 删除
- 发布 / 取消发布

### 文章编辑页

目标：服务发文主链路，优先保证可写、可存、可发。

页面区域建议：
- 基础信息区：标题、slug、摘要、封面图
- 内容编辑区：Markdown 输入区、预览区（可分栏或切换）
- 发布配置区：分类、标签、状态、发布时间
- SEO 配置区：seoTitle、seoDescription
- 页面操作区：保存草稿、发布、返回列表

### 分类管理页

核心功能：
- 分类列表
- 新建分类
- 编辑分类
- 删除分类

字段建议：
- 名称
- slug
- 描述
- 文章数量

### 标签管理页

核心功能：
- 标签列表
- 新建标签
- 编辑标签
- 删除标签

字段建议：
- 名称
- slug
- 关联文章数量

### 评论审核页

核心功能：
- 评论列表
- 按状态筛选（待审核/通过/驳回）
- 审核通过
- 驳回/删除
- 查看所属文章

字段建议：
- 评论内容
- 评论人昵称
- 邮箱（脱敏显示）
- 所属文章
- 提交时间
- 审核状态

### 站点设置页

核心功能：
- 站点名称
- 站点副标题/简介
- logo / favicon 地址（一期可先用文本地址）
- SEO 默认标题/描述
- 评论开关
- 页脚信息
- 关于页内容入口（若使用静态页配置）

---

## 5. 组件模块拆解

## 5.1 共享组件层（shared-ui）

### 基础组件

- AppButton：按钮
- AppInput：输入框
- AppTextarea：多行输入
- AppSelect：下拉选择
- AppTag：标签展示
- AppModal：弹窗
- AppDrawer：抽屉
- AppPagination：分页
- AppEmpty：空态
- AppLoading：加载态
- AppTable：表格容器
- AppConfirm：危险操作确认
- AppMessage / Toast：全局反馈

### 布局组件

- PublicHeader
- PublicFooter
- PublicSidebar（如启用侧栏）
- AdminSidebar
- AdminHeader
- PageContainer
- SectionCard

## 5.2 前台领域组件

- PostCard：文章卡片
- PostList：文章列表
- PostMeta：文章元信息
- MarkdownRenderer：Markdown 渲染器
- TocNav：文章目录
- CommentForm：评论提交表单
- CommentList：评论列表
- SearchBar：搜索框
- ArchiveTimeline：归档时间轴/列表
- CategoryList：分类列表
- TagCloud / TagList：标签展示

## 5.3 后台领域组件

- LoginForm：登录表单
- DashboardStatCard：统计卡片
- PostFilterBar：文章筛选栏
- PostTable：文章表格
- PostEditorForm：文章编辑表单
- MarkdownEditor：Markdown 编辑器容器
- SeoSettingPanel：SEO 配置面板
- CategoryForm：分类表单
- TagForm：标签表单
- CommentAuditTable：评论审核表格
- SettingForm：站点设置表单

## 5.4 组件拆解原则

- 页面负责组合，不承载复杂业务判断
- 模块组件负责领域 UI 与交互
- stores 管状态，不直接耦合具体 DOM 呈现
- API 请求不写在基础组件中
- 编辑页类复杂场景优先拆为表单区块组件

---

## 6. 状态管理边界

## 6.1 Pinia store 划分建议

1. useAuthStore
2. useAppStore
3. usePostStore
4. useCategoryStore
5. useTagStore
6. useCommentStore
7. useSettingStore
8. useSearchStore（可选，若搜索逻辑较复杂）

## 6.2 各 store 边界

### useAuthStore

负责：
- 管理员登录态
- 当前用户基本信息
- 登录/登出动作
- token 状态或 session 状态同步

不负责：
- 页面级 loading
- 文章实体缓存

### useAppStore

负责：
- 全局 UI 状态
- 主题模式（如后续支持）
- 全局消息、布局折叠态

### usePostStore

负责：
- 文章列表数据
- 当前文章详情数据
- 文章编辑草稿态（若选择 store 承载）
- 列表筛选参数、分页状态

注意：
- 前台详情与后台编辑可以拆局部状态，避免互相污染
- 对于编辑中的临时表单态，可优先局部页面状态，提交时再统一组装

### useCategoryStore / useTagStore

负责：
- 分类/标签列表缓存
- 管理页操作后的数据同步
- 下拉选项数据源

### useCommentStore

负责：
- 评论列表
- 审核状态筛选
- 审核动作后的局部刷新

### useSettingStore

负责：
- 站点配置读取与更新
- 前台公共配置缓存（站点标题、footer 等）

### useSearchStore

负责：
- 搜索关键词
- 搜索结果
- 搜索状态

## 6.3 状态管理原则

- 能局部就局部，避免把所有表单都塞进 store
- 列表查询参数可放 store，便于跨组件共享
- 编辑页未保存内容若无跨页需求，可先用页面内 reactive 管理
- 后台认证信息必须单独管理，不与业务数据混放

---

## 7. 路由设计

## 7.1 路由总览

```text
/
/posts/:slug
/categories
/categories/:slug
/tags
/tags/:slug
/search
/archives
/about
/:pageSlug                # 自定义静态页（P1 或扩展）
/admin/login
/admin
/admin/posts
/admin/posts/new
/admin/posts/:id/edit
/admin/categories
/admin/tags
/admin/comments
/admin/settings
/404
```

## 7.2 前台路由建议

| 路径 | 页面 | 说明 |
|---|---|---|
| `/` | 首页 | 已发布文章列表 |
| `/posts/:slug` | 文章详情 | 基于 slug 访问 |
| `/categories` | 分类总览 | 可选，若分类数量少可合并 |
| `/categories/:slug` | 分类详情 | 分类下文章列表 |
| `/tags` | 标签总览 | 标签列表/标签云 |
| `/tags/:slug` | 标签详情 | 标签下文章列表 |
| `/search` | 搜索页 | 搜索结果展示 |
| `/archives` | 归档页 | 按年月归档 |
| `/about` | 关于页 | 静态页 |
| `/:pageSlug` | 自定义页 | 后续扩展 |
|

## 7.3 后台路由建议

| 路径 | 页面 | 鉴权 | 说明 |
|---|---|---|---|
| `/admin/login` | 登录页 | 否 | 未登录可访问 |
| `/admin` | 仪表盘 | 是 | 后台默认首页 |
| `/admin/posts` | 文章管理 | 是 | 列表、筛选、批量操作预留 |
| `/admin/posts/new` | 新建文章 | 是 | 新建内容 |
| `/admin/posts/:id/edit` | 编辑文章 | 是 | 编辑既有文章 |
| `/admin/categories` | 分类管理 | 是 | 分类 CRUD |
| `/admin/tags` | 标签管理 | 是 | 标签 CRUD |
| `/admin/comments` | 评论审核 | 是 | 评论审核操作 |
| `/admin/settings` | 站点设置 | 是 | 站点配置 |

## 7.4 路由守卫

### 需要的守卫能力

- 后台鉴权守卫：未登录访问 `/admin` 相关页面时跳转 `/admin/login`
- 登录态反向守卫：已登录访问 `/admin/login` 时跳转 `/admin`
- 404 兜底：未知路由进入 404 页面
- 页面标题守卫：根据路由元信息更新 document.title

### 路由 meta 建议

- `title`
- `requiresAuth`
- `layout`（public/admin）
- `keepAlive`（仅必要时）

---

## 8. API 对接清单

以下清单按前端调用视角整理，实际字段以后端 Swagger 为准。

## 8.1 鉴权相关

### 后台
- `POST /api/admin/auth/login`：管理员登录
- `POST /api/admin/auth/logout`：登出
- `GET /api/admin/auth/me`：获取当前登录管理员信息

前端用途：
- 登录页提交
- 启动时恢复登录态
- 路由守卫校验

## 8.2 文章相关

### 前台
- `GET /api/public/posts`：获取已发布文章列表
- `GET /api/public/posts/:slug`：获取文章详情
- `GET /api/public/posts/recent`：获取最近文章（可选）
- `GET /api/public/posts/related/:slug`：相关文章（P1）

### 后台
- `GET /api/admin/posts`：文章列表（分页/筛选）
- `POST /api/admin/posts`：创建文章
- `GET /api/admin/posts/:id`：文章详情
- `PATCH /api/admin/posts/:id`：更新文章
- `DELETE /api/admin/posts/:id`：删除文章
- `PATCH /api/admin/posts/:id/publish`：发布文章
- `PATCH /api/admin/posts/:id/unpublish`：取消发布

关键参数建议：
- 列表分页：`page`、`pageSize`
- 筛选：`status`、`keyword`、`categoryId`
- 排序：`sortBy`、`order`

## 8.3 分类相关

### 前台
- `GET /api/public/categories`：分类列表
- `GET /api/public/categories/:slug/posts`：分类下文章列表

### 后台
- `GET /api/admin/categories`：分类列表
- `POST /api/admin/categories`：创建分类
- `PATCH /api/admin/categories/:id`：更新分类
- `DELETE /api/admin/categories/:id`：删除分类

## 8.4 标签相关

### 前台
- `GET /api/public/tags`：标签列表
- `GET /api/public/tags/:slug/posts`：标签下文章列表

### 后台
- `GET /api/admin/tags`：标签列表
- `POST /api/admin/tags`：创建标签
- `PATCH /api/admin/tags/:id`：更新标签
- `DELETE /api/admin/tags/:id`：删除标签

## 8.5 评论相关

### 前台
- `GET /api/public/posts/:slug/comments`：获取文章评论
- `POST /api/public/comments`：提交评论

### 后台
- `GET /api/admin/comments`：评论列表
- `PATCH /api/admin/comments/:id/approve`：审核通过
- `PATCH /api/admin/comments/:id/reject`：驳回评论
- `DELETE /api/admin/comments/:id`：删除评论

## 8.6 搜索相关

### 前台
- `GET /api/public/search`：关键词搜索

查询参数建议：
- `keyword`
- `page`
- `pageSize`

## 8.7 设置相关

### 前台
- `GET /api/public/settings`：获取站点公共设置

### 后台
- `GET /api/admin/settings`：获取站点设置
- `PATCH /api/admin/settings`：更新站点设置

## 8.8 SEO / 系统能力相关

### 前台
- `GET /rss.xml`：RSS
- `GET /sitemap.xml`：Sitemap

前端备注：
- RSS、Sitemap 主要由后端/服务端产出，前端只需在页面入口与 SEO 策略上配合
- 页面 head 信息应基于文章/站点设置动态更新

---

## 9. 前端分模块开发顺序

遵循“先框架、后主链路、再运营补充”的顺序。

### 阶段 1：前端基础设施

1. 初始化 Vue 3 + Vite 项目
2. 接入 Vue Router、Pinia、样式方案
3. 搭建 public/admin 双布局
4. 封装请求层、环境配置、错误处理
5. 搭建全局组件基础能力（Button/Input/Pagination/Empty/Loading）

目标：让项目具备可持续扩展基础。

### 阶段 2：前台核心阅读链路

1. 首页文章列表
2. 文章详情页
3. Markdown 渲染与目录
4. 分类页 / 标签页
5. 搜索页
6. 归档页

目标：先跑通读者访问主链路。

### 阶段 3：后台核心内容链路

1. 登录页 + 鉴权守卫
2. 后台框架布局
3. 仪表盘基础版
4. 文章管理页
5. 文章编辑页
6. 分类管理页
7. 标签管理页

目标：先跑通管理员发文主链路。

### 阶段 4：运营与配置能力

1. 评论审核页
2. 站点设置页
3. 关于页 / 静态页接入
4. SEO 元信息管理联动

### 阶段 5：增强能力（P1）

1. 相关文章
2. RSS / Sitemap 前端配合
3. 访问统计展示
4. 自定义静态页路由扩展

---

## 10. 模块验收标准

## 10.1 基础设施模块

验收标准：
- 能独立启动开发环境
- 路由可正常切换
- public/admin 布局可分离渲染
- 请求层具备统一错误处理
- 全局样式与基础组件可复用

## 10.2 首页与文章列表模块

验收标准：
- 能正确展示已发布文章列表
- 支持空态、加载态、错误态
- 支持分页切换
- 文章卡片点击进入详情
- 页面首屏信息完整，不出现结构错乱

## 10.3 文章详情与 Markdown 模块

验收标准：
- 能通过 slug 拉取文章详情
- Markdown 基础语法可正确渲染
- 目录导航可跳转
- 分类、标签、发布时间展示完整
- 评论区能正常挂载
- SEO title/description 可动态更新

## 10.4 分类 / 标签 / 搜索模块

验收标准：
- 分类与标签列表可正常展示
- 分类详情页、标签详情页可正确筛选文章
- 搜索页可根据关键词返回结果
- 无结果时有明确空态
- 关键词变化后页面状态同步正确

## 10.5 后台登录与鉴权模块

验收标准：
- 正确提交登录
- 登录成功后可进入后台
- 未登录访问后台路由会被拦截
- 已登录访问登录页会自动跳转
- 登出后后台受保护页面不可继续访问

## 10.6 后台文章管理模块

验收标准：
- 列表展示正确
- 支持分页、筛选、关键词搜索
- 新建/编辑/删除/发布/取消发布链路可用
- 危险操作存在二次确认
- 操作成功后列表能正确刷新

## 10.7 文章编辑模块

验收标准：
- 标题、摘要、slug、正文、分类、标签、SEO 字段可编辑
- 支持保存草稿与发布
- 表单校验明确
- 接口报错能准确反馈
- 编辑既有文章时能正确回填数据

## 10.8 分类与标签管理模块

验收标准：
- 支持新增、编辑、删除
- slug/名称校验清晰
- 列表刷新及时
- 删除前有风险提示

## 10.9 评论审核模块

验收标准：
- 能查看待审核/已通过/已驳回评论
- 审核通过/驳回/删除动作可用
- 可查看评论归属文章
- 操作结果能即时反馈

## 10.10 站点设置模块

验收标准：
- 可正确读取当前配置
- 修改后可保存成功
- 前台公共信息可联动更新
- 对关键字段具备基本校验

---

## 11. Git 提交粒度建议

遵循现有规范：一个独立模块至少一次 commit，不混装多个大模块。

### 11.1 推荐提交拆分

1. `docs(frontend): add frontend requirement breakdown`
2. `feat(frontend): init vue3 app shell`
3. `feat(frontend): add public layout and common router`
4. `feat(frontend): implement home page and post list`
5. `feat(frontend): implement post detail and markdown renderer`
6. `feat(frontend): add category tag and search pages`
7. `feat(frontend): add archive and static pages`
8. `feat(admin): implement login and auth guard`
9. `feat(admin): add admin layout and dashboard`
10. `feat(admin): implement post management page`
11. `feat(admin): implement post editor module`
12. `feat(admin): implement category and tag management`
13. `feat(admin): implement comment moderation page`
14. `feat(admin): implement site settings page`
15. `refactor(frontend): optimize api layer and store boundaries`

### 11.2 提交边界原则

- 基础设施和业务页面不要混在一个提交
- 一个提交只解决一个明确目标
- 文档、接口类型、页面逻辑可以随同同模块一起提交
- 不要在一个 commit 中同时包含前台详情、后台编辑、设置页三类无关内容

---

## 12. 联调与实现注意事项

### 12.1 前后端对齐重点

- 文章状态枚举要统一
- 分类/标签返回结构要统一 id、name、slug
- 评论状态枚举要统一
- 登录态续期方式要先定清楚（JWT + Cookie）
- 分页返回结构统一，例如：`list + total + page + pageSize`

### 12.2 前端实现注意事项

- 页面必须覆盖 loading / empty / error 三态
- 后台危险操作要统一确认交互
- Markdown 渲染需预留代码高亮、外链处理扩展点
- SEO 信息更新建议统一在路由或页面 composable 中处理
- 公共配置读取后应提供缓存，避免每页重复拉取

### 12.3 未来可扩展点

- 主题切换能力
- 草稿自动保存
- 文章版本记录
- 附件上传
- 权限从单管理员扩展到多角色

---

## 13. 结论

对于该开源博客产品，前端实施优先级应明确聚焦两条主链路：

1. 读者访问链路：首页 → 详情 → 搜索/分类/标签/归档
2. 管理员发文链路：登录 → 文章管理 → 文章编辑 → 发布

只要先把这两条链路做稳，再补评论审核、站点设置与 SEO 配置，整个 MVP 前端即可落地。该拆解文档可以直接作为前端任务分包、排期、联调与验收依据。