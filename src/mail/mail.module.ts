import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

import { MailService } from './mail.service';

@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                transport: {
                    host: config.get<string>('SMTP_HOST'),
                    port: config.get<number>('SMTP_PORT', 587),
                    auth: {
                        user: config.get<string>('SMTP_USER'),
                        pass: config.get<string>('SMTP_PASS'),
                    },
                },
                defaults: {
                    from: config.get<string>('SMTP_USER'),
                },
                template: {
                    dir: join(process.cwd(), 'src/mail/templates'),
                    adapter: new HandlebarsAdapter({
                        currentYear: () => new Date().getFullYear(),
                        primaryColor: () => '#4f46e5',
                        brandName: () =>
                            config.get<string>('APP_NAME', 'Task Management'),
                        siteUrl: () =>
                            config.get<string>(
                                'CLIENT_URL',
                                'http://localhost:3000',
                            ),
                        supportEmail: () => config.get<string>('SMTP_USER'),
                    }),
                    options: { strict: true },
                },
            }),
        }),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
