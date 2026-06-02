import { createReadStream, existsSync } from 'fs';
import { createServer } from 'http';
import { dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';
import handler from 'serve-handler';
import { deleteLevelFromRepo, saveLevelToRepo } from './level-save.mjs';
import { saveCampaignToRepo } from './campaign-save.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PORT = Number(process.env.PORT) || 8080;

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8') || '{}';
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendRedirect(res, location) {
  res.writeHead(301, { Location: location });
  res.end();
}

const VENDOR_MIME = {
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
};

/** Local Phaser/Three (avoids CDN blocks in Chrome ad blockers). */
function tryServeVendor(pathname, res) {
  let diskPath = null;
  if (pathname === '/vendor/phaser.min.js') {
    diskPath = join(ROOT, 'node_modules/phaser/dist/phaser.min.js');
  } else if (pathname === '/vendor/three/build/three.module.js') {
    diskPath = join(ROOT, 'node_modules/three/build/three.module.js');
  } else if (pathname.startsWith('/vendor/three/examples/jsm/')) {
    const rel = pathname.slice('/vendor/three/examples/jsm/'.length);
    if (!rel || rel.includes('..')) return false;
    diskPath = join(ROOT, 'node_modules/three/examples/jsm', rel);
  }
  if (!diskPath || !existsSync(diskPath)) return false;

  const ext = extname(diskPath);
  res.writeHead(200, {
    'Content-Type': VENDOR_MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(diskPath).pipe(res);
  return true;
}

createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, { ok: true, saveLevels: true, saveCampaign: true });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/levels/save') {
    try {
      const body = await readJsonBody(req);
      const result = await saveLevelToRepo({
        rootDir: ROOT,
        id: body.id,
        originalId: body.originalId ?? null,
        name: body.name,
        description: body.description ?? '',
        level: body.level,
      });
      console.log(`[dev-server] saved level ${result.id} → ${result.filePath}`);
      sendJson(res, 200, { ok: true, ...result });
    } catch (err) {
      console.error('[dev-server] save failed', err);
      sendJson(res, 400, { ok: false, error: err.message || String(err) });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/campaign/save') {
    try {
      const body = await readJsonBody(req);
      const result = await saveCampaignToRepo({ rootDir: ROOT, campaign: body.campaign });
      console.log(`[dev-server] saved campaign → ${result.filePath}`);
      sendJson(res, 200, { ok: true, ...result });
    } catch (err) {
      console.error('[dev-server] campaign save failed', err);
      sendJson(res, 400, { ok: false, error: err.message || String(err) });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/levels/delete') {
    try {
      const body = await readJsonBody(req);
      const result = await deleteLevelFromRepo({ rootDir: ROOT, id: body.id });
      console.log(`[dev-server] deleted level ${result.id} (${result.script})`);
      sendJson(res, 200, { ok: true, ...result });
    } catch (err) {
      console.error('[dev-server] delete failed', err);
      sendJson(res, 400, { ok: false, error: err.message || String(err) });
    }
    return;
  }

  if (url.pathname.endsWith('.html')) {
    sendRedirect(res, url.pathname.slice(0, -5) + url.search);
    return;
  }

  if (req.method === 'GET' && tryServeVendor(url.pathname, res)) {
    return;
  }

  await handler(req, res, {
    public: ROOT,
    cleanUrls: true,
    directoryListing: false,
  });
}).listen(PORT, () => {
  console.log(`Block Ball dev server: http://localhost:${PORT}`);
  console.log('  Level APIs: POST /api/levels/save | POST /api/levels/delete');
  console.log('  Campaign API: POST /api/campaign/save');
});
