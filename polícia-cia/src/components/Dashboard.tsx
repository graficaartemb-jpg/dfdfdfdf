import React, { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, User, FileText, Users, Shield, ShieldCheck, LogOut,
  Activity, UserPlus, Search, Medal, Plus, Trash2, Edit,
  ChevronDown, ChevronUp, Save, PlusCircle, MinusCircle,
  ArrowUp, ArrowDown, Award, AlertTriangle, CheckCircle,
  Send, Calendar, DollarSign, Briefcase, HelpCircle, Flame, History,
  BookOpen, GraduationCap, ArrowLeft, Check, X,
  RotateCcw, RotateCw, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent, Quote, Minus, Code, Eraser,
  Link, Image, Video, Table, FileUp, Eye, EyeOff, Sliders, Trophy, ArrowUpDown
} from 'lucide-react';
import {
  obterAvisos, criarAviso, obterPoliciais, alterarPatentePolicial,
  adicionarPontos, obterMovimentacoes, obterCategorias, salvarCategoria,
  excluirCategoria, obterPatentes, salvarPatente, excluirPatente,
  obterGrupos, salvarGrupo, excluirGrupo, atualizarPerfilPolicial,
  obterTreinamentos, salvarTreinamento, excluirTreinamento,
  obterAplicacoesTreinamentos, salvarAplicacaoTreinamento, excluirAplicacaoTreinamento,
  obterEnviosXP, salvarEnvioXP, excluirEnvioXP
} from '../lib/db';
import { Policial, PatenteCategoria, Patente, Aviso, Movimentacao, Grupo, Treinamento, AplicacaoTreinamento, EnvioXP } from '../types';

interface DashboardProps {
  policialInicial: Policial;
  onLogout: () => void;
}

