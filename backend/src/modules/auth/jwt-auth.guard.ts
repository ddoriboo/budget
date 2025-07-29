import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // 개발 환경에서는 임시로 인증을 우회하고 테스트 사용자를 설정
    if (process.env.NODE_ENV === 'development') {
      const request = context.switchToHttp().getRequest();
      request.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: '테스트 사용자',
      };
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // 에러가 있거나 사용자가 없으면 UnauthorizedException 발생
    if (err || !user) {
      throw err || new UnauthorizedException('인증이 필요합니다.');
    }
    return user;
  }
}