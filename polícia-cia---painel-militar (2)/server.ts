import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Supabase Client strictly server-side
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: any = null;

async function safeUpsert(tableName: string, payload: any): Promise<{ data: any; error: any }> {
  if (!supabase) return { data: null, error: { message: 'Supabase client not initialized' } };

  let currentPayload = JSON.parse(JSON.stringify(payload));
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    const { data, error } = await supabase.from(tableName).upsert(currentPayload);
    if (!error) {
      return { data, error: null };
    }

    // Check if error is due to an undefined column (PostgreSQL 42703)
    if (error.code === '42703' || (error.message && error.message.toLowerCase().includes('column') && error.message.toLowerCase().includes('exist'))) {
      const match = error.message.match(/column "([^"]+)"/i) || error.message.match(/column ([a-zA-Z0-9_]+)/i);
      if (match && match[1]) {
        const colName = match[1];
        console.warn(`[Safe Upsert] Column "${colName}" does not exist in table "${tableName}". Stripping and retrying...`);
        
        // Remove the non-existent column from the payload
        if (Array.isArray(currentPayload)) {
          currentPayload = currentPayload.map(item => {
            if (item && typeof item === 'object') {
              const copy = { ...item };
              delete copy[colName];
              return copy;
            }
            return item;
          });
        } else if (currentPayload && typeof currentPayload === 'object') {
          delete currentPayload[colName];
        }
        
        attempts++;
        continue;
      }
    }

    // If it's a different error or we couldn't parse the column name, return the error
    return { data, error };
  }

  return { data: null, error: { message: `Failed to upsert after stripping ${attempts} columns.` } };
}

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Server] Supabase client initialized successfully.');

    // Ensure the admin account exists in Supabase with 'admin#2026' on boot
    console.log('[Server Startup] Ensuring admin account is created/updated with password admin#2026 in Supabase...');
    safeUpsert('policiais', [{
      nick: 'admin',
      cargo: 'Diretor',
      data_registro: '2026-07-20',
      avatar_habbo: 'admin',
      pontos_promocao: 9999,
      presencas: 999,
      streak: 99,
      senha_hex: 'admin#2026',
      biografia: 'Administrador Supremo do Sistema de Segurança.',
      medalhas: ['Administrador', 'Honra ao Mérito']
    }]).then(({ error }) => {
      if (error) console.error('[Server Startup] Failed to ensure admin in Supabase:', error);
      else console.log('[Server Startup] Admin user ensured in Supabase successfully!');
    });

    // Ensure the 78k account exists in Supabase with '78k#2026' on boot
    console.log('[Server Startup] Ensuring 78k account is created/updated with password 78k#2026 in Supabase...');
    safeUpsert('policiais', [{
      nick: '78k',
      cargo: 'Diretor',
      data_registro: '2026-07-20',
      avatar_habbo: '78k',
      pontos_promocao: 9999,
      presencas: 999,
      streak: 99,
      senha_hex: '78k#2026',
      biografia: 'Diretor Geral e Administrador do Sistema.',
      medalhas: ['Administrador', 'Honra ao Mérito']
    }]).then(({ error }) => {
      if (error) console.error('[Server Startup] Failed to ensure 78k in Supabase:', error);
      else console.log('[Server Startup] 78k user ensured in Supabase successfully!');
    });
  } catch (err) {
    console.error('[Server] Failed to initialize Supabase client:', err);
  }
} else {
  console.log('[Server] Supabase credentials not found in env variables.');
}

