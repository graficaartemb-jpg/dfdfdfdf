import React, { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, User, Lock, FileText, Users, Shield, ShieldCheck, LogOut,
  Activity, UserPlus, Search, Medal, Plus, Trash2, Edit,
  ChevronDown, ChevronUp, Save, PlusCircle, MinusCircle,
  ArrowUp, ArrowDown, Award, AlertTriangle, CheckCircle,
  Send, Calendar, DollarSign, Briefcase, HelpCircle, Flame, History,
  BookOpen, GraduationCap, ArrowLeft, Check, X,
  RotateCcw, RotateCw, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent, Quote, Minus, Code, Eraser,
  Link, Image, Video, Table, FileUp, Eye, EyeOff, Sliders, Trophy, Crown, ArrowUpDown,
  Database, UploadCloud, DownloadCloud, Copy, Key, ShieldAlert, RefreshCw
} from 'lucide-react';
import {
  obterAvisos, criarAviso, excluirAviso, obterPoliciais, salvarPolicial, alterarPatentePolicial,
  adicionarPontos, obterMovimentacoes, obterCategorias, salvarCategoria,
  excluirCategoria, obterPatentes, salvarPatente, excluirPatente,
  obterGrupos, salvarGrupo, excluirGrupo, atualizarPerfilPolicial,
  obterTreinamentos, salvarTreinamento, excluirTreinamento,
  obterAplicacoesTreinamentos, salvarAplicacaoTreinamento, excluirAplicacaoTreinamento,
  obterEnviosXP, salvarEnvioXP, excluirEnvioXP, obterConfiguracaoSite, salvarConfiguracaoSite,
  obterAdvertencias, salvarAdvertencia, excluirAdvertencia, obterExoneracoes, salvarExoneracao, exonerarPolicialNoBanco,
  obterSolicitacoesCadastro, aceitarSolicitacaoCadastro, recusarSolicitacaoCadastro, enviarLogDiscordEntrada, alterarSenhaPolicial,
  obterApostilas, salvarApostila, excluirApostila, limparEResetarBancoDeDados, excluirPolicialPermanente,
  obterPostsAbasCustomizadas, salvarPostAbaCustomizada, deletarPostAbaCustomizada, definirPostsAbasCustomizadas, sincronizarDadoEspecifico,
  filtrarPoliciaisVisiveis, houveEscritaLocalRecente
} from '../lib/db';
import { Policial, PatenteCategoria, Patente, Aviso, Movimentacao, Grupo, Treinamento, AplicacaoTreinamento, EnvioXP, ConfiguracaoSite, CargoPermissao, Advertencia, Exoneracao, SolicitacaoCadastro, Apostila, ApostilaParte, AbaCustomizada, PostAbaCustomizada } from '../types';
import { testarConexaoSupabase, sincronizarTudoDoSupabase, exportarDadosParaSupabase, getSupabaseCredentials, salvarCredenciaisSupabaseManual, SQL_SCRIPT_GERAL, SQL_SCRIPT_RESET, SQL_SCRIPT_MIGRAR } from '../lib/supabase';

const safeConfirm = (mensagem: string): boolean => {
  try {
    if (typeof window !== 'undefined' && window.self !== window.top) {
      console.log('[Safe Confirm] Auto-confirming inside iframe environment:', mensagem);
      return true;
    }
    return window.confirm(mensagem);
  } catch (e) {
    console.warn('[Confirm Bypass] window.confirm is blocked or threw an error in this environment. Auto-confirming action:', e);
    return true;
  }
};

const safeAlert = (mensagem: string) => {
  try {
    if (typeof window !== 'undefined' && window.self !== window.top) {
      console.log('[Safe Alert] Alert message inside iframe environment:', mensagem);
      return;
    }
    window.alert(mensagem);
  } catch (e) {
    console.warn('[Alert Bypass] window.alert is blocked in this environment. Message was:', mensagem, e);
  }
};

const obterAvatarUrl = (p: { avatarHabbo: string, fotoUrl?: string } | undefined, size: 's' | 'm' | 'l' | 'head' = 's', fallbackNick?: string, version?: number): string => {
  if (p?.fotoUrl && !p.fotoUrl.includes('api.radiohabblet') && !p.fotoUrl.includes('imager?figure=')) {
    return p.fotoUrl + (version ? `${p.fotoUrl.includes('?') ? '&' : '?'}v=${version}` : '');
  }
  const nick = p?.avatarHabbo || fallbackNick || 'admin';
  const encodedNick = encodeURIComponent(nick);
  const vParam = version ? `&v=${version}` : `&v=${new Date().getHours()}`;
  if (size === 'head') {
    return `https://api.radiohabblet.com.br/imager?user=${encodedNick}&gesture=std&direction=2&head_direction=2&headonly=true&size=m${vParam}`;
  }
  const sizeParam = size === 'l' ? 'b' : (size === 'm' ? 'm' : 's');
  return `https://api.radiohabblet.com.br/imager?user=${encodedNick}&gesture=std&direction=3&head_direction=3&headonly=false&size=${sizeParam}${vParam}`;
};

const getIconComponent = (iconName: string, className = "w-4 h-4") => {
  switch (iconName) {
    case 'FileText': return <FileText className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Briefcase': return <Briefcase className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'GraduationCap': return <GraduationCap className={className} />;
    case 'Users': return <Users className={className} />;
    case 'Award': return <Award className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Activity': return <Activity className={className} />;
    case 'Trophy': return <Trophy className={className} />;
    case 'Key': return <Key className={className} />;
    case 'Lock': return <Lock className={className} />;
    default: return <FileText className={className} />;
  }
};

interface DashboardProps {
  policialInicial: Policial;
  onLogout: () => void;
}

export default function Dashboard({ policialInicial, onLogout }: DashboardProps) {
  const [policial, setPolicial] = useState<Policial>(policialInicial);
  const [abaAtiva, setAbaAtiva] = useState<'inicio' | 'perfil' | 'avisos' | 'promocao' | 'hierarquia' | 'grupos' | 'aulas' | 'xp' | 'gestao_site' | 'advertencias' | 'exonerar' | 'aceitar_membros' | 'setores_diversos'>('inicio');
  const [gestaoAberta, setGestaoAberta] = useState(true);
  const [setorAdminAberto, setSetorAdminAberto] = useState(true);
  const [setoresDiversosAberto, setSetoresDiversosAberto] = useState(true);

  // Setores Diversos / Custom Tabs States
  const [customAbaAtivaId, setCustomAbaAtivaId] = useState<string | null>(null);
  const [postsCustom, setPostsCustom] = useState<PostAbaCustomizada[]>([]);
  const [tituloNovoPostCustom, setTituloNovoPostCustom] = useState('');
  const [conteudoNovoPostCustom, setConteudoNovoPostCustom] = useState('');
  const [fileUrlNovoPostCustom, setFileUrlNovoPostCustom] = useState('');
  const [mostrarFormPostCustom, setMostrarFormPostCustom] = useState(false);
  const [modoEdicaoTextoPostCustom, setModoEdicaoTextoPostCustom] = useState<'visual' | 'codigo'>('visual');
  const [previewAtivoPostCustom, setPreviewAtivoPostCustom] = useState(false);
  const editorPostCustomRef = React.useRef<HTMLDivElement>(null);

  // Warnings (Advertências) & Dismissals (Exonerações) states
  const [advertencias, setAdvertencias] = useState<Advertencia[]>([]);
  const [exoneracoes, setExoneracoes] = useState<Exoneracao[]>([]);
  const [buscaAdvUsuario, setBuscaAdvUsuario] = useState('');
  const [buscaExoUsuario, setBuscaExoUsuario] = useState('');

  // Accept New Members / Solicitacoes states
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCadastro[]>([]);
  const [filtroSolicitacoes, setFiltroSolicitacoes] = useState<'pendente' | 'aprovado' | 'reprovado'>('pendente');
  const [msgAceitacaoSucesso, setMsgAceitacaoSucesso] = useState('');
  const [msgAceitacaoErro, setMsgAceitacaoErro] = useState('');
  const [gWebhookDiscordEntradas, setGWebhookDiscordEntradas] = useState('');
  const [gLinkDiscord, setGLinkDiscord] = useState('');

  // Form states for warnings
  const [advPolicialNick, setAdvPolicialNick] = useState('');
  const [advQuantidade, setAdvQuantidade] = useState<number>(1);
  const [advPrazo, setAdvPrazo] = useState('30 dias');
  const [advMotivo, setAdvMotivo] = useState('');
  const [msgAdvSucesso, setMsgAdvSucesso] = useState('');
  const [msgAdvErro, setMsgAdvErro] = useState('');

  // Form states for dismissals
  const [exoPolicialNick, setExoPolicialNick] = useState('');
  const [exoMotivo, setExoMotivo] = useState('');
  const [exoTipo, setExoTipo] = useState<'exoneracao' | 'demissao'>('exoneracao');
  const [msgExoSucesso, setMsgExoSucesso] = useState('');
  const [msgExoErro, setMsgExoErro] = useState('');

  // Site management states
  const [configSite, setConfigSite] = useState<ConfiguracaoSite>(() => obterConfiguracaoSite());
  const [gSiteNome, setGSiteNome] = useState('');
  const [gSiteSubtitulo, setGSiteSubtitulo] = useState('');
  const [gLogoTexto, setGLogoTexto] = useState('');
  const [gLogoUrl, setGLogoUrl] = useState('');
  const [gLoginMensagem, setGLoginMensagem] = useState('');
  const [gWebhookDiscord, setGWebhookDiscord] = useState('');
  const [gCargosPermissoes, setGCargosPermissoes] = useState<Record<string, CargoPermissao>>({});
  const [gCargoSelecionado, setGCargoSelecionado] = useState<string>('');
  const [gWebhookAvisos, setGWebhookAvisos] = useState('');
  const [gWebhookMovimentacoes, setGWebhookMovimentacoes] = useState('');
  const [gWebhookAdvertencias, setGWebhookAdvertencias] = useState('');
  const [gWebhookExoneracoes, setGWebhookExoneracoes] = useState('');
  const [gWebhookBackup, setGWebhookBackup] = useState('');
  const [sincronizandoBackup, setSincronizandoBackup] = useState(false);
  const [msgBackupSucesso, setMsgBackupSucesso] = useState('');
  const [msgBackupErro, setMsgBackupErro] = useState('');
  const [gSubAba, setGSubAba] = useState<'geral' | 'permissoes' | 'supabase' | 'webhooks' | 'alterar_senhas' | 'apostilas' | 'backup' | 'abas_customizadas'>('geral');
  const [msgConfigSucesso, setMsgConfigSucesso] = useState('');
  const [msgConfigErro, setMsgConfigErro] = useState('');

  // Apostila Management States
  const [apostilasGerencia, setApostilasGerencia] = useState<Apostila[]>([]);
  const [editandoApostila, setEditandoApostila] = useState<Apostila | null>(null);
  const [apTitulo, setApTitulo] = useState('');
  const [apDescricao, setApDescricao] = useState('');
  const [apPartes, setApPartes] = useState<ApostilaParte[]>([]);
  const [novaParteTitulo, setNovaParteTitulo] = useState('');
  const [novaParteSubtitulo, setNovaParteSubtitulo] = useState('');
  const [novaParteConteudo, setNovaParteConteudo] = useState('');
  const [parteEmEdicaoId, setParteEmEdicaoId] = useState<string | null>(null);

  // Password change states
  const [altSenhaPolicialNick, setAltSenhaPolicialNick] = useState('');
  const [altSenhaNova, setAltSenhaNova] = useState('');
  const [altSenhaConfirmacao, setAltSenhaConfirmacao] = useState('');
  const [buscaMembrosLista, setBuscaMembrosLista] = useState('');

  // Custom Tab Management States
  const [editIdAba, setEditIdAba] = useState<string | null>(null);
  const [tituloAba, setTituloAba] = useState('');
  const [permVerAba, setPermVerAba] = useState<string[]>(['todos']);
  const [permPostarAba, setPermPostarAba] = useState<string[]>([]);
  const [permVerGruposAba, setPermVerGruposAba] = useState<string[]>([]);
  const [permPostarGruposAba, setPermPostarGruposAba] = useState<string[]>([]);
  const [iconeAba, setIconeAba] = useState('FileText');
  const [tipoConteudoAba, setTipoConteudoAba] = useState<'ambos' | 'documento' | 'aviso'>('ambos');
  const [tipoNovoPostCustom, setTipoNovoPostCustom] = useState<'aviso' | 'documento'>('documento');
  const [filtroPostCustom, setFiltroPostCustom] = useState<'tudo' | 'documento' | 'aviso'>('tudo');
  const [postCustomSelecionado, setPostCustomSelecionado] = useState<PostAbaCustomizada | null>(null);
  const [buscaCargoPermVer, setBuscaCargoPermVer] = useState('');
  const [buscaCargoPermPostar, setBuscaCargoPermPostar] = useState('');

  // Supabase Integration States
  const [gSupabaseUrl, setGSupabaseUrl] = useState(() => getSupabaseCredentials().url);
  const [gSupabaseKey, setGSupabaseKey] = useState(() => getSupabaseCredentials().key);
  const [testandoSupabase, setTestandoSupabase] = useState(false);
  const [statusSupabase, setStatusSupabase] = useState<'não conectado' | 'conectado' | 'erro'>('não conectado');
  const [sincronizandoSupabase, setSincronizandoSupabase] = useState(false);
  const [sqlScriptOption, setSqlScriptOption] = useState<'geral' | 'reset' | 'migrar'>('geral');

  const verificarConexaoSupabase = async (overrideUrl?: string, overrideKey?: string) => {
    setTestandoSupabase(true);
    try {
      const creds = getSupabaseCredentials();
      const urlToTest = overrideUrl ?? creds.url;
      const keyToTest = overrideKey ?? creds.key;

      if (urlToTest) setGSupabaseUrl(urlToTest);
      if (keyToTest) setGSupabaseKey(keyToTest);

      const ok = await testarConexaoSupabase(urlToTest, keyToTest);
      if (ok) {
        setStatusSupabase('conectado');
      } else {
        if (urlToTest && keyToTest) {
          setStatusSupabase('erro');
        } else {
          setStatusSupabase('não conectado');
        }
      }
    } catch (e) {
      setStatusSupabase('erro');
    } finally {
      setTestandoSupabase(false);
    }
  };

  const lidarComSalvarCredenciaisSupabaseManual = async (e: FormEvent) => {
    e.preventDefault();
    setTestandoSupabase(true);
    try {
      salvarCredenciaisSupabaseManual(gSupabaseUrl, gSupabaseKey);
      const ok = await testarConexaoSupabase(gSupabaseUrl, gSupabaseKey);
      if (ok) {
        setStatusSupabase('conectado');
        setMsgConfigSucesso('Credenciais salvas e conexão com Supabase estabelecida com sucesso!');
        setTimeout(() => setMsgConfigSucesso(''), 5000);
      } else {
        setStatusSupabase('erro');
        setMsgConfigErro('Credenciais salvas, mas a conexão com o Supabase falhou. Verifique a URL e a Chave Anon.');
        setTimeout(() => setMsgConfigErro(''), 5000);
      }
    } catch (e: any) {
      setStatusSupabase('erro');
      setMsgConfigErro('Erro ao testar conexão: ' + (e.message || e));
      setTimeout(() => setMsgConfigErro(''), 5000);
    } finally {
      setTestandoSupabase(false);
    }
  };

  useEffect(() => {
    verificarConexaoSupabase();
  }, []);

  // Temporary role permissions form states
  const [tempAbas, setTempAbas] = useState<string[]>([]);
  const [tempPromover, setTempPromover] = useState(false);
  const [tempAvisos, setTempAvisos] = useState(false);
  const [tempXP, setTempXP] = useState(false);
  const [tempTreinamentos, setTempTreinamentos] = useState(false);
  const [tempAvaliar, setTempAvaliar] = useState(false);
  const [tempGrupos, setTempGrupos] = useState(false);
  const [tempHierarquia, setTempHierarquia] = useState(false);
  const [tempExcluirLogsTreinamento, setTempExcluirLogsTreinamento] = useState(false);
  const [tempReavaliarTreinamento, setTempReavaliarTreinamento] = useState(false);
  const [tempExcluirAvisos, setTempExcluirAvisos] = useState(false);
  const [tempExcluirPoliciais, setTempExcluirPoliciais] = useState(false);
  const [tempExcluirApostilas, setTempExcluirApostilas] = useState(false);

  // Lists from DB
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [policiais, setPoliciais] = useState<Record<string, Policial>>({});
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [categorias, setCategorias] = useState<PatenteCategoria[]>([]);
  const [patentes, setPatentes] = useState<Patente[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);

  const cargosSite = React.useMemo(() => {
    const list = Array.from(new Set(patentes.map(p => p.nome))).concat(['Diretor']).filter(Boolean);
    return list.map(nome => ({ id: nome, nome }));
  }, [patentes]);

  // Sync / visual update states
  const [visualVersion, setVisualVersion] = useState<number>(Date.now());
  const [sincronizandoVisual, setSincronizandoVisual] = useState<boolean>(false);

  // Custom dialog confirmations state (Anti-browser-alert/confirm popup requirement)
  const [modalDialog, setModalDialog] = useState<{
    mostrar: boolean;
    tipo: 'confirm' | 'alert' | 'prompt';
    titulo: string;
    mensagem: string;
    valorInput?: string;
    placeholder?: string;
    textoConfirmar?: string;
    textoCancelar?: string;
    onConfirmar: (valor?: string) => void;
    onCancelar?: () => void;
  } | null>(null);
  const [modalPromptInput, setModalPromptInput] = useState<string>('');

  const pedirConfirmacao = (mensagem: string, titulo: string = 'CONFIRMAÇÃO REQUERIDA'): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalDialog({
        mostrar: true,
        tipo: 'confirm',
        titulo,
        mensagem,
        textoConfirmar: 'CONFIRMAR',
        textoCancelar: 'CANCELAR',
        onConfirmar: () => {
          setModalDialog(null);
          resolve(true);
        },
        onCancelar: () => {
          setModalDialog(null);
          resolve(false);
        }
      });
    });
  };

  const mostrarAlerta = (mensagem: string, titulo: string = 'AVISO DO SISTEMA'): Promise<void> => {
    return new Promise((resolve) => {
      setModalDialog({
        mostrar: true,
        tipo: 'alert',
        titulo,
        mensagem,
        textoConfirmar: 'ENTENDIDO',
        onConfirmar: () => {
          setModalDialog(null);
          resolve();
        }
      });
    });
  };

  const pedirPrompt = (
    mensagem: string,
    valorInicial: string = '',
    placeholder: string = '',
    titulo: string = 'INFORMAÇÃO NECESSÁRIA'
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      setModalPromptInput(valorInicial);
      setModalDialog({
        mostrar: true,
        tipo: 'prompt',
        titulo,
        mensagem,
        valorInput: valorInicial,
        placeholder,
        textoConfirmar: 'CONFIRMAR',
        textoCancelar: 'CANCELAR',
        onConfirmar: (val) => {
          setModalDialog(null);
          resolve(val !== undefined ? val : '');
        },
        onCancelar: () => {
          setModalDialog(null);
          resolve(null);
        }
      });
    });
  };

  const solicitarConfirmacaoApagar = (titulo: string, mensagem: string, callback: () => void) => {
    setModalDialog({
      mostrar: true,
      tipo: 'confirm',
      titulo,
      mensagem,
      textoConfirmar: 'CONFIRMAR EXCLUSÃO',
      textoCancelar: 'CANCELAR OPERAÇÃO',
      onConfirmar: () => {
        setModalDialog(null);
        callback();
      },
      onCancelar: () => {
        setModalDialog(null);
      }
    });
  };

  // Training / Lesson States
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([]);
  const [aplicacoesTreinamentos, setAplicacoesTreinamentos] = useState<AplicacaoTreinamento[]>([]);
  const [treinamentoSelecionado, setTreinamentoSelecionado] = useState<Treinamento | null>(null);
  const [subAbaAtiva, setSubAbaAtiva] = useState<'conteudo' | 'aplicacoes' | 'permissoes'>('conteudo');
  const [modoEdicaoTreinamento, setModoEdicaoTreinamento] = useState<boolean>(false);
  const [estaCriandoTreinamento, setEstaCriandoTreinamento] = useState<boolean>(false);
  const [filtroAbaAulas, setFiltroAbaAulas] = useState<'aulas' | 'todas_aplicacoes'>('aulas');

  // Form states for Training creation/edit
  const [treinoTitulo, setTreinoTitulo] = useState('');
  const [treinoStatus, setTreinoStatus] = useState<'rascunho' | 'publicada'>('rascunho');
  const [treinoDescricao, setTreinoDescricao] = useState('');
  const [treinoConteudo, setTreinoConteudo] = useState('');
  const [treinoCargoVinculavel, setTreinoCargoVinculavel] = useState('');
  const [treinoPatenteVinculavelId, setTreinoPatenteVinculavelId] = useState('');
  const [treinoPermissoes, setTreinoPermissoes] = useState<string[]>([]);
  const [treinoCargosQuePodemVer, setTreinoCargosQuePodemVer] = useState<string[]>(['todos']);
  const [treinoPermissoesAvaliadores, setTreinoPermissoesAvaliadores] = useState<string[]>([]);
  const [modoEdicaoTexto, setModoEdicaoTexto] = useState<'visual' | 'codigo'>('visual');
  const [previewAtivo, setPreviewAtivo] = useState(false);
  const editorRef = React.useRef<HTMLDivElement>(null);
  const avisoTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  const aplicarFormatacaoAviso = (tipo: 'bold' | 'italic' | 'underline' | 'strike') => {
    const textarea = avisoTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textoCompleto = avisoConteudo;
    const textoSelecionado = textoCompleto.substring(start, end);

    let tagInicio = '';
    let tagFim = '';

    switch (tipo) {
      case 'bold':
        tagInicio = '**';
        tagFim = '**';
        break;
      case 'italic':
        tagInicio = '*';
        tagFim = '*';
        break;
      case 'underline':
        tagInicio = '__';
        tagFim = '__';
        break;
      case 'strike':
        tagInicio = '~~';
        tagFim = '~~';
        break;
    }

    const novoTexto = 
      textoCompleto.substring(0, start) + 
      tagInicio + 
      (textoSelecionado || 'texto') + 
      tagFim + 
      textoCompleto.substring(end);

    setAvisoConteudo(novoTexto);

    // Focus and select back the text
    setTimeout(() => {
      textarea.focus();
      const cursorOffset = tagInicio.length;
      if (textoSelecionado) {
        textarea.setSelectionRange(start + cursorOffset, end + cursorOffset);
      } else {
        textarea.setSelectionRange(start + cursorOffset, start + cursorOffset + 5);
      }
    }, 50);
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__|~~.*?~~)/g);
      
      const formattedLine = parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIndex} className="font-extrabold text-zinc-100">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={partIndex} className="italic text-zinc-300">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('__') && part.endsWith('__')) {
          return <span key={partIndex} className="underline decoration-red-500/80 decoration-2">{part.slice(2, -2)}</span>;
        }
        if (part.startsWith('~~') && part.endsWith('~~')) {
          return <span key={partIndex} className="line-through text-zinc-500">{part.slice(2, -2)}</span>;
        }
        return part;
      });

      return (
        <React.Fragment key={lineIndex}>
          {formattedLine}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const executarComandoEditor = (comando: string, valor: string = '') => {
    document.execCommand(comando, false, valor);
    if (editorRef.current) {
      setTreinoConteudo(editorRef.current.innerHTML);
    }
  };

  const lidarComInputEditor = () => {
    if (editorRef.current) {
      setTreinoConteudo(editorRef.current.innerHTML);
    }
  };

  const executarComandoEditorPostCustom = (comando: string, valor: string = '') => {
    document.execCommand(comando, false, valor);
    if (editorPostCustomRef.current) {
      setConteudoNovoPostCustom(editorPostCustomRef.current.innerHTML);
    }
  };

  const lidarComInputEditorPostCustom = () => {
    if (editorPostCustomRef.current) {
      setConteudoNovoPostCustom(editorPostCustomRef.current.innerHTML);
    }
  };

  const handleFormatBlockPostCustom = (tag: string) => {
    executarComandoEditorPostCustom('formatBlock', tag);
  };

  const handleFontNamePostCustom = (fontName: string) => {
    executarComandoEditorPostCustom('fontName', fontName);
  };

  const handleFontSizePostCustom = (size: string) => {
    executarComandoEditorPostCustom('fontSize', size);
  };

  const handleForeColorPostCustom = (color: string) => {
    executarComandoEditorPostCustom('foreColor', color);
  };

  const handleHiliteColorPostCustom = (color: string) => {
    executarComandoEditorPostCustom('hiliteColor', color);
  };

  const handleInsertLinkPostCustom = async () => {
    const url = await pedirPrompt('Digite a URL do link:', '', 'https://...');
    if (url) {
      executarComandoEditorPostCustom('createLink', url);
    }
  };

  const handleInsertImagePostCustom = async () => {
    const url = await pedirPrompt('Digite a URL da imagem:', '', 'https://...');
    if (url) {
      executarComandoEditorPostCustom('insertImage', url);
    }
  };

  const handleInsertYouTubePostCustom = async () => {
    const url = await pedirPrompt('Digite o link do vídeo do YouTube ou ID do vídeo:', '', 'https://www.youtube.com/watch?v=...');
    if (url) {
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/);
      const videoId = match ? match[1] : url;
      const iframeHTML = `<div class="my-4 aspect-video max-w-xl mx-auto"><iframe src="https://www.youtube.com/embed/${videoId}" class="w-full h-full rounded border border-zinc-800" allowfullscreen></iframe></div>`;
      executarComandoEditorPostCustom('insertHTML', iframeHTML);
    }
  };

  const handleInsertTablePostCustom = async () => {
    const rowsStr = await pedirPrompt('Digite o número de linhas da tabela:', '3', '3');
    if (!rowsStr) return;
    const colsStr = await pedirPrompt('Digite o número de colunas da tabela:', '2', '2');
    if (!colsStr) return;
    const rows = parseInt(rowsStr || '0');
    const cols = parseInt(colsStr || '0');
    if (rows > 0 && cols > 0) {
      let tableHTML = '<table class="w-full border-collapse border border-zinc-800 my-4 text-xs font-sans">';
      for (let i = 0; i < rows; i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < cols; j++) {
          if (i === 0) {
            tableHTML += '<th class="border border-zinc-800 bg-zinc-900 text-zinc-100 p-2 font-semibold">Cabeçalho</th>';
          } else {
            tableHTML += '<td class="border border-zinc-800 p-2 text-zinc-300">Célula</td>';
          }
        }
        tableHTML += '</tr>';
      }
      tableHTML += '</table>';
      executarComandoEditorPostCustom('insertHTML', tableHTML);
    }
  };

  const handleImportHTMLPostCustom = async () => {
    const html = await pedirPrompt('Cole o código HTML que deseja importar:', '', '<div>...</div>');
    if (html) {
      executarComandoEditorPostCustom('insertHTML', html);
    }
  };

  const handleLineHeightPostCustom = async () => {
    const height = await pedirPrompt('Digite a altura da linha (ex: 1.5, 2, normal):', '1.5', '1.5');
    if (height) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const parentElement = range.commonAncestorContainer.parentElement;
        if (parentElement) {
          parentElement.style.lineHeight = height;
          if (editorPostCustomRef.current) {
            setConteudoNovoPostCustom(editorPostCustomRef.current.innerHTML);
          }
        }
      }
    }
  };

  const handleFormatBlock = (tag: string) => {
    executarComandoEditor('formatBlock', tag);
  };

  const handleFontName = (fontName: string) => {
    executarComandoEditor('fontName', fontName);
  };

  const handleFontSize = (size: string) => {
    executarComandoEditor('fontSize', size);
  };

  const handleForeColor = (color: string) => {
    executarComandoEditor('foreColor', color);
  };

  const handleHiliteColor = (color: string) => {
    executarComandoEditor('hiliteColor', color);
  };

  const handleInsertLink = async () => {
    const url = await pedirPrompt('Digite a URL do link:', '', 'https://...');
    if (url) {
      executarComandoEditor('createLink', url);
    }
  };

  const handleInsertImage = async () => {
    const url = await pedirPrompt('Digite a URL da imagem:', '', 'https://...');
    if (url) {
      executarComandoEditor('insertImage', url);
    }
  };

  const handleInsertYouTube = async () => {
    const url = await pedirPrompt('Digite o link do vídeo do YouTube ou ID do vídeo:', '', 'https://www.youtube.com/watch?v=...');
    if (url) {
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/);
      const videoId = match ? match[1] : url;
      const iframeHTML = `<div class="my-4 aspect-video max-w-xl mx-auto"><iframe src="https://www.youtube.com/embed/${videoId}" class="w-full h-full rounded border border-zinc-800" allowfullscreen></iframe></div>`;
      executarComandoEditor('insertHTML', iframeHTML);
    }
  };

  const handleInsertTable = async () => {
    const rowsStr = await pedirPrompt('Digite o número de linhas da tabela:', '3', '3');
    if (!rowsStr) return;
    const colsStr = await pedirPrompt('Digite o número de colunas da tabela:', '2', '2');
    if (!colsStr) return;
    const rows = parseInt(rowsStr || '0');
    const cols = parseInt(colsStr || '0');
    if (rows > 0 && cols > 0) {
      let tableHTML = '<table class="w-full border-collapse border border-zinc-800 my-4 text-xs font-sans">';
      for (let i = 0; i < rows; i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < cols; j++) {
          if (i === 0) {
            tableHTML += '<th class="border border-zinc-800 bg-zinc-900 text-zinc-100 p-2 font-semibold">Cabeçalho</th>';
          } else {
            tableHTML += '<td class="border border-zinc-800 p-2 text-zinc-300">Célula</td>';
          }
        }
        tableHTML += '</tr>';
      }
      tableHTML += '</table>';
      executarComandoEditor('insertHTML', tableHTML);
    }
  };

  const handleImportHTML = async () => {
    const html = await pedirPrompt('Cole o código HTML que deseja importar:', '', '<div>...</div>');
    if (html) {
      executarComandoEditor('insertHTML', html);
    }
  };

  const handleLineHeight = async () => {
    const height = await pedirPrompt('Digite a altura da linha (ex: 1.5, 2, normal):', '1.5', '1.5');
    if (height) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const parentElement = range.commonAncestorContainer.parentElement;
        if (parentElement) {
          parentElement.style.lineHeight = height;
          if (editorRef.current) {
            setTreinoConteudo(editorRef.current.innerHTML);
          }
        }
      }
    }
  };

  // Form states for Application creation
  const [mostrarFormAplicacao, setMostrarFormAplicacao] = useState(false);
  const [novaAppAlunos, setNovaAppAlunos] = useState<{ nick: string; status: 'aprovado' | 'reprovado' }[]>([]);
  const [novaAppObs, setNovaAppObs] = useState('');
  const [buscaAlunoNick, setBuscaAlunoNick] = useState('');
  const [appMsgSucesso, setAppMsgSucesso] = useState('');
  const [appMsgErro, setAppMsgErro] = useState('');

  // Search & lookup
  const [buscaMilitar, setBuscaMilitar] = useState('');
  const [militarSelecionado, setMilitarSelecionado] = useState<Policial | null>(null);

  // Radio Habblet Integration states
  const [radioProfile, setRadioProfile] = useState<any>(null);
  const [loadingRadioProfile, setLoadingRadioProfile] = useState(false);
  const [radioProfileError, setRadioProfileError] = useState('');

  // Mural Form states
  const [avisoTitulo, setAvisoTitulo] = useState('');
  const [avisoConteudo, setAvisoConteudo] = useState('');
  const [avisoTipo, setAvisoTipo] = useState<'urgente' | 'promocao' | 'geral'>('geral');
  const [avisoImagemUrl, setAvisoImagemUrl] = useState('');
  const [avisoCorFundo, setAvisoCorFundo] = useState<string>('default');
  const [avisoNegrito, setAvisoNegrito] = useState(false);
  const [avisoItalico, setAvisoItalico] = useState(false);
  const [avisoMarcarEveryone, setAvisoMarcarEveryone] = useState(false);
  const [avisoPosicaoImagem, setAvisoPosicaoImagem] = useState<'topo' | 'esquerda' | 'direita' | 'fundo'>('topo');
  const [avisoImagemFundoUrl, setAvisoImagemFundoUrl] = useState('');
  const [avisoTemplateNoticia, setAvisoTemplateNoticia] = useState<'padrao' | 'noticia' | 'militar' | 'tecnologico' | 'urgente-critico'>('padrao');
  const [msgAvisoSucesso, setMsgAvisoSucesso] = useState('');

  // Profile Edit states
  const [editBio, setEditBio] = useState(policial.biografia || '');
  const [editAvatar, setEditAvatar] = useState(policial.avatarHabbo);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [msgPerfilSucesso, setMsgPerfilSucesso] = useState('');

  // Clock
  const [horaLocal, setHoraLocal] = useState('');

  // Sign presence
  const [assinouPresenca, setAssinouPresenca] = useState(false);
  const [msgPresenca, setMsgPresenca] = useState('');

  // Categories Modal/Form states
  const [modalCategoriaAberto, setModalCategoriaAberto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<PatenteCategoria | null>(null);
  const [categoriaNome, setCategoriaNome] = useState('');
  const [categoriaSubtitulo, setCategoriaSubtitulo] = useState('');
  const [categoriaOrdem, setCategoriaOrdem] = useState<string>('1');

  // Patentes Modal/Form states
  const [modalPatenteAberto, setModalPatenteAberto] = useState(false);
  const [patenteEditando, setPatenteEditando] = useState<Patente | null>(null);
  const [patenteCategoriaId, setPatenteCategoriaId] = useState('');
  const [patenteNome, setPatenteNome] = useState('');
  const [patenteEquivalente, setPatenteEquivalente] = useState('');
  const [patenteSalario, setPatenteSalario] = useState('');
  const [patenteInsignia, setPatenteInsignia] = useState('');
  const [patenteResponsabilidade, setPatenteResponsabilidade] = useState('');

  // Groups Modal/Form states
  const [buscaGrupo, setBuscaGrupo] = useState('');
  const [abaGrupos, setAbaGrupos] = useState<'todos' | 'meus'>('todos');
  const [modalGrupoAberto, setModalGrupoAberto] = useState(false);
  const [grupoEditando, setGrupoEditando] = useState<Grupo | null>(null);
  const [grupoNome, setGrupoNome] = useState('');
  const [grupoSigla, setGrupoSigla] = useState('');
  const [grupoDescricao, setGrupoDescricao] = useState('');
  const [grupoUrlImagem, setGrupoUrlImagem] = useState('');
  const [grupoPublico, setGrupoPublico] = useState(true);
  const [grupoAceitaMembros, setGrupoAceitaMembros] = useState(true);
  const [grupoVerificado, setGrupoVerificado] = useState(false);
  const [novoMembroNick, setNovoMembroNick] = useState('');
  const [msgGrupoErro, setMsgGrupoErro] = useState('');
  const [msgGrupoSucesso, setMsgGrupoSucesso] = useState('');

  // Promoção / Rebaixamento Active tab form states
  const [promocaoTargetNick, setPromocaoTargetNick] = useState('');
  const [buscaPromoUsuario, setBuscaPromoUsuario] = useState('');
  const [promocaoTargetCategoriaId, setPromocaoTargetCategoriaId] = useState('');
  const [promocaoTargetPatenteId, setPromocaoTargetPatenteId] = useState('');
  const [promocaoTipo, setPromocaoTipo] = useState<'promocao' | 'rebaixamento'>('promocao');
  const [promocaoMotivo, setPromocaoMotivo] = useState('Excelente dedicação demonstrada em atividades no QG.');
  const [msgPromoSucesso, setMsgPromoSucesso] = useState('');
  const [msgPromoErro, setMsgPromoErro] = useState('');

  // Points Add Form states
  const [pontosTargetNick, setPontosTargetNick] = useState('');
  const [pontosQuantidade, setPontosQuantidade] = useState('10');
  const [msgPontosSucesso, setMsgPontosSucesso] = useState('');

  // XP Page State Variables
  const [enviosXP, setEnviosXP] = useState<EnvioXP[]>([]);
  const [mostrarFormXP, setMostrarFormXP] = useState(false);
  const [xpMotivo, setXpMotivo] = useState('');
  const [xpValor, setXpValor] = useState('5');
  const [xpDestinatarios, setXpDestinatarios] = useState<string[]>([]);
  const [editandoXP, setEditandoXP] = useState<EnvioXP | null>(null);
  const [detalhesXP, setDetalhesXP] = useState<EnvioXP | null>(null);
  const [msgXPSucesso, setMsgXPSucesso] = useState('');
  const [msgXPErro, setMsgXPErro] = useState('');

  // A conta 'admin' é oculta de todas as listas de usuários, buscas, pódio/ranking e contadores.
  const listaPoliciais = filtrarPoliciaisVisiveis(Object.values(policiais) as Policial[]);

  // Redirect to first permitted tab if active tab is not allowed
  useEffect(() => {
    const permissoes = obterPermissoesUsuario();
    if (!permissoes.abasAcessiveis.includes(abaAtiva) && abaAtiva !== 'gestao_site' && abaAtiva !== 'setores_diversos') {
      const primeiroDisponivel = permissoes.abasAcessiveis.find(tab => tab !== 'gestao_site');
      if (primeiroDisponivel) {
        setAbaAtiva(primeiroDisponivel as any);
      }
    }
  }, [abaAtiva, policial]);

  // Synchronize tipoNovoPostCustom and filter when customAbaAtivaId changes
  useEffect(() => {
    if (abaAtiva === 'setores_diversos' && customAbaAtivaId) {
      const currentAba = (configSite.abasCustomizadas || []).find(aba => aba.id === customAbaAtivaId);
      if (currentAba) {
        const tipoAba = currentAba.tipoConteudo || 'ambos';
        if (tipoAba === 'aviso') {
          setTipoNovoPostCustom('aviso');
          setFiltroPostCustom('aviso');
        } else if (tipoAba === 'documento') {
          setTipoNovoPostCustom('documento');
          setFiltroPostCustom('documento');
        } else {
          setFiltroPostCustom('tudo');
        }
      }
    }
  }, [abaAtiva, customAbaAtivaId, configSite.abasCustomizadas]);

  // Dynamic automatic user profile refresh in the background on mount and periodically
  useEffect(() => {
    if (!policial || !policial.avatarHabbo) return;

    const autoRefreshProfile = async () => {
      try {
        const resProfile = await fetch(`/api/radiohabblet/profile/${encodeURIComponent(policial.avatarHabbo)}`);
        if (resProfile.ok) {
          const dataProfile = await resProfile.json();
          if (dataProfile.sucesso && dataProfile.perfil && dataProfile.perfil.photo) {
            const newFoto = dataProfile.perfil.photo;
            if (newFoto !== policial.fotoUrl) {
              const updated = atualizarPerfilPolicial(policial.nick, policial.biografia || '', policial.avatarHabbo, newFoto);
              setPolicial(updated);
              setVisualVersion(Date.now());
              carregarDados();
            }
          }
        }
      } catch (err) {
        console.warn('Silent user profile refresh failed:', err);
      }
    };

    // Run initially
    autoRefreshProfile();

    // Set up polling interval every 60 seconds
    const intervalId = setInterval(autoRefreshProfile, 60000);

    return () => clearInterval(intervalId);
  }, [policial?.avatarHabbo]);

  useEffect(() => {
    carregarDados();

    const atualizarRelogio = () => {
      const agora = new Date();
      setHoraLocal(agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    atualizarRelogio();
    const interval = setInterval(atualizarRelogio, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sincronização automática periódica com o Supabase: sem isso, dados salvos
  // por OUTRO usuário só apareciam depois que cada pessoa desse F5 na página
  // (o pull do banco só rodava uma vez, no carregamento inicial do App).
  // Com o intervalo abaixo, o painel busca o que há de novo no banco a cada
  // 3 segundos e atualiza a tela automaticamente, sem precisar recarregar.
  useEffect(() => {
    let cancelado = false;
    let sincronizando = false;

    const intervaloSync = setInterval(async () => {
      if (sincronizando || cancelado) return;
      if (houveEscritaLocalRecente()) return;
      sincronizando = true;
      try {
        const res = await sincronizarTudoDoSupabase();
        if (!cancelado && res.sucesso) {
          carregarDados();
        }
      } catch (e) {
        console.warn('[Auto Sync Periódico] Falha ao sincronizar com o Supabase:', e);
      } finally {
        sincronizando = false;
      }
    }, 3000);

    return () => {
      cancelado = true;
      clearInterval(intervaloSync);
    };
  }, []);

  useEffect(() => {
    setRadioProfile(null);
    setRadioProfileError('');
  }, [militarSelecionado]);

  const carregarDados = () => {
    setAvisos(obterAvisos());
    setPoliciais(obterPoliciais());
    setMovimentacoes(obterMovimentacoes());
    setCategorias(obterCategorias());
    setPatentes(obterPatentes());
    setGrupos(obterGrupos());
    setTreinamentos(obterTreinamentos());
    setAplicacoesTreinamentos(obterAplicacoesTreinamentos());
    setEnviosXP(obterEnviosXP());
    setAdvertencias(obterAdvertencias());
    setExoneracoes(obterExoneracoes());
    setSolicitacoes(obterSolicitacoesCadastro());
    setApostilasGerencia(obterApostilas());
    setPostsCustom(obterPostsAbasCustomizadas());

    const config = obterConfiguracaoSite();
    setConfigSite(config);
    setGSiteNome(config.nomeSite || '');
    setGSiteSubtitulo(config.subtituloSite || '');
    setGLogoTexto(config.logoTexto || '');
    setGLogoUrl(config.logoUrl || '');
    setGLoginMensagem(config.loginMensagem || '');
    setGWebhookDiscord(config.webhookDiscord || '');
    setGWebhookAvisos(config.webhookAvisos || '');
    setGWebhookMovimentacoes(config.webhookMovimentacoes || '');
    setGWebhookAdvertencias(config.webhookAdvertencias || '');
    setGWebhookExoneracoes(config.webhookExoneracoes || '');
    setGWebhookBackup(config.webhookBackup || '');
    setGWebhookDiscordEntradas(config.webhookDiscordEntradas || '');
    setGLinkDiscord(config.linkDiscord || '');
    setGCargosPermissoes(config.cargosPermissoes || {});
  };

  const selecionarMilitarERefreshar = async (p: Policial) => {
    setMilitarSelecionado(p);
    try {
      const resProfile = await fetch(`/api/radiohabblet/profile/${encodeURIComponent(p.avatarHabbo)}`);
      if (resProfile.ok) {
        const dataProfile = await resProfile.json();
        if (dataProfile.sucesso && dataProfile.perfil && dataProfile.perfil.photo) {
          const newFoto = dataProfile.perfil.photo;
          if (newFoto !== p.fotoUrl) {
            const updated = atualizarPerfilPolicial(p.nick, p.biografia || '', p.avatarHabbo, newFoto);
            setPoliciais(prev => ({
              ...prev,
              [p.nick.toLowerCase().trim()]: updated
            }));
            setMilitarSelecionado(updated);
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao atualizar avatar do policial selecionado:', err);
    }
  };

  const lidarComSincronizarVisual = async () => {
    if (!policial || !policial.avatarHabbo) return;
    setSincronizandoVisual(true);
    try {
      const resProfile = await fetch(`/api/radiohabblet/profile/${encodeURIComponent(policial.avatarHabbo)}`);
      if (resProfile.ok) {
        const dataProfile = await resProfile.json();
        if (dataProfile.sucesso && dataProfile.perfil && dataProfile.perfil.photo) {
          const newFoto = dataProfile.perfil.photo;
          const updated = atualizarPerfilPolicial(policial.nick, policial.biografia || '', policial.avatarHabbo, newFoto);
          setPolicial(updated);
          setVisualVersion(Date.now());
          carregarDados();
          safeAlert('Visual sincronizado com sucesso!');
        } else {
          safeAlert('Não foi possível obter os dados do Habblet no momento. Verifique se o Nick está correto.');
        }
      } else {
        safeAlert('Erro ao conectar com o serviço de sincronização do visual.');
      }
    } catch (err) {
      console.error(err);
      safeAlert('Falha técnica na sincronização do visual.');
    } finally {
      setSincronizandoVisual(false);
    }
  };

  const obterOrdemCargo = (cargoNome: string): number => {
    if (cargoNome === 'Diretor' || cargoNome === 'Diretor Geral') return -1000;
    if (cargoNome === 'Administrador' || cargoNome === 'Fundador') return -999;
    
    const patente = patentes.find(p => p.nome === cargoNome);
    if (!patente) return 999;
    
    const catIndex = categorias.findIndex(c => c.id === patente.categoriaId);
    const catOrdem = catIndex >= 0 ? catIndex : 999;
    
    return (catOrdem * 100) + patente.ordem;
  };

  const lidarComSalvarApostilaGerencia = (e: FormEvent) => {
    e.preventDefault();
    if (!apTitulo.trim()) {
      setMsgConfigErro('O título da apostila é obrigatório!');
      setTimeout(() => setMsgConfigErro(''), 4000);
      return;
    }

    const novaApostila: Apostila = {
      id: editandoApostila?.id || `ap_${Date.now()}`,
      titulo: apTitulo.trim(),
      descricao: apDescricao.trim(),
      partes: apPartes,
      criadoPor: policial.nick,
      dataCriacao: editandoApostila?.dataCriacao || new Date().toLocaleDateString('pt-BR')
    };

    const res = salvarApostila(novaApostila);
    if (res.sucesso) {
      setMsgConfigSucesso(res.mensagem);
      setEditandoApostila(null);
      setApTitulo('');
      setApDescricao('');
      setApPartes([]);
      setNovaParteTitulo('');
      setNovaParteConteudo('');
      setParteEmEdicaoId(null);
      carregarDados();
      setTimeout(() => setMsgConfigSucesso(''), 4000);
    }
  };

  const lidarComExcluirApostilaGerencia = (id: string) => {
    if (!safeConfirm('Tem certeza de que deseja excluir esta apostila permanentemente?')) return;
    const res = excluirApostila(id);
    if (res.sucesso) {
      setMsgConfigSucesso(res.mensagem);
      carregarDados();
      setTimeout(() => setMsgConfigSucesso(''), 4000);
    }
  };

  const iniciarCriacaoApostila = () => {
    setEditandoApostila({
      id: '',
      titulo: '',
      descricao: '',
      partes: [],
      criadoPor: policial.nick,
      dataCriacao: new Date().toLocaleDateString('pt-BR')
    });
    setApTitulo('');
    setApDescricao('');
    setApPartes([]);
    setNovaParteTitulo('');
    setNovaParteSubtitulo('');
    setNovaParteConteudo('');
    setParteEmEdicaoId(null);
  };

  const iniciarEdicaoApostila = (ap: Apostila) => {
    setEditandoApostila(ap);
    setApTitulo(ap.titulo);
    setApDescricao(ap.descricao);
    setApPartes(ap.partes || []);
    setNovaParteTitulo('');
    setNovaParteSubtitulo('');
    setNovaParteConteudo('');
    setParteEmEdicaoId(null);
  };

  // Carrega os dados de uma seção já adicionada no formulário lateral para edição
  const iniciarEdicaoParte = (p: ApostilaParte) => {
    setParteEmEdicaoId(p.id);
    setNovaParteTitulo(p.tituloParte);
    setNovaParteSubtitulo(p.subtituloParte || '');
    setNovaParteConteudo(p.conteudo);
  };

  const cancelarEdicaoParte = () => {
    setParteEmEdicaoId(null);
    setNovaParteTitulo('');
    setNovaParteSubtitulo('');
    setNovaParteConteudo('');
  };

  const adicionarParteAEditar = () => {
    if (!novaParteTitulo.trim() || !novaParteConteudo.trim()) {
      safeAlert('Preencha o título e o conteúdo da parte antes de adicionar.');
      return;
    }

    if (parteEmEdicaoId) {
      // Estamos editando uma seção já existente na lista: atualiza no lugar, sem mudar a ordem
      setApPartes(prev => prev.map(p => p.id === parteEmEdicaoId
        ? {
            ...p,
            tituloParte: novaParteTitulo.trim(),
            subtituloParte: novaParteSubtitulo.trim() || undefined,
            conteudo: novaParteConteudo.trim()
          }
        : p
      ));
      setParteEmEdicaoId(null);
    } else {
      const novaParte: ApostilaParte = {
        id: `parte_${Date.now()}`,
        tituloParte: novaParteTitulo.trim(),
        subtituloParte: novaParteSubtitulo.trim() || undefined,
        conteudo: novaParteConteudo.trim()
      };
      setApPartes(prev => [...prev, novaParte]);
    }

    setNovaParteTitulo('');
    setNovaParteSubtitulo('');
    setNovaParteConteudo('');
  };

  const removerParteAEditar = (id: string) => {
    if (!safeConfirm('Tem certeza de que deseja remover esta parte/capítulo da apostila?')) return;
    setApPartes(prev => prev.filter(p => p.id !== id));
    // Se a seção removida estava sendo editada, cancela o modo de edição
    if (parteEmEdicaoId === id) {
      cancelarEdicaoParte();
    }
  };

  // Move uma seção para cima ou para baixo na lista, ajustando a ordem de exibição na apostila
  const moverParteAEditar = (id: string, direcao: 'cima' | 'baixo') => {
    setApPartes(prev => {
      const index = prev.findIndex(p => p.id === id);
      if (index < 0) return prev;
      const novoIndex = direcao === 'cima' ? index - 1 : index + 1;
      if (novoIndex < 0 || novoIndex >= prev.length) return prev;
      const nova = [...prev];
      [nova[index], nova[novoIndex]] = [nova[novoIndex], nova[index]];
      return nova;
    });
  };

  const lidarComSalvarPerfil = async (e: FormEvent) => {
    e.preventDefault();
    setSalvandoPerfil(true);
    try {
      let fotoUrl: string | undefined = undefined;
      try {
        const resProfile = await fetch(`/api/radiohabblet/profile/${encodeURIComponent(editAvatar.trim())}`);
        if (resProfile.ok) {
          const dataProfile = await resProfile.json();
          if (dataProfile.sucesso && dataProfile.perfil && dataProfile.perfil.photo) {
            fotoUrl = dataProfile.perfil.photo;
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar avatar da Rádio Habblet no perfil:', err);
      }

      const atualizado = atualizarPerfilPolicial(policial.nick, editBio, editAvatar, fotoUrl);
      setPolicial(atualizado);
      setMsgPerfilSucesso('Perfil militar atualizado com sucesso!');
      carregarDados();
      setTimeout(() => setMsgPerfilSucesso(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const lidarComCriarAviso = (e: FormEvent) => {
    e.preventDefault();
    if (!avisoTitulo.trim() || !avisoConteudo.trim()) return;

    criarAviso(
      avisoTitulo.trim(),
      avisoConteudo.trim(),
      policial.nick,
      avisoTipo,
      avisoImagemUrl.trim() || undefined,
      avisoCorFundo !== 'default' ? avisoCorFundo : undefined,
      avisoNegrito,
      avisoItalico,
      avisoMarcarEveryone,
      avisoPosicaoImagem,
      avisoImagemFundoUrl.trim() || undefined,
      avisoTemplateNoticia
    );
    setAvisoTitulo('');
    setAvisoConteudo('');
    setAvisoTipo('geral');
    setAvisoImagemUrl('');
    setAvisoCorFundo('default');
    setAvisoNegrito(false);
    setAvisoItalico(false);
    setAvisoMarcarEveryone(false);
    setAvisoPosicaoImagem('topo');
    setAvisoImagemFundoUrl('');
    setAvisoTemplateNoticia('padrao');
    setMsgAvisoSucesso('Aviso militar publicado no mural!');
    carregarDados();
    setTimeout(() => setMsgAvisoSucesso(''), 4000);
  };

  const lidarComExcluirAviso = (avisoId: string) => {
    if (!permissoesUser.podeExcluirAvisos) {
      safeAlert('Você não possui permissão para excluir avisos do mural.');
      return;
    }

    solicitarConfirmacaoApagar(
      'REMOVER DIRETRIZ MILITAR',
      'Tem certeza de que deseja EXCLUIR DEFINITIVAMENTE este aviso do mural oficial? Esta ação é irreversível.',
      () => {
        try {
          excluirAviso(avisoId);
          carregarDados();
        } catch (err) {
          console.error(err);
          safeAlert('Erro ao tentar excluir o aviso.');
        }
      }
    );
  };

  const assinarLivroPresenca = () => {
    adicionarPontos(policial.nick, 10);
    const updated = obterPoliciais()[policial.nick.toLowerCase().trim()];
    if (updated) {
      updated.presencas += 1;
      salvarPolicial(updated);
      setPolicial({ ...updated });
    }
    setAssinouPresenca(true);
    setMsgPresenca('Você assinou a ata diária e recebeu +10 Pontos de Promoção!');
    carregarDados();
  };

  // Categoria actions
  const abrirCriarCategoria = () => {
    setCategoriaEditando(null);
    setCategoriaNome('');
    setCategoriaSubtitulo('');
    const proxOrdem = categorias.length > 0 ? Math.max(...categorias.map(c => c.ordem ?? 0)) + 1 : 1;
    setCategoriaOrdem(proxOrdem.toString());
    setModalCategoriaAberto(true);
  };

  const abrirEditarCategoria = (c: PatenteCategoria) => {
    setCategoriaEditando(c);
    setCategoriaNome(c.nome);
    setCategoriaSubtitulo(c.subtitulo || '');
    setCategoriaOrdem((c.ordem ?? 1).toString());
    setModalCategoriaAberto(true);
  };

  const lidarComSalvarCategoria = (e: FormEvent) => {
    e.preventDefault();
    if (!categoriaNome.trim()) return;

    if (!safeConfirm(`Tem certeza de que deseja salvar as alterações para a categoria "${categoriaNome.trim()}"?`)) return;

    const ordNum = parseInt(categoriaOrdem, 10);
    const finalOrdem = isNaN(ordNum) ? (categoriaEditando?.ordem ?? 1) : ordNum;

    const novaCat: PatenteCategoria = {
      id: categoriaEditando ? categoriaEditando.id : 'cat_' + Date.now().toString(),
      nome: categoriaNome.trim(),
      subtitulo: categoriaSubtitulo.trim() || undefined,
      ordem: finalOrdem
    };

    salvarCategoria(novaCat);
    setModalCategoriaAberto(false);
    carregarDados();
  };

  const lidarComExcluirCategoria = (id: string) => {
    if (safeConfirm('Tem certeza que deseja excluir esta categoria? Todas as patentes dentro dela serão removidas.')) {
      excluirCategoria(id);
      carregarDados();
    }
  };

  const reordenarCategoria = (c: PatenteCategoria, direcao: 'up' | 'down') => {
    const list = [...categorias].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    list.forEach((item, idx) => {
      if (typeof item.ordem !== 'number') {
        item.ordem = idx + 1;
      }
    });

    const idx = list.findIndex(item => item.id === c.id);
    if (direcao === 'up' && idx > 0) {
      const prev = list[idx - 1];
      const tempOrdem = prev.ordem;
      prev.ordem = list[idx].ordem;
      list[idx].ordem = tempOrdem;
      salvarCategoria(prev);
      salvarCategoria(list[idx]);
    } else if (direcao === 'down' && idx < list.length - 1) {
      const next = list[idx + 1];
      const tempOrdem = next.ordem;
      next.ordem = list[idx].ordem;
      list[idx].ordem = tempOrdem;
      salvarCategoria(next);
      salvarCategoria(list[idx]);
    }
    carregarDados();
  };

  // Patente actions
  const abrirCriarPatente = (catId: string) => {
    setPatenteEditando(null);
    setPatenteCategoriaId(catId);
    setPatenteNome('');
    setPatenteEquivalente('');
    setPatenteSalario('');
    setPatenteInsignia('■');
    setPatenteResponsabilidade('');
    setModalPatenteAberto(true);
  };

  const abrirEditarPatente = (p: Patente) => {
    setPatenteEditando(p);
    setPatenteCategoriaId(p.categoriaId);
    setPatenteNome(p.nome);
    setPatenteEquivalente(p.equivalente || '');
    setPatenteSalario(p.salario || '');
    setPatenteInsignia(p.insignia || '');
    setPatenteResponsabilidade(p.responsabilidade || '');
    setModalPatenteAberto(true);
  };

  const lidarComSalvarPatente = (e: FormEvent) => {
    e.preventDefault();
    if (!patenteNome.trim()) return;

    if (!safeConfirm(`Tem certeza de que deseja salvar as alterações para a patente/cargo "${patenteNome.trim()}"?`)) return;

    const patentesDaCat = patentes.filter(item => item.categoriaId === patenteCategoriaId);
    const proximaOrdem = patenteEditando ? patenteEditando.ordem : (patentesDaCat.length > 0 ? Math.max(...patentesDaCat.map(p => p.ordem)) + 1 : 1);

    const novaPatente: Patente = {
      id: patenteEditando ? patenteEditando.id : 'pat_' + Date.now().toString(),
      categoriaId: patenteCategoriaId,
      nome: patenteNome.trim(),
      ordem: proximaOrdem,
      equivalente: patenteEquivalente.trim() || undefined,
      salario: patenteSalario.trim() || undefined,
      insignia: patenteInsignia.trim() || undefined,
      responsabilidade: patenteResponsabilidade.trim() || undefined
    };

    salvarPatente(novaPatente);
    setModalPatenteAberto(false);
    carregarDados();
  };

  const lidarComExcluirPatente = (id: string) => {
    if (safeConfirm('Tem certeza que deseja excluir esta patente?')) {
      excluirPatente(id);
      carregarDados();
    }
  };

  const reordenarPatente = (p: Patente, direcao: 'up' | 'down') => {
    const patentesDaCat = patentes.filter(item => item.categoriaId === p.categoriaId).sort((a, b) => a.ordem - b.ordem);
    const idx = patentesDaCat.findIndex(item => item.id === p.id);
    if (direcao === 'up' && idx > 0) {
      const prev = patentesDaCat[idx - 1];
      const temp = prev.ordem;
      prev.ordem = p.ordem;
      p.ordem = temp;
      salvarPatente(prev);
      salvarPatente(p);
    } else if (direcao === 'down' && idx < patentesDaCat.length - 1) {
      const next = patentesDaCat[idx + 1];
      const temp = next.ordem;
      next.ordem = p.ordem;
      p.ordem = temp;
      salvarPatente(next);
      salvarPatente(p);
    }
    carregarDados();
  };

  // Promoção e Rebaixamento tab actions
  const lidarComPromoDecreto = (e: FormEvent) => {
    e.preventDefault();
    setMsgPromoSucesso('');
    setMsgPromoErro('');

    if (!promocaoTargetNick) {
      setMsgPromoErro('Por favor, selecione um policial.');
      return;
    }
    if (!promocaoTargetPatenteId) {
      setMsgPromoErro('Por favor, selecione a nova patente.');
      return;
    }

    const patenteAlvo = patentes.find(p => p.id === promocaoTargetPatenteId);
    if (!patenteAlvo) {
      setMsgPromoErro('Patente selecionada é inválida.');
      return;
    }

    const confirmacao = safeConfirm(`Tem certeza de que deseja ${promocaoTipo === 'promocao' ? 'promover' : 'rebaixar'} o militar @${promocaoTargetNick} para a patente de ${patenteAlvo.nome}?`);
    if (!confirmacao) return;

    const res = alterarPatentePolicial(promocaoTargetNick, patenteAlvo.nome, promocaoTipo, promocaoMotivo, policial.nick);
    if (res.sucesso) {
      setMsgPromoSucesso(`O militar ${promocaoTargetNick} foi ${promocaoTipo === 'promocao' ? 'promovido' : 'rebaixado'} para ${patenteAlvo.nome} com sucesso!`);
      setPromocaoTargetNick('');
      setBuscaPromoUsuario('');
      setPromocaoTargetPatenteId('');
      setPromocaoMotivo('Excelente dedicação demonstrada em atividades no QG.');
      carregarDados();
      setTimeout(() => setMsgPromoSucesso(''), 5000);
    } else {
      setMsgPromoErro('Ocorreu um erro ao atualizar a patente.');
    }
  };

  const lidarComAdicionarPontosGeral = (e: FormEvent) => {
    e.preventDefault();
    setMsgPontosSucesso('');
    if (!pontosTargetNick) return;

    const pts = parseInt(pontosQuantidade, 10);
    if (isNaN(pts)) return;

    const res = adicionarPontos(pontosTargetNick, pts);
    if (res.sucesso) {
      setMsgPontosSucesso(`Sucesso! Concedidos +${pts} pontos para ${pontosTargetNick}.`);
      setPontosTargetNick('');
      setPontosQuantidade('10');
      carregarDados();
      setTimeout(() => setMsgPontosSucesso(''), 5000);
    }
  };

  const lidarComSalvarXP = (e: FormEvent) => {
    e.preventDefault();
    setMsgXPErro('');
    setMsgXPSucesso('');

    if (!permissoesUser.podeEnviarXP && !eMaster) {
      setMsgXPErro('Você não possui permissão operacional para enviar ou editar XP.');
      return;
    }

    if (!xpMotivo.trim()) {
      setMsgXPErro('O motivo é obrigatório.');
      return;
    }
    if (xpDestinatarios.length === 0) {
      setMsgXPErro('Selecione pelo menos um militar destinatário.');
      return;
    }
    const valorNum = parseInt(xpValor, 10);
    if (isNaN(valorNum) || valorNum === 0) {
      setMsgXPErro('O valor de XP deve ser um número diferente de zero (positivo para adicionar ou negativo para remover).');
      return;
    }

    if (editandoXP) {
      // Revert previous XP points for previous recipients
      editandoXP.destinatarios.forEach((nick) => {
        adicionarPontos(nick, -editandoXP.valor);
      });
      // Apply new XP points to current recipients
      xpDestinatarios.forEach((nick) => {
        adicionarPontos(nick, valorNum);
      });

      const envioAtualizado: EnvioXP = {
        ...editandoXP,
        motivo: xpMotivo,
        valor: valorNum,
        destinatarios: xpDestinatarios,
      };
      salvarEnvioXP(envioAtualizado);
      setMsgXPSucesso('Registro de XP atualizado com sucesso!');
    } else {
      // Add or remove points for each recipient
      xpDestinatarios.forEach((nick) => {
        adicionarPontos(nick, valorNum);
      });

      // Format date beautifully
      const dataHora = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const novoEnvio: EnvioXP = {
        id: 'xp_' + Date.now(),
        motivo: xpMotivo,
        valor: valorNum,
        destinatarios: xpDestinatarios,
        enviadoPor: policial.nick,
        data: dataHora,
      };

      salvarEnvioXP(novoEnvio);
      const msgOp = valorNum > 0 ? 'XP enviado com sucesso!' : 'XP removido com sucesso!';
      setMsgXPSucesso(msgOp);
    }

    // Reset fields
    setXpMotivo('');
    setXpValor('5');
    setXpDestinatarios([]);
    setEditandoXP(null);
    setMostrarFormXP(false);
    carregarDados();
    setTimeout(() => setMsgXPSucesso(''), 5000);
  };

  const lidarComExcluirXP = (id: string) => {
    if (!safeConfirm('Tem certeza de que deseja excluir permanentemente este registro de XP?')) return;
    excluirEnvioXP(id);
    carregarDados();
    setMsgXPSucesso('Registro de XP excluído com sucesso.');
    setTimeout(() => setMsgXPSucesso(''), 4000);
  };

  // Warnings and Exonerations handlers
  const lidarComSalvarAdvertencia = (e: FormEvent) => {
    e.preventDefault();
    if (!advPolicialNick) {
      setMsgAdvErro('Por favor, selecione o policial.');
      return;
    }
    if (!advMotivo.trim()) {
      setMsgAdvErro('O motivo da advertência é obrigatório.');
      return;
    }
    const novaAdv: Advertencia = {
      id: 'adv_' + Math.random().toString(36).substr(2, 9),
      nickPolicial: advPolicialNick,
      quantidade: advQuantidade,
      prazoVencimento: advPrazo,
      motivo: advMotivo,
      autor: policial.nick,
      data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      ativa: true
    };
    salvarAdvertencia(novaAdv);
    setMsgAdvSucesso(`Advertência aplicada com sucesso para @${advPolicialNick}!`);
    setAdvPolicialNick('');
    setAdvQuantidade(1);
    setAdvPrazo('30 dias');
    setAdvMotivo('');
    setMsgAdvErro('');
    carregarDados();
    setTimeout(() => setMsgAdvSucesso(''), 4000);
  };

  const lidarComAlternarAdvertencia = (adv: Advertencia) => {
    const atualizada = { ...adv, ativa: !adv.ativa };
    salvarAdvertencia(atualizada);
    setMsgAdvSucesso(`Status da advertência atualizado!`);
    carregarDados();
    setTimeout(() => setMsgAdvSucesso(''), 3000);
  };

  const lidarComExcluirAdvertencia = (id: string) => {
    solicitarConfirmacaoApagar(
      'EXCLUIR ADVERTÊNCIA MILITAR',
      'Tem certeza de que deseja EXCLUIR DEFINITIVAMENTE esta advertência? Esta ação é irreversível.',
      () => {
        try {
          excluirAdvertencia(id);
          setMsgAdvSucesso('Advertência excluída com sucesso.');
          carregarDados();
          setTimeout(() => setMsgAdvSucesso(''), 3000);
        } catch (err) {
          console.error(err);
          safeAlert('Erro ao tentar excluir a advertência.');
        }
      }
    );
  };

  const lidarComSalvarExoneracaoForm = (e: FormEvent) => {
    e.preventDefault();
    if (!exoPolicialNick) {
      setMsgExoErro('Selecione um policial.');
      return;
    }
    if (!exoMotivo.trim()) {
      setMsgExoErro('O motivo da exoneração é obrigatório.');
      return;
    }
    
    const confirmacao = safeConfirm(`ATENÇÃO EXTREMA: Tem certeza que deseja realizar o desligamento (${exoTipo === 'exoneracao' ? 'Exoneração' : 'Demissão'}) do policial @${exoPolicialNick}? Esta ação removerá o militar da corporação imediatamente e é irreversível!`);
    if (!confirmacao) return;

    const sucesso = exonerarPolicialNoBanco(exoPolicialNick, exoMotivo, policial.nick, exoTipo);
    if (sucesso) {
      setMsgExoSucesso(`O policial @${exoPolicialNick} foi desligado (${exoTipo === 'exoneracao' ? 'Exonerado' : 'Demitido'}) com sucesso!`);
      setExoPolicialNick('');
      setExoMotivo('');
      setMsgExoErro('');
      carregarDados();
      setTimeout(() => setMsgExoSucesso(''), 4000);
    } else {
      setMsgExoErro('Não foi possível realizar o desligamento. Policial não encontrado.');
      setTimeout(() => setMsgExoErro(''), 4000);
    }
  };

  // Save or Update Training
  const lidarComSalvarTreinamento = (e: FormEvent) => {
    e.preventDefault();
    if (!treinoTitulo.trim()) {
      safeAlert('O título do treinamento é obrigatório.');
      return;
    }
    const novoTreino: Treinamento = {
      id: modoEdicaoTreinamento && treinamentoSelecionado ? treinamentoSelecionado.id : 't_' + Date.now(),
      titulo: treinoTitulo,
      status: treinoStatus,
      descricao: treinoDescricao,
      conteudo: treinoConteudo,
      cargoVinculavel: treinoCargoVinculavel || undefined,
      patenteVinculavelId: treinoPatenteVinculavelId || undefined,
      permissoesCargos: treinoPermissoes,
      cargosQuePodemVer: treinoCargosQuePodemVer,
      permissoesAvaliadores: treinoPermissoesAvaliadores
    };
    salvarTreinamento(novoTreino);
    setEstaCriandoTreinamento(false);
    setModoEdicaoTreinamento(false);
    setTreinamentoSelecionado(null);
    carregarDados();
  };

  // Sync editor contents with training changes (when entering edit mode, creating, etc.)
  useEffect(() => {
    if ((estaCriandoTreinamento || modoEdicaoTreinamento) && modoEdicaoTexto === 'visual') {
      const t = setTimeout(() => {
        if (editorRef.current && editorRef.current.innerHTML !== treinoConteudo) {
          editorRef.current.innerHTML = treinoConteudo;
        }
      }, 50);
      return () => clearTimeout(t);
    }
  }, [estaCriandoTreinamento, modoEdicaoTreinamento, modoEdicaoTexto, treinamentoSelecionado, treinoConteudo]);

  // Sync editor contents with custom post content
  useEffect(() => {
    if (mostrarFormPostCustom && modoEdicaoTextoPostCustom === 'visual') {
      const t = setTimeout(() => {
        if (editorPostCustomRef.current && editorPostCustomRef.current.innerHTML !== conteudoNovoPostCustom) {
          editorPostCustomRef.current.innerHTML = conteudoNovoPostCustom;
        }
      }, 50);
      return () => clearTimeout(t);
    }
  }, [mostrarFormPostCustom, modoEdicaoTextoPostCustom, conteudoNovoPostCustom]);

  // Open Edit Form
  const abrirEditarTreinamento = (t: Treinamento) => {
    setTreinamentoSelecionado(t);
    setTreinoTitulo(t.titulo);
    setTreinoStatus(t.status);
    setTreinoDescricao(t.descricao);
    setTreinoConteudo(t.conteudo);
    setTreinoCargoVinculavel(t.cargoVinculavel || '');
    setTreinoPatenteVinculavelId(t.patenteVinculavelId || '');
    setTreinoPermissoes(t.permissoesCargos || []);
    setTreinoCargosQuePodemVer(t.cargosQuePodemVer || ['todos']);
    setTreinoPermissoesAvaliadores(t.permissoesAvaliadores || []);
    setModoEdicaoTreinamento(true);
    setEstaCriandoTreinamento(false);
    setModoEdicaoTexto('visual');
    setPreviewAtivo(false);
  };

  // Open Create Form
  const abrirCriarTreinamento = () => {
    setTreinoTitulo('');
    setTreinoStatus('publicada');
    setTreinoDescricao('');
    setTreinoConteudo('');
    setTreinoCargoVinculavel('');
    setTreinoPatenteVinculavelId('');
    setTreinoPermissoes([]);
    setEstaCriandoTreinamento(true);
    setModoEdicaoTreinamento(false);
    setTreinamentoSelecionado(null);
    setModoEdicaoTexto('visual');
    setPreviewAtivo(false);
  };

  // Delete Training
  const lidarComExcluirTreinamento = (id: string) => {
    solicitarConfirmacaoApagar(
      'EXCLUIR CURSO / TREINAMENTO',
      'Tem certeza que deseja excluir este treinamento de forma definitiva? Todas as aplicações e relatórios vinculados no histórico continuarão existindo.',
      () => {
        try {
          excluirTreinamento(id);
          if (treinamentoSelecionado && treinamentoSelecionado.id === id) {
            setTreinamentoSelecionado(null);
          }
          carregarDados();
        } catch (err) {
          console.error(err);
          safeAlert('Erro ao tentar excluir o treinamento.');
        }
      }
    );
  };

  // Add Aluno to Nova Aplicação List
  const adicionarAlunoAplicacao = () => {
    if (!buscaAlunoNick.trim()) return;
    const nickNormal = buscaAlunoNick.trim();
    if (novaAppAlunos.some(al => al.nick.toLowerCase() === nickNormal.toLowerCase())) {
      setAppMsgErro('Este militar já está na lista.');
      return;
    }
    setNovaAppAlunos([...novaAppAlunos, { nick: nickNormal, status: 'aprovado' }]);
    setBuscaAlunoNick('');
    setAppMsgErro('');
  };

  // Remove Aluno from Nova Aplicação List
  const removerAlunoAplicacao = (nick: string) => {
    setNovaAppAlunos(novaAppAlunos.filter(al => al.nick !== nick));
  };

  // Toggle student status in Nova Aplicação List
  const alternarStatusAlunoApp = (nick: string) => {
    setNovaAppAlunos(novaAppAlunos.map(al => {
      if (al.nick === nick) {
        return { ...al, status: al.status === 'aprovado' ? 'reprovado' : 'aprovado' };
      }
      return al;
    }));
  };

  // Submit Training Application
  const lidarComSalvarAplicacao = (e: FormEvent) => {
    e.preventDefault();
    if (!treinamentoSelecionado) return;
    if (novaAppAlunos.length === 0) {
      setAppMsgErro('Por favor, adicione pelo menos um aluno.');
      return;
    }

    const novaApp: AplicacaoTreinamento = {
      id: 'app_' + Date.now(),
      treinamentoId: treinamentoSelecionado.id,
      treinamentoTitulo: treinamentoSelecionado.titulo,
      instrutor: policial.nick,
      data: new Date().toLocaleString('pt-BR'),
      alunos: novaAppAlunos.map(al => ({
        nick: al.nick,
        status: al.status,
        vinculado: false
      })),
      observacoes: novaAppObs,
      statusAprovacao: 'pendente'
    };

    salvarAplicacaoTreinamento(novaApp);

    setNovaAppAlunos([]);
    setNovaAppObs('');
    setMostrarFormAplicacao(false);
    setAppMsgSucesso('Aplicação registrada com sucesso! Ela foi enviada para aprovação de uma patente superior.');
    setTimeout(() => setAppMsgSucesso(''), 5000);
    carregarDados();
  };

  // Approve Training Application (Only specific ranks / permissions can call this)
  const lidarComAprovarAplicacao = (appId: string) => {
    const app = aplicacoesTreinamentos.find(item => item.id === appId);
    if (!app) return;

    if (!safeConfirm('Tem certeza de que deseja APROVAR esta aplicação de treinamento? Os alunos aprovados receberão os pontos de promoção.')) return;

    const t = treinamentos.find(item => item.id === app.treinamentoId);
    const isSoldierTraining = t && (
      t.cargoVinculavel?.toLowerCase() === 'soldado' ||
      t.titulo?.toLowerCase()?.includes('soldado') ||
      t.titulo?.toLowerCase()?.includes('recruta')
    );

    // Add points to students marked as 'aprovado'
    app.alunos.forEach(al => {
      if (al.status === 'aprovado') {
        adicionarPontos(al.nick, 25);

        // Auto-approve pending alistamento requests if this is Soldier training
        if (isSoldierTraining) {
          try {
            const pendingReqs = obterSolicitacoesCadastro();
            const foundReq = pendingReqs.find(req => req.nick.toLowerCase().trim() === al.nick.toLowerCase().trim());
            if (foundReq) {
              aceitarSolicitacaoCadastro(foundReq.id, policial.nick);
            }
          } catch (err) {
            console.error('Erro ao aprovar alistamento automático do soldado:', err);
          }
        }
      }
    });

    const updatedApp: AplicacaoTreinamento = {
      ...app,
      statusAprovacao: 'aprovado',
      avaliador: policial.nick,
      dataAvaliacao: new Date().toLocaleString('pt-BR')
    };

    salvarAplicacaoTreinamento(updatedApp);
    setAppMsgSucesso('Aplicação de treinamento APROVADA com sucesso! Os alunos aprovados receberam +25 pontos de promoção e novos membros foram liberados.');
    setTimeout(() => setAppMsgSucesso(''), 5000);
    carregarDados();
  };

  // Reject Training Application (Only specific ranks / permissions can call this)
  const lidarComReprovarAplicacao = (appId: string, motivo: string) => {
    const app = aplicacoesTreinamentos.find(item => item.id === appId);
    if (!app) return;

    if (!motivo.trim()) {
      safeAlert('É necessário informar o motivo da reprovação da aplicação.');
      return;
    }

    if (!safeConfirm('Tem certeza de que deseja REPROVAR esta aplicação de treinamento? Nenhum aluno receberá pontos de promoção.')) return;

    const updatedApp: AplicacaoTreinamento = {
      ...app,
      statusAprovacao: 'reprovado',
      avaliador: policial.nick,
      dataAvaliacao: new Date().toLocaleString('pt-BR'),
      motivoAvaliacao: motivo
    };

    salvarAplicacaoTreinamento(updatedApp);
    setAppMsgSucesso('Aplicação de treinamento REPROVADA e registrada com sucesso.');
    setTimeout(() => setAppMsgSucesso(''), 5000);
    carregarDados();
  };

  // Promote / Link target Rank to an Approved student
  const lidarComVincularCargoAluno = (appId: string, alunoNick: string) => {
    const app = aplicacoesTreinamentos.find(item => item.id === appId);
    if (!app) return;
    const treino = treinamentos.find(t => t.id === app.treinamentoId);
    if (!treino || !treino.cargoVinculavel) return;

    const res = alterarPatentePolicial(alunoNick, treino.cargoVinculavel, 'promocao', `Aprovado no treinamento: ${treino.titulo}`, policial.nick);
    if (res.sucesso) {
      const updatedAlunos = app.alunos.map(al => {
        if (al.nick === alunoNick) {
          return { ...al, vinculado: true };
        }
        return al;
      });
      const updatedApp = { ...app, alunos: updatedAlunos };
      salvarAplicacaoTreinamento(updatedApp);
      safeAlert(`Cargo de ${treino.cargoVinculavel} vinculado com sucesso para o militar ${alunoNick}!`);
      carregarDados();
    } else {
      safeAlert(`Não foi possível vincular o cargo. Verifique se o militar está registrado e se o cargo '${treino.cargoVinculavel}' existe.`);
    }
  };

  const lidarComExcluirAplicacao = (appId: string) => {
    if (!permissoesUser.podeExcluirLogsTreinamento) {
      safeAlert('Você não possui permissão para excluir logs de treinamento.');
      return;
    }

    solicitarConfirmacaoApagar(
      'EXCLUIR LOG DE TREINAMENTO',
      'ATENÇÃO CRÍTICA: Tem certeza de que deseja EXCLUIR DEFINITIVAMENTE este log/aplicação de treinamento? Esta ação é irreversível e o apagará para sempre do sistema.',
      () => {
        try {
          excluirAplicacaoTreinamento(appId);
          setAppMsgSucesso('Log de treinamento excluído com sucesso!');
          setTimeout(() => setAppMsgSucesso(''), 4000);
          carregarDados();
        } catch (err) {
          console.error(err);
          safeAlert('Erro ao tentar excluir a aplicação de treinamento.');
        }
      }
    );
  };

  const lidarComReavaliarAplicacao = (appId: string) => {
    if (!permissoesUser.podeReavaliarTreinamento) {
      safeAlert('Você não possui permissão para reavaliar logs de treinamento.');
      return;
    }

    if (!safeConfirm('Deseja realmente reabrir este log de treinamento para REAVALIAÇÃO? Ele voltará para o estado Pendente para que seja reavaliado (Aprovado ou Reprovado).')) {
      return;
    }

    const app = aplicacoesTreinamentos.find(item => item.id === appId);
    if (!app) return;

    const updatedApp: AplicacaoTreinamento = {
      ...app,
      statusAprovacao: 'pendente',
      avaliador: undefined,
      dataAvaliacao: undefined,
      motivoAvaliacao: undefined
    };

    try {
      salvarAplicacaoTreinamento(updatedApp);
      setAppMsgSucesso('Log de treinamento reaberto para reavaliação com sucesso!');
      setTimeout(() => setAppMsgSucesso(''), 4000);
      carregarDados();
    } catch (err) {
      console.error(err);
      safeAlert('Erro ao reabrir a aplicação de treinamento.');
    }
  };

  // Groups actions
  const abrirCriarGrupo = () => {
    setGrupoEditando(null);
    setGrupoNome('');
    setGrupoSigla('');
    setGrupoDescricao('');
    setGrupoUrlImagem('');
    setGrupoPublico(true);
    setGrupoAceitaMembros(true);
    setGrupoVerificado(false);
    setNovoMembroNick('');
    setMsgGrupoErro('');
    setMsgGrupoSucesso('');
    setModalGrupoAberto(true);
  };

  const abrirEditarGrupo = (g: Grupo) => {
    setGrupoEditando(g);
    setGrupoNome(g.nome);
    setGrupoSigla(g.sigla);
    setGrupoDescricao(g.descricao);
    setGrupoUrlImagem(g.urlImagem);
    setGrupoPublico(g.publico);
    setGrupoAceitaMembros(g.aceitaMembros);
    setGrupoVerificado(g.verificado || false);
    setNovoMembroNick('');
    setMsgGrupoErro('');
    setMsgGrupoSucesso('');
    setModalGrupoAberto(true);
  };

  const fecharModalGrupo = () => {
    setModalGrupoAberto(false);
    setGrupoEditando(null);
  };

  const lidarComSalvarGrupo = (e: FormEvent) => {
    e.preventDefault();
    if (!grupoNome.trim() || !grupoSigla.trim()) {
      setMsgGrupoErro('Nome e Sigla são obrigatórios.');
      return;
    }

    const novoGrupo: Grupo = {
      id: grupoEditando ? grupoEditando.id : 'g_' + Date.now().toString(),
      nome: grupoNome.trim(),
      sigla: grupoSigla.trim(),
      descricao: grupoDescricao.trim(),
      urlImagem: grupoUrlImagem.trim(),
      publico: grupoPublico,
      verificado: grupoVerificado,
      aceitaMembros: grupoAceitaMembros,
      membros: grupoEditando ? grupoEditando.membros : [policial.nick]
    };

    salvarGrupo(novoGrupo);
    setMsgGrupoSucesso(grupoEditando ? 'Grupo atualizado com sucesso!' : 'Grupo criado com sucesso!');
    carregarDados();
    setTimeout(() => {
      fecharModalGrupo();
    }, 1500);
  };

  const lidarComExcluirGrupo = (id: string) => {
    solicitarConfirmacaoApagar(
      'EXCLUIR DEPARTAMENTO / GRUPO',
      'Tem certeza que deseja EXCLUIR COMPLETAMENTE este departamento ou grupo de elite? Esta ação é definitiva e removerá a associação de todos os membros vinculados.',
      () => {
        try {
          excluirGrupo(id);
          carregarDados();
        } catch (err) {
          console.error(err);
          safeAlert('Erro ao tentar excluir o grupo.');
        }
      }
    );
  };

  const adicionarMembroAoGrupo = () => {
    if (!novoMembroNick.trim() || !grupoEditando) return;
    const nickProcurado = novoMembroNick.trim();

    const todosPol = obterPoliciais();
    const polExistente = Object.values(todosPol).find(p => p.nick.toLowerCase().trim() === nickProcurado.toLowerCase().trim());

    if (!polExistente) {
      setMsgGrupoErro('Policial não cadastrado no sistema.');
      setTimeout(() => setMsgGrupoErro(''), 3000);
      return;
    }

    const nickNormalizado = polExistente.nick;

    if (grupoEditando.membros.includes(nickNormalizado)) {
      setMsgGrupoErro('Policial já é membro deste grupo.');
      setTimeout(() => setMsgGrupoErro(''), 3000);
      return;
    }

    const membrosAtualizados = [...grupoEditando.membros, nickNormalizado];
    const grupoAtualizado = { ...grupoEditando, membros: membrosAtualizados };

    salvarGrupo(grupoAtualizado);
    setGrupoEditando(grupoAtualizado);
    setNovoMembroNick('');
    setMsgGrupoSucesso(`Membro ${nickNormalizado} adicionado com sucesso!`);
    carregarDados();
    setTimeout(() => setMsgGrupoSucesso(''), 3000);
  };

  const removerMembroDoGrupo = (membroNick: string) => {
    if (!grupoEditando) return;

    if (!safeConfirm(`Tem certeza que deseja remover o membro @${membroNick} do grupo "${grupoEditando.nome}"?`)) return;

    const membrosAtualizados = grupoEditando.membros.filter(m => m !== membroNick);
    const grupoAtualizado = { ...grupoEditando, membros: membrosAtualizados };

    salvarGrupo(grupoAtualizado);
    setGrupoEditando(grupoAtualizado);
    setMsgGrupoSucesso(`Membro ${membroNick} removido do grupo!`);
    carregarDados();
    setTimeout(() => setMsgGrupoSucesso(''), 3000);
  };

  const lidarComQuickAddMembro = (grupo: Grupo, nick: string) => {
    if (!nick.trim()) return;
    const nickProcurado = nick.trim();
    const todosPol = obterPoliciais();
    const polExistente = Object.values(todosPol).find(p => p.nick.toLowerCase().trim() === nickProcurado.toLowerCase().trim());

    if (!polExistente) {
      safeAlert('Policial não cadastrado no sistema.');
      return;
    }

    const nickNormalizado = polExistente.nick;

    if (grupo.membros.includes(nickNormalizado)) {
      safeAlert('Policial já é membro deste grupo.');
      return;
    }

    const membrosAtualizados = [...grupo.membros, nickNormalizado];
    salvarGrupo({ ...grupo, membros: membrosAtualizados });
    safeAlert(`Militar ${nickNormalizado} adicionado com sucesso ao grupo ${grupo.nome}!`);
    carregarDados();
  };

  const lidarComSalvarConfigGeral = (e: FormEvent) => {
    e.preventDefault();
    if (!safeConfirm('Deseja salvar as alterações nas configurações gerais de identidade do site?')) return;
    try {
      const novaConfig: ConfiguracaoSite = {
        ...configSite,
        nomeSite: gSiteNome.trim(),
        subtituloSite: gSiteSubtitulo.trim(),
        logoTexto: gLogoTexto.trim(),
        logoUrl: gLogoUrl.trim(),
        loginMensagem: gLoginMensagem.trim(),
        webhookDiscord: gWebhookDiscord.trim() || undefined
      };

      salvarConfiguracaoSite(novaConfig);
      setConfigSite(novaConfig);
      setMsgConfigSucesso('Configurações gerais atualizadas com sucesso!');
      carregarDados();
      setTimeout(() => setMsgConfigSucesso(''), 4000);
    } catch (err) {
      console.error(err);
      setMsgConfigErro('Ocorreu um erro ao salvar as configurações.');
      setTimeout(() => setMsgConfigErro(''), 4000);
    }
  };

  const lidarComSalvarWebhooks = (e: FormEvent) => {
    e.preventDefault();
    if (!safeConfirm('Deseja salvar as alterações nos canais de Webhooks do Discord?')) return;
    try {
      const novaConfig: ConfiguracaoSite = {
        ...configSite,
        webhookAvisos: gWebhookAvisos.trim() || undefined,
        webhookMovimentacoes: gWebhookMovimentacoes.trim() || undefined,
        webhookAdvertencias: gWebhookAdvertencias.trim() || undefined,
        webhookExoneracoes: gWebhookExoneracoes.trim() || undefined,
        webhookDiscord: gWebhookDiscord.trim() || undefined, // keep synced
        webhookDiscordEntradas: gWebhookDiscordEntradas.trim() || undefined,
        linkDiscord: gLinkDiscord.trim() || undefined
      };

      salvarConfiguracaoSite(novaConfig);
      setConfigSite(novaConfig);
      setMsgConfigSucesso('Webhooks dos setores administrativos atualizados com sucesso!');
      carregarDados();
      setTimeout(() => setMsgConfigSucesso(''), 4000);
    } catch (err) {
      console.error(err);
      setMsgConfigErro('Ocorreu um erro ao salvar os webhooks.');
      setTimeout(() => setMsgConfigErro(''), 4000);
    }
  };

  const lidarComSalvarWebhookBackup = async (e: FormEvent) => {
    e.preventDefault();
    if (!safeConfirm('Deseja salvar a alteração no Webhook de Backup Automático?')) return;
    try {
      const novaConfig: ConfiguracaoSite = {
        ...configSite,
        webhookBackup: gWebhookBackup.trim() || undefined
      };

      salvarConfiguracaoSite(novaConfig);
      setConfigSite(novaConfig);
      setMsgConfigSucesso('Webhook de backups automáticos atualizado com sucesso!');
      carregarDados();
      setTimeout(() => setMsgConfigSucesso(''), 4000);
    } catch (err) {
      console.error(err);
      setMsgConfigErro('Ocorreu um erro ao salvar o webhook de backup.');
      setTimeout(() => setMsgConfigErro(''), 4000);
    }
  };

  const lidarComSalvarAbaCustomizada = (e: FormEvent) => {
    e.preventDefault();
    if (!tituloAba.trim()) {
      setMsgConfigErro('O título da aba é obrigatório.');
      setTimeout(() => setMsgConfigErro(''), 4000);
      return;
    }

    try {
      const abasAtuais = configSite.abasCustomizadas || [];
      let novasAbas: AbaCustomizada[] = [];
      let novaAbaId: string | null = null;

      if (editIdAba) {
        // Edit existing
        novasAbas = abasAtuais.map(aba => {
          if (aba.id === editIdAba) {
            return {
              id: editIdAba,
              titulo: tituloAba.trim().toUpperCase(),
              permissaoVer: permVerAba,
              permissaoPostar: permPostarAba,
              gruposPermitidosVer: permVerGruposAba,
              gruposPermitidosPostar: permPostarGruposAba,
              icone: iconeAba,
              tipoConteudo: tipoConteudoAba
            };
          }
          return aba;
        });
        setMsgConfigSucesso('Aba customizada editada com sucesso!');
      } else {
        // Create new
        const novaAba: AbaCustomizada = {
          id: 'aba_' + Date.now(),
          titulo: tituloAba.trim().toUpperCase(),
          permissaoVer: permVerAba,
          permissaoPostar: permPostarAba,
          gruposPermitidosVer: permVerGruposAba,
          gruposPermitidosPostar: permPostarGruposAba,
          icone: iconeAba,
          tipoConteudo: tipoConteudoAba
        };
        novasAbas = [...abasAtuais, novaAba];
        novaAbaId = novaAba.id;
        setMsgConfigSucesso('Nova aba customizada criada com sucesso!');
      }

      const novaConfig: ConfiguracaoSite = {
        ...configSite,
        abasCustomizadas: novasAbas
      };

      salvarConfiguracaoSite(novaConfig);
      setConfigSite(novaConfig);
      
      // Clear form
      setEditIdAba(null);
      setTituloAba('');
      setPermVerAba(['todos']);
      setPermPostarAba([]);
      setPermVerGruposAba([]);
      setPermPostarGruposAba([]);
      setIconeAba('FileText');
      setTipoConteudoAba('ambos');
      
      carregarDados();

      if (novaAbaId) {
        setAbaAtiva('setores_diversos');
        setCustomAbaAtivaId(novaAbaId);
      }

      setTimeout(() => setMsgConfigSucesso(''), 4000);
    } catch (err) {
      console.error(err);
      setMsgConfigErro('Erro ao salvar aba customizada.');
      setTimeout(() => setMsgConfigErro(''), 4000);
    }
  };

  const lidarComExcluirAbaCustomizada = (id: string) => {
    if (!safeConfirm('Deseja realmente excluir esta aba? Todos os posts associados serão perdidos localmente.')) return;
    try {
      const abasAtuais = configSite.abasCustomizadas || [];
      const novasAbas = abasAtuais.filter(aba => aba.id !== id);

      // Deletar também todos os posts associados
      const postsAtuais = obterPostsAbasCustomizadas();
      const postsFiltrados = postsAtuais.filter(p => p.abaId !== id);
      definirPostsAbasCustomizadas(postsFiltrados);

      // Deletar os posts no Supabase também
      const postsParaDeletar = postsAtuais.filter(p => p.abaId === id);
      for (const p of postsParaDeletar) {
        sincronizarDadoEspecifico('posts_abas_customizadas', p.id, 'delete');
      }

      const novaConfig: ConfiguracaoSite = {
        ...configSite,
        abasCustomizadas: novasAbas
      };

      salvarConfiguracaoSite(novaConfig);
      setConfigSite(novaConfig);
      setMsgConfigSucesso('Aba customizada excluída com sucesso!');
      carregarDados();
      setTimeout(() => setMsgConfigSucesso(''), 4000);
    } catch (err) {
      console.error(err);
      setMsgConfigErro('Erro ao excluir aba customizada.');
      setTimeout(() => setMsgConfigErro(''), 4000);
    }
  };

  const lidarComSalvarPostCustom = (e: FormEvent) => {
    e.preventDefault();
    if (!tituloNovoPostCustom.trim() || !conteudoNovoPostCustom.trim()) {
      alert('Título e conteúdo são obrigatórios.');
      return;
    }

    if (!customAbaAtivaId) return;

    try {
      const novoPost: PostAbaCustomizada = {
        id: 'post_' + Date.now(),
        abaId: customAbaAtivaId,
        titulo: tituloNovoPostCustom.trim(),
        conteudo: conteudoNovoPostCustom.trim(),
        autor: policial.nick,
        data: new Date().toLocaleString('pt-BR'),
        fileUrl: fileUrlNovoPostCustom.trim() || undefined,
        tipo: tipoNovoPostCustom
      };

      salvarPostAbaCustomizada(novoPost);
      
      // Clear
      setTituloNovoPostCustom('');
      setConteudoNovoPostCustom('');
      setFileUrlNovoPostCustom('');
      setMostrarFormPostCustom(false);

      carregarDados();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar postagem.');
    }
  };

  const lidarComExcluirPostCustom = (id: string) => {
    if (!safeConfirm('Deseja realmente excluir esta postagem/documento?')) return;
    try {
      deletarPostAbaCustomizada(id);
      carregarDados();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir postagem.');
    }
  };

  const lidarComDispararBackupManual = async () => {
    setSincronizandoBackup(true);
    setMsgBackupSucesso('');
    setMsgBackupErro('');
    try {
      const res = await fetch('/api/backup/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ force: true })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.mensagem || 'Falha desconhecida no servidor ao gerar backup.');
      }

      setMsgBackupSucesso(`Backup gerado e enviado com sucesso ao canal do Discord!`);
      // Reload configs to show updated last backup timestamp
      setTimeout(() => {
        carregarDados();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setMsgBackupErro(err.message || 'Erro de rede ou permissão ao tentar forçar o backup.');
    } finally {
      setSincronizandoBackup(false);
    }
  };

  const lidarComAlterarSenhaMilitar = (e: FormEvent) => {
    e.preventDefault();
    if (!altSenhaPolicialNick) {
      setMsgConfigErro('Selecione um policial para alterar a senha.');
      setTimeout(() => setMsgConfigErro(''), 4000);
      return;
    }
    if (!altSenhaNova) {
      setMsgConfigErro('A nova senha não pode ser vazia.');
      setTimeout(() => setMsgConfigErro(''), 4000);
      return;
    }
    if (altSenhaNova !== altSenhaConfirmacao) {
      setMsgConfigErro('As senhas digitadas não coincidem.');
      setTimeout(() => setMsgConfigErro(''), 4000);
      return;
    }

    try {
      const res = alterarSenhaPolicial(altSenhaPolicialNick, altSenhaNova);
      if (res.sucesso) {
        setMsgConfigSucesso(res.mensagem);
        setMsgConfigErro('');
        setAltSenhaPolicialNick('');
        setAltSenhaNova('');
        setAltSenhaConfirmacao('');
        carregarDados();
        setTimeout(() => setMsgConfigSucesso(''), 5000);
      } else {
        setMsgConfigErro(res.mensagem);
        setMsgConfigSucesso('');
        setTimeout(() => setMsgConfigErro(''), 5000);
      }
    } catch (err) {
      console.error(err);
      setMsgConfigErro('Ocorreu um erro ao alterar a senha do policial.');
      setTimeout(() => setMsgConfigErro(''), 5000);
    }
  };

  const lidarComAprovarMembro = (id: string, nick: string) => {
    try {
      const res = aceitarSolicitacaoCadastro(id, policial.nick);
      if (res.sucesso) {
        setMsgAceitacaoSucesso(res.mensagem);
        setMsgAceitacaoErro('');
        carregarDados();
        setTimeout(() => setMsgAceitacaoSucesso(''), 5000);
      } else {
        setMsgAceitacaoErro(res.mensagem);
        setMsgAceitacaoSucesso('');
        setTimeout(() => setMsgAceitacaoErro(''), 5000);
      }
    } catch (err) {
      console.error(err);
      setMsgAceitacaoErro('Erro ao aprovar a solicitação.');
      setTimeout(() => setMsgAceitacaoErro(''), 5000);
    }
  };

  const lidarComRecusarMembro = (id: string, nick: string) => {
    if (!safeConfirm(`Tem certeza que deseja recusar o alistamento de @${nick}?`)) {
      return;
    }
    try {
      const res = recusarSolicitacaoCadastro(id, policial.nick);
      if (res.sucesso) {
        setMsgAceitacaoSucesso(res.mensagem);
        setMsgAceitacaoErro('');
        carregarDados();
        setTimeout(() => setMsgAceitacaoSucesso(''), 5000);
      } else {
        setMsgAceitacaoErro(res.mensagem);
        setMsgAceitacaoSucesso('');
        setTimeout(() => setMsgAceitacaoErro(''), 5000);
      }
    } catch (err) {
      console.error(err);
      setMsgAceitacaoErro('Erro ao recusar a solicitação.');
      setTimeout(() => setMsgAceitacaoErro(''), 5000);
    }
  };

  const lidarComExcluirMilitarPermanente = (nick: string) => {
    if (nick.toLowerCase() === 'admin') {
      safeAlert('Não é permitido excluir o usuário Administrador Supremo (admin).');
      return;
    }

    solicitarConfirmacaoApagar(
      'EXCLUSÃO DEFINITIVA DE MILITAR',
      `ATENÇÃO CRÍTICA: Tem certeza que deseja APAGAR COMPLETAMENTE o militar @${nick} do sistema? Esta ação é irreversível e removerá todas as credenciais de acesso deste militar imediatamente.`,
      () => {
        try {
          const sucesso = excluirPolicialPermanente(nick);
          if (sucesso) {
            setMsgConfigSucesso(`O militar @${nick} foi excluído permanentemente com sucesso!`);
            setMsgConfigErro('');
            carregarDados();
            setTimeout(() => setMsgConfigSucesso(''), 5000);
          } else {
            setMsgConfigErro(`Não foi possível encontrar ou excluir o militar @${nick}.`);
            setMsgConfigSucesso('');
            setTimeout(() => setMsgConfigErro(''), 5000);
          }
        } catch (err) {
          console.error(err);
          setMsgConfigErro('Erro ao excluir o militar.');
          setTimeout(() => setMsgConfigErro(''), 5000);
        }
      }
    );
  };

  const carregarPermissoesCargo = (cargo: string) => {
    setGCargoSelecionado(cargo);
    if (!cargo) return;

    const permExistente = gCargosPermissoes[cargo];
    if (permExistente) {
      setTempAbas(permExistente.abasAcessiveis || []);
      setTempPromover(!!permExistente.podePromoverRebaixar);
      setTempAvisos(!!permExistente.podePostarAvisos);
      setTempXP(!!permExistente.podeEnviarXP);
      setTempTreinamentos(!!permExistente.podeCriarTreinamentos);
      setTempAvaliar(!!permExistente.podeAvaliarAulas);
      setTempGrupos(!!permExistente.podeGerenciarGrupos);
      setTempHierarquia(!!permExistente.podeGerenciarHierarquia);
      setTempExcluirLogsTreinamento(!!permExistente.podeExcluirLogsTreinamento);
      setTempReavaliarTreinamento(!!permExistente.podeReavaliarTreinamento);
      setTempExcluirAvisos(!!permExistente.podeExcluirAvisos);
      setTempExcluirPoliciais(!!permExistente.podeExcluirPoliciais);
      setTempExcluirApostilas(!!permExistente.podeExcluirApostilas);
    } else {
      // Default / fallback
      const eOficial = ['Diretor', 'General', 'Coronel', 'Major', 'Capitão', 'Tenente', 'Aspirante-a-Oficial', 'Primeiro Sargento', 'Segundo Sargento'].includes(cargo);
      const eComando = ['Diretor', 'General', 'Coronel', 'Major'].includes(cargo);
      
      setTempAbas(eOficial 
        ? ['inicio', 'perfil', 'avisos', 'promocao', 'hierarquia', 'grupos', 'aulas', 'xp'] 
        : ['inicio', 'perfil', 'avisos', 'aulas']);
      setTempPromover(eOficial);
      setTempAvisos(eOficial);
      setTempXP(eOficial);
      setTempTreinamentos(eComando);
      setTempAvaliar(eOficial);
      setTempGrupos(eComando);
      setTempHierarquia(eComando);
      setTempExcluirLogsTreinamento(eComando);
      setTempReavaliarTreinamento(eComando);
      setTempExcluirAvisos(eComando);
      setTempExcluirPoliciais(eComando);
      setTempExcluirApostilas(eComando);
    }
  };

  const lidarComSalvarPermissoesCargo = (e: FormEvent) => {
    e.preventDefault();
    if (!gCargoSelecionado) {
      setMsgConfigErro('Selecione um cargo militar para configurar.');
      return;
    }

    if (!safeConfirm(`Tem certeza de que deseja modificar as permissões de acesso e ações para o cargo ${gCargoSelecionado}?`)) return;

    try {
      const novosCargosPermissoes = {
        ...gCargosPermissoes,
        [gCargoSelecionado]: {
          abasAcessiveis: tempAbas,
          podePromoverRebaixar: tempPromover,
          podePostarAvisos: tempAvisos,
          podeEnviarXP: tempXP,
          podeCriarTreinamentos: tempTreinamentos,
          podeAvaliarAulas: tempAvaliar,
          podeGerenciarGrupos: tempGrupos,
          podeGerenciarHierarquia: tempHierarquia,
          podeExcluirLogsTreinamento: tempExcluirLogsTreinamento,
          podeReavaliarTreinamento: tempReavaliarTreinamento,
          podeExcluirAvisos: tempExcluirAvisos,
          podeExcluirPoliciais: tempExcluirPoliciais,
          podeExcluirApostilas: tempExcluirApostilas
        }
      };

      const novaConfig = {
        ...configSite,
        cargosPermissoes: novosCargosPermissoes
      };

      salvarConfiguracaoSite(novaConfig);
      setGCargosPermissoes(novosCargosPermissoes);
      setConfigSite(novaConfig);
      setMsgConfigSucesso(`Permissões do cargo ${gCargoSelecionado} atualizadas com sucesso!`);
      carregarDados();
      setTimeout(() => setMsgConfigSucesso(''), 4000);
    } catch (err) {
      console.error(err);
      setMsgConfigErro('Ocorreu um erro ao salvar as permissões.');
      setTimeout(() => setMsgConfigErro(''), 4000);
    }
  };

  const obterBadgeUrl = (urlOrCode: string) => {
    if (!urlOrCode || urlOrCode.trim() === '') {
      return 'https://www.habblet.com.br/habbo-imaging/badge/b26134s36244s44104s41014s06014801bbd65ce6922.gif';
    }
    if (urlOrCode.startsWith('http://') || urlOrCode.startsWith('https://')) {
      return urlOrCode;
    }
    return `https://www.habblet.com.br/habbo-imaging/badge/${urlOrCode}.gif`;
  };

  // Universal checks
  const eMaster = policial.nick.toLowerCase() === 'admin' ||
                  policial.nick.toLowerCase() === '78k' ||
                  policial.nick.toLowerCase() === 'diretor_almeida' || 
                  policial.nick.toLowerCase() === 'l.petrus' || 
                  policial.nick.toLowerCase() === 'vokhan';

  const eAdmin = eMaster || policial.cargo === 'Diretor';

  // Get permissions for current user's cargo
  const obterPermissoesUsuario = (): CargoPermissao => {
    // Master/Admin accounts have ALL permissions
    if (eAdmin) {
      return {
        abasAcessiveis: ['inicio', 'perfil', 'avisos', 'promocao', 'hierarquia', 'grupos', 'aulas', 'xp', 'gestao_site', 'advertencias', 'exonerar', 'aceitar_membros', 'apostilas'],
        podePromoverRebaixar: true,
        podePostarAvisos: true,
        podeEnviarXP: true,
        podeCriarTreinamentos: true,
        podeAvaliarAulas: true,
        podeGerenciarGrupos: true,
        podeGerenciarHierarquia: true,
        podeExcluirLogsTreinamento: true,
        podeReavaliarTreinamento: true,
        podeExcluirAvisos: true,
        podeExcluirPoliciais: true,
        podeExcluirApostilas: true,
      };
    }

    const userCargo = policial.cargo;
    const permExistente = configSite.cargosPermissoes?.[userCargo];
    const eOficial = ['Diretor', 'General', 'Coronel', 'Major', 'Capitão', 'Tenente', 'Aspirante-a-Oficial', 'Primeiro Sargento', 'Segundo Sargento'].includes(userCargo);
    const eComando = ['Diretor', 'General', 'Coronel', 'Major'].includes(userCargo);

    if (permExistente) {
      const abas = [...(permExistente.abasAcessiveis || ['inicio', 'perfil', 'avisos', 'aulas'])];
      if (eComando && !abas.includes('aceitar_membros')) {
        abas.push('aceitar_membros');
      }
      return {
        abasAcessiveis: abas,
        podePromoverRebaixar: !!permExistente.podePromoverRebaixar,
        podePostarAvisos: !!permExistente.podePostarAvisos,
        podeEnviarXP: !!permExistente.podeEnviarXP,
        podeCriarTreinamentos: !!permExistente.podeCriarTreinamentos,
        podeAvaliarAulas: !!permExistente.podeAvaliarAulas,
        podeGerenciarGrupos: !!permExistente.podeGerenciarGrupos,
        podeGerenciarHierarquia: !!permExistente.podeGerenciarHierarquia,
        podeExcluirLogsTreinamento: !!permExistente.podeExcluirLogsTreinamento,
        podeReavaliarTreinamento: !!permExistente.podeReavaliarTreinamento,
        podeExcluirAvisos: !!permExistente.podeExcluirAvisos,
        podeExcluirPoliciais: !!permExistente.podeExcluirPoliciais,
        podeExcluirApostilas: !!permExistente.podeExcluirApostilas,
      };
    }

    // Fallbacks if not custom-configured
    return {
      abasAcessiveis: eComando
        ? ['inicio', 'perfil', 'avisos', 'promocao', 'hierarquia', 'grupos', 'aulas', 'xp', 'advertencias', 'exonerar', 'aceitar_membros', 'apostilas']
        : eOficial 
          ? ['inicio', 'perfil', 'avisos', 'promocao', 'hierarquia', 'grupos', 'aulas', 'xp'] 
          : ['perfil', 'avisos', 'aulas'],
      podePromoverRebaixar: eOficial,
      podePostarAvisos: eOficial,
      podeEnviarXP: eOficial,
      podeCriarTreinamentos: eComando,
      podeAvaliarAulas: eOficial,
      podeGerenciarGrupos: eComando,
      podeGerenciarHierarquia: eComando,
      podeExcluirLogsTreinamento: eComando,
      podeReavaliarTreinamento: eComando,
      podeExcluirAvisos: eComando,
      podeExcluirPoliciais: eComando,
      podeExcluirApostilas: eComando,
    };
  };

  const permissoesUser = obterPermissoesUsuario();

  // Check if current active tab is accessible. Restrict "gestao_site" strictly to the 'admin' user.
  const tabPermitida = abaAtiva === 'gestao_site' 
    ? (policial.nick.toLowerCase() === 'admin') 
    : permissoesUser.abasAcessiveis.includes(abaAtiva);

  const listaCargos = patentes.length > 0 
    ? Array.from(new Set(patentes.map(p => p.nome))) 
    : ['Diretor'];

  return (
    <div className="min-h-screen bg-vignette text-zinc-100 flex flex-col custom-scrollbar selection:bg-red-800 selection:text-white font-sans">
      {/* Top Bar Navigation */}
      <header className="bg-zinc-950/90 border-b border-zinc-900 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {configSite.logoUrl ? (
            <img 
              src={configSite.logoUrl} 
              alt="Logo" 
              className="w-9 h-9 object-contain rounded" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 border border-amber-500 rounded bg-zinc-900 flex items-center justify-center text-amber-500 text-sm font-bold font-anton select-none">
              {configSite.logoTexto || 'CIA'}
            </div>
          )}
          <div>
            <h1 className="text-base sm:text-lg font-tactical font-semibold tracking-wider text-zinc-100 flex items-center gap-1.5 leading-none">
              <span>{configSite.nomeSite || 'POLÍCIA CIA'}</span>
              <span className="text-xs bg-red-950 border border-red-900 px-1.5 py-0.5 rounded text-red-500 font-mono">
                SISTEMA INTERNO
              </span>
            </h1>
            <p className="text-xs text-zinc-500 font-tactical mt-0.5 tracking-wide">
              {configSite.subtituloSite || 'Mesa de Operações Integradas • Brasília/DF'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 border-r border-zinc-900 pr-4">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-mono text-zinc-400 tracking-wider">HOSPEDAGEM SEGURA</span>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono text-amber-500 tracking-widest">{horaLocal || '--:--:--'}</div>
            <div className="text-[9px] text-zinc-500 tracking-wider uppercase font-tactical">FUSO HORÁRIO BRT (UTC-3)</div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 bg-zinc-900/80 hover:bg-red-950/40 hover:border-red-900 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-all text-xs font-tactical px-3 py-2 rounded-md cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">SAIR</span>
          </button>
        </div>
      </header>

      {/* Main Container Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sidebar Controls */}
        <aside className="lg:col-span-1 bg-zinc-950/60 border border-zinc-900 rounded-lg p-3 space-y-2">
          <div className="p-3 border-b border-zinc-900">
            <span className="text-xs text-zinc-500 font-tactical tracking-wider block mb-1">CRACHÁ VIRTUAL</span>
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-red-500" />
              <span className="text-xs text-zinc-300 font-tactical truncate">Patente: {policial.cargo}</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {permissoesUser.abasAcessiveis.includes('inicio') && (
              <button
                onClick={() => setAbaAtiva('inicio')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-tactical tracking-wide transition-all cursor-pointer text-left ${
                  abaAtiva === 'inicio'
                    ? 'bg-gradient-to-r from-red-950/40 via-red-900/20 to-transparent border-l-2 border-red-600 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>INÍCIO / PAINEL</span>
              </button>
            )}

            {permissoesUser.abasAcessiveis.includes('perfil') && (
              <button
                onClick={() => setAbaAtiva('perfil')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-tactical tracking-wide transition-all cursor-pointer text-left ${
                  abaAtiva === 'perfil'
                    ? 'bg-gradient-to-r from-red-950/40 via-red-900/20 to-transparent border-l-2 border-red-600 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <User className="w-4 h-4" />
                <span>MEU PERFIL</span>
              </button>
            )}

            {permissoesUser.abasAcessiveis.includes('avisos') && (
              <button
                onClick={() => setAbaAtiva('avisos')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-tactical tracking-wide transition-all cursor-pointer text-left ${
                  abaAtiva === 'avisos'
                    ? 'bg-gradient-to-r from-red-950/40 via-red-900/20 to-transparent border-l-2 border-red-600 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="flex-1">MURAL DE AVISOS</span>
                {avisos.filter(a => a.tipo === 'urgente').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                )}
              </button>
            )}

            {permissoesUser.abasAcessiveis.includes('aulas') && (
              <button
                onClick={() => {
                  setAbaAtiva('aulas');
                  setTreinamentoSelecionado(null);
                  setEstaCriandoTreinamento(false);
                  setModoEdicaoTreinamento(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-tactical tracking-wide transition-all cursor-pointer text-left ${
                  abaAtiva === 'aulas'
                    ? 'bg-gradient-to-r from-red-950/40 via-red-900/20 to-transparent border-l-2 border-red-600 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-red-500" />
                <span>AULAS E TREINAMENTOS</span>
              </button>
            )}

            {permissoesUser.abasAcessiveis.includes('xp') && (
              <button
                onClick={() => setAbaAtiva('xp')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-tactical tracking-wide transition-all cursor-pointer text-left ${
                  abaAtiva === 'xp'
                    ? 'bg-gradient-to-r from-red-950/40 via-red-900/20 to-transparent border-l-2 border-red-600 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>XP</span>
              </button>
            )}

            {/* ACCORDION: SETORES DIVERSOS */}
            <div className="border-t border-zinc-900/60 pt-2 mt-1">
              <button
                onClick={() => setSetoresDiversosAberto(!setoresDiversosAberto)}
                className="w-full flex items-center justify-between px-4 py-2 rounded-md text-[11px] font-tactical tracking-wider text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer text-left uppercase"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Setores Diversos</span>
                </div>
                {setoresDiversosAberto ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {setoresDiversosAberto && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden pl-3.5 flex flex-col gap-0.5 mt-1"
                  >
                    {(configSite.abasCustomizadas || []).filter(aba => {
                      if (eMaster) return true;
                      const userGroupIds = grupos.filter(g => g.membros.includes(policial.nick)).map(g => g.id);
                      const pertenceGrupo = aba.gruposPermitidosVer?.some(gid => userGroupIds.includes(gid));
                      if (!aba.permissaoVer || aba.permissaoVer.length === 0 || aba.permissaoVer.includes('todos')) return true;
                      return aba.permissaoVer.includes(policial.cargo) || pertenceGrupo;
                    }).map((aba) => (
                      <button
                        key={aba.id}
                        onClick={() => {
                          setAbaAtiva('setores_diversos');
                          setCustomAbaAtivaId(aba.id);
                          setPostCustomSelecionado(null); // Reset selected doc on navigation
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-tactical tracking-wide transition-all cursor-pointer text-left ${
                          abaAtiva === 'setores_diversos' && customAbaAtivaId === aba.id
                            ? 'bg-gradient-to-r from-emerald-950/30 via-emerald-900/10 to-transparent border-l-2 border-emerald-500 text-emerald-400 font-bold shadow-[inset_4px_0_12px_rgba(16,185,129,0.05)]'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                        }`}
                      >
                        {getIconComponent(aba.icone || 'FileText', `w-3.5 h-3.5 ${abaAtiva === 'setores_diversos' && customAbaAtivaId === aba.id ? 'text-emerald-400' : 'text-zinc-500'}`)}
                        <span className="truncate uppercase">{aba.titulo}</span>
                      </button>
                    ))}

                    {(!configSite.abasCustomizadas || configSite.abasCustomizadas.filter(aba => {
                      if (eMaster) return true;
                      const userGroupIds = grupos.filter(g => g.membros.includes(policial.nick)).map(g => g.id);
                      const pertenceGrupo = aba.gruposPermitidosVer?.some(gid => userGroupIds.includes(gid));
                      if (!aba.permissaoVer || aba.permissaoVer.length === 0 || aba.permissaoVer.includes('todos')) return true;
                      return aba.permissaoVer.includes(policial.cargo) || pertenceGrupo;
                    }).length === 0) && (
                      <span className="text-[10px] text-zinc-600 pl-4 py-1 italic">Nenhum setor disponível</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ACCORDION: SETOR ADMINISTRATIVO */}
            {(permissoesUser.abasAcessiveis.includes('promocao') || permissoesUser.abasAcessiveis.includes('advertencias') || permissoesUser.abasAcessiveis.includes('exonerar') || permissoesUser.abasAcessiveis.includes('aceitar_membros')) && (
              <div className="border-t border-zinc-900/60 pt-2 mt-1">
                <button
                  onClick={() => setSetorAdminAberto(!setorAdminAberto)}
                  className="w-full flex items-center justify-between px-4 py-2 rounded-md text-[11px] font-tactical tracking-wider text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer text-left uppercase"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    <span>Setor Administrativo</span>
                  </div>
                  {setorAdminAberto ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {setorAdminAberto && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pl-3.5 flex flex-col gap-0.5 mt-1"
                    >
                      {permissoesUser.abasAcessiveis.includes('promocao') && (
                        <button
                          onClick={() => setAbaAtiva('promocao')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-tactical tracking-wide transition-all cursor-pointer text-left ${
                            abaAtiva === 'promocao'
                              ? 'bg-gradient-to-r from-red-950/20 via-red-900/10 to-transparent border-l-2 border-red-600 text-zinc-100 font-semibold'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>Promoção & Rebaixamento</span>
                        </button>
                      )}

                      {permissoesUser.abasAcessiveis.includes('advertencias') && (
                        <button
                          onClick={() => setAbaAtiva('advertencias')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-tactical tracking-wide transition-all cursor-pointer text-left ${
                            abaAtiva === 'advertencias'
                              ? 'bg-gradient-to-r from-red-950/20 via-red-900/10 to-transparent border-l-2 border-red-600 text-zinc-100 font-semibold'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                          <span>Advertências</span>
                        </button>
                      )}

                      {permissoesUser.abasAcessiveis.includes('exonerar') && (
                        <button
                          onClick={() => setAbaAtiva('exonerar')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-tactical tracking-wide transition-all cursor-pointer text-left ${
                            abaAtiva === 'exonerar'
                              ? 'bg-gradient-to-r from-red-950/20 via-red-900/10 to-transparent border-l-2 border-red-600 text-zinc-100 font-semibold'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                          }`}
                        >
                          <LogOut className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Exonerações</span>
                        </button>
                      )}

                      {permissoesUser.abasAcessiveis.includes('aceitar_membros') && (
                        <button
                          onClick={() => setAbaAtiva('aceitar_membros')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-tactical tracking-wide transition-all cursor-pointer text-left ${
                            abaAtiva === 'aceitar_membros'
                              ? 'bg-gradient-to-r from-red-950/20 via-red-900/10 to-transparent border-l-2 border-red-600 text-zinc-100 font-semibold'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Aceitar Novos Membros</span>
                        </button>
                      )}

                      {permissoesUser.abasAcessiveis.includes('apostilas') && (
                        <button
                          onClick={() => setAbaAtiva('apostilas')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-tactical tracking-wide transition-all cursor-pointer text-left ${
                            abaAtiva === 'apostilas'
                              ? 'bg-gradient-to-r from-red-950/20 via-red-900/10 to-transparent border-l-2 border-red-600 text-zinc-100 font-semibold'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                          <span>Gerenciar Apostilas</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ACCORDION: GESTÃO */}
            {(permissoesUser.abasAcessiveis.includes('grupos') || permissoesUser.abasAcessiveis.includes('hierarquia')) && (
              <div className="border-t border-zinc-900/60 pt-2 mt-1">
                <button
                  onClick={() => setGestaoAberta(!gestaoAberta)}
                  className="w-full flex items-center justify-between px-4 py-2 rounded-md text-[11px] font-tactical tracking-wider text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer text-left uppercase"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-red-500" />
                    <span>Gestão</span>
                  </div>
                  {gestaoAberta ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {gestaoAberta && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pl-3.5 flex flex-col gap-0.5 mt-1"
                    >
                      {permissoesUser.abasAcessiveis.includes('grupos') && (
                        <button
                          onClick={() => setAbaAtiva('grupos')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-tactical tracking-wide transition-all cursor-pointer text-left ${
                            abaAtiva === 'grupos'
                              ? 'bg-gradient-to-r from-red-950/20 via-red-900/10 to-transparent border-l-2 border-red-600 text-zinc-100 font-semibold'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Grupos</span>
                        </button>
                      )}

                      {permissoesUser.abasAcessiveis.includes('hierarquia') && (
                        <button
                          onClick={() => setAbaAtiva('hierarquia')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-tactical tracking-wide transition-all cursor-pointer text-left ${
                            abaAtiva === 'hierarquia'
                              ? 'bg-gradient-to-r from-red-950/20 via-red-900/10 to-transparent border-l-2 border-red-600 text-zinc-100 font-semibold'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Hierarquia de Patentes</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Standalone Button: CONFIGURAÇÕES DO SITE */}
            {policial.nick.toLowerCase() === 'admin' && (
              <div className="border-t border-zinc-900/60 pt-2 mt-1">
                <button
                  onClick={() => setAbaAtiva('gestao_site')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-tactical tracking-wide transition-all cursor-pointer text-left ${
                    abaAtiva === 'gestao_site'
                      ? 'bg-gradient-to-r from-red-950/40 via-red-900/20 to-transparent border-l-2 border-amber-500 text-amber-400 font-medium font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  <Sliders className="w-4 h-4 text-amber-500 animate-pulse animate-duration-1000" />
                  <span className="font-bold text-amber-500 tracking-widest uppercase">Configurações do Site</span>
                </button>
              </div>
            )}
          </nav>
        </aside>

        {/* Workspace Display Area */}
        <section className="lg:col-span-3 bg-zinc-950/30 border border-zinc-900 rounded-lg p-5 sm:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <AnimatePresence mode="wait">
            {!tabPermitida && (
              <motion.div
                key="acesso_negado"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-16 space-y-4"
              >
                <div className="w-16 h-16 bg-red-950/20 border border-red-900 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-tactical font-bold text-red-500 tracking-wider">ACESSO RESTRITO / CRIPTOGRAFADO</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto font-sans leading-relaxed">
                  Seu cargo militar atual (<span className="text-red-400 font-semibold">{policial.cargo}</span>) não possui as autorizações de nível de segurança necessárias para acessar este terminal de controle.
                </p>
              </motion.div>
            )}

            {/* TAB: INÍCIO / PAINEL */}
            {abaAtiva === 'inicio' && tabPermitida && (
              <motion.div
                key="inicio"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Stats Bento Grid Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-4 flex items-center justify-between transition-all hover:border-zinc-800 relative overflow-hidden">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-tactical tracking-wider uppercase block">Total de Usuários</span>
                      <span className="text-3xl font-mono font-bold text-zinc-100 block mt-1">
                        {Object.keys(policiais).length}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                        Corporação Polícia CIA
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-red-500" />
                    </div>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-4 flex flex-col justify-between transition-all hover:border-zinc-800 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-500 font-tactical tracking-wider uppercase block">Usuários Online</span>
                        <span className="text-3xl font-mono font-bold text-emerald-500 block mt-1 animate-pulse">1</span>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-red-500" />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-3 border-t border-zinc-900/60 pt-2.5">
                      <div className="relative w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                        <img
                          src={obterAvatarUrl(policial, 's', undefined, visualVersion)}
                          alt="Online User"
                          referrerPolicy="no-referrer"
                          className="scale-125 translate-y-0.5"
                        />
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-zinc-950"></span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">{policial.nick} (você)</span>
                    </div>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-4 flex items-center gap-4 transition-all hover:border-zinc-800 relative overflow-hidden">
                    <div className="w-12 h-16 rounded-lg overflow-hidden flex items-center justify-center">
                      <img
                        src={obterAvatarUrl(policial, 'm', undefined, visualVersion)}
                        alt="Avatar Welcome"
                        referrerPolicy="no-referrer"
                        className="scale-125 translate-y-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-zinc-400 font-tactical block">Bem-vindo(a),</span>
                      <span className="text-lg font-tactical font-bold text-amber-500 block leading-tight mt-0.5 truncate">{policial.nick}</span>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-zinc-500 font-mono">Status: Ativo em serviço</span>
                        <button
                          onClick={lidarComSincronizarVisual}
                          disabled={sincronizandoVisual}
                          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-amber-500 hover:text-amber-400 text-[10px] font-tactical font-black tracking-widest uppercase px-2 py-1 rounded transition-all cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${sincronizandoVisual ? 'animate-spin' : ''}`} />
                          {sincronizandoVisual ? 'Sincronizando...' : 'Sincronizar Visual'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hall of Fame - Podium of the Top 3 most XP users */}
                {(() => {
                  const topXPPoliciais = [...listaPoliciais].sort((a, b) => (b.pontosPromocao || 0) - (a.pontosPromocao || 0));
                  return (
                    <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-4">
                      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                        <Trophy className="w-5 h-5 text-amber-500 shrink-0 animate-pulse" />
                        <div>
                          <h3 className="text-xs font-tactical font-semibold tracking-wider text-zinc-300 uppercase">
                            Hall da Fama (Mais Experientes)
                          </h3>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            Os 3 militares com maior pontuação de XP acumulada no sistema da corporação.
                          </p>
                        </div>
                      </div>

                      {/* Podiums */}
                      <div className="flex items-end justify-center gap-2 pt-6 pb-2 max-w-lg mx-auto">
                        {/* 2nd Place */}
                        {topXPPoliciais[1] && (
                          <div className="flex flex-col items-center flex-1 min-w-0">
                            {/* Avatar */}
                            <div className="relative mb-2 group">
                              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-400/50 flex items-center justify-center overflow-hidden">
                                <img
                                  src={obterAvatarUrl(topXPPoliciais[1], 'm')}
                                  alt={topXPPoliciais[1].nick}
                                  referrerPolicy="no-referrer"
                                  className="scale-125 translate-y-1 group-hover:scale-135 transition-all"
                                />
                              </div>
                              <span className="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-zinc-400 text-zinc-950 text-[10px] font-bold flex items-center justify-center border border-zinc-950 shadow">
                                2º
                              </span>
                            </div>
                            {/* Nick */}
                            <span className="text-xs font-bold text-zinc-350 truncate max-w-full block text-center">@{topXPPoliciais[1].nick}</span>
                            <span className="text-[9px] text-zinc-500 truncate max-w-full block mb-1 text-center">{topXPPoliciais[1].cargo}</span>
                            {/* Podium stand */}
                            <div className="w-full bg-zinc-900/40 border-t-2 border-zinc-400/50 rounded-t h-20 flex flex-col items-center justify-center p-1">
                              <span className="text-[10px] font-bold text-zinc-400 font-mono">2º Lugar</span>
                              <span className="text-[10px] font-semibold text-zinc-400 font-mono">{topXPPoliciais[1].pontosPromocao || 0} XP</span>
                            </div>
                          </div>
                        )}

                        {/* 1st Place (Center - taller) */}
                        {topXPPoliciais[0] && (
                          <div className="flex flex-col items-center flex-1 min-w-0 -translate-y-2">
                            {/* Crown */}
                            <Crown className="w-5 h-5 text-amber-500 animate-bounce mb-0.5" />
                            {/* Avatar */}
                            <div className="relative mb-2 group">
                              <div className="w-14 h-14 rounded-full bg-zinc-900 border-2 border-amber-500 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                                <img
                                  src={obterAvatarUrl(topXPPoliciais[0], 'm')}
                                  alt={topXPPoliciais[0].nick}
                                  referrerPolicy="no-referrer"
                                  className="scale-125 translate-y-1 group-hover:scale-135 transition-all"
                                />
                              </div>
                              <span className="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-bold flex items-center justify-center border border-zinc-950 shadow">
                                1º
                              </span>
                            </div>
                            {/* Nick */}
                            <span className="text-sm font-extrabold text-amber-500 truncate max-w-full block text-center">@{topXPPoliciais[0].nick}</span>
                            <span className="text-[10px] text-zinc-450 truncate max-w-full block mb-1 text-center">{topXPPoliciais[0].cargo}</span>
                            {/* Podium stand */}
                            <div className="w-full bg-amber-950/10 border-t-2 border-amber-500 rounded-t h-28 flex flex-col items-center justify-center p-1 shadow-[inset_0_4px_12px_rgba(245,158,11,0.05)]">
                              <span className="text-xs font-bold text-amber-500 font-mono">1º Lugar</span>
                              <span className="text-xs font-black text-amber-400 font-mono">{topXPPoliciais[0].pontosPromocao || 0} XP</span>
                            </div>
                          </div>
                        )}

                        {/* 3rd Place */}
                        {topXPPoliciais[2] && (
                          <div className="flex flex-col items-center flex-1 min-w-0">
                            {/* Avatar */}
                            <div className="relative mb-2 group">
                              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-amber-750 flex items-center justify-center overflow-hidden">
                                <img
                                  src={obterAvatarUrl(topXPPoliciais[2], 'm')}
                                  alt={topXPPoliciais[2].nick}
                                  referrerPolicy="no-referrer"
                                  className="scale-125 translate-y-1 group-hover:scale-135 transition-all"
                                />
                              </div>
                              <span className="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-amber-700 text-zinc-100 text-[10px] font-bold flex items-center justify-center border border-zinc-950 shadow">
                                3º
                              </span>
                            </div>
                            {/* Nick */}
                            <span className="text-xs font-bold text-zinc-350 truncate max-w-full block text-center">@{topXPPoliciais[2].nick}</span>
                            <span className="text-[9px] text-zinc-500 truncate max-w-full block mb-1 text-center">{topXPPoliciais[2].cargo}</span>
                            {/* Podium stand */}
                            <div className="w-full bg-zinc-900/40 border-t-2 border-amber-700/50 rounded-t h-16 flex flex-col items-center justify-center p-1">
                              <span className="text-[10px] font-bold text-amber-600 font-mono">3º Lugar</span>
                              <span className="text-[10px] font-semibold text-amber-600/80 font-mono">{topXPPoliciais[2].pontosPromocao || 0} XP</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Military Search LOOKUP Bar */}
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div>
                      <h3 className="text-xs font-tactical font-semibold tracking-wider text-zinc-300 uppercase">
                        Procurar nick de militar
                      </h3>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Consulte as informações completas, histórico, medalhas e conquistas de qualquer militar.
                      </p>
                    </div>
                    <Search className="w-4 h-4 text-zinc-500" />
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Pesquise pelo nick exato do policial (Ex: Soldado_Muller, Diretor_Almeida...)"
                      value={buscaMilitar}
                      onChange={(e) => setBuscaMilitar(e.target.value)}
                      className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-red-600 focus:ring-1 focus:ring-red-600/30 text-zinc-100 font-tactical px-4 py-2.5 pl-11 rounded text-xs outline-none transition-all placeholder:text-zinc-600"
                    />
                    <Search className="w-4 h-4 text-zinc-600 absolute left-4 top-3" />

                    {buscaMilitar.trim() && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-950 border border-zinc-900 rounded-lg shadow-xl max-h-48 overflow-y-auto z-30 custom-scrollbar divide-y divide-zinc-900/40">
                        {listaPoliciais
                          .filter(p => p.nick.toLowerCase().includes(buscaMilitar.toLowerCase()))
                          .map(p => (
                            <button
                              key={p.nick}
                              onClick={() => {
                                selecionarMilitarERefreshar(p);
                                setBuscaMilitar('');
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-zinc-900/50 flex items-center justify-between transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center">
                                  <img
                                    src={obterAvatarUrl(p, 's')}
                                    alt="Suggest avatar"
                                    referrerPolicy="no-referrer"
                                    className="scale-125 translate-y-1"
                                  />
                                </div>
                                <span className="text-xs text-zinc-200 font-tactical">{p.nick}</span>
                              </div>
                              <span className="text-[10px] text-amber-500 font-tactical bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-900/10">
                                {p.cargo}
                              </span>
                            </button>
                          ))}
                        {listaPoliciais.filter(p => p.nick.toLowerCase().includes(buscaMilitar.toLowerCase())).length === 0 && (
                          <div className="px-4 py-3 text-center text-xs text-zinc-600 font-tactical">
                            Nenhum militar cadastrado com este nick.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* All Military Officers / Efetivo list */}
                  <div className="space-y-3 pt-4 border-t border-zinc-900/60">
                    <span className="text-[10px] font-tactical font-semibold tracking-wider text-zinc-400 uppercase">
                      {buscaMilitar.trim() ? 'RESULTADO DA PESQUISA' : 'TODOS OS MILITARES DA CORPORAÇÃO'} ({
                        listaPoliciais.filter(p => p.nick.toLowerCase().includes(buscaMilitar.toLowerCase())).length
                      })
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                      {listaPoliciais
                        .filter(p => p.nick.toLowerCase().includes(buscaMilitar.toLowerCase()))
                        .sort((a, b) => obterOrdemCargo(a.cargo) - obterOrdemCargo(b.cargo))
                        .map(p => {
                          const isSelected = militarSelecionado?.nick === p.nick;
                          return (
                            <button
                              key={p.nick}
                              onClick={() => selecionarMilitarERefreshar(p)}
                              className={`p-2 rounded border text-left flex items-center gap-2 transition-all cursor-pointer relative group ${
                                isSelected 
                                  ? 'bg-red-950/25 border-red-800/80 shadow-[0_0_8px_rgba(239,68,68,0.1)]' 
                                  : 'bg-zinc-900/20 border-zinc-900/40 hover:border-zinc-800 hover:bg-zinc-900/40'
                              }`}
                            >
                              <div className="w-7 h-7 rounded bg-zinc-950 border border-zinc-900 overflow-hidden flex items-center justify-center shrink-0">
                                <img
                                  src={obterAvatarUrl(p, 'head', undefined, visualVersion)}
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  className="scale-125 translate-y-0.5 group-hover:scale-135 transition-all"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-[10px] font-bold text-zinc-200 truncate group-hover:text-red-400 transition-colors">{p.nick}</h4>
                                <span className="text-[8px] text-amber-500 font-tactical block truncate leading-none mt-0.5">{p.cargo}</span>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Active selected military card profile */}
                  {militarSelecionado ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-zinc-950/80 border border-zinc-900 rounded-lg p-5 relative overflow-hidden"
                    >
                      <button
                        onClick={() => setMilitarSelecionado(null)}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 text-xs font-mono bg-zinc-900 px-2 py-1 rounded border border-zinc-800 transition-all cursor-pointer"
                      >
                        FECHAR REGISTRO ✕
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col items-center justify-center text-center p-4 bg-zinc-900/20 border border-zinc-900/40 rounded-lg">
                          <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden mb-3">
                            <img
                              src={obterAvatarUrl(militarSelecionado, 'l')}
                              alt="Dossier avatar"
                              referrerPolicy="no-referrer"
                              className="scale-110 translate-y-2"
                            />
                          </div>
                          <h4 className="text-sm font-tactical font-bold text-zinc-100">{militarSelecionado.nick}</h4>
                          <span className="text-[10px] text-amber-500 font-tactical bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/20 mt-1">
                            {militarSelecionado.cargo}
                          </span>
                        </div>

                        <div className="space-y-3.5 md:col-span-2">
                          <h5 className="text-[11px] text-zinc-400 font-tactical font-medium border-b border-zinc-900 pb-1 uppercase tracking-wider">
                            FICHA FUNCIONAL MILITAR
                          </h5>

                          <div className="grid grid-cols-2 gap-3.5">
                            <div>
                              <span className="text-[10px] text-zinc-600 font-tactical block">PONTOS DE PROMOÇÃO</span>
                              <span className="text-sm font-mono text-zinc-200 font-semibold">{militarSelecionado.pontosPromocao} pts</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-600 font-tactical block">PRESENÇAS REGISTRADAS</span>
                              <span className="text-sm font-mono text-zinc-200 font-semibold">{militarSelecionado.presencas} atuações</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-600 font-tactical block">DATA DE REGISTRO</span>
                              <span className="text-sm font-mono text-zinc-200">{militarSelecionado.dataRegistro}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-600 font-tactical block">DECRETADO POR</span>
                              <span className="text-sm font-mono text-amber-500/90 font-medium">{militarSelecionado.promovidoPor || 'Diretoria Geral'}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-zinc-900">
                            <span className="text-[10px] text-zinc-600 font-tactical block mb-1">BIOGRAFIA</span>
                            <p className="text-xs text-zinc-400 font-tactical leading-relaxed italic">
                              "{militarSelecionado.biografia || 'Nenhuma biografia militar cadastrada.'}"
                            </p>
                          </div>

                          <div className="pt-2.5 border-t border-zinc-900">
                            <span className="text-[10px] text-zinc-650 font-tactical block mb-1.5 uppercase font-semibold">GRUPOS E DEPARTAMENTOS PARTICIPANTES</span>
                            <div className="flex flex-wrap gap-1.5">
                              {grupos.filter(g => g.membros.includes(militarSelecionado.nick)).length > 0 ? (
                                grupos.filter(g => g.membros.includes(militarSelecionado.nick)).map(g => {
                                  const badgeUrl = obterBadgeUrl(g.urlImagem);
                                  return (
                                    <div key={g.id} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-850 rounded" title={`${g.nome} [${g.sigla.toUpperCase()}]`}>
                                      <div className="w-5 h-5 bg-zinc-950 rounded overflow-hidden flex items-center justify-center p-0.5 shrink-0">
                                        <img src={badgeUrl} alt={g.nome} className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                                      </div>
                                      <span className="text-[9px] text-zinc-300 font-bold font-mono">[{g.sigla.toUpperCase()}]</span>
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="text-[10px] text-zinc-600 italic font-tactical">Nenhum departamento vinculado.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Display targeted officer's promotion history logs */}
                      <div className="mt-5 pt-4 border-t border-zinc-900">
                        <span className="text-[10px] text-zinc-500 font-tactical block font-semibold uppercase mb-3">
                          Histórico de Promoções / Rebaixamentos
                        </span>
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                          {movimentacoes.filter(m => m.nickPolicial.toLowerCase() === militarSelecionado.nick.toLowerCase()).length > 0 ? (
                            movimentacoes
                              .filter(m => m.nickPolicial.toLowerCase() === militarSelecionado.nick.toLowerCase())
                              .map(m => (
                                <div key={m.id} className="bg-zinc-900/30 border border-zinc-900/60 p-2.5 rounded text-xs flex justify-between items-center gap-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${m.tipo === 'promocao' ? 'bg-green-950/30 text-green-500' : 'bg-red-950/30 text-red-500'}`}>
                                        {m.tipo.toUpperCase()}
                                      </span>
                                      <span className="text-zinc-300 font-medium">De: <span className="text-zinc-500">{m.cargoAnterior}</span> → Novo: <span className="text-amber-500">{m.cargoNovo}</span></span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mt-1 font-tactical italic">"{m.motivo}"</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-[9px] text-zinc-500 font-mono block">Por: @{m.autor}</span>
                                    <span className="text-[8px] text-zinc-600 font-mono block mt-0.5">{m.data}</span>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <p className="text-[10px] text-zinc-600 font-tactical italic py-1">Nenhum histórico registrado no sistema.</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </div>
              </motion.div>
            )}

            {/* TAB: MEU PERFIL */}
            {abaAtiva === 'perfil' && (
              <motion.div
                key="perfil"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 relative group">
                    <img
                      src={obterAvatarUrl(policial, 'l')}
                      alt="Avatar"
                      referrerPolicy="no-referrer"
                      className="scale-110 translate-y-2"
                    />
                  </div>

                  <div className="space-y-2 text-center md:text-left flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-2.5 justify-center md:justify-start">
                      <h3 className="text-lg font-tactical font-bold text-zinc-100">{policial.nick}</h3>
                      <span className="text-[10px] text-amber-500 font-tactical bg-amber-950/20 border border-amber-900/20 px-2 py-0.5 rounded font-semibold self-center md:self-auto">
                        {policial.cargo}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-2 border-y border-zinc-900/60">
                      <div>
                        <span className="text-[9px] text-zinc-500 font-tactical block">PONTOS ACUMULADOS</span>
                        <span className="text-sm font-mono text-zinc-300 font-bold">{policial.pontosPromocao} pts</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 font-tactical block">PRESENÇAS REGISTRADAS</span>
                        <span className="text-sm font-mono text-zinc-300 font-bold">{policial.presencas} relatórios</span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[9px] text-zinc-500 font-tactical block">DATA DE ADMISSÃO</span>
                        <span className="text-sm font-mono text-zinc-300">{policial.dataRegistro}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GRUPOS QUE PARTICIPA (MY PERFIL) */}
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-3">
                  <h4 className="text-xs font-tactical font-semibold tracking-wider text-zinc-300 uppercase border-b border-zinc-900 pb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-500" />
                    MEUS GRUPOS E DEPARTAMENTOS
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {grupos.filter(g => g.membros.includes(policial.nick)).length > 0 ? (
                      grupos.filter(g => g.membros.includes(policial.nick)).map(g => {
                        const badgeUrl = obterBadgeUrl(g.urlImagem);
                        return (
                          <div 
                            key={g.id} 
                            className="flex items-center gap-2.5 px-3.5 py-2 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded transition-all cursor-pointer"
                            onClick={() => {
                              setAbaAtiva('grupos');
                              setAbaGrupos('meus');
                            }}
                            title="Clique para ver no menu de grupos"
                          >
                            <div className="w-6 h-6 bg-zinc-950 rounded overflow-hidden flex items-center justify-center p-0.5 shrink-0">
                              <img src={badgeUrl} alt={g.nome} className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                            </div>
                            <div className="text-left">
                              <span className="text-xs text-zinc-200 font-bold block leading-tight font-tactical">{g.nome}</span>
                              <span className="text-[9px] text-zinc-500 font-mono">[{g.sigla.toUpperCase()}]</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-zinc-500 italic font-tactical">Você ainda não faz parte de nenhum departamento de elite.</p>
                    )}
                  </div>
                </div>

                <form onSubmit={lidarComSalvarPerfil} className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-4">
                  <h4 className="text-xs font-tactical font-semibold tracking-wider text-zinc-300 uppercase border-b border-zinc-900 pb-2">
                    EDITAR PERFIL MILITAR
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-tactical mb-1 uppercase tracking-wider">Militar no Habbo (Para carregar farda/avatar)</label>
                      <input
                        type="text"
                        value={editAvatar}
                        onChange={(e) => setEditAvatar(e.target.value)}
                        placeholder="Seu nick exato no Habbo"
                        className="w-full bg-zinc-900/30 border border-zinc-800 focus:border-red-600 text-xs text-zinc-100 px-3 py-2 rounded outline-none font-tactical"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 font-tactical mb-1 uppercase tracking-wider">Biografia ou Assinatura Militar</label>
                    <textarea
                      rows={3}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Fale um pouco sobre sua carreira, objetivos na corporação..."
                      className="w-full bg-zinc-900/30 border border-zinc-800 focus:border-red-600 text-xs text-zinc-100 px-3 py-2 rounded outline-none font-tactical resize-none"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    {msgPerfilSucesso && (
                      <p className="text-xs text-green-500 font-tactical flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {msgPerfilSucesso}
                      </p>
                    )}
                    <span></span>
                    <button
                      type="submit"
                      disabled={salvandoPerfil}
                      className="px-5 py-2 bg-gradient-to-r from-red-950 via-red-800 to-red-950 text-white font-tactical font-semibold text-xs tracking-wider rounded hover:scale-105 active:scale-95 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{salvandoPerfil ? 'SALVANDO...' : 'SALVAR PERFIL'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* TAB: SETORES DIVERSOS */}
            {abaAtiva === 'setores_diversos' && (() => {
              const currentAba = (configSite.abasCustomizadas || []).find(aba => aba.id === customAbaAtivaId);
              if (!currentAba) {
                return (
                  <div className="p-8 text-center bg-zinc-950/60 border border-zinc-900 rounded-lg text-zinc-400 font-tactical">
                    ⚠️ Setor de arquivos ou avisos não localizado. Selecione uma aba válida no menu lateral.
                  </div>
                );
              }

              const userGroupIds = grupos.filter(g => g.membros.includes(policial.nick)).map(g => g.id);
              const pertenceGrupoVer = currentAba.gruposPermitidosVer?.some(gid => userGroupIds.includes(gid));
              const podeVer = eMaster || !currentAba.permissaoVer || currentAba.permissaoVer.length === 0 || currentAba.permissaoVer.includes('todos') || currentAba.permissaoVer.includes(policial.cargo) || pertenceGrupoVer;
              if (!podeVer) {
                return (
                  <div className="p-8 text-center bg-zinc-950/60 border border-red-900/40 rounded-lg text-red-400 font-tactical uppercase tracking-wider">
                    🔒 Acesso Restrito: Suas credenciais atuais de {policial.cargo} não permitem visualizar esta área.
                  </div>
                );
              }

              const pertenceGrupoPostar = currentAba.gruposPermitidosPostar?.some(gid => userGroupIds.includes(gid));
              const podePostar = eMaster || currentAba.permissaoPostar?.includes('todos') || currentAba.permissaoPostar?.includes(policial.cargo) || pertenceGrupoPostar;
              const postsDestaAba = postsCustom.filter(p => p.abaId === currentAba.id);

              const postsFiltrados = postsDestaAba.filter(post => {
                const isDoc = !post.tipo || post.tipo === 'documento';
                if (filtroPostCustom === 'documento') return isDoc;
                if (filtroPostCustom === 'aviso') return post.tipo === 'aviso';
                return true;
              });

              // -------------------------------------------------------------
              // 📄 READER MODE / DOCUMENT VISUALIZER
              // -------------------------------------------------------------
              if (postCustomSelecionado) {
                const infoAutor = policiais[postCustomSelecionado.autor.toLowerCase().trim()];
                const outrosDocs = postsDestaAba.filter(p => p.id !== postCustomSelecionado.id && (!p.tipo || p.tipo === 'documento'));

                return (
                  <motion.div
                    key="document_reader"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 xl:grid-cols-4 gap-6"
                  >
                    {/* Back / Main Content Column */}
                    <div className="xl:col-span-3 space-y-4">
                      {/* Reader Header */}
                      <div className="flex justify-between items-center bg-zinc-950/60 border border-zinc-900 rounded-lg p-3">
                        <button
                          type="button"
                          onClick={() => setPostCustomSelecionado(null)}
                          className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded text-[10px] font-tactical font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <ArrowLeft className="w-3.5 h-3.5 text-emerald-500" />
                          Voltar para o Setor
                        </button>

                        <span className="text-[10px] font-tactical font-black tracking-widest text-emerald-500 uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Visualizador de Diretrizes
                        </span>
                      </div>

                      {/* The Dossier Frame */}
                      <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 sm:p-10 relative shadow-2xl overflow-hidden min-h-[550px] flex flex-col justify-between">
                        {/* Dossier Aesthetic Decors */}
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600" />
                        
                        <div className="space-y-6">
                          {/* Official Header */}
                          <div className="border-b-2 border-zinc-900 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
                            <div className="space-y-1">
                              <span className="text-[9px] font-tactical font-black text-emerald-400 tracking-widest uppercase bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded">
                                Documento Oficial do Setor
                              </span>
                              <h2 className="text-lg sm:text-xl font-tactical font-black tracking-wider text-zinc-100 uppercase mt-2 leading-tight">
                                {postCustomSelecionado.titulo}
                              </h2>
                              <p className="text-[10px] text-zinc-500 font-tactical">
                                REGISTRO DE ARQUIVO: #{postCustomSelecionado.id.split('_')[1] || postCustomSelecionado.id}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 bg-zinc-900/10 border border-zinc-900/60 p-3 rounded-lg w-full sm:w-auto shrink-0">
                              <div className="w-10 h-10 rounded bg-zinc-950 flex items-center justify-center border border-zinc-800 overflow-hidden shrink-0">
                                <img
                                  src={obterAvatarUrl(infoAutor, 'head', postCustomSelecionado.autor)}
                                  alt=""
                                  className="w-full h-full object-cover scale-110"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="text-left">
                                <p className="text-[9px] font-tactical font-semibold text-zinc-500 uppercase tracking-wider">Assinado Eletronicamente</p>
                                <p className="text-xs font-bold text-emerald-400 uppercase">@{postCustomSelecionado.autor}</p>
                                <p className="text-[9px] text-zinc-600 font-tactical">{postCustomSelecionado.data}</p>
                              </div>
                            </div>
                          </div>

                          {/* Document Content Block */}
                          <div 
                            className="prose prose-invert max-w-none text-zinc-300 text-xs sm:text-sm leading-relaxed tracking-wide space-y-4 font-tactical select-text selection:bg-emerald-950 selection:text-emerald-300 rich-text-content"
                            dangerouslySetInnerHTML={{ __html: postCustomSelecionado.conteudo.includes('<') ? postCustomSelecionado.conteudo : postCustomSelecionado.conteudo.replace(/\n/g, '<br />') }}
                          />
                        </div>

                        {/* File Link / Attachment / Stamp */}
                        <div className="mt-12 pt-6 border-t border-zinc-900/60 space-y-6">
                          {postCustomSelecionado.fileUrl && (
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-900/10 border border-zinc-900 p-4 rounded-lg">
                              <div className="flex items-center gap-2.5">
                                <Link className="w-4 h-4 text-emerald-500 shrink-0" />
                                <div className="text-left">
                                  <span className="text-[10px] font-tactical text-zinc-300 uppercase tracking-wider block font-bold">
                                    Link / Anexo Oficial Incorporado
                                  </span>
                                  <span className="text-[9px] font-tactical text-zinc-500">
                                    Este documento possui um link externo configurado pelo emissor.
                                  </span>
                                </div>
                              </div>
                              <a
                                href={postCustomSelecionado.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-4 py-2 bg-emerald-950/45 hover:bg-emerald-900/40 border border-emerald-800/40 hover:border-emerald-700/50 text-emerald-300 hover:text-white rounded text-xs font-tactical font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                              >
                                Abrir Link Externo
                              </a>
                            </div>
                          )}

                          {/* Sign of Authenticity stamp effect */}
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-zinc-600 font-tactical italic uppercase">
                              Polícia CIA • Divisão Geral de Tecnologia
                            </span>
                            
                            <div className="border-2 border-emerald-500/20 rounded-lg p-3 text-center rotate-3 scale-95 uppercase select-none pointer-events-none">
                              <div className="text-[9px] font-tactical font-black tracking-widest text-emerald-500/60">AUTENTICADO</div>
                              <div className="text-[11px] font-tactical font-bold text-zinc-400/50">DIRETORIA MILITAR</div>
                              <div className="text-[8px] font-mono text-zinc-500/40">ID: {postCustomSelecionado.id}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Sidebar of Other Documents */}
                    <div className="space-y-4">
                      <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-4 space-y-4">
                        <h4 className="text-xs font-tactical font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-900 pb-2 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                          Outros Documentos
                        </h4>

                        {outrosDocs.length === 0 ? (
                          <p className="text-[10px] text-zinc-600 font-tactical italic">Nenhum outro documento publicado.</p>
                        ) : (
                          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                            {outrosDocs.map(doc => (
                              <button
                                key={doc.id}
                                type="button"
                                onClick={() => setPostCustomSelecionado(doc)}
                                className="w-full text-left p-3 rounded bg-zinc-900/10 hover:bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 transition-all block"
                              >
                                <div className="text-xs font-bold text-zinc-300 truncate uppercase tracking-wide">{doc.titulo}</div>
                                <div className="text-[9px] text-zinc-500 mt-1.5 flex justify-between font-tactical">
                                  <span>@{doc.autor}</span>
                                  <span>{doc.data.split(' ')[0]}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick Print Tip */}
                      <div className="bg-zinc-950/40 border border-zinc-900 border-dashed rounded-lg p-4 text-center text-[10px] font-tactical text-zinc-500 space-y-2">
                        <p className="text-amber-500 font-bold">💡 DICA TÁTICA</p>
                        <p className="leading-relaxed">
                          Utilize as diretrizes oficiais para guiar as atividades de seu batalhão. Os documentos são persistidos em nuvem.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              }
              // -------------------------------------------------------------
              // 📂 NORMAL SECTOR ARCHIVE VIEW
              // -------------------------------------------------------------
              return (
                <motion.div
                  key={"setor_" + currentAba.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Header Card */}
                  <div className="bg-zinc-950/60 border border-emerald-900/40 rounded-lg p-5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600" />
                    <div className="space-y-1">
                      <h3 className="text-base font-tactical font-bold text-emerald-500 tracking-wider flex items-center gap-2.5 uppercase">
                        {getIconComponent(currentAba.icone || 'FileText', "w-5 h-5 text-emerald-500")}
                        {currentAba.titulo}
                      </h3>
                      <p className="text-xs text-zinc-400 font-tactical leading-relaxed">
                        Setor reservado para documentações, avisos, manuais e comunicações gerais oficiais.
                      </p>
                    </div>

                    {podePostar && (
                      <button
                        type="button"
                        onClick={() => setMostrarFormPostCustom(!mostrarFormPostCustom)}
                        className="px-4.5 py-2.5 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-800/50 text-emerald-300 font-tactical font-bold text-xs tracking-wider uppercase rounded transition-all cursor-pointer flex items-center gap-2 shrink-0 justify-center"
                      >
                        <FileText className="w-4 h-4 text-emerald-500" />
                        {mostrarFormPostCustom ? 'Fechar Formulário' : 'Nova Publicação'}
                      </button>
                    )}
                  </div>

                  {/* Post Form */}
                  {podePostar && mostrarFormPostCustom && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-4 overflow-hidden shadow-2xl"
                    >
                      <h4 className="text-xs font-tactical font-black text-zinc-300 tracking-widest uppercase border-b border-zinc-900 pb-2.5 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        PUBLICAR NOVO CONTEÚDO NO SETOR
                      </h4>

                      <form onSubmit={lidarComSalvarPostCustom} className="space-y-4">
                        {/* 📄 TYPE SELECTOR IN NEW PUBLICATOR */}
                        {(!currentAba.tipoConteudo || currentAba.tipoConteudo === 'ambos') && (
                          <div className="space-y-2">
                            <label className="text-[10px] text-zinc-500 font-tactical uppercase block tracking-wider font-bold">
                              Tipo de Publicação
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => setTipoNovoPostCustom('documento')}
                                className={`py-3 px-4 rounded border text-xs font-tactical font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
                                  tipoNovoPostCustom === 'documento'
                                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                                    : 'bg-zinc-900/20 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                                }`}
                              >
                                <FileText className="w-4.5 h-4.5 text-emerald-500" />
                                <div className="text-left">
                                  <p className="text-xs">Documento Oficial (📄)</p>
                                  <p className="text-[8px] opacity-60 font-mono tracking-normal leading-none font-normal">Manuais, Diretrizes, Portarias, Regimentos</p>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => setTipoNovoPostCustom('aviso')}
                                className={`py-3 px-4 rounded border text-xs font-tactical font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
                                  tipoNovoPostCustom === 'aviso'
                                    ? 'bg-amber-950/30 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
                                    : 'bg-zinc-900/20 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                                }`}
                              >
                                <Send className="w-4.5 h-4.5 text-amber-500" />
                                <div className="text-left">
                                  <p className="text-xs">Aviso / Comunicado (📢)</p>
                                  <p className="text-[8px] opacity-60 font-mono tracking-normal leading-none font-normal">Informativos Rápidos, Ordens, Alertas Gerais</p>
                                </div>
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500 font-tactical uppercase block tracking-wider font-bold">
                              {tipoNovoPostCustom === 'documento' ? 'Título do Documento Oficial' : 'Título do Comunicado / Aviso'}
                            </label>
                            <input
                              type="text"
                              placeholder={tipoNovoPostCustom === 'documento' ? 'Ex: DIRETRIZ MILITAR DE OPERAÇÕES...' : 'Ex: AVISO: MANUTENÇÃO NO SISTEMA...'}
                              value={tituloNovoPostCustom}
                              onChange={(e) => setTituloNovoPostCustom(e.target.value)}
                              required
                              className="w-full bg-zinc-900/40 border border-zinc-850 text-zinc-100 font-tactical px-3 py-2.5 rounded text-xs outline-none focus:border-emerald-600"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500 font-tactical uppercase block tracking-wider font-bold">
                              Link de Anexo ou Referência Externa (Opcional)
                            </label>
                            <input
                              type="url"
                              placeholder="https://exemplo.com/documento.pdf"
                              value={fileUrlNovoPostCustom}
                              onChange={(e) => setFileUrlNovoPostCustom(e.target.value)}
                              className="w-full bg-zinc-900/40 border border-zinc-850 text-zinc-100 font-tactical px-3 py-2.5 rounded text-xs outline-none focus:border-emerald-600"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase block tracking-wider font-bold">
                            {tipoNovoPostCustom === 'documento' ? 'Conteúdo do Documento Oficial (Formatável)' : 'Corpo do Aviso / Comunicado (Formatável)'}
                          </label>
                          
                          <div className="border border-zinc-900 rounded bg-zinc-900/20 overflow-hidden">
                            {/* Editor Toolbar */}
                            <div className="bg-zinc-950 p-2 border-b border-zinc-900 flex flex-wrap items-center gap-1">
                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('undo')} 
                                className="p-1 hover:bg-zinc-850 rounded text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer" 
                                title="Desfazer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('redo')} 
                                className="p-1 hover:bg-zinc-850 rounded text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer" 
                                title="Refazer"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                              </button>

                              <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                              <select 
                                onChange={(e) => handleFormatBlockPostCustom(e.target.value)}
                                className="bg-zinc-950 border border-zinc-850 text-[10px] text-zinc-300 py-0.5 px-1.5 rounded cursor-pointer outline-none hover:border-zinc-750 font-tactical"
                                title="Título"
                              >
                                <option value="p">T Título</option>
                                <option value="p">Parágrafo</option>
                                <option value="h1">Título 1</option>
                                <option value="h2">Título 2</option>
                                <option value="h3">Título 3</option>
                              </select>

                              <select 
                                onChange={(e) => handleFontNamePostCustom(e.target.value)}
                                className="bg-zinc-950 border border-zinc-850 text-[10px] text-zinc-300 py-0.5 px-1.5 rounded cursor-pointer outline-none hover:border-zinc-750 font-tactical"
                                title="Fonte"
                              >
                                <option value="Inter, sans-serif">T Fonte</option>
                                <option value="Inter, sans-serif">Sans-serif</option>
                                <option value="Georgia, serif">Serif</option>
                                <option value="JetBrains Mono, monospace">Mono</option>
                              </select>

                              <select 
                                onChange={(e) => handleFontSizePostCustom(e.target.value)}
                                className="bg-zinc-950 border border-zinc-850 text-[10px] text-zinc-300 py-0.5 px-1.5 rounded cursor-pointer outline-none hover:border-zinc-750 font-tactical"
                                title="Tamanho"
                              >
                                <option value="3">T Tamanho</option>
                                <option value="2">Pequeno</option>
                                <option value="3">Normal</option>
                                <option value="5">Grande</option>
                                <option value="6">Extra Grande</option>
                              </select>

                              <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('bold')} 
                                className="px-2 py-0.5 hover:bg-zinc-800 rounded font-bold text-xs text-zinc-350 cursor-pointer" 
                                title="Negrito"
                              >
                                B
                              </button>
                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('italic')} 
                                className="px-2 py-0.5 hover:bg-zinc-800 rounded italic text-xs font-serif text-zinc-350 cursor-pointer" 
                                title="Itálico"
                              >
                                I
                              </button>
                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('underline')} 
                                className="px-2 py-0.5 hover:bg-zinc-800 rounded underline text-xs text-zinc-350 cursor-pointer" 
                                title="Sublinhado"
                              >
                                U
                              </button>
                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('strikeThrough')} 
                                className="px-2 py-0.5 hover:bg-zinc-800 rounded line-through text-xs text-zinc-350 cursor-pointer" 
                                title="Tachado"
                              >
                                S
                              </button>

                              <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('justifyLeft')} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Alinhar à Esquerda"
                              >
                                <AlignLeft className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('justifyCenter')} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Centralizar"
                              >
                                <AlignCenter className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('justifyRight')} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Alinhar à Direita"
                              >
                                <AlignRight className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('justifyFull')} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Justificar"
                              >
                                <AlignJustify className="w-3.5 h-3.5" />
                              </button>

                              <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('insertUnorderedList')} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Lista com Marcadores"
                              >
                                <List className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('insertOrderedList')} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Lista Numerada"
                              >
                                <ListOrdered className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('outdent')} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Diminuir Recuo"
                              >
                                <Outdent className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('indent')} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Aumentar Recuo"
                              >
                                <Indent className="w-3.5 h-3.5" />
                              </button>

                              <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('formatBlock', 'blockquote')} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Citação"
                              >
                                <Quote className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('insertHorizontalRule')} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Linha Divisória"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                              {/* Color controls */}
                              <div className="flex items-center gap-1.5 px-1" title="Cor da Fonte">
                                <span className="text-[9px] text-zinc-500 font-tactical">Cor</span>
                                <input 
                                  type="color" 
                                  onChange={(e) => handleForeColorPostCustom(e.target.value)}
                                  className="w-4 h-4 rounded bg-transparent border border-zinc-800 cursor-pointer" 
                                />
                              </div>
                              <div className="flex items-center gap-1.5 px-1" title="Destaque de Fundo">
                                <span className="text-[9px] text-zinc-500 font-tactical">Destaque</span>
                                <input 
                                  type="color" 
                                  defaultValue="#880000"
                                  onChange={(e) => handleHiliteColorPostCustom(e.target.value)}
                                  className="w-4 h-4 rounded bg-transparent border border-zinc-800 cursor-pointer" 
                                />
                              </div>

                              <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('formatBlock', 'pre')} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Bloco de Código"
                              >
                                <Code className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => executarComandoEditorPostCustom('removeFormat')} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Limpar Formatação"
                              >
                                <Eraser className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={handleLineHeightPostCustom} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Altura da Linha"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>

                              <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                              <button 
                                type="button" 
                                onClick={handleInsertLinkPostCustom} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Inserir Link"
                              >
                                <Link className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={handleInsertImagePostCustom} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Inserir Imagem"
                              >
                                <Image className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={handleInsertYouTubePostCustom} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Inserir Vídeo do YouTube"
                              >
                                <Video className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={handleInsertTablePostCustom} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Inserir Tabela"
                              >
                                <Table className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={handleImportHTMLPostCustom} 
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                                title="Importar HTML"
                              >
                                <FileUp className="w-3.5 h-3.5" />
                              </button>

                              <div className="flex-1 min-w-[10px]" />

                              <div className="flex items-center gap-1.5">
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setModoEdicaoTextoPostCustom(modoEdicaoTextoPostCustom === 'visual' ? 'codigo' : 'visual');
                                    setPreviewAtivoPostCustom(false);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[9px] font-tactical uppercase tracking-wider border cursor-pointer transition-all ${
                                    modoEdicaoTextoPostCustom === 'codigo'
                                      ? 'bg-red-950/30 text-red-400 border-red-900/50'
                                      : 'bg-zinc-950 text-zinc-400 border-zinc-855 hover:text-zinc-200'
                                  }`}
                                  title="Alternar Modo de Edição"
                                >
                                  {modoEdicaoTextoPostCustom === 'visual' ? 'Código HTML' : 'Visual'}
                                </button>

                                <button 
                                  type="button" 
                                  onClick={() => setPreviewAtivoPostCustom(!previewAtivoPostCustom)}
                                  className={`p-1 rounded cursor-pointer transition-all ${
                                    previewAtivoPostCustom
                                      ? 'bg-red-950/20 text-red-500 border border-red-900/30'
                                      : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                                  }`}
                                  title="Visualizar Conteúdo Formatado"
                                >
                                  {previewAtivoPostCustom ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Editor Content Area */}
                            {previewAtivoPostCustom ? (
                              <div 
                                className="w-full bg-zinc-950 p-4 min-h-[300px] overflow-y-auto prose prose-invert max-w-none text-zinc-200 text-xs leading-relaxed rich-text-content"
                                dangerouslySetInnerHTML={{ __html: conteudoNovoPostCustom || '<span class="text-zinc-600 italic">Nenhum conteúdo escrito para visualizar...</span>' }}
                              />
                            ) : modoEdicaoTextoPostCustom === 'codigo' ? (
                              <textarea
                                rows={12}
                                value={conteudoNovoPostCustom}
                                onChange={(e) => setConteudoNovoPostCustom(e.target.value)}
                                placeholder="Código HTML do documento..."
                                className="w-full bg-zinc-950 p-4 min-h-[300px] font-mono text-xs text-red-400 outline-none focus:ring-0 resize-y"
                              />
                            ) : (
                              <div 
                                ref={editorPostCustomRef}
                                contentEditable={true}
                                onInput={lidarComInputEditorPostCustom}
                                placeholder={tipoNovoPostCustom === 'documento' ? "Escreva aqui as diretrizes, portarias ou regulamentos oficiais..." : "Escreva aqui o aviso, alerta ou comunicado geral..."}
                                className="rich-editor w-full bg-zinc-950 p-4 min-h-[300px] text-xs text-zinc-200 outline-none focus:ring-0 overflow-y-auto"
                              />
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-950 text-white font-tactical font-bold text-xs tracking-wider uppercase rounded transition-all cursor-pointer shadow-lg border border-emerald-700/30 flex items-center gap-2"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Publicar no Setor</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMostrarFormPostCustom(false)}
                            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-tactical font-bold text-xs tracking-wider uppercase rounded transition-all cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Category Filter and Statistics Tab Bar */}
                  <div className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-3 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                    {(!currentAba.tipoConteudo || currentAba.tipoConteudo === 'ambos') ? (
                      <div className="flex bg-zinc-950 border border-zinc-850 p-1 rounded-md gap-1">
                        <button
                          type="button"
                          onClick={() => setFiltroPostCustom('tudo')}
                          className={`px-3.5 py-1.5 rounded text-[10px] font-tactical font-black uppercase tracking-wider transition-all cursor-pointer ${
                            filtroPostCustom === 'tudo'
                              ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          📂 Todos ({postsDestaAba.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFiltroPostCustom('documento')}
                          className={`px-3.5 py-1.5 rounded text-[10px] font-tactical font-black uppercase tracking-wider transition-all cursor-pointer ${
                            filtroPostCustom === 'documento'
                              ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          📄 Documentos ({postsDestaAba.filter(p => !p.tipo || p.tipo === 'documento').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFiltroPostCustom('aviso')}
                          className={`px-3.5 py-1.5 rounded text-[10px] font-tactical font-black uppercase tracking-wider transition-all cursor-pointer ${
                            filtroPostCustom === 'aviso'
                              ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          📢 Avisos ({postsDestaAba.filter(p => p.tipo === 'aviso').length})
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-tactical font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/40 border border-emerald-900/30 px-2.5 py-1 rounded">
                          {currentAba.tipoConteudo === 'documento' ? '📄 Canal de Documentos' : '📢 Mural de Avisos'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 px-2 text-[10px] font-tactical text-zinc-500 uppercase tracking-widest font-bold">
                      <span>Total: {postsFiltrados.length} publicações</span>
                    </div>
                  </div>

                  {/* List of Posts */}
                  <div className="space-y-4">
                    {postsFiltrados.length === 0 ? (
                      <div className="p-12 text-center bg-zinc-950/40 border border-zinc-900 border-dashed rounded-lg text-zinc-500 italic text-xs font-tactical">
                        Nenhum documento, portaria ou aviso publicado para o filtro selecionado.
                      </div>
                    ) : (
                      postsFiltrados.map((post) => {
                        const infoMembro = policiais[post.autor.toLowerCase().trim()];
                        const podeExcluir = eMaster || post.autor === policial.nick;
                        const isDocument = !post.tipo || post.tipo === 'documento';

                        if (isDocument) {
                          // RENDER DOCUMENT AS A CLEAN DOSSIER PREVIEW CARD
                          return (
                            <div key={post.id} className="bg-zinc-950/60 border border-zinc-900 hover:border-emerald-900/40 rounded-lg p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative transition-all group shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                              <div className="absolute top-0 left-0 w-[3px] h-full bg-emerald-600/80 rounded-l" />
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded bg-zinc-900/60 flex items-center justify-center border border-zinc-800 shrink-0 text-emerald-500 group-hover:scale-105 transition-all">
                                  {getIconComponent(currentAba.icone || 'FileText', "w-6 h-6 text-emerald-500")}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[9px] font-tactical font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.5 rounded">
                                    Documento Oficial
                                  </span>
                                  <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wide mt-2 leading-tight">{post.titulo}</h4>
                                  <p className="text-[10px] text-zinc-500 font-tactical mt-1.5">
                                    Assinado por <span className="text-zinc-350">@{post.autor}</span> • {post.data}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-zinc-900/40 sm:border-none shrink-0 justify-end">
                                <button
                                  onClick={() => setPostCustomSelecionado(post)}
                                  className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-950/45 hover:bg-emerald-900/45 border border-emerald-800/40 text-emerald-300 font-tactical font-bold text-xs tracking-wider uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Eye className="w-4 h-4 text-emerald-400" />
                                  Visualizar
                                </button>
                                {podeExcluir && (
                                  <button
                                    onClick={() => lidarComExcluirPostCustom(post.id)}
                                    className="px-3 py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 font-tactical font-semibold text-xs rounded transition-all cursor-pointer hover:border-red-500"
                                    title="Excluir Documento"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        } else {
                          // RENDER ANNOUNCEMENT AS AN ALERT BULLETIN
                          return (
                            <div key={post.id} className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-4 relative shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                              <div className="absolute top-0 left-0 w-[3px] h-full bg-amber-600/80 rounded-l" />
                              {podeExcluir && (
                                <button
                                  onClick={() => lidarComExcluirPostCustom(post.id)}
                                  className="absolute top-4 right-4 text-[10px] font-tactical px-2 py-1 bg-red-950/20 border border-red-900/30 text-red-400 rounded hover:bg-red-950/40 transition-all cursor-pointer"
                                >
                                  Excluir
                                </button>
                              )}

                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center border border-zinc-800">
                                  <img
                                    src={obterAvatarUrl(infoMembro, 'head', post.autor)}
                                    alt=""
                                    className="scale-110"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-tactical font-black tracking-widest text-amber-400 uppercase bg-amber-950/40 border border-amber-900/30 px-1.5 py-0.5 rounded">
                                      Aviso / Comunicado
                                    </span>
                                  </div>
                                  <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wide mt-1.5 leading-tight">{post.titulo}</h4>
                                  <p className="text-[10px] text-zinc-500 font-tactical mt-0.5">
                                    Por <span className="text-amber-500 font-semibold">@{post.autor}</span> • {post.data}
                                  </p>
                                </div>
                              </div>

                              <div 
                                className="text-xs text-zinc-300 leading-relaxed font-tactical bg-zinc-900/10 p-4 border border-zinc-900 rounded-md rich-text-content prose prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: post.conteudo.includes('<') ? post.conteudo : post.conteudo.replace(/\n/g, '<br />') }}
                              />

                              {post.fileUrl && (
                                <div className="pt-1">
                                  <a
                                    href={post.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded text-[10px] font-tactical transition-all"
                                  >
                                    <Link className="w-3.5 h-3.5 text-amber-500" />
                                    ABRIR ARQUIVO ANEXO
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        }
                      })
                    )}
                  </div>
                </motion.div>
              );
            })()}

            {/* TAB: MURAL DE AVISOS */}
            {abaAtiva === 'avisos' && (
              <motion.div
                key="avisos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Notice Form for officers */}
                {eAdmin && (
                  <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-4">
                    <h3 className="text-xs font-tactical font-semibold text-zinc-300 tracking-wider flex items-center gap-1.5 uppercase">
                      <Send className="w-4 h-4 text-red-500" />
                      Emitir Nova Ordem de Serviço / Aviso Geral
                    </h3>

                    <form onSubmit={lidarComCriarAviso} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <input
                            type="text"
                            placeholder="Título da Diretriz Militar..."
                            value={avisoTitulo}
                            onChange={(e) => setAvisoTitulo(e.target.value)}
                            className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-red-600 text-zinc-100 font-tactical px-3 py-1.5 rounded text-xs outline-none placeholder:text-zinc-700"
                            required
                          />
                        </div>
                        <div>
                          <select
                            value={avisoTipo}
                            onChange={(e: any) => setAvisoTipo(e.target.value)}
                            className="w-full bg-zinc-900/40 border border-zinc-800 text-zinc-300 font-tactical px-3 py-1.5 rounded text-xs outline-none cursor-pointer focus:border-red-600"
                          >
                            <option value="geral">Geral (Branco)</option>
                            <option value="urgente">Urgente (Vermelho)</option>
                            <option value="promocao">Promoção (Dourado)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-zinc-900/60 border border-zinc-850 rounded-t-md">
                          <button
                            type="button"
                            onClick={() => aplicarFormatacaoAviso('bold')}
                            className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded font-tactical font-extrabold text-xs transition-all cursor-pointer"
                            title="Negrito (Selecione o texto e clique)"
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onClick={() => aplicarFormatacaoAviso('italic')}
                            className="px-3 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded font-tactical italic text-xs transition-all cursor-pointer"
                            title="Itálico (Selecione o texto e clique)"
                          >
                            I
                          </button>
                          <button
                            type="button"
                            onClick={() => aplicarFormatacaoAviso('underline')}
                            className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded font-tactical underline text-xs transition-all cursor-pointer"
                            title="Sublinhado (Selecione o texto e clique)"
                          >
                            U
                          </button>
                          <button
                            type="button"
                            onClick={() => aplicarFormatacaoAviso('strike')}
                            className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded font-tactical line-through text-xs transition-all cursor-pointer"
                            title="Tachado (Selecione o texto e clique)"
                          >
                            S
                          </button>
                          <div className="h-4 w-[1px] bg-zinc-800 mx-1"></div>
                          <span className="text-[10px] text-zinc-500 font-tactical hidden sm:inline">Dica: Selecione o texto desejado e clique nos botões para formatar</span>
                          <span className="text-[10px] text-zinc-500 font-tactical sm:hidden">Selecione para formatar</span>
                        </div>
                        <textarea
                          ref={avisoTextareaRef}
                          rows={4}
                          placeholder="Digite o conteúdo oficial do comunicado... Use os botões acima ou insira manualmente: **negrito**, *itálico*, __sublinhado__ ou ~~tachado~~"
                          value={avisoConteudo}
                          onChange={(e) => setAvisoConteudo(e.target.value)}
                          className="w-full bg-zinc-900/40 border-b border-x border-zinc-850 focus:border-red-600 text-zinc-200 font-tactical px-3 py-2 rounded-b-md text-xs outline-none transition-all placeholder:text-zinc-700"
                          required
                        />

                        {avisoConteudo.trim() && (
                          <div className="mt-3 bg-zinc-950/40 border border-zinc-900/80 rounded-md p-4 space-y-2">
                            <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-1">
                              <span className="text-[10px] text-amber-500 font-tactical font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                                Pré-visualização do Formato
                              </span>
                              <span className="text-[9px] text-zinc-600 font-mono">Quadro de Avisos</span>
                            </div>
                            <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-tactical whitespace-pre-wrap break-words">
                              {renderFormattedText(avisoConteudo)}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Fundo Personalizado da Mensagem</label>
                          <select
                            value={avisoCorFundo}
                            onChange={(e) => setAvisoCorFundo(e.target.value)}
                            className="w-full bg-zinc-900/40 border border-zinc-800 text-zinc-300 font-tactical px-3 py-1.5 rounded text-xs outline-none cursor-pointer focus:border-red-600"
                          >
                            <option value="default">Padrão do Tipo</option>
                            <option value="red">Vermelho Tático (Perigo/Urgente)</option>
                            <option value="amber">Dourado Militar (Glória/Promoção)</option>
                            <option value="blue">Azul Marinho (Operações)</option>
                            <option value="green">Verde Exercito (Aprovações)</option>
                            <option value="zinc">Cinza Metálico (Geral)</option>
                          </select>
                        </div>
                        <div className="space-y-2 flex flex-col justify-end">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Formatação & Alertas</label>
                          <div className="flex flex-wrap items-center gap-4">
                            <label className="flex items-center gap-1.5 text-xs text-zinc-400 font-tactical cursor-pointer hover:text-zinc-200">
                              <input
                                type="checkbox"
                                checked={avisoNegrito}
                                onChange={(e) => setAvisoNegrito(e.target.checked)}
                                className="accent-red-600 h-3.5 w-3.5 rounded border-zinc-800 bg-zinc-900"
                              />
                              <span>Negrito</span>
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-zinc-400 font-tactical cursor-pointer hover:text-zinc-200">
                              <input
                                type="checkbox"
                                checked={avisoItalico}
                                onChange={(e) => setAvisoItalico(e.target.checked)}
                                className="accent-red-600 h-3.5 w-3.5 rounded border-zinc-800 bg-zinc-900"
                              />
                              <span>Itálico</span>
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-zinc-400 font-tactical cursor-pointer hover:text-zinc-200" title="Tag @everyone no webhook do Discord">
                              <input
                                type="checkbox"
                                checked={avisoMarcarEveryone}
                                onChange={(e) => setAvisoMarcarEveryone(e.target.checked)}
                                className="accent-red-600 h-3.5 w-3.5 rounded border-zinc-800 bg-zinc-900"
                              />
                              <span className="text-red-400 font-bold">Marcar @everyone</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-zinc-900/40 pt-3">
                        <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Imagem ou Anexo Gráfico do Comunicado (URL opcional)</label>
                        <input
                          type="url"
                          placeholder="Cole a URL de um banner ou foto para o anexo..."
                          value={avisoImagemUrl}
                          onChange={(e) => setAvisoImagemUrl(e.target.value)}
                          className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-red-600 text-zinc-200 font-tactical px-3 py-1.5 rounded text-xs outline-none transition-all placeholder:text-zinc-700"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Posicionamento da Imagem Anexa</label>
                          <select
                            value={avisoPosicaoImagem}
                            onChange={(e) => setAvisoPosicaoImagem(e.target.value as any)}
                            className="w-full bg-zinc-900/40 border border-zinc-800 text-zinc-300 font-tactical px-3 py-1.5 rounded text-xs outline-none cursor-pointer focus:border-red-600"
                          >
                            <option value="topo">Topo / Padrão (Abaixo do Texto)</option>
                            <option value="esquerda">Esquerda (Texto Flutua ao Redor)</option>
                            <option value="direita">Direita (Texto Flutua ao Redor)</option>
                            <option value="fundo">Imagem de Fundo (Inteira c/ Overlay)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Estilo Temático do Comunicado</label>
                          <select
                            value={avisoTemplateNoticia}
                            onChange={(e) => setAvisoTemplateNoticia(e.target.value as any)}
                            className="w-full bg-zinc-900/40 border border-zinc-800 text-zinc-300 font-tactical px-3 py-1.5 rounded text-xs outline-none cursor-pointer focus:border-red-600"
                          >
                            <option value="padrao">Padrão Simples (Cor do Setor)</option>
                            <option value="noticia">📰 Gazeta de Guerra (Contraste de Alto Nível)</option>
                            <option value="militar">🎖️ Gabinete Presidencial (Solene e Dourado)</option>
                            <option value="tecnologico">💻 Terminal Tático Cyber (Neon e Grade)</option>
                            <option value="urgente-critico">🚨 Alerta Vermelho (Fundo Pulsante)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-zinc-900/80 pt-3">
                        <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Imagem de Fundo / Textura Militar (URL opcional)</label>
                        <input
                          type="url"
                          placeholder="Cole a URL de uma imagem de fundo (Ex: textura de metal, camuflagem)..."
                          value={avisoImagemFundoUrl}
                          onChange={(e) => setAvisoImagemFundoUrl(e.target.value)}
                          className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-red-600 text-zinc-200 font-tactical px-3 py-1.5 rounded text-xs outline-none transition-all placeholder:text-zinc-700"
                        />
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setAvisoImagemFundoUrl('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1000&auto=format&fit=crop')}
                            className="px-2 py-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] rounded font-tactical cursor-pointer transition-all"
                          >
                            🏢 Aço Carbono
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvisoImagemFundoUrl('https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?q=80&w=1000&auto=format&fit=crop')}
                            className="px-2 py-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] rounded font-tactical cursor-pointer transition-all"
                          >
                            🌲 Camuflado Dark
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvisoImagemFundoUrl('https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop')}
                            className="px-2 py-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] rounded font-tactical cursor-pointer transition-all"
                          >
                            🌐 Grid Holográfico
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvisoImagemFundoUrl('https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=1000&auto=format&fit=crop')}
                            className="px-2 py-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] rounded font-tactical cursor-pointer transition-all"
                          >
                            🚨 Alerta Neon
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvisoImagemFundoUrl('')}
                            className="px-2 py-1 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-900/60 text-red-400 hover:text-red-300 text-[10px] rounded font-tactical cursor-pointer transition-all"
                          >
                            ❌ Nenhuma
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        {msgAvisoSucesso && (
                          <p className="text-xs text-green-500 font-tactical flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {msgAvisoSucesso}
                          </p>
                        )}
                        <span></span>
                        <button
                          type="submit"
                          disabled={!avisoTitulo.trim() || !avisoConteudo.trim()}
                          className="px-4 py-1.5 bg-gradient-to-r from-red-950 via-red-800 to-red-950 text-white font-tactical font-semibold text-xs tracking-wider rounded hover:scale-105 active:scale-95 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Send className="w-3 h-3" />
                          <span>PUBLICAR</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Notices Display List */}
                <div className="space-y-4">
                  <h3 className="text-sm font-tactical font-semibold text-zinc-300 tracking-wider">
                    QUADRO OFICIAL DE DIRETRIZES
                  </h3>

                  <div className="space-y-3.5">
                    {avisos.length > 0 ? (
                      avisos.map((aviso) => {
                        let colorClasses = 'border-zinc-900 bg-zinc-950/20';
                        let headerTag = 'GERAL';
                        let tagColor = 'text-zinc-400 bg-zinc-900/50';

                        // Background selection: check corFundo first, then fall back to type
                        const corFundoEfetiva = aviso.corFundo || (aviso.tipo === 'urgente' ? 'red' : aviso.tipo === 'promocao' ? 'amber' : 'default');

                        if (corFundoEfetiva === 'red') {
                          colorClasses = 'border-red-900/50 bg-red-950/20';
                          headerTag = '★ CRÍTICO / COMUNICADO URGENTE ★';
                          tagColor = 'text-red-500 bg-red-950/30 border border-red-900/30';
                        } else if (corFundoEfetiva === 'amber') {
                          colorClasses = 'border-amber-900/50 bg-amber-950/15';
                          headerTag = 'COMUNICADO DE PATENTES';
                          tagColor = 'text-amber-500 bg-amber-950/30 border border-amber-900/30';
                        } else if (corFundoEfetiva === 'blue') {
                          colorClasses = 'border-blue-900/50 bg-blue-950/20';
                          headerTag = 'DIRETRIZ DE OPERAÇÕES';
                          tagColor = 'text-blue-400 bg-blue-950/30 border border-blue-900/30';
                        } else if (corFundoEfetiva === 'green') {
                          colorClasses = 'border-emerald-900/50 bg-emerald-950/20';
                          headerTag = 'BOLETIM DE APROVAÇÕES';
                          tagColor = 'text-emerald-400 bg-emerald-950/30 border border-emerald-900/30';
                        } else if (corFundoEfetiva === 'zinc') {
                          colorClasses = 'border-zinc-700 bg-zinc-900/50';
                          headerTag = 'NOTICIA ADJUNTA';
                          tagColor = 'text-zinc-300 bg-zinc-800 border border-zinc-700';
                        } else {
                          // Default fallback
                          if (aviso.tipo === 'urgente') {
                            headerTag = '★ CRÍTICO / COMUNICADO URGENTE ★';
                            tagColor = 'text-red-500 bg-red-950/30 border border-red-900/30';
                          } else if (aviso.tipo === 'promocao') {
                            headerTag = 'COMUNICADO DE PATENTES';
                            tagColor = 'text-amber-500 bg-amber-950/30 border border-amber-900/30';
                          }
                        }

                        // Text style formatting
                        let textStyle = 'text-xs sm:text-sm leading-relaxed font-tactical';
                        let titleStyle = 'text-sm font-tactical font-semibold text-zinc-100';
                        let templateClasses = '';

                        // Apply template
                        if (aviso.templateNoticia === 'noticia') {
                          templateClasses = 'border-2 border-zinc-400 bg-zinc-950/90 shadow-lg shadow-zinc-950/80';
                          textStyle += ' text-zinc-200';
                          titleStyle = 'text-sm sm:text-base font-serif font-black tracking-wide text-white uppercase border-b border-zinc-800 pb-1.5 flex-1';
                        } else if (aviso.templateNoticia === 'militar') {
                          templateClasses = 'border-2 border-amber-600/40 bg-gradient-to-b from-stone-900/90 to-stone-950/95 shadow-md shadow-amber-950/20';
                          textStyle += ' text-amber-100/90';
                          titleStyle = 'text-sm font-tactical font-bold text-amber-400 tracking-widest uppercase flex-1';
                        } else if (aviso.templateNoticia === 'tecnologico') {
                          templateClasses = 'border border-emerald-500/30 bg-zinc-950/95 font-mono border-dashed shadow-[0_0_15px_rgba(16,185,129,0.05)]';
                          textStyle += ' text-emerald-400/90 font-mono';
                          titleStyle = 'text-xs sm:text-sm font-mono font-bold text-emerald-300 tracking-tight uppercase flex items-center gap-1.5 flex-1';
                        } else if (aviso.templateNoticia === 'urgente-critico') {
                          templateClasses = 'border-2 border-red-600 bg-gradient-to-r from-red-950/50 via-zinc-950 to-red-950/40 shadow-[0_0_20px_rgba(220,38,38,0.15)]';
                          textStyle += ' text-red-100 font-medium';
                          titleStyle = 'text-sm sm:text-base font-tactical font-black text-red-400 tracking-wider uppercase animate-pulse flex-1';
                        } else {
                          templateClasses = colorClasses;
                          textStyle += ' text-zinc-400';
                        }

                        if (aviso.negrito) textStyle += ' font-bold text-zinc-200';
                        if (aviso.italico) textStyle += ' italic';

                        // Check active background image
                        const bgImg = aviso.imagemFundoUrl || (aviso.posicaoImagem === 'fundo' ? aviso.imageUrl : undefined);

                        return (
                          <div
                            key={aviso.id}
                            className={`relative overflow-hidden border rounded-lg p-5 transition-all hover:scale-[1.005] duration-200 ${templateClasses}`}
                            style={bgImg ? {
                              backgroundImage: `linear-gradient(rgba(10, 10, 10, 0.85), rgba(5, 5, 5, 0.94)), url(${bgImg})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat'
                            } : undefined}
                          >
                            <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <span className={`text-[9px] font-tactical font-bold px-2 py-0.5 rounded shrink-0 ${tagColor}`}>
                                  {headerTag}
                                </span>
                                <h4 className={titleStyle}>{aviso.titulo}</h4>
                              </div>
                              {permissoesUser.podeExcluirAvisos && (
                                <button
                                  type="button"
                                  onClick={() => lidarComExcluirAviso(aviso.id)}
                                  className="text-zinc-600 hover:text-red-500 transition-all cursor-pointer p-1 rounded hover:bg-zinc-900/50 shrink-0"
                                  title="Excluir Diretriz"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            
                            <div className="flow-root mt-2.5 relative z-10">
                              {aviso.imageUrl && (aviso.posicaoImagem === 'esquerda' || aviso.posicaoImagem === 'direita') && (
                                <div className={`relative ${aviso.posicaoImagem === 'esquerda' ? 'float-left mr-4 mb-3' : 'float-right ml-4 mb-3'} max-w-[150px] sm:max-w-[220px] rounded border border-zinc-800 bg-zinc-950 p-1 shadow-lg`}>
                                  <img
                                    src={aviso.imageUrl}
                                    alt="Anexo"
                                    className="w-full object-contain rounded"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                              <p className={textStyle}>
                                {renderFormattedText(aviso.conteudo)}
                              </p>
                            </div>
                            
                            {aviso.imageUrl && (aviso.posicaoImagem === 'topo' || !aviso.posicaoImagem) && (
                              <div className="mt-3 overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950/40 relative z-10 max-h-96">
                                <img
                                  src={aviso.imageUrl}
                                  alt="Comunicado Anexo"
                                  className="w-full max-h-96 object-contain block mx-auto hover:scale-[1.01] transition-transform duration-300"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}

                            <div className="mt-4 pt-2.5 border-t border-zinc-900/50 flex flex-wrap justify-between items-center gap-2 relative z-10">
                              <span className="text-[10px] text-zinc-600 font-mono">ID: #{aviso.id}</span>
                              <div className="flex items-center gap-4 text-xs font-tactical text-zinc-400">
                                <span>Publicado em: <span className="text-zinc-300 font-mono">{aviso.data}</span></span>
                                <span>Autorizado por: <span className="text-red-500 font-medium">@{aviso.autor}</span></span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center py-8 text-zinc-600 text-xs font-tactical">Nenhum aviso no painel.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: PROMOÇÃO & REBAIXAMENTO */}
            {abaAtiva === 'promocao' && (
              <motion.div
                key="promocao"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Header Section */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 bg-[#501010]/30 border border-red-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold text-zinc-100 font-sans tracking-tight">Promover / Rebaixar</h2>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      Promova ou rebaixe usuários com patente igual ou inferior à sua.
                    </p>
                  </div>
                </div>

                {/* Sua patente atual panel */}
                {(() => {
                  const patentePolicial = patentes.find(p => p.nome === policial.cargo);
                  const categoriaPolicial = patentePolicial ? categorias.find(c => c.id === patentePolicial.categoriaId) : null;
                  return (
                    <div className="bg-[#121212] border border-[#222] rounded-lg p-5">
                      <span className="text-[11px] text-zinc-500 font-sans block uppercase tracking-wider mb-1">Sua patente atual</span>
                      <span className="text-sm font-bold text-zinc-200 block font-sans">
                        {policial.cargo} {categoriaPolicial ? `(${categoriaPolicial.nome} · ${patentePolicial?.equivalente || 'Corpo de Oficiais'})` : '· Painel Administrativo'}
                      </span>
                    </div>
                  );
                })()}

                {/* Buscar usuário field */}
                <div className="space-y-2 relative">
                  <label className="block text-xs font-bold text-zinc-300 font-sans">Buscar usuário</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Digite o nick do usuário..."
                      value={buscaPromoUsuario}
                      onChange={(e) => setBuscaPromoUsuario(e.target.value)}
                      className="w-full bg-[#121212] border border-[#222] text-zinc-200 text-xs px-4 py-3 pl-11 rounded outline-none focus:border-red-600 transition-all placeholder:text-zinc-700 font-sans"
                    />
                    <Search className="w-4 h-4 text-zinc-600 absolute left-4 top-3.5" />
                  </div>

                  {/* Autocomplete dropdown */}
                  {buscaPromoUsuario.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#121212] border border-[#222] rounded-lg shadow-2xl max-h-56 overflow-y-auto z-40 divide-y divide-zinc-900/50">
                      {listaPoliciais
                        .filter(p => p.nick.toLowerCase().includes(buscaPromoUsuario.toLowerCase()))
                        .map(p => (
                          <button
                            key={p.nick}
                            type="button"
                            onClick={() => {
                              setPromocaoTargetNick(p.nick);
                              setBuscaPromoUsuario(p.nick);
                              setPromocaoTargetPatenteId('');
                            }}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-900/40 transition-all text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center border border-zinc-800">
                                <img
                                  src={obterAvatarUrl(p, 'head')}
                                  alt=""
                                  className="scale-125"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div>
                                <span className="text-zinc-200 text-xs font-bold block">{p.nick}</span>
                                <span className="text-zinc-500 text-[10px]">{p.cargo}</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">PONTOS: {p.pontosPromocao}</span>
                          </button>
                        ))}
                      {listaPoliciais.filter(p => p.nick.toLowerCase().includes(buscaPromoUsuario.toLowerCase())).length === 0 && (
                        <div className="px-4 py-3 text-center text-xs text-zinc-650">
                          Nenhum militar cadastrado com este nick.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Main Action Form / Empty State Box */}
                <div className="bg-[#121212]/80 border border-[#222] rounded-lg p-6 min-h-[150px] flex flex-col justify-center">
                  {promocaoTargetNick === '' ? (
                    <div className="text-center py-8">
                      <span className="text-xs text-zinc-500 font-sans tracking-wide">
                        Busque um usuário acima para promover ou rebaixar.
                      </span>
                    </div>
                  ) : (
                    (() => {
                      const polAlvo = listaPoliciais.find(p => p.nick === promocaoTargetNick);
                      if (!polAlvo) return (
                        <div className="text-center py-8">
                          <span className="text-xs text-zinc-500 font-sans">Militar não encontrado.</span>
                        </div>
                      );
                      return (
                        <form onSubmit={lidarComPromoDecreto} className="space-y-5">
                          {/* Selected User Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center border border-zinc-800">
                                <img
                                  src={obterAvatarUrl(polAlvo, 'm')}
                                  alt=""
                                  className="scale-125 translate-y-1"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-zinc-100 font-sans flex items-center gap-2">
                                  <span>{polAlvo.nick}</span>
                                  <span className="text-[10px] bg-[#1a1a1a] border border-[#333] px-1.5 py-0.5 rounded text-amber-500 font-mono">
                                    PONTOS: {polAlvo.pontosPromocao}
                                  </span>
                                </h4>
                                <p className="text-xs text-zinc-500 font-sans mt-0.5">
                                  Patente Atual: <span className="text-zinc-300 font-semibold">{polAlvo.cargo}</span>
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPromocaoTargetNick('');
                                setBuscaPromoUsuario('');
                              }}
                              className="text-xs text-red-500 hover:text-red-400 hover:underline transition-all text-left font-sans self-start sm:self-auto cursor-pointer"
                            >
                              Limpar e buscar outro
                            </button>
                          </div>

                          {/* Action Options Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Segmented Toggle for action type */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] text-zinc-500 font-sans uppercase tracking-wider">Ação Desejada</label>
                              <div className="grid grid-cols-2 gap-2 bg-[#181818] p-1 border border-zinc-900 rounded-md">
                                <button
                                  type="button"
                                  onClick={() => setPromocaoTipo('promocao')}
                                  className={`py-1.5 rounded text-[11px] font-sans font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                                    promocaoTipo === 'promocao'
                                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 font-bold'
                                      : 'text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  Promover
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPromocaoTipo('rebaixamento')}
                                  className={`py-1.5 rounded text-[11px] font-sans font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                                    promocaoTipo === 'rebaixamento'
                                      ? 'bg-red-950/40 text-red-400 border border-red-900/30 font-bold'
                                      : 'text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  Rebaixar
                                </button>
                              </div>
                            </div>

                            {/* Patente Alvo Select field */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] text-zinc-500 font-sans uppercase tracking-wider">Nova Patente</label>
                              <select
                                value={promocaoTargetPatenteId}
                                onChange={(e) => setPromocaoTargetPatenteId(e.target.value)}
                                className="w-full bg-[#181818] border border-zinc-900 text-zinc-200 font-sans px-3 py-2 rounded text-xs outline-none cursor-pointer focus:border-red-600 transition-all h-9"
                                required
                              >
                                <option value="">Selecione a patente...</option>
                                {categorias.map((cat) => {
                                  const pats = patentes.filter(p => p.categoriaId === cat.id).sort((a, b) => a.ordem - b.ordem);
                                  if (pats.length === 0) return null;
                                  return (
                                    <optgroup key={cat.id} label={cat.nome.toUpperCase()} className="bg-[#121212] text-zinc-500 text-[10px]">
                                      {pats.map((p) => (
                                        <option key={p.id} value={p.id} className="text-zinc-200 text-xs">
                                          {p.nome} {p.insignia ? `(${p.insignia})` : ''}
                                        </option>
                                      ))}
                                    </optgroup>
                                  );
                                })}
                              </select>
                            </div>
                          </div>

                          {/* Motivo Input */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] text-zinc-500 font-sans uppercase tracking-wider">Motivo / Justificativa</label>
                            <input
                              type="text"
                              value={promocaoMotivo}
                              onChange={(e) => setPromocaoMotivo(e.target.value)}
                              placeholder="Digite a justificativa militar clara..."
                              className="w-full bg-[#181818] border border-zinc-900 focus:border-red-600 text-zinc-200 font-sans px-3 py-2 rounded text-xs outline-none placeholder:text-zinc-700 transition-all"
                              required
                            />
                          </div>

                          {/* Action Button */}
                          <button
                            type="submit"
                            className="w-full py-2.5 bg-gradient-to-r from-red-950 via-red-800 to-red-950 text-white font-sans font-bold text-xs tracking-wider rounded hover:scale-[1.005] active:scale-[0.995] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(153,27,27,0.15)]"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>CONFIRMAR DECRETO DE PATENTE</span>
                          </button>
                        </form>
                      );
                    })()
                  )}
                </div>

                {/* Success/Error Alerts */}
                {msgPromoSucesso && (
                  <div className="bg-emerald-950/30 border border-emerald-900/40 rounded p-3.5 text-xs text-emerald-400 font-sans flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{msgPromoSucesso}</span>
                  </div>
                )}
                {msgPromoErro && (
                  <div className="bg-red-950/30 border border-red-900/40 rounded p-3.5 text-xs text-red-400 font-sans flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{msgPromoErro}</span>
                  </div>
                )}

                {/* Últimas Promoções e Rebaixamentos history list */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-300 tracking-tight flex items-center gap-2 font-sans border-b border-zinc-900 pb-2.5">
                    <History className="w-4 h-4 text-zinc-400" />
                    <span>Últimas Promoções e Rebaixamentos</span>
                  </h3>

                  <div className="space-y-0.5 border border-[#222] bg-[#121212]/30 rounded-lg divide-y divide-[#222] overflow-hidden">
                    {movimentacoes.length > 0 ? (
                      movimentacoes.map((mov) => {
                        const polLog = listaPoliciais.find(p => p.nick.toLowerCase() === mov.nickPolicial.toLowerCase());
                        const avatarUser = polLog?.avatarHabbo || mov.nickPolicial;
                        return (
                          <div
                            key={mov.id}
                            className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-zinc-950/10 hover:bg-zinc-950/20 transition-all duration-150"
                          >
                            <div className="flex items-start gap-3.5">
                              {/* Round avatar head inside circle container */}
                              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                                <img
                                  src={obterAvatarUrl({ avatarHabbo: avatarUser, fotoUrl: polLog?.fotoUrl }, 'head')}
                                  alt=""
                                  className="scale-125"
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-zinc-100 text-sm font-sans">{mov.nickPolicial}</span>
                                  <span
                                    className={`text-[9px] font-sans px-2.5 py-0.5 rounded-full font-bold ${
                                      mov.tipo === 'rebaixamento'
                                        ? 'text-red-400 bg-red-950/20 border border-red-900/30'
                                        : 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/30'
                                    }`}
                                  >
                                    {mov.tipo === 'rebaixamento' ? 'Rebaixamento' : 'Promoção'}
                                  </span>
                                </div>

                                <div className="text-xs text-zinc-200 font-sans font-medium">
                                  {mov.cargoAnterior} → {mov.cargoNovo}
                                </div>

                                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                                  {mov.motivo}
                                </p>

                                <div className="text-[10px] text-zinc-500 font-sans pt-0.5">
                                  por <span className="text-zinc-400 font-bold">{mov.autor}</span>
                                </div>
                              </div>
                            </div>

                            <span className="text-xs text-zinc-500 font-sans whitespace-nowrap self-start sm:self-auto">
                              {mov.data}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center py-8 text-zinc-600 text-xs font-sans">Nenhuma movimentação decretada.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: HIERARQUIA DE PATENTES */}
            {abaAtiva === 'hierarquia' && (
              <motion.div
                key="hierarquia"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-tactical font-bold text-zinc-100 tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-red-500" />
                      ESCALA DE HIERARQUIAS E PATENTES
                    </h3>
                    <p className="text-xs text-zinc-400 font-tactical leading-relaxed">
                      Gerencie as carreiras e suas respectivas patentes de forma 100% dinâmica.
                    </p>
                  </div>

                  <button
                    onClick={abrirCriarCategoria}
                    className="px-4 py-2.5 bg-gradient-to-r from-red-950 via-red-800 to-red-950 text-white font-tactical font-bold text-xs tracking-wider rounded hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer flex items-center gap-1.5 self-start md:self-auto shadow-[0_3px_10px_rgba(239,68,68,0.1)]"
                  >
                    <Plus className="w-4 h-4" />
                    NOVA CATEGORIA / CARREIRA
                  </button>
                </div>

                {/* Categories Grid displays */}
                <div className="space-y-8">
                  {categorias.length > 0 ? (
                    categorias.map((cat, catIndex) => {
                      const patentesFiltradas = patentes.filter(p => p.categoriaId === cat.id).sort((a, b) => a.ordem - b.ordem);

                      return (
                        <div key={cat.id} className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-5 space-y-4">
                          <div className="flex justify-between items-center border-b border-zinc-900 pb-3 flex-wrap gap-2">
                            <div>
                              <h4 className="text-sm font-tactical font-extrabold text-zinc-100 uppercase tracking-widest">{cat.nome}</h4>
                              {cat.subtitulo && <p className="text-[10px] text-zinc-500 font-tactical mt-0.5">{cat.subtitulo}</p>}
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5 mr-1">
                                <button
                                  onClick={() => reordenarCategoria(cat, 'up')}
                                  disabled={catIndex === 0}
                                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 disabled:opacity-20 disabled:pointer-events-none rounded cursor-pointer transition-all"
                                  title="Mover Categoria para Cima"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => reordenarCategoria(cat, 'down')}
                                  disabled={catIndex === categorias.length - 1}
                                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 disabled:opacity-20 disabled:pointer-events-none rounded cursor-pointer transition-all"
                                  title="Mover Categoria para Baixo"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <button
                                onClick={() => abrirCriarPatente(cat.id)}
                                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-tactical text-[10px] tracking-wider rounded transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                NOVA PATENTE
                              </button>
                              <button
                                onClick={() => abrirEditarCategoria(cat)}
                                className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer transition-all"
                                title="Editar Categoria"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => lidarComExcluirCategoria(cat.id)}
                                className="p-1.5 bg-red-950/10 hover:bg-red-950/30 border border-red-950/20 hover:border-red-900/50 text-red-500/80 hover:text-red-400 rounded cursor-pointer transition-all"
                                title="Excluir Categoria"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Ranks list within Category */}
                          <div className="space-y-3">
                            {patentesFiltradas.length > 0 ? (
                              patentesFiltradas.map((pat, index) => {
                                const oficiaisDaPatente = listaPoliciais.filter(p => p.cargo === pat.nome);

                                return (
                                  <div key={pat.id} className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-zinc-800">
                                    <div className="space-y-1.5 min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-850">ORDEM #{index + 1}</span>
                                        <h5 className="text-sm font-tactical font-bold text-zinc-100">{pat.nome}</h5>
                                        {pat.insignia && (
                                          <span className="text-amber-500 text-[10px] font-mono tracking-widest bg-amber-950/10 px-1.5 py-0.2 rounded border border-amber-950/25">{pat.insignia}</span>
                                        )}
                                      </div>

                                      {pat.responsabilidade && (
                                        <p className="text-xs text-zinc-400 font-tactical leading-relaxed">{pat.responsabilidade}</p>
                                      )}

                                      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                                        {pat.equivalente && (
                                          <span className="text-[10px] text-zinc-500 font-tactical flex items-center gap-1">
                                            <Briefcase className="w-3 h-3 text-zinc-600" /> Equivalente: {pat.equivalente}
                                          </span>
                                        )}
                                        {pat.salario && (
                                          <span className="text-[10px] text-zinc-500 font-tactical flex items-center gap-1">
                                            <DollarSign className="w-3 h-3 text-zinc-600" /> Valor do cargo: {pat.salario}
                                          </span>
                                        )}
                                        <span className="text-[10px] text-zinc-500 font-tactical flex items-center gap-1">
                                          <Users className="w-3 h-3 text-zinc-600" /> Militares ativos: {oficiaisDaPatente.length}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Action button triggers inside rank item */}
                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto border-t sm:border-t-0 border-zinc-900/60 pt-2 sm:pt-0">
                                      <div className="flex gap-0.5">
                                        <button
                                          onClick={() => reordenarPatente(pat, 'up')}
                                          disabled={index === 0}
                                          className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 disabled:opacity-20 disabled:pointer-events-none rounded cursor-pointer transition-all"
                                          title="Mover para cima"
                                        >
                                          <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => reordenarPatente(pat, 'down')}
                                          disabled={index === patentesFiltradas.length - 1}
                                          className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 disabled:opacity-20 disabled:pointer-events-none rounded cursor-pointer transition-all"
                                          title="Mover para baixo"
                                        >
                                          <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                      </div>

                                      <button
                                        onClick={() => abrirEditarPatente(pat)}
                                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer transition-all"
                                        title="Editar Detalhes"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => lidarComExcluirPatente(pat.id)}
                                        className="p-1.5 bg-red-950/10 hover:bg-red-950/30 border border-red-950/20 hover:border-red-900/50 text-red-500/80 hover:text-red-400 rounded cursor-pointer transition-all"
                                        title="Excluir Patente"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-center py-4 text-zinc-650 text-xs font-tactical italic">Nenhuma patente cadastrada nesta categoria. Clique em "+ Nova Patente" para começar.</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-8 text-center space-y-3">
                      <HelpCircle className="w-10 h-10 text-zinc-600 mx-auto" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-tactical font-bold text-zinc-400">Nenhuma categoria registrada</h4>
                        <p className="text-xs text-zinc-600 max-w-sm mx-auto font-tactical leading-relaxed">Não há nenhuma escala de patentes definida ainda. Crie uma categoria para começar a construir a estrutura hierárquica.</p>
                      </div>
                      <button
                        onClick={abrirCriarCategoria}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-200 text-xs font-tactical font-semibold tracking-wider rounded cursor-pointer transition-all"
                      >
                        CRIAR PRIMEIRA CATEGORIA
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB: XP */}
            {abaAtiva === 'xp' && (
              <motion.div
                key="xp"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 bg-amber-950/30 border border-amber-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <Trophy className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="space-y-0.5">
                      <h2 className="text-base font-bold text-zinc-100 font-sans tracking-tight">Pontos de Experiência (XP)</h2>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                        Envie XP para um ou mais usuários, acompanhe e edite os envios já feitos.
                      </p>
                    </div>
                  </div>
                  {!mostrarFormXP && (permissoesUser.podeEnviarXP || eMaster) && (
                    <button
                      onClick={() => {
                        setEditandoXP(null);
                        setXpMotivo('');
                        setXpValor('5');
                        setXpDestinatarios([]);
                        setMostrarFormXP(true);
                        setDetalhesXP(null);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-semibold font-tactical text-xs tracking-wider rounded-md cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>ENVIAR XP</span>
                    </button>
                  )}
                </div>

                {/* Form to Send/Edit XP */}
                {mostrarFormXP && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="border border-zinc-900 bg-zinc-950/40 rounded-lg p-5 space-y-4"
                  >
                    <div className="border-b border-zinc-900/60 pb-2.5 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-sans">
                        {editandoXP ? 'Editar Envio de XP' : 'Enviar Novo XP'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setMostrarFormXP(false);
                          setEditandoXP(null);
                        }}
                        className="text-zinc-500 hover:text-zinc-300 text-xs font-tactical uppercase"
                      >
                        Cancelar
                      </button>
                    </div>

                    <form onSubmit={lidarComSalvarXP} className="space-y-4">
                      {/* Recipients section */}
                      <div>
                        <label className="block text-[10px] text-zinc-500 font-sans mb-1.5 uppercase tracking-wider font-bold">
                          Selecione os Destinatários ({xpDestinatarios.length} selecionado(s))
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-2 border border-zinc-900 bg-[#121212] rounded custom-scrollbar">
                          {listaPoliciais.map((pol) => {
                            const isSelected = xpDestinatarios.includes(pol.nick);
                            return (
                              <button
                                key={pol.nick}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setXpDestinatarios(xpDestinatarios.filter(n => n !== pol.nick));
                                  } else {
                                    setXpDestinatarios([...xpDestinatarios, pol.nick]);
                                  }
                                }}
                                className={`flex items-center gap-2.5 p-2 rounded border text-left transition-all ${
                                  isSelected
                                    ? 'bg-amber-950/20 border-amber-850 text-amber-400'
                                    : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                                }`}
                              >
                                <div className="w-6 h-6 rounded-full bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center border border-zinc-800">
                                  <img
                                    src={obterAvatarUrl(pol, 'head')}
                                    alt={pol.nick}
                                    referrerPolicy="no-referrer"
                                    className="scale-125"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold truncate">{pol.nick}</div>
                                  <div className="text-[9px] text-zinc-500 truncate">{pol.cargo}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Motivo */}
                        <div className="md:col-span-2">
                          <label className="block text-[10px] text-zinc-500 font-sans mb-1.5 uppercase tracking-wider font-bold">Motivo do Envio</label>
                          <input
                            type="text"
                            value={xpMotivo}
                            onChange={(e) => setXpMotivo(e.target.value)}
                            placeholder="Ex: Atuação exemplar e organização de relatórios no QG."
                            className="w-full bg-[#121212] border border-[#222] focus:border-red-600 text-zinc-100 font-sans px-3 py-2 rounded text-xs outline-none transition-all h-9"
                            required
                          />
                        </div>

                        {/* Valor */}
                        <div>
                          <label className="block text-[10px] text-zinc-500 font-sans mb-1.5 uppercase tracking-wider font-bold">Valor de XP (+ / -)</label>
                          <input
                            type="number"
                            value={xpValor}
                            onChange={(e) => setXpValor(e.target.value)}
                            placeholder="Ex: 5 ou -10"
                            className="w-full bg-[#121212] border border-[#222] focus:border-red-600 text-zinc-100 font-sans px-3 py-2 rounded text-xs outline-none transition-all h-9"
                            required
                          />
                          <span className="text-[9px] text-zinc-500 mt-1 block">Positivo adiciona, negativo (ex: -10) remove XP.</span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMostrarFormXP(false);
                            setEditandoXP(null);
                          }}
                          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-sans font-bold text-xs tracking-wider rounded transition-all cursor-pointer h-9"
                        >
                          CANCELAR
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-sans font-bold text-xs tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 h-9"
                        >
                          <Save className="w-4 h-4" />
                          <span>{editandoXP ? 'SALVAR ALTERAÇÕES' : 'ENVIAR XP'}</span>
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Error/Success messages */}
                {msgXPErro && (
                  <div className="bg-red-950/30 border border-red-900/40 rounded p-3 text-xs text-red-400 font-sans flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{msgXPErro}</span>
                  </div>
                )}
                {msgXPSucesso && (
                  <div className="bg-emerald-950/30 border border-emerald-900/40 rounded p-3 text-xs text-emerald-400 font-sans flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{msgXPSucesso}</span>
                  </div>
                )}

                {/* Details Popup/Card */}
                {detalhesXP && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border border-zinc-900 bg-zinc-950 rounded-lg p-5 space-y-4"
                  >
                    <div className="border-b border-zinc-900 pb-2.5 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-sans">
                        Detalhes do Envio de XP
                      </h3>
                      <button
                        type="button"
                        onClick={() => setDetalhesXP(null)}
                        className="text-zinc-500 hover:text-zinc-300 text-xs font-sans uppercase"
                      >
                        Fechar
                      </button>
                    </div>

                    <div className="space-y-3 text-xs font-sans">
                      <div>
                        <span className="text-zinc-500 block uppercase text-[10px] tracking-wider mb-0.5">Motivo:</span>
                        <p className="text-zinc-200 text-sm font-semibold">{detalhesXP.motivo}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-zinc-500 block uppercase text-[10px] tracking-wider mb-0.5">Valor do XP:</span>
                          <span className={`font-bold ${detalhesXP.valor >= 0 ? 'text-amber-500' : 'text-red-400'}`}>
                            {detalhesXP.valor > 0 ? `+${detalhesXP.valor}` : detalhesXP.valor} XP
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block uppercase text-[10px] tracking-wider mb-0.5">Enviado por:</span>
                          <span className="text-zinc-300 font-semibold">{detalhesXP.enviadoPor}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-zinc-500 block uppercase text-[10px] tracking-wider mb-0.5">Data de Envio:</span>
                        <span className="text-zinc-300">{detalhesXP.data}</span>
                      </div>

                      <div>
                        <span className="text-zinc-500 block uppercase text-[10px] tracking-wider mb-2 font-bold font-sans">Destinatários ({detalhesXP.destinatarios.length}):</span>
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#121212] rounded border border-zinc-900">
                          {detalhesXP.destinatarios.map((nick) => {
                            const userObj = policiais[nick.toLowerCase()];
                            return (
                              <div
                                key={nick}
                                className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded"
                              >
                                <div className="w-5 h-5 rounded-full bg-zinc-950 overflow-hidden shrink-0 flex items-center justify-center">
                                  <img
                                    src={obterAvatarUrl(userObj, 'head', nick)}
                                    alt={nick}
                                    referrerPolicy="no-referrer"
                                    className="scale-125"
                                  />
                                </div>
                                <span className="text-zinc-300 text-xs font-medium font-sans">{nick}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* History Table */}
                <div className="border border-zinc-900 bg-zinc-950/40 rounded-lg p-5">
                  <div className="border-b border-zinc-900 pb-2.5 mb-4">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-sans">Histórico de Envios</h4>
                  </div>

                  <div className="overflow-x-auto">
                    {enviosXP.length > 0 ? (
                      <table className="w-full text-left border-collapse font-sans text-xs">
                        <thead>
                          <tr className="border-b border-zinc-900 text-zinc-500 text-[10px] tracking-wider uppercase">
                            <th className="py-3 px-4 font-bold font-sans">Motivo</th>
                            <th className="py-3 px-4 font-bold text-center font-sans">Valor</th>
                            <th className="py-3 px-4 font-bold font-sans">Destinatários</th>
                            <th className="py-3 px-4 font-bold font-sans">Enviado por</th>
                            <th className="py-3 px-4 font-bold font-sans">Data</th>
                            <th className="py-3 px-4 font-bold text-right font-sans">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                          {enviosXP.map((envio) => (
                            <tr key={envio.id} className="hover:bg-zinc-900/10 transition-colors">
                              <td className="py-3.5 px-4 font-medium text-zinc-200 max-w-xs truncate" title={envio.motivo}>
                                {envio.motivo}
                              </td>
                              <td className={`py-3.5 px-4 text-center font-bold font-mono ${envio.valor >= 0 ? 'text-amber-500' : 'text-red-400'}`}>
                                {envio.valor > 0 ? `+${envio.valor}` : envio.valor} XP
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-medium font-sans">
                                  {envio.destinatarios.length} militar(es)
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-zinc-400 font-semibold font-sans">
                                {envio.enviadoPor}
                              </td>
                              <td className="py-3.5 px-4 text-zinc-500 font-mono">
                                {envio.data}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setDetalhesXP(envio)}
                                    className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-900 rounded cursor-pointer transition-all font-sans"
                                  >
                                    Detalhes
                                  </button>
                                  {(permissoesUser.podeEnviarXP || eMaster) && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditandoXP(envio);
                                          setXpMotivo(envio.motivo);
                                          setXpValor(envio.valor.toString());
                                          setXpDestinatarios(envio.destinatarios);
                                          setMostrarFormXP(true);
                                          setDetalhesXP(null);
                                          window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-zinc-900 rounded cursor-pointer transition-all"
                                        title="Editar"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => lidarComExcluirXP(envio.id)}
                                        className="p-1.5 text-red-800 hover:text-red-500 hover:bg-zinc-900 border border-zinc-900 rounded cursor-pointer transition-all"
                                        title="Excluir"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-12 text-zinc-600 font-sans">
                        <Trophy className="w-8 h-8 text-zinc-800 mx-auto mb-2.5" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-sans">Nenhum envio de XP registrado</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5 font-sans">Use o botão acima para enviar pontos de XP para os militares da corporação.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: GRUPOS */}
            {abaAtiva === 'grupos' && (
              <motion.div
                key="grupos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-tactical font-bold text-zinc-100 tracking-wider flex items-center gap-2">
                      <Users className="w-5 h-5 text-red-500" />
                      GRUPOS E DEPARTAMENTOS DE ELITE
                    </h3>
                    <p className="text-xs text-zinc-400 font-tactical leading-relaxed">
                      Gerencie as siglas, integrantes e emblemas dos departamentos oficiais da corporação.
                    </p>
                  </div>

                  {permissoesUser.podeGerenciarGrupos && (
                    <button
                      onClick={abrirCriarGrupo}
                      className="px-4 py-2.5 bg-gradient-to-r from-red-950 via-red-800 to-red-950 text-white font-tactical font-bold text-xs tracking-wider rounded hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start md:self-auto shadow-[0_3px_10px_rgba(239,68,68,0.1)]"
                    >
                      <Plus className="w-4 h-4" />
                      CRIAR NOVO GRUPO
                    </button>
                  )}
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex bg-zinc-950/85 border border-zinc-900 rounded p-1 w-full sm:w-auto shrink-0">
                    <button
                      onClick={() => setAbaGrupos('todos')}
                      className={`flex-1 sm:flex-none px-4 py-1.5 rounded text-xs font-tactical font-semibold tracking-wider transition-all cursor-pointer uppercase ${
                        abaGrupos === 'todos'
                          ? 'bg-red-950/50 text-red-400 border border-red-900/30 font-bold'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Todos os Grupos
                    </button>
                    <button
                      onClick={() => setAbaGrupos('meus')}
                      className={`flex-1 sm:flex-none px-4 py-1.5 rounded text-xs font-tactical font-semibold tracking-wider transition-all cursor-pointer uppercase ${
                        abaGrupos === 'meus'
                          ? 'bg-red-950/50 text-red-400 border border-red-900/30 font-bold'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Meus Grupos
                    </button>
                  </div>

                  <div className="relative w-full sm:max-w-xs">
                    <Search className="w-4 h-4 text-zinc-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={buscaGrupo}
                      onChange={(e) => setBuscaGrupo(e.target.value)}
                      placeholder="Buscar grupos..."
                      className="w-full bg-zinc-950/40 border border-zinc-900 text-xs text-zinc-100 pl-10 pr-4 py-2.5 rounded-md focus:border-red-600/80 outline-none placeholder:text-zinc-700 transition-all font-tactical"
                    />
                  </div>
                </div>

                {/* Groups Grid List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {grupos
                    .filter((g) => {
                      const q = buscaGrupo.toLowerCase().trim();
                      if (q) {
                        const nameMatch = g.nome.toLowerCase().includes(q);
                        const siglaMatch = g.sigla.toLowerCase().includes(q);
                        const descMatch = g.descricao.toLowerCase().includes(q);
                        if (!nameMatch && !siglaMatch && !descMatch) return false;
                      }
                      if (abaGrupos === 'meus') {
                        return g.membros.includes(policial.nick);
                      }
                      return true;
                    })
                    .map((grupo) => {
                      const estaMembro = grupo.membros.includes(policial.nick);
                      const badgeUrl = obterBadgeUrl(grupo.urlImagem);

                      return (
                        <div
                          key={grupo.id}
                          className="bg-gradient-to-b from-zinc-950/90 to-zinc-950/40 border border-zinc-900 rounded-lg p-5 flex flex-col justify-between hover:border-zinc-800 transition-all relative overflow-hidden group shadow-lg"
                        >
                          <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${grupo.verificado ? 'from-amber-600 via-amber-500 to-amber-600' : 'from-zinc-800 to-zinc-900'}`} />

                          <div>
                            <div className="flex items-center gap-3 mb-3.5">
                              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800/80 rounded-md flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-md">
                                <img
                                  src={badgeUrl}
                                  alt={grupo.nome}
                                  className="w-10 h-10 object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="text-sm font-tactical font-bold text-zinc-100 truncate">
                                    {grupo.nome}
                                  </h4>
                                  {grupo.verificado && (
                                    <span className="text-[8px] bg-amber-950/40 border border-amber-900/30 text-amber-500 px-1 py-0.5 rounded flex items-center gap-0.5">
                                      ★ OFICIAL
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  [{grupo.sigla.toUpperCase()}]
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-zinc-400 font-tactical leading-relaxed line-clamp-3 mb-4 min-h-[54px]">
                              {grupo.descricao || 'Nenhuma descrição detalhada disponível.'}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-5">
                              <span className="text-[9px] bg-zinc-900/50 border border-zinc-850 text-zinc-500 font-mono px-2 py-0.5 rounded">
                                {grupo.membros.length} INTEGRANTES
                              </span>
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${grupo.publico ? 'bg-green-950/20 border border-green-900/20 text-green-500' : 'bg-red-950/20 border border-red-900/20 text-red-500'}`}>
                                {grupo.publico ? 'ABERTO' : 'RESTRITO'}
                              </span>
                            </div>

                            {permissoesUser.podeGerenciarGrupos && (
                              <div className="mt-2 mb-4 p-2 bg-zinc-950/80 border border-zinc-900 rounded-md flex gap-1.5 items-center">
                                <input
                                  type="text"
                                  placeholder="Adicionar nick..."
                                  id={`quick_add_${grupo.id}`}
                                  className="flex-1 bg-zinc-900/40 border border-zinc-800 text-[10px] text-zinc-300 px-2 py-1 rounded outline-none focus:border-red-600 font-tactical"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const val = (e.target as HTMLInputElement).value;
                                      lidarComQuickAddMembro(grupo, val);
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById(`quick_add_${grupo.id}`) as HTMLInputElement;
                                    if (input) {
                                      lidarComQuickAddMembro(grupo, input.value);
                                      input.value = '';
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[10px] font-bold font-tactical rounded cursor-pointer transition-all uppercase"
                                >
                                  Add
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t border-zinc-900 flex items-center justify-between gap-2 mt-auto">
                            {estaMembro ? (
                              <button
                                onClick={() => {
                                  const novos = grupo.membros.filter(m => m !== policial.nick);
                                  salvarGrupo({ ...grupo, membros: novos });
                                  carregarDados();
                                }}
                                className="px-3 py-1.5 bg-red-950/25 hover:bg-red-950/40 border border-red-900/30 hover:border-red-600 text-red-400 font-tactical font-semibold text-[10px] tracking-wider rounded cursor-pointer transition-all flex items-center gap-1"
                              >
                                <MinusCircle className="w-3 h-3" />
                                SAIR DO GRUPO
                              </button>
                            ) : grupo.aceitaMembros ? (
                              <button
                                onClick={() => {
                                  const novos = [...grupo.membros, policial.nick];
                                  salvarGrupo({ ...grupo, membros: novos });
                                  carregarDados();
                                }}
                                className="px-3 py-1.5 bg-green-950/25 hover:bg-green-950/40 border border-green-900/30 hover:border-green-600 text-green-400 font-tactical font-semibold text-[10px] tracking-wider rounded cursor-pointer transition-all flex items-center gap-1"
                              >
                                <PlusCircle className="w-3 h-3" />
                                FAZER PARTE
                              </button>
                            ) : (
                              <span className="text-[9px] text-zinc-600 font-tactical py-1.5 px-1.5 bg-zinc-950/50 border border-zinc-900 rounded italic">
                                RECRUTAMENTO FECHADO
                              </span>
                            )}

                            {permissoesUser.podeGerenciarGrupos && (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => abrirEditarGrupo(grupo)}
                                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer transition-all"
                                  title="Editar Detalhes / Membros"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => lidarComExcluirGrupo(grupo.id)}
                                  className="p-1.5 bg-red-950/10 hover:bg-red-950/30 border border-red-950/20 hover:border-red-900/50 text-red-500/80 hover:text-red-400 rounded cursor-pointer transition-all"
                                  title="Excluir Grupo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {grupos.length === 0 && (
                    <div className="col-span-full py-12 text-center">
                      <p className="text-zinc-600 text-xs font-tactical">Nenhum grupo tático registrado ainda.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB: AULAS E TREINAMENTOS */}
            {abaAtiva === 'aulas' && (
              <motion.div
                key="aulas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* View 1: Creating or Editing a Training */}
                {(estaCriandoTreinamento || modoEdicaoTreinamento) ? (
                  <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 sm:p-6 space-y-6">
                    <style>{`
                      .rich-editor[contenteditable]:empty::before {
                        content: attr(placeholder);
                        color: #52525b;
                        pointer-events: none;
                        display: block;
                      }
                      .rich-editor:focus {
                        outline: none;
                      }
                      .rich-editor ul {
                        list-style-type: disc !important;
                        padding-left: 1.5rem !important;
                        margin-top: 0.75rem !important;
                        margin-bottom: 0.75rem !important;
                      }
                      .rich-editor ol {
                        list-style-type: decimal !important;
                        padding-left: 1.5rem !important;
                        margin-top: 0.75rem !important;
                        margin-bottom: 0.75rem !important;
                      }
                      .rich-editor blockquote {
                        border-left: 3px solid #b91c1c !important;
                        padding-left: 1rem !important;
                        color: #a1a1aa !important;
                        font-style: italic !important;
                        margin: 1rem 0 !important;
                      }
                    `}</style>

                    <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between border-b border-zinc-900 pb-5">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEstaCriandoTreinamento(false);
                            setModoEdicaoTreinamento(false);
                            setTreinamentoSelecionado(null);
                          }}
                          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-all font-tactical uppercase cursor-pointer bg-zinc-900/40 px-2.5 py-1.5 rounded border border-zinc-850 mt-1"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Voltar</span>
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-red-500" />
                            <h3 className="text-sm font-tactical font-bold text-zinc-100 tracking-wider">
                              {modoEdicaoTreinamento ? 'EDITAR TREINAMENTO' : 'NOVO TREINAMENTO'}
                            </h3>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                            Monte o conteúdo do treinamento com o editor e, se quiser, configure o cargo/patente que pode ser vinculado aos alunos aprovados.
                          </p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={lidarComSalvarTreinamento} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="block text-[11px] text-zinc-400 font-tactical uppercase tracking-wider font-semibold">Título *</label>
                          <input
                            type="text"
                            required
                            value={treinoTitulo}
                            onChange={(e) => setTreinoTitulo(e.target.value)}
                            placeholder="Ex.: Curso de Formação de Soldados"
                            className="w-full bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 px-3.5 py-2.5 rounded focus:border-red-600 outline-none font-sans"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] text-zinc-400 font-tactical uppercase tracking-wider font-semibold">Status</label>
                          <select
                            value={treinoStatus}
                            onChange={(e) => setTreinoStatus(e.target.value as 'rascunho' | 'publicada')}
                            className="w-full bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 px-3.5 py-2.5 rounded focus:border-red-600 outline-none font-tactical"
                          >
                            <option value="rascunho">Rascunho</option>
                            <option value="publicada">Publicada (Ativa)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] text-zinc-400 font-tactical uppercase tracking-wider font-semibold">Descrição</label>
                        <input
                          type="text"
                          value={treinoDescricao}
                          onChange={(e) => setTreinoDescricao(e.target.value)}
                          placeholder="Resumo curto exibido na listagem de aulas"
                          className="w-full bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 px-3.5 py-2.5 rounded focus:border-red-600 outline-none font-sans"
                        />
                      </div>

                      {/* Conteúdo do treinamento editor */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-[11px] text-zinc-400 font-tactical uppercase tracking-wider font-semibold">Conteúdo do treinamento</label>
                          <button
                            type="button"
                            onClick={() => {
                              const modeloBOPE = `<div class="text-center space-y-6 py-4">
  <div class="flex justify-center">
    <div class="w-20 h-20 rounded-full bg-red-950/20 border border-red-800 flex items-center justify-center p-3">
      <span class="text-red-500 font-bold text-3xl">💀</span>
    </div>
  </div>
  <div class="space-y-2">
    <h3 class="text-base font-bold text-zinc-100 tracking-wider">BATALHÃO DE OPERAÇÕES POLICIAIS ESPECIAIS</h3>
    <h4 class="text-xs font-semibold text-zinc-400 tracking-wider">COMANDO DE OPERAÇÕES</h4>
    <h5 class="text-[10px] font-semibold text-zinc-500 tracking-widest">DEPARTAMENTO DE ENSINO</h5>
  </div>
  <div class="py-1.5 border-t border-b border-zinc-800 max-w-xs mx-auto">
    <h4 class="text-[11px] font-bold text-red-500 tracking-widest">TREINAMENTO DE FORMAÇÃO</h4>
  </div>
  <div class="text-left max-w-md mx-auto space-y-3 text-xs text-zinc-300 leading-relaxed pt-3">
    <ul class="list-disc pl-5 space-y-2 text-zinc-400">
      <li>Instrutor(a), procure ter paciência com o(a) Policial e não reprová-lo(a) desnecessariamente.</li>
      <li>A aplicação deste treinamento de forma incorreta está sujeita a sanções disciplinares.</li>
      <li>Após a aprovação no Treinamento, o(a) instruído(a) ficará sob a responsabilidade do(a) Instrutor(a).</li>
    </ul>
  </div>
</div>`;
                              if (modoEdicaoTexto === 'visual') {
                                executarComandoEditor('insertHTML', modeloBOPE);
                              } else {
                                setTreinoConteudo(prev => prev + modeloBOPE);
                              }
                            }}
                            className="px-2.5 py-1 bg-red-950/20 hover:bg-red-950/40 text-[10px] text-red-400 rounded border border-red-900/30 font-tactical uppercase tracking-wider transition-all cursor-pointer"
                            title="Inserir modelo oficial de treinamento BOPE"
                          >
                            Carregar Modelo BOPE
                          </button>
                        </div>

                        <div className="border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
                          {/* Rich Text Toolbar */}
                          <div className="bg-zinc-900/40 border-b border-zinc-800 p-2 flex flex-wrap items-center gap-1 text-zinc-400 select-none">
                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('undo')} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer" 
                              title="Desfazer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('redo')} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer" 
                              title="Refazer"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>

                            <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                            <select 
                              onChange={(e) => handleFormatBlock(e.target.value)}
                              className="bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300 py-0.5 px-1.5 rounded cursor-pointer outline-none hover:border-zinc-700 font-tactical"
                              title="Título"
                            >
                              <option value="p">T Título</option>
                              <option value="p">Parágrafo</option>
                              <option value="h1">Título 1</option>
                              <option value="h2">Título 2</option>
                              <option value="h3">Título 3</option>
                            </select>

                            <select 
                              onChange={(e) => handleFontName(e.target.value)}
                              className="bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300 py-0.5 px-1.5 rounded cursor-pointer outline-none hover:border-zinc-700 font-tactical"
                              title="Fonte"
                            >
                              <option value="Inter, sans-serif">T Fonte</option>
                              <option value="Inter, sans-serif">Sans-serif</option>
                              <option value="Georgia, serif">Serif</option>
                              <option value="JetBrains Mono, monospace">Mono</option>
                            </select>

                            <select 
                              onChange={(e) => handleFontSize(e.target.value)}
                              className="bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300 py-0.5 px-1.5 rounded cursor-pointer outline-none hover:border-zinc-700 font-tactical"
                              title="Tamanho"
                            >
                              <option value="3">T Tamanho</option>
                              <option value="2">Pequeno</option>
                              <option value="3">Normal</option>
                              <option value="5">Grande</option>
                              <option value="6">Extra Grande</option>
                            </select>

                            <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('bold')} 
                              className="px-2 py-0.5 hover:bg-zinc-800 rounded font-bold text-xs text-zinc-300 cursor-pointer" 
                              title="Negrito"
                            >
                              B
                            </button>
                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('italic')} 
                              className="px-2 py-0.5 hover:bg-zinc-800 rounded italic text-xs font-serif text-zinc-300 cursor-pointer" 
                              title="Itálico"
                            >
                              I
                            </button>
                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('underline')} 
                              className="px-2 py-0.5 hover:bg-zinc-800 rounded underline text-xs text-zinc-300 cursor-pointer" 
                              title="Sublinhado"
                            >
                              U
                            </button>
                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('strikeThrough')} 
                              className="px-2 py-0.5 hover:bg-zinc-800 rounded line-through text-xs text-zinc-300 cursor-pointer" 
                              title="Tachado"
                            >
                              S
                            </button>

                            <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('justifyLeft')} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Alinhar à Esquerda"
                            >
                              <AlignLeft className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('justifyCenter')} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Centralizar"
                            >
                              <AlignCenter className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('justifyRight')} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Alinhar à Direita"
                            >
                              <AlignRight className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('justifyFull')} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Justificar"
                            >
                              <AlignJustify className="w-3.5 h-3.5" />
                            </button>

                            <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('insertUnorderedList')} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Lista com Marcadores"
                            >
                              <List className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('insertOrderedList')} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Lista Numerada"
                            >
                              <ListOrdered className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('outdent')} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Diminuir Recuo"
                            >
                              <Outdent className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('indent')} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Aumentar Recuo"
                            >
                              <Indent className="w-3.5 h-3.5" />
                            </button>

                            <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('formatBlock', 'blockquote')} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Citação"
                            >
                              <Quote className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('insertHorizontalRule')} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Linha Divisória"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                            {/* Color controls */}
                            <div className="flex items-center gap-1.5 px-1" title="Cor da Fonte">
                              <span className="text-[9px] text-zinc-500 font-tactical">Cor</span>
                              <input 
                                type="color" 
                                onChange={(e) => handleForeColor(e.target.value)}
                                className="w-4 h-4 rounded bg-transparent border border-zinc-800 cursor-pointer" 
                              />
                            </div>
                            <div className="flex items-center gap-1.5 px-1" title="Destaque de Fundo">
                              <span className="text-[9px] text-zinc-500 font-tactical">Destaque</span>
                              <input 
                                type="color" 
                                defaultValue="#880000"
                                onChange={(e) => handleHiliteColor(e.target.value)}
                                className="w-4 h-4 rounded bg-transparent border border-zinc-800 cursor-pointer" 
                              />
                            </div>

                            <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('formatBlock', 'pre')} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Bloco de Código"
                            >
                              <Code className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => executarComandoEditor('removeFormat')} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Limpar Formatação"
                            >
                              <Eraser className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={handleLineHeight} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Altura da Linha"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>

                            <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                            <button 
                              type="button" 
                              onClick={handleInsertLink} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Inserir Link"
                            >
                              <Link className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={handleInsertImage} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Inserir Imagem"
                            >
                              <Image className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={handleInsertYouTube} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Inserir Vídeo do YouTube"
                            >
                              <Video className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={handleInsertTable} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Inserir Tabela"
                            >
                              <Table className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={handleImportHTML} 
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                              title="Importar HTML"
                            >
                              <FileUp className="w-3.5 h-3.5" />
                            </button>

                            <div className="flex-1 min-w-[10px]" />

                            <div className="flex items-center gap-1.5">
                              <button 
                                type="button" 
                                onClick={() => {
                                  setModoEdicaoTexto(modoEdicaoTexto === 'visual' ? 'codigo' : 'visual');
                                  setPreviewAtivo(false);
                                }}
                                className={`px-2 py-0.5 rounded text-[9px] font-tactical uppercase tracking-wider border cursor-pointer transition-all ${
                                  modoEdicaoTexto === 'codigo'
                                    ? 'bg-red-950/30 text-red-400 border-red-900/50'
                                    : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:text-zinc-200'
                                }`}
                                title="Alternar Modo de Edição"
                              >
                                {modoEdicaoTexto === 'visual' ? 'Código HTML' : 'Visual'}
                              </button>

                              <button 
                                type="button" 
                                onClick={() => setPreviewAtivo(!previewAtivo)}
                                className={`p-1 rounded cursor-pointer transition-all ${
                                  previewAtivo
                                    ? 'bg-red-950/20 text-red-500 border border-red-900/30'
                                    : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                                }`}
                                title="Visualizar Conteúdo Formatado"
                              >
                                {previewAtivo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Editor Content Area */}
                          {previewAtivo ? (
                            <div 
                              className="w-full bg-zinc-950 p-4 min-h-[380px] overflow-y-auto prose prose-invert max-w-none text-zinc-200 text-xs leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: treinoConteudo || '<span class="text-zinc-600 italic">Nenhum conteúdo escrito para visualizar...</span>' }}
                            />
                          ) : modoEdicaoTexto === 'codigo' ? (
                            <textarea
                              rows={16}
                              value={treinoConteudo}
                              onChange={(e) => setTreinoConteudo(e.target.value)}
                              placeholder="Código HTML do treinamento..."
                              className="w-full bg-zinc-950 p-4 min-h-[380px] font-mono text-xs text-red-400 outline-none focus:ring-0 resize-y"
                            />
                          ) : (
                            <div 
                              ref={editorRef}
                              contentEditable={true}
                              onInput={lidarComInputEditor}
                              placeholder="Escreva o conteúdo da aula..."
                              className="rich-editor w-full bg-zinc-950 p-4 min-h-[380px] text-xs text-zinc-200 outline-none focus:ring-0 overflow-y-auto"
                            />
                          )}
                        </div>
                      </div>

                      {/* Cargo/patente vinculável */}
                      <div className="bg-zinc-950/80 p-5 rounded-lg border border-zinc-900 space-y-4">
                        <div className="flex items-start gap-2.5">
                          <Award className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                          <div>
                            <h4 className="text-xs font-tactical font-bold text-zinc-300 uppercase tracking-wider">Cargo/patente vinculável</h4>
                            <p className="text-[10px] text-zinc-500 leading-relaxed mt-1">
                              Cargo e/ou patente que instrutores poderão vincular manualmente a alunos aprovados, na aba de aplicações. A aprovação por si só não vincula nada — é uma ação separada, feita individualmente para cada aluno. Se o aluno ainda não tiver conta, o vínculo fica pendente como pré-cadastro e é aplicado quando ele se registrar.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[11px] text-zinc-400 font-tactical uppercase tracking-wider font-semibold">Cargo</label>
                            <select
                              value={treinoCargoVinculavel}
                              onChange={(e) => {
                                setTreinoCargoVinculavel(e.target.value);
                                const matchingPatente = patentes.find(p => p.nome === e.target.value);
                                if (matchingPatente) {
                                  setTreinoPatenteVinculavelId(matchingPatente.id);
                                } else if (e.target.value === "") {
                                  setTreinoPatenteVinculavelId("");
                                }
                              }}
                              className="w-full bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 px-3.5 py-2.5 rounded focus:border-red-600 outline-none font-tactical"
                            >
                              <option value="">Nenhum</option>
                              {patentes.map(p => (
                                <option key={p.id} value={p.nome}>{p.nome}</option>
                              ))}
                              {patentes.length === 0 && (
                                <>
                                  <option value="Recruta">Recruta</option>
                                  <option value="Soldado">Soldado</option>
                                  <option value="Cabo">Cabo</option>
                                  <option value="Aspirante">Aspirante</option>
                                  <option value="Terceiro Sargento">Terceiro Sargento</option>
                                  <option value="Segundo Sargento">Segundo Sargento</option>
                                  <option value="Primeiro Sargento">Primeiro Sargento</option>
                                </>
                              )}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[11px] text-zinc-400 font-tactical uppercase tracking-wider font-semibold">Patente</label>
                            <select
                              value={treinoPatenteVinculavelId}
                              onChange={(e) => {
                                setTreinoPatenteVinculavelId(e.target.value);
                                const matchingPatente = patentes.find(p => p.id === e.target.value);
                                if (matchingPatente) {
                                  setTreinoCargoVinculavel(matchingPatente.nome);
                                } else if (e.target.value === "") {
                                  setTreinoCargoVinculavel("");
                                }
                              }}
                              className="w-full bg-zinc-950 border border-zinc-850 text-xs text-zinc-100 px-3.5 py-2.5 rounded focus:border-red-600 outline-none font-tactical"
                            >
                              <option value="">Nenhuma</option>
                              {patentes.map(p => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                              ))}
                              {patentes.length === 0 && (
                                <>
                                  <option value="recruta">Recruta</option>
                                  <option value="soldado">Soldado</option>
                                  <option value="cabo">Cabo</option>
                                  <option value="aspirante">Aspirante</option>
                                  <option value="sargento3">Terceiro Sargento</option>
                                  <option value="sargento2">Segundo Sargento</option>
                                  <option value="sargento1">Primeiro Sargento</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>

                        {/* SEÇÃO DE PERMISSÕES DO TREINAMENTO */}
                        <div className="p-4 bg-zinc-950 border border-zinc-850 rounded space-y-4 my-4">
                          <h4 className="text-xs font-tactical font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-red-500" />
                            <span>Permissões de Acesso e Operações do Treinamento</span>
                          </h4>

                          {/* 1. CARGOS QUE PODEM VER */}
                          <div className="space-y-2">
                            <label className="block text-[11px] text-zinc-400 font-tactical uppercase tracking-wider font-semibold">
                              👁️ Cargos com permissão para VISUALIZAR esta aula:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-2.5 bg-zinc-900/60 border border-zinc-800 rounded custom-scrollbar">
                              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={treinoCargosQuePodemVer.includes('todos')}
                                  onChange={(e) => {
                                    if (e.target.checked) setTreinoCargosQuePodemVer(['todos']);
                                    else setTreinoCargosQuePodemVer([]);
                                  }}
                                  className="accent-red-600 rounded"
                                />
                                <span className="font-bold text-amber-400">Todos os Cargos</span>
                              </label>
                              {cargosSite.map(c => (
                                <label key={c.id} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={treinoCargosQuePodemVer.includes(c.nome)}
                                    onChange={(e) => {
                                      let list = treinoCargosQuePodemVer.filter(x => x !== 'todos');
                                      if (e.target.checked) list.push(c.nome);
                                      else list = list.filter(x => x !== c.nome);
                                      if (list.length === 0) list = ['todos'];
                                      setTreinoCargosQuePodemVer(list);
                                    }}
                                    className="accent-red-600 rounded"
                                  />
                                  <span>{c.nome}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* 2. CARGOS QUE PODEM MINISTRAR / APLICAR */}
                          <div className="space-y-2">
                            <label className="block text-[11px] text-zinc-400 font-tactical uppercase tracking-wider font-semibold">
                              🎓 Cargos com permissão para MINISTRAR / APLICAR esta aula:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-2.5 bg-zinc-900/60 border border-zinc-800 rounded custom-scrollbar">
                              {cargosSite.map(c => (
                                <label key={c.id} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={treinoPermissoes.includes(c.nome)}
                                    onChange={(e) => {
                                      if (e.target.checked) setTreinoPermissoes([...treinoPermissoes, c.nome]);
                                      else setTreinoPermissoes(treinoPermissoes.filter(x => x !== c.nome));
                                    }}
                                    className="accent-red-600 rounded"
                                  />
                                  <span>{c.nome}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* 3. CARGOS QUE PODEM APROVAR / REPROVAR / REAVALIAR */}
                          <div className="space-y-2">
                            <label className="block text-[11px] text-zinc-400 font-tactical uppercase tracking-wider font-semibold">
                              ✅ Cargos com permissão para APROVAR, REPROVAR e REAVALIAR relatórios:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-2.5 bg-zinc-900/60 border border-zinc-800 rounded custom-scrollbar">
                              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={treinoPermissoesAvaliadores.includes('todos')}
                                  onChange={(e) => {
                                    if (e.target.checked) setTreinoPermissoesAvaliadores(['todos']);
                                    else setTreinoPermissoesAvaliadores([]);
                                  }}
                                  className="accent-red-600 rounded"
                                />
                                <span className="font-bold text-amber-400">Todos com Permissão Padrão</span>
                              </label>
                              {cargosSite.map(c => (
                                <label key={c.id} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={treinoPermissoesAvaliadores.includes(c.nome)}
                                    onChange={(e) => {
                                      let list = treinoPermissoesAvaliadores.filter(x => x !== 'todos');
                                      if (e.target.checked) list.push(c.nome);
                                      else list = list.filter(x => x !== c.nome);
                                      setTreinoPermissoesAvaliadores(list);
                                    }}
                                    className="accent-red-600 rounded"
                                  />
                                  <span>{c.nome}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-gradient-to-r from-red-950 via-red-800 to-red-950 text-white font-tactical font-semibold text-xs tracking-wider rounded hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>SALVAR TREINAMENTO</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEstaCriandoTreinamento(false);
                            setModoEdicaoTreinamento(false);
                            setTreinamentoSelecionado(null);
                          }}
                          className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 hover:text-zinc-200 text-xs font-tactical font-semibold tracking-wider rounded cursor-pointer transition-all"
                        >
                          CANCELAR
                        </button>
                      </div>
                    </form>
                  </div>
                ) : treinamentoSelecionado ? (
                  /* View 2: Detailed Training Screen (with tabs: Content, Applications, Permissions) */
                  <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 sm:p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setTreinamentoSelecionado(null)}
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 hover:text-zinc-200 rounded transition-all cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-tactical font-bold text-zinc-100 tracking-wider">
                              {treinamentoSelecionado.titulo}
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-tactical font-semibold uppercase tracking-wider ${
                              treinamentoSelecionado.status === 'publicada'
                                ? 'bg-green-950/20 text-green-500 border border-green-900/30'
                                : 'bg-amber-950/20 text-amber-500 border border-amber-900/30'
                            }`}>
                              {treinamentoSelecionado.status === 'publicada' ? 'Publicada' : 'Rascunho'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1 font-tactical">
                            {treinamentoSelecionado.descricao}
                          </p>
                        </div>
                      </div>

                      {permissoesUser.podeCriarTreinamentos && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEditarTreinamento(treinamentoSelecionado)}
                            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-200 text-xs font-tactical font-semibold rounded cursor-pointer transition-all flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5 text-zinc-500" />
                            <span>EDITAR</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Secondary Tabs */}
                    <div className="flex border-b border-zinc-900">
                      {(['conteudo', 'aplicacoes'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => {
                            setSubAbaAtiva(tab);
                            setMostrarFormAplicacao(false);
                          }}
                          className={`px-4 py-2 text-xs font-tactical uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                            subAbaAtiva === tab
                              ? 'border-red-600 text-zinc-100 font-semibold bg-zinc-900/10'
                              : 'border-transparent text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {tab === 'conteudo' ? 'Conteúdo' : 'Aplicações'}
                        </button>
                      ))}
                    </div>

                    {/* Sub Tab: Conteúdo */}
                    {subAbaAtiva === 'conteudo' && (
                      <div className="bg-zinc-950/40 border border-zinc-900/80 rounded-lg p-5 min-h-60 overflow-y-auto custom-scrollbar">
                        <div
                          className="prose prose-invert max-w-none text-zinc-350 text-xs"
                          dangerouslySetInnerHTML={{ __html: treinamentoSelecionado.conteudo }}
                        />
                      </div>
                    )}

                    {/* Sub Tab: Aplicações */}
                    {subAbaAtiva === 'aplicacoes' && (
                      <div className="space-y-6">
                        {appMsgSucesso && (
                          <div className="p-3 bg-green-950/25 border border-green-900 text-green-400 text-xs rounded font-tactical">
                            {appMsgSucesso}
                          </div>
                        )}

                        {!mostrarFormAplicacao ? (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-tactical text-zinc-500">Histórico de aulas ministradas para este treinamento</span>
                              {(() => {
                                const isMasterUser = ['admin', '78k', 'diretor_almeida', 'l.petrus', 'vokhan'].includes(policial.nick.toLowerCase()) || policial.cargo?.toLowerCase() === 'diretor';
                                const canApplyTreinamento = isMasterUser || (
                                  treinamentoSelecionado.permissoesCargos && treinamentoSelecionado.permissoesCargos.length > 0
                                    ? treinamentoSelecionado.permissoesCargos.includes(policial.cargo)
                                    : (permissoesUser.podeAvaliarAulas || permissoesUser.podeCriarTreinamentos || policial.cargo?.toLowerCase()?.includes('instrutor'))
                                );
                                return canApplyTreinamento;
                              })() && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMostrarFormAplicacao(true);
                                    setNovaAppAlunos([]);
                                    setNovaAppObs('');
                                    setBuscaAlunoNick('');
                                    setAppMsgErro('');
                                  }}
                                  className="px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-600/50 text-red-500 text-xs font-tactical font-semibold rounded cursor-pointer transition-all flex items-center gap-1.5"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>NOVA APLICAÇÃO</span>
                                </button>
                              )}
                            </div>

                            {/* Application list */}
                            <div className="space-y-4">
                              {aplicacoesTreinamentos.filter(app => app.treinamentoId === treinamentoSelecionado.id).length > 0 ? (
                                aplicacoesTreinamentos
                                  .filter(app => app.treinamentoId === treinamentoSelecionado.id)
                                  .map((app) => (
                                    <div key={app.id} className="bg-zinc-900/20 border border-zinc-900 rounded-lg p-4 space-y-3">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-950 pb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-zinc-400 font-tactical">Instrutor(a):</span>
                                          <span className="text-xs text-zinc-100 font-tactical font-bold">@{app.instrutor}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                                          <Calendar className="w-3 h-3" />
                                          <span>{app.data}</span>
                                        </div>
                                      </div>

                                      {/* Approval Status and Controls */}
                                      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded bg-zinc-950/30 border border-zinc-900/40 text-xs font-tactical">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Status da Aplicação:</span>
                                          {(!app.statusAprovacao || app.statusAprovacao === 'aprovado') && (
                                            <span className="px-2 py-0.5 rounded bg-green-950/20 text-green-400 border border-green-900/30 font-bold text-[9px] uppercase tracking-wide">
                                              ✓ Aprovado {app.avaliador && `por @${app.avaliador}`}
                                            </span>
                                          )}
                                          {app.statusAprovacao === 'reprovado' && (
                                            <span className="px-2 py-0.5 rounded bg-red-950/20 text-red-400 border border-red-900/30 font-bold text-[9px] uppercase tracking-wide">
                                              ✗ Reprovado {app.avaliador && `por @${app.avaliador}`}
                                            </span>
                                          )}
                                          {app.statusAprovacao === 'pendente' && (
                                            <span className="px-2 py-0.5 rounded bg-amber-950/20 text-amber-500 border border-amber-900/30 font-bold text-[9px] uppercase tracking-wide animate-pulse">
                                              ⏳ Aguardando Avaliação
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                          {app.statusAprovacao === 'pendente' && (
                                            <>
                                              {(() => {
                                                 const isMasterUser = ['admin', '78k', 'diretor_almeida', 'l.petrus', 'vokhan'].includes(policial.nick.toLowerCase()) || policial.cargo?.toLowerCase() === 'diretor';
                                                 const canEvaluateApp = isMasterUser || (
                                                   treinamentoSelecionado.permissoesAvaliadores && treinamentoSelecionado.permissoesAvaliadores.length > 0
                                                     ? treinamentoSelecionado.permissoesAvaliadores.includes(policial.cargo)
                                                     : (permissoesUser.podeAvaliarAulas || permissoesUser.podeCriarTreinamentos)
                                                 );
                                                 return canEvaluateApp;
                                               })() ? (
                                                <>
                                                  <button
                                                    type="button"
                                                    onClick={() => lidarComAprovarAplicacao(app.id)}
                                                    className="px-2.5 py-1 bg-green-900/30 hover:bg-green-900/60 border border-green-800 text-green-400 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center gap-1"
                                                  >
                                                    <Check className="w-3 h-3" />
                                                    <span>APROVAR</span>
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={async () => {
                                                      const mot = await pedirPrompt('Por favor, informe o motivo da reprovação desta aula:', '', 'Informe o motivo...');
                                                      if (mot !== null && mot.trim() !== '') {
                                                        lidarComReprovarAplicacao(app.id, mot);
                                                      }
                                                    }}
                                                    className="px-2.5 py-1 bg-red-900/30 hover:bg-red-900/60 border border-red-800 text-red-400 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center gap-1"
                                                  >
                                                    <X className="w-3 h-3" />
                                                    <span>REPROVAR</span>
                                                  </button>
                                                </>
                                              ) : (
                                                <span className="text-[10px] text-zinc-500 italic">Apenas patentes habilitadas no RBAC podem avaliar.</span>
                                              )}
                                            </>
                                          )}

                                          {app.statusAprovacao !== 'pendente' && permissoesUser.podeReavaliarTreinamento && (
                                            <button
                                              type="button"
                                              onClick={() => lidarComReavaliarAplicacao(app.id)}
                                              className="px-2.5 py-1 bg-amber-950/40 hover:bg-amber-900/30 border border-amber-800 text-amber-500 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center gap-1"
                                              title="Reabrir log de treinamento para reavaliação"
                                            >
                                              <RefreshCw className="w-3 h-3 animate-spin-hover" />
                                              <span>REAVALIAR</span>
                                            </button>
                                          )}

                                          {permissoesUser.podeExcluirLogsTreinamento && (
                                            <button
                                              type="button"
                                              onClick={() => lidarComExcluirAplicacao(app.id)}
                                              className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/30 border border-red-800 text-red-500 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center gap-1"
                                              title="Excluir este log definitivamente"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                              <span>EXCLUIR</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {app.statusAprovacao === 'reprovado' && app.motivoAvaliacao && (
                                        <div className="text-[10px] text-red-400 bg-red-950/10 p-2.5 rounded border border-red-950/20 italic">
                                          <span className="font-semibold not-italic block text-[9px] text-red-500 uppercase tracking-wider mb-0.5">Motivo da Reprovação:</span>
                                          {app.motivoAvaliacao}
                                        </div>
                                      )}

                                      <div className="space-y-2">
                                        <span className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Alunos & Resultados:</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          {app.alunos.map((al) => {
                                            const alunoLower = al.nick.toLowerCase().trim();
                                            const cadastrado = !!policiais[alunoLower];
                                            return (
                                              <div key={al.nick} className="bg-zinc-950/40 p-2.5 rounded border border-zinc-900/50 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                  <div className="w-6 h-6 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center overflow-hidden shrink-0">
                                                    <img
                                                      src={obterAvatarUrl(policiais[alunoLower], 's', al.nick)}
                                                      alt={al.nick}
                                                      referrerPolicy="no-referrer"
                                                      className="scale-125 translate-y-1.5"
                                                    />
                                                  </div>
                                                  <div className="min-w-0">
                                                    <span className="text-xs text-zinc-200 font-medium font-tactical block truncate">@{al.nick}</span>
                                                    {!cadastrado && (
                                                      <span className="text-[8px] text-amber-500 font-tactical uppercase tracking-wide block leading-none">Pré-Cadastro Pendente</span>
                                                    )}
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                  <span className={`px-2 py-0.5 rounded text-[8px] font-tactical font-bold uppercase tracking-wider ${
                                                    al.status === 'aprovado'
                                                      ? 'bg-green-950/20 text-green-500 border border-green-900/30'
                                                      : 'bg-red-950/20 text-red-500 border border-red-900/30'
                                                  }`}>
                                                    {al.status}
                                                  </span>

                                                  {treinamentoSelecionado.cargoVinculavel && al.status === 'aprovado' && (!app.statusAprovacao || app.statusAprovacao === 'aprovado') && (
                                                    al.vinculado ? (
                                                      <span className="text-[9px] text-green-600 font-tactical font-medium">✓ Vinculado</span>
                                                    ) : (
                                                      <button
                                                        type="button"
                                                        onClick={() => lidarComVincularCargoAluno(app.id, al.nick)}
                                                        className="px-2 py-0.5 bg-red-950/10 hover:bg-red-950/30 border border-red-950/30 hover:border-red-900/50 text-red-500 text-[9px] font-tactical font-semibold rounded cursor-pointer transition-all"
                                                        title={`Promover para ${treinamentoSelecionado.cargoVinculavel}`}
                                                      >
                                                        Vincular {treinamentoSelecionado.cargoVinculavel}
                                                      </button>
                                                    )
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {app.observacoes && (
                                        <div className="text-[11px] text-zinc-400 bg-zinc-950/30 p-2 rounded border border-zinc-950 italic">
                                          <span className="font-semibold not-italic block text-[9px] text-zinc-500 uppercase font-tactical tracking-wider mb-0.5">Observações:</span>
                                          {app.observacoes}
                                        </div>
                                      )}
                                    </div>
                                  ))
                              ) : (
                                <div className="bg-zinc-950/30 border border-zinc-900 rounded-lg p-10 text-center space-y-2">
                                  <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
                                  <p className="text-zinc-500 text-xs font-tactical">Nenhuma aplicação registrada para este treinamento ainda.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Nova Aplicação Form */
                          <form onSubmit={lidarComSalvarAplicacao} className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-5 space-y-5">
                            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                              <h4 className="text-xs font-tactical font-bold text-zinc-100 uppercase tracking-wider">REGISTRAR NOVA TURMA / APLICAÇÃO</h4>
                              <button
                                type="button"
                                onClick={() => setMostrarFormAplicacao(false)}
                                className="text-xs text-zinc-500 hover:text-zinc-300 font-tactical uppercase"
                              >
                                Cancelar
                              </button>
                            </div>

                            {appMsgErro && (
                              <div className="p-3 bg-red-950/20 border border-red-900 text-red-500 text-xs rounded font-tactical">
                                {appMsgErro}
                              </div>
                            )}

                            <div>
                              <label className="block text-[10px] text-zinc-500 font-tactical mb-1 uppercase tracking-wider">INSTRUTOR(A)</label>
                              <input
                                type="text"
                                readOnly
                                value={'@' + policial.nick}
                                className="w-full bg-zinc-900/20 border border-zinc-900 text-xs text-zinc-400 px-3 py-2 rounded focus:outline-none cursor-not-allowed font-tactical"
                              />
                            </div>

                            {/* Student Search and Addition */}
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] text-zinc-500 font-tactical mb-1 uppercase tracking-wider">ADICIONAR MILITAR / ALUNO</label>
                                <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <input
                                      type="text"
                                      value={buscaAlunoNick}
                                      onChange={(e) => setBuscaAlunoNick(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarAlunoAplicacao())}
                                      placeholder="Ex: Soldado_Muller"
                                      className="w-full bg-zinc-900/30 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 pl-8 rounded focus:border-red-600 outline-none font-tactical"
                                    />
                                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={adicionarAlunoAplicacao}
                                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-200 text-xs font-tactical font-semibold tracking-wider rounded cursor-pointer transition-all"
                                  >
                                    ADICIONAR
                                  </button>
                                </div>
                              </div>

                              {/* Student List */}
                              <div className="space-y-2">
                                <span className="text-[9px] text-zinc-500 font-tactical uppercase tracking-wider block">Lista de Alunos da Turma ({novaAppAlunos.length})</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                  {novaAppAlunos.map((al) => (
                                    <div key={al.nick} className="bg-zinc-900/20 border border-zinc-900 p-2 rounded flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center overflow-hidden shrink-0">
                                          <img
                                            src={obterAvatarUrl(policiais[al.nick.toLowerCase().trim()], 's', al.nick)}
                                            alt={al.nick}
                                            referrerPolicy="no-referrer"
                                            className="scale-125 translate-y-1.5"
                                          />
                                        </div>
                                        <span className="text-xs text-zinc-200 font-medium font-tactical truncate">@{al.nick}</span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => alternarStatusAlunoApp(al.nick)}
                                          className={`px-2 py-1 rounded text-[9px] font-tactical font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                            al.status === 'aprovado'
                                              ? 'bg-green-950/20 text-green-500 border border-green-900/30 hover:bg-green-950/40'
                                              : 'bg-red-950/20 text-red-500 border border-red-900/30 hover:bg-red-950/40'
                                          }`}
                                        >
                                          {al.status === 'aprovado' ? 'APROVAR' : 'REPROVAR'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => removerAlunoAplicacao(al.nick)}
                                          className="text-zinc-500 hover:text-zinc-300 p-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}

                                  {novaAppAlunos.length === 0 && (
                                    <div className="col-span-full py-6 text-center bg-zinc-900/5 rounded border border-zinc-900">
                                      <p className="text-zinc-650 text-xs font-tactical italic">Adicione alunos à turma digitando o nick deles acima.</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] text-zinc-500 font-tactical mb-1 uppercase tracking-wider">OBSERVAÇÕES E NOTAS DA TURMA</label>
                              <textarea
                                rows={3}
                                value={novaAppObs}
                                onChange={(e) => setNovaAppObs(e.target.value)}
                                placeholder="Insira o resumo da turma, dificuldades ou observações importantes sobre os alunos..."
                                className="w-full bg-zinc-900/30 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 rounded focus:border-red-600 outline-none font-tactical"
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full py-2.5 bg-gradient-to-r from-red-950 via-red-800 to-red-950 text-white font-tactical font-semibold text-xs tracking-wider rounded hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>SALVAR HISTÓRICO DE TURMA</span>
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* View 3: Training Dashboard Overview */
                  <div className="space-y-6">
                    {/* Header Banner */}
                    <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                      <div className="space-y-1">
                        <h3 className="text-base font-tactical font-bold text-zinc-100 tracking-wider flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-red-500" />
                          AULAS E TREINAMENTOS MILITARES
                        </h3>
                        <p className="text-xs text-zinc-400 font-tactical leading-relaxed">
                          Crie treinamentos, gerencie permissões e aplique aulas com aprovação/reprovação de alunos.
                        </p>
                      </div>

                      {permissoesUser.podeCriarTreinamentos && (
                        <button
                          type="button"
                          onClick={abrirCriarTreinamento}
                          className="px-4 py-2.5 bg-gradient-to-r from-red-950 via-red-800 to-red-950 text-white font-tactical font-bold text-xs tracking-wider rounded hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start md:self-auto shadow-[0_3px_10px_rgba(239,68,68,0.1)]"
                        >
                          <Plus className="w-4 h-4" />
                          <span>NOVO TREINAMENTO</span>
                        </button>
                      )}
                    </div>

                    {/* Navigation Filter Buttons */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFiltroAbaAulas('aulas')}
                        className={`px-4 py-2 text-xs font-tactical font-bold rounded-md tracking-wider transition-all cursor-pointer ${
                          filtroAbaAulas === 'aulas'
                            ? 'bg-zinc-100 text-zinc-950 font-semibold'
                            : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-250 border border-zinc-900'
                        }`}
                      >
                        AULAS
                      </button>
                      <button
                        type="button"
                        onClick={() => setFiltroAbaAulas('todas_aplicacoes')}
                        className={`px-4 py-2 text-xs font-tactical font-bold rounded-md tracking-wider transition-all cursor-pointer ${
                          filtroAbaAulas === 'todas_aplicacoes'
                            ? 'bg-zinc-100 text-zinc-950 font-semibold'
                            : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-250 border border-zinc-900'
                        }`}
                      >
                        TODAS AS APLICAÇÕES
                      </button>
                    </div>

                    {filtroAbaAulas === 'aulas' ? (
                      /* Grid of Training Cards */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {treinamentos.map((t) => {
                          const apps = aplicacoesTreinamentos.filter(a => a.treinamentoId === t.id);
                          const totalAlunos = apps.reduce((acc, current) => acc + current.alunos.length, 0);
                          const aprovados = apps.reduce((acc, current) => acc + current.alunos.filter(al => al.status === 'aprovado').length, 0);
                          const reprovados = apps.reduce((acc, current) => acc + current.alunos.filter(al => al.status === 'reprovado').length, 0);

                          return (
                            <div key={t.id} className="bg-zinc-950/40 border border-zinc-900/80 rounded-lg p-5 flex flex-col justify-between hover:border-zinc-800 transition-all gap-4">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-xs font-tactical font-bold text-zinc-100 leading-snug tracking-wider hover:text-red-500 transition-all cursor-pointer" onClick={() => { setTreinamentoSelecionado(t); setSubAbaAtiva('conteudo'); }}>
                                    {t.titulo}
                                  </h4>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-tactical font-semibold uppercase shrink-0 ${
                                    t.status === 'publicada'
                                      ? 'bg-green-950/20 text-green-500 border border-green-900/30'
                                      : 'bg-amber-950/20 text-amber-500 border border-amber-900/30'
                                  }`}>
                                    {t.status === 'publicada' ? 'Publicada' : 'Rascunho'}
                                  </span>
                                </div>

                                <p className="text-[11px] text-zinc-400 font-tactical line-clamp-2 leading-relaxed">
                                  {t.descricao || 'Nenhuma descrição curta disponível para este treinamento.'}
                                </p>

                                {t.cargoVinculavel && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/10 border border-red-950/20 text-red-500 text-[10px] font-tactical uppercase">
                                    <span>Recompensa:</span>
                                    <span className="font-bold">{t.cargoVinculavel}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-3 border-t border-zinc-900/60 pt-3">
                                <div className="flex gap-4 text-[10px] text-zinc-500 font-mono">
                                  <div>
                                    <span className="text-zinc-100 font-bold block">{apps.length}</span>
                                    <span>Aplicações</span>
                                  </div>
                                  <div>
                                    <span className="text-green-500 font-bold block">{aprovados}</span>
                                    <span>Aprovados</span>
                                  </div>
                                  <div>
                                    <span className="text-red-500 font-bold block">{reprovados}</span>
                                    <span>Reprovados</span>
                                  </div>
                                </div>

                                <div className="flex gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => { setTreinamentoSelecionado(t); setSubAbaAtiva('conteudo'); }}
                                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 text-[10px] font-tactical font-semibold rounded cursor-pointer transition-all flex items-center gap-1"
                                    title="Abrir detalhes"
                                  >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>ABRIR</span>
                                  </button>
                                  {permissoesUser.podeCriarTreinamentos && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => abrirEditarTreinamento(t)}
                                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer transition-all"
                                        title="Editar"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => lidarComExcluirTreinamento(t.id)}
                                        className="p-1.5 bg-red-950/10 hover:bg-red-950/30 border border-red-950/20 hover:border-red-900/50 text-red-500/80 hover:text-red-400 rounded cursor-pointer transition-all"
                                        title="Excluir"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {treinamentos.length === 0 && (
                          <div className="col-span-full bg-zinc-950/30 border border-zinc-900 rounded-lg p-12 text-center space-y-3">
                            <GraduationCap className="w-10 h-10 text-zinc-650 mx-auto" />
                            <div>
                              <p className="text-zinc-400 text-xs font-tactical font-bold">NENHUM TREINAMENTO DISPONÍVEL</p>
                              <p className="text-zinc-600 text-[11px] mt-1 font-tactical">Crie o primeiro treinamento no botão "+ Novo Treinamento" acima.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Global Application History across all trainings */
                      <div className="space-y-4">
                        {aplicacoesTreinamentos.length > 0 ? (
                          aplicacoesTreinamentos.map((app) => {
                            const t = treinamentos.find(item => item.id === app.treinamentoId);
                            return (
                              <div key={app.id} className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-4 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900/60 pb-2">
                                  <div>
                                    <span className="text-xs text-zinc-100 font-tactical font-bold block">{app.treinamentoTitulo || (t ? t.titulo : 'Treinamento Excluído')}</span>
                                    <span className="text-[10px] text-zinc-400 font-tactical">Instrutor(a): @{app.instrutor}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                                    <Calendar className="w-3 h-3" />
                                    <span>{app.data}</span>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <span className="text-[9px] text-zinc-500 font-tactical uppercase tracking-wider block">Lista de Alunos:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {app.alunos.map((al) => (
                                      <span
                                        key={al.nick}
                                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-tactical font-semibold border ${
                                          al.status === 'aprovado'
                                            ? 'bg-green-950/15 border-green-900/40 text-green-500'
                                            : 'bg-red-950/15 border-red-900/40 text-red-500'
                                        }`}
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                        <span>@{al.nick} ({al.status})</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded bg-zinc-950/30 border border-zinc-900/40 text-xs font-tactical">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Status da Aplicação:</span>
                                    {(!app.statusAprovacao || app.statusAprovacao === 'aprovado') && (
                                      <span className="px-2 py-0.5 rounded bg-green-950/20 text-green-400 border border-green-900/30 font-bold text-[9px] uppercase tracking-wide">
                                        ✓ Aprovado {app.avaliador && `por @${app.avaliador}`}
                                      </span>
                                    )}
                                    {app.statusAprovacao === 'reprovado' && (
                                      <span className="px-2 py-0.5 rounded bg-red-950/20 text-red-400 border border-red-900/30 font-bold text-[9px] uppercase tracking-wide">
                                        ✗ Reprovado {app.avaliador && `por @${app.avaliador}`}
                                      </span>
                                    )}
                                    {app.statusAprovacao === 'pendente' && (
                                      <span className="px-2 py-0.5 rounded bg-amber-950/20 text-amber-500 border border-amber-900/30 font-bold text-[9px] uppercase tracking-wide animate-pulse">
                                        ⏳ Aguardando Avaliação
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {app.statusAprovacao === 'pendente' && (
                                      <>
                                        {(() => {
                                           const isMasterUser = ['admin', '78k', 'diretor_almeida', 'l.petrus', 'vokhan'].includes(policial.nick.toLowerCase()) || policial.cargo?.toLowerCase() === 'diretor';
                                           const canEvaluateApp = isMasterUser || (
                                             t && t.permissoesAvaliadores && t.permissoesAvaliadores.length > 0
                                               ? t.permissoesAvaliadores.includes(policial.cargo)
                                               : (permissoesUser.podeAvaliarAulas || permissoesUser.podeCriarTreinamentos)
                                           );
                                           return canEvaluateApp;
                                         })() ? (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => lidarComAprovarAplicacao(app.id)}
                                              className="px-2.5 py-1 bg-green-900/30 hover:bg-green-900/60 border border-green-800 text-green-400 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center gap-1"
                                            >
                                              <Check className="w-3 h-3" />
                                              <span>APROVAR</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={async () => {
                                                const mot = await pedirPrompt('Por favor, informe o motivo da reprovação desta aula:', '', 'Informe o motivo...');
                                                if (mot !== null && mot.trim() !== '') {
                                                  lidarComReprovarAplicacao(app.id, mot);
                                                }
                                              }}
                                              className="px-2.5 py-1 bg-red-900/30 hover:bg-red-900/60 border border-red-800 text-red-400 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center gap-1"
                                            >
                                              <X className="w-3 h-3" />
                                              <span>REPROVAR</span>
                                            </button>
                                          </>
                                        ) : (
                                          <span className="text-[10px] text-zinc-500 italic">Apenas patentes habilitadas no RBAC podem avaliar.</span>
                                        )}
                                      </>
                                    )}

                                    {app.statusAprovacao !== 'pendente' && permissoesUser.podeReavaliarTreinamento && (
                                      <button
                                        type="button"
                                        onClick={() => lidarComReavaliarAplicacao(app.id)}
                                        className="px-2.5 py-1 bg-amber-950/40 hover:bg-amber-900/30 border border-amber-800 text-amber-500 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center gap-1"
                                        title="Reabrir log de treinamento para reavaliação"
                                      >
                                        <RefreshCw className="w-3 h-3 animate-spin-hover" />
                                        <span>REAVALIAR</span>
                                      </button>
                                    )}

                                    {permissoesUser.podeExcluirLogsTreinamento && (
                                      <button
                                        type="button"
                                        onClick={() => lidarComExcluirAplicacao(app.id)}
                                        className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/30 border border-red-800 text-red-500 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center gap-1"
                                        title="Excluir este log definitivamente"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>EXCLUIR</span>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {app.statusAprovacao === 'reprovado' && app.motivoAvaliacao && (
                                  <div className="text-[10px] text-red-400 bg-red-950/10 p-2.5 rounded border border-red-950/20 italic">
                                    <span className="font-semibold not-italic block text-[9px] text-red-500 uppercase tracking-wider mb-0.5">Motivo da Reprovação:</span>
                                    {app.motivoAvaliacao}
                                  </div>
                                )}

                                {app.observacoes && (
                                  <div className="text-[11px] text-zinc-400 bg-zinc-950/20 p-2 rounded border border-zinc-900 italic font-tactical">
                                    {app.observacoes}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="bg-zinc-950/30 border border-zinc-900 rounded-lg p-12 text-center space-y-3">
                            <BookOpen className="w-10 h-10 text-zinc-650 mx-auto" />
                            <p className="text-zinc-500 text-xs font-tactical">Histórico de turmas vazio. Nenhuma aula aplicada ainda.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: ADVERTENCIAS */}
            {abaAtiva === 'advertencias' && permissoesUser.abasAcessiveis.includes('advertencias') && (
              <motion.div
                key="advertencias"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Header Card */}
                <div className="bg-zinc-950/60 border border-red-900/40 rounded-lg p-5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-600 via-red-400 to-red-600" />
                  <div className="space-y-1">
                    <h3 className="text-base font-tactical font-bold text-red-500 tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                      SETOR ADMINISTRATIVO: ADVERTÊNCIAS DE MILITARES
                    </h3>
                    <p className="text-xs text-zinc-400 font-tactical leading-relaxed">
                      Aplicação de penalidades disciplinares, prazos de vigência e controle de ficha militar.
                    </p>
                  </div>
                </div>

                {/* Alerts */}
                {msgAdvSucesso && (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-900 rounded-lg flex items-center gap-3 text-emerald-400 text-xs font-sans">
                    <CheckCircle className="w-5 h-5 shrink-0 animate-bounce" />
                    <span>{msgAdvSucesso}</span>
                  </div>
                )}
                {msgAdvErro && (
                  <div className="p-4 bg-red-950/20 border border-red-900 rounded-lg flex items-center gap-3 text-red-400 text-xs font-sans">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{msgAdvErro}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left Column: Form */}
                  <form onSubmit={lidarComSalvarAdvertencia} className="lg:col-span-2 bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-4 h-fit">
                    <h4 className="text-xs font-tactical font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2">
                      Aplicar Nova Advertência
                    </h4>

                    {/* Autocomplete Selector */}
                    <div className="space-y-1 relative">
                      <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Militar Advertido</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Pesquise pelo nick..."
                          value={buscaAdvUsuario}
                          onChange={(e) => {
                            setBuscaAdvUsuario(e.target.value);
                            setAdvPolicialNick('');
                          }}
                          className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2.5 pl-9 rounded focus:border-red-600 outline-none transition-all font-tactical"
                        />
                        <Search className="w-3.5 h-3.5 text-zinc-600 absolute left-3 top-3" />
                      </div>

                      {/* Dropdown list */}
                      {buscaAdvUsuario.trim() && !advPolicialNick && (
                        <div className="absolute left-0 right-0 mt-1 bg-zinc-950 border border-zinc-900 rounded shadow-2xl max-h-48 overflow-y-auto z-50 divide-y divide-zinc-900/60">
                          {listaPoliciais
                            .filter(p => p.nick.toLowerCase().includes(buscaAdvUsuario.toLowerCase()))
                            .map(p => (
                              <button
                                key={p.nick}
                                type="button"
                                onClick={() => {
                                  setAdvPolicialNick(p.nick);
                                  setBuscaAdvUsuario(p.nick);
                                }}
                                className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-zinc-900/50 transition-all text-left text-xs cursor-pointer"
                              >
                                <div className="w-6 h-6 rounded-full bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center border border-zinc-800">
                                  <img
                                    src={obterAvatarUrl(p, 'head')}
                                    alt=""
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div>
                                  <span className="text-zinc-200 font-bold block">@{p.nick}</span>
                                  <span className="text-zinc-500 text-[9px] uppercase tracking-wider">{p.cargo}</span>
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Quantity of Warnings */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Quantidade de Advertências</label>
                      <select
                        value={advQuantidade}
                        onChange={(e) => setAdvQuantidade(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2.5 rounded focus:border-red-600 outline-none transition-all font-tactical"
                      >
                        <option value={1}>1 Advertência</option>
                        <option value={2}>2 Advertências</option>
                        <option value={3}>3 Advertências (Grave)</option>
                      </select>
                    </div>

                    {/* Expiry Period */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Prazo de Validade / Vencimento</label>
                      <input
                        type="text"
                        value={advPrazo}
                        onChange={(e) => setAdvPrazo(e.target.value)}
                        placeholder="Ex: 30 dias, 15 dias, 60 dias"
                        className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2.5 rounded focus:border-red-600 outline-none transition-all font-tactical"
                        required
                      />
                    </div>

                    {/* Motivo */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Motivo Detalhado</label>
                      <textarea
                        value={advMotivo}
                        onChange={(e) => setAdvMotivo(e.target.value)}
                        placeholder="Descreva a infração cometida pelo militar..."
                        rows={3}
                        className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2.5 rounded focus:border-red-600 outline-none transition-all font-tactical"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-red-950 via-red-900 to-red-950 border border-red-700/30 rounded text-white font-tactical font-bold text-xs tracking-widest uppercase hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      REGISTRAR ADVERTÊNCIA
                    </button>
                  </form>

                  {/* Right Column: Warning List Logs */}
                  <div className="lg:col-span-3 bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-4">
                    <h4 className="text-xs font-tactical font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2 flex items-center justify-between">
                      <span>Últimos Acontecimentos (Logs)</span>
                      <span className="text-[9px] text-zinc-500 font-mono font-normal">TOTAL: {advertencias.length}</span>
                    </h4>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {advertencias.map((adv) => (
                        <div key={adv.id} className="bg-zinc-950/90 border border-zinc-900 p-4 rounded-lg space-y-3 relative overflow-hidden">
                          {/* Top row */}
                          <div className="flex justify-between items-start gap-2 border-b border-zinc-900 pb-2">
                            <div>
                              <span className="text-xs font-bold text-zinc-100 block">
                                @{adv.nickPolicial}
                              </span>
                              <span className="text-[9px] text-zinc-500 uppercase tracking-widest">
                                Aplicada por: @{adv.autor} • {adv.data}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Warning quantity badge */}
                              <span className="px-2 py-0.5 rounded bg-red-950/20 border border-red-900/30 text-red-400 text-[10px] font-bold">
                                {adv.quantidade}x Adv
                              </span>

                              {/* Expiry date/period */}
                              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-zinc-400 text-[10px] font-mono">
                                Validade: {adv.prazoVencimento}
                              </span>

                              {/* Active Status Toggle */}
                              <button
                                type="button"
                                onClick={() => lidarComAlternarAdvertencia(adv)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                                  adv.ativa
                                    ? 'bg-red-950/10 border-red-900/40 text-red-500'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-650'
                                }`}
                              >
                                {adv.ativa ? 'Ativa' : 'Arquivada'}
                              </button>
                            </div>
                          </div>

                          {/* Reason */}
                          <p className="text-xs text-zinc-400 leading-relaxed font-tactical bg-zinc-950/40 p-2.5 rounded border border-zinc-900/60 italic">
                            "{adv.motivo}"
                          </p>

                          {/* Delete button */}
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => lidarComExcluirAdvertencia(adv.id)}
                              className="p-1 hover:bg-red-950/20 rounded border border-transparent hover:border-red-900/30 text-zinc-600 hover:text-red-400 transition-all cursor-pointer"
                              title="Excluir do histórico militar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {advertencias.length === 0 && (
                        <div className="p-12 text-center border border-zinc-900 border-dashed rounded-lg space-y-2">
                          <AlertTriangle className="w-8 h-8 text-zinc-750 mx-auto" />
                          <p className="text-xs text-zinc-500 uppercase tracking-wider font-tactical">Nenhuma advertência aplicada no histórico.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: EXONERAR */}
            {abaAtiva === 'exonerar' && permissoesUser.abasAcessiveis.includes('exonerar') && (
              <motion.div
                key="exonerar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Header Card */}
                <div className="bg-zinc-950/60 border border-red-900/40 rounded-lg p-5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-700 via-red-500 to-red-700" />
                  <div className="space-y-1">
                    <h3 className="text-base font-tactical font-bold text-red-500 tracking-wider flex items-center gap-2">
                      <LogOut className="w-5 h-5 animate-pulse" />
                      SETOR ADMINISTRATIVO: EXONERAÇÃO & DEMISSÃO DE COPS
                    </h3>
                    <p className="text-xs text-zinc-400 font-tactical leading-relaxed">
                      Desligamento formal de integrantes da corporação, exonerações voluntárias ou demissões punitivas irreversíveis.
                    </p>
                  </div>
                </div>

                {/* Alerts */}
                {msgExoSucesso && (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-900 rounded-lg flex items-center gap-3 text-emerald-400 text-xs font-sans">
                    <CheckCircle className="w-5 h-5 shrink-0 animate-bounce" />
                    <span>{msgExoSucesso}</span>
                  </div>
                )}
                {msgExoErro && (
                  <div className="p-4 bg-red-950/20 border border-red-900 rounded-lg flex items-center gap-3 text-red-400 text-xs font-sans">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{msgExoErro}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left Column: Form */}
                  <form onSubmit={lidarComSalvarExoneracaoForm} className="lg:col-span-2 bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-4 h-fit">
                    <h4 className="text-xs font-tactical font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2">
                      Desligar Integrante
                    </h4>

                    {/* Autocomplete Selector */}
                    <div className="space-y-1 relative">
                      <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Militar para Desligar</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Pesquise pelo nick..."
                          value={buscaExoUsuario}
                          onChange={(e) => {
                            setBuscaExoUsuario(e.target.value);
                            setExoPolicialNick('');
                          }}
                          className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2.5 pl-9 rounded focus:border-red-600 outline-none transition-all font-tactical"
                        />
                        <Search className="w-3.5 h-3.5 text-zinc-600 absolute left-3 top-3" />
                      </div>

                      {/* Dropdown list */}
                      {buscaExoUsuario.trim() && !exoPolicialNick && (
                        <div className="absolute left-0 right-0 mt-1 bg-zinc-950 border border-zinc-900 rounded shadow-2xl max-h-48 overflow-y-auto z-50 divide-y divide-zinc-900/60">
                          {listaPoliciais
                            .filter(p => p.nick.toLowerCase().includes(buscaExoUsuario.toLowerCase()))
                            .map(p => (
                              <button
                                key={p.nick}
                                type="button"
                                onClick={() => {
                                  setExoPolicialNick(p.nick);
                                  setBuscaExoUsuario(p.nick);
                                }}
                                className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-zinc-900/50 transition-all text-left text-xs cursor-pointer"
                              >
                                <div className="w-6 h-6 rounded-full bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center border border-zinc-800">
                                  <img
                                    src={obterAvatarUrl(p, 'head')}
                                    alt=""
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div>
                                  <span className="text-zinc-200 font-bold block">@{p.nick}</span>
                                  <span className="text-zinc-500 text-[9px] uppercase tracking-wider">{p.cargo}</span>
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Type of separation */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Tipo de Desligamento</label>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setExoTipo('exoneracao')}
                          className={`py-2.5 px-3 rounded text-[11px] font-tactical font-bold uppercase transition-all cursor-pointer border text-center ${
                            exoTipo === 'exoneracao'
                              ? 'bg-amber-950/20 border-amber-800 text-amber-500'
                              : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          Exoneração
                        </button>
                        <button
                          type="button"
                          onClick={() => setExoTipo('demissao')}
                          className={`py-2.5 px-3 rounded text-[11px] font-tactical font-bold uppercase transition-all cursor-pointer border text-center ${
                            exoTipo === 'demissao'
                              ? 'bg-red-950/20 border-red-900 text-red-500'
                              : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          Demissão
                        </button>
                      </div>
                    </div>

                    {/* Motivo */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Justificativa / Motivo</label>
                      <textarea
                        value={exoMotivo}
                        onChange={(e) => setExoMotivo(e.target.value)}
                        placeholder="Informe a razão do desligamento do militar..."
                        rows={3}
                        className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2.5 rounded focus:border-red-600 outline-none transition-all font-tactical"
                        required
                      />
                    </div>

                    {/* Confirmation box warning */}
                    <div className="p-3 bg-red-950/20 border border-red-950 rounded text-[10px] text-red-400 leading-normal flex gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 animate-bounce" />
                      <span>
                        <strong>ATENÇÃO:</strong> Esta ação removerá o militar da corporação imediatamente e de forma irreversível.
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-red-950 via-red-900 to-red-950 border border-red-700/30 rounded text-white font-tactical font-bold text-xs tracking-widest uppercase hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      REMOVER INTEGRANTE DA CORPORAÇÃO
                    </button>
                  </form>

                  {/* Right Column: Exoneration List Logs */}
                  <div className="lg:col-span-3 bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-4">
                    <h4 className="text-xs font-tactical font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2 flex items-center justify-between">
                      <span>Últimos Acontecimentos (Logs)</span>
                      <span className="text-[9px] text-zinc-500 font-mono font-normal">TOTAL: {exoneracoes.length}</span>
                    </h4>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {exoneracoes.map((exo) => (
                        <div key={exo.id} className="bg-zinc-950/90 border border-zinc-900 p-4 rounded-lg space-y-3 relative overflow-hidden">
                          {/* Top row */}
                          <div className="flex justify-between items-start gap-2 border-b border-zinc-900 pb-2">
                            <div>
                              <span className="text-xs font-bold text-zinc-100 block">
                                @{exo.nickPolicial}
                              </span>
                              <span className="text-[9px] text-zinc-500 uppercase tracking-widest">
                                Efetuado por: @{exo.autor} • {exo.data}
                              </span>
                            </div>

                            <div>
                              <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                exo.tipo === 'exoneracao'
                                  ? 'bg-amber-950/20 border-amber-900/40 text-amber-500'
                                  : 'bg-red-950/20 border-red-900/40 text-red-500'
                              }`}>
                                {exo.tipo === 'exoneracao' ? 'Exoneração' : 'Demissão'}
                              </span>
                            </div>
                          </div>

                          {/* Reason */}
                          <p className="text-xs text-zinc-400 leading-relaxed font-tactical bg-zinc-950/40 p-2.5 rounded border border-zinc-900/60 italic">
                            "{exo.motivo}"
                          </p>
                        </div>
                      ))}

                      {exoneracoes.length === 0 && (
                        <div className="p-12 text-center border border-zinc-900 border-dashed rounded-lg space-y-2">
                          <LogOut className="w-8 h-8 text-zinc-750 mx-auto" />
                          <p className="text-xs text-zinc-500 uppercase tracking-wider font-tactical">Nenhum desligamento no histórico.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: ACEITAR NOVOS MEMBROS */}
            {abaAtiva === 'aceitar_membros' && permissoesUser.abasAcessiveis.includes('aceitar_membros') && (
              <motion.div
                key="aceitar_membros"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Header Card */}
                <div className="bg-zinc-950/60 border border-emerald-900/40 rounded-lg p-5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-700" />
                  <div className="space-y-1">
                    <h3 className="text-base font-tactical font-bold text-emerald-500 tracking-wider flex items-center gap-2">
                      <UserPlus className="w-5 h-5 animate-pulse" />
                      SETOR ADMINISTRATIVO: ACEITAÇÃO DE NOVOS POLICIAIS
                    </h3>
                    <p className="text-xs text-zinc-400 font-tactical leading-relaxed">
                      Gerencie e aprove solicitações de alistamento pendentes de novos usuários para integrá-los como Soldados da Polícia CIA.
                    </p>
                  </div>
                </div>

                {/* Status Messages */}
                {msgAceitacaoSucesso && (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-900 rounded-lg flex items-center gap-3 text-emerald-400 text-xs font-sans">
                    <CheckCircle className="w-5 h-5 shrink-0 animate-bounce" />
                    <span>{msgAceitacaoSucesso}</span>
                  </div>
                )}

                {msgAceitacaoErro && (
                  <div className="p-4 bg-red-950/20 border border-red-900 rounded-lg flex items-center gap-3 text-red-400 text-xs font-sans">
                    <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
                    <span>{msgAceitacaoErro}</span>
                  </div>
                )}

                {/* Requests List */}
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-5 space-y-4">
                  <div className="border-b border-zinc-900 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex gap-2 border-b border-zinc-900 sm:border-b-0 overflow-x-auto">
                      {(['pendente', 'aprovado', 'reprovado'] as const).map((tab) => {
                        const count = solicitacoes.filter(s => (s.status || 'pendente') === tab).length;
                        const label = tab === 'pendente' ? 'Pendentes' : tab === 'aprovado' ? 'Aprovadas' : 'Reprovadas';
                        const colorClass = tab === 'pendente' ? 'text-amber-500' : tab === 'aprovado' ? 'text-emerald-500' : 'text-red-500';
                        const activeBorderClass = filtroSolicitacoes === tab 
                          ? 'border-b-2 border-emerald-500 text-zinc-100' 
                          : 'text-zinc-400 hover:text-zinc-200 border-b-2 border-transparent';
                        return (
                          <button
                            key={tab}
                            onClick={() => setFiltroSolicitacoes(tab)}
                            className={`px-3 py-1.5 text-xs font-tactical font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${activeBorderClass}`}
                          >
                            <span className={colorClass}>●</span>
                            {label} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {solicitacoes.filter(s => (s.status || 'pendente') === filtroSolicitacoes).map((sol) => (
                      <div 
                        key={sol.id} 
                        className="bg-zinc-900/30 border border-zinc-900/80 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-900/30 transition-all relative group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Habbo Avatar Image */}
                          <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden shrink-0 flex items-center justify-center relative">
                            <img
                              src={obterAvatarUrl(sol, 'm')}
                              alt={sol.nick}
                              referrerPolicy="no-referrer"
                              className="scale-110 translate-y-1.5"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://api.radiohabblet.com.br/imager?user=admin&gesture=std&direction=3&head_direction=3&headonly=false&size=m";
                              }}
                            />
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <span className="text-sm text-zinc-200 font-bold font-tactical block truncate">
                              @{sol.nick}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-sans block">
                              Habbo original: <strong className="text-zinc-400">{sol.avatarHabbo}</strong>
                            </span>
                            <span className="text-[9px] text-zinc-600 font-mono block">
                              Solicitado: {sol.dataSolicitacao}
                            </span>
                            {sol.avaliadorNick && (
                              <span className="text-[10px] text-zinc-400 font-sans block mt-1 leading-snug">
                                {sol.status === 'aprovado' ? '✅ Aprovado por: ' : '❌ Reprovado por: '}
                                <strong className="text-zinc-300">@{sol.avaliadorNick}</strong>
                                <span className="text-zinc-500 block text-[9px] font-mono mt-0.5">{sol.dataAvaliacao}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Accept / Reject / Re-evaluate Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {filtroSolicitacoes === 'pendente' && (
                            <>
                              <button
                                onClick={() => lidarComAprovarMembro(sol.id, sol.nick)}
                                className="p-2 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 hover:bg-emerald-900/60 hover:text-white rounded cursor-pointer transition-all flex items-center gap-1.5 text-[10px] font-tactical font-bold tracking-wider uppercase"
                                title="Aprovar Alistamento"
                              >
                                <Check className="w-4 h-4" />
                                <span>Aprovar</span>
                              </button>
                              <button
                                onClick={() => lidarComRecusarMembro(sol.id, sol.nick)}
                                className="p-2 bg-red-950/30 border border-red-900/40 text-red-400 hover:bg-red-900/50 hover:text-white rounded cursor-pointer transition-all flex items-center gap-1.5 text-[10px] font-tactical font-bold tracking-wider uppercase"
                                title="Recusar Alistamento"
                              >
                                <X className="w-4 h-4" />
                                <span>Recusar</span>
                              </button>
                            </>
                          )}

                          {filtroSolicitacoes === 'aprovado' && (
                            <button
                              onClick={() => lidarComRecusarMembro(sol.id, sol.nick)}
                              className="p-2 bg-red-950/30 border border-red-900/40 text-red-400 hover:bg-red-900/50 hover:text-white rounded cursor-pointer transition-all flex items-center gap-1.5 text-[10px] font-tactical font-bold tracking-wider uppercase"
                              title="Reavaliar para Reprovado"
                            >
                              <X className="w-4 h-4" />
                              <span>Reprovar (Reavaliar)</span>
                            </button>
                          )}

                          {filtroSolicitacoes === 'reprovado' && (
                            <button
                              onClick={() => lidarComAprovarMembro(sol.id, sol.nick)}
                              className="p-2 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 hover:bg-emerald-900/60 hover:text-white rounded cursor-pointer transition-all flex items-center gap-1.5 text-[10px] font-tactical font-bold tracking-wider uppercase"
                              title="Reavaliar para Aprovado"
                            >
                              <Check className="w-4 h-4" />
                              <span>Aprovar (Reavaliar)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {solicitacoes.filter(s => (s.status || 'pendente') === filtroSolicitacoes).length === 0 && (
                      <div className="col-span-full py-12 text-center border border-zinc-900 border-dashed rounded-lg space-y-2">
                        <UserPlus className="w-8 h-8 text-zinc-750 mx-auto" />
                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-tactical">
                          Nenhuma solicitação {filtroSolicitacoes === 'pendente' ? 'pendente' : filtroSolicitacoes === 'aprovado' ? 'aprovada' : 'reprovada'} no momento.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: GERENCIAMENTO DE APOSTILAS */}
            {abaAtiva === 'apostilas' && permissoesUser.abasAcessiveis.includes('apostilas') && (
              <motion.div
                key="apostilas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Header Card */}
                <div className="bg-zinc-950/60 border border-amber-900/40 rounded-lg p-5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
                  <div className="space-y-1">
                    <h3 className="text-base font-tactical font-bold text-amber-500 tracking-wider flex items-center gap-2">
                      <BookOpen className="w-5 h-5 animate-pulse" />
                      SISTEMA DE GESTÃO DE APOSTILAS / MANUAIS
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-tactical leading-relaxed">
                      Crie e gerencie os manuais e materiais de instrução da Polícia CIA que serão disponibilizados publicamente para todos os membros.
                    </p>
                  </div>
                  {editandoApostila === null && (
                    <button
                      type="button"
                      onClick={iniciarCriacaoApostila}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-950 via-amber-800 to-amber-950 hover:from-amber-900 hover:via-amber-700 hover:to-amber-900 border border-amber-700/20 text-white font-tactical font-bold text-xs tracking-wider uppercase rounded transition-all cursor-pointer flex items-center gap-2 shrink-0 self-start md:self-center"
                      id="btn_criar_nova_ap"
                    >
                      <Plus className="w-4 h-4" />
                      Nova Apostila
                    </button>
                  )}
                </div>

                {/* Content */}
                {editandoApostila === null ? (
                  /* Lista de Apostilas */
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {apostilasGerencia.length === 0 ? (
                      <div className="md:col-span-2 xl:col-span-3 text-center py-12 bg-zinc-950/20 border border-zinc-900 rounded-lg">
                        <BookOpen className="w-8 h-8 text-zinc-600 mx-auto mb-2.5 animate-pulse" />
                        <p className="text-xs text-zinc-500 font-tactical uppercase">Nenhuma apostila registrada ainda.</p>
                      </div>
                    ) : (
                      apostilasGerencia.map((ap) => (
                        <div key={ap.id} className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 flex flex-col justify-between transition-all hover:border-zinc-800 relative">
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-start gap-2 border-b border-zinc-900/60 pb-2.5">
                              <h4 className="text-xs font-bold text-zinc-200 uppercase font-sans line-clamp-1">{ap.titulo}</h4>
                              <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded shrink-0">
                                {ap.dataCriacao}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 leading-relaxed font-sans line-clamp-3">{ap.descricao}</p>
                            <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                              <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>{ap.partes.length} seções registradas</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-4 border-t border-zinc-900/60 mt-4">
                            <button
                              type="button"
                              onClick={() => iniciarEdicaoApostila(ap)}
                              className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-tactical font-semibold text-[10px] tracking-wider uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5 text-amber-500" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => lidarComExcluirApostilaGerencia(ap.id)}
                              className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-red-400 hover:text-red-350 font-tactical font-semibold text-[10px] tracking-wider uppercase rounded transition-all cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* Formulário de Criação/Edição */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-zinc-950/20 border border-zinc-900 p-5 rounded-lg">
                    {/* Coluna 1: Dados Gerais e Partes */}
                    <form onSubmit={lidarComSalvarApostilaGerencia} className="lg:col-span-7 space-y-4">
                      <h4 className="text-xs font-tactical font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2">
                        {editandoApostila.id ? 'EDITANDO DETALHES DA APOSTILA' : 'DADOS DA NOVA APOSTILA'}
                      </h4>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">
                            Título do Manual/Apostila
                          </label>
                          <input
                            type="text"
                            value={apTitulo}
                            onChange={(e) => setApTitulo(e.target.value)}
                            placeholder="Ex: Manual de Conduta e Atendimento de Recepção"
                            required
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2.5 rounded focus:border-amber-500 outline-none transition-all font-sans"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">
                            Descrição Geral / Resumo
                          </label>
                          <textarea
                            value={apDescricao}
                            onChange={(e) => setApDescricao(e.target.value)}
                            placeholder="Descreva brevemente sobre o que se trata este manual..."
                            rows={2}
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2.5 rounded focus:border-amber-500 outline-none transition-all font-sans resize-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <h5 className="text-[11px] font-tactical font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-amber-500" />
                          Seções Adicionadas ({apPartes.length})
                        </h5>

                        {apPartes.length === 0 ? (
                          <div className="p-6 text-center bg-zinc-900/10 border border-dashed border-zinc-800 rounded">
                            <p className="text-[10px] text-zinc-600 font-tactical uppercase">Nenhuma seção adicionada. Use o painel ao lado para adicionar seções.</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                            {apPartes.map((p, index) => (
                              <div
                                key={p.id}
                                className={`p-3 bg-zinc-950/80 border rounded flex items-center justify-between gap-3 ${parteEmEdicaoId === p.id ? 'border-amber-600/60' : 'border-zinc-900'}`}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-zinc-200 truncate">
                                    {index + 1}. {p.tituloParte}
                                  </p>
                                  {p.subtituloParte && (
                                    <p className="text-[10px] text-amber-500/90 font-medium truncate">
                                      {p.subtituloParte}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-zinc-500 line-clamp-1">{p.conteudo}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => moverParteAEditar(p.id, 'cima')}
                                    disabled={index === 0}
                                    className="text-zinc-400 hover:text-amber-400 p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:text-zinc-400 cursor-pointer"
                                    title="Mover Seção Para Cima"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moverParteAEditar(p.id, 'baixo')}
                                    disabled={index === apPartes.length - 1}
                                    className="text-zinc-400 hover:text-amber-400 p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:text-zinc-400 cursor-pointer"
                                    title="Mover Seção Para Baixo"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => iniciarEdicaoParte(p)}
                                    className="text-zinc-400 hover:text-blue-400 p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded cursor-pointer"
                                    title="Editar Conteúdo da Seção"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removerParteAEditar(p.id)}
                                    className="text-red-400 hover:text-red-350 p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded cursor-pointer"
                                    title="Remover Seção"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-zinc-900/60">
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-950 hover:from-emerald-900 hover:via-emerald-700 hover:to-emerald-900 border border-emerald-700/20 text-white font-tactical font-bold text-xs tracking-wider uppercase rounded transition-all cursor-pointer shadow-lg"
                        >
                          Salvar Apostila
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditandoApostila(null); setParteEmEdicaoId(null); }}
                          className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-tactical font-bold text-xs tracking-wider uppercase rounded transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>

                    {/* Coluna 2: Adicionar/Editar Seção/Parte */}
                    <div className={`lg:col-span-5 bg-zinc-950/40 p-4 border rounded-lg space-y-4 ${parteEmEdicaoId ? 'border-amber-600/50' : 'border-zinc-900'}`}>
                      <h4 className="text-xs font-tactical font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2 flex items-center justify-between">
                        <span>{parteEmEdicaoId ? 'EDITANDO SEÇÃO EXISTENTE' : 'ADICIONAR SEÇÃO/PARTE'}</span>
                        {parteEmEdicaoId && (
                          <span className="text-[9px] text-amber-500 normal-case tracking-normal font-sans">modo edição</span>
                        )}
                      </h4>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">
                            Título da Seção (Ex: Capítulo 1 ou Tópico)
                          </label>
                          <input
                            type="text"
                            value={novaParteTitulo}
                            onChange={(e) => setNovaParteTitulo(e.target.value)}
                            placeholder="Ex: 1. Comandos de Recepção"
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2 rounded focus:border-amber-500 outline-none transition-all font-sans"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">
                            Subtítulo da Seção (Opcional)
                          </label>
                          <input
                            type="text"
                            value={novaParteSubtitulo}
                            onChange={(e) => setNovaParteSubtitulo(e.target.value)}
                            placeholder="Ex: Diretrizes de postura e conduta militar..."
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2 rounded focus:border-amber-500 outline-none transition-all font-sans"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">
                            Conteúdo da Seção
                          </label>
                          <textarea
                            value={novaParteConteudo}
                            onChange={(e) => setNovaParteConteudo(e.target.value)}
                            placeholder="Digite o conteúdo explicativo da seção. Suporta espaçamento por quebra de linhas..."
                            rows={8}
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2 rounded focus:border-amber-500 outline-none transition-all font-sans resize-none custom-scrollbar"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={adicionarParteAEditar}
                            className={`flex-1 py-2 border font-tactical font-bold text-[10px] tracking-wider uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              parteEmEdicaoId
                                ? 'bg-amber-950/30 hover:bg-amber-950/50 border-amber-800/40 text-amber-400'
                                : 'bg-amber-950/20 hover:bg-amber-950/40 border-amber-900/30 text-amber-400'
                            }`}
                          >
                            {parteEmEdicaoId ? (
                              <>
                                <Save className="w-4 h-4" />
                                Salvar Alterações da Seção
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                Adicionar Seção à Lista
                              </>
                            )}
                          </button>
                          {parteEmEdicaoId && (
                            <button
                              type="button"
                              onClick={cancelarEdicaoParte}
                              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-tactical font-bold text-[10px] tracking-wider uppercase rounded transition-all cursor-pointer"
                              title="Cancelar edição desta seção"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: GESTÃO DO SITE */}
            {abaAtiva === 'gestao_site' && tabPermitida && (
              <motion.div
                key="gestao_site"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Header Card */}
                <div className="bg-zinc-950/60 border border-amber-900/40 rounded-lg p-5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
                  <div className="space-y-1">
                    <h3 className="text-base font-tactical font-bold text-amber-500 tracking-wider flex items-center gap-2">
                      <Sliders className="w-5 h-5 animate-pulse" />
                      TERMINAL DE CONTROLE: CONFIGURAÇÕES DO SITE
                    </h3>
                    <p className="text-xs text-zinc-400 font-tactical leading-relaxed">
                      Gerenciamento global de marca, design visual, logo institucional e matriz dinâmica de cargos e permissões.
                    </p>
                  </div>
                </div>

                {/* Sub Tab Switcher */}
                <div className="flex flex-wrap bg-zinc-950/85 border border-zinc-900 rounded p-1 w-full sm:w-auto shrink-0 self-start gap-1">
                  <button
                    type="button"
                    onClick={() => setGSubAba('geral')}
                    className={`px-5 py-2 rounded text-xs font-tactical font-semibold tracking-wider transition-all cursor-pointer uppercase ${
                      gSubAba === 'geral'
                        ? 'bg-amber-950/50 text-amber-400 border border-amber-900/30 font-bold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Identidade & Design
                  </button>
                  <button
                    type="button"
                    onClick={() => setGSubAba('permissoes')}
                    className={`px-5 py-2 rounded text-xs font-tactical font-semibold tracking-wider transition-all cursor-pointer uppercase ${
                      gSubAba === 'permissoes'
                        ? 'bg-amber-950/50 text-amber-400 border border-amber-900/30 font-bold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Cargos & Permissões
                  </button>
                  <button
                    type="button"
                    onClick={() => setGSubAba('supabase')}
                    className={`px-5 py-2 rounded text-xs font-tactical font-semibold tracking-wider transition-all cursor-pointer uppercase ${
                      gSubAba === 'supabase'
                        ? 'bg-amber-950/50 text-amber-400 border border-amber-900/30 font-bold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Banco Supabase
                  </button>
                  <button
                    type="button"
                    onClick={() => setGSubAba('webhooks')}
                    className={`px-5 py-2 rounded text-xs font-tactical font-semibold tracking-wider transition-all cursor-pointer uppercase ${
                      gSubAba === 'webhooks'
                        ? 'bg-amber-950/50 text-amber-400 border border-amber-900/30 font-bold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Webhooks de Logs
                  </button>
                  <button
                    type="button"
                    onClick={() => setGSubAba('alterar_senhas')}
                    className={`px-5 py-2 rounded text-xs font-tactical font-semibold tracking-wider transition-all cursor-pointer uppercase ${
                      gSubAba === 'alterar_senhas'
                        ? 'bg-amber-950/50 text-amber-400 border border-amber-900/30 font-bold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Alterar Senhas
                  </button>
                  <button
                    type="button"
                    onClick={() => setGSubAba('backup')}
                    className={`px-5 py-2 rounded text-xs font-tactical font-semibold tracking-wider transition-all cursor-pointer uppercase ${
                      gSubAba === 'backup'
                        ? 'bg-amber-950/50 text-amber-400 border border-amber-900/30 font-bold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Backups do Site
                  </button>
                  <button
                    type="button"
                    onClick={() => setGSubAba('abas_customizadas')}
                    className={`px-5 py-2 rounded text-xs font-tactical font-semibold tracking-wider transition-all cursor-pointer uppercase ${
                      gSubAba === 'abas_customizadas'
                        ? 'bg-amber-950/50 text-amber-400 border border-amber-900/30 font-bold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Abas Setores
                  </button>
                </div>

                {/* Success/Error Alerts */}
                {msgConfigSucesso && (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-900 rounded-lg flex items-center gap-3 text-emerald-400 text-xs font-sans">
                    <CheckCircle className="w-5 h-5 shrink-0 animate-bounce" />
                    <span>{msgConfigSucesso}</span>
                  </div>
                )}
                {msgConfigErro && (
                  <div className="p-4 bg-red-950/20 border border-red-900 rounded-lg flex items-center gap-3 text-red-400 text-xs font-sans">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{msgConfigErro}</span>
                  </div>
                )}

                {/* Sub Aba: GERAL */}
                {gSubAba === 'geral' && (
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Form block */}
                    <form onSubmit={lidarComSalvarConfigGeral} className="lg:col-span-3 bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-4">
                      <h4 className="text-sm font-tactical font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2">
                        Configurações Globais de Identidade
                      </h4>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Nome Institucional da Corporação</label>
                          <input
                            type="text"
                            value={gSiteNome}
                            onChange={(e) => setGSiteNome(e.target.value)}
                            placeholder="Ex: POLÍCIA CIA"
                            required
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2.5 rounded focus:border-amber-500 outline-none transition-all font-tactical"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Slogan / Subtítulo Geral</label>
                          <input
                            type="text"
                            value={gSiteSubtitulo}
                            onChange={(e) => setGSiteSubtitulo(e.target.value)}
                            placeholder="Ex: Mesa de Operações Integradas • Brasília/DF"
                            required
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2.5 rounded focus:border-amber-500 outline-none transition-all font-tactical"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Abreviatura / Texto da Estrela</label>
                            <input
                              type="text"
                              value={gLogoTexto}
                              onChange={(e) => setGLogoTexto(e.target.value)}
                              placeholder="Ex: CIA"
                              required
                              className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2.5 rounded focus:border-amber-500 outline-none transition-all font-tactical"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">URL do Logo Secundário</label>
                            <input
                              type="text"
                              value={gLogoUrl}
                              onChange={(e) => setGLogoUrl(e.target.value)}
                              placeholder="URL de imagem opcional para logo ou brasão"
                              className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2.5 rounded focus:border-amber-500 outline-none transition-all font-tactical"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">Mensagem Especial na Tela de Login</label>
                          <textarea
                            value={gLoginMensagem}
                            onChange={(e) => setGLoginMensagem(e.target.value)}
                            placeholder="Mensagem exibida aos policiais na entrada do sistema..."
                            rows={3}
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 p-3 rounded focus:border-amber-500 outline-none transition-all font-sans custom-scrollbar"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">URL do Webhook do Discord</label>
                          <input
                            type="url"
                            value={gWebhookDiscord}
                            onChange={(e) => setGWebhookDiscord(e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2.5 rounded focus:border-amber-500 outline-none transition-all font-tactical"
                          />
                          <p className="text-[10px] text-zinc-600 font-tactical">
                            Insira o link do webhook do seu servidor do Discord para receber notificações automáticas em tempo real de avisos, promoções, rebaixamentos, advertências e exonerações de forma integrada.
                          </p>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-amber-950 via-amber-800 to-amber-950 text-white font-tactical font-bold text-xs tracking-widest uppercase rounded hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-700/30"
                      >
                        <Save className="w-4 h-4" />
                        SALVAR ALTERAÇÕES INSTITUCIONAIS
                      </button>
                    </form>

                    {/* Preview block */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-4">
                        <h4 className="text-sm font-tactical font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2">
                          Visualização em Tempo Real
                        </h4>

                        {/* Topbar Preview Header */}
                        <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-3 shadow-md relative">
                          <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-amber-950 border border-amber-900/30 text-[8px] font-mono text-amber-500 rounded">PRÉVIA DO CABEÇALHO</span>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 border border-amber-500 rounded bg-zinc-900 flex items-center justify-center text-amber-500 text-xs font-bold font-anton select-none">
                              {gLogoTexto || 'CIA'}
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-tactical font-bold text-zinc-100 tracking-wider truncate uppercase">
                                {gSiteNome || 'POLÍCIA CIA'}
                              </h5>
                              <p className="text-[9px] text-zinc-500 font-tactical truncate">
                                {gSiteSubtitulo || 'Mesa de Operações Integradas • Brasília/DF'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Login Screen Card Preview */}
                        <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 space-y-4 shadow-md relative">
                          <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-amber-950 border border-amber-900/30 text-[8px] font-mono text-amber-500 rounded">PRÉVIA DA MENSAGEM DE ENTRADA</span>
                          
                          <div className="flex items-center gap-3">
                            {gLogoUrl ? (
                              <img src={gLogoUrl} alt="Brasão" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-12 h-12 rounded bg-red-950/20 border border-red-900 flex items-center justify-center text-red-500 text-lg font-bold font-anton">
                                {gLogoTexto || 'CIA'}
                              </div>
                            )}
                            <div>
                              <h5 className="text-xs font-tactical font-bold text-zinc-100 tracking-wide uppercase">{gSiteNome || 'POLÍCIA CIA'}</h5>
                              <p className="text-[9px] text-zinc-500 font-tactical uppercase">SISTEMA INFORMATIZADO DE CONTROLE</p>
                            </div>
                          </div>

                          <div className="bg-zinc-900/50 border-l-2 border-amber-500 p-3 rounded-r">
                            <p className="text-[10px] text-zinc-300 italic font-sans leading-relaxed">
                              {gLoginMensagem || 'Nenhuma mensagem de entrada configurada. Os policiais verão a mensagem de saudação militar padrão ao entrarem no painel.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Aba: PERMISSOES */}
                {gSubAba === 'permissoes' && (
                  <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b border-zinc-900 pb-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-tactical font-bold text-zinc-300 tracking-wider uppercase">
                          Matriz Geral de Cargos e Permissões (RBAC)
                        </h4>
                        <p className="text-xs text-zinc-500 font-tactical">
                          Selecione um cargo da corporação para conceder abas exclusivas e autorizar ações operacionais especiais.
                        </p>
                      </div>

                      {/* Cargo Selector Dropdown */}
                      <div className="w-full md:max-w-xs space-y-1">
                        <label className="text-[9px] text-zinc-500 font-tactical uppercase tracking-wider block">Cargo Militar de Destino</label>
                        <select
                          value={gCargoSelecionado}
                          onChange={(e) => carregarPermissoesCargo(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3.5 py-2.5 rounded focus:border-amber-500 outline-none font-tactical"
                        >
                          <option value="">-- SELECIONE UM CARGO --</option>
                          {listaCargos.map((cargo) => (
                            <option key={cargo} value={cargo}>{cargo}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {gCargoSelecionado ? (
                      <form onSubmit={lidarComSalvarPermissoesCargo} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left Column: Allowed Tabs */}
                          <div className="bg-zinc-950/80 border border-zinc-900 rounded-lg p-5 space-y-4">
                            <h5 className="text-xs font-tactical font-bold text-amber-500 tracking-wider uppercase flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                              <Eye className="w-3.5 h-3.5" />
                              Abas e Telas Acessíveis
                            </h5>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {[
                                { id: 'inicio', label: 'Início / Painel' },
                                { id: 'perfil', label: 'Meu Perfil' },
                                { id: 'avisos', label: 'Mural de Avisos' },
                                { id: 'promocao', label: 'Promoção & Rebaixamento' },
                                { id: 'aulas', label: 'Aulas e Treinamentos' },
                                { id: 'xp', label: 'XP' },
                                { id: 'grupos', label: 'Grupos' },
                                { id: 'hierarquia', label: 'Hierarquia de Patentes' },
                                { id: 'advertencias', label: 'Advertências' },
                                { id: 'exonerar', label: 'Exonerações' },
                                { id: 'aceitar_membros', label: 'Aceitar Novos Membros' },
                              ].map((aba) => (
                                <label key={aba.id} className="flex items-center gap-2.5 p-2 bg-zinc-900/40 border border-zinc-900/60 rounded cursor-pointer hover:bg-zinc-900/85 hover:border-zinc-800 transition-all select-none">
                                  <input
                                    type="checkbox"
                                    checked={tempAbas.includes(aba.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setTempAbas([...tempAbas, aba.id]);
                                      } else {
                                        setTempAbas(tempAbas.filter((t) => t !== aba.id));
                                      }
                                    }}
                                    className="accent-amber-500 w-3.5 h-3.5 rounded"
                                  />
                                  <span className="text-xs font-tactical text-zinc-300">{aba.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Right Column: Authorized Actions */}
                          <div className="bg-zinc-950/80 border border-zinc-900 rounded-lg p-5 space-y-4">
                            <h5 className="text-xs font-tactical font-bold text-amber-500 tracking-wider uppercase flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Ações Operacionais Autorizadas
                            </h5>

                            <div className="space-y-3">
                              {[
                                {
                                  checked: tempPromover,
                                  onChange: setTempPromover,
                                  label: 'Promover / Rebaixar militares',
                                  desc: 'Permite alterar a patente/cargo de outros militares da corporação.'
                                },
                                {
                                  checked: tempAvisos,
                                  onChange: setTempAvisos,
                                  label: 'Publicar avisos militares',
                                  desc: 'Autoriza postar novos recados urgentes ou informativos no mural.'
                                },
                                {
                                  checked: tempXP,
                                  onChange: setTempXP,
                                  label: 'Distribuir pontos de XP',
                                  desc: 'Habilita o envio de pontos de experiência/gratificação militar.'
                                },
                                {
                                  checked: tempTreinamentos,
                                  onChange: setTempTreinamentos,
                                  label: 'Criar / Editar Treinamentos',
                                  desc: 'Autoriza planejar conteúdos de treinamento e gerenciar suas permissões.'
                                },
                                {
                                  checked: tempAvaliar,
                                  onChange: setTempAvaliar,
                                  label: 'Aplicar aulas e avaliar',
                                  desc: 'Habilita ministrar aulas presenciais, matricular recrutas e aprová-los.'
                                },
                                {
                                  checked: tempGrupos,
                                  onChange: setTempGrupos,
                                  label: 'Gerenciar Grupos e Departamentos',
                                  desc: 'Permite criar, editar, deletar e alterar membros de grupos de elite.'
                                },
                                {
                                  checked: tempHierarquia,
                                  onChange: setTempHierarquia,
                                  label: 'Gerenciar Hierarquia de Patentes',
                                  desc: 'Habilita criar e editar as categorias e patentes de forma global.'
                                },
                                {
                                  checked: tempExcluirLogsTreinamento,
                                  onChange: setTempExcluirLogsTreinamento,
                                  label: 'Excluir logs / aplicações de treinamento',
                                  desc: 'Autoriza apagar relatórios de treinamentos (aprovados ou não aprovados) de forma definitiva.'
                                },
                                {
                                  checked: tempReavaliarTreinamento,
                                  onChange: setTempReavaliarTreinamento,
                                  label: 'Reavaliar treinamentos já finalizados',
                                  desc: 'Autoriza mudar o resultado de aprovação/reprovação de um treino mesmo após concluído.'
                                },
                                {
                                  checked: tempExcluirAvisos,
                                  onChange: setTempExcluirAvisos,
                                  label: 'Excluir avisos do mural',
                                  desc: 'Habilita excluir e apagar as diretivas e avisos militares postados no mural.'
                                },
                                {
                                  checked: tempExcluirPoliciais,
                                  onChange: setTempExcluirPoliciais,
                                  label: 'Excluir / Apagar Policiais do Sistema',
                                  desc: 'Autoriza apagar completamente as credenciais e registro de um policial do painel.'
                                },
                                {
                                  checked: tempExcluirApostilas,
                                  onChange: setTempExcluirApostilas,
                                  label: 'Excluir Apostilas / Manuais',
                                  desc: 'Permite apagar apostilas e materiais didáticos inteiros do acervo do site.'
                                },
                              ].map((acao, idx) => (
                                <div key={idx} className="p-3 bg-zinc-900/40 border border-zinc-900/60 rounded flex items-start gap-3 hover:bg-zinc-900/80 transition-all">
                                  <input
                                    type="checkbox"
                                    checked={acao.checked}
                                    onChange={(e) => acao.onChange(e.target.checked)}
                                    className="accent-amber-500 w-3.5 h-3.5 mt-0.5 rounded cursor-pointer"
                                    id={`acao-${idx}`}
                                  />
                                  <label htmlFor={`acao-${idx}`} className="flex-1 space-y-0.5 cursor-pointer select-none">
                                    <span className="text-xs font-tactical font-semibold text-zinc-200 block">{acao.label}</span>
                                    <span className="text-[10px] text-zinc-500 font-sans block leading-relaxed">{acao.desc}</span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 bg-gradient-to-r from-amber-950 via-amber-800 to-amber-950 text-white font-tactical font-bold text-xs tracking-widest uppercase rounded hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-700/30"
                        >
                          <Save className="w-4 h-4" />
                          SALVAR AUTORIZAÇÕES DO CARGO: {gCargoSelecionado.toUpperCase()}
                        </button>
                      </form>
                    ) : (
                      <div className="text-center py-16 text-zinc-650 font-tactical">
                        <Shield className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Selecione um cargo acima para configurar</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">As alterações serão persistidas de forma integrada no banco de dados.</p>
                      </div>
                    )}
                  </div>
                )}

                {gSubAba === 'supabase' && (
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Information block */}
                    <div className="lg:col-span-3 bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-4">
                      <h4 className="text-sm font-tactical font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-emerald-500" />
                          Conexão com Banco de Dados Supabase
                        </span>
                        <button
                          type="button"
                          onClick={() => verificarConexaoSupabase()}
                          disabled={testandoSupabase}
                          className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 rounded font-tactical uppercase tracking-wider flex items-center gap-1 hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 text-emerald-500 ${testandoSupabase ? 'animate-spin' : ''}`} />
                          {testandoSupabase ? 'Testando...' : 'Testar Conexão'}
                        </button>
                      </h4>

                      <div className="space-y-4">
                        <div className="p-5 bg-emerald-950/20 border border-emerald-900/50 rounded-lg flex flex-col gap-4">
                          <div className="flex items-start gap-3">
                            <Shield className="w-8 h-8 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                            <div className="space-y-1">
                              <h5 className="text-xs font-bold text-emerald-400 font-tactical uppercase tracking-wider">
                                CONEXÃO AUTOMÁTICA VIA BACKEND API (SEM VITE • 100% SEGURO)
                              </h5>
                              <p className="text-[10px] text-zinc-350 leading-normal font-sans">
                                O sistema possui uma API Backend dedicada em Node/Express (Vercel Serverless) que lê as variáveis de ambiente de forma privada. Suas credenciais <code className="text-emerald-400 font-mono font-bold">SUPABASE_URL</code> e <code className="text-emerald-400 font-mono font-bold">SUPABASE_ANON_KEY</code> ficam 100% protegidas no servidor e <strong>NUNCA</strong> são expostas ao navegador.
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-zinc-900 pt-3 flex flex-col gap-2">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-zinc-500 uppercase tracking-wider">Status do Banco:</span>
                              {statusSupabase === 'conectado' ? (
                                <span className="text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                  ATIVO & CONECTADO
                                </span>
                              ) : statusSupabase === 'erro' ? (
                                <span className="text-red-500 font-bold uppercase flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  ERRO DE CONEXÃO
                                </span>
                              ) : (
                                <span className="text-zinc-500 font-bold uppercase flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                                  NÃO CONFIGURADO
                                </span>
                              )}
                            </div>
                            {gSupabaseUrl && (
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="text-zinc-500 uppercase tracking-wider">Projeto URL:</span>
                                <span className="text-zinc-300 font-semibold">{gSupabaseUrl}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Direct Manual Credential Input Form */}
                        <form onSubmit={lidarComSalvarCredenciaisSupabaseManual} className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-lg space-y-3">
                          <h6 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider font-tactical flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-amber-500" />
                            Configurar Credenciais Manualmente no Navegador
                          </h6>
                          <p className="text-[10px] text-zinc-400 leading-normal font-sans">
                            Se preferir não usar variáveis do Vercel, cole a URL e a Anon Key do seu projeto Supabase abaixo. Elas serão salvas no seu navegador para uso imediato.
                          </p>

                          <div className="space-y-2">
                            <div>
                              <label className="block text-[9px] font-tactical text-zinc-400 uppercase tracking-wider mb-1">
                                SUPABASE PROJECT URL
                              </label>
                              <input
                                type="url"
                                placeholder="https://seu-projeto.supabase.co"
                                value={gSupabaseUrl}
                                onChange={(e) => setGSupabaseUrl(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-tactical text-zinc-400 uppercase tracking-wider mb-1">
                                SUPABASE ANON / PUBLIC KEY
                              </label>
                              <input
                                type="password"
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                value={gSupabaseKey}
                                onChange={(e) => setGSupabaseKey(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="submit"
                              disabled={testandoSupabase || !gSupabaseUrl.trim() || !gSupabaseKey.trim()}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-[10px] font-bold font-tactical uppercase tracking-wider rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                              <Save className="w-3.5 h-3.5" />
                              {testandoSupabase ? 'Testando...' : 'Salvar e Conectar'}
                            </button>

                            {(localStorage.getItem('cia_supabase_url') || localStorage.getItem('cia_supabase_key')) && (
                              <button
                                type="button"
                                onClick={() => {
                                  salvarCredenciaisSupabaseManual('', '');
                                  setGSupabaseUrl(getSupabaseCredentials().url);
                                  setGSupabaseKey(getSupabaseCredentials().key);
                                  verificarConexaoSupabase();
                                }}
                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold font-tactical uppercase tracking-wider rounded transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                Limpar Salvas
                              </button>
                            )}
                          </div>
                        </form>

                        {/* Vercel instructions card */}
                        <div className="p-4 bg-zinc-900/30 border border-zinc-900 rounded-lg space-y-2">
                          <h6 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-tactical flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            Passo a Passo para Variáveis Privadas no Vercel (Sem VITE)
                          </h6>
                          <ol className="text-[10px] text-zinc-400 leading-relaxed font-sans list-decimal list-inside space-y-1">
                            <li>Acesse seu painel no <strong>Vercel</strong> → Entre no seu projeto → Clique em <strong>Settings</strong> → <strong>Environment Variables</strong>.</li>
                            <li>Adicione a variável: <code className="text-emerald-400 font-mono font-bold">SUPABASE_URL</code> com a URL do seu projeto Supabase.</li>
                            <li>Adicione a variável: <code className="text-emerald-400 font-mono font-bold">SUPABASE_ANON_KEY</code> (ou <code className="text-emerald-400 font-mono font-bold">SUPABASE_SERVICE_ROLE_KEY</code>) com sua chave do Supabase.</li>
                            <li><strong className="text-amber-400">REDEPLOY OBRIGATÓRIO:</strong> Vá em <strong>Deployments</strong> no Vercel, clique nos <strong>...</strong> do último deploy e escolha <strong className="text-emerald-400">Redeploy</strong> para aplicar as novas variáveis no backend da API Serverless.</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    {/* Status & Sync actions block */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-4">
                        <h4 className="text-sm font-tactical font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2">
                          Status do Servidor
                        </h4>

                        <div className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-900 rounded">
                          <span className="text-[10px] text-zinc-400 font-tactical uppercase">Conexão Supabase</span>
                          <div className="flex items-center gap-2">
                            {statusSupabase === 'conectado' ? (
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-400 font-tactical uppercase tracking-wider">CONECTADO</span>
                              </div>
                            ) : statusSupabase === 'erro' ? (
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-red-500 rounded-full" />
                                <span className="text-[10px] font-bold text-red-500 font-tactical uppercase tracking-wider">ERRO DE CONEXÃO</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-zinc-700 rounded-full" />
                                <span className="text-[10px] font-bold text-zinc-500 font-tactical uppercase tracking-wider">NÃO CONFIGURADO</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] text-zinc-500 leading-normal">
                            As alterações do site agora são gravadas automaticamente no Supabase em tempo real. Utilize as ações abaixo para migrar seus dados:
                          </p>

                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <button
                              type="button"
                              disabled={statusSupabase !== 'conectado' || sincronizandoSupabase}
                              onClick={async () => {
                                if (!await pedirConfirmacao('Tem certeza que deseja baixar tudo do Supabase? Isso irá substituir seus dados locais temporariamente.', 'SINCRONIZAR SUPABASE')) return;
                                setSincronizandoSupabase(true);
                                const res = await sincronizarTudoDoSupabase(true);
                                if (res.sucesso) {
                                  carregarDados();
                                  setMsgConfigSucesso('Todos os dados foram baixados do Supabase com sucesso!');
                                  setTimeout(() => setMsgConfigSucesso(''), 5000);
                                } else {
                                  setMsgConfigErro(res.mensagem);
                                  setTimeout(() => setMsgConfigErro(''), 5000);
                                }
                                setSincronizandoSupabase(false);
                              }}
                              className="px-3 py-3 bg-zinc-900 border border-zinc-800 rounded flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-center"
                            >
                              <DownloadCloud className="w-5 h-5 text-amber-500 animate-bounce" />
                              <span className="text-[9px] font-bold text-zinc-300 font-tactical uppercase tracking-wider">BAIXAR DO BANCO</span>
                              <span className="text-[8px] text-zinc-600 font-sans">Pull Supabase</span>
                            </button>

                            <button
                              type="button"
                              disabled={statusSupabase !== 'conectado' || sincronizandoSupabase}
                              onClick={async () => {
                                if (!await pedirConfirmacao('Tem certeza que deseja exportar todos os dados locais para o Supabase? Isso pode sobrescrever dados existentes lá.', 'EXPORTAR DADOS')) return;
                                setSincronizandoSupabase(true);
                                const res = await exportarDadosParaSupabase();
                                if (res.sucesso) {
                                  setMsgConfigSucesso('Todos os dados locais foram exportados para o Supabase com sucesso!');
                                  setTimeout(() => setMsgConfigSucesso(''), 5000);
                                } else {
                                  setMsgConfigErro(res.mensagem);
                                  setTimeout(() => setMsgConfigErro(''), 5000);
                                }
                                setSincronizandoSupabase(false);
                              }}
                              className="px-3 py-3 bg-zinc-900 border border-zinc-800 rounded flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-center"
                            >
                              <UploadCloud className="w-5 h-5 text-amber-500 animate-bounce" />
                              <span className="text-[9px] font-bold text-zinc-300 font-tactical uppercase tracking-wider">ENVIAR PRO BANCO</span>
                              <span className="text-[8px] text-zinc-600 font-sans">Push Local Storage</span>
                            </button>
                          </div>
                        </div>

                        {/* WIPE SYSTEM DATA CARD */}
                        <div className="bg-red-950/15 border border-red-900/50 p-4 rounded-lg space-y-3">
                          <div>
                            <h5 className="text-xs font-bold text-red-500 font-tactical uppercase tracking-wider flex items-center gap-1.5">
                              <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                              WIPE TOTAL DE DADOS / USUÁRIOS
                            </h5>
                            <p className="text-[10px] text-zinc-400 leading-normal mt-1">
                              Esta ação apagará permanentemente todos os policiais, avisos, grupos, advertências, logs e dados no site local e no banco de dados Supabase conectado. NENHUM dato será preservado, exceto a conta administradora suprema <strong className="text-zinc-200">admin</strong> (senha: <strong className="text-zinc-200">admin#2026</strong>) para garantir que você possa redefinir as credenciais.
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={sincronizandoSupabase}
                            onClick={async () => {
                              const confirm1 = await pedirConfirmacao("ATENÇÃO EXTREMA: Você está prestes a apagar TODOS OS DADOS do sistema (usuários, grupos, avisos, tudo!). Esta ação é definitiva e apagará também as tabelas do Supabase se estiver conectado. Deseja continuar?", "WIPE DO SISTEMA");
                              if (!confirm1) return;
                              const confirm2 = await pedirConfirmacao("CONFIRMAÇÃO FINAL: Deseja realmente executar o WIPE completo de todos os dados do sistema agora?", "CONFIRMAÇÃO FINAL WIPE");
                              if (!confirm2) return;

                              setSincronizandoSupabase(true);
                              const res = await limparEResetarBancoDeDados();
                              if (res.sucesso) {
                                await mostrarAlerta(res.mensagem, "RESET DO SISTEMA CONCLUÍDO");
                                // Forçar logout e reload do site
                                localStorage.removeItem('cia_sessao_policial');
                                window.location.reload();
                              } else {
                                await mostrarAlerta("Erro ao apagar banco de dados: " + res.mensagem, "ERRO NO RESET");
                              }
                              setSincronizandoSupabase(false);
                            }}
                            className="w-full py-2 bg-red-950 hover:bg-red-900 border border-red-600/40 hover:border-red-500 text-white font-tactical font-bold text-[10px] tracking-wider rounded cursor-pointer transition-all flex items-center justify-center gap-1.5 uppercase"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                            Apagar Todos os Dados (WIPE)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SQL Script block */}
                    <div className="lg:col-span-5 bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-3 gap-2">
                        <h4 className="text-xs font-tactical font-bold text-zinc-300 tracking-wider uppercase flex items-center gap-2">
                          <Code className="w-4 h-4 text-amber-500" />
                          Script SQL do Supabase
                        </h4>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex bg-zinc-900 rounded p-0.5 border border-zinc-800">
                            <button
                              type="button"
                              onClick={() => setSqlScriptOption('geral')}
                              className={`px-2 py-1 text-[9px] font-bold font-tactical uppercase rounded transition-all cursor-pointer ${
                                sqlScriptOption === 'geral'
                                  ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40 font-bold'
                                  : 'text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              Instalar Padrão
                            </button>
                            <button
                              type="button"
                              onClick={() => setSqlScriptOption('migrar')}
                              className={`px-2 py-1 text-[9px] font-bold font-tactical uppercase rounded transition-all cursor-pointer ${
                                sqlScriptOption === 'migrar'
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 font-bold'
                                  : 'text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              Corrigir Webhooks (Migração)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSqlScriptOption('reset')}
                              className={`px-2 py-1 text-[9px] font-bold font-tactical uppercase rounded transition-all cursor-pointer ${
                                sqlScriptOption === 'reset'
                                  ? 'bg-red-950/40 text-red-400 border border-red-900/40 font-bold'
                                  : 'text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              Recriar do Zero (Reset)
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              const script = sqlScriptOption === 'geral' 
                                ? SQL_SCRIPT_GERAL 
                                : sqlScriptOption === 'reset' 
                                  ? SQL_SCRIPT_RESET 
                                  : SQL_SCRIPT_MIGRAR;
                              navigator.clipboard.writeText(script);
                              await mostrarAlerta('Script SQL copiado com sucesso! Agora basta colar no SQL Editor do Supabase e clicar em Run.', 'SCRIPT SQL COPIADO');
                            }}
                            className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-600/40 hover:border-amber-500 text-[9px] font-bold text-amber-400 font-tactical uppercase rounded flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copiar Código
                          </button>
                        </div>
                      </div>

                      <p className="text-[10px] text-zinc-400 font-tactical leading-relaxed">
                        {sqlScriptOption === 'geral' ? (
                          <span>
                            Copie o código SQL abaixo clicando no botão acima, abra o painel do seu projeto no <strong className="text-amber-500">Supabase</strong>, vá na aba <strong className="text-zinc-200">SQL Editor</strong>, crie uma <strong className="text-zinc-200">New Query</strong>, cole o código e clique em <strong className="text-zinc-200">Run</strong>. Isso criará as tabelas necessárias de forma sincronizada com o site.
                          </span>
                        ) : sqlScriptOption === 'migrar' ? (
                          <span className="text-emerald-400/90 leading-relaxed block">
                            <strong>RECOMENDADO SE OS SEUS WEBHOOKS NÃO SALVAM NO SUPABASE:</strong> Este script adiciona com segurança as colunas de webhooks e links que estão faltando na sua tabela <code className="bg-emerald-950/40 text-emerald-400 px-1 py-0.5 rounded font-mono">configuracao_site</code> e outras tabelas existentes. Ele <strong>não apagará ou modificará nenhum dado existente</strong> no seu banco de dados. Copie, cole no SQL Editor do Supabase e clique em <strong>Run</strong>.
                          </span>
                        ) : (
                          <span className="text-red-400/90 leading-relaxed block">
                            <strong>RECOMENDADO SE VOCÊ TIVER ERROS DE CARREGAMENTO OU COLUNAS FALTANDO:</strong> Este script executa comandos <code className="bg-red-950/40 text-red-400 px-1 py-0.5 rounded font-mono">DROP TABLE CASCADE</code> para deletar todas as tabelas antigas antes de criá-las de forma limpa. <strong>Os dados remotos serão limpos no Supabase</strong>, mas você poderá usar o botão <strong className="text-emerald-400">ENVIAR PRO BANCO</strong> à direita para reenviar todos os seus dados locais salvos após rodar este script!
                          </span>
                        )}
                      </p>

                      <div className="bg-zinc-950 border border-zinc-900 rounded p-3 h-48 overflow-y-auto font-mono text-[10px] text-zinc-500 leading-relaxed select-all">
                        <pre>
                          {sqlScriptOption === 'geral' 
                            ? SQL_SCRIPT_GERAL 
                            : sqlScriptOption === 'reset' 
                              ? SQL_SCRIPT_RESET 
                              : SQL_SCRIPT_MIGRAR}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {gSubAba === 'webhooks' && (
                  <form onSubmit={lidarComSalvarWebhooks} className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-6">
                    <div className="border-b border-zinc-900 pb-3">
                      <h4 className="text-sm font-tactical font-bold text-zinc-300 tracking-wider uppercase flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-amber-500 animate-pulse" />
                        Webhooks de Comunicação por Setor Administrativo
                      </h4>
                      <p className="text-xs text-zinc-500 font-tactical mt-1 leading-relaxed">
                        Configure canais separados do Discord para receber os logs operacionais e administrativos de cada setor. Caso algum canal não esteja configurado, o sistema usará o Webhook Geral/Fallback se definido na aba Identidade & Design.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Setor 1: Mural de Avisos */}
                      <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-lg p-4 space-y-2 flex flex-col justify-between">
                        <div className="space-y-2">
                          <label className="text-xs font-tactical font-bold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-red-500 rounded-full" />
                            Setor 1: Mural de Avisos & Comunicados
                          </label>
                          <input
                            type="url"
                            value={gWebhookAvisos}
                            onChange={(e) => setGWebhookAvisos(e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2 rounded focus:border-red-600 outline-none transition-all font-tactical"
                          />
                        </div>
                        <span className="text-[10px] text-zinc-600 font-tactical block leading-relaxed pt-2">
                          Dispara alertas no Discord sempre que uma nova diretriz militar, ordem de serviço ou comunicado for publicado no Mural de Avisos.
                        </span>
                      </div>

                      {/* Setor 2: Movimentações Militares */}
                      <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-lg p-4 space-y-2 flex flex-col justify-between">
                        <div className="space-y-2">
                          <label className="text-xs font-tactical font-bold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-amber-500 rounded-full" />
                            Setor 2: Movimentações (Promoções/Rebaixamentos)
                          </label>
                          <input
                            type="url"
                            value={gWebhookMovimentacoes}
                            onChange={(e) => setGWebhookMovimentacoes(e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2 rounded focus:border-amber-500 outline-none transition-all font-tactical"
                          />
                        </div>
                        <span className="text-[10px] text-zinc-600 font-tactical block leading-relaxed pt-2">
                          Registra as promoções, rebaixamentos, contratações, transferências e alterações de patente militar efetuadas no painel corporativo.
                        </span>
                      </div>

                      {/* Setor 3: Advertências */}
                      <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-lg p-4 space-y-2 flex flex-col justify-between">
                        <div className="space-y-2">
                          <label className="text-xs font-tactical font-bold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            Setor 3: Medidas Disciplinares & Advertências
                          </label>
                          <input
                            type="url"
                            value={gWebhookAdvertencias}
                            onChange={(e) => setGWebhookAdvertencias(e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2 rounded focus:border-blue-500 outline-none transition-all font-tactical"
                          />
                        </div>
                        <span className="text-[10px] text-zinc-600 font-tactical block leading-relaxed pt-2">
                          Direciona logs disciplinares e advertências aplicadas aos policiais que infringiram as regras regimentais da corporação.
                        </span>
                      </div>

                      {/* Setor 4: Exonerações e Demissões */}
                      <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-lg p-4 space-y-2 flex flex-col justify-between">
                        <div className="space-y-2">
                          <label className="text-xs font-tactical font-bold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-zinc-500 rounded-full" />
                            Setor 4: Exonerações & Demissões (Desligamentos)
                          </label>
                          <input
                            type="url"
                            value={gWebhookExoneracoes}
                            onChange={(e) => setGWebhookExoneracoes(e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2 rounded focus:border-zinc-500 outline-none transition-all font-tactical"
                          />
                        </div>
                        <span className="text-[10px] text-zinc-600 font-tactical block leading-relaxed pt-2">
                          Notifica de forma instantânea demissões, reparações, pedidos de demissão e desligamentos sumários de praças e oficiais.
                        </span>
                      </div>

                      {/* Setor 5: Entradas do Discord */}
                      <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-lg p-4 space-y-2 flex flex-col justify-between">
                        <div className="space-y-2">
                          <label className="text-xs font-tactical font-bold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                            Setor 5: Log de Entradas (Webhook Discord)
                          </label>
                          <input
                            type="url"
                            value={gWebhookDiscordEntradas}
                            onChange={(e) => setGWebhookDiscordEntradas(e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2 rounded focus:border-emerald-500 outline-none transition-all font-tactical"
                          />
                        </div>
                        <span className="text-[10px] text-zinc-600 font-tactical block leading-relaxed pt-2">
                          Webhook para enviar relatórios detalhados com IP, Cidade, Hora e dados do novo membro aprovado.
                        </span>
                      </div>

                      {/* Setor 6: Link de Convite do Discord */}
                      <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-lg p-4 space-y-2 flex flex-col justify-between">
                        <div className="space-y-2">
                          <label className="text-xs font-tactical font-bold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                            Setor 6: Link de Convite do Discord Oficial
                          </label>
                          <input
                            type="url"
                            value={gLinkDiscord}
                            onChange={(e) => setGLinkDiscord(e.target.value)}
                            placeholder="https://discord.gg/..."
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2 rounded focus:border-indigo-500 outline-none transition-all font-tactical"
                          />
                        </div>
                        <span className="text-[10px] text-zinc-600 font-tactical block leading-relaxed pt-2">
                          Link oficial do servidor de comunicação (Discord) que será exibido aos policiais recém-aprovados.
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-amber-950 via-amber-800 to-amber-950 text-white font-tactical font-bold text-xs tracking-wider uppercase rounded hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center gap-2 border border-amber-700/30"
                      >
                        <Save className="w-4 h-4" />
                        Salvar Webhooks Administrativos
                      </button>
                    </div>
                  </form>
                )}

                {gSubAba === 'alterar_senhas' && (
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Form block */}
                    <form onSubmit={lidarComAlterarSenhaMilitar} className="lg:col-span-3 bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-4">
                      <h4 className="text-sm font-tactical font-bold text-zinc-300 tracking-wider uppercase border-b border-zinc-900 pb-2 flex items-center gap-2">
                        <Key className="w-4 h-4 text-amber-500 animate-pulse" />
                        ALTERAÇÃO ADMINISTRATIVA DE SENHAS
                      </h4>

                      <div className="space-y-4">
                        {/* Search and Select Officer */}
                        <div className="space-y-1 relative">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">
                            Buscar e Selecionar Militar
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Digite o nick do policial..."
                              value={altSenhaPolicialNick ? `@${altSenhaPolicialNick}` : altSenhaPolicialNick}
                              onChange={(e) => {
                                const val = e.target.value.replace(/^@/, '');
                                setAltSenhaPolicialNick('');
                                // If manually clearing, allow user to type
                                if (val === '') {
                                  setAltSenhaPolicialNick('');
                                }
                              }}
                              className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2.5 pl-9 rounded focus:border-amber-500 outline-none transition-all font-tactical"
                            />
                            <Search className="w-3.5 h-3.5 text-zinc-600 absolute left-3 top-3.5" />
                          </div>

                          {/* Dropdown list for selecting officer */}
                          {!altSenhaPolicialNick && (
                            <div className="absolute left-0 right-0 mt-1 bg-zinc-950 border border-zinc-900 rounded shadow-2xl max-h-48 overflow-y-auto z-50 divide-y divide-zinc-900/60 custom-scrollbar">
                              {listaPoliciais
                                .map(p => (
                                  <button
                                    key={p.nick}
                                    type="button"
                                    onClick={() => {
                                      setAltSenhaPolicialNick(p.nick);
                                    }}
                                    className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-zinc-900/50 transition-all text-left text-xs cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-6 h-6 rounded bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center border border-zinc-800">
                                        <img
                                          src={obterAvatarUrl(p, 'head')}
                                          alt=""
                                          referrerPolicy="no-referrer"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://api.radiohabblet.com.br/imager?user=admin&gesture=std&direction=2&head_direction=2&headonly=true&size=m";
                                          }}
                                        />
                                      </div>
                                      <span className="text-zinc-200 font-bold truncate">@{p.nick}</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-tactical px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
                                      {p.cargo}
                                    </span>
                                  </button>
                                ))}
                            </div>
                          )}

                          {altSenhaPolicialNick && (
                            <div className="mt-2 p-3 bg-zinc-900/40 border border-zinc-900 rounded flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400">Policial Selecionado:</span>
                                <strong className="text-xs text-amber-500">@{altSenhaPolicialNick}</strong>
                              </div>
                              <button
                                type="button"
                                onClick={() => setAltSenhaPolicialNick('')}
                                className="text-[10px] font-tactical text-red-400 hover:text-red-300 underline cursor-pointer"
                              >
                                Alterar Seleção
                              </button>
                            </div>
                          )}
                        </div>

                        {/* New Password */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">
                            Nova Senha Militar
                          </label>
                          <input
                            type="password"
                            value={altSenhaNova}
                            onChange={(e) => setAltSenhaNova(e.target.value)}
                            placeholder="Digite a nova senha do policial..."
                            required
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2.5 rounded focus:border-amber-500 outline-none transition-all font-sans"
                          />
                        </div>

                        {/* Confirm New Password */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">
                            Confirmar Nova Senha
                          </label>
                          <input
                            type="password"
                            value={altSenhaConfirmacao}
                            onChange={(e) => setAltSenhaConfirmacao(e.target.value)}
                            placeholder="Confirme a nova senha..."
                            required
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2.5 rounded focus:border-amber-500 outline-none transition-all font-sans"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-red-950 via-red-800 to-red-950 text-white font-tactical font-bold text-xs tracking-widest uppercase rounded hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 border border-red-700/30 shadow-lg"
                      >
                        <Key className="w-4 h-4" />
                        REDEFINIR SENHA DO MILITAR
                      </button>
                    </form>

                    {/* Quick Info & Active Passwords Warning */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-5 space-y-3">
                        <h4 className="text-xs font-tactical font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-900 pb-2">
                          <ShieldAlert className="w-4 h-4 text-red-500" />
                          Protocolo de Segurança
                        </h4>
                        <p className="text-[11px] text-zinc-400 font-tactical leading-relaxed">
                          A redefinição de senhas é uma funcionalidade crítica do sistema de inteligência da CIA. Use este terminal somente quando solicitado por vias oficiais ou em casos comprovados de perda de credenciais.
                        </p>
                        <div className="p-3 bg-red-950/10 border border-red-900/30 rounded text-[10px] text-red-400 font-tactical leading-relaxed">
                          ⚠️ <strong>Nota:</strong> A nova senha entra em vigor imediatamente após a homologação. O policial deverá usar os novos dados no próximo acesso ao terminal.
                        </div>
                        <div className="p-3 bg-amber-950/10 border border-amber-900/30 rounded text-[10px] text-amber-500 font-tactical leading-relaxed">
                          🔒 <strong>Sincronização:</strong> Se o Supabase estiver conectado, a alteração de credenciais também será replicada no banco em nuvem de forma automática e instantânea.
                        </div>
                      </div>

                      {/* Simple searchable list of officers */}
                      <div className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-5 space-y-3">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                          <h4 className="text-xs font-tactical font-bold text-zinc-300 uppercase tracking-widest">
                            Membros Ativos ({listaPoliciais.length})
                          </h4>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Filtrar por nick..."
                            onChange={(e) => setBuscaMembrosLista(e.target.value)}
                            value={buscaMembrosLista}
                            className="w-full bg-zinc-950 border border-zinc-900 text-[11px] text-zinc-100 px-3 py-1.5 pl-8 rounded focus:border-amber-500 outline-none transition-all font-tactical"
                          />
                          <Search className="w-3 h-3 text-zinc-600 absolute left-2.5 top-2.5" />
                        </div>
                        <div className="max-h-48 overflow-y-auto divide-y divide-zinc-900/40 custom-scrollbar pr-1">
                          {listaPoliciais
                            .filter(p => p.nick.toLowerCase().includes(buscaMembrosLista.toLowerCase()))
                            .map(p => (
                              <div key={p.nick} className="py-2.5 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="w-5 h-5 rounded bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center border border-zinc-800">
                                    <img
                                      src={obterAvatarUrl(p, 'head')}
                                      alt=""
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <span className="text-zinc-300 font-tactical font-bold truncate">@{p.nick}</span>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAltSenhaPolicialNick(p.nick);
                                    }}
                                    className="text-[10px] font-tactical px-2 py-1 bg-amber-950/20 border border-amber-900/30 text-amber-400 rounded hover:bg-amber-950/40 transition-all cursor-pointer"
                                  >
                                    Selecionar
                                  </button>
                                  {p.nick.toLowerCase() !== 'admin' && (
                                    <button
                                      type="button"
                                      onClick={() => lidarComExcluirMilitarPermanente(p.nick)}
                                      className="text-[10px] font-tactical px-2 py-1 bg-red-950/20 border border-red-900/30 text-red-400 rounded hover:bg-red-950/40 transition-all cursor-pointer"
                                    >
                                      Excluir
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {gSubAba === 'abas_customizadas' && (
                  <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                    {/* List of Custom Tabs */}
                    <div className="xl:col-span-2 bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-4">
                      <h4 className="text-xs font-tactical font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-900 pb-2">
                        Abas Existentes ({(configSite.abasCustomizadas || []).length})
                      </h4>

                      {(configSite.abasCustomizadas || []).length === 0 ? (
                        <div className="p-8 text-center bg-zinc-900/10 border border-dashed border-zinc-900 rounded text-zinc-500 italic text-xs">
                          Nenhuma aba criada ainda. Use o painel ao lado para criar a primeira.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                          {(configSite.abasCustomizadas || []).map((aba) => (
                            <div key={aba.id} className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-lg flex flex-col justify-between gap-3">
                              <div className="space-y-1">
                                <h5 className="text-xs font-bold text-amber-500 uppercase">{aba.titulo}</h5>
                                <div className="text-[10px] text-zinc-400 space-y-0.5">
                                  <p>👁️ Ver: <span className="text-zinc-300">{aba.permissaoVer?.join(', ') || 'Nenhum'}</span></p>
                                  <p>✍️ Postar: <span className="text-zinc-300">{aba.permissaoPostar?.join(', ') || 'Nenhum'}</span></p>
                                  <p>📂 Tipo de Conteúdo: <span className="text-amber-400 font-bold uppercase">{aba.tipoConteudo === 'documento' ? 'Área de Documentos' : aba.tipoConteudo === 'aviso' ? 'Área de Avisos' : 'Ambos'}</span></p>
                                </div>
                              </div>

                              <div className="flex gap-2 border-t border-zinc-900/60 pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditIdAba(aba.id);
                                    setTituloAba(aba.titulo);
                                    setPermVerAba(aba.permissaoVer || []);
                                    setPermPostarAba(aba.permissaoPostar || []);
                                    setPermVerGruposAba(aba.gruposPermitidosVer || []);
                                    setPermPostarGruposAba(aba.gruposPermitidosPostar || []);
                                    setTipoConteudoAba(aba.tipoConteudo || 'ambos');
                                  }}
                                  className="text-[10px] font-tactical px-2.5 py-1 bg-amber-950/25 hover:bg-amber-950/40 border border-amber-900/30 text-amber-400 rounded transition-all cursor-pointer"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => lidarComExcluirAbaCustomizada(aba.id)}
                                  className="text-[10px] font-tactical px-2.5 py-1 bg-red-950/25 hover:bg-red-950/40 border border-red-900/30 text-red-400 rounded transition-all cursor-pointer"
                                >
                                  Excluir
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Create/Edit Form */}
                    <form onSubmit={lidarComSalvarAbaCustomizada} className="xl:col-span-3 bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-4">
                      <h4 className="text-xs font-tactical font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-900 pb-2 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-amber-500" />
                        {editIdAba ? 'EDITAR ABA DE SETOR' : 'CRIAR NOVA ABA DE SETOR'}
                      </h4>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block">
                            Título da Aba (Ex: AREA DE AVISOS, AREA DE DOCUMENTOS)
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: ÁREA DE AVISOS"
                            value={tituloAba}
                            onChange={(e) => setTituloAba(e.target.value)}
                            required
                            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2.5 rounded focus:border-amber-500 outline-none transition-all font-tactical"
                          />
                        </div>

                        {/* Allowed Content Type Selection */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-tactical uppercase tracking-wider block font-bold">
                            📂 Tipo de Conteúdo Disponível na Aba
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setTipoConteudoAba('aviso')}
                              className={`p-3 border text-left rounded-lg transition-all cursor-pointer flex flex-col justify-between h-20 ${
                                tipoConteudoAba === 'aviso'
                                  ? 'bg-amber-950/20 border-amber-500 text-amber-400'
                                  : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                              }`}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wider">Área de Avisos</span>
                              <span className="text-[9px] text-zinc-500 leading-tight">Poste apenas comunicados rápidos em feed contínuo (igual mural).</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setTipoConteudoAba('documento')}
                              className={`p-3 border text-left rounded-lg transition-all cursor-pointer flex flex-col justify-between h-20 ${
                                tipoConteudoAba === 'documento'
                                  ? 'bg-amber-950/20 border-amber-500 text-amber-400'
                                  : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                              }`}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wider">Área de Documentos</span>
                              <span className="text-[9px] text-zinc-500 leading-tight">Poste manuais e diretrizes com botão para visualizar dossiê.</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setTipoConteudoAba('ambos')}
                              className={`p-3 border text-left rounded-lg transition-all cursor-pointer flex flex-col justify-between h-20 ${
                                tipoConteudoAba === 'ambos'
                                  ? 'bg-amber-950/20 border-amber-500 text-amber-400'
                                  : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                              }`}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wider">Ambos (Mural & Docs)</span>
                              <span className="text-[9px] text-zinc-500 leading-tight">Permite alternar entre comunicados e documentos oficiais.</span>
                            </button>
                          </div>
                        </div>

                        {/* Viewing Permissions Checklist */}
                        <div className="space-y-2">
                          <label className="text-[10px] text-zinc-400 font-tactical uppercase tracking-widest block font-bold">
                            👁️ Quem pode VISUALIZAR esta aba?
                          </label>
                          <div className="p-3 bg-zinc-950 border border-zinc-900 rounded max-h-48 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2">
                            <label className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={permVerAba.includes('todos')}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setPermVerAba(['todos']);
                                  } else {
                                    setPermVerAba([]);
                                  }
                                }}
                                className="rounded border-zinc-850 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-950 cursor-pointer"
                              />
                              <span className="font-bold text-amber-500 uppercase">Todos os Cargos</span>
                            </label>

                            {Array.from(new Set(patentes.map(p => p.nome))).concat(['Diretor']).filter(Boolean).map(cargoName => (
                              <label key={'ver_' + cargoName} className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  disabled={permVerAba.includes('todos')}
                                  checked={permVerAba.includes(cargoName)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setPermVerAba(prev => prev.filter(x => x !== 'todos').concat(cargoName));
                                    } else {
                                      setPermVerAba(prev => prev.filter(x => x !== cargoName));
                                    }
                                  }}
                                  className="rounded border-zinc-850 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-950 cursor-pointer disabled:opacity-50"
                                />
                                <span>{cargoName}</span>
                              </label>
                            ))}
                          </div>

                          {/* Viewing Group Permissions Checklist */}
                          <div className="mt-2 pt-2 border-t border-zinc-900">
                            <label className="text-[10px] text-emerald-400 font-tactical uppercase tracking-wider block font-bold mb-1">
                              👥 Grupos permitidos para VISUALIZAR:
                            </label>
                            <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded max-h-36 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-1.5">
                              {grupos.length === 0 ? (
                                <span className="text-[10px] text-zinc-500 italic col-span-2">Nenhum grupo cadastrado</span>
                              ) : (
                                grupos.map(grp => (
                                  <label key={'ver_grp_' + grp.id} className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={permVerGruposAba.includes(grp.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setPermVerGruposAba(prev => [...prev, grp.id]);
                                        } else {
                                          setPermVerGruposAba(prev => prev.filter(x => x !== grp.id));
                                        }
                                      }}
                                      className="rounded border-zinc-850 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-950 cursor-pointer"
                                    />
                                    <span>{grp.nome}</span>
                                  </label>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Posting Permissions Checklist */}
                        <div className="space-y-2">
                          <label className="text-[10px] text-zinc-400 font-tactical uppercase tracking-widest block font-bold">
                            ✍️ Quem pode POSTAR nesta aba?
                          </label>
                          <div className="p-3 bg-zinc-950 border border-zinc-900 rounded max-h-48 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2">
                            <label className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={permPostarAba.includes('todos')}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setPermPostarAba(['todos']);
                                  } else {
                                    setPermPostarAba([]);
                                  }
                                }}
                                className="rounded border-zinc-850 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-950 cursor-pointer"
                              />
                              <span className="font-bold text-amber-500 uppercase">Todos os Cargos</span>
                            </label>

                            {Array.from(new Set(patentes.map(p => p.nome))).concat(['Diretor']).filter(Boolean).map(cargoName => (
                              <label key={'post_' + cargoName} className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  disabled={permPostarAba.includes('todos')}
                                  checked={permPostarAba.includes(cargoName)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setPermPostarAba(prev => prev.filter(x => x !== 'todos').concat(cargoName));
                                    } else {
                                      setPermPostarAba(prev => prev.filter(x => x !== cargoName));
                                    }
                                  }}
                                  className="rounded border-zinc-850 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-950 cursor-pointer disabled:opacity-50"
                                />
                                <span>{cargoName}</span>
                              </label>
                            ))}
                          </div>

                          {/* Posting Group Permissions Checklist */}
                          <div className="mt-2 pt-2 border-t border-zinc-900">
                            <label className="text-[10px] text-emerald-400 font-tactical uppercase tracking-wider block font-bold mb-1">
                              👥 Grupos permitidos para POSTAR:
                            </label>
                            <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded max-h-36 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-1.5">
                              {grupos.length === 0 ? (
                                <span className="text-[10px] text-zinc-500 italic col-span-2">Nenhum grupo cadastrado</span>
                              ) : (
                                grupos.map(grp => (
                                  <label key={'post_grp_' + grp.id} className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={permPostarGruposAba.includes(grp.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setPermPostarGruposAba(prev => [...prev, grp.id]);
                                        } else {
                                          setPermPostarGruposAba(prev => prev.filter(x => x !== grp.id));
                                        }
                                      }}
                                      className="rounded border-zinc-850 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-950 cursor-pointer"
                                    />
                                    <span>{grp.nome}</span>
                                  </label>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-zinc-900/60">
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-gradient-to-r from-amber-950 via-amber-800 to-amber-950 text-white font-tactical font-bold text-xs tracking-wider uppercase rounded hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center gap-2 border border-amber-700/30"
                        >
                          <Save className="w-4 h-4" />
                          {editIdAba ? 'Salvar Alterações' : 'Criar Aba de Setor'}
                        </button>
                        {editIdAba && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditIdAba(null);
                              setTituloAba('');
                              setPermVerAba(['todos']);
                              setPermPostarAba([]);
                              setTipoConteudoAba('ambos');
                            }}
                            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-tactical font-bold text-xs tracking-wider uppercase rounded transition-all cursor-pointer"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                )}

                {gSubAba === 'backup' && (
                  <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 space-y-6">
                    <div className="border-b border-zinc-900 pb-3 flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-tactical font-bold text-zinc-300 tracking-wider uppercase flex items-center gap-2">
                          <Sliders className="w-5 h-5 text-amber-500 animate-pulse" />
                          Configuração de Backups Automáticos via Webhook
                        </h4>
                        <p className="text-xs text-zinc-500 font-tactical mt-1 leading-relaxed">
                          O sistema executa backups completos e automáticos do banco de dados a cada 7 horas e os envia como arquivos anexos JSON para o canal do Discord configurado abaixo.
                        </p>
                      </div>
                    </div>

                    <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-lg p-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-tactical font-bold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-amber-500 rounded-full" />
                          Webhook do Discord para Backup (.json)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={gWebhookBackup}
                            onChange={(e) => setGWebhookBackup(e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="flex-1 bg-zinc-950 border border-zinc-900 text-xs text-zinc-100 px-3 py-2 rounded focus:border-amber-500 outline-none transition-all font-tactical"
                          />
                          <button
                            type="button"
                            onClick={lidarComSalvarWebhookBackup}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-tactical font-bold uppercase rounded cursor-pointer transition-all animate-pulse"
                          >
                            Salvar
                          </button>
                        </div>
                        <span className="text-[10px] text-zinc-600 font-tactical block leading-relaxed pt-1">
                          A URL do Webhook do Discord é salva nas configurações gerais e sincronizada com o banco de dados do Supabase.
                        </span>
                      </div>
                    </div>

                    <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-lg p-4 space-y-4">
                      <h5 className="text-xs font-tactical font-bold text-zinc-300 uppercase tracking-wider">
                        Ações & Status de Backup
                      </h5>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-zinc-950/60 border border-zinc-900 rounded">
                        <div className="space-y-1">
                          <div className="text-[11px] text-zinc-400 font-tactical">
                            Último backup enviado com sucesso:
                          </div>
                          <div className="text-xs text-amber-500 font-bold font-tactical">
                            {configSite.ultimoBackup ? new Date(configSite.ultimoBackup).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Nunca realizado (Aguardando configuração)'}
                          </div>
                          <div className="text-[10px] text-zinc-600 font-tactical">
                            Intervalo automático: 7 em 7 horas (Gerenciado no servidor)
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={sincronizandoBackup || !gWebhookBackup}
                          onClick={lidarComDispararBackupManual}
                          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 disabled:opacity-50 text-xs font-tactical font-bold uppercase rounded cursor-pointer transition-all flex items-center justify-center gap-2"
                        >
                          {sincronizandoBackup ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              Disparar Backup Manual
                            </>
                          )}
                        </button>
                      </div>

                      {msgBackupSucesso && (
                        <div className="p-3 bg-emerald-950/20 border border-emerald-900 rounded text-emerald-400 text-[11px] font-sans">
                          {msgBackupSucesso}
                        </div>
                      )}
                      {msgBackupErro && (
                        <div className="p-3 bg-red-950/20 border border-red-900 rounded text-red-400 text-[11px] font-sans">
                          {msgBackupErro}
                        </div>
                      )}
                    </div>
                  </div>
                )}


              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* CATEGORIA MODAL RENDER */}
      <AnimatePresence>
        {modalCategoriaAberto && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-900 rounded-lg max-w-md w-full shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950">
                <h3 className="text-xs font-tactical font-bold tracking-wider text-zinc-100 uppercase">
                  {categoriaEditando ? 'EDITAR CATEGORIA / CARREIRA' : 'NOVA CATEGORIA / CARREIRA'}
                </h3>
                <button
                  onClick={() => setModalCategoriaAberto(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-xs font-mono border border-zinc-900 bg-zinc-900/50 hover:bg-zinc-900 px-2 py-1 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={lidarComSalvarCategoria} className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] text-zinc-500 font-tactical mb-1 uppercase tracking-wider">Nome da Categoria</label>
                  <input
                    type="text"
                    value={categoriaNome}
                    onChange={(e) => setCategoriaNome(e.target.value)}
                    placeholder="Ex: Hierarquia Militar, Oficiais, Praças"
                    className="w-full bg-zinc-900/30 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 rounded focus:border-red-600 outline-none font-tactical"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 font-tactical mb-1 uppercase tracking-wider">Subtítulo ou Divisão (Opcional)</label>
                  <input
                    type="text"
                    value={categoriaSubtitulo}
                    onChange={(e) => setCategoriaSubtitulo(e.target.value)}
                    placeholder="Ex: Corpo de Oficiais, Corpo de Praças"
                    className="w-full bg-zinc-900/30 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 rounded focus:border-red-600 outline-none font-tactical"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 font-tactical mb-1 uppercase tracking-wider">Ordem de Exibição / Hierarquia</label>
                  <input
                    type="number"
                    value={categoriaOrdem}
                    onChange={(e) => setCategoriaOrdem(e.target.value)}
                    placeholder="Ex: 1, 2, 3..."
                    className="w-full bg-zinc-900/30 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 rounded focus:border-red-600 outline-none font-tactical"
                    min={1}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-red-950 via-red-800 to-red-950 text-white font-tactical font-semibold text-xs tracking-wider rounded hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>SALVAR CATEGORIA</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PATENTE MODAL RENDER */}
      <AnimatePresence>
        {modalPatenteAberto && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-900 rounded-lg max-w-lg w-full shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950">
                <h3 className="text-xs font-tactical font-bold tracking-wider text-zinc-100 uppercase">
                  {patenteEditando ? 'EDITAR PATENTE / CARGO' : 'NOVA PATENTE / CARGO'}
                </h3>
                <button
                  onClick={() => setModalPatenteAberto(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-xs font-mono border border-zinc-900 bg-zinc-900/50 hover:bg-zinc-900 px-2 py-1 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={lidarComSalvarPatente} className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-zinc-500 font-tactical mb-1 uppercase tracking-wider">Nome da Patente</label>
                    <input
                      type="text"
                      value={patenteNome}
                      onChange={(e) => setPatenteNome(e.target.value)}
                      placeholder="Ex: Soldado, Major, Coronel"
                      className="w-full bg-zinc-900/30 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 rounded focus:border-red-600 outline-none font-tactical"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 font-tactical mb-1 uppercase tracking-wider">Insignia / Estrelas</label>
                    <input
                      type="text"
                      value={patenteInsignia}
                      onChange={(e) => setPatenteInsignia(e.target.value)}
                      placeholder="Ex: ■ ■, ★ ★ ★, ✦"
                      className="w-full bg-zinc-900/30 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 rounded focus:border-red-600 outline-none font-tactical"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-zinc-500 font-tactical mb-1 uppercase tracking-wider">Equivalente Acadêmico/Profissional</label>
                    <input
                      type="text"
                      value={patenteEquivalente}
                      onChange={(e) => setPatenteEquivalente(e.target.value)}
                      placeholder="Ex: Estagiário, Coordenador"
                      className="w-full bg-zinc-900/30 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 rounded focus:border-red-600 outline-none font-tactical"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 font-tactical mb-1 uppercase tracking-wider">Valor do cargo / Salário (Opcional)</label>
                    <input
                      type="text"
                      value={patenteSalario}
                      onChange={(e) => setPatenteSalario(e.target.value)}
                      placeholder="Ex: 20c, 50c, R$ 1.500"
                      className="w-full bg-zinc-900/30 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 rounded focus:border-red-600 outline-none font-tactical"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 font-tactical mb-1 uppercase tracking-wider">Atribuições e Responsabilidades</label>
                  <textarea
                    rows={3}
                    value={patenteResponsabilidade}
                    onChange={(e) => setPatenteResponsabilidade(e.target.value)}
                    placeholder="Descreva as atribuições oficiais desta patente..."
                    className="w-full bg-zinc-900/30 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 rounded focus:border-red-600 outline-none font-tactical resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-red-950 via-red-800 to-red-950 text-white font-tactical font-semibold text-xs tracking-wider rounded hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>SALVAR PATENTE</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GRUPOS MODAL RENDER */}
      <AnimatePresence>
        {modalGrupoAberto && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950 sticky top-0 z-10">
                <h3 className="text-xs font-tactical font-bold tracking-wider text-zinc-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-red-500" />
                  {grupoEditando ? 'GERENCIAR GRUPO / DEPARTAMENTO' : 'CRIAR NOVO GRUPO / DEPARTAMENTO'}
                </h3>
                <button
                  onClick={fecharModalGrupo}
                  className="text-zinc-500 hover:text-zinc-300 text-xs font-mono border border-zinc-900 bg-zinc-900/50 hover:bg-zinc-900 px-2 py-1 rounded cursor-pointer transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-6 flex-1">
                {msgGrupoErro && (
                  <div className="bg-red-950/30 border border-red-900/40 rounded p-3 text-xs text-red-400 font-tactical flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{msgGrupoErro}</span>
                  </div>
                )}
                {msgGrupoSucesso && (
                  <div className="bg-green-950/30 border border-green-900/40 rounded p-3 text-xs text-green-400 font-tactical flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    <span>{msgGrupoSucesso}</span>
                  </div>
                )}

                <form onSubmit={lidarComSalvarGrupo} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-tactical mb-1 uppercase tracking-wider">Nome do Grupo</label>
                      <input
                        type="text"
                        value={grupoNome}
                        onChange={(e) => setGrupoNome(e.target.value)}
                        placeholder="Ex: A.R.C.A.N.O.S"
                        className="w-full bg-zinc-900/30 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 rounded focus:border-red-600 outline-none font-tactical"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-tactical mb-1 uppercase tracking-wider">Sigla do Grupo</label>
                      <input
                        type="text"
                        value={grupoSigla}
                        onChange={(e) => setGrupoSigla(e.target.value)}
                        placeholder="Ex: A.R.C"
                        className="w-full bg-zinc-900/30 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 rounded focus:border-red-600 outline-none font-tactical"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 font-tactical mb-1 uppercase tracking-wider">Descrição do Grupo</label>
                    <textarea
                      value={grupoDescricao}
                      onChange={(e) => setGrupoDescricao(e.target.value)}
                      placeholder="Descreva a finalidade, requisitos, e regulamento básico..."
                      className="w-full h-20 bg-zinc-900/30 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 rounded focus:border-red-600 outline-none resize-none font-tactical"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 font-tactical mb-1 uppercase tracking-wider">Emblema Habbo (Código ou Link)</label>
                    <input
                      type="text"
                      value={grupoUrlImagem}
                      onChange={(e) => setGrupoUrlImagem(e.target.value)}
                      placeholder="Ex: b26134s36244s44104s41014s06014801bbd65ce6922"
                      className="w-full bg-zinc-900/30 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 rounded focus:border-red-600 outline-none font-tactical"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-3 bg-zinc-900/20 p-3 rounded border border-zinc-900">
                      <input
                        type="checkbox"
                        id="grupoPublico"
                        checked={grupoPublico}
                        onChange={(e) => setGrupoPublico(e.target.checked)}
                        className="w-4 h-4 text-red-600 accent-red-600 border-zinc-800 rounded cursor-pointer"
                      />
                      <label htmlFor="grupoPublico" className="text-xs text-zinc-300 font-tactical cursor-pointer select-none">
                        <span className="font-semibold block">Grupo Público</span>
                        <span className="text-[10px] text-zinc-500">Membros podem ver o grupo</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-3 bg-zinc-900/20 p-3 rounded border border-zinc-900">
                      <input
                        type="checkbox"
                        id="grupoAceitaMembros"
                        checked={grupoAceitaMembros}
                        onChange={(e) => setGrupoAceitaMembros(e.target.checked)}
                        className="w-4 h-4 text-red-600 accent-red-600 border-zinc-800 rounded cursor-pointer"
                      />
                      <label htmlFor="grupoAceitaMembros" className="text-xs text-zinc-300 font-tactical cursor-pointer select-none">
                        <span className="font-semibold block">Aceita Membros</span>
                        <span className="text-[10px] text-zinc-500">Permitir entrada de militares</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-red-950 via-red-800 to-red-950 text-white font-tactical font-semibold text-xs tracking-wider rounded hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{grupoEditando ? 'SALVAR DETALHES DO GRUPO' : 'CRIAR GRUPO'}</span>
                  </button>
                </form>

                {grupoEditando && (
                  <div className="pt-6 border-t border-zinc-900/80 space-y-4">
                    <span className="text-xs font-tactical font-bold text-zinc-300 tracking-wider flex items-center gap-1.5 uppercase">
                      MEMBROS E INTEGRANTES ({grupoEditando.membros.length})
                    </span>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={novoMembroNick}
                        onChange={(e) => setNovoMembroNick(e.target.value)}
                        placeholder="Nick do militar para adicionar..."
                        className="flex-1 bg-zinc-900/30 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 rounded focus:border-red-600 outline-none font-tactical"
                      />
                      <button
                        type="button"
                        onClick={adicionarMembroAoGrupo}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-200 text-xs font-tactical font-semibold tracking-wider rounded cursor-pointer transition-all"
                      >
                        ADICIONAR
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {grupoEditando.membros.map((membro) => {
                        const mLower = membro.toLowerCase().trim();
                        const infoMembro = policiais[mLower];
                        const av = infoMembro ? infoMembro.avatarHabbo : membro;
                        const carg = infoMembro ? infoMembro.cargo : 'Membro';

                        return (
                          <div key={membro} className="bg-zinc-900/10 border border-zinc-900 p-2 rounded flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 bg-zinc-900/60 border border-zinc-850 rounded flex items-center justify-center overflow-hidden shrink-0">
                                <img
                                  src={obterAvatarUrl(infoMembro, 's', av)}
                                  alt={membro}
                                  referrerPolicy="no-referrer"
                                  className="scale-125 translate-y-1"
                                />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs text-zinc-200 font-medium block truncate font-tactical">{membro}</span>
                                <span className="text-[9px] text-zinc-500 font-tactical block leading-none uppercase truncate">{carg}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removerMembroDoGrupo(membro)}
                              className="text-red-500/80 hover:text-red-400 p-1 bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 hover:border-red-600 rounded transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM DELETE CONFIRMATION DIALOG (Anti-browser prompt requirement) */}
      {/* MODAL DIÁLOGO GENÉRICO DO SITE (CONFIRM / ALERT / PROMPT) */}
      <AnimatePresence>
        {modalDialog?.mostrar && (
          <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-md w-full shadow-2xl p-6 text-white relative overflow-hidden"
            >
              {/* Top Accent Line */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                modalDialog.tipo === 'confirm'
                  ? 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600'
                  : modalDialog.tipo === 'prompt'
                  ? 'bg-gradient-to-r from-blue-600 via-amber-500 to-blue-600'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-600'
              }`} />

              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg border shrink-0 ${
                  modalDialog.tipo === 'confirm'
                    ? 'bg-red-950/40 border-red-800/60 text-red-400'
                    : modalDialog.tipo === 'prompt'
                    ? 'bg-blue-950/40 border-blue-800/60 text-blue-400'
                    : 'bg-amber-950/40 border-amber-800/60 text-amber-400'
                }`}>
                  {modalDialog.tipo === 'confirm' && <AlertTriangle className="w-6 h-6" />}
                  {modalDialog.tipo === 'prompt' && <HelpCircle className="w-6 h-6" />}
                  {modalDialog.tipo === 'alert' && <ShieldAlert className="w-6 h-6" />}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-tactical font-bold text-sm tracking-wider uppercase text-zinc-100 mb-1">
                    {modalDialog.titulo || 'MENSAGEM DO SISTEMA'}
                  </h3>
                  <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                    {modalDialog.mensagem}
                  </p>
                </div>
              </div>

              {/* Input if PROMPT */}
              {modalDialog.tipo === 'prompt' && (
                <div className="my-4">
                  <input
                    type="text"
                    value={modalPromptInput}
                    onChange={(e) => setModalPromptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        modalDialog.onConfirmar(modalPromptInput);
                      }
                    }}
                    placeholder={modalDialog.placeholder || 'Digite a informação aqui...'}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors font-sans"
                    autoFocus
                  />
                </div>
              )}

              {/* Modal Buttons */}
              <div className="border-t border-zinc-900/80 pt-4 flex items-center justify-end gap-3 mt-2">
                {(modalDialog.tipo === 'confirm' || modalDialog.tipo === 'prompt') && (
                  <button
                    type="button"
                    onClick={() => modalDialog.onCancelar ? modalDialog.onCancelar() : setModalDialog(null)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded font-tactical font-semibold text-xs tracking-wider transition-all cursor-pointer uppercase"
                  >
                    {modalDialog.textoCancelar || 'CANCELAR'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => modalDialog.onConfirmar(modalDialog.tipo === 'prompt' ? modalPromptInput : undefined)}
                  className={`px-4 py-2 rounded font-tactical font-semibold text-xs tracking-wider border shadow-md transition-all cursor-pointer uppercase ${
                    modalDialog.tipo === 'confirm'
                      ? 'bg-gradient-to-r from-red-950 to-red-800 hover:from-red-900 hover:to-red-700 border-red-900 text-white shadow-red-950/50'
                      : modalDialog.tipo === 'prompt'
                      ? 'bg-gradient-to-r from-blue-950 to-blue-800 hover:from-blue-900 hover:to-blue-700 border-blue-900 text-white shadow-blue-950/50'
                      : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border-amber-500 text-black font-bold'
                  }`}
                >
                  {modalDialog.textoConfirmar || 'CONFIRMAR'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-6 border-t border-zinc-900/50 bg-zinc-950/40 text-center text-[11px] text-zinc-600 px-4 mt-8">
        <p className="max-w-2xl mx-auto leading-relaxed font-tactical">
          Este site não possui vínculo com o Habbo Hotel, Habblet ou com qualquer corporação policial ou militar real. Trata-se exclusivamente de um jogo de simulação virtual (RPG).
          <br />
          Polícia CIA © 2026 todos os direitos reservados. Conectado como @{policial.nick}.
        </p>
      </footer>
    </div>
  );
}
