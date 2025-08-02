// server.ts (nella ROOT del progetto)
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import AppServerModule from 'src/main.server';

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');

  const supportedLocales = ['it', 'en'];
  const defaultLocale = 'it';

  const commonEngine = new CommonEngine();
  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Serve i file statici per ogni lingua
  supportedLocales.forEach((locale) => {
    server.use(`/${locale}`, express.static(join(browserDistFolder, locale), { maxAge: '1y' }));
  });

  // Reindirizzamento dalla root alla lingua di default
  server.get('/', (req, res) => {
    res.redirect(301, `/${defaultLocale}`);
  });

  // Serve i file statici non localizzati (es. /favicon.ico)
  server.get('*.*', express.static(browserDistFolder, { maxAge: '1y' }));

  // Tutte le altre rotte usano l'engine Angular per il rendering SSR
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, headers } = req;

    const urlParts = originalUrl.split('/');
    const locale = supportedLocales.includes(urlParts[1]) ? urlParts[1] : defaultLocale;

    const indexHtml = join(browserDistFolder, locale, 'index.html');

    commonEngine
      .render({
        bootstrap: AppServerModule,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: join(browserDistFolder, locale),
        providers: [
          { provide: APP_BASE_HREF, useValue: `/${locale}/` }
        ],
      })
      .then((html) => res.send(html))
      .catch((err) => {
        // ---> MODIFICA CHIAVE #1: LOGGING MIGLIORATO <---
        // Aggiungiamo un log esplicito dell'errore di rendering!
        console.error('❌ ERRORE DURANTE IL RENDERING SSR:', err);
        next(err);
      });
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;
  const server = app();
  server.listen(port, () => {
    console.log(`✅ Node Express server listening on http://localhost:${port}`);
  });
}

// ---> MODIFICA CHIAVE #2: AVVIO SEMPLIFICATO <---
// Avviamo il server direttamente. Il blocco di controllo complesso
// non è necessario, poiché questo file viene sempre eseguito per avviare il server.
run();

// Esportiamo anche il main.server per compatibilità
export * from './src/main.server';

