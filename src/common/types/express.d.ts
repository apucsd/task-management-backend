declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export interface JwtPayload {
    id: string;
    email: string;
    iat?: number;
    exp?: number;
}
