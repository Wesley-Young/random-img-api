import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { logError } from './logger';
import type { RuntimeConfig } from './types';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 3000;
const DEFAULT_IMAGE_ROOT = path.resolve(process.cwd(), 'images');

function printHelp(): void {
    console.log(`Usage: random-img-api [options]

Options:
  --host <host>         Host to bind to (default: ${DEFAULT_HOST})
  --port <port>         Port to listen on (default: ${DEFAULT_PORT})
  --images-dir <path>   Image root directory (default: ${DEFAULT_IMAGE_ROOT})
  --help                Show this help message
`);
}

function parsePort(portValue: string): number {
    if (!/^\d+$/.test(portValue)) {
        throw new Error(`Invalid port: ${portValue}`);
    }

    const port = Number(portValue);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`Port must be an integer between 1 and 65535: ${portValue}`);
    }

    return port;
}

export function resolveConfig(argv: string[]): RuntimeConfig {
    const { values } = parseArgs({
        args: argv,
        options: {
            host: {
                type: 'string',
            },
            port: {
                type: 'string',
            },
            'images-dir': {
                type: 'string',
            },
            help: {
                type: 'boolean',
                short: 'h',
            },
        },
        strict: true,
        allowPositionals: false,
    });

    if (values.help) {
        printHelp();
        process.exit(0);
    }

    const host = values.host ?? process.env.HOST ?? DEFAULT_HOST;
    const port = parsePort(values.port ?? process.env.PORT ?? String(DEFAULT_PORT));
    const requestedImageRoot = path.resolve(values['images-dir'] ?? process.env.IMAGES_DIR ?? DEFAULT_IMAGE_ROOT);
    const imageRoot = fs.existsSync(requestedImageRoot)
        ? fs.realpathSync.native(requestedImageRoot)
        : requestedImageRoot;

    if (host.trim() === '') {
        throw new Error('Host must not be empty');
    }

    return {
        host,
        port,
        imageRoot,
    };
}

export function loadConfig(argv: string[]): RuntimeConfig {
    try {
        return resolveConfig(argv);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to parse CLI arguments';
        logError(message);
        process.exit(1);
    }
}
