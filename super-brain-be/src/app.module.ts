import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { env } from './config/env';
import { AllExceptionsFilter } from './common/http/all-exceptions.filter';
import { OriginCheckMiddleware } from './common/http/origin.middleware';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ContentModule } from './content/content.module';
import { AiModule } from './ai/ai.module';
import { VectorModule } from './vector/vector.module';
import { QueueModule } from './queue/queue.module';
import { ShareModule } from './share/share.module';
import { StorageModule } from './storage/storage.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { SearchModule } from './search/search.module';
import { AccountModule } from './account/account.module';
import { HealthModule } from './health/health.module';
import { MaintenanceModule } from './maintenance/maintenance.module';

/** Accepts REDIS_URL (redis:// or rediss://) or discrete host/port/password. */
export function redisConnection() {
  const e = env();
  if (e.REDIS_URL) {
    const u = new URL(e.REDIS_URL.includes('://') ? e.REDIS_URL : `redis://${e.REDIS_URL}`);
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 6379,
      username: u.username ? decodeURIComponent(u.username) : undefined,
      password: u.password ? decodeURIComponent(u.password) : undefined,
      db: u.pathname.length > 1 ? Number(u.pathname.slice(1)) || 0 : 0,
      tls: u.protocol === 'rediss:' || u.hostname.endsWith('upstash.io') ? {} : undefined,
    };
  }
  return {
    host: e.REDIS_HOST.replace(/^\w+:\/\//, ''),
    port: e.REDIS_PORT,
    password: e.REDIS_PASSWORD || undefined,
    tls: e.REDIS_HOST.includes('upstash.io') ? {} : undefined,
  };
}

@Module({
  imports: [
    MongooseModule.forRootAsync({ useFactory: () => ({ uri: env().MONGO_URL }) }),
    BullModule.forRootAsync({ useFactory: () => ({ connection: redisConnection(), prefix: env().QUEUE_PREFIX }) }),
    ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60_000, limit: 300 }] }),
    StorageModule,
    AiModule,
    VectorModule,
    QueueModule,
    UserModule,
    AuthModule,
    ContentModule,
    IngestionModule,
    SearchModule,
    ShareModule,
    AccountModule,
    HealthModule,
    MaintenanceModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(OriginCheckMiddleware).forRoutes('{*path}');
  }
}
