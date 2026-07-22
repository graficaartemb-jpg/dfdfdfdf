import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import app, { garantirAdminsIniciais, realizarBackupESendDiscord, obterSupabase } from './api/app';

dotenv.config();

const PORT = 3000;

// Dynamically run initial check after startup
setTimeout(() => {
  const client = obterSupabase();
  if (client) {
    console.log('[Server Startup] Supabase conectado e ativo com sucesso via variáveis de ambiente/secrets!');
    garantirAdminsIniciais().catch(err => {
      console.warn('[Server Startup] Alerta ao criar administradores iniciais no Supabase:', err.message);
    });
  } else {
    console.log('[Server Startup] Supabase ainda não está configurado. Insira as variáveis SUPABASE_URL e SUPABASE_ANON_KEY no Vercel/Secrets.');
  }
}, 1000);

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Full-stack application running at http://localhost:${PORT}`);

    // Initial startup backup check after 15 seconds
    setTimeout(() => {
      console.log('[Startup Backup] Executando verificação de backup inicial...');
      realizarBackupESendDiscord(false).catch(err => {
        console.error('[Startup Backup] Erro na verificação inicial de backup:', err);
      });
    }, 15000);

    // Periodic backup check every 10 minutes
    setInterval(() => {
      console.log('[Cron Backup] Verificando se é necessário realizar o backup de 7 em 7 horas...');
      realizarBackupESendDiscord(false).catch(err => {
        console.error('[Cron Backup] Erro não tratado durante verificação de backup:', err);
      });
    }, 10 * 60 * 1000);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
