import dns from 'node:dns';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// RESOLVE IPV4 FIRST TO AVOID CLOUD DATABASE TIMEOUTS ON LINUX
dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
        rawBody: true,
    });

    // TRUST PROXY AND ENABLE SHUTDOWN HOOKS
    app.set('trust proxy', 1);
    app.enableShutdownHooks();

    const configService = app.get(ConfigService);
    const clientUrl = configService.get<string>(
        'CLIENT_URL',
        'http://localhost:3000',
    );

    // MIDDLEWARE SETUP
    app.enableCors({
        origin: [clientUrl, 'http://localhost:3000'],
        credentials: true,
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            forbidUnknownValues: true,
            exceptionFactory(errors) {
                const formattedErrors = errors.map((error) => ({
                    field: error.property,
                    message: error.constraints
                        ? Object.values(error.constraints)[0]
                        : 'Invalid value',
                }));

                const firstErrorMessage =
                    formattedErrors[0]?.message || 'Validation failed';

                return new BadRequestException({
                    message: firstErrorMessage,
                    errors: formattedErrors,
                });
            },
        }),
    );

    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(new TransformInterceptor(reflector));
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.use(cookieParser());

    const port = configService.get<number>('PORT', 4000);

    app.setGlobalPrefix('api/v1', {
        exclude: ['/'],
    });

    // SWAGGER API DOCUMENTATION
    const config = new DocumentBuilder()
        .setTitle('Task Management API')
        .setDescription('RESTful API services for Project and Task Management')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });

    await app.listen(port);
}
void bootstrap();
