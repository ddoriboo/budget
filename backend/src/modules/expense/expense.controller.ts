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
import { ExpenseService } from './expense.service';
import { CreateExpenseDto, UpdateExpenseDto, ExpenseQueryDto, ExpenseStatsDto } from '../../dto/expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  async create(@Body() createExpenseDto: CreateExpenseDto, @Request() req) {
    return await this.expenseService.create(createExpenseDto, req.user.id);
  }

  @Get()
  async findAll(@Query() query: ExpenseQueryDto, @Request() req) {
    return await this.expenseService.findAll(query, req.user.id);
  }

  @Get('recent')
  async getRecent(@Query('limit') limit: number = 10, @Request() req) {
    return await this.expenseService.getRecentExpenses(req.user.id, limit);
  }

  @Get('stats')
  async getStats(@Query() statsDto: ExpenseStatsDto, @Request() req) {
    return await this.expenseService.getMonthlyStats(
      req.user.id,
      statsDto.year,
      statsDto.month
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return await this.expenseService.findOne(id, req.user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Request() req
  ) {
    return await this.expenseService.update(id, updateExpenseDto, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.expenseService.remove(id, req.user.id);
    return { message: '지출이 성공적으로 삭제되었습니다.' };
  }
}