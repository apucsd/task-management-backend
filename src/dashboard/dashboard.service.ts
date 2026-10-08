import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TaskPriority, TaskStatus } from 'generated/prisma/enums';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) {}

    async getOverview(userId: string) {
        // PROJECTS ACCESSIBLE TO THE USER
        const projectWhere = {
            OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        };

        // TASKS ACCESSIBLE WITHIN USER PROJECTS
        const taskWhere = {
            project: projectWhere,
        };

        const [
            totalProjects,
            activeProjects,
            totalTasks,
            completedTasks,
            inProgressTasks,
            todoTasks,
            highPriorityTasks,
        ] = await Promise.all([
            this.prisma.project.count({ where: projectWhere }),
            this.prisma.project.count({
                where: {
                    ...projectWhere,
                    tasks: { some: { status: { not: TaskStatus.DONE } } },
                },
            }),
            this.prisma.task.count({ where: taskWhere }),
            this.prisma.task.count({
                where: { ...taskWhere, status: TaskStatus.DONE },
            }),
            this.prisma.task.count({
                where: { ...taskWhere, status: TaskStatus.IN_PROGRESS },
            }),
            this.prisma.task.count({
                where: { ...taskWhere, status: TaskStatus.TODO },
            }),
            this.prisma.task.count({
                where: {
                    ...taskWhere,
                    priority: TaskPriority.HIGH,
                    status: { not: TaskStatus.DONE },
                },
            }),
        ]);

        return {
            projects: {
                total: totalProjects,
                active: activeProjects,
            },
            tasks: {
                total: totalTasks,
                completed: completedTasks,
                inProgress: inProgressTasks,
                todo: todoTasks,
                highPriority: highPriorityTasks,
            },
        };
    }
}
