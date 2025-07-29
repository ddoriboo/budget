import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExcelUpload } from '../../entities/excel-upload.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExcelUpload])],
  exports: [TypeOrmModule],
})
export class ExcelModule {}