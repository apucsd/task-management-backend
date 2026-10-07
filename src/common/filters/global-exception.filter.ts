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

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();

        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

        let message = 'Something went wrong';

        let errors: any[] = [];

        // NESTJS / APP ERROR
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
        // PRISMA ERRORS
        else if (exception.code === 'P2002') {
            statusCode = HttpStatus.CONFLICT;
            const target = exception.meta?.target || 'field';
            message = `Duplicate value: ${target} already exists.`;
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        // LOG THE ERROR
        const formattedMessage = Array.isArray(message)
            ? message.join(', ')
            : message;
        this.logger.error(
            `[${request.method}] ${request.url} -> ${statusCode} | ${formattedMessage}`,
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
