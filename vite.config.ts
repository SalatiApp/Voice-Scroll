import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'serve-apk-and-zip-binary',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const rawUrl = req.url ? req.url.split('?')[0] : '';
            if (
              rawUrl === '/VoiceScroll-release.apk' ||
              rawUrl.endsWith('/VoiceScroll-release.apk') ||
              rawUrl.endsWith('VoiceScroll-release.apk') ||
              rawUrl === '/download/apk' ||
              rawUrl === '/api/download/apk'
            ) {
              const apkPath = path.resolve(__dirname, 'public', 'VoiceScroll-release.apk');
              if (fs.existsSync(apkPath)) {
                const stat = fs.statSync(apkPath);
                res.writeHead(200, {
                  'Content-Type': 'application/vnd.android.package-archive',
                  'Content-Disposition': 'attachment; filename="VoiceScroll-release.apk"',
                  'Content-Length': stat.size,
                  'Cache-Control': 'no-cache',
                  'Access-Control-Allow-Origin': '*',
                });
                fs.createReadStream(apkPath).pipe(res);
                return;
              }
            }
            if (
              rawUrl === '/VoiceScroll-Android-Native-Source.zip' ||
              rawUrl.endsWith('/VoiceScroll-Android-Native-Source.zip') ||
              rawUrl.endsWith('VoiceScroll-Android-Native-Source.zip') ||
              rawUrl === '/download/zip' ||
              rawUrl === '/api/download/zip'
            ) {
              const zipPath = path.resolve(__dirname, 'public', 'VoiceScroll-Android-Native-Source.zip');
              if (fs.existsSync(zipPath)) {
                const stat = fs.statSync(zipPath);
                res.writeHead(200, {
                  'Content-Type': 'application/zip',
                  'Content-Disposition': 'attachment; filename="VoiceScroll-Android-Native-Source.zip"',
                  'Content-Length': stat.size,
                  'Cache-Control': 'no-cache',
                  'Access-Control-Allow-Origin': '*',
                });
                fs.createReadStream(zipPath).pipe(res);
                return;
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
