import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    // NOTE: SUPABASE_URL / SUPABASE_ANON_KEY (sem prefixo VITE_) são propositalmente
    // MANTIDAS FORA do bundle do cliente. Elas só existem em process.env no servidor
    // (Vercel Functions em /api). O frontend fala com o Supabase através do proxy
    // /api/supabase/*, então a chave nunca aparece no JS enviado ao navegador.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in NexSocial via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
