import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Policial, RecrutaTeste, EnvioXP, ConfiguracaoSite, Apostila } from '../types';
import { criptografarTexto } from './db';

const CHAVE_CONFIGURACAO_SITE = 'cia_configuracao_site';
const CHAVE_POLICIAIS = 'cia_policiais';
const CHAVE_AVISOS = 'cia_avisos';
const CHAVE_TESTES = 'cia_testes';
const CHAVE_MOVIMENTACOES = 'cia_movimentacoes';
const CHAVE_CATEGORIAS = 'cia_categorias';
const CHAVE_PATENTES = 'cia_patentes';
const CHAVE_GRUPOS = 'cia_grupos';
const CHAVE_TREINAMENTOS = 'cia_treinamentos';
const CHAVE_APLICACOES_TREINAMENTOS = 'cia_aplicacoes_treinamentos';
const CHAVE_XP_ENVIADOS = 'cia_xp_enviados';
const CHAVE_ADVERTENCIAS = 'cia_advertencias';
const CHAVE_EXONERACOES = 'cia_exoneracoes';
const CHAVE_APOSTILAS = 'cia_apostilas';

export function getSupabaseCredentials() {
  const metaEnv = (import.meta as any).env || {};
  const processEnv = typeof process !== 'undefined' && process.env ? process.env : {};

  const url =
    metaEnv.VITE_SUPABASE_URL ||
    metaEnv.SUPABASE_URL ||
    processEnv.VITE_SUPABASE_URL ||
    processEnv.SUPABASE_URL ||
    localStorage.getItem('cia_supabase_url') ||
    '';

  const key =
    metaEnv.VITE_SUPABASE_ANON_KEY ||
    metaEnv.SUPABASE_ANON_KEY ||
    processEnv.VITE_SUPABASE_ANON_KEY ||
    processEnv.SUPABASE_ANON_KEY ||
    localStorage.getItem('cia_supabase_key') ||
    '';

  return { url, key };
}

export function salvarCredenciaisSupabaseManual(url: string, key: string) {
  if (url) {
    localStorage.setItem('cia_supabase_url', url.trim());
  } else {
    localStorage.removeItem('cia_supabase_url');
  }
  if (key) {
    localStorage.setItem('cia_supabase_key', key.trim());
  } else {
    localStorage.removeItem('cia_supabase_key');
  }
  cachedDirectClient = null;
}

let cachedDirectClient: SupabaseClient | null = null;

export function obterClienteDirectoSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  if (url && key) {
    if (!cachedDirectClient || (cachedDirectClient as any).supabaseUrl !== url) {
      cachedDirectClient = createClient(url, key);
    }
    return cachedDirectClient;
  }
  return null;
}

// Securely check if connected to Supabase
export async function testarConexaoSupabase(url?: string, key?: string): Promise<boolean> {
  const creds = getSupabaseCredentials();
  const targetUrl = url || creds.url;
  const targetKey = key || creds.key;

  if (targetUrl && targetKey) {
    try {
      const client = createClient(targetUrl, targetKey);
      const { error } = await client.from('configuracao_site').select('id').limit(1);

      if (!error) return true;

      // If the error is table missing or empty schema (e.g. user dropped tables or hasn't run SQL script),
      // the Supabase URL and Key are VALID and connected!
      if (
        error.code === 'PGRST204' ||
        error.code === '42P01' ||
        (error as any).status === 404 ||
        (error.message && (
          error.message.includes('relation') ||
          error.message.includes('does not exist') ||
          error.message.includes('find the table') ||
          error.message.includes('schema')
        ))
      ) {
        return true;
      }

      // Secondary check: auth session response without auth error
      const authRes = await client.auth.getSession();
      if (!authRes.error) return true;

      console.warn('Direct Supabase test error:', error);
    } catch (e) {
      console.warn('Direct Supabase exception:', e);
    }
  }

  // Fallback for AI Studio server proxy environment
  try {
    const response = await fetch('/api/supabase/status');
    if (response.ok) {
      const data = await response.json();
      return !!data.configured;
    }
  } catch (e) {
    // ignore
  }

  return false;
}

// Client-side safe upsert function that handles missing columns and FK constraints dynamically
export async function safeUpsertClient(client: SupabaseClient, tableName: string, payload: any): Promise<{ data: any; error: any }> {
  let currentPayload = JSON.parse(JSON.stringify(payload));
  let attempts = 0;
  const maxAttempts = 20;
  const pk = tableName === 'policiais' ? 'nick' : 'id';

  while (attempts < maxAttempts) {
    let { data, error } = await client.from(tableName).upsert(currentPayload, { onConflict: pk });

    if (error) {
      const fallbackResult = await client.from(tableName).upsert(currentPayload);
      if (!fallbackResult.error) {
        return { data: fallbackResult.data, error: null };
      }
      error = fallbackResult.error;
    }

    if (!error) {
      return { data, error: null };
    }

    const errorMsg = error.message || '';

    // Missing column in user's Supabase schema (42703 / PostgREST)
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
          console.log(`[Client Safe Upsert] Omitting column "${colName}" from table "${tableName}" payload...`);

          if (Array.isArray(currentPayload)) {
            currentPayload = currentPayload.map((item: any) => {
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

    // Foreign key violation (23503)
    if (error.code === '23503' || errorMsg.toLowerCase().includes('foreign key')) {
      console.log(`[Client Safe Upsert] FK violation on "${tableName}". Ensuring parent category exists...`);
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
            console.warn('[Client Safe Upsert] Auto category creation failed:', e);
          }
        }
      }
      attempts++;
      continue;
    }

    return { data, error };
  }

  return { data: null, error: { message: `Failed to upsert after ${attempts} attempts.` } };
}

