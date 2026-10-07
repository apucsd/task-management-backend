import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map } from 'rxjs/operators';
import type { Observable } from 'rxjs';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

interface Response<T> {
    success: true;
    message: string;
    data: T | null;
    timestamp: string;
    meta?: Record<string, unknown>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
    T,
    Response<T>
> {
    constructor(private readonly reflector: Reflector) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler<T>,
    ): Observable<Response<T>> {
        const customMessage = this.reflector.get<string>(
            RESPONSE_MESSAGE_KEY,
            context.getHandler(),
        );

        return next.handle().pipe(
            map((responseData: any) => {
                const timestamp = new Date().toISOString();

                // 1. QUERY BUILDER RESPONSE
                const isQueryBuilderResponse =
                    responseData &&
                    typeof responseData === 'object' &&
                    'data' in responseData &&
                    'meta' in responseData;

                if (isQueryBuilderResponse) {
                    return {
                        success: true,
                        timestamp,
                        message: customMessage || 'Request successful',
                        meta: responseData.meta,
                        data: responseData.data,
                    };
                }

                // 2. CONTROLLER EXPLICIT RESPONSE
                const isLegacyControllerResponse =
                    responseData &&
                    typeof responseData === 'object' &&
                    ('statusCode' in responseData ||
                        'message' in responseData) &&
                    'data' in responseData;

                if (isLegacyControllerResponse) {
                    return {
                        success: true,
                        timestamp,
                        message:
                            customMessage ||
                            responseData.message ||
                            'Request successful',
                        meta: responseData.meta,
                        data: responseData.data,
                    };
                }

                // 3. RAW DATA CONTROLLER RESPONSE
                return {
                    success: true,
                    timestamp,
                    message: customMessage || 'Request successful',
                    data: responseData,
                };
            }),
        );
    }
}
