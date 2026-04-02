<script setup lang="ts">
import SectionCard from '../../components/common/SectionCard.vue'

// 仪表盘统计卡片先使用静态数据占位，帮助确认布局结构。
const dashboardStats = [
  { label: '文章总数', value: '12', hint: '含草稿与已发布文章' },
  { label: '已发布', value: '8', hint: '前台当前可见内容' },
  { label: '待审核评论', value: '5', hint: '评论系统待处理项' },
  { label: '分类数量', value: '4', hint: '内容结构基础维度' },
]
</script>

<template>
  <div class="space-y-6">
    <SectionCard title="后台仪表盘占位" description="这里是管理员的默认首页。当前先提供信息卡片和后续模块入口说明，保证后台壳层可用。">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="item in dashboardStats"
          :key="item.label"
          class="rounded-6 border border-white/10 bg-slate-950/35 p-5"
        >
          <p class="text-sm text-slate-400">{{ item.label }}</p>
          <p class="mt-4 text-4xl font-semibold text-white">{{ item.value }}</p>
          <p class="mt-3 text-xs text-cyan-200/80">{{ item.hint }}</p>
        </div>
      </div>
    </SectionCard>

    <div class="grid gap-6 xl:grid-cols-2">
      <SectionCard title="当前已完成" description="本模块聚焦基础设施，不提前透支业务页面开发。">
        <ul class="space-y-3 text-sm text-slate-300 leading-7">
          <li>• 已搭建前后台双布局。</li>
          <li>• 已建立基础路由守卫与标题更新。</li>
          <li>• 已创建首页、文章详情、登录页、仪表盘占位页面。</li>
        </ul>
      </SectionCard>

      <SectionCard title="下一步建议" description="后续可以沿文档中的开发顺序继续推进前端主链路。">
        <ul class="space-y-3 text-sm text-slate-300 leading-7">
          <li>• 接首页文章列表与文章详情接口。</li>
          <li>• 增补后台文章管理和文章编辑模块。</li>
          <li>• 建立通用请求层、接口类型和错误处理。</li>
        </ul>
      </SectionCard>
    </div>
  </div>
</template>
