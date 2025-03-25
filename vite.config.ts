import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Override the default polyfills
      overrides: {
        // Make sure crypto is properly polyfilled
        crypto: 'crypto-browserify',
        stream: 'stream-browserify',
      },
    }),
  ],
  define: {
    // This is needed for the Buffer polyfill
    'process.env': {},
    // Fix for readable-stream
    'global': {},
  },
  resolve: {
    alias: {
      // This is needed for the Buffer polyfill
      buffer: 'buffer',
      stream: 'stream-browserify',
      util: 'util',
    },
  },
  optimizeDeps: {
    exclude: [
      'buffer',
      'stream-browserify',
      'util',
      'crypto-browserify',
    ],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
    },
  },
});
