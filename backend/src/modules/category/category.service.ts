import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { seedDefaultCategories } from '../../seeds/category.seed';

export interface CreateCategoryDto {
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  parentId?: string;
  color?: string;
  icon?: string;
}

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private dataSource: DataSource,
  ) {}

  // 사용자 카테고리 조회 (시스템 카테고리 포함)
  async findAllByUser(userId: string): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: [
        { user: { id: userId } }, // 사용자 카테고리
        { user: null, isSystem: true }, // 시스템 카테고리
      ],
      relations: ['parent', 'children', 'user'],
      order: { createdAt: 'ASC' },
    });
  }

  // 카테고리 생성
  async create(createCategoryDto: CreateCategoryDto, userId: string): Promise<Category> {
    const user = await this.dataSource.getRepository('User').findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      user,
      isSystem: false,
    });

    return await this.categoryRepository.save(category);
  }

  // 카테고리 수정
  async update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user'],
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    if (category.isSystem) {
      throw new NotFoundException('시스템 카테고리는 수정할 수 없습니다.');
    }

    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  // 카테고리 삭제
  async remove(id: string, userId: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id, userId },
      relations: ['expenses'],
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    if (category.isSystem) {
      throw new NotFoundException('시스템 카테고리는 삭제할 수 없습니다.');
    }

    if (category.expenses && category.expenses.length > 0) {
      throw new NotFoundException('해당 카테고리에 지출 내역이 있어 삭제할 수 없습니다.');
    }

    await this.categoryRepository.remove(category);
  }

  // 특정 카테고리 조회
  async findOne(id: string, userId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: [
        { id, userId },
        { id, userId: null, isSystem: true },
      ],
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    return category;
  }

  // 기본 카테고리 시드 데이터 초기화
  async initializeDefaultCategories(): Promise<void> {
    await seedDefaultCategories(this.dataSource);
  }

  // 시스템 카테고리 조회
  async getSystemCategories(): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { isSystem: true, userId: null },
      relations: ['children'],
      order: { createdAt: 'ASC' },
    });
  }
}