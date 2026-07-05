import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves this repo's project site at /CF/, but keep the
  // local dev server at the root so `npm run dev` works unchanged.
  base: command === 'build' ? '/CF/' : '/',
}))
