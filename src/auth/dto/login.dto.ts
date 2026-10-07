import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        example: 'admin@gmail.com',
        description: 'User email address',
    })
    @IsEmail({}, { message: 'Please enter a valid email' })
    email: string;

    @ApiProperty({
        example: '123456',
        description: 'User password (minimum 6 characters)',
    })
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    password: string;
}
