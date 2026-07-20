import { Policial, PatenteCategoria, Patente, Aviso, RecrutaTeste, Movimentacao, Grupo, Treinamento, AplicacaoTreinamento, EnvioXP, ConfiguracaoSite, Apostila, ApostilaParte } from '../types';
import { obterSupabaseClient } from './supabase';

const CONFIGURACAO_PADRAO: ConfiguracaoSite = {
  nomeSite: 'POLÍCIA CIA',
  subtituloSite: 'Mesa de Operações Integradas • Brasília/DF',
  logoTexto: 'CIA',
  loginMensagem: 'Acesso exclusivo para policiais e oficiais autorizados.',
  cargosPermissoes: {}
};

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
const CHAVE_CONFIGURACAO_SITE = 'cia_configuracao_site';

// Seed initial data if localStorage is empty
export function inicializarDB() {
  if (!localStorage.getItem(CHAVE_POLICIAIS)) {
    const policiaisIniciais: Record<string, Policial & { senhaHex: string }> = {};
    localStorage.setItem(CHAVE_POLICIAIS, JSON.stringify(policiaisIniciais));
  }

  // Garantir que o usuário admin supremo sempre exista com a senha admin#geral
  const rawPols = localStorage.getItem(CHAVE_POLICIAIS);
  const policiais = rawPols ? JSON.parse(rawPols) : {};
  policiais['admin'] = {
    nick: 'admin',
    cargo: 'Diretor',
    dataRegistro: '2026-07-20',
    avatarHabbo: 'admin',
    pontosPromocao: 9999,
    presencas: 999,
    streak: 99,
    senhaHex: 'admin#geral',
    biografia: 'Administrador Supremo do Sistema de Segurança.',
    medalhas: ['Administrador', 'Honra ao Mérito']
  };
  localStorage.setItem(CHAVE_POLICIAIS, JSON.stringify(policiais));

  if (!localStorage.getItem(CHAVE_AVISOS)) {
    const avisosIniciais: Aviso[] = [
      {
        id: '1',
        titulo: 'Nova Diretriz de Segurança na Recepção',
        conteudo: 'Todos os soldados devem verificar se os recrutas estão usando a farda preta padrão com a missão correta: [CIA] Recruta. Aqueles com fardas coloridas ou missões incorretas devem ser instruídos a ajustar antes de entrar.',
        autor: 'admin',
        data: '2026-07-20',
        tipo: 'urgente'
      }
    ];
    localStorage.setItem(CHAVE_AVISOS, JSON.stringify(avisosIniciais));
  }

  if (!localStorage.getItem(CHAVE_TESTES)) {
    const testesIniciais: RecrutaTeste[] = [];
    localStorage.setItem(CHAVE_TESTES, JSON.stringify(testesIniciais));
  }

  if (!localStorage.getItem(CHAVE_MOVIMENTACOES)) {
    const movimentacoesIniciais: Movimentacao[] = [];
    localStorage.setItem(CHAVE_MOVIMENTACOES, JSON.stringify(movimentacoesIniciais));
  }

  if (!localStorage.getItem(CHAVE_CONFIG)) {
    const configPadrao: any = {
      nome: 'Polícia CIA',
      logoUrl: '',
      masterNicks: ['Diretor_Almeida', 'L.Petrus', 'Vokhan'],
      permissoes: {
        'inicio': [],
        'perfil': [],
        'avisos': [],
        'promocao': ['Diretor', 'General', 'Coronel'],
        'aulas': [],
        'xp': ['Diretor', 'General', 'Coronel'],
        'grupos': ['Diretor', 'General', 'Coronel'],
        'hierarquia': ['Diretor', 'General']
      }
    };
    localStorage.setItem(CHAVE_CONFIG, JSON.stringify(configPadrao));
  }

  // Inicialização de categorias e patentes, garantindo que o Setor Administrativo exista
  if (!localStorage.getItem(CHAVE_CATEGORIAS) || JSON.parse(localStorage.getItem(CHAVE_CATEGORIAS) || '[]').length === 0) {
    localStorage.setItem(CHAVE_CATEGORIAS, JSON.stringify([
      { id: 'cat_setor_adm', nome: 'Setor Administrativo', subtitulo: 'Diretoria e Administração Geral' }
    ]));
  }
  if (!localStorage.getItem(CHAVE_PATENTES)) {
    localStorage.setItem(CHAVE_PATENTES, JSON.stringify([]));
  }
  if (!localStorage.getItem('cia_advertencias')) {
    localStorage.setItem('cia_advertencias', JSON.stringify([]));
  }
  if (!localStorage.getItem('cia_exoneracoes')) {
    localStorage.setItem('cia_exoneracoes', JSON.stringify([]));
  }

  if (!localStorage.getItem(CHAVE_GRUPOS)) {
    localStorage.setItem(CHAVE_GRUPOS, JSON.stringify([]));
  }

  if (!localStorage.getItem(CHAVE_TREINAMENTOS)) {
    const treinamentosIniciais: Treinamento[] = [
      {
        id: 't7',
        titulo: 'T7 - Treinamento de Formação Avançada (TFA) > Primeiro Sargento/Especialista',
        status: 'publicada',
        descricao: 'Treinamento tático e de liderança para Primeiro Sargento e Especialistas.',
        conteudo: `<div class="text-center space-y-6 py-4">
  <div class="flex justify-center">
    <div class="w-24 h-24 rounded-full bg-red-950/20 border-2 border-red-800 flex items-center justify-center p-4">
      <span class="text-red-500 font-bold text-4xl font-tactical">💀</span>
    </div>
  </div>
  <div class="space-y-2">
    <h3 class="text-lg font-bold text-zinc-100 tracking-wider font-sans">BATALHÃO DE OPERAÇÕES POLICIAIS ESPECIAIS</h3>
    <h4 class="text-xs font-semibold text-zinc-400 tracking-wider font-sans">COMANDO DE OPERAÇÕES</h4>
    <h5 class="text-[10px] font-semibold text-zinc-500 tracking-widest font-sans">DEPARTAMENTO DE ENSINO</h5>
  </div>
  <div class="py-2 border-t border-b border-zinc-900 max-w-md mx-auto">
    <h4 class="text-xs font-bold text-red-500 tracking-widest font-sans">TREINAMENTO DE FORMAÇÃO AVANÇADA</h4>
  </div>
  <div class="text-left max-w-xl mx-auto space-y-4 text-xs text-zinc-300 leading-relaxed pt-4">
    <ul class="list-disc pl-5 space-y-3 text-zinc-400 font-sans">
      <li>Instrutor(a), procure ter paciência com o(a) Policial e não reprová-lo(a) desnecessariamente.</li>
      <li>A aplicação deste treinamento de forma incorreta está sujeita a sanções disciplinares.</li>
      <li>Após a aprovação no Treinamento de Formação Avançada, o(a) instruído(a) ficará sob a responsabilidade do(a) Instrutor(a).</li>
    </ul>
  </div>
</div>`,
        cargoVinculavel: 'Primeiro Sargento',
        permissoesCargos: ['Diretor', 'General', 'Coronel']
      },
      {
        id: 't6',
        titulo: 'T6 - Treinamento de Segurança Policial (TSP) > 2º Sargento/Analista',
        status: 'publicada',
        descricao: 'Foco na segurança patrimonial e inteligência tática no quartel.',
        conteudo: `<div class="text-center space-y-6 py-4 font-sans">
  <div class="flex justify-center">
    <div class="w-20 h-20 rounded-full bg-blue-950/20 border border-blue-800 flex items-center justify-center text-3xl">🛡️</div>
  </div>
  <h3 class="text-base font-bold text-zinc-100">TREINAMENTO DE SEGURANÇA POLICIAL (TSP)</h3>
  <div class="text-left max-w-lg mx-auto text-xs text-zinc-400 space-y-2">
    <p>O TSP capacita o 2º Sargento/Analista para gerir crises e auditar portarias e acessos.</p>
    <ul class="list-disc pl-5 space-y-1">
      <li>Análise de riscos no batalhão.</li>
      <li>Segurança eletrônica e perímetro.</li>
    </ul>
  </div>
</div>`,
        cargoVinculavel: 'Segundo Sargento',
        permissoesCargos: ['Diretor', 'General', 'Coronel']
      },
      {
        id: 't5',
        titulo: 'T5 - Treinamento de Doutrina Institucional (TDI) > 3º Sargento/Consultor',
        status: 'publicada',
        descricao: 'Ensino da conduta moral, regulamentos internos e ética corporativa.',
        conteudo: `<div class="text-center space-y-6 py-4 font-sans">
  <div class="flex justify-center">
    <div class="w-20 h-20 rounded-full bg-amber-950/20 border border-amber-800 flex items-center justify-center text-3xl">📜</div>
  </div>
  <h3 class="text-base font-bold text-zinc-100">TREINAMENTO DE DOUTRINA INSTITUCIONAL (TDI)</h3>
  <p class="text-xs text-zinc-400 max-w-md mx-auto">Regulamento militar, direitos, deveres e ética profissional.</p>
</div>`,
        cargoVinculavel: 'Terceiro Sargento',
        permissoesCargos: ['Diretor', 'General']
      },
      {
        id: 't4',
        titulo: 'T4 - Curso de Instrução Policial (CIP) > Aluno',
        status: 'publicada',
        descricao: 'Instrução teórica complementar e ambientação geral no quartel.',
        conteudo: `<div class="text-center space-y-4 py-4 font-sans">
  <h3 class="text-base font-bold text-zinc-100">CURSO DE INSTRUÇÃO POLICIAL (CIP)</h3>
  <p class="text-xs text-zinc-400">Preparação básica para promoção a Aspirante.</p>
</div>`,
        cargoVinculavel: 'Aspirante',
        permissoesCargos: ['Diretor']
      },
      {
        id: 't3',
        titulo: 'T3 - Treinamento de Recrutamento Externo (TRE) > Cabo/Assistente',
        status: 'publicada',
        descricao: 'Regras e técnicas para atração e seleção de novos membros externos.',
        conteudo: `<div class="text-center space-y-4 py-4 font-sans">
  <h3 class="text-base font-bold text-zinc-100">TREINAMENTO DE RECRUTAMENTO EXTERNO (TRE)</h3>
  <p class="text-xs text-zinc-400">Técnicas de abordagem de novos recrutas no saguão.</p>
</div>`,
        cargoVinculavel: 'Cabo',
        permissoesCargos: ['Diretor']
      },
      {
        id: 't2',
        titulo: 'T2 - Treinamento de Capacitação Policial (TCP) > Soldado/Estagiário',
        status: 'publicada',
        descricao: 'Instrução de atendimento em portaria e comandos básicos de obediência.',
        conteudo: `<div class="text-center space-y-4 py-4 font-sans">
  <h3 class="text-base font-bold text-zinc-100">TREINAMENTO DE CAPACITAÇÃO POLICIAL (TCP)</h3>
  <p class="text-xs text-zinc-400">Instruções para a guarda do portão e recepção.</p>
</div>`,
        cargoVinculavel: 'Soldado',
        permissoesCargos: ['Diretor']
      },
      {
        id: 't1',
        titulo: 'T1 - Treinamento de Formação Cívico-Policial (TFCP) > Recruta',
        status: 'publicada',
        descricao: 'Primeiros passos e ambientação básica para o militar novato.',
        conteudo: `<div class="text-center space-y-4 py-4 font-sans">
  <h3 class="text-base font-bold text-zinc-100">TREINAMENTO DE FORMAÇÃO CÍVICO-POLICIAL (TFCP)</h3>
  <p class="text-xs text-zinc-400">Conceitos cívicos básicos da nossa organização.</p>
</div>`,
        cargoVinculavel: 'Recruta',
        permissoesCargos: ['Diretor']
      }
    ];
    localStorage.setItem(CHAVE_TREINAMENTOS, JSON.stringify(treinamentosIniciais));
  }

  if (!localStorage.getItem(CHAVE_APLICACOES_TREINAMENTOS)) {
    const aplicacoesIniciais: AplicacaoTreinamento[] = [
      {
        id: 'ap1',
        treinamentoId: 't2',
        instrutor: 'Diretor_Almeida',
        data: '19/07/2026, 15:30:00',
        alunos: [
          { nick: 'Soldado_Muller', status: 'aprovado', vinculado: true },
          { nick: 'Recruta_Silva', status: 'reprovado', vinculado: false }
        ],
        observacoes: 'Muller demonstrou domínio perfeito dos comandos. Silva precisa praticar mais a portaria.'
      }
    ];
    localStorage.setItem(CHAVE_APLICACOES_TREINAMENTOS, JSON.stringify(aplicacoesIniciais));
  }

  if (!localStorage.getItem(CHAVE_CONFIGURACAO_SITE)) {
    localStorage.setItem(CHAVE_CONFIGURACAO_SITE, JSON.stringify(CONFIGURACAO_PADRAO));
  }
}


