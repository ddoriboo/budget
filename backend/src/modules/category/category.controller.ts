import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { CategoryService, CreateCategoryDto, UpdateCategoryDto } from './category.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto, @Request() req) {
    return await this.categoryService.create(createCategoryDto, req.user.id);
  }

  @Get()
  async findAll(@Request() req) {
    return await this.categoryService.findAllByUser(req.user.id);
  }

  @Get('system')
  async getSystemCategories() {
    return await this.categoryService.getSystemCategories();
  }

  @Post('initialize')
  async initializeCategories() {
    await this.categoryService.initializeDefaultCategories();
    return { message: '기본 카테고리가 초기화되었습니다.' };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return await this.categoryService.findOne(id, req.user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Request() req
  ) {
    return await this.categoryService.update(id, updateCategoryDto, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.categoryService.remove(id, req.user.id);
    return { message: '카테고리가 성공적으로 삭제되었습니다.' };
  }
}