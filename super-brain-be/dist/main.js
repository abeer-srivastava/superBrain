"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const node_dns_1 = require("node:dns");
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const dns_cache_1 = require("./common/bootstrap/dns-cache");
const app_module_1 = require("./app.module");
async function createApp() {
    const config = (0, env_1.env)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: config.NODE_ENV === 'production' ? ['log', 'warn', 'error'] : undefined,
    });
    const trust = config.TRUST_PROXY;
    app.set('trust proxy', trust === 'false' ? false : /^\d+$/.test(trust) ? Number(trust) : trust);
    app.disable('x-powered-by');
    app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'same-site' } }));
    app.use((0, cookie_parser_1.default)());
    app.useBodyParser('json', { limit: '1mb' });
    app.setGlobalPrefix('api/v1');
    const origins = (0, env_1.allowedOrigins)();
    app.enableCors({
        origin: origins.length > 0 ? origins : true,
        credentials: true,
        methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    app.enableShutdownHooks();
    return app;
}
async function bootstrap() {
    (0, node_dns_1.setDefaultResultOrder)('ipv4first');
    (0, dns_cache_1.installQdrantDnsCache)(process.env.QDRANT_URL);
    const app = await createApp();
    const port = (0, env_1.env)().PORT;
    await app.listen(port, '0.0.0.0');
    const logger = new common_1.Logger('SuperBrain');
    logger.log(`API listening on http://localhost:${port}/api/v1 (health: /api/v1/health/ready)`);
}
if (require.main === module) {
    bootstrap().catch((err) => {
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    });
}
//# sourceMappingURL=main.js.map