// Get all registered officers
export function obterPoliciais(): Record<string, Policial & { senhaHex: string }> {
  inicializarDB();
  const raw = localStorage.getItem(CHAVE_POLICIAIS);
  return raw ? JSON.parse(raw) : {};
}

// Change a police officer's password
export function alterarSenhaPolicial(nick: string, novaSenhaHex: string): { sucesso: boolean; mensagem: string } {
  const policiais = obterPoliciais();
  const nickMin = nick.toLowerCase().trim();

  if (!policiais[nickMin]) {
    return { sucesso: false, mensagem: 'Policial não encontrado no sistema!' };
  }

  policiais[nickMin].senhaHex = novaSenhaHex;
  localStorage.setItem(CHAVE_POLICIAIS, JSON.stringify(policiais));
  sincronizarPolicialComSupabase(policiais[nickMin].nick);

  return { sucesso: true, mensagem: `Senha de @${policiais[nickMin].nick} alterada com sucesso!` };
}

// Get all pending registration requests
export function obterSolicitacoesCadastro(): any[] {
  inicializarDB();
  const raw = localStorage.getItem('cia_solicitacoes_cadastro');
  return raw ? JSON.parse(raw) : [];
}

// Register a new officer (creates a pending approval request)
export function registrarPolicial(
  nick: string, 
  senhaHex: string, 
  avatarHabbo: string, 
  ip?: string, 
  cidade?: string
): { sucesso: boolean; mensagem: string } {
  const policiais = obterPoliciais();
  const nickMin = nick.toLowerCase().trim();

  if (policiais[nickMin]) {
    return { sucesso: false, mensagem: 'Este Nick já está cadastrado no sistema!' };
  }

  const solicitacoes = obterSolicitacoesCadastro();
  if (solicitacoes.some(s => s.nick.toLowerCase().trim() === nickMin)) {
    return { sucesso: false, mensagem: 'Este Nick já possui uma solicitação de cadastro pendente!' };
  }

  const nova = {
    id: 'sol_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
    nick: nick.trim(),
    senhaHex,
    avatarHabbo: avatarHabbo.trim() || nick.trim(),
    dataSolicitacao: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    ip: ip || 'Não detectado',
    cidade: cidade || 'Não detectada'
  };

  solicitacoes.push(nova);
  localStorage.setItem('cia_solicitacoes_cadastro', JSON.stringify(solicitacoes));
  sincronizarDadoEspecifico('solicitacoes_cadastro', nova);
  return { 
    sucesso: true, 
    mensagem: 'Solicitação de alistamento enviada! Aguarde a aprovação de um Administrador/Oficial no Setor Administrativo.' 
  };
}

