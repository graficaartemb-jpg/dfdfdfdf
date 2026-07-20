import { obterClienteSupabase } from './supabase';
import { Policial, PatenteCategoria, Patente, Aviso, RecrutaTeste, Movimentacao, Grupo, Treinamento, AplicacaoTreinamento, EnvioXP } from '../types';

// Storage keys
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
const CHAVE_CONFIG = 'cia_site_config';

export interface SiteConfig {
  nome: string;
  logoUrl: string;
  masterNicks: string[];
  permissoes: Record<string, string[]>;
}

// Function to push a single item update to Supabase
export async function pushParaSupabase(tabela: string, item: any, idCol: string = 'id') {
  const supabase = obterClienteSupabase();
  if (!supabase) return;

  try {
    // Map item keys to snackcase for PostgreSQL compatibility if needed, 
    // or insert directly if the schema columns match the JSON keys.
    // Let's prepare payload based on the table
    let payload: any = {};

    if (tabela === 'cia_config') {
      payload = {
        id: item.id || 'principal',
        nome_site: item.nome,
        logo_url: item.logoUrl,
        master_nicks: item.masterNicks,
        permissoes: item.permissoes
      };
    } else if (tabela === 'cia_categorias') {
      payload = {
        id: item.id,
        nome: item.nome,
        subtitulo: item.subtitulo || null
      };
    } else if (tabela === 'cia_patentes') {
      payload = {
        id: item.id,
        categoria_id: item.categoriaId,
        nome: item.nome,
        ordem: item.ordem,
        equivalente: item.equivalente || null,
        salario: item.salario || null,
        insignia: item.insignia || null,
        responsabilidade: item.responsabilidade || null
      };
    } else if (tabela === 'cia_policiais') {
      payload = {
        nick: item.nick,
        cargo: item.cargo,
        categoria_id: item.categoriaId || null,
        data_registro: item.dataRegistro,
        avatar_habbo: item.avatarHabbo,
        pontos_promocao: item.pontosPromocao,
        presencas: item.presencas,
        streak: item.streak,
        senha_hex: item.senhaHex,
        biografia: item.biografia || null,
        medalhas: item.medalhas || [],
        ultimas_presencas: item.ultimasPresencas || []
      };
    } else if (tabela === 'cia_avisos') {
      payload = {
        id: item.id,
        titulo: item.titulo,
        conteudo: item.conteudo,
        autor: item.autor,
        data: item.data,
        tipo: item.tipo
      };
    } else if (tabela === 'cia_testes') {
      payload = {
        id: item.id,
        nick_recruta: item.nickRecruta,
        reprovado: item.reprovado,
        motivo_reprovacao: item.motivoReprovacao || null,
        respostas: item.respostas || [],
        examinador: item.examinador,
        data: item.data
      };
    } else if (tabela === 'cia_movimentacoes') {
      payload = {
        id: item.id,
        nick_policial: item.nickPolicial,
        tipo: item.tipo,
        cargo_anterior: item.cargoAnterior,
        cargo_novo: item.cargoNovo,
        motivo: item.motivo,
        autor: item.autor,
        data: item.data
      };
    } else if (tabela === 'cia_grupos') {
      payload = {
        id: item.id,
        nome: item.nome,
        sigla: item.sigla,
        descricao: item.descricao || null,
        url_imagem: item.urlImagem || null,
        publico: item.publico,
        verificado: item.verificado,
        aceita_membros: item.aceitaMembros,
        membros: item.membros || []
      };
    } else if (tabela === 'cia_treinamentos') {
      payload = {
        id: item.id,
        titulo: item.titulo,
        status: item.status,
        descricao: item.descricao || null,
        conteudo: item.conteudo || null,
        cargo_vinculavel: item.cargoVinculavel || null,
        patente_vinculavel_id: item.patenteVinculavelId || null,
        permissoes_cargos: item.permissoesCargos || []
      };
    } else if (tabela === 'cia_aplicacoes') {
      payload = {
        id: item.id,
        treinamento_id: item.treinamentoId,
        instrutor: item.instrutor,
        data: item.data,
        alunos: item.alunos || [],
        observacoes: item.observacoes || null
      };
    } else if (tabela === 'cia_xp_envios') {
      payload = {
        id: item.id,
        motivo: item.motivo,
        valor: item.valor,
        destinatarios: item.destinatarios || [],
        enviado_por: item.enviadoPor,
        data: item.data
      };
    }

    const { error } = await supabase.from(tabela).upsert(payload, { onConflict: idCol });
    if (error) {
      console.warn(`[Supabase Push Error] na tabela ${tabela}:`, error.message);
    }
  } catch (err) {
    console.error(`Erro ao empurrar dados para tabela ${tabela}:`, err);
  }
}

