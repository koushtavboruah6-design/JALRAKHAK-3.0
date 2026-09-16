import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import App from './App.tsx';
import './index.css';

// Expose Leaflet globally for Leaflet plugins (e.g. leaflet.heat)
if (typeof window !== 'undefined') {
  (window as unknown as { L: typeof L }).L = L;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