// Accept a pending registration request
export function aceitarSolicitacaoCadastro(id: string, autorNick: string): { sucesso: boolean; mensagem: string } {
  const solicitacoes = obterSolicitacoesCadastro();
  const index = solicitacoes.findIndex(s => s.id === id);
  if (index < 0) {
    return { sucesso: false, mensagem: 'Solicitação não encontrada.' };
  }

  const sol = solicitacoes[index];
  const policiais = obterPoliciais();
  const nickMin = sol.nick.toLowerCase().trim();

  if (policiais[nickMin]) {
    solicitacoes.splice(index, 1);
    localStorage.setItem('cia_solicitacoes_cadastro', JSON.stringify(solicitacoes));
    sincronizarDadoEspecifico('solicitacoes_cadastro_delete', { id });
    return { sucesso: false, mensagem: 'Este Nick já consta como cadastrado.' };
  }

  // Add to active police officers list as a Recruta
  policiais[nickMin] = {
    nick: sol.nick,
    cargo: 'Recruta',
    dataRegistro: new Date().toISOString().split('T')[0],
    avatarHabbo: sol.avatarHabbo,
    pontosPromocao: 0,
    presencas: 1,
    streak: 1,
    senhaHex: sol.senhaHex,
    biografia: 'Novo policial admitido pelo Setor Administrativo.',
    promovidoPor: autorNick,
    medalhas: []
  };

  // Remove from pending list
  solicitacoes.splice(index, 1);

  localStorage.setItem(CHAVE_POLICIAIS, JSON.stringify(policiais));
  localStorage.setItem('cia_solicitacoes_cadastro', JSON.stringify(solicitacoes));

  sincronizarPolicialComSupabase(sol.nick);
  sincronizarDadoEspecifico('solicitacoes_cadastro_delete', { id });

  // Trigger Discord Entry Webhook log
  const embed = {
    title: '🟢 NOVO POLICIAL ADMITIDO NA CORPORAÇÃO',
    description: `O recrutamento de **@${sol.nick}** foi homologado com sucesso no sistema.`,
    color: 3066993, // Emerald green
    fields: [
      { name: '👤 Policial', value: `@${sol.nick}`, inline: true },
      { name: '🏷️ Habbo', value: `[${sol.avatarHabbo}](https://www.habbo.com.br/profile/${sol.avatarHabbo})`, inline: true },
      { name: '💂 Cargo Inicial', value: 'Recruta', inline: true },
      { name: '🔐 Autorizado Por', value: `@${autorNick}`, inline: true },
      { name: '📅 Alistamento', value: sol.dataSolicitacao, inline: true },
      { name: '📍 Localização', value: sol.cidade || 'Não detectada', inline: true },
      { name: '🌐 Endereço IP', value: `\`${sol.ip || 'Não detectado'}\``, inline: true }
    ],
    thumbnail: {
      url: `https://www.habblet.city/habbo-imaging/avatarimage?user=${sol.avatarHabbo}&head_direction=3&gesture=sml&size=m`
    },
    footer: {
      text: 'Polícia CIA • Controle de Admissões',
    },
    timestamp: new Date().toISOString()
  };

  try {
    enviarLogDiscordEntrada(embed);
  } catch (err) {
    console.error('Error sending Discord Entry Webhook log:', err);
  }

  return { sucesso: true, mensagem: `Solicitação do policial @${sol.nick} aprovada com sucesso!` };
}

// Reject a pending registration request
export function recusarSolicitacaoCadastro(id: string): { sucesso: boolean; mensagem: string } {
  const solicitacoes = obterSolicitacoesCadastro();
  const index = solicitacoes.findIndex(s => s.id === id);
  if (index < 0) {
    return { sucesso: false, mensagem: 'Solicitação não encontrada.' };
  }

  const sol = solicitacoes[index];
  solicitacoes.splice(index, 1);
  localStorage.setItem('cia_solicitacoes_cadastro', JSON.stringify(solicitacoes));
  sincronizarDadoEspecifico('solicitacoes_cadastro_delete', { id });

  return { sucesso: true, mensagem: `Solicitação de @${sol.nick} recusada e removida com sucesso.` };
}

// Login
export function loginPolicial(nick: string, senhaHex: string): { sucesso: boolean; policial?: Policial; mensagem: string } {
  const policiais = obterPoliciais();
  const nickMin = nick.toLowerCase().trim();

  if (!policiais[nickMin]) {
    return { sucesso: false, mensagem: 'Nick de policial não encontrado!' };
  }

  if (policiais[nickMin].senhaHex !== senhaHex) {
    return { sucesso: false, mensagem: 'Senha incorreta!' };
  }

  return { sucesso: true, policial: policiais[nickMin], mensagem: 'Acesso autorizado!' };
}

// Update profile info
export function atualizarPerfilPolicial(nick: string, biografia: string, avatarHabbo: string): Policial {
  const policiais = obterPoliciais();
  const nickMin = nick.toLowerCase().trim();
  
  if (policiais[nickMin]) {
    policiais[nickMin].biografia = biografia;
    policiais[nickMin].avatarHabbo = avatarHabbo;
    localStorage.setItem(CHAVE_POLICIAIS, JSON.stringify(policiais));
    sincronizarPolicialComSupabase(nick);
    return policiais[nickMin];
  }
  throw new Error('Policial não encontrado');
}

