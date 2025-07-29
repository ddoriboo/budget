import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { ChatModule } from './modules/chat/chat.module';
import { ExcelModule } from './modules/excel/excel.module';
import { CategoryModule } from './modules/category/category.module';
import { HealthModule } from './modules/health/health.module';

// Entities
import { User } from './entities/user.entity';
import { Expense } from './entities/expense.entity';
import { Category } from './entities/category.entity';
import { ChatSession } from './entities/chat-session.entity';
import { ExcelUpload } from './entities/excel-upload.entity';

@Module({
  imports: [
    // 환경 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 데이터베이스 설정
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [User, Expense, Category, ChatSession, ExcelUpload],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? { 
          rejectUnauthorized: false,
          sslmode: 'require'
        } : false,
        // Railway PostgreSQL 최적화 설정
        extra: {
          connectionTimeoutMillis: 5000,
          query_timeout: 10000,
          statement_timeout: 10000,
          idle_in_transaction_session_timeout: 10000,
        },
        // 연결 풀 최적화 (Railway 제한사항 고려)
        poolSize: configService.get('NODE_ENV') === 'production' ? 10 : 5,
        // 자동 재연결 설정
        retryAttempts: 3,
        retryDelay: 3000,
      }),
      inject: [ConfigService],
    }),


    // Feature Modules
    HealthModule,
    AuthModule,
    UserModule,
    ExpenseModule,
    ChatModule,
    ExcelModule,
    CategoryModule,
  ],
})
export class AppModule {}