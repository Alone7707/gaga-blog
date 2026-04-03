<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { getAdminSettings, updateAdminSettings } from '../../api/settings'
import SectionCard from '../../components/common/SectionCard.vue'
import type { AdminSettingsResponse, SettingGroup, SettingItem } from '../../types/settings'

interface SettingsFormState {
  siteTitle: string
  siteSubtitle: string
  siteDescription: string
  siteBaseUrl: string
  siteLogoUrl: string
  siteFaviconUrl: string
  siteIcp: string
  siteFooterText: string
  seoDefaultTitle: string
  seoDefaultDescription: string
  seoDefaultOgImage: string
  seoEnableSitemap: boolean
  seoEnableRobots: boolean
  seoEnableRss: boolean
  commentEnabled: boolean
  commentRequireModeration: boolean
  commentAllowGuestComment: boolean
  commentMaxLength: number
  commentRateLimitPerMinute: number
  contentDefaultAuthorName: string
  contentAutoGenerateSummary: boolean
  contentSummaryLength: number
  contentRelatedPostsLimit: number
  contentArchivePageSize: number
  staticAboutTitle: string
  staticAboutSummary: string
  staticAboutContent: string
  staticAboutSeoTitle: string
  staticAboutSeoDescription: string
}

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const settingsResponse = ref<AdminSettingsResponse | null>(null)

const form = reactive<SettingsFormState>({
  siteTitle: '',
  siteSubtitle: '',
  siteDescription: '',
  siteBaseUrl: '',
  siteLogoUrl: '',
  siteFaviconUrl: '',
  siteIcp: '',
  siteFooterText: '',
  seoDefaultTitle: '',
  seoDefaultDescription: '',
  seoDefaultOgImage: '',
  seoEnableSitemap: true,
  seoEnableRobots: true,
  seoEnableRss: true,
  commentEnabled: true,
  commentRequireModeration: true,
  commentAllowGuestComment: true,
  commentMaxLength: 1000,
  commentRateLimitPerMinute: 3,
  contentDefaultAuthorName: '',
  contentAutoGenerateSummary: true,
  contentSummaryLength: 140,
  contentRelatedPostsLimit: 6,
  contentArchivePageSize: 20,
  staticAboutTitle: '',
  staticAboutSummary: '',
  staticAboutContent: '',
  staticAboutSeoTitle: '',
  staticAboutSeoDescription: '',
})

const groupSummary = computed(() => settingsResponse.value?.groups ?? [])
const pageSummary = computed(() => [
  { label: '配置分组', value: groupSummary.value.length },
  { label: '配置项数', value: settingsResponse.value?.items.length ?? 0 },
  { label: '静态页字段', value: 5 },
])
const publicSurfaceHint = computed(() => {
  if (!settingsResponse.value) {
    return '当前页面负责把站点基础设置、评论策略与 about 静态页配置收成一套可维护界面。'
  }

  return `已接入 ${settingsResponse.value.items.length} 个配置项，当前保存动作会统一写回后台设置中心。`
})

onMounted(() => {
  void loadSettings()
})

async function loadSettings() {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await getAdminSettings()
    settingsResponse.value = response
    fillForm(response.items)
  }
  catch (error) {
    settingsResponse.value = null
    errorMessage.value = resolveErrorMessage(error, '站点设置加载失败，请确认当前账号是否具备超级管理员权限')
  }
  finally {
    loading.value = false
  }
}

