// server.ts (Questo file si trova nella ROOT del progetto azzurra-makeup-fe-new)
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { join } from 'node:path';
import { LOCALE_ID } from '@angular/core';

export async function app(): Promise<express.Express> {
  const server = express();

  // ***** CORREZIONE QUI: Importazione di AppServerModule *****
  // main.server.ts esporta AppServerModule come una proprietà nominata.
  // Dobbiamo importare l'intero modulo e poi accedere alla proprietà.
  const mainServerBundle = await import('./src/main.server');
  const AppServerModule = mainServerBundle.AppServerModule; // <-- CORREZIONE! Accedi alla proprietà AppServerModule

  // ***** MODIFICHE AI PERCORSI PER CLOUD RUN *****
  // Cloud Run esegue il server dalla directory di lavoro del container (es. /usr/src/app).
  // Nel Dockerfile, copi le cartelle 'server' e 'browser' DENTRO /usr/src/app.

  const currentDir = process.cwd(); // Questa sarà la directory di lavoro corrente del processo Node.js (es. /usr/src/app)

  // Percorsi corretti all'interno del container DOPO IL COPY del Dockerfile
  // Ora che outputPath è dist/browser e dist/server in angular.json
  const browserDistFolder = join(currentDir, 'browser'); // Contiene gli asset compilati del client
  const serverDistFolder = join(currentDir, 'server');   // Contiene gli asset del server (non direttamente usati per express.static)

  if (process.env['NODE_ENV'] !== 'production') {
    console.log('📁 currentDir:', currentDir);
    console.log('📁 serverDistFolder:', serverDistFolder);
    console.log('📁 browserDistFolder:', browserDistFolder);
  }

  const supportedLocales = ['it', 'en'];
  const defaultLocale = 'it';

  const commonEngine = new CommonEngine();
  server.set('view engine', 'html');

  // 🚀 Serve asset statici globali (es. favicon, assets)
  server.use(express.static(browserDistFolder, { // Usa la cartella 'browser' copiata
    maxAge: '1y',
  }));

  // 🚀 Serve asset per ciascuna lingua (se hai localizzazione basata su cartelle)
  supportedLocales.forEach((locale) => {
    const localePath = join(browserDistFolder, locale);
    server.use(`/${locale}`, express.static(localePath, {
      maxAge: '1y',
    }));
  });

  // 🔁 Funzione che esegue SSR per una lingua specifica
  supportedLocales.forEach((locale) => {
    const localePath = join(browserDistFolder, locale);
    const indexHtml = join(localePath, 'index.html'); // index.html all'interno della cartella della lingua

    server.get(`/${locale}*`, async (req, res, next) => {
      try {
        if (process.env['NODE_ENV'] !== 'production') {
          console.log(`🔄 SSR rendering ${req.originalUrl} → ${indexHtml}`);
        }

        const html = await commonEngine.render({
          bootstrap: AppServerModule,
          documentFilePath: indexHtml,
          url: req.originalUrl,
          publicPath: localePath,
          providers: [
            { provide: APP_BASE_HREF, useValue: `/${locale}/` },
            { provide: LOCALE_ID, useValue: locale },
          ],
        });
        res.send(html);
      } catch (err) {
        console.error(`❌ SSR error for ${req.originalUrl}:`, err);
        next(err);
      }
    });
  });

  // 🎯 Servizio diretto del favicon
  server.get('/favicon.ico', (req, res) => {
    res.sendFile(join(browserDistFolder, 'favicon.ico'));
  });

  // 🔁 Redirect dalla root alla lingua predefinita
  server.get('/', (req, res) => {
    res.redirect(`/${defaultLocale}`);
  });

  // ⚠️ Catch-all 404 con fallback SSR sulla lingua predefinita
  server.get('*', async (req, res) => {
    try {
      const locale = defaultLocale;
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
        ],
      });
      res.status(404).send(html);
    } catch (err) {
      console.error(`❌ Errore SSR 404 fallback:`, err);
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