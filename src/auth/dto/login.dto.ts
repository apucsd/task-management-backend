import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        example: 'apusutradhar77@gmail.com',
        description: 'User email address',
    })
    @IsEmail({}, { message: 'Please enter a valid email' })
    email: string;

    @ApiProperty({
        example: '12345678',
        description: 'User password (minimum 6 characters)',
    })
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    password: string;
}
