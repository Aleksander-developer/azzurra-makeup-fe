// src/main.server.ts (Questo file va nella cartella src/)
import '@angular/localize/init';

import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

export { AppServerModule } from './app/app.module.server';