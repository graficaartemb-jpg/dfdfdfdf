import express from 'express';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();

app.use(express.json({ limit: '50mb' }));

// Helper to load Supabase credentials dynamically (env variables with local file backup)
function obterCredenciaisSupabase() {
  let url = '';
  let key = '';

  // 1. Prefer user configuration from UI if it exists (apenas fora da Vercel,
  // cujo sistema de arquivos das Functions é somente-leitura e nunca terá esse arquivo)
  if (!process.env.VERCEL) {
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
  }

  // 2. Fallback to env variables (supports standard SUPABASE_URL & SUPABASE_ANON_KEY without VITE)
  if (!url || !key) {
    url = process.env.SUPABASE_URL ||
          process.env.NEXT_PUBLIC_SUPABASE_URL ||
          process.env.VITE_SUPABASE_URL ||
          '';

    key = process.env.SUPABASE_ANON_KEY ||
          process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.SUPABASE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          process.env.VITE_SUPABASE_ANON_KEY ||
          '';
  }

  if (url) {
    url = url.trim().replace(/^["']|["']$/g, '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  }
  if (key) {
    key = key.trim().replace(/^["']|["']$/g, '');
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
    let { data, error } = await client.from(tableName).upsert(currentPayload, { onConflict: pk });

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

    const errorMsg = error.message || '';
    if (
      error.code === '42703' || 
      error.code === 'PGRST204' || 
      error.code === 'PGRST100' ||
      (errorMsg.toLowerCase().includes('column') && 
       (errorMsg.toLowerCase().includes('exist') || errorMsg.toLowerCase().includes('schema cache') || errorMsg.toLowerCase().includes('not find') || errorMsg.toLowerCase().includes('find the')))
    ) {
      const match = 
        errorMsg.match(/find the '([^']+)' column/i) ||
        errorMsg.match(/'([^']+)' column/i) ||
        errorMsg.match(/column "([^"]+)"/i) || 
        errorMsg.match(/column '([^']+)' (?:does not exist|not found)/i) || 
        errorMsg.match(/column [a-zA-Z0-9_]+\.([a-zA-Z0-9_]+)/i) ||
        errorMsg.match(/column ([a-zA-Z0-9_]+)/i);

      if (match) {
        let colName = match[1] || match[2];
        if (colName && colName.includes('.')) colName = colName.split('.').pop()!;

        if (colName && colName !== tableName) {
          console.log(`[Safe Upsert] Column "${colName}" was omitted from table "${tableName}" payload.`);

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
    }

    // Foreign key constraint violation auto-resolution (23503)
    if (error.code === '23503' || errorMsg.toLowerCase().includes('foreign key')) {
      console.log(`[Safe Upsert] Foreign key constraint violation on table "${tableName}". Ensuring referenced parent category...`);
      const items = Array.isArray(currentPayload) ? currentPayload : [currentPayload];
      for (const item of items) {
        if (item && typeof item === 'object' && item.categoria_id) {
          try {
            await client.from('categorias').upsert({
              id: item.categoria_id,
              nome: 'Setor Administrativo',
              subtitulo: null,
              ordem: 0
            });
          } catch (e) {
            console.warn('[Safe Upsert] Auto-creation of parent category failed:', e);
          }
        }
      }
      attempts++;
      continue;
    }

    if (error.code === '42P01' || (error.message && error.message.toLowerCase().includes('relation') && error.message.toLowerCase().includes('exist'))) {
      return { data: null, error: { message: `A tabela "${tableName}" não existe no seu Supabase. Por favor, acesse a aba "Banco Supabase" nas Configurações do seu painel e copie o script SQL de instalação para criá-las no editor SQL do seu Supabase.` } };
    }

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
    pontos_promocao: 0,
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

// API Routes
app.get('/api/supabase/status', async (req, res) => {
  isSupabaseKeyValid = true;

  const { url } = obterCredenciaisSupabase();
  const client = obterSupabase();
  if (!client || !url) {
    return res.json({
      configured: false,
      url: null,
      message: 'Credenciais do Supabase não encontradas no servidor.'
    });
  }

  try {
    const { error } = await client.from('configuracao_site').select('id').limit(1);
    if (error && (
      error.message?.toLowerCase().includes('invalid api key') || 
      error.message?.toLowerCase().includes('invalid_api_key') || 
      error.code === 'PGRST111'
    )) {
      console.error('[Supabase Status] Invalid API key detected on status query.');
      isSupabaseKeyValid = false;
      return res.json({
        configured: false,
        url: url || null,
        error: 'Chave API Inválida no Supabase'
      });
    }

    return res.json({
      configured: true,
      url: url || null
    });
  } catch (err: any) {
    if (err.message?.toLowerCase().includes('invalid api key')) {
      isSupabaseKeyValid = false;
      return res.json({
        configured: false,
        url: url || null,
        error: 'Chave API Inválida no Supabase'
      });
    }
    return res.json({
      configured: true,
      url: url || null
    });
  }
});

app.all('/api/supabase/pull', async (req, res) => {
  const client = obterSupabase();
  if (!client) {
    return res.status(500).json({ error: 'Supabase não está configurado no servidor.' });
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
      'solicitacoes_cadastro',
      'posts_abas_customizadas',
      'apostilas'
    ];

    const results: Record<string, any[]> = {};

    for (const table of tables) {
      const { data, error } = await client.from(table).select('*');
      if (error) {
        if (error.code === '42P01' || (error.message && error.message.toLowerCase().includes('relation') && error.message.toLowerCase().includes('exist'))) {
          results[table] = [];
          continue;
        }
        if (error.message?.includes('Invalid API key') || error.message?.includes('invalid api key') || error.message?.includes('invalid_api_key') || error.code === 'PGRST111') {
          console.error(`[Server API] Invalid API key on table ${table}. Suspending Supabase.`);
          isSupabaseKeyValid = false;
          return res.status(401).json({ error: 'Chave API Inválida no Supabase' });
        }
        console.warn(`[Server API] Warning fetching table ${table}:`, error.message);
        results[table] = [];
      } else {
        results[table] = data || [];
      }
    }

    if (!process.env.VERCEL) {
      try {
        const configPath = path.join(process.cwd(), 'configuracao_site.json');
        if (fs.existsSync(configPath)) {
          const localConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (results['configuracao_site'] && results['configuracao_site'].length > 0) {
            const remoteConfig = results['configuracao_site'][0];
            const merged = { ...remoteConfig };
            for (const key in localConfig) {
              if (remoteConfig[key] === undefined || remoteConfig[key] === null) {
                merged[key] = localConfig[key];
              }
            }
            results['configuracao_site'][0] = merged;
          } else {
            results['configuracao_site'] = [localConfig];
          }
        }
      } catch (fsErr) {
        console.error('[Server API] Error merging local config copy in pull:', fsErr);
      }
    }

    return res.json({ success: true, data: results });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
});

app.post('/api/supabase/upsert', async (req, res) => {
  const client = obterSupabase();
  if (!client) {
    return res.status(500).json({ error: 'Supabase não está configurado no servidor.' });
  }

  const { table, payload } = req.body;
  if (!table || !payload) {
    return res.status(400).json({ error: 'Table and payload are required.' });
  }

  try {
    const { data, error } = await safeUpsert(table, payload);
    if (error) {
      console.error(`[Server API] Upsert error in ${table}:`, error);
      return res.status(500).json({ error: error.message || error });
    }
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
});

app.post('/api/supabase/delete', async (req, res) => {
  const client = obterSupabase();
  if (!client) {
    return res.status(500).json({ error: 'Supabase não está configurado no servidor.' });
  }

  const { table, id, keyCol } = req.body;
  if (!table || id === undefined) {
    return res.status(400).json({ error: 'Table and id are required.' });
  }

  try {
    const pk = keyCol || (table === 'policiais' ? 'nick' : 'id');
    const { error } = await client.from(table).delete().eq(pk, id);
    if (error) {
      console.warn(`[Server API] Delete warning in ${table}:`, error.message || error);
      return res.json({ success: true, warning: error.message || error });
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.json({ success: true, warning: err.message || err });
  }
});

app.post('/api/supabase/push', async (req, res) => {
  const client = obterSupabase();
  if (!client) {
    return res.status(500).json({ error: 'Supabase não está configurado no servidor.' });
  }

  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: 'Data block is required.' });
  }

  try {
    const responseLog: Record<string, string> = {};

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

    if (data.configuracao_site) await syncTable('configuracao_site', data.configuracao_site);
    if (data.categorias) await syncTable('categorias', data.categorias);
    if (data.patentes) await syncTable('patentes', data.patentes);
    if (data.policiais) await syncTable('policiais', data.policiais);
    if (data.avisos) await syncTable('avisos', data.avisos);
    if (data.testes) await syncTable('testes', data.testes);
    if (data.movimentacoes) await syncTable('movimentacoes', data.movimentacoes);
    if (data.grupos) await syncTable('grupos', data.grupos);
    if (data.treinamentos) await syncTable('treinamentos', data.treinamentos);
    if (data.aplicacoes_treinamentos) await syncTable('aplicacoes_treinamentos', data.aplicacoes_treinamentos);
    if (data.xp_enviados) await syncTable('xp_enviados', data.xp_enviados);
    if (data.advertencias) await syncTable('advertencias', data.advertencias);
    if (data.exoneracoes) await syncTable('exoneracoes', data.exoneracoes);
    if (data.solicitacoes_cadastro) await syncTable('solicitacoes_cadastro', data.solicitacoes_cadastro);
    if (data.posts_abas_customizadas) await syncTable('posts_abas_customizadas', data.posts_abas_customizadas);
    if (data.apostilas) await syncTable('apostilas', data.apostilas);

    return res.json({ success: true, log: responseLog });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || err });
  }
});

app.post('/api/supabase/wipe', async (req, res) => {
  const client = obterSupabase();
  if (!client) {
    return res.status(500).json({ error: 'Supabase não está configurado no servidor.' });
  }

  try {
    const pKeyTables = [
      { name: 'posts_abas_customizadas', pk: 'id' },
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

    for (const t of pKeyTables) {
      await client.from(t.name).delete().neq(t.pk, 'DUMMY_NONE_EXISTENT_ID');
    }

    await client.from('policiais').delete().neq('nick', 'DUMMY_NONE_EXISTENT_NICK');

    await client.from('configuracao_site').upsert([{
      id: 'config_principal',
      nome_site: 'POLÍCIA CIA',
      subtitulo_site: 'Mesa de Operações Integradas • Brasília/DF',
      logo_texto: 'CIA',
      login_mensagem: 'Acesso exclusivo para policiais e oficiais autorizados.'
    }]);

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

async function realizarBackupESendDiscord(force = false): Promise<{ sucesso: boolean; mensagem: string }> {
  const client = obterSupabase();
  if (!client) {
    const msg = 'Supabase não está configurado para backup remoto.';
    console.log(`[Backup] ${msg}`);
    return { sucesso: true, mensagem: msg };
  }

  try {
    let configData: any = null;
    let configError: any = null;

    const { data, error } = await client
      .from('configuracao_site')
      .select('*')
      .eq('id', 'config_principal')
      .maybeSingle();

    configData = data;
    configError = error;

    let localConfig: any = null;
    try {
      const configPath = path.join(process.cwd(), 'configuracao_site.json');
      if (fs.existsSync(configPath)) {
        localConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
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

    if (!force) {
      const ultimoBackupStr = configData.ultimo_backup;
      if (ultimoBackupStr) {
        const ultimoBackupDate = new Date(ultimoBackupStr);
        const diffMs = Date.now() - ultimoBackupDate.getTime();
        const seteHorasMs = 7 * 60 * 60 * 1000;
        if (diffMs < seteHorasMs) {
          const proximoBackupEmSec = Math.ceil((seteHorasMs - diffMs) / 1000);
          console.log(`[Backup] Ainda não se passaram 7 horas do último backup.`);
          return { sucesso: false, mensagem: 'Ainda não passou o intervalo de 7 horas.' };
        }
      }
    }

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
      'solicitacoes_cadastro',
      'posts_abas_customizadas'
    ];

    const backupData: Record<string, any> = {};
    for (const table of tables) {
      const { data, error } = await client.from(table).select('*');
      if (error) {
        backupData[table] = [];
      } else {
        backupData[table] = data || [];
      }
    }

    const timestampStr = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
    const filename = `backup_policia_cia_${timestampStr}.json`;
    const jsonContent = JSON.stringify(backupData, null, 2);

    const formData = new FormData();
    const payload = {
      embeds: [{
        title: '📦 BACKUP AUTOMÁTICO DO SITE • POLÍCIA CIA',
        description: 'O backup completo do banco de dados do Supabase foi gerado e enviado com sucesso.',
        color: 0xD97706,
        fields: [
          { name: 'Data/Hora (Servidor)', value: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }), inline: true },
          { name: 'Tamanho', value: `${(jsonContent.length / 1024).toFixed(2)} KB`, inline: true },
          { name: 'Status', value: '🟢 Seguro & Concluído', inline: true }
        ],
        footer: { text: 'Sistema de Backups de 7 em 7 horas • Mesa de Operações' }
      }]
    };

    formData.append('payload_json', JSON.stringify(payload));

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
      return { sucesso: false, mensagem: `O Discord retornou erro: ${responseText}` };
    }

    const agoraIso = new Date().toISOString();

    if (!process.env.VERCEL) {
      try {
        const configPath = path.join(process.cwd(), 'configuracao_site.json');
        let localConfig: any = {};
        if (fs.existsSync(configPath)) {
          localConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        localConfig.ultimo_backup = agoraIso;
        fs.writeFileSync(configPath, JSON.stringify(localConfig, null, 2), 'utf8');
      } catch (fsErr) {
        console.error('[Backup] Error updating local copy with ultimo_backup:', fsErr);
      }
    }

    await client.from('configuracao_site').update({ ultimo_backup: agoraIso }).eq('id', 'config_principal');

    return { 
      sucesso: true, 
      mensagem: `Backup enviado com sucesso! (${(jsonContent.length / 1024).toFixed(2)} KB)` 
    };

  } catch (err: any) {
    return { sucesso: false, mensagem: `Falha crítica durante backup: ${err.message || err}` };
  }
}

app.post('/api/backup/trigger', async (req, res) => {
  const { force } = req.body;
  const result = await realizarBackupESendDiscord(!!force);
  if (result.sucesso) {
    return res.json({ sucesso: true, mensagem: result.mensagem });
  } else {
    return res.status(500).json({ sucesso: false, mensagem: result.mensagem });
  }
});

export { realizarBackupESendDiscord, garantirAdminsIniciais, obterSupabase };
export default app;
