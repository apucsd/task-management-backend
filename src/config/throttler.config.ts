import { ThrottlerAsyncOptions } from '@nestjs/throttler';

export const throttlerAsyncConfig: ThrottlerAsyncOptions = {
    useFactory: () => ({
        throttlers: [
            {
                ttl: 60000,
                limit: 100,
            },
        ],
    }),
};
