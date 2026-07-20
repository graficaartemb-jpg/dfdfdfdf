export interface PatenteCategoria {
  id: string;
  nome: string;
  subtitulo?: string;
}

export interface Patente {
  id: string;
  categoriaId: string;
  nome: string;
  ordem: number;
  equivalente?: string;
  salario?: string;
  insignia?: string;
  responsabilidade?: string;
}

export interface Policial {
  nick: string;
  cargo: string; // Dynamic rank name/id
  categoriaId?: string; // Dynamic category ID
  dataRegistro: string;
  avatarHabbo: string; // The Habbo nick to fetch avatar
  pontosPromocao: number;
  presencas: number;
  streak: number;
  biografia?: string;
  promovidoPor?: string;
  ultimasPresencas?: string[];
  medalhas?: string[];
}

export interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  autor: string;
  data: string;
  tipo: 'urgente' | 'promocao' | 'geral';
  imageUrl?: string;
}

export interface RecrutaTeste {
  id: string;
  nickRecruta: string;
  reprovado: boolean;
  motivoReprovacao?: string;
  respostas: {
    pergunta: string;
    resposta: string;
    correta: boolean;
  }[];
  examinador: string;
  data: string;
}

export interface Movimentacao {
  id: string;
  nickPolicial: string;
  tipo: 'promocao' | 'rebaixamento';
  cargoAnterior: string;
  cargoNovo: string;
  motivo: string;
  autor: string;
  data: string;
}

export interface Grupo {
  id: string;
  nome: string;
  sigla: string;
  descricao: string;
  urlImagem: string;
  publico: boolean;
  verificado: boolean;
  aceitaMembros: boolean;
  membros: string[];
}

export interface Treinamento {
  id: string;
  titulo: string;
  status: 'rascunho' | 'publicada';
  descricao: string;
  conteudo: string; // HTML or text/markdown content
  cargoVinculavel?: string; // Target cargo/patent to reward
  patenteVinculavelId?: string; // Target patent ID
  permissoesCargos: string[]; // Which cargos can teach this
}

export interface AplicacaoTreinamento {
  id: string;
  treinamentoId: string;
  instrutor: string; // Nick of the instructor
  data: string; // Elegant date string
  alunos: {
    nick: string;
    status: 'aprovado' | 'reprovado';
    vinculado?: boolean;
  }[];
  observacoes?: string;
}

export interface EnvioXP {
  id: string;
  motivo: string;
  valor: number;
  destinatarios: string[]; // Nicks of the recipients
  enviadoPor: string; // Nick of the sender
  data: string; // "16/07/2026, 18:38"
}

export interface CargoPermissao {
  abasAcessiveis: string[];
  podePromoverRebaixar: boolean;
  podePostarAvisos: boolean;
  podeEnviarXP: boolean;
  podeCriarTreinamentos: boolean;
  podeAvaliarAulas: boolean;
  podeGerenciarGrupos: boolean;
  podeGerenciarHierarquia: boolean;
}

export interface ConfiguracaoSite {
  nomeSite: string;
  subtituloSite: string;
  logoTexto: string;
  logoUrl?: string;
  loginMensagem: string;
  cargosPermissoes: Record<string, CargoPermissao>;
  webhookDiscord?: string;
  corTema?: 'red' | 'amber' | 'blue' | 'zinc' | 'emerald';
  loginBackgroundUrl?: string;
  linkSuporte?: string;
}

export interface Advertencia {
  id: string;
  nickPolicial: string;
  quantidade: number;
  prazoVencimento: string;
  motivo: string;
  autor: string;
  data: string;
  ativa: boolean;
}

export interface Exoneracao {
  id: string;
  nickPolicial: string;
  motivo: string;
  autor: string;
  data: string;
  tipo: 'demissao' | 'exoneracao';
}






