# UI 清爽版 Token 建议（精简）

## 1. 目的

本文件用于给前端后续改版提供一份更轻量的 token 方向建议，帮助把现有深色 token 体系切换为清爽版浅色体系。

本文件只提供建议，不直接要求立即改代码。

---

## 2. 颜色 Token

### 背景

- `--bg-page: #F6F8FB`
- `--bg-soft: #F2F5F9`
- `--bg-card: #FFFFFF`
- `--bg-card-soft: #FAFBFD`
- `--bg-elevated: #FFFFFF`

### 边线

- `--line-soft: #E7ECF3`
- `--line-strong: #D9E2EE`
- `--line-focus: rgba(76, 139, 245, 0.36)`

### 文本

- `--text-1: #172033`
- `--text-2: #344054`
- `--text-3: #667085`
- `--text-4: #98A2B3`

### 品牌

- `--accent-primary: #4C8BF5`
- `--accent-primary-hover: #3F7DE4`
- `--accent-primary-soft: #EAF2FF`
- `--accent-mint: #54C6A9`
- `--accent-sky: #7BC7FF`
- `--accent-peach: #FFB88C`

### 状态

- `--success: #12B76A`
- `--success-soft: #EAFBF3`
- `--warning: #F79009`
- `--warning-soft: #FFF5E8`
- `--danger: #F04438`
- `--danger-soft: #FFF0EF`
- `--info: #2E90FA`
- `--info-soft: #EDF6FF`

---

## 3. 圆角 Token

- `--radius-xs: 10px`
- `--radius-sm: 12px`
- `--radius-md: 16px`
- `--radius-lg: 20px`
- `--radius-xl: 24px`
- `--radius-pill: 9999px`

---

## 4. 间距 Token

- `--space-2: 8px`
- `--space-3: 12px`
- `--space-4: 16px`
- `--space-5: 20px`
- `--space-6: 24px`
- `--space-8: 32px`
- `--space-10: 40px`
- `--space-12: 48px`
- `--space-14: 56px`

---

## 5. 阴影 Token

- `--shadow-xs: 0 1px 2px rgba(16, 24, 40, 0.04)`
- `--shadow-sm: 0 6px 16px rgba(16, 24, 40, 0.06)`
- `--shadow-md: 0 12px 28px rgba(16, 24, 40, 0.08)`

建议：

- 后续页面默认只用 `xs / sm`
- 不再大面积使用重浮层阴影

---

## 6. 动效 Token

- `--ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1)`
- `--duration-fast: 140ms`
- `--duration-mid: 220ms`
- `--duration-slow: 300ms`

---

## 7. 语义 Token 建议

### 前台

- `--public-hero-bg`
- `--public-featured-bg`
- `--public-reading-bg`
- `--public-tag-bg`
- `--public-sidebar-bg`

### 后台

- `--admin-shell-bg`
- `--admin-panel-bg`
- `--admin-toolbar-bg`
- `--admin-summary-bg`
- `--admin-selected-bg`
- `--admin-row-hover`

---

## 8. 使用原则

1. 先统一 foundation token，再做页面
2. 不要一边沿用深色 token，一边局部硬改浅色样式
3. 不要重新堆出新的“浅色厚重卡片风”
4. 要保持轻、简洁、清爽、现代内容产品感

---

## 9. 结论

这份 token 建议的核心，不是定义更多变量，而是帮助前端统一转向：

- 从深色重面板
- 转为浅色轻内容

后续只要基础 token 切换正确，页面改版会顺很多。