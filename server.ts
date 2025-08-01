// server.ts
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { join } from 'node:path';
import { LOCALE_ID, enableProdMode } from '@angular/core';
import '@angular/localize/init';

async function loadEnvironment(): Promise<boolean> {
  let production = false;
  try {
    const envModule = await import('./src/environments/environment');
    production = envModule.environment.production;
    if (production) {
      enableProdMode();
    }
  } catch (e) {
    console.warn('⚠️ Ambiente di sviluppo: environment non caricato');
  }
  return production;
}

export async function app(): Promise<express.Express> {
  const production = await loadEnvironment();

  const server = express();

  // Import del modulo server Angular
  const AppServerModule = (await import('./src/main.server')).AppServerModule;

  const currentDir = process.cwd();

  // ATTENZIONE: path coerente con angular.json
  const browserDistFolder = join(currentDir, 'dist/browser');

  const backendApiUrl = process.env['API_BACKEND_URL'] || 'http://localhost:3000';

  // Lingue supportate
  const supportedLocales = ['it', 'en'];
  const defaultLocale = 'it';

  const commonEngine = new CommonEngine();

  // Serve i file statici per ogni lingua in /it e /en
  supportedLocales.forEach((locale) => {
    const localePath = join(browserDistFolder, locale);
    server.use(`/${locale}`, express.static(localePath, { maxAge: '1y' }));
  });

  // Serve favicon dalla root del dist/browser
  server.get('/favicon.ico', (req, res) => {
    res.sendFile(join(browserDistFolder, 'favicon.ico'));
  });

  // Redirect dalla root a /it/ (lingua di default)
  server.get('/', (req, res) => {
    res.redirect(301, `/${defaultLocale}/`);
  });

  // SSR universale per tutte le altre rotte
  server.get('*', async (req, res) => {
    try {
      // Estrai lingua dalla URL; se non supportata, usa defaultLocale
      const urlLocale = supportedLocales.find(locale => req.url.startsWith(`/${locale}`));
      const locale = urlLocale || defaultLocale;

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

      res.status(200).send(html);
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
