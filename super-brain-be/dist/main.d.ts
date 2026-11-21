import type { NestExpressApplication } from '@nestjs/platform-express';
export declare function createApp(): Promise<NestExpressApplication<import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>>>;
