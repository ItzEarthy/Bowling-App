import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { setupUpdateChecker } from './registerSW'

// Service worker is automatically registered by vite-plugin-pwa
// We enhance it with more aggressive update checking for Portainer deployments
setupUpdateChecker()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)