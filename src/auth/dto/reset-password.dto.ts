import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({
        description: 'JWT reset token received after OTP verification',
    })
    @IsString()
    @IsNotEmpty()
    resetToken: string;

    @ApiProperty({ example: 'NewSecretPass123!' })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    newPassword: string;
}
