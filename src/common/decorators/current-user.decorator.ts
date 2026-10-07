import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom Decorator to extract the authenticated user (or a specific field) from the Request context.
 *
 * Examples:
 * - `@CurrentUser() user: User` -> returns full user object
 * - `@CurrentUser('id') userId: string` -> returns user.id
 * - `@CurrentUser('email') email: string` -> returns user.email
 */
export const CurrentUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            return undefined;
        }

        return data ? user[data] : user;
    },
);
