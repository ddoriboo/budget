import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto, UpdateExpenseDto, ExpenseQueryDto, ExpenseStatsDto } from '../../dto/expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @ApiOperation({ summary: '지출 생성' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '지출이 성공적으로 생성됨' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증되지 않은 사용자' })
  async create(@Body() createExpenseDto: CreateExpenseDto, @Request() req) {
    return await this.expenseService.create(createExpenseDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '지출 목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '지출 목록 조회 성공' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 크기' })
  @ApiQuery({ name: 'category', required: false, description: '카테고리 필터' })
  @ApiQuery({ name: 'startDate', required: false, description: '시작 날짜' })
  @ApiQuery({ name: 'endDate', required: false, description: '종료 날짜' })
  @ApiQuery({ name: 'search', required: false, description: '검색어' })
  @ApiQuery({ name: 'sortBy', required: false, description: '정렬 기준' })
  @ApiQuery({ name: 'sortOrder', required: false, description: '정렬 순서' })
  async findAll(@Query() query: ExpenseQueryDto, @Request() req) {
    return await this.expenseService.findAll(query, req.user.id);
  }

  @Get('recent')
  @ApiOperation({ summary: '최근 지출 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '최근 지출 조회 성공' })
  @ApiQuery({ name: 'limit', required: false, description: '조회할 개수 (기본값: 10)' })
  async getRecent(@Query('limit') limit: number = 10, @Request() req) {
    return await this.expenseService.getRecentExpenses(req.user.id, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: '월별 지출 통계' })
  @ApiResponse({ status: HttpStatus.OK, description: '통계 조회 성공' })
  async getStats(@Query() statsDto: ExpenseStatsDto, @Request() req) {
    return await this.expenseService.getMonthlyStats(
      req.user.id,
      statsDto.year,
      statsDto.month
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 지출 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '지출 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '지출을 찾을 수 없음' })
  async findOne(@Param('id') id: string, @Request() req) {
    return await this.expenseService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '지출 수정' })
  @ApiResponse({ status: HttpStatus.OK, description: '지출이 성공적으로 수정됨' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '지출을 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청 데이터' })
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Request() req
  ) {
    return await this.expenseService.update(id, updateExpenseDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '지출 삭제' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '지출이 성공적으로 삭제됨' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '지출을 찾을 수 없음' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.expenseService.remove(id, req.user.id);
    return { message: '지출이 성공적으로 삭제되었습니다.' };
  }
}