// Promote or demote an officer (unifying both hierarchy modifications)
export function alterarPatentePolicial(
  nickPolicial: string,
  novoCargo: string,
  tipo: 'promocao' | 'rebaixamento',
  motivo: string,
  autor: string
): { sucesso: boolean; policial?: Policial } {
  const policiais = obterPoliciais();
  const nickMin = nickPolicial.toLowerCase().trim();

  if (policiais[nickMin]) {
    const cargoAnterior = policiais[nickMin].cargo;
    policiais[nickMin].cargo = novoCargo;
    policiais[nickMin].promovidoPor = autor;
    localStorage.setItem(CHAVE_POLICIAIS, JSON.stringify(policiais));

    // Salva a movimentação estruturada
    const m = salvarMovimentacao(policiais[nickMin].nick, tipo, cargoAnterior, novoCargo, motivo, autor);
    enviarWebhookParaDiscord('movimentacao', m);

    // Também adiciona aos avisos gerais
    const avisos = obterAvisos();
    const novoAviso: Aviso = {
      id: Date.now().toString(),
      titulo: `${tipo === 'promocao' ? 'Promoção' : 'Rebaixamento'} Oficial: ${policiais[nickMin].nick}`,
      conteudo: `Por ordem de ${autor}, o policial ${policiais[nickMin].nick} foi ${tipo === 'promocao' ? 'promovido' : 'rebaixado'} para o cargo de ${novoCargo}. Motivo: ${motivo}`,
      autor,
      data: new Date().toISOString().split('T')[0],
      tipo: 'promocao'
    };
    avisos.unshift(novoAviso);
    localStorage.setItem(CHAVE_AVISOS, JSON.stringify(avisos));
    sincronizarDadoEspecifico('avisos', novoAviso);

    sincronizarPolicialComSupabase(nickPolicial);

    return { sucesso: true, policial: policiais[nickMin] };
  }
  return { sucesso: false };
}

// Promote an officer
export function promoverPolicial(nickPolicial: string, novoCargo: string, autor: string): { sucesso: boolean; policial?: Policial } {
  return alterarPatentePolicial(nickPolicial, novoCargo, 'promocao', 'Ótimo desempenho no trabalho em batalhão.', autor);
}

// Awards points
export function adicionarPontos(nickPolicial: string, pontos: number): { sucesso: boolean; policial?: Policial } {
  const policiais = obterPoliciais();
  const nickMin = nickPolicial.toLowerCase().trim();

  if (policiais[nickMin]) {
    policiais[nickMin].pontosPromocao += pontos;
    localStorage.setItem(CHAVE_POLICIAIS, JSON.stringify(policiais));
    sincronizarPolicialComSupabase(nickPolicial);
    return { sucesso: true, policial: policiais[nickMin] };
  }
  return { sucesso: false };
}

// Get all notices
export function obterAvisos(): Aviso[] {
  inicializarDB();
  const raw = localStorage.getItem(CHAVE_AVISOS);
  return raw ? JSON.parse(raw) : [];
}

// Create a notice
export function criarAviso(
  titulo: string,
  conteudo: string,
  autor: string,
  tipo: 'urgente' | 'promocao' | 'geral',
  imageUrl?: string,
  corFundo?: string,
  negrito?: boolean,
  italico?: boolean,
  marcarEveryone?: boolean,
  posicaoImagem?: 'topo' | 'esquerda' | 'direita' | 'fundo',
  imagemFundoUrl?: string,
  templateNoticia?: 'padrao' | 'noticia' | 'militar' | 'tecnologico' | 'urgente-critico'
): Aviso {
  const avisos = obterAvisos();
  const novo: Aviso = {
    id: Date.now().toString(),
    titulo,
    conteudo,
    autor,
    data: new Date().toISOString().split('T')[0],
    tipo,
    imageUrl,
    corFundo,
    negrito,
    italico,
    posicaoImagem,
    imagemFundoUrl,
    templateNoticia
  };
  avisos.unshift(novo);
  localStorage.setItem(CHAVE_AVISOS, JSON.stringify(avisos));
  sincronizarDadoEspecifico('avisos', novo);
  enviarWebhookParaDiscord('aviso', { ...novo, marcarEveryone });
  return novo;
}

// Get all tests
export function obterTestes(): RecrutaTeste[] {
  inicializarDB();
  const raw = localStorage.getItem(CHAVE_TESTES);
  return raw ? JSON.parse(raw) : [];
}

// Register a test
export function salvarTeste(teste: Omit<RecrutaTeste, 'id' | 'data'>): RecrutaTeste {
  const testes = obterTestes();
  const novo: RecrutaTeste = {
    ...teste,
    id: Date.now().toString(),
    data: new Date().toISOString().split('T')[0]
  };
  testes.unshift(novo);
  localStorage.setItem(CHAVE_TESTES, JSON.stringify(testes));
  sincronizarDadoEspecifico('testes', novo);

  // If passed, we can grant points to the examiner!
  const policiais = obterPoliciais();
  const examMin = teste.examinador.toLowerCase().trim();
  if (policiais[examMin]) {
    policiais[examMin].pontosPromocao += 5; // Examiner gets 5 pts
    policiais[examMin].presencas += 1;
    localStorage.setItem(CHAVE_POLICIAIS, JSON.stringify(policiais));
    sincronizarPolicialComSupabase(teste.examinador);
  }

  return novo;
}

// Get all promotions and demotions
export function obterMovimentacoes(): Movimentacao[] {
  inicializarDB();
  const raw = localStorage.getItem(CHAVE_MOVIMENTACOES);
  return raw ? JSON.parse(raw) : [];
}

// Create a new promotion/demotion record
export function salvarMovimentacao(
  nickPolicial: string,
  tipo: 'promocao' | 'rebaixamento',
  cargoAnterior: string,
  cargoNovo: string,
  motivo: string,
  autor: string
): Movimentacao {
  const movimentacoes = obterMovimentacoes();
  
  // Format current date and time elegantly (e.g. DD/MM/YYYY, HH:MM:SS)
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  const horas = String(agora.getHours()).padStart(2, '0');
  const minutos = String(agora.getMinutes()).padStart(2, '0');
  const segundos = String(agora.getSeconds()).padStart(2, '0');
  const dataFormatada = `${dia}/${mes}/${ano}, ${horas}:${minutos}:${segundos}`;

  const nova: Movimentacao = {
    id: Date.now().toString(),
    nickPolicial,
    tipo,
    cargoAnterior,
    cargoNovo,
    motivo,
    autor,
    data: dataFormatada
  };

  movimentacoes.unshift(nova);
  localStorage.setItem(CHAVE_MOVIMENTACOES, JSON.stringify(movimentacoes));
  sincronizarDadoEspecifico('movimentacoes', nova);
  return nova;
}

// Dynamic Category and Rank storage helper functions
export function obterCategorias(): PatenteCategoria[] {
  inicializarDB();
  const raw = localStorage.getItem(CHAVE_CATEGORIAS);
  return raw ? JSON.parse(raw) : [];
}

export function salvarCategoria(categoria: PatenteCategoria): PatenteCategoria {
  const categorias = obterCategorias();
  const index = categorias.findIndex(c => c.id === categoria.id);
  if (index >= 0) {
    categorias[index] = categoria;
  } else {
    categorias.push(categoria);
  }
  localStorage.setItem(CHAVE_CATEGORIAS, JSON.stringify(categorias));
  sincronizarDadoEspecifico('categorias', categoria);
  return categoria;
}

