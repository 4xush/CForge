import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  // double api call to backend , mount unmount remount component
  <StrictMode>
    <App />
  </StrictMode>,
)
