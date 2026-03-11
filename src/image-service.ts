import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { randomInt } from 'node:crypto';
import { Readable } from 'node:stream';
import imageSize from 'image-size';
import { logError, logWarn } from './logger';

const CATEGORY_PATTERN = /^[A-Za-z0-9_-]+$/;

const MIME_BY_TYPE: Record<string, string> = {
    avif: 'image/avif',
    bmp: 'image/bmp',
    cur: 'image/x-win-bitmap',
    gif: 'image/gif',
    heic: 'image/heic',
    heif: 'image/heif',
    icns: 'image/icns',
    ico: 'image/x-icon',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    jxl: 'image/jxl',
    png: 'image/png',
    psd: 'image/vnd.adobe.photoshop',
    svg: 'image/svg+xml',
    tga: 'image/x-tga',
    tif: 'image/tiff',
    tiff: 'image/tiff',
    webp: 'image/webp',
};

function isPathInside(parentPath: string, childPath: string): boolean {
    const relativePath = path.relative(parentPath, childPath);
    return relativePath !== '' && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

type ImageResult =
    | { kind: 'invalid-category' }
    | { kind: 'category-not-found' }
    | { kind: 'no-images' }
    | { kind: 'no-valid-images' }
    | { kind: 'internal-error' }
    | { kind: 'success'; response: Response };

export async function getRandomImageResponse(imageRoot: string, category: string): Promise<ImageResult> {
    if (!CATEGORY_PATTERN.test(category)) {
        return { kind: 'invalid-category' };
    }

    const requestedPath = path.resolve(imageRoot, category);
    let categoryPath: string;

    try {
        categoryPath = await fsp.realpath(requestedPath);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return { kind: 'category-not-found' };
        }

        logError('Failed to resolve category path', error);
        return { kind: 'internal-error' };
    }

    if (!isPathInside(imageRoot, categoryPath)) {
        return { kind: 'invalid-category' };
    }

    let entries: fs.Dirent[];
    try {
        entries = await fsp.readdir(categoryPath, { withFileTypes: true });
    } catch (error) {
        logError('Failed to read category directory', error);
        return { kind: 'internal-error' };
    }

    const files = entries.filter((entry) => entry.isFile()).map((entry) => path.join(categoryPath, entry.name));

    if (files.length === 0) {
        return { kind: 'no-images' };
    }

    const startIndex = randomInt(files.length);

    for (let offset = 0; offset < files.length; offset += 1) {
        const filePath = files[(startIndex + offset) % files.length];

        try {
            const imageBuffer = await fsp.readFile(filePath);
            const imageInfo = imageSize(imageBuffer);
            const imageType = imageInfo.type;

            if (!imageType) {
                continue;
            }

            const mimeType = MIME_BY_TYPE[imageType];

            if (!mimeType) {
                continue;
            }

            const fileHandle = await fsp.open(filePath, 'r');
            const stats = await fileHandle.stat();

            if (!stats.isFile()) {
                await fileHandle.close();
                continue;
            }

            const stream = fileHandle.createReadStream();
            stream.once('close', () => {
                void fileHandle.close();
            });
            stream.once('error', () => {
                void fileHandle.close();
            });

            return {
                kind: 'success',
                response: new Response(Readable.toWeb(stream) as ReadableStream, {
                    status: 200,
                    headers: {
                        'Content-Length': stats.size.toString(),
                        'Content-Type': mimeType,
                        'Cache-Control': 'no-store',
                        'X-Content-Type-Options': 'nosniff',
                    },
                }),
            };
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                logWarn(`Skipping invalid image file: ${filePath}`, error);
            }
        }
    }

    return { kind: 'no-valid-images' };
}
