 import { defineConfig } from 'vitest/config';
 import path from 'path';
 
 export default defineConfig({
   test: {
     globals: true,
     environment: 'jsdom',
     include: ['tests/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
     exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
   },
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src'),
     },
   },
 });