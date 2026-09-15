import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { FranchiseProvider } from './context/FranchiseContext';

// Prevent accidental pull-to-refresh reload in Android WebViews & PWAs
let touchStartY = 0;
if (typeof window !== 'undefined') {
  window.addEventListener('touchstart', (e: TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e: TouchEvent) => {
    if (e.touches.length === 1) {
      const currentY = e.touches[0].clientY;
      const isSwipingDown = currentY > touchStartY + 4;

      // Intervene only if already at the top of page AND dragging downwards
      if (window.scrollY <= 0 && isSwipingDown) {
        let target = e.target as HTMLElement | null;
        let hasScrolledParent = false;
        while (target && target !== document.body && target !== document.documentElement) {
          if (target.scrollTop > 0) {
            hasScrolledParent = true;
            break;
          }
          target = target.parentElement;
        }

        if (!hasScrolledParent && e.cancelable) {
          e.preventDefault();
        }
      }
    }
  }, { passive: false });
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

