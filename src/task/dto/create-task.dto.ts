import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { TaskPriority, TaskStatus } from 'generated/prisma/enums';

export class CreateTaskDto {
    @ApiProperty({
        example: 'Implement authentication flow',
        description: 'Task title',
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(200)
    title: string;

    @ApiPropertyOptional({
        example: 'Set up JWT, refresh tokens, and cookies',
        description: 'Task description',
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @ApiPropertyOptional({
        enum: TaskStatus,
        default: TaskStatus.TODO,
        description: 'Task status (TODO, IN_PROGRESS, DONE)',
    })
    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @ApiPropertyOptional({
        enum: TaskPriority,
        default: TaskPriority.MEDIUM,
        description: 'Task priority (LOW, MEDIUM, HIGH)',
    })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiPropertyOptional({
        example: '2026-10-15T00:00:00.000Z',
        description: 'Task due date in ISO 8601 format',
    })
    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @ApiProperty({
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        description: 'ID of the project this task belongs to',
    })
    @IsNotEmpty()
    @IsUUID()
    projectId: string;

    @ApiPropertyOptional({
        example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        description: 'ID of the assigned project member',
    })
    @IsOptional()
    @IsUUID()
    assigneeId?: string;
}
