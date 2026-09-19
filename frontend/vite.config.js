import { defineConfig } from 'vite';
import { resolve } from 'path';
import { spawn } from 'child_process';
import http from 'http';
import glob from 'fast-glob';

// Auto-start backend plugin for seamless development
function autoStartBackendPlugin() {
  let backendProcess = null;
  const projectRoot = resolve(__dirname, '..');
  const serverScript = resolve(projectRoot, 'backend/src/server.js');

  return {
    name: 'vite-plugin-auto-backend',
    configureServer(server) {
      // Check if backend server is already active on port 5000
      const checkReq = http.get('http://127.0.0.1:5000/api/v1/health', { timeout: 800 }, (res) => {
        console.log('\n[Backend] ✅ Background Verification API is already running on http://localhost:5000\n');
      });

      checkReq.on('error', () => {
        console.log('\n[Backend] 🚀 Auto-starting Background Verification API server on http://localhost:5000...');
        const nodeExecutable = process.execPath;

        backendProcess = spawn(nodeExecutable, [serverScript], {
          cwd: projectRoot,
          stdio: 'inherit',
          env: { ...process.env }
        });

        backendProcess.on('error', (err) => {
          console.error('[Backend] ❌ Failed to start backend process:', err.message);
        });

        backendProcess.on('exit', (code) => {
          if (code !== null && code !== 0) {
            console.warn(`[Backend] ⚠️ Backend server exited with code ${code}`);
          }
        });
      });

      // Gracefully terminate backend server when Vite server stops
      const killBackend = () => {
        if (backendProcess && !backendProcess.killed) {
          try {
            if (process.platform === 'win32') {
              spawn('taskkill', ['/pid', backendProcess.pid.toString(), '/f', '/t']);
            } else {
              backendProcess.kill('SIGTERM');
            }
          } catch (e) {}
          backendProcess = null;
        }
      };

      server.httpServer?.on('close', killBackend);
      process.on('exit', killBackend);
      process.on('SIGINT', () => { killBackend(); process.exit(); });
      process.on('SIGTERM', () => { killBackend(); process.exit(); });
    }
  };
}

// Grab all HTML files inside src (including subfolders)
const htmlFiles = glob.sync('./src/**/*.html', { cwd: __dirname });

export default defineConfig({
  plugins: [autoStartBackendPlugin()],
  base: './',
  root: resolve(__dirname, 'src'),
  server: {
    host: true,
    port: 3000,
    hot: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: [
          resolve(__dirname, 'node_modules'),
          resolve(__dirname, '../node_modules')
        ],
      },
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: htmlFiles.length
        ? Object.fromEntries(
            htmlFiles.map(file => [
              file.replace(/^\.\/src\//, '').replace(/\.html$/, ''),
              resolve(__dirname, file),
            ])
          )
        : resolve(__dirname, 'src/index.html'),
      output: {
        chunkFileNames: 'assets/js/[name].js',
        entryFileNames: 'assets/js/[name].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
            return 'assets/images/[name][extname]';
          }
          if (/\.css$/.test(name ?? '')) {
            return 'assets/css/[name][extname]';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
});
