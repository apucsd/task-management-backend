import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UserStatus } from 'generated/prisma/enums';
import { AppError } from 'src/common/errors/app-error';
import QueryBuilder from 'src/common/utils/query-builder';

const USER_PUBLIC_SELECT = {
    id: true,
    name: true,
    email: true,
    image: true,
} as const;

@Injectable()
export class ProjectService {
    constructor(private prisma: PrismaService) {}

    // ---------- PRIVATE HELPERS ----------

    private async findProjectOrThrow(id: string) {
        const project = await this.prisma.project.findUnique({
            where: { id },
        });

        if (!project) {
            throw new AppError(HttpStatus.NOT_FOUND, 'Project not found');
        }

        return project;
    }

    private assertOwner(
        project: { ownerId: string },
        userId: string,
        message: string,
    ) {
        if (project.ownerId !== userId) {
            throw new AppError(HttpStatus.FORBIDDEN, message);
        }
    }

    // ---------- PUBLIC METHODS ----------

    async createProject(userId: string, dto: CreateProjectDto) {
        return this.prisma.project.create({
            data: {
                name: dto.name,
                description: dto.description,
                ownerId: userId,
                // Owner is also stored as a member so membership queries
                // cover every user who has access to the project.
                members: {
                    create: {
                        userId,
                    },
                },
            },
        });
    }

    async getAllProjects(userId: string, query: ProjectQueryDto) {
        const whereClause: Record<string, any> = {};

        if (query.type === 'owned') {
            whereClause.ownerId = userId;
        } else if (query.type === 'member') {
            // Member of the project but not the owner
            whereClause.members = { some: { userId } };
            whereClause.ownerId = { not: userId };
        } else {
            // USER IS OWNER OR MEMBER
            whereClause.OR = [
                { ownerId: userId },
                { members: { some: { userId } } },
            ];
        }

        const { type: _type, ...restQuery } = query;
        const builder = new QueryBuilder(this.prisma.project, {
            ...restQuery,
        });

        const result = await builder
            .search(['name', 'description'])
            .where(whereClause)
            .filter()
            .sort()
            .paginate()
            .fields()
            .exclude()
            .customFields({
                id: true,
                name: true,
                description: true,
                ownerId: true,
                createdAt: true,
                updatedAt: true,
                owner: {
                    select: USER_PUBLIC_SELECT,
                },
                members: {
                    select: {
                        id: true,
                        userId: true,
                        user: {
                            select: USER_PUBLIC_SELECT,
                        },
                        createdAt: true,
                    },
                },
                _count: {
                    select: {
                        members: true,
                    },
                },
            })
            .execute();

        const mappedProjects = result.data.map((project: any) => ({
            ...project,
            isOwner: project.ownerId === userId,
        }));

        return {
            ...result,
            data: mappedProjects,
        };
    }

    async getProjectById(id: string, userId: string) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                owner: {
                    select: USER_PUBLIC_SELECT,
                },
                members: {
                    select: {
                        id: true,
                        userId: true,
                        user: {
                            select: USER_PUBLIC_SELECT,
                        },
                    },
                },
            },
        });

        if (!project) {
            throw new AppError(HttpStatus.NOT_FOUND, 'Project not found');
        }

        // ACCESS CONTROL CHECK
        const isOwner = project.ownerId === userId;
        const isMember = project.members.some((m) => m.userId === userId);

        if (!isOwner && !isMember) {
            throw new AppError(
                HttpStatus.FORBIDDEN,
                'You do not have access to this project',
            );
        }

        return {
            ...project,
            isOwner,
        };
    }

    async updateProject(id: string, userId: string, dto: UpdateProjectDto) {
        const project = await this.findProjectOrThrow(id);
        this.assertOwner(
            project,
            userId,
            'Only project owner can update project',
        );

        return this.prisma.project.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.description !== undefined && {
                    description: dto.description,
                }),
            },
        });
    }

    async deleteProject(id: string, userId: string) {
        const project = await this.findProjectOrThrow(id);
        this.assertOwner(
            project,
            userId,
            'Only project owner can delete project',
        );

        return this.prisma.project.delete({
            where: { id },
        });
    }

    async addMember(
        projectId: string,
        currentUserId: string,
        dto: AddMemberDto,
    ) {
        const project = await this.findProjectOrThrow(projectId);
        this.assertOwner(
            project,
            currentUserId,
            'Only project owner can add members',
        );

        const userToAdd = await this.prisma.user.findFirst({
            where: { id: dto.userId, status: UserStatus.ACTIVE },
            select: { id: true },
        });

        if (!userToAdd) {
            throw new AppError(
                HttpStatus.NOT_FOUND,
                'Active user with this ID not found',
            );
        }

        if (userToAdd.id === project.ownerId) {
            throw new AppError(
                HttpStatus.BAD_REQUEST,
                'User is already the owner of this project',
            );
        }

        // Targeted lookup instead of loading every member
        const existingMember = await this.prisma.projectMember.findFirst({
            where: { projectId, userId: userToAdd.id },
            select: { id: true },
        });

        if (existingMember) {
            throw this.alreadyMemberError();
        }

        try {
            return await this.prisma.projectMember.create({
                data: {
                    projectId,
                    userId: userToAdd.id,
                },
                include: {
                    user: {
                        select: USER_PUBLIC_SELECT,
                    },
                },
            });
        } catch (error: any) {
            // P2002 = unique constraint violation (concurrent request won the race).
            // Requires @@unique([projectId, userId]) on ProjectMember in schema.prisma.
            if (error?.code === 'P2002') {
                throw this.alreadyMemberError();
            }
            throw error;
        }
    }

    async removeMember(
        projectId: string,
        memberIdOrUserId: string,
        currentUserId: string,
    ) {
        const project = await this.findProjectOrThrow(projectId);

        // FIND MEMBER RECORD (targeted query)
        const memberRecord = await this.prisma.projectMember.findFirst({
            where: {
                projectId,
                OR: [{ id: memberIdOrUserId }, { userId: memberIdOrUserId }],
            },
        });

        if (!memberRecord) {
            throw new AppError(
                HttpStatus.NOT_FOUND,
                'Member not found in this project',
            );
        }

        if (memberRecord.userId === project.ownerId) {
            throw new AppError(
                HttpStatus.BAD_REQUEST,
                'Cannot remove owner from the project',
            );
        }

        // PERMISSION: OWNER CAN REMOVE ANYONE, MEMBER CAN LEAVE THEMSELVES
        const isOwner = project.ownerId === currentUserId;
        const isSelf = memberRecord.userId === currentUserId;

        if (!isOwner && !isSelf) {
            throw new AppError(
                HttpStatus.FORBIDDEN,
                'You do not have permission to remove this member',
            );
        }

        return this.prisma.projectMember.delete({
            where: { id: memberRecord.id },
        });
    }

    private alreadyMemberError() {
        return new AppError(
            HttpStatus.CONFLICT,
            'User is already a member of this project',
        );
    }
}
