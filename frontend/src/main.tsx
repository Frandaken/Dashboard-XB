import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Clear any stale API caches from previous service worker iterations
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.delete('api-schedule-cache').catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

