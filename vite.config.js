const path = require('path');

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

function resolveSrcFile(filePath) {
  return path.resolve(__dirname, './src', filePath);
}

export default defineConfig({
  plugins: [
    vue(),
  ],
  build: {
    rollupOptions: {
      input: {
        background: resolveSrcFile('./background/index.js'),
        popup: resolveSrcFile('./popup/index.html'),
      },
      output: {
        format: 'es',
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
    watch: {},
  },
})
