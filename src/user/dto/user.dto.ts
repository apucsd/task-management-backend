import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsDate,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    MinLength,
} from 'class-validator';
import { OtpType } from 'generated/prisma/enums';
import { RegisterDto } from 'src/auth/dto/register.dto';

export class CreateUserDto extends RegisterDto {
    @ApiPropertyOptional({ example: false, description: 'Is user verified' })
    @IsOptional()
    @IsBoolean()
    isVerified?: boolean = false;

    @ApiPropertyOptional({
        example: 123456,
        description: 'Verification OTP code',
    })
    @IsOptional()
    @IsNumber()
    otp?: number;

    @ApiPropertyOptional({ description: 'OTP expiry date' })
    @IsOptional()
    @IsDate()
    otpExpiry?: Date;

    @ApiPropertyOptional({ enum: OtpType, description: 'OTP type' })
    @IsOptional()
    @IsEnum(OtpType)
    otpType?: OtpType;
}

export class UpdateUserDto {
    @ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Name cannot be empty' })
    @MinLength(3, { message: 'Name must be at least 3 characters' })
    @MaxLength(50, { message: 'Name must be at most 50 characters' })
    name?: string;

    @ApiPropertyOptional({
        example: 'https://example.com/avatar.jpg',
        description: 'User profile image URL',
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Image cannot be empty' })
    @IsUrl({}, { message: 'Please provide a valid URL' })
    image?: string;
}
