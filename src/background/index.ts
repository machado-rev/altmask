import AltmaskController from './controllers';

// Add instance to window for debugging
const controller = new AltmaskController();
Object.assign(window, { controller });
