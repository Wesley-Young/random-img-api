import { Hono } from 'hono';
import { logInfo } from './logger';
import { getRandomImageResponse } from './image-service';
import type { RuntimeConfig } from './types';

export function createApp(config: RuntimeConfig): Hono {
    const app = new Hono();

    app.use('*', async (c, next) => {
        const startedAt = Date.now();
        await next();
        const durationMs = Date.now() - startedAt;
        logInfo(`${c.req.method} ${c.req.path} -> ${c.res.status} (${durationMs}ms)`);
    });

    app.get('/random-image/:category', async (c) => {
        const { category } = c.req.param();
        const result = await getRandomImageResponse(config.imageRoot, category);

        switch (result.kind) {
            case 'invalid-category':
                return c.text('Invalid category', 400);
            case 'category-not-found':
                return c.text('Category not found', 404);
            case 'no-images':
                return c.text('No images available', 404);
            case 'no-valid-images':
                return c.text('No valid images available', 404);
            case 'internal-error':
                return c.text('Internal server error', 500);
            case 'success':
                return result.response;
        }
    });

    return app;
}