function fillForm(items: SettingItem[]) {
  form.siteTitle = getStringValue(items, 'site.title')
  form.siteSubtitle = getStringValue(items, 'site.subtitle')
  form.siteDescription = getStringValue(items, 'site.description')
  form.siteBaseUrl = getStringValue(items, 'site.baseUrl')
  form.siteLogoUrl = getStringValue(items, 'site.logoUrl')
  form.siteFaviconUrl = getStringValue(items, 'site.faviconUrl')
  form.siteIcp = getStringValue(items, 'site.icp')
  form.siteFooterText = getStringValue(items, 'site.footerText')
  form.seoDefaultTitle = getStringValue(items, 'seo.defaultTitle')
  form.seoDefaultDescription = getStringValue(items, 'seo.defaultDescription')
  form.seoDefaultOgImage = getStringValue(items, 'seo.defaultOgImage')
  form.seoEnableSitemap = getBooleanValue(items, 'seo.enableSitemap', true)
  form.seoEnableRobots = getBooleanValue(items, 'seo.enableRobots', true)
  form.seoEnableRss = getBooleanValue(items, 'seo.enableRss', true)
  form.commentEnabled = getBooleanValue(items, 'comment.enabled', true)
  form.commentRequireModeration = getBooleanValue(items, 'comment.requireModeration', true)
  form.commentAllowGuestComment = getBooleanValue(items, 'comment.allowGuestComment', true)
  form.commentMaxLength = getNumberValue(items, 'comment.maxLength', 1000)
  form.commentRateLimitPerMinute = getNumberValue(items, 'comment.rateLimitPerMinute', 3)
  form.contentDefaultAuthorName = getStringValue(items, 'content.defaultAuthorName')
  form.contentAutoGenerateSummary = getBooleanValue(items, 'content.autoGenerateSummary', true)
  form.contentSummaryLength = getNumberValue(items, 'content.summaryLength', 140)
  form.contentRelatedPostsLimit = getNumberValue(items, 'content.relatedPostsLimit', 6)
  form.contentArchivePageSize = getNumberValue(items, 'content.archivePageSize', 20)
  form.staticAboutTitle = getStringValue(items, 'static.about.title')
  form.staticAboutSummary = getStringValue(items, 'static.about.summary')
  form.staticAboutContent = getStringValue(items, 'static.about.content')
  form.staticAboutSeoTitle = getStringValue(items, 'static.about.seoTitle')
  form.staticAboutSeoDescription = getStringValue(items, 'static.about.seoDescription')
}

function handleReset() {
  if (settingsResponse.value) {
    fillForm(settingsResponse.value.items)
    errorMessage.value = ''
    successMessage.value = ''
  }
}

async function handleSubmit() {
  const validationMessage = validateForm()

  if (validationMessage) {
    errorMessage.value = validationMessage
    successMessage.value = ''
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await updateAdminSettings({
      items: buildUpdateItems(),
    })
    settingsResponse.value = response
    fillForm(response.items)
    successMessage.value = '站点设置保存成功'
  }
  catch (error) {
    errorMessage.value = resolveErrorMessage(error, '站点设置保存失败，请稍后重试')
  }
  finally {
    saving.value = false
  }
}

function validateForm() {
  if (!form.siteTitle.trim()) {
    return '请输入站点标题'
  }

  if (form.siteTitle.trim().length > 100) {
    return '站点标题不能超过 100 个字符'
  }

  if (form.siteDescription.trim().length > 300) {
    return '站点描述不能超过 300 个字符'
  }

  if (form.seoDefaultDescription.trim().length > 300) {
    return '默认 SEO 描述不能超过 300 个字符'
  }

  if (form.commentMaxLength <= 0) {
    return '评论最大长度必须大于 0'
  }

  if (form.commentRateLimitPerMinute <= 0) {
    return '评论限流次数必须大于 0'
  }

  if (form.contentSummaryLength <= 0) {
    return '自动摘要长度必须大于 0'
  }

  if (form.contentRelatedPostsLimit <= 0) {
    return '相关文章数量必须大于 0'
  }

  if (form.contentArchivePageSize <= 0) {
    return '归档页分页大小必须大于 0'
  }

  if (!form.staticAboutTitle.trim()) {
    return '请输入关于页标题'
  }

  if (form.staticAboutSummary.trim().length > 300) {
    return '关于页摘要不能超过 300 个字符'
  }

  if (form.staticAboutSeoDescription.trim().length > 300) {
    return '关于页 SEO 描述不能超过 300 个字符'
  }

  return ''
}

