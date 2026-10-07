import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class ProjectQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by role relative to user: owned | member | all',
        example: 'all',
    })
    @IsOptional()
    @IsString()
    type?: 'owned' | 'member' | 'all';
}
