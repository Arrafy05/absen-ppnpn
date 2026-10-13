import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 2. Apps Script Connection Test Proxy
  app.post('/api/sync-script/test', async (req, res) => {
    const { scriptUrl } = req.body;
    if (!scriptUrl) {
      return res.status(400).json({ success: false, message: 'scriptUrl is required' });
    }

    try {
      const response = await fetch(scriptUrl, {
        method: 'GET',
        redirect: 'follow',
      });
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return res.json({ success: true, ...json });
      } catch {
        return res.json({ success: response.ok, message: text.slice(0, 300) });
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error communicating with Google Apps Script',
      });
    }
  });

  // 3. Apps Script Sync Proxy (Follows 302 redirects server-side cleanly)
  app.post('/api/sync-script/sync', async (req, res) => {
    const { scriptUrl, payload } = req.body;
    if (!scriptUrl) {
      return res.status(400).json({ success: false, message: 'scriptUrl is required' });
    }

    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });

      const responseText = await response.text();
      try {
        const json = JSON.parse(responseText);
        return res.json({ success: true, ...json });
      } catch {
        return res.json({
          success: response.ok,
          message: 'Data berhasil dikirim ke Google Apps Script',
          rawResponse: responseText.slice(0, 400),
        });
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to proxy request to Google Apps Script',
      });
    }
  });

  // 4. Pull Fingerprint Logs from Apps Script / Software
  app.post('/api/fingerprint/pull-logs', async (req, res) => {
    const { scriptUrl, date } = req.body;
    if (!scriptUrl) {
      return res.status(400).json({ success: false, message: 'scriptUrl is required' });
    }

    try {
      const url = new URL(scriptUrl);
      url.searchParams.set('action', 'get_logs');
      if (date) url.searchParams.set('date', date);

      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
      });

      const responseText = await response.text();
      try {
        const json = JSON.parse(responseText);
        return res.json({ success: true, logs: Array.isArray(json) ? json : json.logs || [] });
      } catch {
        return res.json({ success: false, message: 'Format respons bukan JSON', raw: responseText.slice(0, 300) });
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Gagal menarik log fingerprint dari Apps Script',
      });
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
