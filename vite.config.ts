import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // Firestore's official browser SDK is intentionally kept in its own
      // cacheable vendor chunk; allow its known ~600 kB minified size.
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        output: {
          // Keep Firebase and icon code cacheable and out of the initial app
          // chunk. Reports/charts are already lazy-loaded by their tabs.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('/firebase/auth/')) return 'firebase-auth';
            if (id.includes('/firebase/firestore/')) return 'firebase-firestore';
            if (id.includes('/firebase/app/')) return 'firebase-app';
            if (id.includes('/firebase/')) return 'firebase-vendor';
            if (id.includes('/lucide-react/')) return 'icons-vendor';
            return undefined;
          },
        },
      },
    },
  };
});
