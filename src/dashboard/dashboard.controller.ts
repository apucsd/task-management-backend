import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from 'src/common/guards/auth/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get('overview')
    @ApiOperation({
        summary: 'Get dashboard overview metrics',
        description:
            'Returns counts for total/owned/member projects, total/completed/in-progress/todo/high-priority tasks, and upcoming due tasks.',
    })
    @ResponseMessage('Dashboard overview fetched successfully')
    async getOverview(@CurrentUser('id') userId: string) {
        return this.dashboardService.getOverview(userId);
    }
}
