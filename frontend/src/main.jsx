import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';

import App from './App.jsx'
import './index.css'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')).render(
  // double api call to backend , mount unmount remount component
  <GoogleOAuthProvider clientId={clientId}>
    <App />
  </GoogleOAuthProvider>,
)
