import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { refreshQuotes } from './services/quotes.js';
import { startPoller } from './services/poller.js';
import fsRoutes      from './routes/fs.js';
import marketRoutes  from './routes/market.js';
import financeRoutes from './routes/finance.js';

const app = express();
app.use(cors());
app.use(express.json());

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', fsRoutes);
app.use('/api', marketRoutes);
app.use('/api', financeRoutes);

// ── Production static serving ─────────────────────────────────────────────────
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const distPath  = path.join(__dirname, '..', 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) res.sendFile(path.join(distPath, 'index.html'));
    else next();
  });
  console.log('Serving production build from /dist');
}

// ── Background jobs ───────────────────────────────────────────────────────────
refreshQuotes();
setInterval(refreshQuotes, 60 * 1000);
startPoller();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('API routes: /api/market-data, /api/watchlist, /api/stock-news, /api/earnings, /api/fs/*, ...');
});
