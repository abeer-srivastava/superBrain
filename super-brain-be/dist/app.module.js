"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
exports.redisConnection = redisConnection;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const env_1 = require("./config/env");
const all_exceptions_filter_1 = require("./common/http/all-exceptions.filter");
const origin_middleware_1 = require("./common/http/origin.middleware");
const auth_module_1 = require("./auth/auth.module");
const user_module_1 = require("./user/user.module");
const content_module_1 = require("./content/content.module");
const ai_module_1 = require("./ai/ai.module");
const vector_module_1 = require("./vector/vector.module");
const queue_module_1 = require("./queue/queue.module");
const share_module_1 = require("./share/share.module");
const storage_module_1 = require("./storage/storage.module");
const ingestion_module_1 = require("./ingestion/ingestion.module");
const search_module_1 = require("./search/search.module");
const account_module_1 = require("./account/account.module");
const health_module_1 = require("./health/health.module");
const maintenance_module_1 = require("./maintenance/maintenance.module");
function redisConnection() {
    const e = (0, env_1.env)();
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
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(origin_middleware_1.OriginCheckMiddleware).forRoutes('{*path}');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forRootAsync({ useFactory: () => ({ uri: (0, env_1.env)().MONGO_URL }) }),
            bullmq_1.BullModule.forRootAsync({ useFactory: () => ({ connection: redisConnection(), prefix: (0, env_1.env)().QUEUE_PREFIX }) }),
            throttler_1.ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60_000, limit: 300 }] }),
            storage_module_1.StorageModule,
            ai_module_1.AiModule,
            vector_module_1.VectorModule,
            queue_module_1.QueueModule,
            user_module_1.UserModule,
            auth_module_1.AuthModule,
            content_module_1.ContentModule,
            ingestion_module_1.IngestionModule,
            search_module_1.SearchModule,
            share_module_1.ShareModule,
            account_module_1.AccountModule,
            health_module_1.HealthModule,
            maintenance_module_1.MaintenanceModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_FILTER, useClass: all_exceptions_filter_1.AllExceptionsFilter },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map