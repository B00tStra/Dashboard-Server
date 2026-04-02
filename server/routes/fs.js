// File system + cron + config-files routes
import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

function resolvePath(p) {
  if (!p || p === '') return '/home/fabio/dashboard';
  return path.normalize(String(p));
}

router.get('/fs/list', (req, res) => {
  const dirPath = resolvePath(req.query.path);
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const result = entries
      .filter(e => !e.name.startsWith('.') || req.query.hidden === 'true')
      .map(e => {
        const fullPath = path.join(dirPath, e.name);
        let size = null, modified = null;
        try { const s = fs.statSync(fullPath); size = e.isFile() ? s.size : null; modified = s.mtime.toISOString(); } catch {}
        return { name: e.name, type: e.isDirectory() ? 'folder' : 'file', path: fullPath, size, modified, ext: e.isFile() ? path.extname(e.name).toLowerCase() : null };
      })
      .sort((a, b) => a.type !== b.type ? (a.type === 'folder' ? -1 : 1) : a.name.localeCompare(b.name));
    res.json({ path: dirPath, entries: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/fs/read', (req, res) => {
  const filePath = resolvePath(req.query.path);
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 1024 * 1024) return res.status(400).json({ error: 'File too large (>1MB)' });
    res.json({ path: filePath, content: fs.readFileSync(filePath, 'utf-8') });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/fs/write', (req, res) => {
  const { path: filePath, content } = req.body;
  try {
    fs.writeFileSync(resolvePath(filePath), content, 'utf-8');
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/fs/drives', (_req, res) => {
  const candidates = ['/', '/home/fabio/dashboard/data', '/home/fabio/dashboard', '/home/fabio/dashboard/data/secrets'];
  const drives = candidates.filter(p => { try { fs.accessSync(p); return true; } catch { return false; } });
  res.json({ drives });
});

router.get('/fs/parent', (req, res) => {
  const p = resolvePath(req.query.path);
  const parent = path.dirname(p);
  res.json({ parent: parent === p ? null : parent });
});

// Cron — OpenClaw removed, returns empty list
router.get('/cron', (_req, res) => res.json([]));

// Config files
router.get('/config-files', (_req, res) => {
  const files = [
    { group: 'core', path: '/home/fabio/dashboard/data/SOUL.md' },
    { group: 'core', path: '/home/fabio/dashboard/data/MEMORY.md' },
    { group: 'core', path: '/home/fabio/dashboard/data/USER.md' },
    { group: 'core', path: '/home/fabio/dashboard/data/AGENTS.md' },
    { group: 'core', path: '/home/fabio/dashboard/data/HEARTBEAT.md' },
    { group: 'ops',  path: '/home/fabio/dashboard/data/cron.md' },
    { group: 'ops',  path: '/home/fabio/dashboard/data/stock_config.json' },
  ];

  const groups = {};
  for (const item of files) {
    if (!fs.existsSync(item.path)) continue;
    const name = path.basename(item.path);
    const content = fs.readFileSync(item.path, 'utf-8');
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push({ name, type: 'file', path: item.path, content });
  }

  res.json(Object.entries(groups).map(([name, children]) => ({ name, type: 'folder', children })));
});

export default router;
