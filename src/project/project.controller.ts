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
import { ProjectService } from './project.service';
import { AuthGuard } from 'src/common/guards/auth/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { AddMemberDto } from './dto/add-member.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('projects')
export class ProjectController {
    constructor(private readonly projectService: ProjectService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new project' })
    @ResponseMessage('Project created successfully')
    async createProject(
        @CurrentUser('id') userId: string,
        @Body() dto: CreateProjectDto,
    ) {
        return await this.projectService.createProject(userId, dto);
    }

    @Get()
    @ApiOperation({
        summary: 'List projects for current user (owned or member)',
    })
    @ResponseMessage('Projects fetched successfully')
    async getAllProjects(
        @CurrentUser('id') userId: string,
        @Query() query: ProjectQueryDto,
    ) {
        return await this.projectService.getAllProjects(userId, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get project details by ID' })
    @ResponseMessage('Project fetched successfully')
    async getProjectById(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
    ) {
        return await this.projectService.getProjectById(id, userId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update project (Owner only)' })
    @ResponseMessage('Project updated successfully')
    async updateProject(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
        @Body() dto: UpdateProjectDto,
    ) {
        return await this.projectService.updateProject(id, userId, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete project (Owner only)' })
    @ResponseMessage('Project deleted successfully')
    async deleteProject(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
    ) {
        return await this.projectService.deleteProject(id, userId);
    }

    @Post(':id/members')
    @ApiOperation({ summary: 'Add a member to project by userId (Owner only)' })
    @ResponseMessage('Member added successfully')
    async addMember(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
        @Body() dto: AddMemberDto,
    ) {
        return await this.projectService.addMember(id, userId, dto);
    }

    @Delete(':id/members/:memberId')
    @ApiOperation({ summary: 'Remove a member or leave project' })
    @ResponseMessage('Member removed successfully')
    async removeMember(
        @Param('id') id: string,
        @Param('memberId') memberId: string,
        @CurrentUser('id') userId: string,
    ) {
        return await this.projectService.removeMember(id, memberId, userId);
    }
}
