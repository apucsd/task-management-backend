import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({
        example: 'OldSecretPass123!',
        description: 'Current active password',
    })
    @IsString({ message: 'Old password is required' })
    oldPassword: string;

    @ApiProperty({
        example: 'NewSecretPass123!',
        description: 'New password (minimum 6 characters)',
    })
    @IsString({ message: 'New password is required' })
    @MinLength(6, { message: 'New password must be at least 6 characters' })
    newPassword: string;
}
