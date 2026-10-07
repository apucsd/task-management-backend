import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UserStatus } from 'generated/prisma/enums';
import { AppError } from 'src/common/errors/app-error';
import QueryBuilder from 'src/common/utils/query-builder';

@Injectable()
export class ProjectService {
    constructor(private prisma: PrismaService) {}

    async createProject(userId: string, dto: CreateProjectDto) {
        return this.prisma.$transaction(async (tx) => {
            const project = await tx.project.create({
                data: {
                    name: dto.name,
                    description: dto.description,
                    ownerId: userId,
                },
            });

            // ADD OWNER TO MEMBERS
            await tx.projectMember.create({
                data: {
                    projectId: project.id,
                    userId,
                },
            });

            return project;
        });
    }

    async getAllProjects(userId: string, query: ProjectQueryDto) {
        const whereClause: Record<string, any> = {};

        if (query.type === 'owned') {
            whereClause.ownerId = userId;
        } else if (query.type === 'member') {
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
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                members: {
                    select: {
                        id: true,
                        userId: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
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
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                members: {
                    select: {
                        id: true,
                        userId: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
                        },
                        createdAt: true,
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
        const project = await this.prisma.project.findUnique({
            where: { id },
        });

        if (!project) {
            throw new AppError(HttpStatus.NOT_FOUND, 'Project not found');
        }

        if (project.ownerId !== userId) {
            throw new AppError(
                HttpStatus.FORBIDDEN,
                'Only project owner can update project',
            );
        }

        return await this.prisma.project.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.description !== undefined && {
                    description: dto.description,
                }),
            },
        });
    }

    async deleteProject(id: string, userId: string) {
        const project = await this.prisma.project.findUnique({
            where: { id },
        });

        if (!project) {
            throw new AppError(HttpStatus.NOT_FOUND, 'Project not found');
        }

        if (project.ownerId !== userId) {
            throw new AppError(
                HttpStatus.FORBIDDEN,
                'Only project owner can delete project',
            );
        }

        return await this.prisma.project.delete({
            where: { id },
        });
    }

    async addMember(
        projectId: string,
        currentUserId: string,
        dto: AddMemberDto,
    ) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: { members: true },
        });

        if (!project) {
            throw new AppError(HttpStatus.NOT_FOUND, 'Project not found');
        }

        if (project.ownerId !== currentUserId) {
            throw new AppError(
                HttpStatus.FORBIDDEN,
                'Only project owner can add members',
            );
        }

        const userToAdd = await this.prisma.user.findFirst({
            where: { id: dto.userId, status: UserStatus.ACTIVE },
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

        const isAlreadyMember = project.members.some(
            (m) => m.userId === userToAdd.id,
        );
        if (isAlreadyMember) {
            throw new AppError(
                HttpStatus.CONFLICT,
                'User is already a member of this project',
            );
        }

        return await this.prisma.projectMember.create({
            data: {
                projectId,
                userId: userToAdd.id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
        });
    }

    async removeMember(
        projectId: string,
        memberIdOrUserId: string,
        currentUserId: string,
    ) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: { members: true },
        });

        if (!project) {
            throw new AppError(HttpStatus.NOT_FOUND, 'Project not found');
        }

        // FIND MEMBER RECORD
        const memberRecord = project.members.find(
            (m) => m.id === memberIdOrUserId || m.userId === memberIdOrUserId,
        );

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

        return await this.prisma.projectMember.delete({
            where: { id: memberRecord.id },
        });
    }
}
