import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { registerSW } from "virtual:pwa-register";

import App from "./App.jsx";
import "./index.css";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Register service worker for PWA (optional prompt for updates)
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("New content available, please refresh.");
  },
  onOfflineReady() {
    console.log("📱 App is ready to work offline.");
  },
  onRegistered(registration) {
    console.log("Service Worker registered:", registration);
  },
  onRegisterError(error) {
    console.error("Service Worker registration failed:", error);
  },
});

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={clientId}>
    <App />
  </GoogleOAuthProvider>
);
