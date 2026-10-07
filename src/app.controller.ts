import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    @ApiOperation({
        tags: ['Health'],
        summary: 'Health Check',
        description: 'Get a hello message from the API',
    })
    getHello(): string {
        return this.appService.getHello();
    }
}
