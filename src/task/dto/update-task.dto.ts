import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDateString,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { TaskPriority, TaskStatus } from 'generated/prisma/enums';

export class UpdateTaskDto {
    @ApiPropertyOptional({
        example: 'Updated task title',
        description: 'Task title',
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    title?: string;

    @ApiPropertyOptional({
        example: 'Updated task description',
        description: 'Task description',
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @ApiPropertyOptional({
        enum: TaskStatus,
        description: 'Task status (TODO, IN_PROGRESS, DONE)',
    })
    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @ApiPropertyOptional({
        enum: TaskPriority,
        description: 'Task priority (LOW, MEDIUM, HIGH)',
    })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiPropertyOptional({
        example: '2026-10-20T00:00:00.000Z',
        description: 'Task due date in ISO 8601 format (null to remove)',
    })
    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @ApiPropertyOptional({
        example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        description: 'ID of the assigned project member (null to unassign)',
    })
    @IsOptional()
    @IsUUID()
    assigneeId?: string;
}
