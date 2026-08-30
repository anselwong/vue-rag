/*
 * @Author: Ansel_Wong
 * @Date: 2026-08-27 12:25:44
 * @LastEditTime: 2026-08-27 20:53:27
 * @LastEditors: Ansel_Wong
 * @Description:
 * @FilePath: /vue-rag/vite.config.ts
 * (#^.^#)
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
