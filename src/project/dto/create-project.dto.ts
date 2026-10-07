import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjectDto {
    @ApiProperty({
        example: 'Task Management App',
        description: 'Project name',
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional({
        example: 'A project to manage team tasks and sprints',
        description: 'Project description',
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;
}
