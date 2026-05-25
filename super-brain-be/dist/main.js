"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const node_dns_1 = require("node:dns");
try {
    try {
        require('dotenv').config();
    }
    catch (e) { }
    const dns = require('node:dns');
    const urlStr = process.env.QDRANT_URL;
    if (urlStr && urlStr.startsWith('https://')) {
        const qdrantHost = new URL(urlStr).hostname;
        let cachedIp = '';
        dns.resolve4(qdrantHost, (err, addresses) => {
            if (!err && addresses.length > 0) {
                cachedIp = addresses[0];
                console.log(`DNS Cache initialized for ${qdrantHost} -> ${cachedIp}`);
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
        console.log(`Dynamic DNS Monkey-patch configured for ${qdrantHost}`);
    }
}
catch (e) {
    console.error('Failed to configure dynamic DNS monkey-patch', e);
}
(0, node_dns_1.setDefaultResultOrder)('ipv4first');
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api/v1');
    app.enableCors({
        origin: (origin, callback) => {
            callback(null, true);
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`Backend is running on: http://localhost:${port}/api/v1`);
}
bootstrap();
//# sourceMappingURL=main.js.map