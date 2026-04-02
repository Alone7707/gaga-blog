import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { ListTagQueryDto } from './dto/list-tag-query.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

type TagItemPayload = Prisma.TagGetPayload<{
  include: {
    _count: {
      select: {
        postTags: true;
      };
    };
  };
}>;

@Injectable()
export class TagService {
  constructor(private readonly prismaService: PrismaService) {}

  // 标签列表保留分页与关键词筛选，满足后台管理页最小查询需求。
  async listTags(query: ListTagQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const keyword = query.keyword?.trim();

    const where: Prisma.TagWhereInput = keyword
      ? {
          OR: [
            { name: { contains: keyword } },
            { slug: { contains: keyword } },
          ],
        }
      : {};

    const [list, total] = await this.prismaService.$transaction([
      this.prismaService.tag.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: {
              postTags: true,
            },
          },
        },
      }),
      this.prismaService.tag.count({ where }),
    ]);

    return {
      list: list.map((item) => this.toTagItem(item)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  // 标签创建仅保留名称与 slug 基础能力，避免范围失控。
  async createTag(dto: CreateTagDto) {
    const slug = await this.ensureUniqueSlug(dto.slug, dto.name);
    await this.ensureUniqueName(dto.name);

    const created = await this.prismaService.tag.create({
      data: {
        name: dto.name.trim(),
        slug,
      },
      include: {
        _count: {
          select: {
            postTags: true,
          },
        },
      },
    });

    return this.toTagItem(created);
  }

  // 更新接口支持标签名称与 slug 的同步维护。
  async updateTag(id: string, dto: UpdateTagDto) {
    const existing = await this.prismaService.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            postTags: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'TAG_NOT_FOUND',
        message: '标签不存在',
      });
    }

    if (dto.name !== undefined) {
      await this.ensureUniqueName(dto.name, id);
    }

    const nextSlug =
      dto.slug !== undefined || dto.name !== undefined
        ? await this.ensureUniqueSlug(dto.slug ?? existing.slug, dto.name ?? existing.name, id)
        : existing.slug;

    const updated = await this.prismaService.tag.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        slug: nextSlug,
      },
      include: {
        _count: {
          select: {
            postTags: true,
          },
        },
      },
    });

    return this.toTagItem(updated);
  }

  private async ensureUniqueName(name: string, currentId?: string) {
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new ConflictException({
        code: 'TAG_NAME_CONFLICT',
        message: '标签名称不能为空',
      });
    }

    const existing = await this.prismaService.tag.findFirst({
      where: {
        name: normalizedName,
        ...(currentId ? { id: { not: currentId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException({
        code: 'TAG_NAME_CONFLICT',
        message: '标签名称已存在，请更换后重试',
      });
    }
  }

  private async ensureUniqueSlug(rawSlug: string | undefined, fallbackName: string, currentId?: string) {
    const baseSlug = this.normalizeSlug(rawSlug || fallbackName);

    if (!baseSlug) {
      throw new ConflictException({
        code: 'TAG_SLUG_CONFLICT',
        message: '标签 slug 不能为空',
      });
    }

    const existing = await this.prismaService.tag.findFirst({
      where: {
        slug: baseSlug,
        ...(currentId ? { id: { not: currentId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException({
        code: 'TAG_SLUG_CONFLICT',
        message: '标签 slug 已存在，请更换后重试',
      });
    }

    return baseSlug;
  }

  private normalizeSlug(input: string) {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }

  private toTagItem(tag: TagItemPayload) {
    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      postCount: tag._count.postTags,
    };
  }
}
