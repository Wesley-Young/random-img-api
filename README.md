# random-img-api

A small HTTP API that serves a random local image from a category directory. Built with Node.js, TypeScript, and Hono.

## Features

- Serves a random image from `images/<category>`
- Validates category names to reduce path traversal risk
- Verifies files are actual supported images before returning them
- Supports CLI flags and environment variables for runtime config
- Emits simple console logs for startup, requests, and shutdown

## Requirements

- Node.js 22+
- pnpm 10+ recommended

## Installation

```bash
pnpm install
```

## Directory Layout

Images are loaded from the configured image root directory. By default that is `./images`.

Example:

```text
images/
  cats/
    cat-1.jpg
    cat-2.png
  dogs/
    dog-1.webp
```

## Development

Start the server directly from TypeScript:

```bash
pnpm dev
```

With custom options:

```bash
pnpm dev -- --host 0.0.0.0 --port 8080 --images-dir ./images
```

## Build

```bash
pnpm build
```

After building, run the compiled binary:

```bash
node dist/index.mjs
```

## API

### `GET /random-image/:category`

Returns one random image from the matching category directory.

Example:

```bash
curl -o random.jpg http://127.0.0.1:3000/random-image/cats
```

Possible responses:

- `200` with image content
- `400 Invalid category`
- `404 Category not found`
- `404 No images available`
- `404 No valid images available`
- `500 Internal server error`

## CLI Options

```
--host <host>         Host to bind to
--port <port>         Port to listen on
--images-dir <path>   Root directory containing image categories
--help, -h            Show help
```

Defaults:

- `host`: `127.0.0.1`
- `port`: `3000`
- `images-dir`: `<project>/images`

## Environment Variables

CLI flags can also be provided through environment variables:

- `HOST`
- `PORT`
- `IMAGES_DIR`

CLI flags take precedence over environment variables.

## Security Notes

- Category names only allow letters, numbers, `_`, and `-`
- Category paths are resolved and checked to stay inside the configured image root
- Only regular files are considered
- Returned responses include `X-Content-Type-Options: nosniff`
- Images are inspected before being served instead of trusting file extensions alone

## License

MIT
