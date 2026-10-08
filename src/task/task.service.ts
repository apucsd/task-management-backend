import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { AppError } from 'src/common/errors/app-error';
import QueryBuilder from 'src/common/utils/query-builder';

const USER_PUBLIC_SELECT = {
    id: true,
    name: true,
    email: true,
    image: true,
} as const;

@Injectable()
export class TaskService {
    constructor(private prisma: PrismaService) {}

    // ---------- PRIVATE HELPERS ----------

    private async findTaskOrThrow(id: string) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        ownerId: true,
                    },
                },
                assignee: {
                    select: USER_PUBLIC_SELECT,
                },
            },
        });

        if (!task) {
            throw new AppError(HttpStatus.NOT_FOUND, 'Task not found');
        }

        return task;
    }

    private async ensureProjectAccess(projectId: string, userId: string) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    where: { userId },
                    select: { id: true },
                },
            },
        });

        if (!project) {
            throw new AppError(HttpStatus.NOT_FOUND, 'Project not found');
        }

        const isOwner = project.ownerId === userId;
        const isMember = project.members.length > 0;

        if (!isOwner && !isMember) {
            throw new AppError(
                HttpStatus.FORBIDDEN,
                'You do not have access to this project',
            );
        }

        return project;
    }

    private async ensureAssigneeIsMember(
        projectId: string,
        assigneeId: string,
    ) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    where: { userId: assigneeId },
                    select: { id: true },
                },
            },
        });

        const isOwner = project?.ownerId === assigneeId;
        const isMember = (project?.members.length ?? 0) > 0;

        if (!isOwner && !isMember) {
            throw new AppError(
                HttpStatus.BAD_REQUEST,
                'Assignee must be a member of this project',
            );
        }
    }

    // ---------- PUBLIC METHODS ----------

    async createTask(userId: string, dto: CreateTaskDto) {
        await this.ensureProjectAccess(dto.projectId, userId);

        if (dto.assigneeId) {
            await this.ensureAssigneeIsMember(dto.projectId, dto.assigneeId);
        }

        return this.prisma.task.create({
            data: {
                ...dto,
                ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
            },
        });
    }

    async getTasks(userId: string, query: TaskQueryDto) {
        const whereClause: Record<string, any> = {};

        if (query.projectId) {
            // CHECK ACCESS TO SPECIFIC PROJECT
            await this.ensureProjectAccess(query.projectId, userId);
            whereClause.projectId = query.projectId;
        } else {
            // ONLY TASKS IN USER'S PROJECTS
            whereClause.project = {
                OR: [{ ownerId: userId }, { members: { some: { userId } } }],
            };
        }

        if (query.status) {
            whereClause.status = query.status;
        }

        if (query.priority) {
            whereClause.priority = query.priority;
        }

        if (query.assigneeId) {
            whereClause.assigneeId = query.assigneeId;
        }

        const {
            projectId: _projectId,
            status: _status,
            priority: _priority,
            assigneeId: _assigneeId,
            ...restQuery
        } = query;

        const builder = new QueryBuilder(this.prisma.task, restQuery);

        return builder
            .search(['title', 'description'])
            .where(whereClause)
            .filter()
            .sort()
            .paginate()
            .fields()
            .exclude()
            .customFields({
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                dueDate: true,
                projectId: true,
                assigneeId: true,
                createdAt: true,
                updatedAt: true,
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                assignee: {
                    select: USER_PUBLIC_SELECT,
                },
            })
            .execute();
    }

    async getTaskById(id: string, userId: string) {
        const task = await this.findTaskOrThrow(id);
        await this.ensureProjectAccess(task.projectId, userId);
        return task;
    }

    async updateTask(id: string, userId: string, dto: UpdateTaskDto) {
        const task = await this.findTaskOrThrow(id);
        await this.ensureProjectAccess(task.projectId, userId);

        if (dto.assigneeId) {
            await this.ensureAssigneeIsMember(task.projectId, dto.assigneeId);
        }

        return this.prisma.task.update({
            where: { id },
            data: {
                ...dto,
                ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
            },
        });
    }

    async deleteTask(id: string, userId: string) {
        const task = await this.findTaskOrThrow(id);

        // PERMISSION: ONLY PROJECT OWNER CAN DELETE TASKS
        if (task.project.ownerId !== userId) {
            throw new AppError(
                HttpStatus.FORBIDDEN,
                'Only project owner can delete tasks',
            );
        }

        return this.prisma.task.delete({
            where: { id },
        });
    }
}
