import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'john.doe@example.com' })
    @IsEmail({}, { message: 'Please enter a valid email' })
    email: string;

    @ApiProperty({ example: 'SecretPass123!' })
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    password: string;

    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    name: string;
}
