import { HttpException } from '@nestjs/common';

interface ErrorItem {
    field?: string;
    message: string;
}

export class AppError extends HttpException {
    constructor(statusCode: number, message: string, errors: ErrorItem[] = []) {
        super(
            {
                success: false,
                statusCode,
                message,
                errors,
            },
            statusCode,
        );
    }
}
