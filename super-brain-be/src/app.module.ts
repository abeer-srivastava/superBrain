import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ContentModule } from './content/content.module';
import { AiModule } from './ai/ai.module';
import { VectorModule } from './vector/vector.module';
import { QueueModule } from './queue/queue.module';
import { ShareModule } from './share/share.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URL', 'mongodb://127.0.0.1:27017/superbrain'),
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          try {
            const parsed = new URL(redisUrl);
            return {
              connection: {
                host: parsed.hostname,
                port: parsed.port ? parseInt(parsed.port) : 6379,
                username: parsed.username || undefined,
                password: parsed.password || undefined,
                tls: parsed.protocol === 'rediss:' || redisUrl.includes('upstash.io') ? {} : undefined,
              },
            };
          } catch (e) {
            // Fallback if URL parsing fails
            return {
              connection: {
                host: redisUrl.replace(/^https?:\/\//, ''),
                port: 6379,
                tls: redisUrl.includes('upstash.io') ? {} : undefined,
              },
            };
          }
        }
        return {
          connection: {
            host: configService.get<string>('REDIS_HOST', '127.0.0.1').replace(/^https?:\/\//, ''),
            port: configService.get<number>('REDIS_PORT', 6379),
            password: configService.get<string>('REDIS_PASSWORD'),
            tls: configService.get<string>('REDIS_HOST', '').includes('upstash.io') ? {} : undefined,
          },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    ContentModule,
    AiModule,
    VectorModule,
    QueueModule,
    ShareModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
