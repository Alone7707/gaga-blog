import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoryQueryDto } from './dto/list-category-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

type CategoryListPayload = Prisma.CategoryGetPayload<{
  include: {
    _count: {
      select: {
        posts: true;
      };
    };
  };
}>;

type CategoryDetailPayload = Prisma.CategoryGetPayload<{
  include: {
    _count: {
      select: {
        posts: true;
      };
    };
  };
}>;

@Injectable()
export class CategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  // 分类列表支持分页、关键词和排序字段，满足后台最小管理能力。
  async listCategories(query: ListCategoryQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const keyword = query.keyword?.trim();
    const sortBy = query.sortBy ?? 'sortOrder';
    const sortOrder = query.sortOrder ?? 'asc';

    const where: Prisma.CategoryWhereInput = keyword
      ? {
          OR: [
            { name: { contains: keyword } },
            { slug: { contains: keyword } },
            { description: { contains: keyword } },
          ],
        }
      : {};

    const [list, total] = await this.prismaService.$transaction([
      this.prismaService.category.findMany({
        where,
        orderBy: this.buildOrderBy(sortBy, sortOrder),
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
      }),
      this.prismaService.category.count({ where }),
    ]);

    return {
      list: list.map((item) => this.toCategoryItem(item)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  // 创建时校验名称和 slug 唯一，避免后台录入重复分类。
  async createCategory(dto: CreateCategoryDto) {
    const slug = await this.ensureUniqueSlug(dto.slug, dto.name);
    await this.ensureUniqueName(dto.name);

    const created = await this.prismaService.category.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: this.normalizeOptionalText(dto.description),
        sortOrder: dto.sortOrder ?? 0,
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    return this.toCategoryItem(created);
  }

  // 更新接口支持名称、slug、描述与排序字段同步修改。
  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prismaService.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: '分类不存在',
      });
    }

    if (dto.name !== undefined) {
      await this.ensureUniqueName(dto.name, id);
    }

    const nextSlug =
      dto.slug !== undefined || dto.name !== undefined
        ? await this.ensureUniqueSlug(dto.slug ?? existing.slug, dto.name ?? existing.name, id)
        : existing.slug;

    const updated = await this.prismaService.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        slug: nextSlug,
        ...(dto.description !== undefined
          ? { description: this.normalizeOptionalText(dto.description) }
          : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    return this.toCategoryItem(updated);
  }

  private buildOrderBy(
    sortBy: 'sortOrder' | 'createdAt' | 'updatedAt' | 'name',
    sortOrder: 'asc' | 'desc',
  ): Prisma.CategoryOrderByWithRelationInput[] {
    if (sortBy === 'name') {
      return [{ name: sortOrder }, { createdAt: 'desc' }];
    }

    if (sortBy === 'createdAt') {
      return [{ createdAt: sortOrder }];
    }

    if (sortBy === 'updatedAt') {
      return [{ updatedAt: sortOrder }];
    }

    return [
      { sortOrder: sortOrder },
      { createdAt: 'desc' },
    ];
  }

  private async ensureUniqueName(name: string, currentId?: string) {
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new ConflictException({
        code: 'CATEGORY_NAME_CONFLICT',
        message: '分类名称不能为空',
      });
    }

    const existing = await this.prismaService.category.findFirst({
      where: {
        name: normalizedName,
        ...(currentId ? { id: { not: currentId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException({
        code: 'CATEGORY_NAME_CONFLICT',
        message: '分类名称已存在，请更换后重试',
      });
    }
  }

  private async ensureUniqueSlug(rawSlug: string | undefined, fallbackName: string, currentId?: string) {
    const baseSlug = this.normalizeSlug(rawSlug || fallbackName);

    if (!baseSlug) {
      throw new ConflictException({
        code: 'CATEGORY_SLUG_CONFLICT',
        message: '分类 slug 不能为空',
      });
    }

    const existing = await this.prismaService.category.findFirst({
      where: {
        slug: baseSlug,
        ...(currentId ? { id: { not: currentId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException({
        code: 'CATEGORY_SLUG_CONFLICT',
        message: '分类 slug 已存在，请更换后重试',
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

  private normalizeOptionalText(value?: string | null) {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  private toCategoryItem(category: CategoryListPayload | CategoryDetailPayload) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      postCount: category._count.posts,
    };
  }
}
