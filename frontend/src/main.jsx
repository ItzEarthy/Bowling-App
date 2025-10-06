import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { setupUpdateCheckerWithRetry } from './services/serviceWorkerManager'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Initialize service worker manager (non-blocking)
try {
  setupUpdateCheckerWithRetry().catch(err => {
    // Already logged inside manager; surface minimal info here
    console.warn('Service worker manager failed to initialize:', err);
  });
} catch (e) {
  // ignore in non-browser environments
}