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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoryService, CreateCategoryDto, UpdateCategoryDto } from './category.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: '카테고리 생성' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '카테고리가 성공적으로 생성됨' })
  async create(@Body() createCategoryDto: CreateCategoryDto, @Request() req) {
    return await this.categoryService.create(createCategoryDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '사용자 카테고리 목록 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '카테고리 목록 조회 성공' })
  async findAll(@Request() req) {
    return await this.categoryService.findAllByUser(req.user.id);
  }

  @Get('system')
  @ApiOperation({ summary: '시스템 카테고리 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '시스템 카테고리 조회 성공' })
  async getSystemCategories() {
    return await this.categoryService.getSystemCategories();
  }

  @Post('initialize')
  @ApiOperation({ summary: '기본 카테고리 초기화' })
  @ApiResponse({ status: HttpStatus.OK, description: '기본 카테고리 초기화 완료' })
  async initializeCategories() {
    await this.categoryService.initializeDefaultCategories();
    return { message: '기본 카테고리가 초기화되었습니다.' };
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 카테고리 조회' })
  @ApiResponse({ status: HttpStatus.OK, description: '카테고리 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '카테고리를 찾을 수 없음' })
  async findOne(@Param('id') id: string, @Request() req) {
    return await this.categoryService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '카테고리 수정' })
  @ApiResponse({ status: HttpStatus.OK, description: '카테고리가 성공적으로 수정됨' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '카테고리를 찾을 수 없음' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Request() req
  ) {
    return await this.categoryService.update(id, updateCategoryDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '카테고리 삭제' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '카테고리가 성공적으로 삭제됨' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '카테고리를 찾을 수 없음' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.categoryService.remove(id, req.user.id);
    return { message: '카테고리가 성공적으로 삭제되었습니다.' };
  }
}