// Client provider supporting both direct client-side requests (Vercel) and server proxy fallback (AI Studio)
export function obterSupabaseClient() {
  const direct = obterClienteDirectoSupabase();
  if (direct) {
    return {
      from: (table: string) => ({
        select: (cols: string = '*') => direct.from(table).select(cols),
        upsert: (payload: any) => safeUpsertClient(direct, table, payload),
        delete: () => direct.from(table).delete()
      })
    };
  }

  return {
    from: (table: string) => ({
      select: (cols: string = '*') => ({
        limit: () => ({ error: null, data: [] }),
        eq: () => ({ error: null, data: [] })
      }),
      upsert: async (payload: any) => {
        try {
          const response = await fetch('/api/supabase/upsert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table, payload })
          });
          const res = await response.json();
          if (!response.ok) {
            return { data: null, error: { message: res.error || 'Server error' } };
          }
          return { data: res.data, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err.message || err } };
        }
      },
      delete: () => ({
        eq: async (col: string, val: any) => {
          try {
            const response = await fetch('/api/supabase/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ table, id: val, keyCol: col })
            });
            const res = await response.json();
            if (!response.ok) {
              return { error: { message: res.error || 'Server error' } };
            }
            return { error: null };
          } catch (err: any) {
            return { error: { message: err.message || err } };
          }
        }
      })
    })
  };
}

export function obterClienteSupabase() {
  return obterSupabaseClient();
}

