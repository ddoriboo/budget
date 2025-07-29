import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        
        // 에러 로깅
        this.logger.error(
          `${request.method} ${request.url} - ${error.message}`,
          error.stack,
        );

        // HTTP 예외가 아닌 경우 내부 서버 오류로 처리
        if (!(error instanceof HttpException)) {
          const status = HttpStatus.INTERNAL_SERVER_ERROR;
          const message = 'Internal server error';
          
          response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
          });
          
          return throwError(() => error);
        }

        // HTTP 예외인 경우 원래 에러 던지기
        return throwError(() => error);
      }),
    );
  }
}