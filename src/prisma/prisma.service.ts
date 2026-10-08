import dns from 'node:dns';
import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from 'generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// PREFER IPV4 OVER IPV6 FOR POSTGRES POOLING
dns.setDefaultResultOrder('ipv4first');

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy
{
    private readonly logger = new Logger(PrismaService.name);

    constructor(configService: ConfigService) {
        const database_url = configService.get<string>('DATABASE_URL');

        if (!database_url) {
            throw new Error('DATABASE_URL is not defined');
        }

        const adapter = new PrismaPg({
            connectionString: database_url,
        });

        super({
            adapter,
            omit: {
                user: {
                    password: true,
                    otp: true,
                    otpExpiry: true,
                    otpType: true,
                },
            },
        });
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('Successfully connected to PostgreSQL via Prisma');
        } catch (error) {
            this.logger.error('Failed to connect', (error as Error).stack);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Prisma disconnected');
    }
}
