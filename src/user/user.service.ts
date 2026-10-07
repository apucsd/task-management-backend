import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User, UserStatus } from 'generated/prisma/client';
import { CreateUserDto } from './dto/user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import QueryBuilder from 'src/common/utils/query-builder';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId, status: UserStatus.ACTIVE },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            ...user,
        };
    }

    async createUser(userData: CreateUserDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: userData.email },
        });

        if (existingUser) {
            throw new ConflictException(
                'This email is already registered. Use another email',
            );
        }

        return await this.prisma.user.create({
            data: {
                ...userData,
                isVerified: userData.isVerified ?? false,
            },
        });
    }

    async updateUser(id: string, data: Partial<User>) {
        return await this.prisma.user.update({
            where: { id },
            data: { ...data },
        });
    }

    async updatePassword(id: string, hashedPassword: string) {
        return await this.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
    }

    async getAllUsers(query: UserQueryDto) {
        const whereClause: Record<string, any> = {};

        if (query.status && query.status !== 'ALL') {
            whereClause.status = query.status;
        } else if (!query.status) {
            // DEFAULT: EXCLUDE DELETED USERS
            whereClause.status = { not: UserStatus.DELETED };
        }

        const { status: _status, ...restQuery } = query;
        const builder = new QueryBuilder(this.prisma.user, {
            ...restQuery,
            ...whereClause,
        });

        const result = await builder
            .search(['name', 'email'])
            .filter()
            .sort()
            .paginate()
            .fields()
            .exclude()
            .customFields({
                id: true,
                email: true,
                name: true,
                status: true,
                image: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
            })
            .execute();
        return result;
    }

    async updateUserStatus(
        id: string,
        status: UserStatus,
        currentAdminId: string,
    ) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (id === currentAdminId) {
            throw new BadRequestException(
                'Cannot modify your own account status',
            );
        }

        return await this.prisma.user.update({
            where: { id },
            data: { status },
            select: {
                id: true,
                email: true,
                name: true,
                status: true,
                updatedAt: true,
            },
        });
    }

    async deleteUser(id: string, currentAdminId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (id === currentAdminId) {
            throw new BadRequestException(
                'Cannot delete your own account with this endpoint',
            );
        }

        // SOFT DELETE
        await this.prisma.user.update({
            where: { id },
            data: { status: UserStatus.DELETED },
        });

        return { message: 'User account deleted successfully' };
    }

    async deleteMyAccount(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // SOFT DELETE
        await this.prisma.user.update({
            where: { id: userId },
            data: { status: UserStatus.DELETED },
        });

        return;
    }

    async findUserByEmail(email: string) {
        return await this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findUserByEmailWithAuth(email: string) {
        return await this.prisma.user.findUnique({
            where: { email },
            omit: {
                password: false,
                otp: false,
                otpExpiry: false,
                otpType: false,
            },
        });
    }

    async findUserById(id: string) {
        return await this.prisma.user.findUnique({
            where: { id, status: UserStatus.ACTIVE },
        });
    }

    async findUserByIdWithAuth(id: string) {
        return await this.prisma.user.findUnique({
            where: { id, status: UserStatus.ACTIVE },
            omit: {
                password: false,
                otp: false,
                otpExpiry: false,
                otpType: false,
            },
        });
    }

    async userExistsByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email, status: UserStatus.ACTIVE },
        });
        return !!user;
    }

    async getUserByEmailOrThrow(email: string) {
        const user = await this.findUserByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (user.status === UserStatus.INACTIVE) {
            throw new UnauthorizedException('This user is inactive');
        }
        if (user.status === UserStatus.BLOCKED) {
            throw new UnauthorizedException('This user is blocked');
        }
        return user;
    }

    async getUserByIdOrThrow(id: string) {
        const user = await this.findUserById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (user.status === UserStatus.INACTIVE) {
            throw new UnauthorizedException('This user is inactive');
        }
        if (user.status === UserStatus.BLOCKED) {
            throw new UnauthorizedException('This user is blocked');
        }
        return user;
    }
}
