import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Helper to load Supabase credentials dynamically (env variables with local file backup)
function obterCredenciaisSupabase() {
  let url = '';
  let key = '';

  // 1. Prefer user configuration from UI if it exists
  try {
    const credsPath = path.join(process.cwd(), 'supabase_credentials.json');
    if (fs.existsSync(credsPath)) {
      const fileContent = fs.readFileSync(credsPath, 'utf8');
      const creds = JSON.parse(fileContent);
      if (creds.url && creds.key) {
        url = creds.url;
        key = creds.key;
      }
    }
  } catch (err) {
    console.error('[Supabase Init] Erro ao ler credenciais locais de backup:', err);
  }

  // 2. Fallback to env variables if not set in file
  if (!url || !key) {
    url = process.env.SUPABASE_URL || '';
    key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  }

  if (url) {
    url = url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  }
  return { url, key };
}

let supabase: any = null;
let initializedUrl = '';
let initializedKey = '';
let isSupabaseKeyValid = true;

function obterSupabase() {
  const { url, key } = obterCredenciaisSupabase();
  if (!url || !key) {
    supabase = null;
    initializedUrl = '';
    initializedKey = '';
    return null;
  }
  if (!isSupabaseKeyValid) {
    return null;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    supabase = null;
    initializedUrl = '';
    initializedKey = '';
    return null;
  }
  if (supabase && initializedUrl === url && initializedKey === key) {
    return supabase;
  }
  try {
    supabase = createClient(url, key);
    initializedUrl = url;
    initializedKey = key;
    console.log('[Supabase Client] Inicializado dinamicamente com sucesso. URL:', url);
    return supabase;
  } catch (err) {
    console.warn('[Supabase Client] Erro ao inicializar dinamicamente o cliente:', err);
    return null;
  }
}

async function safeUpsert(tableName: string, payload: any): Promise<{ data: any; error: any }> {
  const client = obterSupabase();
  if (!client) return { data: null, error: { message: 'Supabase client not initialized' } };

  let currentPayload = JSON.parse(JSON.stringify(payload));
  let attempts = 0;
  const maxAttempts = 20;
  const pk = tableName === 'policiais' ? 'nick' : 'id';

  while (attempts < maxAttempts) {
    // Strategy 1: Explicit onConflict
    let { data, error } = await client.from(tableName).upsert(currentPayload, { onConflict: pk });
    
    // Strategy 2 fallback: If Strategy 1 fails, try without explicit onConflict (PostgREST auto-resolution on primary key)
    if (error) {
      if (error.message?.includes('Invalid API key') || error.message?.includes('invalid api key') || error.message?.includes('invalid_api_key') || error.code === 'PGRST111') {
        console.error('[Safe Upsert] Invalid API key detected! Suspending Supabase integrations.');
        isSupabaseKeyValid = false;
        return { data: null, error: { message: 'Invalid API key' } };
      }
      console.log(`[Safe Upsert] Conflict resolution fallback for table "${tableName}"...`);
      const fallbackResult = await client.from(tableName).upsert(currentPayload);
      if (!fallbackResult.error) {
        return { data: fallbackResult.data, error: null };
      }
      // Use the fallback error for further processing
      error = fallbackResult.error;
    }

    if (error) {
      if (error.message?.includes('Invalid API key') || error.message?.includes('invalid api key') || error.message?.includes('invalid_api_key') || error.code === 'PGRST111') {
        console.error('[Safe Upsert] Invalid API key detected on fallback! Suspending Supabase integrations.');
        isSupabaseKeyValid = false;
        return { data: null, error: { message: 'Invalid API key' } };
      }
    }

    if (!error) {
      return { data, error: null };
    }

    // Check if error is due to an undefined column (PostgreSQL 42703 or PostgREST schema cache error)
    const errorMsg = error.message || '';
    if (
      error.code === '42703' || 
      (errorMsg.toLowerCase().includes('column') && 
       (errorMsg.toLowerCase().includes('exist') || errorMsg.toLowerCase().includes('schema cache') || errorMsg.toLowerCase().includes('not find')))
    ) {
      const match = 
        errorMsg.match(/column "([^"]+)"/i) || 
        errorMsg.match(/column '([^']+)'/i) || 
        errorMsg.match(/find the '([^']+)' column/i) ||
        errorMsg.match(/column ([a-zA-Z0-9_]+)/i);
        
      if (match && match[1]) {
        const colName = match[1];
        console.log(`[Safe Upsert] Column "${colName}" was omitted from table "${tableName}" payload.`);
        
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

    // Return custom error explanation if tables are missing
    if (error.code === '42P01' || (error.message && error.message.toLowerCase().includes('relation') && error.message.toLowerCase().includes('exist'))) {
      return { data: null, error: { message: `A tabela "${tableName}" não existe no seu Supabase. Por favor, acesse a aba "Banco Supabase" nas Configurações do seu painel e copie o script SQL de instalação para criá-las no editor SQL do seu Supabase.` } };
    }

    // If it's a different error or we couldn't parse the column name, return the error
    return { data, error };
  }

  return { data: null, error: { message: `Failed to upsert after stripping ${attempts} columns.` } };
}

