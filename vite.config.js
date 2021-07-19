const path = require('path');

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

function resolveSrcFile(filePath) {
  return path.resolve(__dirname, './src', filePath);
}

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'vue-sfc-inject-css',
      transformIndexHtml(htmlStr) {
        return htmlStr.replace('<meta name="style">', '<link rel="stylesheet" href="/assets/popup.css">')
      },
    },
  ],
  build: {
    minify: false,
    rollupOptions: {
      input: {
        popup: resolveSrcFile('./popup/index.html'),
        inject: resolveSrcFile('./inject/index.js'),
        content: resolveSrcFile('./content/index.js'),
      },
      output: {
        format: 'es',
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
    emptyOutDir: false,
    watch: {},
  },
})
