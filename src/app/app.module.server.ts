// src/app/app.server.module.ts

import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
// ---> 1. Importa il NoopAnimationsModule <---
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    // ---> 2. Aggiungi NoopAnimationsModule qui <---
    // Questo modulo sostituisce BrowserAnimationsModule sul server,
    // evitando il crash e permettendo all'app di avviarsi.
    NoopAnimationsModule,
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}