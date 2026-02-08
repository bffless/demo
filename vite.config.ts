import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/flags': {
        target: 'https://demo-feature-flags.docs.bffless.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/flags/, ''),
      },
    },
  },
})
