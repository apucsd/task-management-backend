import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { AuthGuard } from 'src/common/guards/auth/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('tasks')
export class TaskController {
    constructor(private readonly taskService: TaskService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new task' })
    @ResponseMessage('Task created successfully')
    async createTask(
        @CurrentUser('id') userId: string,
        @Body() dto: CreateTaskDto,
    ) {
        return this.taskService.createTask(userId, dto);
    }

    @Get()
    @ApiOperation({
        summary: 'Get tasks with search, filtering, and pagination',
        description:
            'Search by title/description. Filter by projectId, status, priority, and assigneeId. Paginate with page & limit.',
    })
    @ResponseMessage('Tasks fetched successfully')
    async getTasks(
        @CurrentUser('id') userId: string,
        @Query() query: TaskQueryDto,
    ) {
        return this.taskService.getTasks(userId, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get task by ID' })
    @ResponseMessage('Task fetched successfully')
    async getTaskById(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.taskService.getTaskById(id, userId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update task details, status, or assignee' })
    @ResponseMessage('Task updated successfully')
    async updateTask(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
        @Body() dto: UpdateTaskDto,
    ) {
        return this.taskService.updateTask(id, userId, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a task (Project owner only)' })
    @ResponseMessage('Task deleted successfully')
    async deleteTask(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.taskService.deleteTask(id, userId);
    }
}
