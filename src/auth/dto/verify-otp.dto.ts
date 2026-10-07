import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class VerifyOtpDto {
    @ApiProperty({ example: 'john.doe@example.com' })
    @IsEmail({}, { message: 'Please enter a valid email' })
    email: string;

    @ApiProperty({ example: 123456 })
    @IsNumber({}, { message: 'OTP must be a number' })
    @IsNotEmpty({ message: 'OTP is required' })
    otp: number;
}
