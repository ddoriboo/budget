import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindManyOptions, DataSource } from 'typeorm';
import { Expense } from '../../entities/expense.entity';
import { Category } from '../../entities/category.entity';
import { CreateExpenseDto, UpdateExpenseDto, ExpenseQueryDto } from '../../dto/expense.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private dataSource: DataSource,
  ) {}

  // 지출 생성
  async create(createExpenseDto: CreateExpenseDto, userId: string): Promise<Expense> {
    const user = await this.dataSource.getRepository('User').findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      user,
    });

    return await this.expenseRepository.save(expense);
  }

  // 지출 목록 조회 (페이지네이션 및 필터링 지원)
  async findAll(query: ExpenseQueryDto, userId: string): Promise<{
    expenses: Expense[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      category,
      startDate,
      endDate,
      search,
      sortBy = 'expenseDate',
      sortOrder = 'DESC'
    } = query;

    const queryBuilder = this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .where('expense.user.id = :userId', { userId });

    // 카테고리 필터
    if (category) {
      queryBuilder.andWhere('category.name = :category', { category });
    }

    // 날짜 범위 필터
    if (startDate && endDate) {
      queryBuilder.andWhere('expense.expenseDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // 검색 필터 (장소, 메모)
    if (search) {
      queryBuilder.andWhere(
        '(expense.place ILIKE :search OR expense.memo ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // 정렬
    queryBuilder.orderBy(`expense.${sortBy}`, sortOrder);

    // 페이지네이션
    const total = await queryBuilder.getCount();
    const expenses = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      expenses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 특정 지출 조회
  async findOne(id: string, userId: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['category', 'user'],
    });

    if (!expense) {
      throw new NotFoundException('지출 내역을 찾을 수 없습니다.');
    }

    return expense;
  }

  // 지출 수정
  async update(id: string, updateExpenseDto: UpdateExpenseDto, userId: string): Promise<Expense> {
    const expense = await this.findOne(id, userId);

    Object.assign(expense, updateExpenseDto);
    return await this.expenseRepository.save(expense);
  }

  // 지출 삭제
  async remove(id: string, userId: string): Promise<void> {
    const expense = await this.findOne(id, userId);
    await this.expenseRepository.remove(expense);
  }

  // 월별 통계
  async getMonthlyStats(userId: string, year: number, month: number): Promise<{
    totalExpenses: number;
    totalAmount: number;
    categoryStats: Record<string, number>;
    dailyStats: Array<{ date: string; amount: number; count: number }>;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const expenses = await this.expenseRepository.find({
      where: {
        user: { id: userId },
        expenseDate: Between(startDate, endDate),
        isIncome: false,
      },
      relations: ['category'],
    });

    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    // 카테고리별 통계
    const categoryStats = expenses.reduce((stats, expense) => {
      const categoryName = expense.category?.name || '기타';
      stats[categoryName] = (stats[categoryName] || 0) + Number(expense.amount);
      return stats;
    }, {} as Record<string, number>);

    // 일별 통계
    const dailyStats = expenses.reduce((stats, expense) => {
      const date = expense.expenseDate.toISOString().split('T')[0];
      const existing = stats.find(stat => stat.date === date);
      
      if (existing) {
        existing.amount += Number(expense.amount);
        existing.count += 1;
      } else {
        stats.push({
          date,
          amount: Number(expense.amount),
          count: 1,
        });
      }
      
      return stats;
    }, [] as Array<{ date: string; amount: number; count: number }>);

    return {
      totalExpenses,
      totalAmount,
      categoryStats,
      dailyStats: dailyStats.sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  // 최근 지출 조회
  async getRecentExpenses(userId: string, limit: number = 10): Promise<Expense[]> {
    return await this.expenseRepository.find({
      where: { user: { id: userId } },
      relations: ['category'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}