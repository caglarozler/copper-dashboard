import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: base must match your GitHub repo name
// If repo is "copper-dashboard", base is '/copper-dashboard/'
// If using custom domain, set base: '/'
export default defineConfig({
  plugins: [react()],
  base: '/copper-dashboard/',
})
