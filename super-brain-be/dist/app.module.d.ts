import { MiddlewareConsumer, NestModule } from '@nestjs/common';
export declare function redisConnection(): {
    host: string;
    port: number;
    username: string | undefined;
    password: string | undefined;
    db: number;
    tls: {} | undefined;
} | {
    host: string;
    port: number;
    password: string | undefined;
    tls: {} | undefined;
    username?: undefined;
    db?: undefined;
};
export declare class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void;
}
