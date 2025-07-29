import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
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