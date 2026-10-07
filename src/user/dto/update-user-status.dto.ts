import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from 'generated/prisma/enums';

export class UpdateUserStatusDto {
    @ApiProperty({
        enum: UserStatus,
        example: UserStatus.BLOCKED,
        description: 'Target account status (ACTIVE, BLOCKED, DELETED)',
    })
    @IsEnum(UserStatus, { message: 'Invalid user status' })
    @IsNotEmpty({ message: 'Status is required' })
    status: UserStatus;
}