function buildUpdateItems() {
  return [
    { key: 'site.title', value: form.siteTitle.trim() },
    { key: 'site.subtitle', value: form.siteSubtitle.trim() },
    { key: 'site.description', value: form.siteDescription.trim() },
    { key: 'site.baseUrl', value: form.siteBaseUrl.trim() },
    { key: 'site.logoUrl', value: form.siteLogoUrl.trim() },
    { key: 'site.faviconUrl', value: form.siteFaviconUrl.trim() },
    { key: 'site.icp', value: form.siteIcp.trim() },
    { key: 'site.footerText', value: form.siteFooterText.trim() },
    { key: 'seo.defaultTitle', value: form.seoDefaultTitle.trim() },
    { key: 'seo.defaultDescription', value: form.seoDefaultDescription.trim() },
    { key: 'seo.defaultOgImage', value: form.seoDefaultOgImage.trim() },
    { key: 'seo.enableSitemap', value: form.seoEnableSitemap },
    { key: 'seo.enableRobots', value: form.seoEnableRobots },
    { key: 'seo.enableRss', value: form.seoEnableRss },
    { key: 'comment.enabled', value: form.commentEnabled },
    { key: 'comment.requireModeration', value: form.commentRequireModeration },
    { key: 'comment.allowGuestComment', value: form.commentAllowGuestComment },
    { key: 'comment.maxLength', value: form.commentMaxLength },
    { key: 'comment.rateLimitPerMinute', value: form.commentRateLimitPerMinute },
    { key: 'content.defaultAuthorName', value: form.contentDefaultAuthorName.trim() },
    { key: 'content.autoGenerateSummary', value: form.contentAutoGenerateSummary },
    { key: 'content.summaryLength', value: form.contentSummaryLength },
    { key: 'content.relatedPostsLimit', value: form.contentRelatedPostsLimit },
    { key: 'content.archivePageSize', value: form.contentArchivePageSize },
    { key: 'static.about.title', value: form.staticAboutTitle.trim() },
    { key: 'static.about.summary', value: form.staticAboutSummary.trim() },
    { key: 'static.about.content', value: form.staticAboutContent },
    { key: 'static.about.seoTitle', value: form.staticAboutSeoTitle.trim() },
    { key: 'static.about.seoDescription', value: form.staticAboutSeoDescription.trim() },
  ]
}

function getStringValue(items: SettingItem[], key: string) {
  const item = items.find(candidate => candidate.key === key)
  return typeof item?.value === 'string' ? item.value : ''
}

function getBooleanValue(items: SettingItem[], key: string, fallback: boolean) {
  const item = items.find(candidate => candidate.key === key)
  return typeof item?.value === 'boolean' ? item.value : fallback
}

function getNumberValue(items: SettingItem[], key: string, fallback: number) {
  const item = items.find(candidate => candidate.key === key)
  return typeof item?.value === 'number' ? item.value : fallback
}

function getGroupLabel(group: SettingGroup['group']) {
  if (group === 'site') {
    return '站点信息'
  }

  if (group === 'seo') {
    return 'SEO 配置'
  }

  if (group === 'comment') {
    return '评论配置'
  }

  if (group === 'content') {
    return '内容配置'
  }

  if (group === 'static') {
    return '静态页面'
  }

  return group
}

function formatValue(value: SettingItem['value']) {
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }

  if (Array.isArray(value)) {
    return value.join('，') || '--'
  }

  if (value === null || value === '') {
    return '--'
  }

  return String(value)
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error && 'message' in error) {
    const message = Reflect.get(error, 'message')

    if (typeof message === 'string' && message) {
      return message
    }
  }

  return fallback
}
</script>