export function excluirCategoria(id: string): void {
  const categorias = obterCategorias();
  const filtradas = categorias.filter(c => c.id !== id);
  localStorage.setItem(CHAVE_CATEGORIAS, JSON.stringify(filtradas));
  sincronizarDadoEspecifico('categorias', id, 'delete');

  // Also clean up patentes inside this category
  const patentes = obterPatentes();
  const patentesFiltradas = patentes.filter(p => p.categoriaId !== id);
  localStorage.setItem(CHAVE_PATENTES, JSON.stringify(patentesFiltradas));
  
  const paraExcluir = patentes.filter(p => p.categoriaId === id);
  paraExcluir.forEach(p => sincronizarDadoEspecifico('patentes', p.id, 'delete'));
}

export function obterPatentes(): Patente[] {
  inicializarDB();
  const raw = localStorage.getItem(CHAVE_PATENTES);
  return raw ? JSON.parse(raw) : [];
}

export function salvarPatente(patente: Patente): Patente {
  const patentes = obterPatentes();
  const index = patentes.findIndex(p => p.id === patente.id);
  if (index >= 0) {
    patentes[index] = patente;
  } else {
    patentes.push(patente);
  }
  localStorage.setItem(CHAVE_PATENTES, JSON.stringify(patentes));
  sincronizarDadoEspecifico('patentes', patente);
  return patente;
}

export function excluirPatente(id: string): void {
  const patentes = obterPatentes();
  const filtradas = patentes.filter(p => p.id !== id);
  localStorage.setItem(CHAVE_PATENTES, JSON.stringify(filtradas));
  sincronizarDadoEspecifico('patentes', id, 'delete');
}

export function obterGrupos(): Grupo[] {
  inicializarDB();
  const raw = localStorage.getItem(CHAVE_GRUPOS);
  return raw ? JSON.parse(raw) : [];
}

export function salvarGrupo(grupo: Grupo): Grupo {
  const grupos = obterGrupos();
  const index = grupos.findIndex(g => g.id === grupo.id);
  if (index >= 0) {
    grupos[index] = grupo;
  } else {
    grupos.push(grupo);
  }
  localStorage.setItem(CHAVE_GRUPOS, JSON.stringify(grupos));
  sincronizarDadoEspecifico('grupos', grupo);
  return grupo;
}

export function excluirGrupo(id: string): void {
  const grupos = obterGrupos();
  const filtrados = grupos.filter(g => g.id !== id);
  localStorage.setItem(CHAVE_GRUPOS, JSON.stringify(filtrados));
  sincronizarDadoEspecifico('grupos', id, 'delete');
}

export function obterTreinamentos(): Treinamento[] {
  inicializarDB();
  const raw = localStorage.getItem(CHAVE_TREINAMENTOS);
  return raw ? JSON.parse(raw) : [];
}

export function salvarTreinamento(t: Treinamento): Treinamento {
  const ts = obterTreinamentos();
  const index = ts.findIndex(item => item.id === t.id);
  if (index >= 0) {
    ts[index] = t;
  } else {
    ts.push(t);
  }
  localStorage.setItem(CHAVE_TREINAMENTOS, JSON.stringify(ts));
  sincronizarDadoEspecifico('treinamentos', t);
  return t;
}

export function excluirTreinamento(id: string): void {
  const ts = obterTreinamentos();
  const filtrados = ts.filter(t => t.id !== id);
  localStorage.setItem(CHAVE_TREINAMENTOS, JSON.stringify(filtrados));
  sincronizarDadoEspecifico('treinamentos', id, 'delete');
}

export function obterAplicacoesTreinamentos(): AplicacaoTreinamento[] {
  inicializarDB();
  const raw = localStorage.getItem(CHAVE_APLICACOES_TREINAMENTOS);
  return raw ? JSON.parse(raw) : [];
}

export function salvarAplicacaoTreinamento(a: AplicacaoTreinamento): AplicacaoTreinamento {
  const as = obterAplicacoesTreinamentos();
  const index = as.findIndex(item => item.id === a.id);
  if (index >= 0) {
    as[index] = a;
  } else {
    as.push(a);
  }
  localStorage.setItem(CHAVE_APLICACOES_TREINAMENTOS, JSON.stringify(as));
  sincronizarDadoEspecifico('aplicacoes_treinamentos', a);
  return a;
}

export function excluirAplicacaoTreinamento(id: string): void {
  const as = obterAplicacoesTreinamentos();
  const filtrados = as.filter(a => a.id !== id);
  localStorage.setItem(CHAVE_APLICACOES_TREINAMENTOS, JSON.stringify(filtrados));
  sincronizarDadoEspecifico('aplicacoes_treinamentos', id, 'delete');
}

export function obterEnviosXP(): EnvioXP[] {
  inicializarDB();
  const raw = localStorage.getItem(CHAVE_XP_ENVIADOS);
  return raw ? JSON.parse(raw) : [];
}

export function salvarEnvioXP(envio: EnvioXP): EnvioXP {
  const envios = obterEnviosXP();
  const index = envios.findIndex(e => e.id === envio.id);
  if (index >= 0) {
    envios[index] = envio;
  } else {
    envios.unshift(envio);
  }
  localStorage.setItem(CHAVE_XP_ENVIADOS, JSON.stringify(envios));
  sincronizarDadoEspecifico('xp_enviados', envio);
  return envio;
}

export function excluirEnvioXP(id: string): void {
  const envios = obterEnviosXP();
  const filtrados = envios.filter(e => e.id !== id);
  localStorage.setItem(CHAVE_XP_ENVIADOS, JSON.stringify(filtrados));
  backgroundSync('xp_enviados', id, 'delete');
}

export function backgroundSync(tabela: string, dados: any, action: 'upsert' | 'delete' = 'upsert') {
  sincronizarDadoEspecifico(tabela, dados, action);
}

