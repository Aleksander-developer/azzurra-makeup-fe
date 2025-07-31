import 'zone.js/node';

import { renderModule } from '@angular/platform-server';
import { AppServerModule } from './src/main.server';
import { APP_BASE_HREF } from '@angular/common';
import express from 'express';
import { join } from 'path';
import { readFileSync } from 'fs';

const app = express();
const distFolder = join(process.cwd(), 'dist/browser');
const indexHtml = 'index.html';

// Serve static files
app.get('*.*', express.static(distFolder, {
  maxAge: '1y'
}));

// SSR route
app.get('*', async (req, res) => {
  try {
    const html = await renderModule(AppServerModule, {
      url: req.originalUrl,
      document: readFileSync(join(distFolder, indexHtml)).toString(),
      extraProviders: [
        { provide: APP_BASE_HREF, useValue: req.baseUrl }
      ]
    });

    res.status(200).send(html);
  } catch (err) {
    console.error('SSR error:', err);
    res.status(500).send('Server Error');
  }
});

// Start server
const PORT = process.env ['PORT'] || 8080;
app.listen(PORT, () => {
  console.log(`Node server listening on http://localhost:${PORT}`);
});