export const SQL_SCRIPT_GERAL = `-- SCRIPT SQL PARA CRIAR TODAS AS TABELAS NO SUPABASE
-- Copie e cole este script no SQL Editor do seu projeto Supabase e clique em RUN.

CREATE TABLE IF NOT EXISTS configuracao_site (
  id VARCHAR PRIMARY KEY DEFAULT 'config_principal',
  nome_site VARCHAR DEFAULT 'POLÍCIA CIA',
  subtitulo_site VARCHAR DEFAULT 'Mesa de Operações Integradas • Brasília/DF',
  logo_texto VARCHAR DEFAULT 'CIA',
  logo_url VARCHAR,
  login_mensagem VARCHAR DEFAULT 'Acesso exclusivo para policiais e oficiais autorizados.',
  cargos_permissoes JSONB DEFAULT '{}',
  webhook_discord VARCHAR,
  cor_tema VARCHAR,
  login_background_url VARCHAR,
  link_suporte VARCHAR,
  link_discord VARCHAR,
  webhook_avisos VARCHAR,
  webhook_movimentacoes VARCHAR,
  webhook_advertencias VARCHAR,
  webhook_exoneracoes VARCHAR,
  webhook_discord_entradas VARCHAR,
  webhook_backup VARCHAR,
  ultimo_backup VARCHAR,
  abas_customizadas JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS policiais (
  nick VARCHAR PRIMARY KEY,
  cargo VARCHAR,
  categoria_id VARCHAR,
  data_registro VARCHAR,
  avatar_habbo VARCHAR,
  pontos_promocao INTEGER DEFAULT 0,
  presencas INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  biografia VARCHAR,
  promovido_por VARCHAR,
  ultimas_presencas JSONB DEFAULT '[]',
  medalhas JSONB DEFAULT '[]',
  senha_hex VARCHAR,
  foto_url VARCHAR
);

CREATE TABLE IF NOT EXISTS avisos (
  id VARCHAR PRIMARY KEY,
  titulo VARCHAR,
  conteudo TEXT,
  autor VARCHAR,
  data VARCHAR,
  tipo VARCHAR DEFAULT 'geral',
  image_url VARCHAR,
  cor_fundo VARCHAR DEFAULT 'default',
  negrito BOOLEAN DEFAULT false,
  italico BOOLEAN DEFAULT false,
  marcar_everyone BOOLEAN DEFAULT false,
  posicao_imagem VARCHAR DEFAULT 'topo',
  imagem_fundo_url VARCHAR,
  template_noticia VARCHAR DEFAULT 'padrao'
);

CREATE TABLE IF NOT EXISTS testes (
  id VARCHAR PRIMARY KEY,
  nick_recruta VARCHAR,
  reprovado BOOLEAN DEFAULT false,
  motivo_reprovacao VARCHAR,
  respostas JSONB DEFAULT '[]',
  examinador VARCHAR,
  data VARCHAR
);

CREATE TABLE IF NOT EXISTS movimentacoes (
  id VARCHAR PRIMARY KEY,
  nick_policial VARCHAR,
  tipo VARCHAR,
  cargo_anterior VARCHAR,
  cargo_novo VARCHAR,
  motivo VARCHAR,
  autor VARCHAR,
  data VARCHAR
);

CREATE TABLE IF NOT EXISTS categorias (
  id VARCHAR PRIMARY KEY,
  nome VARCHAR,
  subtitulo VARCHAR,
  ordem INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS patentes (
  id VARCHAR PRIMARY KEY,
  categoria_id VARCHAR,
  nome VARCHAR,
  ordem INTEGER DEFAULT 0,
  equivalente VARCHAR,
  salario VARCHAR,
  insignia VARCHAR,
  responsabilidade VARCHAR
);

CREATE TABLE IF NOT EXISTS grupos (
  id VARCHAR PRIMARY KEY,
  nome VARCHAR,
  sigla VARCHAR,
  descricao VARCHAR,
  url_imagem VARCHAR,
  publico BOOLEAN DEFAULT true,
  verificado BOOLEAN DEFAULT false,
  aceita_membros BOOLEAN DEFAULT true,
  membros JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS treinamentos (
  id VARCHAR PRIMARY KEY,
  titulo VARCHAR,
  status VARCHAR,
  descricao VARCHAR,
  conteudo TEXT,
  cargo_vinculavel VARCHAR,
  patente_vinculavel_id VARCHAR,
  permissoes_cargos JSONB DEFAULT '[]',
  permissoes_avaliadores JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS aplicacoes_treinamentos (
  id VARCHAR PRIMARY KEY,
  treinamento_id VARCHAR,
  instrutor VARCHAR,
  data VARCHAR,
  alunos JSONB DEFAULT '[]',
  observacoes TEXT,
  status_aprovacao VARCHAR DEFAULT 'aprovado',
  avaliador VARCHAR,
  data_avaliacao VARCHAR,
  motivo_avaliacao VARCHAR
);

CREATE TABLE IF NOT EXISTS xp_enviados (
  id VARCHAR PRIMARY KEY,
  motivo VARCHAR,
  valor INTEGER DEFAULT 0,
  destinatarios JSONB DEFAULT '[]',
  enviado_por VARCHAR,
  data VARCHAR
);

CREATE TABLE IF NOT EXISTS advertencias (
  id VARCHAR PRIMARY KEY,
  nick_policial VARCHAR,
  quantidade INTEGER DEFAULT 1,
  prazo_vencimento VARCHAR,
  motivo VARCHAR,
  autor VARCHAR,
  data VARCHAR,
  ativa BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS exoneracoes (
  id VARCHAR PRIMARY KEY,
  nick_policial VARCHAR,
  motivo VARCHAR,
  autor VARCHAR,
  data VARCHAR,
  tipo VARCHAR DEFAULT 'exoneracao'
);

CREATE TABLE IF NOT EXISTS solicitacoes_cadastro (
  id VARCHAR PRIMARY KEY,
  nick VARCHAR,
  senha_hex VARCHAR,
  avatar_habbo VARCHAR,
  data_solicitacao VARCHAR,
  ip VARCHAR,
  cidade VARCHAR,
  foto_url VARCHAR,
  status VARCHAR DEFAULT 'pendente',
  avaliador_nick VARCHAR,
  data_avaliacao VARCHAR
);

CREATE TABLE IF NOT EXISTS posts_abas_customizadas (
  id VARCHAR PRIMARY KEY,
  aba_id VARCHAR,
  titulo VARCHAR,
  conteudo TEXT,
  autor VARCHAR,
  data VARCHAR,
  file_url VARCHAR,
  tipo VARCHAR DEFAULT 'documento'
);

CREATE TABLE IF NOT EXISTS apostilas (
  id VARCHAR PRIMARY KEY,
  titulo VARCHAR,
  descricao TEXT,
  partes JSONB DEFAULT '[]',
  criado_por VARCHAR,
  data_criacao VARCHAR
);

-- Desativar Row Level Security (RLS) para permitir acesso anônimo sem erros de permissão
ALTER TABLE configuracao_site DISABLE ROW LEVEL SECURITY;
ALTER TABLE policiais DISABLE ROW LEVEL SECURITY;
ALTER TABLE avisos DISABLE ROW LEVEL SECURITY;
ALTER TABLE testes DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE patentes DISABLE ROW LEVEL SECURITY;
ALTER TABLE grupos DISABLE ROW LEVEL SECURITY;
ALTER TABLE treinamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE aplicacoes_treinamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE xp_enviados DISABLE ROW LEVEL SECURITY;
ALTER TABLE advertencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE exoneracoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes_cadastro DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts_abas_customizadas DISABLE ROW LEVEL SECURITY;
ALTER TABLE apostilas DISABLE ROW LEVEL SECURITY;

-- Inserir configuração inicial se não existir
INSERT INTO configuracao_site (id, nome_site, subtitulo_site, logo_texto, login_mensagem)
VALUES ('config_principal', 'POLÍCIA CIA', 'Mesa de Operações Integradas • Brasília/DF', 'CIA', 'Acesso exclusivo para policiais e oficiais autorizados.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categorias (id, nome, subtitulo, ordem)
VALUES ('cat_setor_adm', 'Setor Administrativo', 'Diretoria e Administração Geral', 0)
ON CONFLICT (id) DO NOTHING;
`;