// API Routes
app.get('/api/supabase/status', (req, res) => {
  res.json({
    configured: !!supabase,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 12)}...` : null
  });
});

app.post('/api/supabase/upsert', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase is not configured on the server.' });
  }

  const { table, payload } = req.body;
  if (!table || !payload) {
    return res.status(400).json({ error: 'Table and payload are required.' });
  }

  try {
    const { data, error } = await safeUpsert(table, payload);
    if (error) {
      console.error(`[Server API] Upsert error in ${table}:`, error);
      return res.status(400).json({ error: error.message });
    }
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
});

app.post('/api/supabase/delete', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase is not configured on the server.' });
  }

  const { table, id, keyCol } = req.body;
  if (!table || id === undefined) {
    return res.status(400).json({ error: 'Table and id are required.' });
  }

  try {
    const colName = keyCol || (table === 'policiais' ? 'nick' : 'id');
    const { error } = await supabase.from(table).delete().eq(colName, id);
    if (error) {
      console.error(`[Server API] Delete error in ${table}:`, error);
      return res.status(400).json({ error: error.message });
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
});

app.get('/api/radiohabblet/profile/:username', async (req, res) => {
  const { username } = req.params;
  if (!username) {
    return res.status(400).json({ error: 'Username é obrigatório.' });
  }

  try {
    // 1. Fetch user by username
    const userUrl = `https://painel.radiohabblet.com.br/api/records/user?filter=username,eq,${encodeURIComponent(username)}`;
    const userRes = await fetch(userUrl);
    if (!userRes.ok) {
      return res.status(502).json({ error: 'Erro ao conectar com a Rádio Habblet.' });
    }

    const userData = (await userRes.json()) as { records?: any[] };
    if (!userData.records || userData.records.length === 0) {
      return res.json({ sucesso: false, mensagem: 'Usuário não encontrado na Rádio Habblet.' });
    }

    const user = userData.records[0];
    const userId = user.id;

    // Build the photo URL
    let photoUrl = '';
    if (user.photo) {
      if (user.photo.startsWith('http')) {
        photoUrl = user.photo;
      } else {
        const cleanPhoto = user.photo.replace(/^\/+/, '');
        photoUrl = `https://painel.radiohabblet.com.br/upload/${cleanPhoto}`;
      }
    }

    // 2. Fetch user active badges
    const badgesUrl = `https://painel.radiohabblet.com.br/api/records/user_badges?filter=user_id,eq,${userId}&filter=is_active,eq,1`;
    const badgesRes = await fetch(badgesUrl);
    let badgesList: any[] = [];
    if (badgesRes.ok) {
      const badgesData = (await badgesRes.json()) as { records?: any[] };
      badgesList = badgesData.records || [];
    }

    const badgeIds = badgesList.map((b) => b.badge_id).filter(Boolean);
    let badgeDetails: any[] = [];

    if (badgeIds.length > 0) {
      // 3. Fetch badges definitions
      const badgesDefUrl = `https://painel.radiohabblet.com.br/api/records/badges?filter=id,in,${badgeIds.join(',')}`;
      const badgesDefRes = await fetch(badgesDefUrl);
      if (badgesDefRes.ok) {
        const badgesDefData = (await badgesDefRes.json()) as { records?: any[] };
        badgeDetails = (badgesDefData.records || []).map((b) => {
          let imgUrl = '';
          if (b.image) {
            if (b.image.startsWith('http')) {
              imgUrl = b.image;
            } else {
              const cleanImg = b.image.replace(/^\/+/, '');
              imgUrl = `https://painel.radiohabblet.com.br/upload/${cleanImg}`;
            }
          }
          return {
            id: b.id,
            code: b.code,
            title: b.title,
            description: b.description,
            image: imgUrl
          };
        });
      }
    }

    return res.json({
      sucesso: true,
      perfil: {
        id: user.id,
        username: user.username,
        is_active: user.is_active,
        is_custom_verified: user.is_custom_verified,
        is_email_verified: user.is_email_verified,
        created_at: user.created_at,
        photo: photoUrl,
        badges: badgeDetails
      }
    });

  } catch (error: any) {
    console.error('[Server API] Radio Habblet proxy error:', error);
    return res.status(500).json({ error: error.message || error });
  }
});

app.post('/api/supabase/pull', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase is not configured on the server.' });
  }

  try {
    const tables = [
      'configuracao_site',
      'policiais',
      'avisos',
      'testes',
      'movimentacoes',
      'categorias',
      'patentes',
      'grupos',
      'treinamentos',
      'aplicacoes_treinamentos',
      'xp_enviados',
      'advertencias',
      'exoneracoes'
    ];

    const results: Record<string, any> = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
          console.warn(`[Server API] Table ${table} select warning:`, error.message);
          results[table] = [];
        } else {
          results[table] = data || [];
        }
      } catch (tblErr: any) {
        console.error(`Error loading table ${table}:`, tblErr);
        results[table] = [];
      }
    }

    return res.json({ success: true, data: results });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
});

