export interface PatenteCategoria {
  id: string;
  nome: string;
  subtitulo?: string;
  ordem?: number;
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
  fotoUrl?: string;
}

export interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  autor: string;
  data: string;
  tipo: 'urgente' | 'promocao' | 'geral';
  imageUrl?: string;
  corFundo?: string; // background color styling
  negrito?: boolean; // text bold styling
  italico?: boolean; // text italic styling
  posicaoImagem?: 'topo' | 'esquerda' | 'direita' | 'fundo'; // image inline/float or background option
  imagemFundoUrl?: string; // custom beautiful background image url
  templateNoticia?: 'padrao' | 'noticia' | 'militar' | 'tecnologico' | 'urgente-critico'; // visual templates
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
  cargosQuePodemVer?: string[]; // Which cargos can view this lesson
  permissoesAvaliadores?: string[]; // Which cargos can approve, reject, or re-evaluate this training
}

export interface AplicacaoTreinamento {
  id: string;
  treinamentoId: string;
  treinamentoTitulo?: string; // Stored title of the training to preserve history
  instrutor: string; // Nick of the instructor
  data: string; // Elegant date string
  alunos: {
    nick: string;
    status: 'aprovado' | 'reprovado';
    vinculado?: boolean;
  }[];
  observacoes?: string;
  statusAprovacao?: 'pendente' | 'aprovado' | 'reprovado';
  avaliador?: string;
  dataAvaliacao?: string;
  motivoAvaliacao?: string;
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
  podeExcluirLogsTreinamento?: boolean;
  podeReavaliarTreinamento?: boolean;
  podeExcluirAvisos?: boolean;
  podeExcluirPoliciais?: boolean;
  podeExcluirApostilas?: boolean;
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
  linkDiscord?: string;
  webhookAvisos?: string;
  webhookMovimentacoes?: string;
  webhookAdvertencias?: string;
  webhookExoneracoes?: string;
  webhookDiscordEntradas?: string;
  webhookBackup?: string;
  ultimoBackup?: string;
  abasCustomizadas?: AbaCustomizada[];
}

export interface AbaCustomizada {
  id: string;
  titulo: string;
  permissaoVer: string[]; // List of roles (patentes or "todos") allowed to view
  permissaoPostar: string[]; // List of roles allowed to post
  gruposPermitidosVer?: string[]; // List of group IDs allowed to view
  gruposPermitidosPostar?: string[]; // List of group IDs allowed to post
  icone?: string; // Optional icon name
  tipoConteudo?: 'ambos' | 'documento' | 'aviso';
}

export interface PostAbaCustomizada {
  id: string;
  abaId: string;
  titulo: string;
  conteudo: string;
  autor: string;
  data: string;
  fileUrl?: string;
  tipo?: 'aviso' | 'documento'; // 'aviso' or 'documento'
}

export interface SolicitacaoCadastro {
  id: string;
  nick: string;
  senhaHex: string;
  avatarHabbo: string;
  dataSolicitacao: string;
  fotoUrl?: string;
  ip?: string;
  cidade?: string;
  status?: 'pendente' | 'aprovado' | 'reprovado';
  avaliadorNick?: string;
  dataAvaliacao?: string;
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

export interface ApostilaParte {
  id: string;
  tituloParte: string;
  subtituloParte?: string;
  conteudo: string;
}

export interface Apostila {
  id: string;
  titulo: string;
  descricao: string;
  partes: ApostilaParte[];
  criadoPor: string;
  dataCriacao: string;
}