export const SQL_SCRIPT_RESET = `-- SCRIPT SQL PARA LIMPAR (DROP) E RE-CRIAR TODAS AS TABELAS DO SUPABASE (RECOMENDADO SE HOUVER ERROS DE COLUNA/TABELA)
-- ATENÇÃO: Esse script apagará permanentemente todos os dados existentes no Supabase remoto e recriará as tabelas com a estrutura correta.
-- Após executar este script no SQL Editor do Supabase, você pode cadastrar e salvar tudo diretamente no site.

DROP TABLE IF EXISTS configuracao_site CASCADE;
DROP TABLE IF EXISTS policiais CASCADE;
DROP TABLE IF EXISTS avisos CASCADE;
DROP TABLE IF EXISTS testes CASCADE;
DROP TABLE IF EXISTS movimentacoes CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS patentes CASCADE;
DROP TABLE IF EXISTS grupos CASCADE;
DROP TABLE IF EXISTS treinamentos CASCADE;
DROP TABLE IF EXISTS aplicacoes_treinamentos CASCADE;
DROP TABLE IF EXISTS xp_enviados CASCADE;
DROP TABLE IF EXISTS advertencias CASCADE;
DROP TABLE IF EXISTS exoneracoes CASCADE;
DROP TABLE IF EXISTS solicitacoes_cadastro CASCADE;
DROP TABLE IF EXISTS posts_abas_customizadas CASCADE;
DROP TABLE IF EXISTS apostilas CASCADE;

` + SQL_SCRIPT_GERAL;

export const SQL_SCRIPT_MIGRAR = SQL_SCRIPT_RESET;

