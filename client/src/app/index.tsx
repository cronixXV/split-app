import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/index.css';
import { AppProvider } from './providers/app-provider';
import { AppRouter } from './routers/app-router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <AppRouter />
    </AppProvider>
  </StrictMode>
);
