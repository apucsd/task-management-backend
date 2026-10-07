import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE_KEY = 'response_message';

/**
 * Custom Decorator to set a response message for an API endpoint.
 * Interceptors can read this metadata to format the final JSON response.
 *
 * Usage: @ResponseMessage('Watch history fetched successfully')
 */
export const ResponseMessage = (message: string) =>
    SetMetadata(RESPONSE_MESSAGE_KEY, message);
