import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { UserStatus } from 'generated/prisma/enums';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class UserQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({
        enum: UserStatus,
        description:
            'Filter users by status (ACTIVE, BLOCKED, DELETED). Pass ALL to view every status.',
    })
    @IsOptional()
    @IsString()
    status?: UserStatus | 'ALL';
}
