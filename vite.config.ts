import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'

const iconDir = path.resolve(__dirname, '../assets/icons/lucide')
const sharedIconDir = path.resolve(__dirname, '../assets/icons')
const avatarDir = path.resolve(__dirname, '../assets/avatars')

function localIconLibrary() {
  return {
    name: 'local-icon-library',
    configureServer(server: { middlewares: { use: (path: string, handler: (req: any, res: any, next: () => void) => void) => void } }) {
      server.middlewares.use('/icons', (req, res, next) => {
        const fileName = String(req.url || '').replace(/^\/lucide\//, '')
        const filePath = fileName === 'wechat.svg' ? path.join(sharedIconDir, fileName) : path.join(iconDir, fileName)
        if (!fileName || !filePath.startsWith(sharedIconDir) || !fs.existsSync(filePath)) return next()
        res.setHeader('Content-Type', 'image/svg+xml')
        const source = fs.readFileSync(filePath, 'utf8')
        res.end(fileName === 'wechat.svg' ? source.replace('#FFFFFF', '#5f6b7a') : source)
      })
      server.middlewares.use('/avatars', (req, res, next) => {
        const fileName = path.basename(String(req.url || '').split('?')[0])
        const filePath = path.join(avatarDir, fileName)
        if (!fileName || !filePath.startsWith(avatarDir) || !fs.existsSync(filePath)) return next()
        res.setHeader('Content-Type', fileName.endsWith('.svg') ? 'image/svg+xml' : 'image/png')
        res.end(fs.readFileSync(filePath))
      })
    },
    generateBundle(this: { emitFile: (asset: { type: 'asset'; fileName: string; source: string | Uint8Array }) => void }) {
      for (const fileName of fs.readdirSync(iconDir)) {
        if (fileName.endsWith('.svg')) {
          this.emitFile({ type: 'asset', fileName: `icons/lucide/${fileName}`, source: fs.readFileSync(path.join(iconDir, fileName), 'utf8') })
        }
      }
      this.emitFile({
        type: 'asset',
        fileName: 'icons/lucide/wechat.svg',
        source: fs.readFileSync(path.join(sharedIconDir, 'wechat.svg'), 'utf8').replace('#FFFFFF', '#5f6b7a'),
      })
      for (const fileName of fs.readdirSync(avatarDir)) {
        if (/\.(png|svg|jpe?g|webp)$/i.test(fileName)) {
          this.emitFile({ type: 'asset', fileName: `avatars/${fileName}`, source: fs.readFileSync(path.join(avatarDir, fileName)) })
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [vue(), localIconLibrary()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue'],
          element: ['element-plus', '@element-plus/icons-vue'],
          axios: ['axios'],
        },
      },
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})
