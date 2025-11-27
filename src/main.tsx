import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Polyfills for libraries that need Node.js globals
if (typeof window !== 'undefined') {
  if (!(window as any).global) {
    (window as any).global = window;
  }
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  }
}

createRoot(document.getElementById('root')!).render(
  <App />
)
