import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { resolve } from 'path'

export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [
    TanStackRouterVite({
      routesDirectory: resolve(__dirname, 'src/frontend/routes'),
      generatedRouteTree: resolve(__dirname, 'src/frontend/routeTree.gen.ts'),
    }),
    react(),
  ],
  root: 'src/frontend',
  publicDir: '../../public',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@api': resolve(__dirname, 'src/api'),
      '@frontend': resolve(__dirname, 'src/frontend'),
    },
  },
  build: {
    outDir: '../../dist/frontend',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['@tanstack/react-router'],
          query: ['@tanstack/react-query'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
  // Tauri expects a fixed port and needs to clear the "localhost" env var
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_'],
})