// Function to delete an item in Supabase
export async function deleteDeSupabase(tabela: string, id: string, idCol: string = 'id') {
  const supabase = obterClienteSupabase();
  if (!supabase) return;

  try {
    const { error } = await supabase.from(tabela).delete().eq(idCol, id);
    if (error) {
      console.warn(`[Supabase Delete Error] na tabela ${tabela}:`, error.message);
    }
  } catch (err) {
    console.error(`Erro ao deletar item da tabela ${tabela}:`, err);
  }
}

// Full Sync: Pulls all tables from Supabase and stores them locally
export async function sincronizarTudoDoSupabase(callbackDeSucesso?: () => void) {
  const supabase = obterClienteSupabase();
  if (!supabase) return false;

  try {
    console.log('Sincronizando todas as tabelas do Supabase...');

    // 1. Config
    const { data: configData } = await supabase.from('cia_config').select('*').eq('id', 'principal').single();
    if (configData) {
      const config: SiteConfig = {
        nome: configData.nome_site,
        logoUrl: configData.logo_url || '',
        masterNicks: configData.master_nicks || [],
        permissoes: configData.permissoes || {}
      };
      localStorage.setItem(CHAVE_CONFIG, JSON.stringify(config));
    }

    // 2. Categorias
    const { data: catData } = await supabase.from('cia_categorias').select('*');
    if (catData) {
      const categorias: PatenteCategoria[] = catData.map(c => ({
        id: c.id,
        nome: c.nome,
        subtitulo: c.subtitulo
      }));
      localStorage.setItem(CHAVE_CATEGORIAS, JSON.stringify(categorias));
    }

    // 3. Patentes
    const { data: patData } = await supabase.from('cia_patentes').select('*');
    if (patData) {
      const patentes: Patente[] = patData.map(p => ({
        id: p.id,
        categoriaId: p.categoria_id,
        nome: p.nome,
        ordem: p.ordem,
        equivalente: p.equivalente,
        salario: p.salario,
        insignia: p.insignia,
        responsabilidade: p.responsabilidade
      }));
      localStorage.setItem(CHAVE_PATENTES, JSON.stringify(patentes));
    }

    // 4. Policiais
    const { data: polData } = await supabase.from('cia_policiais').select('*');
    if (polData) {
      const policiais: Record<string, Policial & { senhaHex: string }> = {};
      polData.forEach(p => {
        policiais[p.nick.toLowerCase()] = {
          nick: p.nick,
          cargo: p.cargo,
          categoriaId: p.categoria_id,
          dataRegistro: p.data_registro,
          avatarHabbo: p.avatar_habbo,
          pontosPromocao: p.pontos_promocao,
          presencas: p.presencas,
          streak: p.streak,
          senhaHex: p.senha_hex,
          biografia: p.biografia,
          medalhas: p.medalhas || [],
          ultimasPresencas: p.ultimas_presencas || []
        };
      });
      localStorage.setItem(CHAVE_POLICIAIS, JSON.stringify(policiais));
    }

    // 5. Avisos
    const { data: avisosData } = await supabase.from('cia_avisos').select('*');
    if (avisosData) {
      const avisos: Aviso[] = avisosData.map(a => ({
        id: a.id,
        titulo: a.titulo,
        conteudo: a.conteudo,
        autor: a.autor,
        data: a.data,
        tipo: a.tipo
      }));
      localStorage.setItem(CHAVE_AVISOS, JSON.stringify(avisos));
    }

    // 6. Testes
    const { data: testesData } = await supabase.from('cia_testes').select('*');
    if (testesData) {
      const testes: RecrutaTeste[] = testesData.map(t => ({
        id: t.id,
        nickRecruta: t.nick_recruta,
        reprovado: t.reprovado,
        motivoReprovacao: t.motivo_reprovacao,
        respostas: t.respostas,
        examinador: t.examinador,
        data: t.data
      }));
      localStorage.setItem(CHAVE_TESTES, JSON.stringify(testes));
    }

    // 7. Movimentações
    const { data: movsData } = await supabase.from('cia_movimentacoes').select('*');
    if (movsData) {
      const movimentacoes: Movimentacao[] = movsData.map(m => ({
        id: m.id,
        nickPolicial: m.nick_policial,
        tipo: m.tipo,
        cargoAnterior: m.cargo_anterior,
        cargoNovo: m.cargo_novo,
        motivo: m.motivo,
        autor: m.autor,
        data: m.data
      }));
      localStorage.setItem(CHAVE_MOVIMENTACOES, JSON.stringify(movimentacoes));
    }

    // 8. Grupos
    const { data: grupData } = await supabase.from('cia_grupos').select('*');
    if (grupData) {
      const grupos: Grupo[] = grupData.map(g => ({
        id: g.id,
        nome: g.nome,
        sigla: g.sigla,
        descricao: g.descricao,
        urlImagem: g.url_imagem,
        publico: g.publico,
        verificado: g.verificado,
        aceitaMembros: g.aceita_membros,
        membros: g.membros
      }));
      localStorage.setItem(CHAVE_GRUPOS, JSON.stringify(grupos));
    }

    // 9. Treinamentos
    const { data: treData } = await supabase.from('cia_treinamentos').select('*');
    if (treData) {
      const treinamentos: Treinamento[] = treData.map(t => ({
        id: t.id,
        titulo: t.titulo,
        status: t.status,
        descricao: t.descricao,
        conteudo: t.conteudo,
        cargoVinculavel: t.cargo_vinculavel,
        patenteVinculavelId: t.patente_vinculavel_id,
        permissoesCargos: t.permissoes_cargos
      }));
      localStorage.setItem(CHAVE_TREINAMENTOS, JSON.stringify(treinamentos));
    }

    // 10. Aplicações de Treinamento
    const { data: aplData } = await supabase.from('cia_aplicacoes').select('*');
    if (aplData) {
      const aplicacoes: AplicacaoTreinamento[] = aplData.map(a => ({
        id: a.id,
        treinamentoId: a.treinamento_id,
        instrutor: a.instrutor,
        data: a.data,
        alunos: a.alunos,
        observacoes: a.observacoes
      }));
      localStorage.setItem(CHAVE_APLICACOES_TREINAMENTOS, JSON.stringify(aplicacoes));
    }

    // 11. Envios de XP
    const { data: xpData } = await supabase.from('cia_xp_envios').select('*');
    if (xpData) {
      const envios: EnvioXP[] = xpData.map(x => ({
        id: x.id,
        motivo: x.motivo,
        valor: x.valor,
        destinatarios: x.destinatarios,
        enviadoPor: x.enviado_por,
        data: x.data
      }));
      localStorage.setItem(CHAVE_XP_ENVIADOS, JSON.stringify(envios));
    }

    console.log('✓ Sincronização de tabelas com o Supabase concluída!');
    if (callbackDeSucesso) callbackDeSucesso();
    return true;
  } catch (err) {
    console.error('Erro na sincronização completa do Supabase:', err);
    return false;
  }
}

