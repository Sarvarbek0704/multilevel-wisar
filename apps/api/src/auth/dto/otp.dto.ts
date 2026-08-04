import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const CODE_RULES = { message: 'Kod 6 xonali raqam bo‘lishi kerak' };

export class EmailOtpRequestDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  email!: string;
}

export class EmailOtpVerifyDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, CODE_RULES)
  code!: string;

  @ApiPropertyOptional({
    description: 'Yangi hisob yaratilganda ishlatiladi',
    example: 'Aziza',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  firstName?: string;
}

export class PhoneOtpRequestDto {
  @ApiProperty({ example: '+998901234567', description: '901234567 shaklida ham bo‘ladi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone!: string;
}

export class PhoneOtpVerifyDto {
  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, CODE_RULES)
  code!: string;

  @ApiPropertyOptional({ example: 'Aziza' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  firstName?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, CODE_RULES)
  code!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiPropertyOptional({
    description: 'Hisobda parol bo‘lsa majburiy (Google/Telegram hisoblarida yo‘q)',
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}

export class AttachEmailRequestDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  email!: string;
}

export class AttachEmailVerifyDto extends AttachEmailRequestDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, CODE_RULES)
  code!: string;
}

export class AttachPhoneRequestDto {
  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone!: string;
}

export class AttachPhoneVerifyDto extends AttachPhoneRequestDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, CODE_RULES)
  code!: string;
}
