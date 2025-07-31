// server.ts (nella ROOT del progetto)
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { join } from 'node:path';
import { LOCALE_ID } from '@angular/core';

export async function app(): Promise<express.Express> {
  const server = express();

  const mainServerBundle = await import('./src/main.server');
  const AppServerModule = mainServerBundle.AppServerModule; 

  const currentDir = process.cwd();
  const browserDistFolder = join(currentDir, 'browser');
  const serverDistFolder = join(currentDir, 'server');   
  const backendApiUrl = process.env['API_BACKEND_URL'] || 'http://localhost:3000';

  if (process.env['NODE_ENV'] !== 'production') {
    console.log('📁 currentDir:', currentDir);
    console.log('📁 serverDistFolder:', serverDistFolder);
    console.log('📁 browserDistFolder:', browserDistFolder);
    console.log('🔗 API_BACKEND_URL:', backendApiUrl);
  }

  const supportedLocales = ['it', 'en'];
  const defaultLocale = 'it';

  const commonEngine = new CommonEngine();
  server.set('view engine', 'html');

  server.use(express.static(browserDistFolder, { maxAge: '1y' }));

  // 🚀 Serve asset per ciascuna lingua
  supportedLocales.forEach((locale) => {
    const localePath = join(browserDistFolder, locale);
    server.use(`/${locale}`, express.static(localePath, { maxAge: '1y' }));
  });

  // 🎯 Servizio diretto del favicon
  server.get('/favicon.ico', (req, res) => {
    res.sendFile(join(browserDistFolder, 'favicon.ico'));
  });

  // 🔁 Redirect dalla root alla lingua predefinita
  server.get('/', (req, res) => {
    res.redirect(`/${defaultLocale}`);
  });

  // ⚠️ Catch-all e rendering SSR
  server.get('*', async (req, res, next) => {
    try {
      // Determina la lingua basandosi sull'URL o usa la predefinita
      const locale = req.url.startsWith(`/${supportedLocales[1]}`) ? supportedLocales[1] : defaultLocale;
      const localePath = join(browserDistFolder, locale);
      const indexHtml = join(localePath, 'index.html');

      const html = await commonEngine.render({
        bootstrap: AppServerModule,
        documentFilePath: indexHtml,
        url: req.originalUrl,
        publicPath: localePath,
        providers: [
          { provide: APP_BASE_HREF, useValue: `/${locale}/` },
          { provide: LOCALE_ID, useValue: locale },
          { provide: 'BACKEND_API_URL', useValue: backendApiUrl }
        ],
      });
      res.send(html);
    } catch (err) {
      console.error(`❌ SSR error for ${req.originalUrl}:`, err);
      // In caso di errore, si può provare un fallback o restituire un 404
      res.status(404).send('Pagina non trovata');
    }
  });
  
  return server;
}

async function run(): Promise<void> {
  const port = process.env['PORT'] || 8080;
  const server = await app();
  server.listen(port, () => {
    console.log(`✅ Angular SSR multilingua avviato su http://localhost:${port}`);
  });
}

run();