import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig( {
    base: '/glass-3d/',
    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'index.html'),
                hdri: resolve(__dirname, 'hdri.html'),
            }
        }
    }
})
