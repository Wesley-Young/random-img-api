import { serve } from '@hono/node-server';
import { createApp } from './app';
import { loadConfig } from './config';
import { logError, logInfo } from './logger';

const config = loadConfig(process.argv.slice(2));
const app = createApp(config);

const server = serve({
    fetch: app.fetch,
    hostname: config.host,
    port: config.port,
});

logInfo(`Listening on http://${config.host}:${config.port}`);

// Graceful shutdown
process.on('SIGINT', () => {
    logInfo('Received SIGINT, shutting down');
    server.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logInfo('Received SIGTERM, shutting down');
    server.close((err) => {
        if (err) {
            logError('Failed to close server cleanly', err);
            process.exit(1);
        }
        process.exit(0);
    });
});
