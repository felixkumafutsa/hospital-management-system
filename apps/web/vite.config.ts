import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    historyApiFallback: true, // Critical for SPA routing - enables direct URL access
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // SPA-specific build optimizations
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'esnext',
    minify: 'terser',
    cssMinify: true,
    // Tree shaking and chunking optimizations
    rollupOptions: {
      output: {
        // Improved chunk splitting strategy
        manualChunks: {
          // Core vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'query-vendor': ['@tanstack/react-query'],
          'utils-vendor': ['axios', 'date-fns', 'sweetalert2'],
          
          // Feature-specific chunks to reduce initial load size
          'clinical-features': [
            './src/pages/consultations/ConsultationsPage',
            './src/pages/lab/LabTestsPage',
            './src/pages/prescriptions/PrescriptionsPage'
          ],
          'admin-features': [
            './src/pages/users/UserManagementPage',
            './src/pages/accounts/AccountsDashboardPage',
            './src/pages/finance/FinanceDashboardPage'
          ],
          'specialty-features': [
            './src/pages/maternity/MaternityDashboardPage',
            './src/pages/pharmacy/PharmacyDashboardPage',
            './src/pages/pharmacy/PharmacyInventoryPage'
          ]
        },
        // Ensure clean chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
    // Terser optimization for smaller bundle sizes
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  preview: {
    port: 3000,
    historyApiFallback: true, // Also enable for preview server
  },
})