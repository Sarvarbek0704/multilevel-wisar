import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({ example: 'Aziza' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  firstName!: string;

  @ApiPropertyOptional({ example: 'Karimova' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google ID token obtained on the frontend' })
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}

export class TelegramLoginDto {
  @ApiProperty({ description: 'Telegram user id' })
  @Type(() => Number)
  @IsInt()
  id!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  first_name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photo_url?: string;

  @ApiProperty({ description: 'Unix time of authentication' })
  @Type(() => Number)
  @IsInt()
  auth_date!: number;

  @ApiProperty({ description: 'HMAC signature from Telegram Login Widget' })
  @IsString()
  @IsNotEmpty()
  hash!: string;
}
