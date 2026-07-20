import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, MessageSquare, ExternalLink, ChevronDown, ChevronRight, ArrowLeft, ShieldAlert, Sparkles, FileText, Globe } from 'lucide-react';
import { obterApostilas, obterConfiguracaoSite } from '../lib/db';
import { Apostila, ApostilaParte, ConfiguracaoSite } from '../types';

interface ConstituicaoMilitarProps {
  onVoltar: () => void;
}

export default function ConstituicaoMilitar({ onVoltar }: ConstituicaoMilitarProps) {
  const [abaAtiva, setAbaAtiva] = useState<'apostilas' | 'comunicacao'>('apostilas');
  const [apostilas, setApostilas] = useState<Apostila[]>([]);
  const [config, setConfig] = useState<ConfiguracaoSite | null>(null);
  const [apostilaSelecionada, setApostilaSelecionada] = useState<Apostila | null>(null);
  
  // Track which parts are expanded in the selected apostila (part ID -> boolean)
  const [partesExpandidas, setPartesExpandidas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const list = obterApostilas();
    setApostilas(list);
    if (list.length > 0) {
      setApostilaSelecionada(list[0]);
      // Expand the first part by default
      if (list[0].partes && list[0].partes.length > 0) {
        setPartesExpandidas({ [list[0].partes[0].id]: true });
      }
    }
    setConfig(obterConfiguracaoSite());
  }, []);

  const alternarParte = (parteId: string) => {
    setPartesExpandidas(prev => ({
      ...prev,
      [parteId]: !prev[parteId]
    }));
  };

  const selecionarApostila = (ap: Apostila) => {
    setApostilaSelecionada(ap);
    // Expand the first part by default on switch
    const newExpanded: Record<string, boolean> = {};
    if (ap.partes && ap.partes.length > 0) {
      newExpanded[ap.partes[0].id] = true;
    }
    setPartesExpandidas(newExpanded);
  };

  const linkDiscord = config?.linkDiscord || 'https://discord.gg/cia-habbo';

  return (
    <div className="min-h-screen bg-vignette text-zinc-100 flex flex-col font-sans select-none relative">
      {/* Dynamic Background Mesh Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(245,158,11,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(245,158,11,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

      {/* Decorative Top Bar */}
      <div className="h-1 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 w-full z-10" />

      {/* Header Container */}
      <header className="bg-zinc-950/90 border-b border-zinc-900/60 p-4 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand/Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onVoltar}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded hover:border-amber-500 text-zinc-400 hover:text-amber-500 transition-all cursor-pointer flex items-center justify-center"
              title="Voltar ao Login"
              id="btn_voltar_login"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="h-8 w-[1px] bg-zinc-800 hidden sm:block" />
            <div>
              <h1 className="text-sm sm:text-base font-tactical font-black text-amber-500 tracking-widest uppercase flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                CONSTITUIÇÃO MILITAR
              </h1>
              <p className="text-[9px] sm:text-[10px] text-zinc-500 font-tactical tracking-wider uppercase">
                POLÍCIA CIA • DEPARTAMENTO DE DOUTRINA & COMUNICAÇÃO
              </p>
            </div>
          </div>

          {/* Navigation and Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex bg-zinc-950 border border-zinc-900 p-1 rounded-lg">
              <button
                onClick={() => setAbaAtiva('apostilas')}
                className={`px-4 py-1.5 rounded-md text-[10px] sm:text-xs font-tactical font-bold tracking-wider transition-all uppercase cursor-pointer flex items-center gap-1.5 ${
                  abaAtiva === 'apostilas'
                    ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                id="tab_const_apostilas"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Apostilas
              </button>
              <button
                onClick={() => setAbaAtiva('comunicacao')}
                className={`px-4 py-1.5 rounded-md text-[10px] sm:text-xs font-tactical font-bold tracking-wider transition-all uppercase cursor-pointer flex items-center gap-1.5 ${
                  abaAtiva === 'comunicacao'
                    ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                id="tab_const_comunicacao"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Comunicação
              </button>
            </div>

            <button
              onClick={onVoltar}
              className="px-4 py-2 bg-gradient-to-r from-amber-950 via-amber-800 to-amber-950 hover:from-amber-900 hover:via-amber-700 hover:to-amber-900 border border-amber-700/20 text-white font-tactical font-black text-[10px] sm:text-xs tracking-widest rounded transition-all cursor-pointer shadow-lg uppercase"
              id="btn_acessar_terminal"
            >
              Acessar Terminal
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 z-10">
        <AnimatePresence mode="wait">
          
          {/* APOSTILAS TAB */}
          {abaAtiva === 'apostilas' && (
            <motion.div
              key="tab-apostilas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Sidebar: List of available guides */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-zinc-950/80 border border-zinc-900 rounded-lg p-4 space-y-3">
                  <h3 className="text-xs font-tactical font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-900 pb-2">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    MANUAIS DISPONÍVEIS
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-tactical leading-relaxed">
                    Selecione abaixo um dos manuais e apostilas da Polícia CIA para estudar as diretrizes de conduta e táticas de campo.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {apostilas.length === 0 ? (
                    <div className="p-8 text-center bg-zinc-950/40 border border-zinc-900 rounded-lg">
                      <p className="text-xs text-zinc-500 font-tactical uppercase tracking-wider">Nenhum manual cadastrado no sistema.</p>
                    </div>
                  ) : (
                    apostilas.map((ap) => (
                      <button
                        key={ap.id}
                        onClick={() => selecionarApostila(ap)}
                        className={`w-full text-left p-4 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5 relative overflow-hidden group ${
                          apostilaSelecionada?.id === ap.id
                            ? 'bg-amber-950/10 border-amber-800/60 shadow-[0_4px_20px_rgba(245,158,11,0.05)]'
                            : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/20'
                        }`}
                        id={`btn_ap_${ap.id}`}
                      >
                        {/* Selected Indicator Light */}
                        {apostilaSelecionada?.id === ap.id && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-tactical font-black text-amber-500 uppercase tracking-wider block">
                            Manual Oficial
                          </span>
                          <span className="text-[9px] text-zinc-600 font-mono">
                            {ap.dataCriacao}
                          </span>
                        </div>

                        <h4 className="text-sm font-sans font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
                          {ap.titulo}
                        </h4>

                        <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                          {ap.descricao}
                        </p>

                        <div className="pt-2 border-t border-zinc-900/60 flex items-center justify-between text-[10px] text-zinc-500 font-tactical">
                          <span>Seções: <strong>{ap.partes?.length || 0}</strong></span>
                          <span className="text-amber-500/80 group-hover:text-amber-400 flex items-center gap-1">
                            Abrir Leitor <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Reader: Detailed content divided into parts */}
              <div className="lg:col-span-8">
                {apostilaSelecionada ? (
                  <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 sm:p-6 space-y-6">
                    
                    {/* Header of selected manual */}
                    <div className="border-b border-zinc-900 pb-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-amber-950/20 border border-amber-900/30 text-amber-400 text-[10px] font-tactical font-bold rounded uppercase tracking-wider">
                          Doutrina Ativa
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-tactical">
                          <Globe className="w-3.5 h-3.5 text-zinc-600" />
                          <span>Público</span>
                        </div>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-zinc-100 tracking-tight">
                        {apostilaSelecionada.titulo}
                      </h2>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {apostilaSelecionada.descricao}
                      </p>
                    </div>

                    {/* Section Accordions: "Postar por partes ai a pessoa abre e vê certinho" */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-tactical font-black text-zinc-400 tracking-widest uppercase flex items-center gap-1.5 mb-2">
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                        CAPÍTULOS E DIRETRIZES ({apostilaSelecionada.partes?.length || 0})
                      </h3>

                      {(!apostilaSelecionada.partes || apostilaSelecionada.partes.length === 0) ? (
                        <div className="p-8 text-center bg-zinc-900/20 border border-zinc-900/60 rounded">
                          <p className="text-xs text-zinc-500 font-tactical">Este manual não possui seções cadastradas ainda.</p>
                        </div>
                      ) : (
                        apostilaSelecionada.partes.map((parte, index) => {
                          const isOpen = !!partesExpandidas[parte.id];
                          return (
                            <div
                              key={parte.id}
                              className="border border-zinc-900 rounded-lg overflow-hidden bg-zinc-950/40"
                            >
                              {/* Accordion Trigger */}
                              <button
                                onClick={() => alternarParte(parte.id)}
                                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-zinc-900/30 transition-all text-left cursor-pointer select-none"
                                id={`trigger_parte_${parte.id}`}
                              >
                                <span className="font-tactical font-bold text-xs text-zinc-200 hover:text-amber-400 transition-colors flex items-center gap-2">
                                  <span className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 text-amber-500 font-mono text-[10px] flex items-center justify-center font-bold">
                                    {index + 1}
                                  </span>
                                  {parte.tituloParte}
                                </span>
                                {isOpen ? (
                                  <ChevronDown className="w-4 h-4 text-amber-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                                )}
                              </button>

                              {/* Accordion Content */}
                              <AnimatePresence initial={false}>
                                {isOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden border-t border-zinc-900/50 bg-zinc-950/20"
                                  >
                                    <div className="p-4 text-xs text-zinc-300 leading-relaxed whitespace-pre-line font-sans prose prose-invert max-w-none">
                                      {parte.conteudo}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Security stamp footer */}
                    <div className="pt-4 border-t border-zinc-900 text-center flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-zinc-600 font-tactical">
                      <span>Publicado por @{apostilaSelecionada.criadoPor}</span>
                      <span>Polícia CIA • Departamento Geral de Ensino (DGE)</span>
                    </div>

                  </div>
                ) : (
                  <div className="p-16 text-center bg-zinc-950/60 border border-zinc-900 rounded-lg flex flex-col items-center justify-center gap-3">
                    <BookOpen className="w-12 h-12 text-zinc-700" />
                    <p className="text-xs text-zinc-500 font-tactical uppercase tracking-widest">Nenhum manual selecionado.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* COMUNICAÇÃO (DISCORD) TAB */}
          {abaAtiva === 'comunicacao' && (
            <motion.div
              key="tab-comunicacao"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
                {/* Decorative Discord Logo watermark background */}
                <div className="absolute -right-12 -bottom-12 text-[#5865F2]/5 transform rotate-12 select-none pointer-events-none">
                  <MessageSquare className="w-64 h-64" />
                </div>

                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Glowing Icon Badge */}
                  <div className="w-16 h-16 rounded-full bg-[#5865F2] flex items-center justify-center shadow-[0_0_25px_rgba(88,101,242,0.4)]">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 font-mono font-bold tracking-widest uppercase block">
                      Canal de Comunicação Integrado
                    </span>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      SERVIDOR OFICIAL NO DISCORD
                    </h2>
                    <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
                      Conecte-se com nossa corporação policial e participe ativamente da rotina militar, avisos, anúncios em tempo real, promoções e suporte aos oficiais.
                    </p>
                  </div>
                </div>

                {/* Grid features inside server */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-4 space-y-1">
                    <h4 className="text-xs font-bold text-[#5865F2] uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Anúncios & Promoções
                    </h4>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Receba alertas push instantâneos quando ocorrerem promoções de cargo, nomeações e decretos do Alto Comando.
                    </p>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-4 space-y-1">
                    <h4 className="text-xs font-bold text-[#5865F2] uppercase tracking-wide flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Treinamentos & Cursos
                    </h4>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Acesso aos canais de agendamento de testes e de formação para subir rapidamente na hierarquia militar.
                    </p>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-4 space-y-1">
                    <h4 className="text-xs font-bold text-[#5865F2] uppercase tracking-wide flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Mesa de Diálogo Livre
                    </h4>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Interaja com outros policiais, tire dúvidas operacionais e compartilhe conquistas profissionais.
                    </p>
                  </div>

                  <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-4 space-y-1">
                    <h4 className="text-xs font-bold text-[#5865F2] uppercase tracking-wide flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Central de Denúncias & Ouvidoria
                    </h4>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Área segura para reports de conduta inadequada, solicitações especiais e contato direto com a Corregedoria.
                    </p>
                  </div>
                </div>

                {/* Connection button */}
                <div className="flex flex-col items-center gap-3 pt-4 border-t border-zinc-900">
                  <a
                    href={linkDiscord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-tactical font-black text-xs tracking-widest rounded-lg flex items-center gap-2.5 transition-all uppercase shadow-lg shadow-[#5865F2]/20 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto text-center justify-center cursor-pointer"
                    id="btn_conectar_discord_const"
                  >
                    <MessageSquare className="w-4 h-4 fill-current" />
                    CONECTAR AO SERVIDOR OFICIAL
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Conexão segura • Aberto para todos os membros e oficiais.
                  </span>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
