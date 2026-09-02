import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { FranchiseProvider } from './context/FranchiseContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <FranchiseProvider>
        <App />
      </FranchiseProvider>
    </ThemeProvider>
  </StrictMode>,
);

