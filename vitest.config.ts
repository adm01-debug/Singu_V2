 import { defineConfig } from 'vitest/config';
 import path from 'path';
 
 export default defineConfig({
   test: {
     globals: true,
     environment: 'jsdom',
     alias: {
       '@': path.resolve(__dirname, './src'),
       'npm:@supabase/supabase-js@2': path.resolve(__dirname, './node_modules/@supabase/supabase-js/dist/main/index.js'),
     },
     include: ['tests/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
     exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
   },
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src'),
     },
   },
 });