async function garantirAdminsIniciais() {
  const client = obterSupabase();
  if (!client) return;
  console.log('[Server Startup] Ensuring admin accounts exist/are updated in Supabase...');
  
  await safeUpsert('policiais', [{
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

  await safeUpsert('policiais', [{
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
}

// Dynamically run initial check after startup
setTimeout(() => {
  const client = obterSupabase();
  if (client) {
    console.log('[Server Startup] Supabase conectado e ativo com sucesso via variáveis de ambiente/secrets!');
    garantirAdminsIniciais().catch(err => {
      console.warn('[Server Startup] Alerta ao criar administradores iniciais no Supabase:', err.message);
    });
  } else {
    console.log('[Server Startup] Supabase ainda não está configurado. Insira as variáveis SUPABASE_URL e SUPABASE_ANON_KEY no painel de Secrets.');
  }
}, 1000);

// API Routes
app.get('/api/supabase/status', async (req, res) => {
  if (!isSupabaseKeyValid) {
    return res.json({
      configured: false,
      url: initializedUrl || null,
      error: 'Invalid API key'
    });
  }

  const client = obterSupabase();
  if (!client) {
    return res.json({
      configured: false,
      url: null
    });
  }

  // Double check real connection with a lightweight query to avoid false positives if keys are invalid
  try {
    const { error } = await client.from('configuracao_site').select('id').limit(1);
    if (error && (error.message?.includes('Invalid API key') || error.message?.includes('invalid api key') || error.message?.includes('invalid_api_key') || error.code === 'PGRST111')) {
      console.error('[Supabase Status] Invalid API key detected on status query. Disabling integration.');
      isSupabaseKeyValid = false;
      return res.json({
        configured: false,
        url: initializedUrl || null,
        error: 'Invalid API key'
      });
    }
    return res.json({
      configured: true,
      url: initializedUrl || null
    });
  } catch (err: any) {
    if (err.message?.includes('Invalid API key') || err.message?.includes('invalid api key') || err.message?.includes('invalid_api_key')) {
      isSupabaseKeyValid = false;
      return res.json({
        configured: false,
        url: initializedUrl || null,
        error: 'Invalid API key'
      });
    }
    // For other errors, e.g. network timeout or missing table, we can assume it is configured
    return res.json({
      configured: true,
      url: initializedUrl || null
    });
  }
});

app.post('/api/supabase/configure', async (req, res) => {
  const { url, key } = req.body;
  if (!url || !key) {
    return res.status(400).json({ error: 'URL e Key do Supabase são obrigatórios.' });
  }

  try {
    const cleanUrl = url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
    
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return res.status(400).json({ error: 'A URL do Supabase deve ser um link válido começando com http:// ou https://' });
    }
    
    // Write credentials server-side for maximum security and persistence
    fs.writeFileSync(
      path.join(process.cwd(), 'supabase_credentials.json'),
      JSON.stringify({ url: cleanUrl, key }, null, 2),
      'utf8'
    );

    // Reset API key validity state
    isSupabaseKeyValid = true;

    // Force refresh state variables
    initializedUrl = cleanUrl;
    initializedKey = key;
    supabase = createClient(cleanUrl, key);
    console.log('[Server API] Supabase client re-configured and re-initialized successfully.');

    // Seed database admins
    await garantirAdminsIniciais();

    return res.json({ success: true, message: 'Supabase configurado com sucesso!' });
  } catch (err: any) {
    console.error('[Server API] Error configuring Supabase:', err);
    return res.status(500).json({ error: err.message || err });
  }
});

app.post('/api/supabase/upsert', async (req, res) => {
  const client = obterSupabase();
  if (!client) {
    return res.status(500).json({ error: 'Supabase is not configured on the server. Please check your secrets variables.' });
  }

  const { table, payload } = req.body;
  if (!table || !payload) {
    return res.status(400).json({ error: 'Table and payload are required.' });
  }

  // Save/merge local configuration copy to prevent webhook columns from being lost if the Supabase table has not been migrated yet
  if (table === 'configuracao_site') {
    try {
      const configPath = path.join(process.cwd(), 'configuracao_site.json');
      let existing: any = {};
      if (fs.existsSync(configPath)) {
        try {
          existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (e) {
          existing = {};
        }
      }
      const updated = { ...existing, ...payload };
      fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), 'utf8');
      console.log('[Server API] Local copy of configuracao_site saved/merged to disk.');
    } catch (fsErr) {
      console.error('[Server API] Error saving local copy of configuracao_site:', fsErr);
    }
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
  const client = obterSupabase();
  if (!client) {
    return res.status(500).json({ error: 'Supabase is not configured on the server. Please check your secrets variables.' });
  }

  const { table, id, keyCol } = req.body;
  if (!table || id === undefined) {
    return res.status(400).json({ error: 'Table and id are required.' });
  }

  try {
    const colName = keyCol || (table === 'policiais' ? 'nick' : 'id');
    const { error } = await client.from(table).delete().eq(colName, id);
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
    const url = `https://api.habblet.city/player/${encodeURIComponent(username)}`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ error: 'Erro ao conectar com a API do Habblet.' });
    }

    const data = (await response.json()) as {
      id?: number;
      username?: string;
      figure?: string;
      motto?: string;
      regDate?: string;
    };

    if (!data || !data.username) {
      return res.json({ sucesso: false, mensagem: 'Usuário não encontrado no Habblet.' });
    }

    // To ensure the player looks always update dynamically and frequently when they change clothes,
    // we strictly point the imager to their username rather than a static snapshot of their figure code.
    const photoUrl = `https://api.radiohabblet.com.br/imager?user=${encodeURIComponent(data.username)}&gesture=std&direction=3&head_direction=3&headonly=false&size=m`;

    return res.json({
      sucesso: true,
      perfil: {
        id: data.id,
        username: data.username,
        motto: data.motto || '',
        regDate: data.regDate || '',
        photo: photoUrl,
        badges: [] // No badges endpoint on the general player API, but keeping schema intact
      }
    });

  } catch (error: any) {
    console.error('[Server API] Habblet player proxy error:', error);
    return res.status(500).json({ error: error.message || error });
  }
});

app.post('/api/supabase/pull', async (req, res) => {
  const client = obterSupabase();
  if (!client) {
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
      'exoneracoes',
      'solicitacoes_cadastro'
    ];

    const results: Record<string, any> = {};

    for (const table of tables) {
      try {
        const { data, error } = await client.from(table).select('*');
        if (error) {
          if (error.message?.includes('Invalid API key') || error.message?.includes('invalid api key') || error.message?.includes('invalid_api_key') || error.code === 'PGRST111') {
            console.error('[Server API] Invalid API key detected on pull! Suspending Supabase.');
            isSupabaseKeyValid = false;
            return res.status(401).json({ error: 'Invalid API key' });
          }
          console.warn(`[Server API] Table ${table} select warning:`, error.message);
          results[table] = null;
        } else {
          results[table] = data || [];
        }
      } catch (tblErr: any) {
        if (tblErr.message?.includes('Invalid API key') || tblErr.message?.includes('invalid api key')) {
          isSupabaseKeyValid = false;
          return res.status(401).json({ error: 'Invalid API key' });
        }
        console.error(`Error loading table ${table}:`, tblErr);
        results[table] = null;
      }
    }

    // Merge with local server-side config to preserve webhooks in case they were stripped by safeUpsert
    try {
      const configPath = path.join(process.cwd(), 'configuracao_site.json');
      if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, 'utf8');
        const localConfig = JSON.parse(fileContent);
        if (results['configuracao_site'] && results['configuracao_site'].length > 0) {
          const dbConfig = results['configuracao_site'][0] || {};
          const merged: any = { ...localConfig };
          for (const key of Object.keys(dbConfig)) {
            // Only overwrite if the database value is actually provided (not null, not undefined, and not empty string)
            if (dbConfig[key] !== null && dbConfig[key] !== undefined && dbConfig[key] !== '') {
              merged[key] = dbConfig[key];
            }
          }
          results['configuracao_site'][0] = merged;
          console.log('[Server API] Merged local config into configuracao_site pull results safely.');
        } else {
          results['configuracao_site'] = [localConfig];
        }
      }
    } catch (fsErr) {
      console.error('[Server API] Error merging local config copy in pull:', fsErr);
    }

    return res.json({ success: true, data: results });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
});

