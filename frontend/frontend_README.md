# CForge – Cache, Service Worker, Manifest & HTML Update Documentation

## 🧠 Problem Summary

- Stale service workers and cached static files caused outdated content and icons to persist after updates.
- Manifest and splash screen configuration needed to be modernized for best PWA/Apple device support.
- `index.html` had become large and cluttered, making maintenance difficult.
- Two manifest sources (static and VitePWA) could cause conflicts.

---

## ✅ Fix Summary

| Area             | Fix                                                 |
| ---------------- | --------------------------------------------------- |
| Service Worker   | Forced auto-update and added version invalidation   |
| Cache Cleanup    | One-time cache + SW cleanup logic for older users   |
| Static Assets    | Improved caching policy for unversioned images      |
| Routing Fallback | Ensured `/index.html` is never cached               |
| Cache Headers    | Controlled via updated `vercel.json`                |
| Manifest         | Use only VitePWA-generated manifest, removed static |
| index.html       | Cleaned up, only modern essentials kept             |
| Splash Screens   | All new Apple splash tags, old ones removed         |

---

## 📁 File Changes & Why

### ✅ `vite.config.js`

- Enabled `cleanupOutdatedCaches`.
- Added `navigateFallback: "/index.html"` for SPA routing.
- Added version-based busting to force SW update on each deploy:
  ```js
  version: Date.now().toString();
  ```
- Manifest config is now the single source of truth for PWA settings and icons.

**Why:**

- Ensures service worker detects changes and updates immediately
- Prevents manifest conflicts

---

### ✅ `vercel.json`

- Set `Cache-Control: no-store` for `/index.html`.
- Set long-term cache for hashed JS/CSS, short-term for images/icons.

**Why:**

- Prevents caching of HTML, enables proper asset refresh.

---

### ✅ `App.jsx`

- Added a `useEffect` to unregister all service workers, clear all caches, reload once, and set a localStorage flag to avoid repeat.

**Why:**

- Seamless fix for already affected users.

---

### ✅ `vite.config.js` Manifest Section

- Manifest is now only defined in VitePWA config.
- `background_color` set to `#ffffff` (white) for a clean splash background.
- All icons referenced at their native sizes (no scaling up in manifest):
  ```js
  icons: [
    {
      src: "favicon/web-app-manifest-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "favicon/web-app-manifest-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
    {
      src: "favicon/web-app-manifest-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable",
    },
  ];
  ```

**Why:**

- Ensures correct icon display and white background for PWA splash/install. No static manifest is referenced or needed.

---

### ✅ `index.html`

- Now references only the VitePWA-generated manifest (`/manifest.webmanifest`).
- Removed all old/duplicate `<link rel="apple-touch-startup-image" ...>` tags.
- Inserted only the new, device-specific splash screen tags using the `/splash_screens/` directory.
- Removed unnecessary meta tags, inline styles, and comments.
- Kept only essential meta, favicon, manifest, Open Graph/Twitter, and one font import.

**Why:**

- Modern, minimal, PWA-ready HTML; easier to maintain and ensures correct splash/icon behavior on all devices.

---

## 📝 Testing Checklist

- [x] Build and serve app locally in production mode.
- [x] Use browser DevTools (Application tab) to check manifest, icons, splash screens, and service worker.
- [x] Test on real mobile devices: Add to Home Screen, launch, and verify splash screens.
- [x] Run Lighthouse PWA audit for compliance.

---

**Result:**

- PWA, splash screens, and icons now work as expected across devices.
- No scaling or stretching of icons in manifest or HTML.
- index.html is clean and maintainable.
- Service worker and cache issues resolved for all users.
- Only one manifest is used (from VitePWA), preventing conflicts.