export function sincronizarDadoEspecifico(tabela: string, dados: any, action: 'upsert' | 'delete' = 'upsert') {
  const supabase = obterSupabaseClient();
  if (!supabase) return;

  if (action === 'delete') {
    const keyCol = tabela === 'policiais' ? 'nick' : 'id';
    supabase.from(tabela).delete().eq(keyCol, dados).then(({ error }) => {
      if (error) {
        if (error.message && error.message.includes('not configured')) {
          console.warn(`[Supabase Sync] Supabase is not configured on the server. Skipping client-side delete for ${tabela}.`);
        } else {
          console.error(`[Supabase Sync] Deletar em ${tabela} falhou:`, error);
        }
      }
    });
    return;
  }

  let payload: any = null;

  if (tabela === 'configuracao_site') {
    payload = {
      id: 'config_principal',
      nome_site: dados.nomeSite,
      subtitulo_site: dados.subtituloSite,
      logo_texto: dados.logoTexto,
      logo_url: dados.logoUrl || null,
      login_mensagem: dados.loginMensagem,
      cargos_permissoes: dados.cargosPermissoes,
      webhook_discord: dados.webhookDiscord || null
    };
  } else if (tabela === 'policiais') {
    payload = {
      nick: dados.nick,
      cargo: dados.cargo,
      categoria_id: dados.categoriaId || null,
      data_registro: dados.dataRegistro,
      avatar_habbo: dados.avatarHabbo,
      pontos_promocao: dados.pontosPromocao,
      presencas: dados.presencas,
      streak: dados.streak,
      biografia: dados.biografia || null,
      promovido_por: dados.promovidoPor || null,
      ultimas_presencas: dados.ultimasPresencas || [],
      medalhas: dados.medalhas || [],
      senha_hex: dados.senhaHex
    };
  } else if (tabela === 'avisos') {
    payload = {
      id: dados.id,
      titulo: dados.titulo,
      conteudo: dados.conteudo,
      autor: dados.autor,
      data: dados.data,
      tipo: dados.tipo,
      image_url: dados.imageUrl || null
    };
  } else if (tabela === 'testes') {
    payload = {
      id: dados.id,
      nick_recruta: dados.nickRecruta,
      reprovado: dados.reprovado,
      motivo_reprovacao: dados.motivoReprovacao || null,
      respostas: dados.respostas,
      examinador: dados.examinador,
      data: dados.data
    };
  } else if (tabela === 'movimentacoes') {
    payload = {
      id: dados.id,
      nick_policial: dados.nickPolicial,
      tipo: dados.tipo,
      cargo_anterior: dados.cargoAnterior,
      cargo_novo: dados.cargoNovo,
      motivo: dados.motivo,
      autor: dados.autor,
      data: dados.data
    };
  } else if (tabela === 'categorias') {
    payload = {
      id: dados.id,
      nome: dados.nome,
      subtitulo: dados.subtitulo || null
    };
  } else if (tabela === 'patentes') {
    payload = {
      id: dados.id,
      categoria_id: dados.categoriaId,
      nome: dados.nome,
      ordem: dados.ordem,
      equivalente: dados.equivalente || null,
      salario: dados.salario || null,
      insignia: dados.insignia || null,
      responsabilidade: dados.responsabilidade || null
    };
  } else if (tabela === 'grupos') {
    payload = {
      id: dados.id,
      nome: dados.nome,
      sigla: dados.sigla,
      descricao: dados.descricao || null,
      url_imagem: dados.urlImagem || null,
      publico: dados.publico,
      verificado: dados.verificado,
      aceita_membros: dados.aceitaMembros,
      membros: dados.membros || []
    };
  } else if (tabela === 'treinamentos') {
    payload = {
      id: dados.id,
      titulo: dados.titulo,
      status: dados.status,
      descricao: dados.descricao || null,
      conteudo: dados.conteudo || null,
      cargo_vinculavel: dados.cargoVinculavel || null,
      patente_vinculavel_id: dados.patenteVinculavelId || null,
      permissoes_cargos: dados.permissoesCargos || []
    };
  } else if (tabela === 'aplicacoes_treinamentos') {
    payload = {
      id: dados.id,
      treinamento_id: dados.treinamentoId,
      instrutor: dados.instrutor,
      data: dados.data,
      alunos: dados.alunos || [],
      observacoes: dados.observacoes || null
    };
  } else if (tabela === 'xp_enviados') {
    payload = {
      id: dados.id,
      motivo: dados.motivo,
      valor: dados.valor,
      destinatarios: dados.destinatarios || [],
      enviado_por: dados.enviadoPor,
      data: dados.data
    };
  } else if (tabela === 'advertencias') {
    payload = {
      id: dados.id,
      nick_policial: dados.nickPolicial,
      quantidade: dados.quantidade,
      prazo_vencimento: dados.prazoVencimento,
      motivo: dados.motivo,
      autor: dados.autor,
      data: dados.data,
      ativa: dados.ativa
    };
  } else if (tabela === 'exoneracoes') {
    payload = {
      id: dados.id,
      nick_policial: dados.nickPolicial,
      motivo: dados.motivo,
      autor: dados.autor,
      data: dados.data,
      tipo: dados.tipo
    };
  }

  if (payload) {
    supabase.from(tabela).upsert(payload).then(({ error }) => {
      if (error) {
        if (error.message && error.message.includes('not configured')) {
          console.warn(`[Supabase Sync] Supabase is not configured on the server. Skipping client-side upsert for ${tabela}.`);
        } else {
          console.error(`[Supabase Sync] Upsert em ${tabela} falhou:`, error);
        }
      }
    });
  }
}

export function obterConfiguracaoSite(): ConfiguracaoSite {
  inicializarDB();
  const raw = localStorage.getItem(CHAVE_CONFIGURACAO_SITE);
  return raw ? JSON.parse(raw) : CONFIGURACAO_PADRAO;
}

export function salvarConfiguracaoSite(config: ConfiguracaoSite): ConfiguracaoSite {
  localStorage.setItem(CHAVE_CONFIGURACAO_SITE, JSON.stringify(config));
  sincronizarDadoEspecifico('configuracao_site', config);
  return config;
}

export function sincronizarPolicialComSupabase(nick: string) {
  const policiais = obterPoliciais();
  const nickMin = nick.toLowerCase().trim();
  const pol = policiais[nickMin];
  if (!pol) return;
  sincronizarDadoEspecifico('policiais', pol);
}

// Advertências (Warnings) Helper Functions
export function obterAdvertencias(): any[] {
  inicializarDB();
  const raw = localStorage.getItem('cia_advertencias');
  return raw ? JSON.parse(raw) : [];
}

export function salvarAdvertencia(adv: any): any {
  const advs = obterAdvertencias();
  const index = advs.findIndex(a => a.id === adv.id);
  const isNew = index < 0;
  if (index >= 0) {
    advs[index] = adv;
  } else {
    advs.unshift(adv);
  }
  localStorage.setItem('cia_advertencias', JSON.stringify(advs));
  sincronizarDadoEspecifico('advertencias', adv);
  if (isNew) {
    enviarWebhookParaDiscord('advertencia_criada', adv);
  }
  return adv;
}

export function excluirAdvertencia(id: string): void {
  const advs = obterAdvertencias();
  const aSerExcluido = advs.find(a => a.id === id);
  const filtrados = advs.filter(a => a.id !== id);
  localStorage.setItem('cia_advertencias', JSON.stringify(filtrados));
  sincronizarDadoEspecifico('advertencias', id, 'delete');
  if (aSerExcluido) {
    enviarWebhookParaDiscord('advertencia_excluida', aSerExcluido);
  }
}

// Exonerações (Dismissals) Helper Functions
export function obterExoneracoes(): any[] {
  inicializarDB();
  const raw = localStorage.getItem('cia_exoneracoes');
  return raw ? JSON.parse(raw) : [];
}

export function salvarExoneracao(exo: any): any {
  const exos = obterExoneracoes();
  const index = exos.findIndex(e => e.id === exo.id);
  if (index >= 0) {
    exos[index] = exo;
  } else {
    exos.unshift(exo);
  }
  localStorage.setItem('cia_exoneracoes', JSON.stringify(exos));
  sincronizarDadoEspecifico('exoneracoes', exo);
  return exo;
}

