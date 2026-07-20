import { Policial, PatenteCategoria, Patente, Aviso, RecrutaTeste, Movimentacao, Grupo, Treinamento, AplicacaoTreinamento, EnvioXP } from '../types';
import { pushParaSupabase, deleteDeSupabase, SiteConfig } from './supabaseSync';

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

export function obterSiteConfig(): SiteConfig {
  inicializarDB();
  const raw = localStorage.getItem(CHAVE_CONFIG);
  if (raw) {
    return JSON.parse(raw);
  }
  const configPadrao: SiteConfig = {
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
  return configPadrao;
}

export function salvarSiteConfig(config: SiteConfig): SiteConfig {
  localStorage.setItem(CHAVE_CONFIG, JSON.stringify(config));
  pushParaSupabase('cia_config', config, 'id');
  return config;
}

// Seed initial data if localStorage is empty
export function inicializarDB() {
  if (!localStorage.getItem(CHAVE_POLICIAIS)) {
    const policiaisIniciais: Record<string, Policial & { senhaHex: string }> = {
      'diretor_almeida': {
        nick: 'Diretor_Almeida',
        cargo: 'Diretor',
        dataRegistro: '2026-01-15',
        avatarHabbo: 'AlmeidaHabbo',
        pontosPromocao: 500,
        presencas: 45,
        streak: 12,
        senhaHex: '123456',
        biografia: 'Fundador e Diretor Geral da Polícia CIA. Mantendo a ordem no Habbo desde 2018.',
        medalhas: ['Honra ao Mérito', 'Fundador', 'Instrutor Chefe', 'Destaque Mensal']
      },
      'soldado_muller': {
        nick: 'Soldado_Muller',
        cargo: 'Soldado',
        dataRegistro: '2026-06-10',
        avatarHabbo: 'MullerBR',
        pontosPromocao: 45,
        presencas: 8,
        streak: 3,
        senhaHex: '123456',
        biografia: 'Soldado focado em manter a segurança da recepção e portaria da CIA.',
        promovidoPor: 'Diretor_Almeida',
        medalhas: ['Portaria de Ouro', 'Recruta Destaque']
      },
      'recruta_silva': {
        nick: 'Recruta_Silva',
        cargo: 'Recruta',
        dataRegistro: '2026-07-19',
        avatarHabbo: 'SilvaRecruta',
        pontosPromocao: 0,
        presencas: 1,
        streak: 1,
        senhaHex: '123456',
        biografia: 'Recém-admitido na Polícia CIA. Pronto para os treinamentos oficiais.',
        promovidoPor: 'Soldado_Muller',
        medalhas: []
      }
    };
    localStorage.setItem(CHAVE_POLICIAIS, JSON.stringify(policiaisIniciais));
  }

  if (!localStorage.getItem(CHAVE_AVISOS)) {
    const avisosIniciais: Aviso[] = [
      {
        id: '1',
        titulo: 'Nova Diretriz de Segurança na Recepção',
        conteudo: 'Todos os soldados devem verificar se os recrutas estão usando a farda preta padrão com a missão correta: [CIA] Recruta. Aqueles com fardas coloridas ou missões incorretas devem ser instruídos a ajustar antes de entrar.',
        autor: 'Diretor_Almeida',
        data: '2026-07-20',
        tipo: 'urgente'
      },
      {
        id: '2',
        titulo: 'Grande Promoção de Oficiais',
        conteudo: 'Parabéns ao Soldado_Muller pela promoção ao cargo de Soldado pelo seu incrível empenho no recrutamento e organização do QG durante o final de semana.',
        autor: 'Diretor_Almeida',
        data: '2026-07-18',
        tipo: 'promocao'
      },
      {
        id: '3',
        titulo: 'Abertura do Curso de Instrução de Cabos (CIC)',
        conteudo: 'Interessados em subir para a patente de Cabo devem se inscrever no formulário oficial da CIA. É obrigatório ter no mínimo 30 pontos de promoção e 5 presenças em relatórios.',
        autor: 'Diretor_Almeida',
        data: '2026-07-15',
        tipo: 'geral'
      }
    ];
    localStorage.setItem(CHAVE_AVISOS, JSON.stringify(avisosIniciais));
  }

  if (!localStorage.getItem(CHAVE_TESTES)) {
    const testesIniciais: RecrutaTeste[] = [
      {
        id: '1',
        nickRecruta: 'Junior_99',
        reprovado: false,
        respostas: [
          { pergunta: 'Qual a nossa farda padrão?', resposta: 'Preta sem acessórios brilhantes', correta: true },
          { pergunta: 'Como saudar um superior?', resposta: 'Acenar com o comando acenar ou dizer Sentido!', correta: true },
          { pergunta: 'O que fazer na portaria?', resposta: 'Alistar recrutas com a missão correta', correta: true }
        ],
        examinador: 'Diretor_Almeida',
        data: '2026-07-19'
      }
    ];
    localStorage.setItem(CHAVE_TESTES, JSON.stringify(testesIniciais));
  }

  if (!localStorage.getItem(CHAVE_MOVIMENTACOES)) {
    const movimentacoesIniciais: Movimentacao[] = [
      {
        id: 'm1',
        nickPolicial: 'antiterrorismo',
        tipo: 'promocao',
        cargoAnterior: 'Soldado',
        cargoNovo: 'Cabo',
        motivo: 'Ótimo desempenho no trabalho em batalhão.',
        autor: 'L.Petrus',
        data: '12/07/2026, 00:38:59'
      },
      {
        id: 'm2',
        nickPolicial: 'Hacsy',
        tipo: 'rebaixamento',
        cargoAnterior: 'Aspirante-a-Oficial',
        cargoNovo: 'Soldado',
        motivo: 'Saída antes da inauguracao',
        autor: 'fabiovander',
        data: '07/07/2026, 03:42:23'
      }
    ];
    localStorage.setItem(CHAVE_MOVIMENTACOES, JSON.stringify(movimentacoesIniciais));
  }

  if (!localStorage.getItem(CHAVE_CONFIG)) {
    const configPadrao: SiteConfig = {
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

  if (!localStorage.getItem(CHAVE_CATEGORIAS)) {
    const categoriasIniciais: PatenteCategoria[] = [
      { id: 'cat_pracas', nome: 'Praças', subtitulo: 'Corpo de Alistados e Graduados' },
      { id: 'cat_oficiais', nome: 'Oficiais', subtitulo: 'Corpo de Oficiais Superiores e Subalternos' },
      { id: 'cat_comando', nome: 'Comando', subtitulo: 'Alto Comando Administrativo' }
    ];
    localStorage.setItem(CHAVE_CATEGORIAS, JSON.stringify(categoriasIniciais));
  }

  if (!localStorage.getItem(CHAVE_PATENTES)) {
    const patentesIniciais: Patente[] = [
      // Praças
      { id: 'pat_rec', categoriaId: 'cat_pracas', nome: 'Recruta', ordem: 1, insignia: 'REC', salario: '10 Moedas', responsabilidade: 'Realizar o alistamento básico e patrulhas' },
      { id: 'pat_sld', categoriaId: 'cat_pracas', nome: 'Soldado', ordem: 2, insignia: 'SLD', salario: '15 Moedas', responsabilidade: 'Guarnição da recepção e portaria secundária' },
      { id: 'pat_cab', categoriaId: 'cat_pracas', nome: 'Cabo', ordem: 3, insignia: 'CAB', salario: '20 Moedas', responsabilidade: 'Supervisão do batalhão e policiamento primário' },
      { id: 'pat_sgt3', categoriaId: 'cat_pracas', nome: 'Terceiro Sargento', ordem: 4, insignia: '3º SGT', salario: '25 Moedas', responsabilidade: 'Coordenação da recepção e liderança de turnos' },
      
      // Oficiais
      { id: 'pat_sgt2', categoriaId: 'cat_oficiais', nome: 'Segundo Sargento', ordem: 5, insignia: '2º SGT', salario: '30 Moedas', responsabilidade: 'Supervisão administrativa e aplicação de instruções' },
      { id: 'pat_sgt1', categoriaId: 'cat_oficiais', nome: 'Primeiro Sargento', ordem: 6, insignia: '1º SGT', salario: '35 Moedas', responsabilidade: 'Instrução tática avançada e organização militar' },
      { id: 'pat_asp', categoriaId: 'cat_oficiais', nome: 'Aspirante-a-Oficial', ordem: 7, insignia: 'ASP', salario: '40 Moedas', responsabilidade: 'Estágio do Corpo de Oficiais e comando adjunto' },
      { id: 'pat_ten', categoriaId: 'cat_oficiais', nome: 'Tenente', ordem: 8, insignia: 'TEN', salario: '50 Moedas', responsabilidade: 'Comandante operacional das dependências do QG' },
      
      // Comando
      { id: 'pat_cap', categoriaId: 'cat_comando', nome: 'Capitão', ordem: 9, insignia: 'CAP', salario: '65 Moedas', responsabilidade: 'Superintendente de divisão militar e corregedoria' },
      { id: 'pat_cel', categoriaId: 'cat_comando', nome: 'Coronel', ordem: 10, insignia: 'CEL', salario: '80 Moedas', responsabilidade: 'Auditoria geral de patentes, promoções e finanças' },
      { id: 'pat_gen', categoriaId: 'cat_comando', nome: 'General', ordem: 11, insignia: 'GEN', salario: '100 Moedas', responsabilidade: 'Estrategista-Chefe, diretrizes de treinamento e conselho' },
      { id: 'pat_dir', categoriaId: 'cat_comando', nome: 'Diretor', ordem: 12, insignia: 'DIR', salario: '150 Moedas', responsabilidade: 'Gestão executiva absoluta e decretos supremos' }
    ];
    localStorage.setItem(CHAVE_PATENTES, JSON.stringify(patentesIniciais));
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
        conteudo: `<div class="text-center space-y-6 py-4">
  <div class="flex justify-center">
    <div class="w-20 h-20 rounded-full bg-blue-950/20 border border-blue-800 flex items-center justify-center text-3xl">🛡️</div>
  </div>
  <h3 class="text-base font-bold text-zinc-100 font-sans">TREINAMENTO DE SEGURANÇA POLICIAL (TSP)</h3>
  <div class="text-left max-w-lg mx-auto text-xs text-zinc-400 space-y-2 font-sans">
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

// Register a new officer
export function registrarPolicial(nick: string, senhaHex: string, avatarHabbo: string): { sucesso: boolean; mensagem: string } {
  const policiais = obterPoliciais();
  const nickMin = nick.toLowerCase().trim();

  if (policiais[nickMin]) {
    return { sucesso: false, mensagem: 'Este Nick já está cadastrado no sistema!' };
  }

  policiais[nickMin] = {
    nick: nick.trim(),
    cargo: 'Recruta',
    dataRegistro: new Date().toISOString().split('T')[0],
    avatarHabbo: avatarHabbo.trim() || nick.trim(),
    pontosPromocao: 0,
    presencas: 1,
    streak: 1,
    senhaHex,
    biografia: 'Novo policial da corporação Polícia CIA.',
    medalhas: []
  };

  localStorage.setItem(CHAVE_POLICIAIS, JSON.stringify(policiais));
  return { sucesso: true, mensagem: 'Cadastro realizado com sucesso! Faça seu login.' };
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
    salvarMovimentacao(policiais[nickMin].nick, tipo, cargoAnterior, novoCargo, motivo, autor);

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
export function criarAviso(titulo: string, conteudo: string, autor: string, tipo: 'urgente' | 'promocao' | 'geral'): Aviso {
  const avisos = obterAvisos();
  const novo: Aviso = {
    id: Date.now().toString(),
    titulo,
    conteudo,
    autor,
    data: new Date().toISOString().split('T')[0],
    tipo
  };
  avisos.unshift(novo);
  localStorage.setItem(CHAVE_AVISOS, JSON.stringify(avisos));
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

  // If passed, we can grant points to the examiner!
  const policiais = obterPoliciais();
  const examMin = teste.examinador.toLowerCase().trim();
  if (policiais[examMin]) {
    policiais[examMin].pontosPromocao += 5; // Examiner gets 5 pts
    policiais[examMin].presencas += 1;
    localStorage.setItem(CHAVE_POLICIAIS, JSON.stringify(policiais));
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
  return categoria;
}

export function excluirCategoria(id: string): void {
  const categorias = obterCategorias();
  const filtradas = categorias.filter(c => c.id !== id);
  localStorage.setItem(CHAVE_CATEGORIAS, JSON.stringify(filtradas));

  // Also clean up patentes inside this category
  const patentes = obterPatentes();
  const patentesFiltradas = patentes.filter(p => p.categoriaId !== id);
  localStorage.setItem(CHAVE_PATENTES, JSON.stringify(patentesFiltradas));
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
  return patente;
}

export function excluirPatente(id: string): void {
  const patentes = obterPatentes();
  const filtradas = patentes.filter(p => p.id !== id);
  localStorage.setItem(CHAVE_PATENTES, JSON.stringify(filtradas));
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
  return grupo;
}

export function excluirGrupo(id: string): void {
  const grupos = obterGrupos();
  const filtrados = grupos.filter(g => g.id !== id);
  localStorage.setItem(CHAVE_GRUPOS, JSON.stringify(filtrados));
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
  return t;
}

export function excluirTreinamento(id: string): void {
  const ts = obterTreinamentos();
  const filtrados = ts.filter(t => t.id !== id);
  localStorage.setItem(CHAVE_TREINAMENTOS, JSON.stringify(filtrados));
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
  return a;
}

export function excluirAplicacaoTreinamento(id: string): void {
  const as = obterAplicacoesTreinamentos();
  const filtrados = as.filter(a => a.id !== id);
  localStorage.setItem(CHAVE_APLICACOES_TREINAMENTOS, JSON.stringify(filtrados));
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
  return envio;
}

export function excluirEnvioXP(id: string): void {
  const envios = obterEnviosXP();
  const filtrados = envios.filter(e => e.id !== id);
  localStorage.setItem(CHAVE_XP_ENVIADOS, JSON.stringify(filtrados));
  backgroundSync('xp_enviados', id, 'delete');
}

export function backgroundSync(tabela: string, dados: any, action: 'upsert' | 'delete' = 'upsert') {
  const supabase = obterSupabaseClient();
  if (!supabase) return;

  if (action === 'delete') {
    supabase.from(tabela).delete().eq('id', dados).then(({ error }) => {
      if (error) console.error(`[Supabase Sync] Declusão de ${dados} em ${tabela} falhou:`, error);
    });
  } else {
    supabase.from(tabela).upsert(dados).then(({ error }) => {
      if (error) console.error(`[Supabase Sync] Salvamento em ${tabela} falhou:`, error);
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
  backgroundSync('configuracao_site', {
    id: 'config_principal',
    nome_site: config.nomeSite,
    subtitulo_site: config.subtituloSite,
    logo_texto: config.logoTexto,
    logo_url: config.logoUrl || null,
    login_mensagem: config.loginMensagem,
    cargos_permissoes: config.cargosPermissoes
  });
  return config;
}

export function sincronizarPolicialComSupabase(nick: string) {
  const policiais = obterPoliciais();
  const nickMin = nick.toLowerCase().trim();
  const pol = policiais[nickMin];
  if (!pol) return;

  backgroundSync('policiais', {
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
  });
}