export default function Dashboard({ policialInicial, onLogout }: DashboardProps) {
  const [policial, setPolicial] = useState<Policial>(policialInicial);
  const [abaAtiva, setAbaAtiva] = useState<'inicio' | 'perfil' | 'avisos' | 'promocao' | 'hierarquia' | 'grupos' | 'aulas' | 'xp'>('inicio');
  const [gestaoAberta, setGestaoAberta] = useState(true);

  // Lists from DB
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [policiais, setPoliciais] = useState<Record<string, Policial>>({});
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [categorias, setCategorias] = useState<PatenteCategoria[]>([]);
  const [patentes, setPatentes] = useState<Patente[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);

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
  const [modoEdicaoTexto, setModoEdicaoTexto] = useState<'visual' | 'codigo'>('visual');
  const [previewAtivo, setPreviewAtivo] = useState(false);
  const editorRef = React.useRef<HTMLDivElement>(null);

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

  const handleInsertLink = () => {
    const url = prompt('Digite a URL do link:');
    if (url) {
      executarComandoEditor('createLink', url);
    }
  };

  const handleInsertImage = () => {
    const url = prompt('Digite a URL da imagem:');
    if (url) {
      executarComandoEditor('insertImage', url);
    }
  };

  const handleInsertYouTube = () => {
    const url = prompt('Digite o link do vídeo do YouTube ou ID do vídeo:');
    if (url) {
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/);
      const videoId = match ? match[1] : url;
      const iframeHTML = `<div class="my-4 aspect-video max-w-xl mx-auto"><iframe src="https://www.youtube.com/embed/${videoId}" class="w-full h-full rounded border border-zinc-800" allowfullscreen></iframe></div>`;
      executarComandoEditor('insertHTML', iframeHTML);
    }
  };

  const handleInsertTable = () => {
    const rows = parseInt(prompt('Número de linhas:', '3') || '0');
    const cols = parseInt(prompt('Número de colunas:', '2') || '0');
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

  const handleImportHTML = () => {
    const html = prompt('Cole o código HTML que deseja importar:');
    if (html) {
      executarComandoEditor('insertHTML', html);
    }
  };

  const handleLineHeight = () => {
    const height = prompt('Digite a altura da linha (ex: 1.5, 2, normal):', '1.5');
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

  // Mural Form states
  const [avisoTitulo, setAvisoTitulo] = useState('');
  const [avisoConteudo, setAvisoConteudo] = useState('');
  const [avisoTipo, setAvisoTipo] = useState<'urgente' | 'promocao' | 'geral'>('geral');
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

  const listaPoliciais = Object.values(policiais) as Policial[];

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
  };

  const lidarComSalvarPerfil = (e: FormEvent) => {
    e.preventDefault();
    setSalvandoPerfil(true);
    try {
      const atualizado = atualizarPerfilPolicial(policial.nick, editBio, editAvatar);
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

    criarAviso(avisoTitulo.trim(), avisoConteudo.trim(), policial.nick, avisoTipo);
    setAvisoTitulo('');
    setAvisoConteudo('');
    setAvisoTipo('geral');
    setMsgAvisoSucesso('Aviso militar publicado no mural!');
    carregarDados();
    setTimeout(() => setMsgAvisoSucesso(''), 4000);
  };

  const assinarLivroPresenca = () => {
    adicionarPontos(policial.nick, 10);
    const updated = obterPoliciais()[policial.nick.toLowerCase().trim()];
    if (updated) {
      updated.presencas += 1;
      const allPols = obterPoliciais();
      allPols[policial.nick.toLowerCase().trim()] = {
        ...allPols[policial.nick.toLowerCase().trim()],
        presencas: updated.presencas
      };
      localStorage.setItem('cia_policiais', JSON.stringify(allPols));
      setPolicial(allPols[policial.nick.toLowerCase().trim()]);
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
    setModalCategoriaAberto(true);
  };

  const abrirEditarCategoria = (c: PatenteCategoria) => {
    setCategoriaEditando(c);
    setCategoriaNome(c.nome);
    setCategoriaSubtitulo(c.subtitulo || '');
    setModalCategoriaAberto(true);
  };

  const lidarComSalvarCategoria = (e: FormEvent) => {
    e.preventDefault();
    if (!categoriaNome.trim()) return;

    const novaCat: PatenteCategoria = {
      id: categoriaEditando ? categoriaEditando.id : 'cat_' + Date.now().toString(),
      nome: categoriaNome.trim(),
      subtitulo: categoriaSubtitulo.trim() || undefined
    };

    salvarCategoria(novaCat);
    setModalCategoriaAberto(false);
    carregarDados();
  };

  const lidarComExcluirCategoria = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria? Todas as patentes dentro dela serão removidas.')) {
      excluirCategoria(id);
      carregarDados();
    }
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
    if (confirm('Tem certeza que deseja excluir esta patente?')) {
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

    if (!xpMotivo.trim()) {
      setMsgXPErro('O motivo é obrigatório.');
      return;
    }
    if (xpDestinatarios.length === 0) {
      setMsgXPErro('Selecione pelo menos um militar destinatário.');
      return;
    }
    const valorNum = parseInt(xpValor, 10);
    if (isNaN(valorNum) || valorNum <= 0) {
      setMsgXPErro('O valor de XP deve ser um número maior que zero.');
      return;
    }

    if (editandoXP) {
      const envioAtualizado: EnvioXP = {
        ...editandoXP,
        motivo: xpMotivo,
        valor: valorNum,
        destinatarios: xpDestinatarios,
      };
      salvarEnvioXP(envioAtualizado);
      setMsgXPSucesso('Envio de XP atualizado com sucesso!');
    } else {
      // Add points to each recipient
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
      setMsgXPSucesso('XP enviado com sucesso aos destinatários!');
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
    excluirEnvioXP(id);
    carregarDados();
    setMsgXPSucesso('Registro de XP excluído com sucesso.');
    setTimeout(() => setMsgXPSucesso(''), 4000);
  };

  // Save or Update Training
  const lidarComSalvarTreinamento = (e: FormEvent) => {
    e.preventDefault();
    if (!treinoTitulo.trim()) {
      alert('O título do treinamento é obrigatório.');
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
      permissoesCargos: treinoPermissoes
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
    if (confirm('Tem certeza que deseja excluir este treinamento? Todas as aplicações vinculadas continuarão no histórico.')) {
      excluirTreinamento(id);
      if (treinamentoSelecionado && treinamentoSelecionado.id === id) {
        setTreinamentoSelecionado(null);
      }
      carregarDados();
    }
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
      instrutor: policial.nick,
      data: new Date().toLocaleString('pt-BR'),
      alunos: novaAppAlunos.map(al => ({
        nick: al.nick,
        status: al.status,
        vinculado: false
      })),
      observacoes: novaAppObs
    };

    salvarAplicacaoTreinamento(novaApp);

    novaAppAlunos.forEach(al => {
      if (al.status === 'aprovado') {
        adicionarPontos(al.nick, 25);
      }
    });

    setNovaAppAlunos([]);
    setNovaAppObs('');
    setMostrarFormAplicacao(false);
    setAppMsgSucesso('Aplicação registrada com sucesso! Alunos aprovados receberam +25 pontos de promoção.');
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
      alert(`Cargo de ${treino.cargoVinculavel} vinculado com sucesso para o militar ${alunoNick}!`);
      carregarDados();
    } else {
      alert(`Não foi possível vincular o cargo. Verifique se o militar está registrado e se o cargo '${treino.cargoVinculavel}' existe.`);
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
    if (confirm('Tem certeza que deseja excluir este grupo?')) {
      excluirGrupo(id);
      carregarDados();
    }
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

    const membrosAtualizados = grupoEditando.membros.filter(m => m !== membroNick);
    const grupoAtualizado = { ...grupoEditando, membros: membrosAtualizados };

    salvarGrupo(grupoAtualizado);
    setGrupoEditando(grupoAtualizado);
    setMsgGrupoSucesso(`Membro ${membroNick} removido do grupo!`);
    carregarDados();
    setTimeout(() => setMsgGrupoSucesso(''), 3000);
  };

  const obterBadgeUrl = (urlOrCode: string) => {
    if (!urlOrCode || urlOrCode.trim() === '') {
      return 'https://www.habbo.com.br/habbo-imaging/badge/b26134s36244s44104s41014s06014801bbd65ce6922.gif';
    }
    if (urlOrCode.startsWith('http://') || urlOrCode.startsWith('https://')) {
      return urlOrCode;
    }
    return `https://www.habbo.com.br/habbo-imaging/badge/${urlOrCode}.gif`;
  };

  // Universal checks
  const eAdmin = policial.nick.toLowerCase() === 'diretor_almeida' || policial.cargo === 'Diretor';

  return (
    <div className="min-h-screen bg-vignette text-zinc-100 flex flex-col custom-scrollbar selection:bg-red-800 selection:text-white font-sans">
      {/* Top Bar Navigation */}
      <header className="bg-zinc-950/90 border-b border-zinc-900 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border border-amber-500 rounded bg-zinc-900 flex items-center justify-center text-amber-500 text-sm font-bold font-anton select-none">
            CIA
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-tactical font-semibold tracking-wider text-zinc-100 flex items-center gap-1.5 leading-none">
              <span>POLÍCIA CIA</span>
              <span className="text-xs bg-red-950 border border-red-900 px-1.5 py-0.5 rounded text-red-500 font-mono">
                SISTEMA INTERNO
              </span>
            </h1>
            <p className="text-xs text-zinc-500 font-tactical mt-0.5 tracking-wide">
              Mesa de Operações Integradas • Brasília/DF
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

            <button
              onClick={() => setAbaAtiva('promocao')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-tactical tracking-wide transition-all cursor-pointer text-left ${
                abaAtiva === 'promocao'
                  ? 'bg-gradient-to-r from-red-950/40 via-red-900/20 to-transparent border-l-2 border-red-600 text-zinc-100 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>PROMOÇÃO & REBAIXAMENTO</span>
            </button>

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

            {/* ACCORDION: GESTÃO */}
            <div className="border-t border-zinc-900/60 pt-2 mt-1">
              <button
                onClick={() => setGestaoAberta(!gestaoAberta)}
                className="w-full flex items-center justify-between px-4 py-2 rounded-md text-[11px] font-tactical tracking-wider text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer text-left uppercase"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Daily Presence Button */}
          <div className="pt-4 mt-2 border-t border-zinc-900">
            {!assinouPresenca ? (
              <button
                onClick={assinarLivroPresenca}
                className="w-full py-2.5 bg-gradient-to-r from-amber-950/30 to-amber-900/30 border border-amber-900/50 hover:border-amber-600/80 text-amber-500 hover:text-amber-400 font-tactical text-xs font-semibold tracking-wider rounded-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Flame className="w-4 h-4 animate-bounce" />
                ASSINAR ATA DIÁRIA
              </button>
            ) : (
              <div className="text-center py-2 px-2 bg-green-950/10 border border-green-900/30 rounded-md">
                <p className="text-[11px] text-green-500 font-tactical font-medium">✓ PRESENÇA REGISTRADA HOJE</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Retorne amanhã para assinar novamente</p>
              </div>
            )}
            {msgPresenca && (
              <p className="text-[10px] text-amber-500 font-mono mt-1 text-center animate-pulse">{msgPresenca}</p>
            )}
          </div>
        </aside>

        {/* Workspace Display Area */}
        <section className="lg:col-span-3 bg-zinc-950/30 border border-zinc-900 rounded-lg p-5 sm:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <AnimatePresence mode="wait">
            {/* TAB: INÍCIO / PAINEL */}
            {abaAtiva === 'inicio' && (
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
                        {Math.max(3, Object.keys(policiais).length)}
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
                          src={`https://www.habbo.com/habbo-imaging/avatarimage?user=${policial.avatarHabbo}&direction=3&head_direction=3&gesture=sml&size=s`}
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
                        src={`https://www.habbo.com/habbo-imaging/avatarimage?user=${policial.avatarHabbo}&direction=3&head_direction=3&gesture=sml&size=m`}
                        alt="Avatar Welcome"
                        referrerPolicy="no-referrer"
                        className="scale-125 translate-y-1"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-zinc-400 font-tactical block">Bem-vindo(a),</span>
                      <span className="text-lg font-tactical font-bold text-amber-500 block leading-tight mt-0.5">{policial.nick}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">Status: Ativo em serviço</span>
                    </div>
                  </div>
                </div>

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
                                setMilitarSelecionado(p);
                                setBuscaMilitar('');
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-zinc-900/50 flex items-center justify-between transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center">
                                  <img
                                    src={`https://www.habbo.com/habbo-imaging/avatarimage?user=${p.avatarHabbo}&direction=3&head_direction=3&gesture=sml&size=s`}
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
                              src={`https://www.habbo.com/habbo-imaging/avatarimage?user=${militarSelecionado.avatarHabbo}&direction=3&head_direction=3&gesture=sml&size=l`}
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
                      src={`https://www.habbo.com/habbo-imaging/avatarimage?user=${policial.avatarHabbo}&direction=3&head_direction=3&gesture=sml&size=l`}
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
                        <textarea
                          rows={2}
                          placeholder="Conteúdo oficial da Ordem de Serviço ou Comunicado..."
                          value={avisoConteudo}
                          onChange={(e) => setAvisoConteudo(e.target.value)}
                          className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-red-600 text-zinc-200 font-tactical px-3 py-2 rounded text-xs outline-none transition-all placeholder:text-zinc-700"
                          required
                        />
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

                        if (aviso.tipo === 'urgente') {
                          colorClasses = 'border-red-900/50 bg-red-950/5';
                          headerTag = '★ CRÍTICO / COMUNICADO URGENTE ★';
                          tagColor = 'text-red-500 bg-red-950/30 border border-red-900/30';
                        } else if (aviso.tipo === 'promocao') {
                          colorClasses = 'border-amber-900/50 bg-amber-950/5';
                          headerTag = 'COMUNICADO DE PATENTES';
                          tagColor = 'text-amber-500 bg-amber-950/30 border border-amber-900/30';
                        }

                        return (
                          <div
                            key={aviso.id}
                            className={`border rounded-lg p-4 transition-all hover:scale-[1.005] duration-200 ${colorClasses}`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-tactical font-bold px-2 py-0.5 rounded ${tagColor}`}>
                                  {headerTag}
                                </span>
                                <h4 className="text-sm font-tactical font-semibold text-zinc-100">{aviso.titulo}</h4>
                              </div>
                              <span className="text-[10px] font-mono text-zinc-500">{aviso.data}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-tactical">
                              {aviso.conteudo}
                            </p>
                            <div className="mt-3 pt-2.5 border-t border-zinc-900/50 flex justify-between items-center">
                              <span className="text-[10px] text-zinc-600 font-mono">ID: #{aviso.id}</span>
                              <span className="text-xs text-zinc-400 font-tactical flex items-center gap-1">
                                Autorizado por:{' '}
                                <span className="text-red-500 font-medium">@{aviso.autor}</span>
                              </span>
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
                                  src={`https://www.habbo.com/habbo-imaging/avatarimage?user=${p.avatarHabbo}&head_direction=2&gesture=sml&size=s&headonly=1`}
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
                                  src={`https://www.habbo.com/habbo-imaging/avatarimage?user=${polAlvo.avatarHabbo}&direction=2&head_direction=2&gesture=sml&size=m`}
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
                                  src={`https://www.habbo.com/habbo-imaging/avatarimage?user=${avatarUser}&head_direction=2&gesture=sml&size=s&headonly=1`}
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
                    categorias.map((cat) => {
                      const patentesFiltradas = patentes.filter(p => p.categoriaId === cat.id).sort((a, b) => a.ordem - b.ordem);

                      return (
                        <div key={cat.id} className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-5 space-y-4">
                          <div className="flex justify-between items-center border-b border-zinc-900 pb-3 flex-wrap gap-2">
                            <div>
                              <h4 className="text-sm font-tactical font-extrabold text-zinc-100 uppercase tracking-widest">{cat.nome}</h4>
                              {cat.subtitulo && <p className="text-[10px] text-zinc-500 font-tactical mt-0.5">{cat.subtitulo}</p>}
                            </div>

                            <div className="flex items-center gap-2">
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
                  {!mostrarFormXP && (
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
                                    src={`https://www.habbo.com/habbo-imaging/avatarimage?user=${pol.avatarHabbo}&head_direction=2&gesture=sml&size=s&headonly=1`}
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
                          <label className="block text-[10px] text-zinc-500 font-sans mb-1.5 uppercase tracking-wider font-bold">Valor de XP</label>
                          <input
                            type="number"
                            value={xpValor}
                            onChange={(e) => setXpValor(e.target.value)}
                            placeholder="Ex: 5"
                            className="w-full bg-[#121212] border border-[#222] focus:border-red-600 text-zinc-100 font-sans px-3 py-2 rounded text-xs outline-none transition-all h-9"
                            required
                          />
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
                          <span className="text-amber-500 font-bold">+{detalhesXP.valor} XP</span>
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
                                    src={`https://www.habbo.com/habbo-imaging/avatarimage?user=${userObj?.avatarHabbo || nick}&head_direction=2&gesture=sml&size=s&headonly=1`}
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
                              <td className="py-3.5 px-4 text-center font-bold text-amber-500 font-mono">
                                +{envio.valor} XP
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

                  <button
                    onClick={abrirCriarGrupo}
                    className="px-4 py-2.5 bg-gradient-to-r from-red-950 via-red-800 to-red-950 text-white font-tactical font-bold text-xs tracking-wider rounded hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start md:self-auto shadow-[0_3px_10px_rgba(239,68,68,0.1)]"
                  >
                    <Plus className="w-4 h-4" />
                    CRIAR NOVO GRUPO
                  </button>
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
                    </div>

                    {/* Secondary Tabs */}
                    <div className="flex border-b border-zinc-900">
                      {(['conteudo', 'aplicacoes', 'permissoes'] as const).map((tab) => (
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
                          {tab === 'conteudo' ? 'Conteúdo' : tab === 'aplicacoes' ? 'Aplicações' : 'Permissões'}
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
                                                      src={`https://www.habbo.com/habbo-imaging/avatarimage?user=${al.nick}&direction=3&head_direction=3&gesture=sml&size=s`}
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

                                                  {treinamentoSelecionado.cargoVinculavel && al.status === 'aprovado' && (
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
                                            src={`https://www.habbo.com/habbo-imaging/avatarimage?user=${al.nick}&direction=3&head_direction=3&gesture=sml&size=s`}
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
                                          {al.status}
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

                    {/* Sub Tab: Permissões */}
                    {subAbaAtiva === 'permissoes' && (
                      <div className="bg-zinc-950/40 border border-zinc-900/80 rounded-lg p-5 space-y-4">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-red-500" />
                          <h4 className="text-xs font-tactical font-bold text-zinc-100 uppercase tracking-wider">Quem pode aplicar este treinamento</h4>
                        </div>
                        <p className="text-xs text-zinc-400 font-tactical leading-relaxed">
                          Por padrão, qualquer oficial ou cargos de alta patente habilitados pelo Departamento de Ensino podem ministrar e aplicar as instruções. Para alterar as configurações finas, configure as patentes que possuem permissão nas diretivas de aula.
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                          {['Diretor', 'General', 'Coronel', 'Major', 'Capitão', 'Instrutor', 'Militar'].map((cargo) => {
                            const isSelected = treinamentoSelecionado.permissoesCargos?.includes(cargo);
                            return (
                              <button
                                key={cargo}
                                type="button"
                                onClick={() => {
                                  const list = [...(treinamentoSelecionado.permissoesCargos || [])];
                                  const updated = list.includes(cargo)
                                    ? list.filter(c => c !== cargo)
                                    : [...list, cargo];
                                  const updatedTreino = { ...treinamentoSelecionado, permissoesCargos: updated };
                                  setTreinamentoSelecionado(updatedTreino);
                                  salvarTreinamento(updatedTreino);
                                  carregarDados();
                                }}
                                className={`p-2 rounded border text-xs font-tactical font-medium transition-all text-center flex items-center justify-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-red-950/10 border-red-900 text-red-400'
                                    : 'bg-zinc-900/20 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                                }`}
                              >
                                {isSelected ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                <span>{cargo}</span>
                              </button>
                            );
                          })}
                        </div>
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

                      <button
                        type="button"
                        onClick={abrirCriarTreinamento}
                        className="px-4 py-2.5 bg-gradient-to-r from-red-950 via-red-800 to-red-950 text-white font-tactical font-bold text-xs tracking-wider rounded hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start md:self-auto shadow-[0_3px_10px_rgba(239,68,68,0.1)]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>NOVO TREINAMENTO</span>
                      </button>
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
                                    <span className="text-xs text-zinc-100 font-tactical font-bold block">{t ? t.titulo : 'Treinamento Excluído'}</span>
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
                                  src={`https://www.habbo.com/habbo-imaging/avatarimage?user=${av}&direction=3&head_direction=3&gesture=sml&size=s`}
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

      <footer className="py-6 border-t border-zinc-900/50 bg-zinc-950/40 text-center text-[11px] text-zinc-600 px-4 mt-8">
        <p className="max-w-2xl mx-auto leading-relaxed font-tactical">
          Esse site não possui vínculo com a Sulake Corporation tampouco com o Habbo Hotel.
          <br />
          Polícia CIA © 2026 todos os direitos reservados. Conectado como @{policial.nick}.
        </p>
      </footer>
    </div>
  );
}
