"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const node_dns_1 = require("node:dns");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
try {
    const dns = require('node:dns');
    const urlStr = process.env.QDRANT_URL;
    if (urlStr && urlStr.startsWith('https://')) {
        const qdrantHost = new URL(urlStr).hostname;
        let cachedIp = '';
        dns.resolve4(qdrantHost, (err, addresses) => {
            if (!err && addresses.length > 0) {
                cachedIp = addresses[0];
                console.log(`[DNS Cache] ${qdrantHost} -> ${cachedIp}`);
            }
        });
        const originalLookup = dns.lookup;
        dns.lookup = (hostname, options, callback) => {
            if (typeof options === 'function') {
                callback = options;
                options = {};
            }
            if (hostname === qdrantHost && cachedIp) {
                const res = { address: cachedIp, family: 4 };
                return options.all ? callback(null, [res]) : callback(null, res.address, res.family);
            }
            return originalLookup(hostname, options, (err, address, family) => {
                if (err && hostname === qdrantHost && cachedIp) {
                    const res = { address: cachedIp, family: 4 };
                    return options.all ? callback(null, [res]) : callback(null, res.address, res.family);
                }
                if (!err && hostname === qdrantHost && !options.all) {
                    cachedIp = address;
                }
                callback(err, address, family);
            });
        };
        console.log(`[DNS Cache] Configured for ${qdrantHost}`);
    }
}
catch (e) {
    console.error('[DNS Cache] Failed to configure', e);
}
(0, node_dns_1.setDefaultResultOrder)('ipv4first');
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`[Startup] Created uploads directory: ${uploadsDir}`);
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api/v1');
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
        : null;
    app.enableCors({
        origin: (origin, callback) => {
            if (!allowedOrigins || allowedOrigins.length === 0 || !origin) {
                return callback(null, true);
            }
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`CORS: Origin ${origin} not allowed`), false);
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
        credentials: true,
    });
    const port = process.env.PORT ?? 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`[SuperBrain] Backend running at http://localhost:${port}/api/v1`);
    console.log(`[SuperBrain] Health check: http://localhost:${port}/api/v1/health`);
}
bootstrap();
//# sourceMappingURL=main.js.map