app.post('/api/supabase/push', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase is not configured on the server.' });
  }

  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: 'Data block is required.' });
  }

  try {
    const responseLog: Record<string, string> = {};

    // Helper to safely upsert rows
    const syncTable = async (tableName: string, rows: any[]) => {
      if (!rows || rows.length === 0) return;
      const { error } = await safeUpsert(tableName, rows);
      if (error) {
        console.error(`[Server API] Push upsert error in ${tableName}:`, error);
        responseLog[tableName] = error.message;
      } else {
        responseLog[tableName] = 'ok';
      }
    };

    // Sync all provided arrays
    if (data.configuracao_site) await syncTable('configuracao_site', data.configuracao_site);
    if (data.policiais) await syncTable('policiais', data.policiais);
    if (data.avisos) await syncTable('avisos', data.avisos);
    if (data.testes) await syncTable('testes', data.testes);
    if (data.movimentacoes) await syncTable('movimentacoes', data.movimentacoes);
    if (data.categorias) await syncTable('categorias', data.categorias);
    if (data.patentes) await syncTable('patentes', data.patentes);
    if (data.grupos) await syncTable('grupos', data.grupos);
    if (data.treinamentos) await syncTable('treinamentos', data.treinamentos);
    if (data.aplicacoes_treinamentos) await syncTable('aplicacoes_treinamentos', data.aplicacoes_treinamentos);
    if (data.xp_enviados) await syncTable('xp_enviados', data.xp_enviados);
    if (data.advertencias) await syncTable('advertencias', data.advertencias);
    if (data.exoneracoes) await syncTable('exoneracoes', data.exoneracoes);

    return res.json({ success: true, log: responseLog });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
});

app.post('/api/supabase/wipe', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase is not configured on the server.' });
  }

  try {
    const pKeyTables = [
      { name: 'exoneracoes', pk: 'id' },
      { name: 'advertencias', pk: 'id' },
      { name: 'xp_enviados', pk: 'id' },
      { name: 'aplicacoes_treinamentos', pk: 'id' },
      { name: 'treinamentos', pk: 'id' },
      { name: 'grupos', pk: 'id' },
      { name: 'patentes', pk: 'id' },
      { name: 'categorias', pk: 'id' },
      { name: 'movimentacoes', pk: 'id' },
      { name: 'testes', pk: 'id' },
      { name: 'avisos', pk: 'id' },
      { name: 'configuracao_site', pk: 'id' }
    ];

    // Wipe all foreign key tables first, then main tables
    for (const t of pKeyTables) {
      await supabase.from(t.name).delete().neq(t.pk, 'DUMMY_NONE_EXISTENT_ID');
    }

    // Now wipe 'policiais' table (has 'nick' primary key)
    await supabase.from('policiais').delete().neq('nick', 'DUMMY_NONE_EXISTENT_NICK');

    // Re-insert initial 'configuracao_site'
    await supabase.from('configuracao_site').upsert([{
      id: 'config_principal',
      nome_site: 'POLÍCIA CIA',
      subtitulo_site: 'Mesa de Operações Integradas • Brasília/DF',
      logo_texto: 'CIA',
      login_mensagem: 'Acesso exclusivo para policiais e oficiais autorizados.'
    }]);

    // Re-insert default 'policiais' row for admin
    await supabase.from('policiais').upsert([{
      nick: 'admin',
      cargo: 'Diretor',
      data_registro: '2026-07-20',
      avatar_habbo: 'admin',
      pontos_promocao: 9999,
      presencas: 999,
      streak: 99,
      senha_hex: 'admin#2026',
      biografia: 'Administrador Supremo do Sistema de Segurança.',
      medalhas: ['Administrador', 'Honra ao Mérito']
    }]);

    // Re-insert default 'policiais' row for 78k
    await supabase.from('policiais').upsert([{
      nick: '78k',
      cargo: 'Diretor',
      data_registro: '2026-07-20',
      avatar_habbo: '78k',
      pontos_promocao: 9999,
      presencas: 999,
      streak: 99,
      senha_hex: '78k#2026',
      biografia: 'Diretor Geral e Administrador do Sistema.',
      medalhas: ['Administrador', 'Honra ao Mérito']
    }]);

    return res.json({ success: true, message: 'All tables wiped and reset successfully on Supabase.' });
  } catch (err: any) {
    console.error('[Server API] Error during wipe:', err);
    return res.status(500).json({ error: err.message || err });
  }
});

app.post('/api/webhook/send', async (req, res) => {
  const { url, payload } = req.body;
  if (!url || !payload) {
    return res.status(400).json({ error: 'URL and payload are required.' });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[Webhook Proxy] Failed to send webhook:', text);
      return res.status(response.status).json({ error: text });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('[Webhook Proxy] Exception while sending webhook:', err);
    return res.status(500).json({ error: err.message || err });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
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
  });
}

startServer();
