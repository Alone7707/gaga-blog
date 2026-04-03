import { BadRequestException } from '@nestjs/common';

export type SettingValueType = 'string' | 'boolean' | 'number' | 'string[]';

export interface SettingDefinition {
  key: string;
  group: string;
  description: string;
  isPublic: boolean;
  valueType: SettingValueType;
  defaultValue: string | boolean | number | string[];
}

// 站点设置最小可交付配置白名单，仅允许这些键进入读写链路。
export const SETTING_DEFINITIONS: SettingDefinition[] = [
  {
    key: 'site.title',
    group: 'site',
    description: '站点标题',
    isPublic: true,
    valueType: 'string',
    defaultValue: '我的博客',
  },
  {
    key: 'site.subtitle',
    group: 'site',
    description: '站点副标题',
    isPublic: true,
    valueType: 'string',
    defaultValue: '',
  },
  {
    key: 'site.description',
    group: 'site',
    description: '站点描述',
    isPublic: true,
    valueType: 'string',
    defaultValue: '',
  },
  {
    key: 'site.baseUrl',
    group: 'site',
    description: '站点基础地址',
    isPublic: true,
    valueType: 'string',
    defaultValue: '',
  },
  {
    key: 'site.logoUrl',
    group: 'site',
    description: '站点 Logo 地址',
    isPublic: true,
    valueType: 'string',
    defaultValue: '',
  },
  {
    key: 'site.faviconUrl',
    group: 'site',
    description: '站点 favicon 地址',
    isPublic: true,
    valueType: 'string',
    defaultValue: '',
  },
  {
    key: 'site.icp',
    group: 'site',
    description: '站点备案号',
    isPublic: true,
    valueType: 'string',
    defaultValue: '',
  },
  {
    key: 'site.footerText',
    group: 'site',
    description: '站点底部文案',
    isPublic: true,
    valueType: 'string',
    defaultValue: '',
  },
  {
    key: 'seo.defaultTitle',
    group: 'seo',
    description: '默认 SEO 标题',
    isPublic: true,
    valueType: 'string',
    defaultValue: '',
  },
  {
    key: 'seo.defaultDescription',
    group: 'seo',
    description: '默认 SEO 描述',
    isPublic: true,
    valueType: 'string',
    defaultValue: '',
  },
  {
    key: 'seo.defaultOgImage',
    group: 'seo',
    description: '默认 OG 图片地址',
    isPublic: true,
    valueType: 'string',
    defaultValue: '',
  },
  {
    key: 'seo.enableSitemap',
    group: 'seo',
    description: '是否启用站点地图',
    isPublic: true,
    valueType: 'boolean',
    defaultValue: true,
  },
  {
    key: 'seo.enableRobots',
    group: 'seo',
    description: '是否启用 robots',
    isPublic: true,
    valueType: 'boolean',
    defaultValue: true,
  },
  {
    key: 'seo.enableRss',
    group: 'seo',
    description: '是否启用 RSS',
    isPublic: true,
    valueType: 'boolean',
    defaultValue: true,
  },
  {
    key: 'comment.enabled',
    group: 'comment',
    description: '是否开启评论',
    isPublic: true,
    valueType: 'boolean',
    defaultValue: true,
  },
  {
    key: 'comment.requireModeration',
    group: 'comment',
    description: '评论是否需要审核',
    isPublic: true,
    valueType: 'boolean',
    defaultValue: true,
  },
  {
    key: 'comment.allowGuestComment',
    group: 'comment',
    description: '是否允许游客评论',
    isPublic: true,
    valueType: 'boolean',
    defaultValue: true,
  },
  {
    key: 'comment.maxLength',
    group: 'comment',
    description: '评论最大长度',
    isPublic: false,
    valueType: 'number',
    defaultValue: 1000,
  },
  {
    key: 'comment.rateLimitPerMinute',
    group: 'comment',
    description: '每分钟评论限流次数',
    isPublic: false,
    valueType: 'number',
    defaultValue: 3,
  },
  {
    key: 'content.defaultAuthorName',
    group: 'content',
    description: '默认作者名',
    isPublic: true,
    valueType: 'string',
    defaultValue: '',
  },
  {
    key: 'content.autoGenerateSummary',
    group: 'content',
    description: '是否自动生成摘要',
    isPublic: false,
    valueType: 'boolean',
    defaultValue: true,
  },
  {
    key: 'content.summaryLength',
    group: 'content',
    description: '自动摘要长度',
    isPublic: false,
    valueType: 'number',
    defaultValue: 140,
  },
  {
    key: 'content.relatedPostsLimit',
    group: 'content',
    description: '相关文章数量',
    isPublic: true,
    valueType: 'number',
    defaultValue: 6,
  },
  {
    key: 'content.archivePageSize',
    group: 'content',
    description: '归档页分页大小',
    isPublic: false,
    valueType: 'number',
    defaultValue: 20,
  },
  {
    key: 'static.about.title',
    group: 'static',
    description: '关于页标题',
    isPublic: true,
    valueType: 'string',
    defaultValue: '关于我',
  },
  {
    key: 'static.about.summary',
    group: 'static',
    description: '关于页摘要',
    isPublic: true,
    valueType: 'string',
    defaultValue: '',
  },
  {
    key: 'static.about.content',
    group: 'static',
    description: '关于页正文内容，建议保存 Markdown 文本',
    isPublic: true,
    valueType: 'string',
    defaultValue: '',
  },
  {
    key: 'static.about.seoTitle',
    group: 'static',
    description: '关于页 SEO 标题',
    isPublic: true,
    valueType: 'string',
    defaultValue: '',
  },
  {
    key: 'static.about.seoDescription',
    group: 'static',
    description: '关于页 SEO 描述',
    isPublic: true,
    valueType: 'string',
    defaultValue: '',
  },
];

export const SETTING_DEFINITION_MAP = new Map(
  SETTING_DEFINITIONS.map((definition) => [definition.key, definition]),
);

export const SETTING_GROUPS = Array.from(
  new Set(SETTING_DEFINITIONS.map((definition) => definition.group)),
);

// 统一解析前端传入值，避免数据库中出现与定义不一致的脏数据。
export function normalizeSettingValue(
  definition: SettingDefinition,
  value: unknown,
): string | boolean | number | string[] {
  switch (definition.valueType) {
    case 'string': {
      if (typeof value !== 'string') {
        throwInvalidValue(definition.key, '需要字符串值');
      }

      return value.trim();
    }
    case 'boolean': {
      if (typeof value !== 'boolean') {
        throwInvalidValue(definition.key, '需要布尔值');
      }

      return value;
    }
    case 'number': {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throwInvalidValue(definition.key, '需要数字值');
      }

      return value;
    }
    case 'string[]': {
      if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
        throwInvalidValue(definition.key, '需要字符串数组');
      }

      return value.map((item) => item.trim());
    }
    default:
      throwInvalidValue(definition.key, '配置类型不支持');
  }
}

// 统一解析数据库中的 JSON 文本，避免控制器处理序列化细节。
export function parseStoredSettingValue(definition: SettingDefinition, value: string): unknown {
  const parsed = JSON.parse(value) as unknown;
  return normalizeSettingValue(definition, parsed);
}

function throwInvalidValue(key: string, reason: string): never {
  throw new BadRequestException({
    code: 'SETTING_VALUE_INVALID',
    message: `配置 ${key} ${reason}`,
  });
}