// Utility to push ALL current local storage data to Supabase (Upload/Seed)
export async function enviarDadosLocaisParaSupabase() {
  const supabase = obterClienteSupabase();
  if (!supabase) return { sucesso: false, mensagem: 'Supabase não conectado' };

  try {
    // 1. Config
    const configRaw = localStorage.getItem(CHAVE_CONFIG);
    if (configRaw) await pushParaSupabase('cia_config', JSON.parse(configRaw), 'id');

    // 2. Categorias
    const catsRaw = localStorage.getItem(CHAVE_CATEGORIAS);
    if (catsRaw) {
      const cats: PatenteCategoria[] = JSON.parse(catsRaw);
      for (const cat of cats) {
        await pushParaSupabase('cia_categorias', cat, 'id');
      }
    }

    // 3. Patentes
    const patsRaw = localStorage.getItem(CHAVE_PATENTES);
    if (patsRaw) {
      const pats: Patente[] = JSON.parse(patsRaw);
      for (const pat of pats) {
        await pushParaSupabase('cia_patentes', pat, 'id');
      }
    }

    // 4. Policiais
    const polsRaw = localStorage.getItem(CHAVE_POLICIAIS);
    if (polsRaw) {
      const pols: Record<string, Policial & { senhaHex: string }> = JSON.parse(polsRaw);
      for (const nick in pols) {
        await pushParaSupabase('cia_policiais', pols[nick], 'nick');
      }
    }

    // 5. Avisos
    const avisosRaw = localStorage.getItem(CHAVE_AVISOS);
    if (avisosRaw) {
      const avisos: Aviso[] = JSON.parse(avisosRaw);
      for (const av of avisos) {
        await pushParaSupabase('cia_avisos', av, 'id');
      }
    }

    // 6. Testes
    const testesRaw = localStorage.getItem(CHAVE_TESTES);
    if (testesRaw) {
      const testes: RecrutaTeste[] = JSON.parse(testesRaw);
      for (const t of testes) {
        await pushParaSupabase('cia_testes', t, 'id');
      }
    }

    // 7. Movimentações
    const movsRaw = localStorage.getItem(CHAVE_MOVIMENTACOES);
    if (movsRaw) {
      const movs: Movimentacao[] = JSON.parse(movsRaw);
      for (const m of movs) {
        await pushParaSupabase('cia_movimentacoes', m, 'id');
      }
    }

    // 8. Grupos
    const grupRaw = localStorage.getItem(CHAVE_GRUPOS);
    if (grupRaw) {
      const grups: Grupo[] = JSON.parse(grupRaw);
      for (const g of grups) {
        await pushParaSupabase('cia_grupos', g, 'id');
      }
    }

    // 9. Treinamentos
    const treRaw = localStorage.getItem(CHAVE_TREINAMENTOS);
    if (treRaw) {
      const tres: Treinamento[] = JSON.parse(treRaw);
      for (const t of tres) {
        await pushParaSupabase('cia_treinamentos', t, 'id');
      }
    }

    // 10. Aplicações de Treinamento
    const aplRaw = localStorage.getItem(CHAVE_APLICACOES_TREINAMENTOS);
    if (aplRaw) {
      const apls: AplicacaoTreinamento[] = JSON.parse(aplRaw);
      for (const a of apls) {
        await pushParaSupabase('cia_aplicacoes', a, 'id');
      }
    }

    // 11. Envios de XP
    const xpRaw = localStorage.getItem(CHAVE_XP_ENVIADOS);
    if (xpRaw) {
      const xps: EnvioXP[] = JSON.parse(xpRaw);
      for (const x of xps) {
        await pushParaSupabase('cia_xp_envios', x, 'id');
      }
    }

    return { sucesso: true, mensagem: 'Dados locais enviados e sincronizados com sucesso no Supabase!' };
  } catch (err: any) {
    console.error(err);
    return { sucesso: false, mensagem: 'Erro ao empurrar dados locais: ' + err.message };
  }
}
