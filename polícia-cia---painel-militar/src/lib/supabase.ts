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
const CHAVE_ADVERTENCIAS = 'cia_advertencias';
const CHAVE_EXONERACOES = 'cia_exoneracoes';

// Securely check if the backend is connected to Supabase
export async function testarConexaoSupabase(url?: string, key?: string): Promise<boolean> {
  try {
    const response = await fetch('/api/supabase/status');
    const data = await response.json();
    return data.configured;
  } catch (e) {
    return false;
  }
}

// Proxied mock client mimicking the Supabase Client API, communicating securely with our server
export function obterSupabaseClient() {
  return {
    from: (table: string) => ({
      select: () => {
        console.warn('[Supabase Client Proxy] Direct select() is disabled. Use sincronizarTudoDoSupabase instead.');
        return {
          limit: () => ({ error: null, data: [] }),
          eq: () => ({ error: null, data: [] })
        };
      },
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

export const SQL_SCRIPT_GERAL = `-- SCRIPT SQL PARA CRIAR AS TABELAS NO SUPABASE
-- Copie e cole este script no SQL Editor do seu projeto Supabase.

CREATE TABLE IF NOT EXISTS configuracao_site (
  id VARCHAR PRIMARY KEY DEFAULT 'config_principal',
  nome_site VARCHAR DEFAULT 'POLÍCIA CIA',
  subtitulo_site VARCHAR DEFAULT 'Mesa de Operações Integradas • Brasília/DF',
  logo_texto VARCHAR DEFAULT 'CIA',
  logo_url VARCHAR,
  login_mensagem VARCHAR DEFAULT 'Acesso exclusivo para policiais e oficiais autorizados.',
  cargos_permissoes JSONB,
  webhook_discord VARCHAR
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
  tipo VARCHAR,
  image_url VARCHAR
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

-- Inserir configuração inicial se não existir
INSERT INTO configuracao_site (id, nome_site, subtitulo_site, logo_texto, login_mensagem)
VALUES ('config_principal', 'POLÍCIA CIA', 'Mesa de Operações Integradas • Brasília/DF', 'CIA', 'Acesso exclusivo para policiais e oficiais autorizados.')
ON CONFLICT (id) DO NOTHING;
`;

export async function sincronizarTudoDoSupabase(): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    const response = await fetch('/api/supabase/pull', { method: 'POST' });
    const res = await response.json();
    if (!response.ok || !res.success) {
      return { sucesso: false, mensagem: res.error || 'Falha ao baixar dados do servidor backend.' };
    }

    const { data } = res;

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
        webhookDiscord: active.webhook_discord || undefined
      };
      localStorage.setItem(CHAVE_CONFIGURACAO_SITE, JSON.stringify(mappedConfig));
    }

    // 2. Sync policiais
    if (data.policiais) {
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
          senhaHex: row.senha_hex
        };
      });
      localStorage.setItem(CHAVE_POLICIAIS, JSON.stringify(polRecord));
    }

    // 3. Sync avisos
    if (data.avisos) {
      const mapped = data.avisos.map((row: any) => ({
        id: row.id,
        titulo: row.titulo,
        conteudo: row.conteudo,
        autor: row.autor,
        data: row.data,
        tipo: row.tipo,
        imageUrl: row.image_url || undefined
      }));
      localStorage.setItem(CHAVE_AVISOS, JSON.stringify(mapped));
    }

    // 4. Sync testes
    if (data.testes) {
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
    if (data.movimentacoes) {
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

    // 6. Sync categorias
    if (data.categorias) {
      localStorage.setItem(CHAVE_CATEGORIAS, JSON.stringify(data.categorias));
    }

    // 7. Sync patentes
    if (data.patentes) {
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
    if (data.grupos) {
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
    if (data.treinamentos) {
      const mapped = data.treinamentos.map((row: any) => ({
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
    if (data.aplicacoes_treinamentos) {
      const mapped = data.aplicacoes_treinamentos.map((row: any) => ({
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
    if (data.xp_enviados) {
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
    if (data.advertencias) {
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
    if (data.exoneracoes) {
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
        webhook_discord: config.webhookDiscord || null
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
        senha_hex: pol.senhaHex
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
        image_url: a.imageUrl || null
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
      payload.categorias = JSON.parse(catsRaw);
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
        permissoes_cargos: t.permissoesCargos
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
        observacoes: a.observacoes || null
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