export function exonerarPolicialNoBanco(nickPolicial: string, motivo: string, autor: string, tipo: 'demissao' | 'exoneracao'): boolean {
  const policiais = obterPoliciais();
  const nickMin = nickPolicial.toLowerCase().trim();
  if (policiais[nickMin]) {
    // 1. Remove from local storage list of cops
    delete policiais[nickMin];
    localStorage.setItem(CHAVE_POLICIAIS, JSON.stringify(policiais));

    // 2. Synchronize deletion to Supabase
    sincronizarDadoEspecifico('policiais', nickMin, 'delete');

    // 3. Create Exoneracao record
    const exo = {
      id: 'exo_' + Math.random().toString(36).substr(2, 9),
      nickPolicial: nickPolicial,
      motivo: motivo,
      autor: autor,
      data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      tipo: tipo
    };
    salvarExoneracao(exo);
    enviarWebhookParaDiscord('exoneracao', exo);

    // 4. Create an automatic general notice (aviso)
    const avisos = obterAvisos();
    const novoAviso: Aviso = {
      id: Date.now().toString(),
      titulo: `${tipo === 'exoneracao' ? 'Exoneração' : 'Demissão'}: @${nickPolicial}`,
      conteudo: `O policial @${nickPolicial} foi desligado da corporação (${tipo === 'exoneracao' ? 'Exonerado' : 'Demitido'}). Autor: @${autor}. Motivo: ${motivo}`,
      autor,
      data: new Date().toISOString().split('T')[0],
      tipo: 'geral'
    };
    avisos.unshift(novoAviso);
    localStorage.setItem(CHAVE_AVISOS, JSON.stringify(avisos));
    sincronizarDadoEspecifico('avisos', novoAviso);

    return true;
  }
  return false;
}

export async function enviarWebhookParaDiscord(
  tipo: 'aviso' | 'movimentacao' | 'advertencia_criada' | 'advertencia_excluida' | 'exoneracao',
  dados: any
) {
  try {
    const config = obterConfiguracaoSite();
    if (!config) {
      return;
    }

    // Determine target webhook URL with fallback
    let targetWebhookUrl = '';
    if (tipo === 'aviso') {
      targetWebhookUrl = config.webhookAvisos || config.webhookDiscord || '';
    } else if (tipo === 'movimentacao') {
      targetWebhookUrl = config.webhookMovimentacoes || config.webhookDiscord || '';
    } else if (tipo === 'advertencia_criada' || tipo === 'advertencia_excluida') {
      targetWebhookUrl = config.webhookAdvertencias || config.webhookDiscord || '';
    } else if (tipo === 'exoneracao') {
      targetWebhookUrl = config.webhookExoneracoes || config.webhookDiscord || '';
    } else {
      targetWebhookUrl = config.webhookDiscord || '';
    }

    if (!targetWebhookUrl) {
      return;
    }

    let embed: any = {
      timestamp: new Date().toISOString()
    };

    let content: string | undefined = undefined;
    if (tipo === 'aviso' && dados.marcarEveryone) {
      content = '@everyone';
    }

    if (tipo === 'aviso') {
      embed.title = `📢 NOVO AVISO: ${dados.titulo}`;
      embed.description = dados.conteudo;
      embed.color = dados.tipo === 'urgente' ? 15158332 : dados.tipo === 'promocao' ? 15844367 : 3447003; // Vermelho, Amarelo, Azul
      embed.fields = [
        { name: 'Autor', value: dados.autor, inline: true },
        { name: 'Data', value: dados.data, inline: true }
      ];
      if (dados.imageUrl) {
        embed.image = { url: dados.imageUrl };
      }
    } else if (tipo === 'movimentacao') {
      const isPromo = dados.tipo === 'promocao';
      embed.title = isPromo ? '🎖️ PROMOÇÃO MILITAR' : '🔻 REBAIXAMENTO MILITAR';
      embed.color = isPromo ? 3066993 : 15158332; // Verde, Vermelho
      embed.description = `Por ordem de **${dados.autor}**, o policial **${dados.nickPolicial}** foi ${isPromo ? 'promovido' : 'rebaixado'}.`;
      embed.fields = [
        { name: 'Policial', value: dados.nickPolicial, inline: true },
        { name: 'Autor da Ação', value: dados.autor, inline: true },
        { name: 'Cargo Anterior', value: dados.cargoAnterior || 'Nenhum', inline: true },
        { name: 'Novo Cargo', value: dados.cargoNovo, inline: true },
        { name: 'Motivo', value: dados.motivo, inline: false }
      ];
    } else if (tipo === 'advertencia_criada') {
      embed.title = '⚠️ NOVA ADVERTÊNCIA APLICADA';
      embed.color = 16705372; // Dourado
      embed.description = `O policial **${dados.nickPolicial}** recebeu uma advertência oficial de **${dados.autor}**.`;
      embed.fields = [
        { name: 'Policial Advertido', value: dados.nickPolicial, inline: true },
        { name: 'Autor', value: dados.autor, inline: true },
        { name: 'Quantidade de Descumprimentos', value: `${dados.quantidade}`, inline: true },
        { name: 'Prazo Vencimento', value: dados.prazoVencimento || 'Nenhum', inline: true },
        { name: 'Motivo', value: dados.motivo, inline: false }
      ];
    } else if (tipo === 'advertencia_excluida') {
      embed.title = '✅ ADVERTÊNCIA REMOVIDA';
      embed.color = 3066993; // Verde
      embed.description = `A advertência de **${dados.nickPolicial}** foi removida.`;
      embed.fields = [
        { name: 'Policial', value: dados.nickPolicial, inline: true },
        { name: 'ID da Advertência', value: dados.id, inline: true }
      ];
    } else if (tipo === 'exoneracao') {
      const isDemissao = dados.tipo === 'demissao';
      embed.title = isDemissao ? '❌ DEMISSÃO DE POLICIAL' : '🚪 EXONERAÇÃO SOLICITADA';
      embed.color = 15158332; // Vermelho
      embed.description = `O policial **${dados.nickPolicial}** foi desligado da corporação por **${dados.autor}**.`;
      embed.fields = [
        { name: 'Policial Desligado', value: dados.nickPolicial, inline: true },
        { name: 'Autor da Ação', value: dados.autor, inline: true },
        { name: 'Tipo de Desligamento', value: isDemissao ? 'Demissão' : 'Exoneração', inline: true },
        { name: 'Motivo', value: dados.motivo, inline: false }
      ];
    }

    const payload: any = {
      embeds: [embed]
    };
    if (content) {
      payload.content = content;
    }

    fetch('/api/webhook/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: targetWebhookUrl,
        payload
      })
    }).then(res => {
      if (!res.ok) {
        console.error('[Discord Webhook] Error sending embed:', res.statusText);
      }
    }).catch(err => {
      console.error('[Discord Webhook] Fetch exception:', err);
    });
  } catch (error) {
    console.error('[Discord Webhook] General exception:', error);
  }
}