app.post('/api/supabase/push', async (req, res) => {
  const client = obterSupabase();
  if (!client) {
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
    if (data.solicitacoes_cadastro) await syncTable('solicitacoes_cadastro', data.solicitacoes_cadastro);

    return res.json({ success: true, log: responseLog });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
});

app.post('/api/supabase/wipe', async (req, res) => {
  const client = obterSupabase();
  if (!client) {
    return res.status(500).json({ error: 'Supabase is not configured on the server.' });
  }

  try {
    const pKeyTables = [
      { name: 'solicitacoes_cadastro', pk: 'id' },
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
      await client.from(t.name).delete().neq(t.pk, 'DUMMY_NONE_EXISTENT_ID');
    }

    // Now wipe 'policiais' table (has 'nick' primary key)
    await client.from('policiais').delete().neq('nick', 'DUMMY_NONE_EXISTENT_NICK');

    // Re-insert initial 'configuracao_site'
    await client.from('configuracao_site').upsert([{
      id: 'config_principal',
      nome_site: 'POLÍCIA CIA',
      subtitulo_site: 'Mesa de Operações Integradas • Brasília/DF',
      logo_texto: 'CIA',
      login_mensagem: 'Acesso exclusivo para policiais e oficiais autorizados.'
    }]);

    // Re-insert default 'policiais' row for admin
    await client.from('policiais').upsert([{
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
    await client.from('policiais').upsert([{
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

// Helper for sending DB backups to Discord Webhook
async function realizarBackupESendDiscord(force = false): Promise<{ sucesso: boolean; mensagem: string }> {
  const client = obterSupabase();
  if (!client) {
    const msg = 'Supabase não está configurado para backup remoto.';
    console.log(`[Backup] ${msg}`);
    return { sucesso: true, mensagem: msg };
  }

  try {
    // 1. Obter configuracao_site para ver o webhook de backup e o ultimo backup
    let configData: any = null;
    let configError: any = null;

    const { data, error } = await client
      .from('configuracao_site')
      .select('*')
      .eq('id', 'config_principal')
      .maybeSingle();

    configData = data;
    configError = error;

    // Load local configuration copy from disk to fallback for any unmigrated columns (like webhook_backup)
    let localConfig: any = null;
    try {
      const configPath = path.join(process.cwd(), 'configuracao_site.json');
      if (fs.existsSync(configPath)) {
        localConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('[Backup] Local copy of configuracao_site loaded from disk.');
      }
    } catch (fsErr) {
      console.error('[Backup] Error loading local config copy:', fsErr);
    }

    if (localConfig) {
      configData = { ...localConfig, ...configData };
    }

    if (configError && !localConfig) {
      if (configError.message?.includes('Invalid API key') || configError.message?.includes('invalid api key') || configError.message?.includes('invalid_api_key') || configError.code === 'PGRST111') {
        console.error('[Backup] Invalid API key detected on backup. Suspending Supabase.');
        isSupabaseKeyValid = false;
      }
      const msg = `Erro ao carregar configurações do site: ${configError.message}`;
      console.error(`[Backup] ${msg}`);
      return { sucesso: false, mensagem: msg };
    }

    if (!configData) {
      const msg = 'Nenhuma configuração principal encontrada no Supabase.';
      console.log(`[Backup] ${msg}`);
      return { sucesso: true, mensagem: msg };
    }

    const webhookBackup = configData.webhook_backup;
    if (!webhookBackup) {
      const msg = 'Webhook de backup não configurado nas configurações do site.';
      console.log(`[Backup] ${msg}`);
      return { sucesso: true, mensagem: msg };
    }

    // Verificar se ja passaram 7 horas se não for forçado
    if (!force) {
      const ultimoBackupStr = configData.ultimo_backup;
      if (ultimoBackupStr) {
        const ultimoBackupDate = new Date(ultimoBackupStr);
        const diffMs = Date.now() - ultimoBackupDate.getTime();
        const seteHorasMs = 7 * 60 * 60 * 1000;
        if (diffMs < seteHorasMs) {
          const proximoBackupEmSec = Math.ceil((seteHorasMs - diffMs) / 1000);
          console.log(`[Backup] Ainda não se passaram 7 horas do último backup. Faltam ~${(proximoBackupEmSec / 3600).toFixed(1)} horas.`);
          return { sucesso: false, mensagem: 'Ainda não passou o intervalo de 7 horas.' };
        }
      }
    }

    console.log('[Backup] Iniciando coleta de dados de todas as tabelas...');

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
      'exoneracoes',
      'solicitacoes_cadastro'
    ];

    const backupData: Record<string, any> = {};
    for (const table of tables) {
      const { data, error } = await client.from(table).select('*');
      if (error) {
        console.warn(`[Backup] Falha ao ler tabela ${table}, continuando mesmo assim.`, error.message);
        backupData[table] = [];
      } else {
        backupData[table] = data || [];
      }
    }

    const timestampStr = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
    const filename = `backup_policia_cia_${timestampStr}.json`;
    const jsonContent = JSON.stringify(backupData, null, 2);

    console.log(`[Backup] Enviando arquivo ${filename} para o webhook do Discord...`);

    const formData = new FormData();
    const payload = {
      embeds: [{
        title: '📦 BACKUP AUTOMÁTICO DO SITE • POLÍCIA CIA',
        description: 'O backup completo do banco de dados do Supabase foi gerado e enviado com sucesso.',
        color: 0xD97706, // Amber-500
        fields: [
          { name: 'Data/Hora (Servidor)', value: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }), inline: true },
          { name: 'Tamanho', value: `${(jsonContent.length / 1024).toFixed(2)} KB`, inline: true },
          { name: 'Status', value: '🟢 Seguro & Concluído', inline: true }
        ],
        footer: { text: 'Sistema de Backups de 7 em 7 horas • Mesa de Operações' }
      }]
    };

    formData.append('payload_json', JSON.stringify(payload));
    
    // Cross-version Node.js compatible file attachment
    if (typeof File !== 'undefined') {
      const fileObj = new File([jsonContent], filename, { type: 'application/json' });
      formData.append('files[0]', fileObj);
    } else {
      const fileBlob = new Blob([jsonContent], { type: 'application/json' });
      formData.append('files[0]', fileBlob, filename);
    }

    const discordResponse = await fetch(webhookBackup, {
      method: 'POST',
      body: formData
    });

    if (!discordResponse.ok) {
      const responseText = await discordResponse.text();
      const msg = `O Discord retornou erro ao receber o backup: ${responseText}`;
      console.error(`[Backup] ${msg}`);
      return { sucesso: false, mensagem: msg };
    }

    console.log('[Backup] Backup enviado ao Discord com sucesso!');

    // Atualizar ultimo_backup na configuracao
    const agoraIso = new Date().toISOString();
    
    // Update local configuration copy on disk
    try {
      const configPath = path.join(process.cwd(), 'configuracao_site.json');
      let localConfig: any = {};
      if (fs.existsSync(configPath)) {
        localConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
      localConfig.ultimo_backup = agoraIso;
      fs.writeFileSync(configPath, JSON.stringify(localConfig, null, 2), 'utf8');
      console.log('[Backup] Local copy of configuracao_site updated with ultimo_backup.');
    } catch (fsErr) {
      console.error('[Backup] Error updating local copy with ultimo_backup:', fsErr);
    }

    const { error: updateError } = await client
      .from('configuracao_site')
      .update({ ultimo_backup: agoraIso })
      .eq('id', 'config_principal');

    if (updateError) {
      console.log('[Backup] Skipping update of last backup timestamp.');
    }

    return { 
      sucesso: true, 
      mensagem: `Backup enviado com sucesso! (${(jsonContent.length / 1024).toFixed(2)} KB)` 
    };

  } catch (err: any) {
    const msg = `Falha crítica durante backup: ${err.message || err}`;
    console.error(`[Backup] ${msg}`);
    return { sucesso: false, mensagem: msg };
  }
}

// Endpoint to trigger/test the backup manually from the settings tab
app.post('/api/backup/trigger', async (req, res) => {
  const { force } = req.body;
  const result = await realizarBackupESendDiscord(!!force);
  if (result.sucesso) {
    return res.json({ sucesso: true, mensagem: result.mensagem });
  } else {
    return res.status(500).json({ sucesso: false, mensagem: result.mensagem });
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

startServer();
