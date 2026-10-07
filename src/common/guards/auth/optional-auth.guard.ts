import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/common/types/express';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<Request>();

        const token = this.extractToken(req);
        if (!token) {
            return true;
        }

        try {
            const secret = this.configService.get<string>('JWT_SECRET');
            const payload = await this.jwtService.verifyAsync<JwtPayload>(
                token,
                {
                    secret,
                },
            );
            req.user = payload;
        } catch {
            delete req.user;
        }

        return true;
    }

    private extractToken(req: Request): string | undefined {
        const [type, token] = req.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
