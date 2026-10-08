import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TaskPriority, TaskStatus } from 'generated/prisma/enums';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class TaskQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Filter tasks by project ID',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    })
    @IsOptional()
    @IsUUID()
    projectId?: string;

    @ApiPropertyOptional({
        enum: TaskStatus,
        description: 'Filter tasks by status (TODO, IN_PROGRESS, DONE)',
    })
    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @ApiPropertyOptional({
        enum: TaskPriority,
        description: 'Filter tasks by priority (LOW, MEDIUM, HIGH)',
    })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiPropertyOptional({
        description: 'Filter tasks by assignee user ID',
        example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    })
    @IsOptional()
    @IsUUID()
    assigneeId?: string;

    @ApiPropertyOptional({
        description: 'Sort expression (e.g. -createdAt or dueDate)',
        example: '-createdAt',
    })
    @IsOptional()
    @IsString()
    sort?: string;
}
