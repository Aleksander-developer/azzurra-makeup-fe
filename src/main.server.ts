import '@angular/localize/init';

import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { AppServerModule } from './app/app.module.server';

if (environment.production) {
  enableProdMode();
}

// Export nominato per Express (renderModule)
export { AppServerModule };

// Export default per Vite SSR in dev
export default AppServerModule;