export async function sincronizarTudoDoSupabase(forcarPull: boolean = false): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    let data: Record<string, any> | null = null;
    const directClient = obterClienteDirectoSupabase();

    if (directClient) {
      try {
        const results = await Promise.all([
          directClient.from('configuracao_site').select('*'),
          directClient.from('policiais').select('*'),
          directClient.from('avisos').select('*'),
          directClient.from('testes').select('*'),
          directClient.from('movimentacoes').select('*'),
          directClient.from('categorias').select('*'),
          directClient.from('patentes').select('*'),
          directClient.from('grupos').select('*'),
          directClient.from('treinamentos').select('*'),
          directClient.from('aplicacoes_treinamentos').select('*'),
          directClient.from('xp_enviados').select('*'),
          directClient.from('advertencias').select('*'),
          directClient.from('exoneracoes').select('*'),
          directClient.from('solicitacoes_cadastro').select('*'),
          directClient.from('posts_abas_customizadas').select('*'),
          directClient.from('apostilas').select('*')
        ]);

        data = {
          configuracao_site: results[0].data,
          policiais: results[1].data,
          avisos: results[2].data,
          testes: results[3].data,
          movimentacoes: results[4].data,
          categorias: results[5].data,
          patentes: results[6].data,
          grupos: results[7].data,
          treinamentos: results[8].data,
          aplicacoes_treinamentos: results[9].data,
          xp_enviados: results[10].data,
          advertencias: results[11].data,
          exoneracoes: results[12].data,
          solicitacoes_cadastro: results[13].data,
          posts_abas_customizadas: results[14].data,
          apostilas: results[15].data
        };
      } catch (directErr) {
        console.warn('[Supabase Direct Pull] Direct fetch failed:', directErr);
      }
    }

    if (!data) {
      const response = await fetch('/api/supabase/pull', { method: 'POST' });
      const res = await response.json();
      if (response.ok && res.success) {
        data = res.data;
      } else {
        return { sucesso: false, mensagem: res.error || 'Falha ao baixar dados do servidor backend ou do Supabase.' };
      }
    }

    if (!data) {
      return { sucesso: false, mensagem: 'Não foi possível se conectar ao Supabase.' };
    }

    // 1. Sync configuracao_site
    if (data.configuracao_site && data.configuracao_site.length > 0) {
      const active = data.configuracao_site[0];
      const mappedConfig: ConfiguracaoSite = {
        nomeSite: active.nome_site,
        subtituloSite: active.subtitulo_site,
        logoTexto: active.logo_texto,
        logoUrl: active.logo_url || undefined,
        loginMensagem: active.login_mensagem,
        cargosPermissoes: active.cargos_permissoes || {},
        webhookDiscord: active.webhook_discord || undefined,
        corTema: active.cor_tema || undefined,
        loginBackgroundUrl: active.login_background_url || undefined,
        linkSuporte: active.link_suporte || undefined,
        linkDiscord: active.link_discord || undefined,
        webhookAvisos: active.webhook_avisos || undefined,
        webhookMovimentacoes: active.webhook_movimentacoes || undefined,
        webhookAdvertencias: active.webhook_advertencias || undefined,
        webhookExoneracoes: active.webhook_exoneracoes || undefined,
        webhookDiscordEntradas: active.webhook_discord_entradas || undefined,
        webhookBackup: active.webhook_backup || undefined,
        ultimoBackup: active.ultimo_backup || undefined,
        abasCustomizadas: active.abas_customizadas || []
      };
      localStorage.setItem(CHAVE_CONFIGURACAO_SITE, JSON.stringify(mappedConfig));
    }

    // 2. Sync policiais
    if (Array.isArray(data.policiais) && data.policiais.length > 0) {
      const polRecord: Record<string, Policial & { senhaHex: string }> = {};
      data.policiais.forEach((row: any) => {
        polRecord[row.nick.toLowerCase()] = {
          nick: row.nick,
          cargo: row.cargo,
          categoriaId: row.categoria_id || undefined,
          dataRegistro: row.data_registro,
          avatarHabbo: row.avatar_habbo,
          pontosPromocao: row.pontos_promocao,
          presencas: row.presencas,
          streak: row.streak,
          biografia: row.biografia || undefined,
          promovidoPor: row.promovido_por || undefined,
          ultimasPresencas: Array.isArray(row.ultimas_presencas) ? row.ultimas_presencas : [],
          medalhas: Array.isArray(row.medalhas) ? row.medalhas : [],
          senhaHex: row.senha_hex,
          fotoUrl: row.foto_url || undefined
        };
      });

      // Force-ensure admin and 78k exist in the pulled list if not present
      if (!polRecord['admin']) {
        polRecord['admin'] = {
          nick: 'admin',
          cargo: 'Diretor',
          dataRegistro: '2026-07-20',
          avatarHabbo: 'admin',
          pontosPromocao: 9999,
          presencas: 999,
          streak: 99,
          senhaHex: criptografarTexto('admin#2026'),
          biografia: 'Administrador Supremo do Sistema de Segurança.',
          medalhas: ['Administrador', 'Honra ao Mérito']
        };
      }
      if (!polRecord['78k']) {
        polRecord['78k'] = {
          nick: '78k',
          cargo: 'Diretor',
          dataRegistro: '2026-07-20',
          avatarHabbo: '78k',
          pontosPromocao: 9999,
          presencas: 999,
          streak: 99,
          senhaHex: criptografarTexto('78k#2026'),
          biografia: 'Diretor Geral e Administrador do Sistema.',
          medalhas: ['Administrador', 'Honra ao Mérito']
        };
      }

      localStorage.setItem(CHAVE_POLICIAIS, JSON.stringify(polRecord));
    }

    // 3. Sync avisos
    if (Array.isArray(data.avisos) && data.avisos.length > 0) {
      const mapped = data.avisos.map((row: any) => ({
        id: row.id,
        titulo: row.titulo,
        conteudo: row.conteudo,
        autor: row.autor,
        data: row.data,
        tipo: row.tipo,
        imageUrl: row.image_url || undefined,
        corFundo: row.cor_fundo || 'default',
        negrito: !!row.negrito,
        italico: !!row.italico,
        marcarEveryone: !!row.marcar_everyone,
        posicaoImagem: row.posicao_imagem || 'topo',
        imagemFundoUrl: row.imagem_fundo_url || undefined,
        templateNoticia: row.template_noticia || 'padrao'
      }));
      localStorage.setItem(CHAVE_AVISOS, JSON.stringify(mapped));
    }

    // 4. Sync testes
    if (Array.isArray(data.testes) && data.testes.length > 0) {
      const mapped = data.testes.map((row: any) => ({
        id: row.id,
        nickRecruta: row.nick_recruta,
        reprovado: row.reprovado,
        motivoReprovacao: row.motivo_reprovacao || undefined,
        respostas: Array.isArray(row.respostas) ? row.respostas : [],
        examinador: row.examinador,
        data: row.data
      }));
      localStorage.setItem(CHAVE_TESTES, JSON.stringify(mapped));
    }

    // 5. Sync movimentacoes
    if (Array.isArray(data.movimentacoes) && data.movimentacoes.length > 0) {
      const mapped = data.movimentacoes.map((row: any) => ({
        id: row.id,
        nickPolicial: row.nick_policial,
        tipo: row.tipo,
        cargoAnterior: row.cargo_anterior,
        cargoNovo: row.cargo_novo,
        motivo: row.motivo,
        autor: row.autor,
        data: row.data
      }));
      localStorage.setItem(CHAVE_MOVIMENTACOES, JSON.stringify(mapped));
    }

    // 6. Sync categorias (SETORES!)
    if (Array.isArray(data.categorias) && data.categorias.length > 0) {
      const mapped = data.categorias.map((row: any) => ({
        id: row.id,
        nome: row.nome,
        subtitulo: row.subtitulo || undefined,
        ordem: typeof row.ordem === 'number' ? row.ordem : 0
      }));
      localStorage.setItem(CHAVE_CATEGORIAS, JSON.stringify(mapped));
    }

    // 7. Sync patentes
    if (Array.isArray(data.patentes) && data.patentes.length > 0) {
      const mapped = data.patentes.map((row: any) => ({
        id: row.id,
        categoriaId: row.categoria_id,
        nome: row.nome,
        ordem: row.ordem,
        equivalente: row.equivalente || undefined,
        salario: row.salario || undefined,
        insignia: row.insignia || undefined,
        responsabilidade: row.responsabilidade || undefined
      }));
      localStorage.setItem(CHAVE_PATENTES, JSON.stringify(mapped));
    }

    // 8. Sync grupos
    if (Array.isArray(data.grupos) && data.grupos.length > 0) {
      const mapped = data.grupos.map((row: any) => ({
        id: row.id,
        nome: row.nome,
        sigla: row.sigla,
        descricao: row.descricao,
        urlImagem: row.url_imagem,
        publico: row.publico,
        verificado: row.verificado,
        aceitaMembros: row.aceita_membros,
        membros: Array.isArray(row.membros) ? row.membros : []
      }));
      localStorage.setItem(CHAVE_GRUPOS, JSON.stringify(mapped));
    }

    // 9. Sync treinamentos
    if (Array.isArray(data.treinamentos) && data.treinamentos.length > 0) {
      const mapped = data.treinamentos.map((row: any) => ({
        id: row.id,
        titulo: row.titulo,
        status: row.status,
        descricao: row.descricao,
        conteudo: row.conteudo,
        cargoVinculavel: row.cargo_vinculavel || undefined,
        patenteVinculavelId: row.patente_vinculavel_id || undefined,
        permissoesCargos: Array.isArray(row.permissoes_cargos) ? row.permissoes_cargos : [],
        permissoesAvaliadores: Array.isArray(row.permissoes_avaliadores) ? row.permissoes_avaliadores : []
      }));
      localStorage.setItem(CHAVE_TREINAMENTOS, JSON.stringify(mapped));
    }

    // 10. Sync aplicacoes_treinamentos
    if (Array.isArray(data.aplicacoes_treinamentos) && data.aplicacoes_treinamentos.length > 0) {
      const mapped = data.aplicacoes_treinamentos.map((row: any) => ({
        id: row.id,
        treinamentoId: row.treinamento_id,
        instrutor: row.instrutor,
        data: row.data,
        alunos: Array.isArray(row.alunos) ? row.alunos : [],
        observacoes: row.observacoes || undefined,
        statusAprovacao: row.status_aprovacao || 'aprovado',
        avaliador: row.avaliador || undefined,
        dataAvaliacao: row.data_avaliacao || undefined,
        motivoAvaliacao: row.motivo_avaliacao || undefined
      }));
      localStorage.setItem(CHAVE_APLICACOES_TREINAMENTOS, JSON.stringify(mapped));
    }

    // 11. Sync xp_enviados
    if (Array.isArray(data.xp_enviados) && data.xp_enviados.length > 0) {
      const mapped = data.xp_enviados.map((row: any) => ({
        id: row.id,
        motivo: row.motivo,
        valor: row.valor,
        destinatarios: Array.isArray(row.destinatarios) ? row.destinatarios : [],
        enviadoPor: row.enviado_por,
        data: row.data
      }));
      localStorage.setItem(CHAVE_XP_ENVIADOS, JSON.stringify(mapped));
    }

    // 12. Sync advertencias
    if (Array.isArray(data.advertencias) && data.advertencias.length > 0) {
      const mapped = data.advertencias.map((row: any) => ({
        id: row.id,
        nickPolicial: row.nick_policial,
        quantidade: row.quantidade,
        prazoVencimento: row.prazo_vencimento,
        motivo: row.motivo,
        autor: row.autor,
        data: row.data,
        ativa: row.ativa !== false
      }));
      localStorage.setItem(CHAVE_ADVERTENCIAS, JSON.stringify(mapped));
    }

    // 13. Sync exoneracoes
    if (Array.isArray(data.exoneracoes) && data.exoneracoes.length > 0) {
      const mapped = data.exoneracoes.map((row: any) => ({
        id: row.id,
        nickPolicial: row.nick_policial,
        motivo: row.motivo,
        autor: row.autor,
        data: row.data,
        tipo: row.tipo || 'exoneracao'
      }));
      localStorage.setItem(CHAVE_EXONERACOES, JSON.stringify(mapped));
    }

    // 14. Sync solicitacoes_cadastro
    if (Array.isArray(data.solicitacoes_cadastro) && data.solicitacoes_cadastro.length > 0) {
      const mapped = data.solicitacoes_cadastro.map((row: any) => ({
        id: row.id,
        nick: row.nick,
        senhaHex: row.senha_hex,
        avatarHabbo: row.avatar_habbo,
        dataSolicitacao: row.data_solicitacao,
        ip: row.ip || 'Não detectado',
        cidade: row.cidade || 'Não detectada',
        fotoUrl: row.foto_url || undefined,
        status: row.status || 'pendente',
        avaliadorNick: row.avaliador_nick || undefined,
        dataAvaliacao: row.data_avaliacao || undefined
      }));
      localStorage.setItem('cia_solicitacoes_cadastro', JSON.stringify(mapped));
    }

    // 15. Sync posts_abas_customizadas
    if (Array.isArray(data.posts_abas_customizadas) && data.posts_abas_customizadas.length > 0) {
      const mapped = data.posts_abas_customizadas.map((row: any) => ({
        id: row.id,
        abaId: row.aba_id,
        titulo: row.titulo,
        conteudo: row.conteudo,
        autor: row.autor,
        data: row.data,
        fileUrl: row.file_url || undefined,
        tipo: row.tipo || 'documento'
      }));
      localStorage.setItem('cia_posts_abas_customizadas', JSON.stringify(mapped));
    }

    // 16. Sync apostilas
    if (Array.isArray(data.apostilas) && data.apostilas.length > 0) {
      const mapped = data.apostilas.map((row: any) => ({
        id: row.id,
        titulo: row.titulo,
        descricao: row.descricao,
        partes: Array.isArray(row.partes) ? row.partes : [],
        criadoPor: row.criado_por,
        dataCriacao: row.data_criacao
      }));
      localStorage.setItem(CHAVE_APOSTILAS, JSON.stringify(mapped));
    }

    return { sucesso: true, mensagem: 'Dados sincronizados do Supabase com sucesso!' };
  } catch (error: any) {
    console.error('Erro na sincronização do Supabase:', error);
    return { sucesso: false, mensagem: 'Erro ao sincronizar do Supabase: ' + (error.message || error) };
  }
}

