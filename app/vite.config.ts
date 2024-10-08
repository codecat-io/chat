 
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
 
import basicSsl from '@vitejs/plugin-basic-ssl';
import proxy from 'vite-plugin-http2-proxy';
import path from 'node:path';
import process from 'node:process';

const __dirname = new URL('.', import.meta.url).pathname;
const sslPath = path.join(__dirname, '../../ssl/');

export default defineConfig({
  define: {
    APP_VERSION: JSON.stringify(process.env.APP_VERSION),
    APP_NAME: JSON.stringify(process.env.APP_NAME),
    API_URL: JSON.stringify(''),
  },
  server: {
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    basicSsl({
      name: 'test',
      domains: ['localhost'],
      certDir: sslPath,
    }),
    proxy({
      '^/api/': {
        target: 'http://localhost:8080',
      },
    }),
    VitePWA({
      injectRegister: 'auto',
      strategies: 'injectManifest',
      srcDir: './src',
      filename: 'sw.ts',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        id: 'io.codecat.chat.pwa',
        name: 'Quack',
        short_name: 'quack',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1a1d21',
        theme_color: '#673ab8',
        icons: [
          {
            src: '/icons/android-chrome-192x192.png',
            type: 'image/png',
            sizes: '192x192',
            purpose: 'any maskable',
          },
          {
            src: '/icons/android-chrome-512x512.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'any maskable',
          },
        ],
        share_target: {
          action: '/share',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
          },
        },
      },
    }),
  ],
});
