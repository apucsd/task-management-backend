import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/common/guards/auth/auth.guard';
import { UpdateUserDto } from './dto/user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    @ApiOperation({
        summary: 'Get All Users with Status Filtering',
        description:
            'Search, filter, and paginate through platform users. Filter by `?status=ACTIVE`, `?status=BLOCKED`, `?status=DELETED`, or `?status=ALL` (default excludes deleted).',
    })
    @ResponseMessage('Users fetched successfully')
    async getUser(@Query() query: UserQueryDto) {
        return await this.userService.getAllUsers(query);
    }

    @Get('/profile')
    @ApiOperation({ summary: 'Get Logged-in User Profile' })
    @ResponseMessage('Profile fetched successfully')
    async getProfile(@CurrentUser('id') userId: string) {
        return await this.userService.getProfile(userId);
    }

    @Patch('/update-profile')
    @ApiOperation({ summary: 'Update Logged-in User Profile' })
    @ResponseMessage('User updated successfully')
    async updateUser(
        @CurrentUser('id') userId: string,
        @Body() body: UpdateUserDto,
    ) {
        return await this.userService.updateUser(userId, body);
    }

    @Delete('/me')
    @ApiOperation({
        summary: 'Delete My Account (Self-Service)',
        description:
            'Allows the authenticated user to soft-delete their own account.',
    })
    @ResponseMessage('Account deleted successfully')
    async deleteMyAccount(@CurrentUser('id') userId: string) {
        return await this.userService.deleteMyAccount(userId);
    }

    @Patch('/:id/status')
    @ApiOperation({
        summary: 'Update User Account Status / Block / Unblock',
        description:
            'Change user status to ACTIVE, BLOCKED, or DELETED. Blocked users are immediately prevented from logging in.',
    })
    @ResponseMessage('User status updated successfully')
    async updateUserStatus(
        @Param('id') id: string,
        @Body() body: UpdateUserStatusDto,
        @CurrentUser('id') currentUserId: string,
    ) {
        return await this.userService.updateUserStatus(
            id,
            body.status,
            currentUserId,
        );
    }

    @Delete('/:id')
    @ApiOperation({
        summary: 'Soft Delete User Account',
        description:
            'Soft-deletes a user account by setting status to DELETED.',
    })
    @ResponseMessage('User deleted successfully')
    async deleteUser(
        @Param('id') id: string,
        @CurrentUser('id') currentUserId: string,
    ) {
        return await this.userService.deleteUser(id, currentUserId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get Single User by ID' })
    @ResponseMessage('User fetched successfully')
    async getUserById(@Param('id') id: string) {
        return await this.userService.findUserById(id);
    }
}
