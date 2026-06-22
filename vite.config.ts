import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Strict CSP for the shipped (production / Capacitor) build only. Injected at
// build time so it does not interfere with Vite's dev-server inline scripts/HMR.
const CSP = [
  "default-src 'self' capacitor: https://localhost",
  "script-src 'self' capacitor: https://localhost",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' capacitor: https://localhost https://*.googleapis.com https://*.firebaseio.com https://*.firebaseinstallations.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://www.google-analytics.com",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function cspPlugin(): Plugin {
  return {
    name: 'inject-csp-on-build',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), cspPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // base './' is mandatory — Capacitor loads assets via relative paths from the
  // filesystem; absolute '/' paths break in the wrapped app.
  base: './',
  server: {
    port: 5173,
  },
});
