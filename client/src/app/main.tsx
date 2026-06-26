import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from '../App';
import { EffectorProvider } from './providers/effector-provider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EffectorProvider>
      <App />
    </EffectorProvider>
  </StrictMode>
);