export function enviarLogDiscordEntrada(embed: any) {
  try {
    // Evitar o envio de logs da conta 'admin'
    const policialField = embed?.fields?.find((f: any) => f.name === '👤 Policial' || f.name?.includes('Policial'));
    if (policialField) {
      const nickValue = String(policialField.value || '').toLowerCase();
      if (nickValue === 'admin' || nickValue === '@admin' || nickValue.includes('@admin')) {
        console.log('[Discord Webhook Entradas] Ignorando log de entrada para o usuário admin.');
        return;
      }
    }
    
    const descValue = String(embed?.description || '').toLowerCase();
    if (descValue.includes('@admin') || descValue.includes('**@admin**')) {
      console.log('[Discord Webhook Entradas] Ignorando log de entrada para o usuário admin.');
      return;
    }

    const config = obterConfiguracaoSite();
    if (!config) return;

    const targetWebhookUrl = config.webhookDiscordEntradas || config.webhookDiscord || '';
    if (!targetWebhookUrl) return;

    const payload = {
      embeds: [embed]
    };

    fetch('/api/webhook/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: targetWebhookUrl,
        payload
      })
    }).then(res => {
      if (!res.ok) {
        console.error('[Discord Webhook Entradas] Error sending embed:', res.statusText);
      }
    }).catch(err => {
      console.error('[Discord Webhook Entradas] Fetch exception:', err);
    });
  } catch (error) {
    console.error('[Discord Webhook Entradas] Exception:', error);
  }
}

const CHAVE_APOSTILAS = 'cia_apostilas';

export function obterApostilas(): Apostila[] {
  inicializarDB();
  const raw = localStorage.getItem(CHAVE_APOSTILAS);
  if (!raw) {
    const apostilasIniciais: Apostila[] = [
      {
        id: 'ap1',
        titulo: 'Manual de Recrutamento & Instruções TFCP',
        descricao: 'Treinamento de Formação Cívico-Policial (TFCP). Guia para atuação eficiente e comandos de ordem.',
        partes: [
          {
            id: 'p1_1',
            tituloParte: '1. Comandos de Ordem & Obediência',
            conteudo: 'No batalhão, a disciplina é rigorosa. Todo militar deve conhecer e responder aos comandos com precisão e presteza:\n\n- **Sentido!**: Fique ereto e absolutamente imóvel. Não digite, não ande, não gesticule e não acene. Aguarde liberação.\n- **Atenção!**: Prontidão imediata. Fique imóvel olhando para o superior que ordenou.\n- **À vontade!**: Permissão para relaxar a postura, sentar ou dialogar moderadamente.'
          },
          {
            id: 'p1_2',
            tituloParte: '2. Saudações e Cortesia Militar',
            conteudo: 'A cortesia é o pilar do respeito na corporação:\n\n- Sempre que se dirigir a um Oficial ou Superior, acene (use o comando `/wave`) e finalize suas falas com tratamento formal ("Senhor" ou "Senhora").\n- Exemplo: "Sim, Senhor!" ou "Permissão para falar, Senhor!"'
          },
          {
            id: 'p1_3',
            tituloParte: '3. Atendimento e Triagem na Portaria',
            conteudo: 'O QG é protegido por nossa equipe de recepção. Siga a checklist de triagem rigorosamente:\n\n1. **Fardamento**: Exija que o candidato vista a farda cinza/preta de recruta.\n2. **Missão**: Certifique-se de que a missão do candidato seja exatamente: `[CIA] Recruta`.\n3. **Grupo**: Confirme que o candidato ingressou no grupo oficial da Polícia CIA e está com o distintivo ativo.\n4. **Liberação**: Comprovados todos os quesitos, execute o comando de entrada de segurança correspondente para liberar o portão.'
          }
        ],
        criadoPor: 'admin',
        dataCriacao: '20/07/2026'
      },
      {
        id: 'ap2',
        titulo: 'Código de Ética, Estatuto & Hierarquia',
        descricao: 'Regulamento Disciplinar Interno. Direitos, responsabilidades e sanções aplicadas aos oficiais da CIA.',
        partes: [
          {
            id: 'p2_1',
            tituloParte: '1. Hierarquia de Cargos e Patentes',
            conteudo: 'A estrutura organizacional da Polícia CIA é dividida em praças e oficiais:\n\n- **Praças**: Recruta, Soldado, Cabo, Terceiro Sargento, Segundo Sargento, Primeiro Sargento.\n- **Oficiais de Campo**: Subtenente, Aspirante-a-Oficial, Tenente, Capitão, Major.\n- **Alto Comando**: Coronel, General, Diretor.'
          },
          {
            id: 'p2_2',
            tituloParte: '2. Regulamento Disciplinar e Conduta',
            conteudo: 'É proibido a qualquer militar:\n\n- Solicitar ou pedir promoções de forma insistente (passível de advertência).\n- Utilizar acessórios inadequados ou que descaracterizem o fardamento oficial.\n- Faltar com o respeito com subordinados, pares ou superiores no QG ou mídias oficiais.'
          }
        ],
        criadoPor: 'admin',
        dataCriacao: '20/07/2026'
      }
    ];
    localStorage.setItem(CHAVE_APOSTILAS, JSON.stringify(apostilasIniciais));
    return apostilasIniciais;
  }
  return JSON.parse(raw);
}

export function salvarApostila(apostila: Apostila): { sucesso: boolean; mensagem: string } {
  inicializarDB();
  const apostilas = obterApostilas();
  const index = apostilas.findIndex(a => a.id === apostila.id);

  if (index >= 0) {
    apostilas[index] = apostila;
  } else {
    apostilas.push(apostila);
  }

  localStorage.setItem(CHAVE_APOSTILAS, JSON.stringify(apostilas));
  return { sucesso: true, mensagem: `Apostila "${apostila.titulo}" salva com sucesso!` };
}

export function excluirApostila(id: string): { sucesso: boolean; mensagem: string } {
  inicializarDB();
  const apostilas = obterApostilas();
  const filtradas = apostilas.filter(a => a.id !== id);
  localStorage.setItem(CHAVE_APOSTILAS, JSON.stringify(filtradas));
  return { sucesso: true, mensagem: 'Apostila excluída com sucesso!' };
}

export async function limparEResetarBancoDeDados(): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    const chaves = [
      CHAVE_POLICIAIS,
      CHAVE_AVISOS,
      CHAVE_TESTES,
      CHAVE_MOVIMENTACOES,
      CHAVE_CATEGORIAS,
      CHAVE_PATENTES,
      CHAVE_GRUPOS,
      'cia_advertencias',
      'cia_exoneracoes',
      'cia_solicitacoes_cadastro',
      'cia_apostilas',
      CHAVE_CONFIG,
      CHAVE_CONFIGURACAO_SITE,
      CHAVE_TREINAMENTOS,
      CHAVE_APLICACOES_TREINAMENTOS,
      CHAVE_XP_ENVIADOS
    ];

    for (const c of chaves) {
      localStorage.removeItem(c);
    }

    // Tentar limpar no Supabase se estiver conectado
    let supabaseMsg = '';
    try {
      const response = await fetch('/api/supabase/wipe', { method: 'POST' });
      if (response.ok) {
        const res = await response.json();
        if (res.success) {
          supabaseMsg = ' e sincronizado com o Supabase';
        }
      }
    } catch (err) {
      console.warn('Supabase wipe error or not connected:', err);
    }

    // Re-inicializar banco local com valores padrão e admin
    inicializarDB();

    return { 
      sucesso: true, 
      mensagem: `Todos os dados foram limpos e reiniciados com sucesso${supabaseMsg}! A conta 'admin' (senha: admin#geral) foi recriada para acesso.` 
    };
  } catch (error: any) {
    console.error('Erro ao limpar banco de dados:', error);
    return { sucesso: false, mensagem: 'Erro ao limpar banco de dados: ' + (error.message || error) };
  }
}