<template>
  <div class="page-grid">
    <SectionCard title="站点设置" description="把站点基础信息、SEO、评论策略、内容策略和 about 静态页配置收成一套轻盈、可维护的后台设置页。" variant="hero" size="lg">
      <template #action>
        <div class="flex flex-wrap gap-3">
          <button type="button" class="ui-btn ui-btn-secondary text-sm" @click="handleReset">
            重置表单
          </button>
          <button type="button" class="ui-btn ui-btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60" :disabled="saving" @click="handleSubmit">
            {{ saving ? '保存中...' : '保存设置' }}
          </button>
        </div>
      </template>

      <div class="admin-card-grid cols-3">
        <article class="admin-overview-card admin-overview-card-primary">
          <p class="editor-kicker">配置分组</p>
          <p class="admin-overview-value">{{ pageSummary[0].value }}</p>
          <p class="mt-3 text-xs text-[var(--text-3)]">已归拢的后台设置模块</p>
        </article>
        <article class="admin-overview-card admin-overview-card-success">
          <p class="editor-kicker">配置项数</p>
          <p class="admin-overview-value">{{ pageSummary[1].value }}</p>
          <p class="mt-3 text-xs text-[var(--success)]">已接入接口的设置字段</p>
        </article>
        <article class="admin-overview-card">
          <p class="editor-kicker">联调状态</p>
          <p class="mt-4 text-sm text-[var(--text-1)] font-semibold leading-7">{{ publicSurfaceHint }}</p>
        </article>
      </div>

      <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_390px]">
        <SectionCard title="配置表单" description="站点基础信息、SEO、评论、内容与 about 静态页统一在同一视觉体系下编辑。" variant="panel">
          <div v-if="loading" class="rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-5 py-14 text-center text-sm text-[var(--text-3)]">
            正在加载站点设置...
          </div>

          <div v-else class="space-y-6">
            <div v-if="errorMessage" class="rounded-[18px] border border-[rgba(240,68,56,0.14)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
              {{ errorMessage }}
            </div>
            <div v-if="successMessage" class="rounded-[18px] border border-[rgba(18,183,106,0.16)] bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)]">
              {{ successMessage }}
            </div>

            <div class="admin-form-grid">
              <section class="admin-form-section">
                <div class="admin-form-section-header">
                  <div>
                    <p class="editor-kicker">Site Basics</p>
                    <h3 class="mt-3 text-[20px] font-semibold text-[var(--text-1)]">站点基础信息</h3>
                  </div>
                  <p class="max-w-md text-sm text-[var(--text-3)] leading-7">优先收口站点标题、简介、页脚和基础地址，让首页、about 页和 SEO 默认值保持一致。</p>
                </div>
                <div class="admin-form-section-body grid gap-4 md:grid-cols-2">
                  <label class="block">
                    <span class="mb-2 block text-sm text-[var(--text-3)]">站点标题</span>
                    <input v-model="form.siteTitle" type="text" maxlength="100" placeholder="请输入站点标题" class="ui-input">
                  </label>
                  <label class="block">
                    <span class="mb-2 block text-sm text-[var(--text-3)]">站点副标题</span>
                    <input v-model="form.siteSubtitle" type="text" maxlength="120" placeholder="请输入站点副标题" class="ui-input">
                  </label>
                  <label class="block md:col-span-2">
                    <span class="mb-2 block text-sm text-[var(--text-3)]">站点描述</span>
                    <textarea v-model="form.siteDescription" rows="4" maxlength="300" placeholder="用于首页简介与 SEO 描述" class="ui-textarea"></textarea>
                  </label>
                  <label class="block">
                    <span class="mb-2 block text-sm text-[var(--text-3)]">站点基础地址</span>
                    <input v-model="form.siteBaseUrl" type="text" placeholder="例如：https://example.com" class="ui-input">
                  </label>
                  <label class="block">
                    <span class="mb-2 block text-sm text-[var(--text-3)]">默认作者名</span>
                    <input v-model="form.contentDefaultAuthorName" type="text" maxlength="100" placeholder="前台未指定作者时使用" class="ui-input">
                  </label>
                  <label class="block">
                    <span class="mb-2 block text-sm text-[var(--text-3)]">Logo 地址</span>
                    <input v-model="form.siteLogoUrl" type="text" placeholder="输入可访问的图片地址" class="ui-input">
                  </label>
                  <label class="block">
                    <span class="mb-2 block text-sm text-[var(--text-3)]">Favicon 地址</span>
                    <input v-model="form.siteFaviconUrl" type="text" placeholder="输入 favicon 地址" class="ui-input">
                  </label>
                  <label class="block">
                    <span class="mb-2 block text-sm text-[var(--text-3)]">备案号</span>
                    <input v-model="form.siteIcp" type="text" maxlength="80" placeholder="例如：京 ICP 备 xxxx 号" class="ui-input">
                  </label>
                  <label class="block">
                    <span class="mb-2 block text-sm text-[var(--text-3)]">页脚文案</span>
                    <input v-model="form.siteFooterText" type="text" maxlength="160" placeholder="例如：© 2026 我的博客" class="ui-input">
                  </label>
                </div>
              </section>

              <div class="grid gap-6 lg:grid-cols-2">
                <section class="admin-form-section">
                  <div class="admin-form-section-header">
                    <div>
                      <p class="editor-kicker">SEO</p>
                      <h3 class="mt-3 text-[20px] font-semibold text-[var(--text-1)]">SEO 配置</h3>
                    </div>
                  </div>
                  <div class="admin-form-section-body space-y-4">
                    <label class="block">
                      <span class="mb-2 block text-sm text-[var(--text-3)]">默认 SEO 标题</span>
                      <input v-model="form.seoDefaultTitle" type="text" maxlength="120" placeholder="用于列表页与兜底标题" class="ui-input">
                    </label>
                    <label class="block">
                      <span class="mb-2 block text-sm text-[var(--text-3)]">默认 SEO 描述</span>
                      <textarea v-model="form.seoDefaultDescription" rows="4" maxlength="300" placeholder="用于列表页与兜底描述" class="ui-textarea"></textarea>
                    </label>
                    <label class="block">
                      <span class="mb-2 block text-sm text-[var(--text-3)]">默认 OG 图片地址</span>
                      <input v-model="form.seoDefaultOgImage" type="text" placeholder="用于社交分享封面" class="ui-input">
                    </label>
                    <div class="space-y-3 rounded-[20px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4 text-sm text-[var(--text-2)]">
                      <label class="admin-switch-row">
                        <span>启用 sitemap</span>
                        <input v-model="form.seoEnableSitemap" type="checkbox" class="h-4 w-4 rounded border-[var(--line-strong)] bg-transparent">
                      </label>
                      <label class="admin-switch-row">
                        <span>启用 robots</span>
                        <input v-model="form.seoEnableRobots" type="checkbox" class="h-4 w-4 rounded border-[var(--line-strong)] bg-transparent">
                      </label>
                      <label class="admin-switch-row">
                        <span>启用 RSS</span>
                        <input v-model="form.seoEnableRss" type="checkbox" class="h-4 w-4 rounded border-[var(--line-strong)] bg-transparent">
                      </label>
                    </div>
                  </div>
                </section>

                <section class="admin-form-section">
                  <div class="admin-form-section-header">
                    <div>
                      <p class="editor-kicker">Comment & Content</p>
                      <h3 class="mt-3 text-[20px] font-semibold text-[var(--text-1)]">评论与内容策略</h3>
                    </div>
                  </div>
                  <div class="admin-form-section-body space-y-4">
                    <div class="space-y-3 rounded-[20px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4 text-sm text-[var(--text-2)]">
                      <label class="admin-switch-row">
                        <span>开启评论</span>
                        <input v-model="form.commentEnabled" type="checkbox" class="h-4 w-4 rounded border-[var(--line-strong)] bg-transparent">
                      </label>
                      <label class="admin-switch-row">
                        <span>评论需要审核</span>
                        <input v-model="form.commentRequireModeration" type="checkbox" class="h-4 w-4 rounded border-[var(--line-strong)] bg-transparent">
                      </label>
                      <label class="admin-switch-row">
                        <span>允许游客评论</span>
                        <input v-model="form.commentAllowGuestComment" type="checkbox" class="h-4 w-4 rounded border-[var(--line-strong)] bg-transparent">
                      </label>
                      <label class="admin-switch-row">
                        <span>自动生成摘要</span>
                        <input v-model="form.contentAutoGenerateSummary" type="checkbox" class="h-4 w-4 rounded border-[var(--line-strong)] bg-transparent">
                      </label>
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                      <label class="block">
                        <span class="mb-2 block text-sm text-[var(--text-3)]">评论最大长度</span>
                        <input v-model.number="form.commentMaxLength" type="number" min="1" class="ui-input">
                      </label>
                      <label class="block">
                        <span class="mb-2 block text-sm text-[var(--text-3)]">每分钟评论限流</span>
                        <input v-model.number="form.commentRateLimitPerMinute" type="number" min="1" class="ui-input">
                      </label>
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                      <label class="block">
                        <span class="mb-2 block text-sm text-[var(--text-3)]">自动摘要长度</span>
                        <input v-model.number="form.contentSummaryLength" type="number" min="1" class="ui-input">
                      </label>
                      <label class="block">
                        <span class="mb-2 block text-sm text-[var(--text-3)]">相关文章数量</span>
                        <input v-model.number="form.contentRelatedPostsLimit" type="number" min="1" class="ui-input">
                      </label>
                    </div>
                    <label class="block">
                      <span class="mb-2 block text-sm text-[var(--text-3)]">归档页分页大小</span>
                      <input v-model.number="form.contentArchivePageSize" type="number" min="1" class="ui-input">
                    </label>
                  </div>
                </section>
              </div>

              <section class="admin-form-section">
                <div class="admin-form-section-header">
                  <div>
                    <p class="editor-kicker">Static About</p>
                    <h3 class="mt-3 text-[20px] font-semibold text-[var(--text-1)]">关于页配置</h3>
                  </div>
                  <p class="max-w-md text-sm text-[var(--text-3)] leading-7">保存 static.about.* 后，前台 /about 会直接消费这些内容，形成前后台联动闭环。</p>
                </div>
                <div class="admin-form-section-body grid gap-4 md:grid-cols-2">
                  <label class="block">
                    <span class="mb-2 block text-sm text-[var(--text-3)]">关于页标题</span>
                    <input v-model="form.staticAboutTitle" type="text" maxlength="120" placeholder="例如：关于我们 / 关于我" class="ui-input">
                  </label>
                  <label class="block">
                    <span class="mb-2 block text-sm text-[var(--text-3)]">关于页摘要</span>
                    <input v-model="form.staticAboutSummary" type="text" maxlength="300" placeholder="用于 about 页首屏摘要" class="ui-input">
                  </label>
                  <label class="block md:col-span-2">
                    <span class="mb-2 block text-sm text-[var(--text-3)]">关于页正文（Markdown）</span>
                    <textarea v-model="form.staticAboutContent" rows="10" placeholder="支持 Markdown 文本，保存后前台 /about 直接展示。" class="ui-textarea"></textarea>
                  </label>
                  <label class="block">
                    <span class="mb-2 block text-sm text-[var(--text-3)]">关于页 SEO 标题</span>
                    <input v-model="form.staticAboutSeoTitle" type="text" maxlength="120" placeholder="用于 about 页面 title" class="ui-input">
                  </label>
                  <label class="block">
                    <span class="mb-2 block text-sm text-[var(--text-3)]">关于页 SEO 描述</span>
                    <input v-model="form.staticAboutSeoDescription" type="text" maxlength="300" placeholder="用于 about 页面 SEO 描述" class="ui-input">
                  </label>
                </div>
              </section>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="当前配置概览" description="右侧用于联调确认分组与字段结构，保持信息浏览和编辑分栏。" variant="panel">
          <div v-if="groupSummary.length === 0" class="rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4 text-sm text-[var(--text-3)] leading-7">
            当前暂无可展示的配置分组。
          </div>
          <div v-else class="space-y-4">
            <article
              v-for="group in groupSummary"
              :key="group.group"
              class="admin-side-card bg-[var(--bg-card-soft)]"
            >
              <h3 class="text-sm font-semibold text-[var(--text-1)]">{{ getGroupLabel(group.group) }}</h3>
              <ul class="mt-3 space-y-2 text-xs leading-6 text-[var(--text-4)]">
                <li v-for="item in group.items" :key="item.key">
                  <span class="text-[var(--text-2)]">{{ item.key }}</span>
                  ：{{ formatValue(item.value) }}
                </li>
              </ul>
            </article>
          </div>
          <div class="mt-5 rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--bg-card-soft)] p-4 text-sm text-[var(--text-3)] leading-7">
            <p class="font-medium text-[var(--text-1)]">联调说明</p>
            <ul class="mt-3 space-y-2">
              <li>• 读取接口：GET /api/admin/settings</li>
              <li>• 保存接口：PATCH /api/admin/settings</li>
              <li>• 新增闭环：保存 static.about.* 后，可在前台 /about 直接看到。</li>
              <li>• 若返回 403，说明当前账号不是超级管理员。</li>
              <li>• 当前页面不写任何敏感凭据，仅维护白名单站点配置。</li>
            </ul>
          </div>
        </SectionCard>
      </div>
    </SectionCard>
  </div>
</template>