export async function exportarDadosParaSupabase(): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    const payload: Record<string, any[]> = {};

    // 1. Configuração
    const configRaw = localStorage.getItem(CHAVE_CONFIGURACAO_SITE);
    if (configRaw) {
      const config: ConfiguracaoSite = JSON.parse(configRaw);
      payload.configuracao_site = [{
        id: 'config_principal',
        nome_site: config.nomeSite,
        subtitulo_site: config.subtituloSite,
        logo_texto: config.logoTexto,
        logo_url: config.logoUrl || null,
        login_mensagem: config.loginMensagem,
        cargos_permissoes: config.cargosPermissoes,
        webhook_discord: config.webhookDiscord || null,
        cor_tema: config.corTema || null,
        login_background_url: config.loginBackgroundUrl || null,
        link_suporte: config.linkSuporte || null,
        link_discord: config.linkDiscord || null,
        webhook_avisos: config.webhookAvisos || null,
        webhook_movimentacoes: config.webhookMovimentacoes || null,
        webhook_advertencias: config.webhookAdvertencias || null,
        webhook_exoneracoes: config.webhookExoneracoes || null,
        webhook_discord_entradas: config.webhookDiscordEntradas || null,
        webhook_backup: config.webhookBackup || null,
        ultimo_backup: config.ultimoBackup || null,
        abas_customizadas: config.abasCustomizadas || []
      }];
    }

    // 2. Policiais
    const polsRaw = localStorage.getItem(CHAVE_POLICIAIS);
    if (polsRaw) {
      const policiais: Record<string, Policial & { senhaHex: string }> = JSON.parse(polsRaw);
      payload.policiais = Object.values(policiais).map(pol => ({
        nick: pol.nick,
        cargo: pol.cargo,
        categoria_id: pol.categoriaId || null,
        data_registro: pol.dataRegistro,
        avatar_habbo: pol.avatarHabbo,
        pontos_promocao: pol.pontosPromocao,
        presencas: pol.presencas,
        streak: pol.streak,
        biografia: pol.biografia || null,
        promovido_por: pol.promovidoPor || null,
        ultimas_presencas: pol.ultimasPresencas || [],
        medalhas: pol.medalhas || [],
        senha_hex: pol.senhaHex,
        foto_url: pol.fotoUrl || null
      }));
    }

    // 3. Avisos
    const avisosRaw = localStorage.getItem(CHAVE_AVISOS);
    if (avisosRaw) {
      const avisos: any[] = JSON.parse(avisosRaw);
      payload.avisos = avisos.map(a => ({
        id: a.id,
        titulo: a.titulo,
        conteudo: a.conteudo,
        autor: a.autor,
        data: a.data,
        tipo: a.tipo,
        image_url: a.imageUrl || null,
        cor_fundo: a.corFundo || 'default',
        negrito: !!a.negrito,
        italico: !!a.italico,
        marcar_everyone: !!a.marcarEveryone,
        posicao_imagem: a.posicaoImagem || 'topo',
        imagem_fundo_url: a.imagemFundoUrl || null,
        template_noticia: a.templateNoticia || 'padrao'
      }));
    }

    // 4. Testes
    const testesRaw = localStorage.getItem(CHAVE_TESTES);
    if (testesRaw) {
      const testes: RecrutaTeste[] = JSON.parse(testesRaw);
      payload.testes = testes.map(t => ({
        id: t.id,
        nick_recruta: t.nickRecruta,
        reprovado: t.reprovado,
        motivo_reprovacao: t.motivoReprovacao || null,
        respostas: t.respostas,
        examinador: t.examinador,
        data: t.data
      }));
    }

    // 5. Movimentações
    const movsRaw = localStorage.getItem(CHAVE_MOVIMENTACOES);
    if (movsRaw) {
      const movs: any[] = JSON.parse(movsRaw);
      payload.movimentacoes = movs.map(m => ({
        id: m.id,
        nick_policial: m.nickPolicial,
        tipo: m.tipo,
        cargo_anterior: m.cargoAnterior,
        cargo_novo: m.cargoNovo,
        motivo: m.motivo,
        autor: m.autor,
        data: m.data
      }));
    }

    // 6. Categorias
    const catsRaw = localStorage.getItem(CHAVE_CATEGORIAS);
    if (catsRaw) {
      const cats: any[] = JSON.parse(catsRaw);
      payload.categorias = cats.map(c => ({
        id: c.id,
        nome: c.nome,
        subtitulo: c.subtitulo || null,
        ordem: typeof c.ordem === 'number' ? c.ordem : 0
      }));
    }

    // 7. Patentes
    const patsRaw = localStorage.getItem(CHAVE_PATENTES);
    if (patsRaw) {
      const pats: any[] = JSON.parse(patsRaw);
      payload.patentes = pats.map(p => ({
        id: p.id,
        categoria_id: p.categoriaId,
        nome: p.nome,
        ordem: p.ordem,
        equivalente: p.equivalente || null,
        salario: p.salario || null,
        insignia: p.insignia || null,
        responsabilidade: p.responsabilidade || null
      }));
    }

    // 8. Grupos
    const grupRaw = localStorage.getItem(CHAVE_GRUPOS);
    if (grupRaw) {
      const grupos: any[] = JSON.parse(grupRaw);
      payload.grupos = grupos.map(g => ({
        id: g.id,
        nome: g.nome,
        sigla: g.sigla,
        descricao: g.descricao,
        url_imagem: g.urlImagem,
        publico: g.publico,
        verificado: g.verificado,
        aceita_membros: g.aceitaMembros,
        membros: g.membros
      }));
    }

    // 9. Treinamentos
    const treRaw = localStorage.getItem(CHAVE_TREINAMENTOS);
    if (treRaw) {
      const treins: any[] = JSON.parse(treRaw);
      payload.treinamentos = treins.map(t => ({
        id: t.id,
        titulo: t.titulo,
        status: t.status,
        descricao: t.descricao,
        conteudo: t.conteudo,
        cargo_vinculavel: t.cargoVinculavel || null,
        patente_vinculavel_id: t.patenteVinculavelId || null,
        permissoes_cargos: t.permissoesCargos,
        permissoes_avaliadores: t.permissoesAvaliadores || []
      }));
    }

    // 10. Aplicações Treinamentos
    const aplRaw = localStorage.getItem(CHAVE_APLICACOES_TREINAMENTOS);
    if (aplRaw) {
      const apls: any[] = JSON.parse(aplRaw);
      payload.aplicacoes_treinamentos = apls.map(a => ({
        id: a.id,
        treinamento_id: a.treinamentoId,
        instrutor: a.instrutor,
        data: a.data,
        alunos: a.alunos,
        observacoes: a.observacoes || null,
        status_aprovacao: a.statusAprovacao || 'aprovado',
        avaliador: a.avaliador || null,
        data_avaliacao: a.dataAvaliacao || null,
        motivo_avaliacao: a.motivoAvaliacao || null
      }));
    }

    // 11. XP Enviados
    const xpRaw = localStorage.getItem(CHAVE_XP_ENVIADOS);
    if (xpRaw) {
      const xpEnvios: EnvioXP[] = JSON.parse(xpRaw);
      payload.xp_enviados = xpEnvios.map(x => ({
        id: x.id,
        motivo: x.motivo,
        valor: x.valor,
        destinatarios: x.destinatarios,
        enviado_por: x.enviadoPor,
        data: x.data
      }));
    }

    // 12. Advertências
    const advsRaw = localStorage.getItem(CHAVE_ADVERTENCIAS);
    if (advsRaw) {
      const advs: any[] = JSON.parse(advsRaw);
      payload.advertencias = advs.map(a => ({
        id: a.id,
        nick_policial: a.nickPolicial,
        quantidade: a.quantidade,
        prazo_vencimento: a.prazoVencimento,
        motivo: a.motivo,
        autor: a.autor,
        data: a.data,
        ativa: a.ativa
      }));
    }

    // 13. Exonerações
    const exosRaw = localStorage.getItem(CHAVE_EXONERACOES);
    if (exosRaw) {
      const exos: any[] = JSON.parse(exosRaw);
      payload.exoneracoes = exos.map(e => ({
        id: e.id,
        nick_policial: e.nickPolicial,
        motivo: e.motivo,
        autor: e.autor,
        data: e.data,
        tipo: e.tipo
      }));
    }

    // 14. Solicitações de Cadastro
    const solsRaw = localStorage.getItem('cia_solicitacoes_cadastro');
    if (solsRaw) {
      const sols: any[] = JSON.parse(solsRaw);
      payload.solicitacoes_cadastro = sols.map(s => ({
        id: s.id,
        nick: s.nick,
        senha_hex: s.senhaHex,
        avatar_habbo: s.avatarHabbo,
        data_solicitacao: s.dataSolicitacao,
        ip: s.ip || null,
        cidade: s.cidade || null,
        foto_url: s.fotoUrl || null,
        status: s.status || 'pendente',
        avaliador_nick: s.avaliadorNick || null,
        data_avaliacao: s.dataAvaliacao || null
      }));
    }

    // 15. Posts de Abas Customizadas
    const postsCustomRaw = localStorage.getItem('cia_posts_abas_customizadas');
    if (postsCustomRaw) {
      const posts: any[] = JSON.parse(postsCustomRaw);
      payload.posts_abas_customizadas = posts.map(p => ({
        id: p.id,
        aba_id: p.abaId,
        titulo: p.titulo,
        conteudo: p.conteudo,
        autor: p.autor,
        data: p.data,
        file_url: p.fileUrl || null,
        tipo: p.tipo || 'documento'
      }));
    }

    // 16. Apostilas
    const apostilasRaw = localStorage.getItem(CHAVE_APOSTILAS);
    if (apostilasRaw) {
      const aps: Apostila[] = JSON.parse(apostilasRaw);
      payload.apostilas = aps.map(a => ({
        id: a.id,
        titulo: a.titulo,
        descricao: a.descricao,
        partes: a.partes || [],
        criado_por: a.criadoPor,
        data_criacao: a.dataCriacao
      }));
    }

    const directClient = obterClienteDirectoSupabase();
    if (directClient) {
      for (const [tabela, items] of Object.entries(payload)) {
        if (Array.isArray(items) && items.length > 0) {
          const { error } = await safeUpsertClient(directClient, tabela, items);
          if (error) {
            console.warn(`[Supabase Direct Push Error] Tabela ${tabela}:`, error.message);
          }
        }
      }
      return { sucesso: true, mensagem: 'Exportação direta para o Supabase concluída com sucesso!' };
    }

    const response = await fetch('/api/supabase/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: payload })
    });

    const res = await response.json();
    if (!response.ok || !res.success) {
      return { sucesso: false, mensagem: res.error || 'Erro ao sincronizar dados com o servidor.' };
    }

    return { sucesso: true, mensagem: 'Exportação para o Supabase concluída com sucesso!' };
  } catch (error: any) {
    console.error('Erro na exportação para o Supabase:', error);
    return { sucesso: false, mensagem: 'Erro ao exportar para o Supabase: ' + (error.message || error) };
  }
}
