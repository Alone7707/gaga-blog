import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentStatus, PostStatus, PostVisibility, UserRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import {
  normalizeSettingValue,
  parseStoredSettingValue,
  SETTING_DEFINITION_MAP,
  SETTING_DEFINITIONS,
  SETTING_GROUPS,
} from './constants/setting-definitions';

interface SettingRecordLike {
  id: string;
  group: string;
  key: string;
  value: string;
  isPublic: boolean;
  description: string | null;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PublicSettingGroupItem {
  key: string;
  value: unknown;
}

interface PublicSettingGroupPayload {
  group: string;
  items: PublicSettingGroupItem[];
}

@Injectable()
export class SettingService {
  constructor(private readonly prismaService: PrismaService) {}

  // 后台读取返回完整白名单配置，并补齐尚未持久化的默认值。
  async listAdminSettings(currentUser: AuthenticatedUser) {
    this.ensureSuperAdmin(currentUser);

    const settings = await this.prismaService.setting.findMany({
      where: {
        key: {
          in: SETTING_DEFINITIONS.map((definition) => definition.key),
        },
      },
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    const settingMap = new Map(settings.map((item) => [item.key, item]));
    const groups = SETTING_GROUPS.map((group) => this.buildGroupPayload(group, settingMap, false));

    return {
      groups,
      items: groups.flatMap((group) => group.items),
    };
  }

  // 单分组读取便于后台设置页按模块拆分加载。
  async getAdminSettingsByGroup(group: string, currentUser: AuthenticatedUser) {
    this.ensureSuperAdmin(currentUser);

    const normalizedGroup = group.trim();

    if (!SETTING_GROUPS.includes(normalizedGroup)) {
      throw new NotFoundException({
        code: 'SETTING_GROUP_NOT_FOUND',
        message: '配置分组不存在',
      });
    }

    const settings = await this.prismaService.setting.findMany({
      where: { group: normalizedGroup },
      orderBy: [{ key: 'asc' }],
    });

    const settingMap = new Map(settings.map((item) => [item.key, item]));

    return this.buildGroupPayload(normalizedGroup, settingMap, false);
  }

  // 批量更新统一走事务与 upsert，保证后台最小可交付可直接落库。
  async updateSettings(currentUser: AuthenticatedUser, dto: UpdateSettingsDto) {
    this.ensureSuperAdmin(currentUser);

    const deduplicatedItems = Array.from(
      new Map(dto.items.map((item) => [item.key.trim(), item])).values(),
    );

    await this.prismaService.$transaction(
      deduplicatedItems.map((item) => {
        const key = item.key.trim();
        const definition = SETTING_DEFINITION_MAP.get(key);

        if (!definition) {
          throw new NotFoundException({
            code: 'SETTING_KEY_INVALID',
            message: `配置 ${key} 不存在或不允许修改`,
          });
        }

        const normalizedValue = normalizeSettingValue(definition, item.value);

        return this.prismaService.setting.upsert({
          where: { key },
          update: {
            group: definition.group,
            value: JSON.stringify(normalizedValue),
            isPublic: definition.isPublic,
            description: definition.description,
            updatedById: currentUser.userId,
          },
          create: {
            group: definition.group,
            key,
            value: JSON.stringify(normalizedValue),
            isPublic: definition.isPublic,
            description: definition.description,
            updatedById: currentUser.userId,
          },
        });
      }),
    );

    return this.listAdminSettings(currentUser);
  }

  // 公开接口仅返回标记为 public 的配置，避免后台私有运营配置泄露。
  async getPublicSiteSettings() {
    const groups = await this.getPublicSettingGroups();

    return {
      groups,
      values: this.toPublicSettingValues(groups),
    };
  }

  // 关于页与后续静态页先复用 setting 存储，降低 MVP 交付成本。
  async getPublicStaticPage(pageSlug: string) {
    const normalizedPageSlug = pageSlug.trim().toLowerCase();

    if (normalizedPageSlug !== 'about') {
      throw new NotFoundException({
        code: 'STATIC_PAGE_NOT_FOUND',
        message: '静态页面不存在',
      });
    }

    const [groups, latestUpdatedRecord] = await Promise.all([
      this.getPublicSettingGroups(),
      this.prismaService.setting.findFirst({
        where: {
          key: {
            in: [
              'static.about.title',
              'static.about.summary',
              'static.about.content',
              'static.about.seoTitle',
              'static.about.seoDescription',
            ],
          },
          isPublic: true,
        },
        orderBy: [{ updatedAt: 'desc' }],
        select: {
          updatedAt: true,
        },
      }),
    ]);

    const values = this.toPublicSettingValues(groups);
    const staticSettings = values.static ?? {};
    const siteSettings = values.site ?? {};
    const seoSettings = values.seo ?? {};

    return {
      slug: 'about',
      title: this.toOptionalString(staticSettings['about.title']) || '关于我',
      summary: this.toOptionalString(staticSettings['about.summary']),
      content: this.toOptionalString(staticSettings['about.content']),
      seoTitle:
        this.toOptionalString(staticSettings['about.seoTitle']) ||
        this.toOptionalString(seoSettings.defaultTitle) ||
        this.toOptionalString(siteSettings.title) ||
        '关于我',
      seoDescription:
        this.toOptionalString(staticSettings['about.seoDescription']) ||
        this.toOptionalString(siteSettings.description) ||
        null,
      updatedAt: latestUpdatedRecord?.updatedAt.toISOString() ?? null,
    };
  }

  // 站点概览额外补齐文章与评论公开统计，供前台首页或页脚直接消费。
  async getPublicSiteOverview() {
    const [groups, publishedPostCount, approvedCommentCount, latestPublishedPost] = await Promise.all([
      this.getPublicSettingGroups(),
      this.prismaService.post.count({
        where: {
          deletedAt: null,
          status: PostStatus.PUBLISHED,
          visibility: PostVisibility.PUBLIC,
          publishedAt: {
            not: null,
            lte: new Date(),
          },
        },
      }),
      this.prismaService.comment.count({
        where: {
          status: CommentStatus.APPROVED,
          post: {
            deletedAt: null,
            status: PostStatus.PUBLISHED,
            visibility: PostVisibility.PUBLIC,
            publishedAt: {
              not: null,
              lte: new Date(),
            },
          },
        },
      }),
      this.prismaService.post.findFirst({
        where: {
          deletedAt: null,
          status: PostStatus.PUBLISHED,
          visibility: PostVisibility.PUBLIC,
          publishedAt: {
            not: null,
            lte: new Date(),
          },
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          publishedAt: true,
        },
      }),
    ]);

    const values = this.toPublicSettingValues(groups);

    return {
      site: values.site ?? {},
      seo: values.seo ?? {},
      comment: values.comment ?? {},
      content: values.content ?? {},
      static: values.static ?? {},
      stats: {
        publishedPostCount,
        approvedCommentCount,
      },
      latestPublishedPost,
    };
  }

  // 面向非后台链路读取单个设置值，缺失或脏数据时回退默认值，避免公开接口因设置异常直接失败。
  async getSettingValue<T extends string | boolean | number | string[]>(key: string): Promise<T> {
    const definition = SETTING_DEFINITION_MAP.get(key);

    if (!definition) {
      throw new NotFoundException({
        code: 'SETTING_KEY_INVALID',
        message: `配置 ${key} 不存在`,
      });
    }

    const persisted = await this.prismaService.setting.findUnique({
      where: { key },
      select: {
        value: true,
      },
    });

    if (!persisted) {
      return definition.defaultValue as T;
    }

    try {
      return parseStoredSettingValue(definition, persisted.value) as T;
    }
    catch {
      return definition.defaultValue as T;
    }
  }

  private async getPublicSettingGroups() {
    const publicDefinitions = SETTING_DEFINITIONS.filter((definition) => definition.isPublic);
    const settings = await this.prismaService.setting.findMany({
      where: {
        key: {
          in: publicDefinitions.map((definition) => definition.key),
        },
        isPublic: true,
      },
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    const settingMap = new Map(settings.map((item) => [item.key, item]));
    return SETTING_GROUPS.map((group) => this.buildGroupPayload(group, settingMap, true)).filter(
      (group) => group.items.length > 0,
    );
  }

  private toPublicSettingValues(groups: PublicSettingGroupPayload[]) {
    return groups.reduce<Record<string, Record<string, unknown>>>((accumulator, group) => {
      accumulator[group.group] = group.items.reduce<Record<string, unknown>>((groupAccumulator, item) => {
        const [, ...restFields] = item.key.split('.');
        const field = restFields.join('.');

        groupAccumulator[field] = item.value;
        return groupAccumulator;
      }, {});

      return accumulator;
    }, {});
  }

  private buildGroupPayload(
    group: string,
    settingMap: Map<string, SettingRecordLike>,
    publicOnly: boolean,
  ) {
    const items = SETTING_DEFINITIONS.filter((definition) => definition.group === group)
      .filter((definition) => (publicOnly ? definition.isPublic : true))
      .map((definition) => {
        const persisted = settingMap.get(definition.key);
        return this.toSettingItem(definition.key, persisted);
      });

    return {
      group,
      items,
    };
  }

  private toSettingItem(key: string, persisted?: SettingRecordLike) {
    const definition = SETTING_DEFINITION_MAP.get(key);

    if (!definition) {
      throw new NotFoundException({
        code: 'SETTING_KEY_INVALID',
        message: `配置 ${key} 不存在`,
      });
    }

    return {
      key: definition.key,
      group: definition.group,
      description: definition.description,
      isPublic: definition.isPublic,
      value: persisted
        ? parseStoredSettingValue(definition, persisted.value)
        : definition.defaultValue,
      updatedById: persisted?.updatedById ?? null,
      createdAt: persisted?.createdAt ?? null,
      updatedAt: persisted?.updatedAt ?? null,
    };
  }

  private toOptionalString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalizedValue = value.trim();
    return normalizedValue.length > 0 ? normalizedValue : null;
  }

  private ensureSuperAdmin(currentUser: AuthenticatedUser): void {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }

    throw new ForbiddenException({
      code: 'SETTING_UPDATE_FORBIDDEN',
      message: '仅超级管理员可访问站点设置',
    });
  }
}
