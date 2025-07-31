// server.ts
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { join } from 'node:path';
import { LOCALE_ID, enableProdMode } from '@angular/core';
import '@angular/localize/init';

// ✅ Importa environment senza errori
let production = false;
try {
  const env = await import('./src/environments/environment');
  // @ts-expect-error: TypeScript non riconosce .production, ma è presente
  production = env.production ?? false;
  if (production) {
    enableProdMode();
  }
} catch (e) {
  console.warn('⚠️ Ambiente di sviluppo: environment non caricato');
}

export async function app(): Promise<express.Express> {
  const server = express();

  // ✅ Import dinamico modulare con compatibilità .mjs

  const AppServerModule = production
    ? (await import('./server/main.mjs')).AppServerModule
    : (await import('./src/main.server')).AppServerModule;

  const currentDir = process.cwd();
  const browserDistFolder = join(currentDir, 'dist/browser');
  const backendApiUrl = process.env['API_BACKEND_URL'] || 'http://localhost:3000';

  const supportedLocales = ['it', 'en'];
  const defaultLocale = 'it';

  const commonEngine = new CommonEngine();

  // Statici globali
  server.use(express.static(browserDistFolder, { maxAge: '1y' }));

  // Statici localizzati
  supportedLocales.forEach((locale) => {
    const localePath = join(browserDistFolder, locale);
    server.use(`/${locale}`, express.static(localePath, { maxAge: '1y' }));
  });

  server.get('/favicon.ico', (req, res) => {
    res.sendFile(join(browserDistFolder, 'favicon.ico'));
  });

  server.get('/', (req, res) => {
    res.redirect(`/${defaultLocale}`);
  });

  server.get('*', async (req, res) => {
    try {
      const locale = req.url.startsWith('/en') ? 'en' : defaultLocale;
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
          { provide: 'BACKEND_API_URL', useValue: backendApiUrl },
        ],
      });

      res.send(html);
    } catch (err) {
      console.error(`❌ SSR error for ${req.originalUrl}:`, err);
      res.status(500).send('Errore interno del server');
    }
  });

  return server;
}

async function run(): Promise<void> {
  const port = Number(process.env['PORT']) || 8080;
  const server = await app();
  server.listen(port, () => {
    console.log(`✅ SSR avviato su http://localhost:${port}`);
  });
}

run();
