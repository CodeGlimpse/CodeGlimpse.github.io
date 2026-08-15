const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(process.env.SITE_ROOT || path.join(__dirname, '..', 'public'));
const port = Number(process.env.PORT || 4173);
const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
};

function getFilePath(requestUrl) {
    const pathname = decodeURIComponent(new URL(requestUrl, 'http://127.0.0.1').pathname);
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const candidate = path.resolve(root, relativePath);
    if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) return null;
    return candidate;
}

const server = http.createServer(async (request, response) => {
    try {
        const requestedPath = getFilePath(request.url || '/');
        if (!requestedPath) {
            response.writeHead(403);
            response.end('Forbidden');
            return;
        }

        const stats = await fs.promises.stat(requestedPath).catch(() => null);
        const filePath = stats?.isDirectory() ? path.join(requestedPath, 'index.html') : requestedPath;
        const fileStats = await fs.promises.stat(filePath).catch(() => null);
        if (!fileStats?.isFile()) {
            response.writeHead(404);
            response.end('Not Found');
            return;
        }

        response.writeHead(200, {
            'Cache-Control': 'no-store',
            'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        });
        fs.createReadStream(filePath).pipe(response);
    } catch (error) {
        response.writeHead(500);
        response.end(error.message);
    }
});

server.listen(port, '127.0.0.1', () => {
    console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});

function shutdown() {
    server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
