import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Prisma } from 'generated/prisma/client';

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();

        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errors: any[] = [];

        // NESTJS HTTP EXCEPTION
        if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            const exceptionResponse: any = exception.getResponse();

            message = exceptionResponse.message || exception.message || message;
            errors = exceptionResponse.errors || [];

            if (
                statusCode === HttpStatus.NOT_FOUND &&
                typeof message === 'string' &&
                /^Cannot (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)/.test(message)
            ) {
                message = `Route ${request.method} ${request.url} was not found`;
            }
        }
        // PRISMA KNOWN REQUEST ERRORS
        else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            switch (exception.code) {
                case 'P2002': {
                    statusCode = HttpStatus.CONFLICT;
                    const target = Array.isArray(exception.meta?.target)
                        ? exception.meta.target.join(', ')
                        : (exception.meta?.target as string) || 'Field';
                    message = `${target} already exists`;
                    break;
                }
                case 'P2025':
                    statusCode = HttpStatus.NOT_FOUND;
                    message = 'Record not found';
                    break;
                case 'P2003':
                    statusCode = HttpStatus.BAD_REQUEST;
                    message = 'Foreign key constraint violated';
                    break;
                case 'P2021':
                    statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
                    message =
                        'Database table not found. Please run database migrations.';
                    break;
                default:
                    statusCode = HttpStatus.BAD_REQUEST;
                    message = 'Database operation failed';
                    break;
            }
        }
        // PRISMA VALIDATION ERRORS
        else if (exception instanceof Prisma.PrismaClientValidationError) {
            statusCode = HttpStatus.BAD_REQUEST;
            message = 'Invalid database query input';
        }
        // PRISMA CONNECTION ERRORS
        else if (exception instanceof Prisma.PrismaClientInitializationError) {
            statusCode = HttpStatus.SERVICE_UNAVAILABLE;
            message = 'Database connection error';
        }
        // UNHANDLED SYSTEM ERRORS
        else if (exception instanceof Error) {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            message =
                process.env.NODE_ENV === 'production'
                    ? 'Internal server error'
                    : exception.message.split('\n')[0] ||
                      'Internal server error';
        }

        // LOG FULL ERROR TO SERVER CONSOLE
        const errorStack =
            exception instanceof Error && exception.stack
                ? exception.stack
                : undefined;
        const formattedMessage = Array.isArray(message)
            ? message.join(', ')
            : message;

        this.logger.error(
            `[${request.method}] ${request.url} -> ${statusCode} | ${formattedMessage}`,
            errorStack,
        );

        response.status(statusCode).json({
            success: false,
            message,
            errors,
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }
}
