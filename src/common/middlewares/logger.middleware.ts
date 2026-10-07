import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const colors = {
    green: '\x1B[32m',
    yellow: '\x1B[33m',
    red: '\x1B[31m',
    cyan: '\x1B[36m',
    white: '\x1B[37m',
    bold: '\x1B[1m',
    reset: '\x1B[0m',
};

function colorStatus(status: number): string {
    const s = status.toString();
    if (status >= 500) return `${colors.red}${s}${colors.reset}`;
    if (status >= 400) return `${colors.yellow}${s}${colors.reset}`;
    if (status >= 300) return `${colors.cyan}${s}${colors.reset}`;
    return `${colors.green}${s}${colors.reset}`;
}

function colorMethod(method: string): string {
    return `${colors.bold}${colors.cyan}${method}${colors.reset}`;
}

function colorDuration(ms: number): string {
    const color =
        ms > 1000 ? colors.red : ms > 300 ? colors.yellow : colors.green;
    return `${color}+${ms}ms${colors.reset}`;
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private logger = new Logger('Router');

    use(req: Request, res: Response, next: NextFunction): void {
        const { method, originalUrl } = req;
        const start = Date.now();

        res.on('finish', () => {
            const { statusCode } = res;
            const duration = Date.now() - start;

            const msg = `${colorMethod(method)} ${colors.white}${originalUrl}${colors.reset} ${colorStatus(statusCode)} ${colorDuration(duration)}`;

            if (statusCode >= 500) {
                this.logger.error(msg);
            } else if (statusCode >= 400) {
                this.logger.warn(msg);
            } else {
                this.logger.log(msg);
            }
        });

        next();
    }
}
