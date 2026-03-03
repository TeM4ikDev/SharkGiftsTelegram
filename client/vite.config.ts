import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, Plugin } from 'vite';

// Плагин для исключения файлов из сборки
function excludeAssetsPlugin(): Plugin {
  return {
    name: 'exclude-assets',
    generateBundle(options, bundle) {
      // Удаляем файлы из bundle, которые соответствуют паттернам исключения
      for (const fileName in bundle) {
        const file = bundle[fileName];
        if (file.type === 'asset') {
          const originalFileName = (file as any).originalFileName || fileName;
          // Исключаем файлы из папки boxes
          if (originalFileName.includes('/assets/boxes/') || originalFileName.includes('\\assets\\boxes\\')) {
            delete bundle[fileName];
          }
        } else if (file.type === 'chunk') {
          // Также проверяем chunks на наличие ссылок на файлы из boxes
          const chunk = file as any;
          if (chunk.facadeModuleId && (chunk.facadeModuleId.includes('/assets/boxes/') || chunk.facadeModuleId.includes('\\assets\\boxes\\'))) {
            delete bundle[fileName];
          }
        }
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // excludeAssetsPlugin(),
    // visualizer({
    //   open: true,
    //   filename: 'dist/stats.html',
    //   gzipSize: true,
    //   brotliSize: true,
    // })
  ],
  assetsInclude: ['**/*.lottie'],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  define: {
    'global': 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  build: {
    rollupOptions: {
      output: {
        // Для изображений убираем хеши, для остальных файлов оставляем
        // assetFileNames: (assetInfo) => {
        //   const info = assetInfo.name?.split('.') || [];
        //   const ext = info[info.length - 1];
        //   // Для изображений используем оригинальные имена без хешей
        //   if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'json'].includes(ext?.toLowerCase())) {
        //     return `assets/[name].[ext]`;
        //   }
        //   // Для остальных файлов (шрифты, JSON и т.д.) оставляем хеши
        //   return `assets/[name]-[hash].[ext]`;
        // },
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@headlessui/react', '@radix-ui/react-dropdown-menu', 'framer-motion'],
          'state-vendor': ['mobx', 'mobx-react-lite', 'mobx-utils'],
          'icons-vendor': ['react-icons', 'lucide-react'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})
