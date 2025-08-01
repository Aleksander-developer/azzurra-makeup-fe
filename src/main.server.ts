// src/main.server.ts
import '@angular/localize/init';

import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

import { AppServerModule } from './app/app.module.server';

// ***** CORREZIONE FINALE QUI: Esportiamo AppServerModule come default.
export default AppServerModule; // <-- Questa riga è la chiave!