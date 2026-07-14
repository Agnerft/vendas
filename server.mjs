import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBestPanelTrial, sendJson } from './server/bestPanelProxy.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const distDir = join(root, 'dist');
const port = Number(process.env.PORT ?? 4173);

const mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mov': 'video/quicktime',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

async function serveStatic(request, response) {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
  const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = normalize(join(distDir, requestedPath));
  const safePath = filePath.startsWith(distDir) && existsSync(filePath) ? filePath : join(distDir, 'index.html');
  const fileStat = await stat(safePath);

  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(safePath)] ?? 'application/octet-stream',
    'Content-Length': fileStat.size,
  });
  createReadStream(safePath).pipe(response);
}

createServer(async (request, response) => {
  try {
    if (request.url === '/api/create-trial' && request.method === 'OPTIONS') {
      sendJson(response, 204, {});
      return;
    }

    if (request.url === '/api/create-trial' && request.method === 'POST') {
      const result = await createBestPanelTrial(request);
      sendJson(response, result.status, result.body);
      return;
    }

    await serveStatic(request, response);
  } catch (error) {
    sendJson(response, 500, {
      message: error instanceof Error ? error.message : 'Erro inesperado no servidor.',
    });
  }
}).listen(port, () => {
  console.info(`Servidor iniciado em http://127.0.0.1:${port}`);
});
