import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { FranchiseProvider } from './context/FranchiseContext';



// Register Service Worker for PWA / WebAPK support
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore in restricted environments
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <FranchiseProvider>
        <App />
      </FranchiseProvider>
    </ThemeProvider>
  </StrictMode>,
);

