// server.ts (nella ROOT del progetto)
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALE_ID } from '@angular/core';

// ***** CORREZIONE QUI: Importiamo AppServerModule all'inizio del file *****
// L'importazione statica è il modo più robusto per il type-checker.
import AppServerModule from './src/main.server';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  
  const supportedLocales = ['it', 'en'];
  const defaultLocale = 'it';
  
  const commonEngine = new CommonEngine();
  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Serve i file statici per ogni lingua in /it e /en
  supportedLocales.forEach((locale) => {
    const localePath = join(browserDistFolder, locale);
    server.use(`/${locale}`, express.static(localePath, {
      maxAge: '1y'
    }));
  });

  // Serve i file statici non localizzati (es. il favicon)
  server.get('*.*', express.static(browserDistFolder, {
    maxAge: '1y'
  }));

  // All regular routes use the Angular engine
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;
    
    // Controlla se la lingua è supportata nella URL
    const locale = supportedLocales.find(loc => originalUrl.startsWith(`/${loc}/`)) || defaultLocale;
    
    // Percorso ai file compilati per la lingua specifica
    const localePath = join(browserDistFolder, locale);
    const indexHtml = join(localePath, 'index.html');
    
    commonEngine
      .render({
        bootstrap: AppServerModule, // ✅ passaggio diretto del modulo
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  // Reindirizzamento dalla root
  server.get('/', (req, res) => {
    res.redirect(`/${defaultLocale}/`);
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

const mainModule = require.main;
if (mainModule && mainModule.filename === __filename) {
  run();
}