import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ErrorInterceptor(),
  );

  // CORS 설정
  const frontendUrl = configService.get('FRONTEND_URL');
  const nodeEnv = configService.get('NODE_ENV');
  
  if (nodeEnv === 'production') {
    // 프로덕션: Railway 도메인 허용
    app.enableCors({
      origin: [
        frontendUrl || 'https://budget-production-b77e.up.railway.app',
        /^https:\/\/.*\.up\.railway\.app$/
      ],
      credentials: true,
    });
  } else {
    // 개발: localhost 허용
    app.enableCors({
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
    });
  }


  // 정적 파일 서빙 (프론트엔드)
  app.useStaticAssets(join(__dirname, '..', '..', 'frontend', 'dist'), {
    index: false,
    prefix: '',
  });
  
  // API 라우트에 대해서만 prefix 적용
  app.setGlobalPrefix('api');

  // SPA 라우팅을 위한 fallback
  app.use('*', (req: any, res: any, next: any) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
  });

  const port = configService.get('PORT') || 4000;
  await app.listen(port);

  console.log(`🚀 네이버 가계부 V2 API가 http://localhost:${port}에서 실행 중입니다.`);
}

bootstrap();