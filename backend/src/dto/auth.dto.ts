import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email: string;

  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '비밀번호는 최소 8자리 이상이어야 합니다.' })
  @MaxLength(50, { message: '비밀번호는 최대 50자리까지 가능합니다.' })
  password: string;

  @IsString({ message: '이름은 문자열이어야 합니다.' })
  @MinLength(2, { message: '이름은 최소 2글자 이상이어야 합니다.' })
  @MaxLength(50, { message: '이름은 최대 50글자까지 가능합니다.' })
  name: string;
}

export class LoginDto {
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email: string;

  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  password: string;
}

export class ChangePasswordDto {
  @IsString({ message: '현재 비밀번호는 문자열이어야 합니다.' })
  currentPassword: string;

  @IsString({ message: '새 비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '새 비밀번호는 최소 8자리 이상이어야 합니다.' })
  @MaxLength(50, { message: '새 비밀번호는 최대 50자리까지 가능합니다.' })
  newPassword: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: '이름은 문자열이어야 합니다.' })
  @MinLength(2, { message: '이름은 최소 2글자 이상이어야 합니다.' })
  @MaxLength(50, { message: '이름은 최대 50글자까지 가능합니다.' })
  name?: string;

  @IsOptional()
  @IsString({ message: '프로필 이미지는 문자열이어야 합니다.' })
  @MaxLength(500, { message: '프로필 이미지 URL은 최대 500자까지 가능합니다.' })
  profileImage?: string;

  @IsOptional()
  settings?: Record<string, any>;
}

export class RefreshTokenDto {
  @IsString({ message: '토큰은 문자열이어야 합니다.' })
  token: string;
}