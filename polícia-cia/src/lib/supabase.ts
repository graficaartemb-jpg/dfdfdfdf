import { createClient } from '@supabase/supabase-js';
import { Policial, RecrutaTeste, EnvioXP, ConfiguracaoSite } from '../types';

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

export function obterSupabaseKeys() {
  const url = localStorage.getItem('cia_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
  const key = localStorage.getItem('cia_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return { url, key };
}

export function obterSupabaseClient() {
  const { url, key } = obterSupabaseKeys();
  if (url && key) {
    try {
      return createClient(url, key);
    } catch (e) {
      console.error('Erro ao inicializar Supabase client:', e);
      return null;
    }
  }
  return null;
}

export async function testarConexaoSupabase(url: string, key: string): Promise<boolean> {
  if (!url || !key) return false;
  try {
    const client = createClient(url, key);
    // Try a simple select to test connection
    const { error } = await client.from('configuracao_site').select('id').limit(1);
    // If the error code is PGRST116 (no row found) or no error, connection is valid
    if (!error || error.code === 'PGRST116') {
      return true;
    }
    // If it's a "relation does not exist" error, the connection is still valid (Supabase exists, but tables aren't built yet)
    if (error.message && error.message.includes('does not exist')) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export const SQL_SCRIPT_GERAL = `-- SCRIPT SQL PARA CRIAR AS TABELAS NO SUPABASE
-- Copie e cole este script no SQL Editor do seu projeto Supabase.

CREATE TABLE IF NOT EXISTS configuracao_site (
  id VARCHAR PRIMARY KEY DEFAULT 'config_principal',
  nome_site VARCHAR DEFAULT 'POLÍCIA CIA',
  subtitulo_site VARCHAR DEFAULT 'Mesa de Operações Integradas • Brasília/DF',
  logo_texto VARCHAR DEFAULT 'CIA',
  logo_url VARCHAR,
  login_mensagem VARCHAR DEFAULT 'Acesso exclusivo para policiais e oficiais autorizados.',
  cargos_permissoes JSONB
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
  senha_hex VARCHAR
);

CREATE TABLE IF NOT EXISTS avisos (
  id VARCHAR PRIMARY KEY,
  titulo VARCHAR,
  conteudo VARCHAR,
  autor VARCHAR,
  data VARCHAR,
  tipo VARCHAR
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
  subtitulo VARCHAR
);

CREATE TABLE IF NOT EXISTS patentes (
  id VARCHAR PRIMARY KEY,
  categoria_id VARCHAR,
  nome VARCHAR,
  ordem INTEGER,
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
  conteudo VARCHAR,
  cargo_vinculavel VARCHAR,
  patente_vinculavel_id VARCHAR,
  permissoes_cargos JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS aplicacoes_treinamentos (
  id VARCHAR PRIMARY KEY,
  treinamento_id VARCHAR,
  instrutor VARCHAR,
  data VARCHAR,
  alunos JSONB DEFAULT '[]',
  observacoes VARCHAR
);

CREATE TABLE IF NOT EXISTS xp_enviados (
  id VARCHAR PRIMARY KEY,
  motivo VARCHAR,
  valor INTEGER DEFAULT 0,
  destinatarios JSONB DEFAULT '[]',
  enviado_por VARCHAR,
  data VARCHAR
);

-- Inserir configuração inicial se não existir
INSERT INTO configuracao_site (id, nome_site, subtitulo_site, logo_texto, login_mensagem)
VALUES ('config_principal', 'POLÍCIA CIA', 'Mesa de Operações Integradas • Brasília/DF', 'CIA', 'Acesso exclusivo para policiais e oficiais autorizados.')
ON CONFLICT (id) DO NOTHING;
`;

export async function sincronizarTudoDoSupabase(): Promise<{ sucesso: boolean; mensagem: string }> {
  const supabase = obterSupabaseClient();
  if (!supabase) {
    return { sucesso: false, mensagem: 'Supabase não está configurado ou conectado.' };
  }

  try {
    // 1. Sync configuracao_site
    const { data: configData, error: configErr } = await supabase.from('configuracao_site').select('*');
    if (!configErr && configData && configData.length > 0) {
      const active = configData[0];
      const mappedConfig: ConfiguracaoSite = {
        nomeSite: active.nome_site,
        subtituloSite: active.subtitulo_site,
        logoTexto: active.logo_texto,
        logoUrl: active.logo_url || undefined,
        loginMensagem: active.login_mensagem,
        cargosPermissoes: active.cargos_permissoes
      };
      localStorage.setItem(CHAVE_CONFIGURACAO_SITE, JSON.stringify(mappedConfig));
    }

    // 2. Sync policiais
    const { data: polData, error: polErr } = await supabase.from('policiais').select('*');
    if (!polErr && polData && polData.length > 0) {
      const polRecord: Record<string, Policial & { senhaHex: string }> = {};
      polData.forEach((row: any) => {
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
          senhaHex: row.senha_hex
        };
      });
      localStorage.setItem(CHAVE_POLICIAIS, JSON.stringify(polRecord));
    }

    // 3. Sync avisos
    const { data: avisosData, error: avisosErr } = await supabase.from('avisos').select('*');
    if (!avisosErr && avisosData) {
      const mapped = avisosData.map((row: any) => ({
        id: row.id,
        titulo: row.titulo,
        conteudo: row.conteudo,
        autor: row.autor,
        data: row.data,
        tipo: row.tipo
      }));
      localStorage.setItem(CHAVE_AVISOS, JSON.stringify(mapped));
    }

    // 4. Sync testes
    const { data: testesData, error: testesErr } = await supabase.from('testes').select('*');
    if (!testesErr && testesData) {
      const mapped = testesData.map((row: any) => ({
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
    const { data: movData, error: movErr } = await supabase.from('movimentacoes').select('*');
    if (!movErr && movData) {
      const mapped = movData.map((row: any) => ({
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

    // 6. Sync categorias
    const { data: catData, error: catErr } = await supabase.from('categorias').select('*');
    if (!catErr && catData) {
      localStorage.setItem(CHAVE_CATEGORIAS, JSON.stringify(catData));
    }

    // 7. Sync patentes
    const { data: patData, error: patErr } = await supabase.from('patentes').select('*');
    if (!patErr && patData) {
      const mapped = patData.map((row: any) => ({
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
    const { data: grupData, error: grupErr } = await supabase.from('grupos').select('*');
    if (!grupErr && grupData) {
      const mapped = grupData.map((row: any) => ({
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
    const { data: treData, error: treErr } = await supabase.from('treinamentos').select('*');
    if (!treErr && treData) {
      const mapped = treData.map((row: any) => ({
        id: row.id,
        titulo: row.titulo,
        status: row.status,
        descricao: row.descricao,
        conteudo: row.conteudo,
        cargoVinculavel: row.cargo_vinculavel || undefined,
        patenteVinculavelId: row.patente_vinculavel_id || undefined,
        permissoesCargos: Array.isArray(row.permissoes_cargos) ? row.permissoes_cargos : []
      }));
      localStorage.setItem(CHAVE_TREINAMENTOS, JSON.stringify(mapped));
    }

    // 10. Sync aplicacoes_treinamentos
    const { data: aplData, error: aplErr } = await supabase.from('aplicacoes_treinamentos').select('*');
    if (!aplErr && aplData) {
      const mapped = aplData.map((row: any) => ({
        id: row.id,
        treinamentoId: row.treinamento_id,
        instrutor: row.instrutor,
        data: row.data,
        alunos: Array.isArray(row.alunos) ? row.alunos : [],
        observacoes: row.observacoes || undefined
      }));
      localStorage.setItem(CHAVE_APLICACOES_TREINAMENTOS, JSON.stringify(mapped));
    }

    // 11. Sync xp_enviados
    const { data: xpData, error: xpErr } = await supabase.from('xp_enviados').select('*');
    if (!xpErr && xpData) {
      const mapped = xpData.map((row: any) => ({
        id: row.id,
        motivo: row.motivo,
        valor: row.valor,
        destinatarios: Array.isArray(row.destinatarios) ? row.destinatarios : [],
        enviadoPor: row.enviado_por,
        data: row.data
      }));
      localStorage.setItem(CHAVE_XP_ENVIADOS, JSON.stringify(mapped));
    }

    return { sucesso: true, mensagem: 'Dados sincronizados do Supabase com sucesso!' };
  } catch (error: any) {
    console.error('Erro na sincronização do Supabase:', error);
    return { sucesso: false, mensagem: 'Erro ao sincronizar do Supabase: ' + (error.message || error) };
  }
}

export async function exportarDadosParaSupabase(): Promise<{ sucesso: boolean; mensagem: string }> {
  const supabase = obterSupabaseClient();
  if (!supabase) {
    return { sucesso: false, mensagem: 'Supabase não está configurado ou conectado.' };
  }

  try {
    // 1. Configuração
    const configRaw = localStorage.getItem(CHAVE_CONFIGURACAO_SITE);
    if (configRaw) {
      const config: ConfiguracaoSite = JSON.parse(configRaw);
      await supabase.from('configuracao_site').upsert({
        id: 'config_principal',
        nome_site: config.nomeSite,
        subtitulo_site: config.subtituloSite,
        logo_texto: config.logoTexto,
        logo_url: config.logoUrl || null,
        login_mensagem: config.loginMensagem,
        cargos_permissoes: config.cargosPermissoes
      });
    }

    // 2. Policiais
    const polsRaw = localStorage.getItem(CHAVE_POLICIAIS);
    if (polsRaw) {
      const policiais: Record<string, Policial & { senhaHex: string }> = JSON.parse(polsRaw);
      const polRows = Object.values(policiais).map(pol => ({
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
        senha_hex: pol.senhaHex
      }));
      if (polRows.length > 0) {
        await supabase.from('policiais').upsert(polRows);
      }
    }

    // 3. Avisos
    const avisosRaw = localStorage.getItem(CHAVE_AVISOS);
    if (avisosRaw) {
      const avisos: any[] = JSON.parse(avisosRaw);
      const avisosRows = avisos.map(a => ({
        id: a.id,
        titulo: a.titulo,
        conteudo: a.conteudo,
        autor: a.autor,
        data: a.data,
        tipo: a.tipo
      }));
      if (avisosRows.length > 0) {
        await supabase.from('avisos').upsert(avisosRows);
      }
    }

    // 4. Testes
    const testesRaw = localStorage.getItem(CHAVE_TESTES);
    if (testesRaw) {
      const testes: RecrutaTeste[] = JSON.parse(testesRaw);
      const testesRows = testes.map(t => ({
        id: t.id,
        nick_recruta: t.nickRecruta,
        reprovado: t.reprovado,
        motivo_reprovacao: t.motivoReprovacao || null,
        respostas: t.respostas,
        examinador: t.examinador,
        data: t.data
      }));
      if (testesRows.length > 0) {
        await supabase.from('testes').upsert(testesRows);
      }
    }

    // 5. Movimentações
    const movsRaw = localStorage.getItem(CHAVE_MOVIMENTACOES);
    if (movsRaw) {
      const movs: any[] = JSON.parse(movsRaw);
      const movsRows = movs.map(m => ({
        id: m.id,
        nick_policial: m.nickPolicial,
        tipo: m.tipo,
        cargo_anterior: m.cargoAnterior,
        cargo_novo: m.cargoNovo,
        motivo: m.motivo,
        autor: m.autor,
        data: m.data
      }));
      if (movsRows.length > 0) {
        await supabase.from('movimentacoes').upsert(movsRows);
      }
    }

    // 6. Categorias
    const catsRaw = localStorage.getItem(CHAVE_CATEGORIAS);
    if (catsRaw) {
      const cats = JSON.parse(catsRaw);
      if (cats.length > 0) {
        await supabase.from('categorias').upsert(cats);
      }
    }

    // 7. Patentes
    const patsRaw = localStorage.getItem(CHAVE_PATENTES);
    if (patsRaw) {
      const pats: any[] = JSON.parse(patsRaw);
      const patRows = pats.map(p => ({
        id: p.id,
        categoria_id: p.categoriaId,
        nome: p.nome,
        ordem: p.ordem,
        equivalente: p.equivalente || null,
        salario: p.salario || null,
        insignia: p.insignia || null,
        responsabilidade: p.responsabilidade || null
      }));
      if (patRows.length > 0) {
        await supabase.from('patentes').upsert(patRows);
      }
    }

    // 8. Grupos
    const grupRaw = localStorage.getItem(CHAVE_GRUPOS);
    if (grupRaw) {
      const grupos: any[] = JSON.parse(grupRaw);
      const grupRows = grupos.map(g => ({
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
      if (grupRows.length > 0) {
        await supabase.from('grupos').upsert(grupRows);
      }
    }

    // 9. Treinamentos
    const treRaw = localStorage.getItem(CHAVE_TREINAMENTOS);
    if (treRaw) {
      const treins: any[] = JSON.parse(treRaw);
      const treRows = treins.map(t => ({
        id: t.id,
        titulo: t.titulo,
        status: t.status,
        descricao: t.descricao,
        conteudo: t.conteudo,
        cargo_vinculavel: t.cargoVinculavel || null,
        patente_vinculavel_id: t.patenteVinculavelId || null,
        permissoes_cargos: t.permissoesCargos
      }));
      if (treRows.length > 0) {
        await supabase.from('treinamentos').upsert(treRows);
      }
    }

    // 10. Aplicações Treinamentos
    const aplRaw = localStorage.getItem(CHAVE_APLICACOES_TREINAMENTOS);
    if (aplRaw) {
      const apls: any[] = JSON.parse(aplRaw);
      const aplRows = apls.map(a => ({
        id: a.id,
        treinamento_id: a.treinamentoId,
        instrutor: a.instrutor,
        data: a.data,
        alunos: a.alunos,
        observacoes: a.observacoes || null
      }));
      if (aplRows.length > 0) {
        await supabase.from('aplicacoes_treinamentos').upsert(aplRows);
      }
    }

    // 11. XP Enviados
    const xpRaw = localStorage.getItem(CHAVE_XP_ENVIADOS);
    if (xpRaw) {
      const xpEnvios: EnvioXP[] = JSON.parse(xpRaw);
      const xpRows = xpEnvios.map(x => ({
        id: x.id,
        motivo: x.motivo,
        valor: x.valor,
        destinatarios: x.destinatarios,
        enviado_por: x.enviadoPor,
        data: x.data
      }));
      if (xpRows.length > 0) {
        await supabase.from('xp_enviados').upsert(xpRows);
      }
    }

    return { sucesso: true, mensagem: 'Exportação para o Supabase concluída com sucesso!' };
  } catch (error: any) {
    console.error('Erro na exportação para o Supabase:', error);
    return { sucesso: false, mensagem: 'Erro ao exportar para o Supabase: ' + (error.message || error) };
  }
}
