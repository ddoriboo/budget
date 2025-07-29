import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: '서버 헬스체크' })
  @ApiResponse({ status: 200, description: '서버 정상 작동' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: this.configService.get('NODE_ENV'),
      version: '1.0.0',
      database: 'connected', // TODO: 실제 DB 연결 상태 확인
    };
  }

  @Get('db')
  @ApiOperation({ summary: '데이터베이스 연결 상태 확인' })
  @ApiResponse({ status: 200, description: 'DB 연결 정상' })
  async getDatabaseHealth() {
    // TODO: TypeORM 연결 상태 확인 로직 추가
    return {
      status: 'ok',
      database: 'postgresql',
      connected: true,
      timestamp: new Date().toISOString(),
    };
  }
}