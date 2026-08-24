import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'JustWord 单词记忆',
        short_name: 'JustWord',
        description: '沉浸式背单词 · 表格背诵法 · 多端同步',
        lang: 'zh-CN',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#863bff',
        background_color: '#0b0b0f',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/apple-touch-icon-180.png', sizes: '180x180', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // API 接口：网络优先 + 兜底缓存（离线可读最近响应）
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // 图片资源：缓存优先（词书封面等）
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // M4-D 性能优化：将跨页面共享的 vendor 依赖拆分为独立 chunk，
        // 提升浏览器缓存命中率并降低首屏 index.js 体积
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          // 注意判断顺序：先命中更具体的包，避免 react-i18next 等被误分
          if (
            id.includes('@radix-ui') ||
            id.includes('class-variance-authority') ||
            id.includes('clsx') ||
            id.includes('tailwind-merge')
          ) return 'vendor-ui'
          if (id.includes('i18next')) return 'vendor-i18n'
          if (id.includes('zustand') || id.includes('localforage')) return 'vendor-state'
          if (id.includes('lucide-react')) return 'vendor-lucide'
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'vendor-react'
          return undefined
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',  // 监听所有网络接口
    port: 5173,       // 端口
    strictPort: false, // 如果端口被占用，自动尝试下一个
    proxy: {
      // 代理 API 请求到后端（避免跨域）
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/docs': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  }
})
