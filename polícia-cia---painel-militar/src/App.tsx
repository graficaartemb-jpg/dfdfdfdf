import React, { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, Eye, EyeOff, UserPlus, ArrowLeft, ShieldAlert, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import CiaLogo from './components/CiaLogo';
import Dashboard from './components/Dashboard';
import { loginPolicial, registrarPolicial, inicializarDB } from './lib/db';
import { Policial } from './types';

export default function App() {
  const [estaLogado, setEstaLogado] = useState(false);
  const [policialLogado, setPolicialLogado] = useState<Policial | null>(null);

  // Screen state
  const [telaAtiva, setTelaAtiva] = useState<'login' | 'registro'>('login');

  // Input states
  const [loginNick, setLoginNick] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  // Register states
  const [regNick, setRegNick] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regHabbo, setRegHabbo] = useState('');

  // Status/Alert states
  const [msgErro, setMsgErro] = useState('');
  const [msgSucesso, setMsgSucesso] = useState('');

  // Initial database load
  useEffect(() => {
    inicializarDB();
  }, []);

  const lidarComLogin = (e: FormEvent) => {
    e.preventDefault();
    setMsgErro('');
    setMsgSucesso('');

    if (!loginNick.trim() || !loginSenha) {
      setMsgErro('Por favor, preencha todos os campos.');
      return;
    }

    const resultado = loginPolicial(loginNick, loginSenha);
    if (resultado.sucesso && resultado.policial) {
      setMsgSucesso('Acesso autorizado! Carregando painel...');
      setTimeout(() => {
        setPolicialLogado(resultado.policial!);
        setEstaLogado(true);
      }, 1000);
    } else {
      setMsgErro(resultado.mensagem);
    }
  };

  const lidarComRegistro = (e: FormEvent) => {
    e.preventDefault();
    setMsgErro('');
    setMsgSucesso('');

    if (!regNick.trim() || !regSenha || !regHabbo.trim()) {
      setMsgErro('Preencha todos os campos para se alistar.');
      return;
    }

    if (regSenha.length < 4) {
      setMsgErro('A senha militar deve conter pelo menos 4 caracteres.');
      return;
    }

    const resultado = registrarPolicial(regNick, regSenha, regHabbo);
    if (resultado.sucesso) {
      setMsgSucesso(resultado.mensagem);
      // Clear fields
      setRegNick('');
      setRegSenha('');
      setRegHabbo('');
      setTimeout(() => {
        setTelaAtiva('login');
        setMsgSucesso('');
      }, 2500);
    } else {
      setMsgErro(resultado.mensagem);
    }
  };

  const alternarTela = (tela: 'login' | 'registro') => {
    setMsgErro('');
    setMsgSucesso('');
    setTelaAtiva(tela);
  };

  // Quick-test values to show in the UI for ease of evaluation
  const preencherDadosTeste = (nick: string) => {
    setLoginNick(nick);
    setLoginSenha('123456');
  };

  if (estaLogado && policialLogado) {
    return (
      <Dashboard
        policialInicial={policialLogado}
        onLogout={() => {
          setEstaLogado(false);
          setPolicialLogado(null);
          setLoginSenha('');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-vignette text-zinc-100 flex flex-col justify-between p-4 sm:p-6 overflow-x-hidden select-none font-sans relative">
      {/* Dynamic Background Grid Mesh Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(239,68,68,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(239,68,68,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      {/* Quick Access Helper Badge */}
      <div className="mx-auto mt-2 max-w-md w-full text-center bg-zinc-950/80 border border-zinc-900 rounded-lg p-2.5 z-10 backdrop-blur-sm">
        <p className="text-[10px] text-zinc-500 font-mono flex items-center justify-center gap-1.5 flex-wrap">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>Contas de teste: Clique para preencher</span>
          <button
            onClick={() => preencherDadosTeste('Diretor_Almeida')}
            className="text-amber-500 hover:underline px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px]"
          >
            Diretor
          </button>
          <span>ou</span>
          <button
            onClick={() => preencherDadosTeste('Soldado_Muller')}
            className="text-red-500 hover:underline px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px]"
          >
            Soldado
          </button>
          <span>(Senha: 123456)</span>
        </p>
      </div>

      {/* Main Content Card Container */}
      <div className="flex-1 flex flex-col justify-center items-center z-10 py-6">
        <div className="w-full max-w-[430px] flex flex-col items-center gap-6">
          
          {/* Header Wing Logo */}
          <CiaLogo />

          {/* Form Container Frame */}
          <div className="w-full bg-[#0a0505]/95 border border-[#1f0f0f] rounded-lg p-6 relative shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(239,68,68,0.05)] overflow-hidden">
            
            {/* High fidelity corner glowing notches from original layout */}
            <div className="absolute top-3 left-0 w-1.5 h-3 bg-red-600 rounded-r shadow-[0_0_8px_#ef4444]"></div>
            <div className="absolute top-3 right-0 w-1.5 h-3 bg-red-600 rounded-l shadow-[0_0_8px_#ef4444]"></div>

            {/* Slide and Fade transitions */}
            <AnimatePresence mode="wait">
              {telaAtiva === 'login' ? (
                <motion.div
                  key="login-view"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {/* Internal Tab Title Header */}
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-red-600/30 to-red-600/60 w-12 sm:w-16"></div>
                    <span className="text-zinc-400 font-tactical font-medium text-xs tracking-widest uppercase">
                      Acesso à Conta
                    </span>
                    <div className="h-[1px] bg-gradient-to-l from-transparent via-red-600/30 to-red-600/60 w-12 sm:w-16"></div>
                  </div>

                  {/* Feedback Message Panel */}
                  {msgErro && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-3 bg-red-950/30 border border-red-900/40 text-red-400 rounded text-xs font-tactical flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{msgErro}</span>
                    </motion.div>
                  )}

                  {msgSucesso && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-3 bg-green-950/20 border border-green-900/30 text-green-400 rounded text-xs font-tactical flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 animate-bounce" />
                      <span>{msgSucesso}</span>
                    </motion.div>
                  )}

                  <form onSubmit={lidarComLogin} className="space-y-4">
                    {/* User Field */}
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors">
                        <User className="w-[18px] h-[18px]" />
                      </div>
                      <input
                        type="text"
                        placeholder="Nick"
                        value={loginNick}
                        onChange={(e) => setLoginNick(e.target.value)}
                        className="w-full bg-[#120808]/90 border border-zinc-900 focus:border-red-900 focus:ring-1 focus:ring-red-900 text-zinc-200 font-tactical text-sm pl-11 pr-4 py-3 rounded-md outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>

                    {/* Password Field */}
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors">
                        <Lock className="w-[18px] h-[18px]" />
                      </div>
                      <input
                        type={senhaVisivel ? 'text' : 'password'}
                        placeholder="Senha"
                        value={loginSenha}
                        onChange={(e) => setLoginSenha(e.target.value)}
                        className="w-full bg-[#120808]/90 border border-zinc-900 focus:border-red-900 focus:ring-1 focus:ring-red-900 text-zinc-200 font-tactical text-sm pl-11 pr-10 py-3 rounded-md outline-none transition-all placeholder:text-zinc-600"
                      />
                      <button
                        type="button"
                        onClick={() => setSenhaVisivel(!senhaVisivel)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        {senhaVisivel ? <EyeOff className="w-[16px] h-[16px]" /> : <Eye className="w-[16px] h-[16px]" />}
                      </button>
                    </div>

                    {/* Submit Login Button */}
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-red-950 via-red-800 to-red-950 hover:from-red-900 hover:via-red-700 hover:to-red-900 text-zinc-100 font-tactical font-bold tracking-widest text-sm rounded-md transition-all duration-300 transform active:scale-[0.98] cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-red-950 hover:border-red-800"
                    >
                      LOGIN
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="h-[1px] bg-zinc-900 w-1/3"></div>
                    <span className="text-[10px] font-tactical text-zinc-600 tracking-wider">OU</span>
                    <div className="h-[1px] bg-zinc-900 w-1/3"></div>
                  </div>

                  {/* Navigation to Registration */}
                  <div className="text-center space-y-3">
                    <p className="text-[11px] text-zinc-500 font-tactical">Ainda não tem uma conta?</p>
                    <button
                      onClick={() => alternarTela('registro')}
                      className="w-full py-3 border border-zinc-900 hover:border-red-900/60 text-red-500 font-tactical font-semibold text-xs tracking-wider rounded-md transition-all hover:bg-red-950/10 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>REGISTRAR</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="register-view"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {/* Internal Tab Title Header */}
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-red-600/30 to-red-600/60 w-12 sm:w-16"></div>
                    <span className="text-zinc-400 font-tactical font-medium text-xs tracking-widest uppercase">
                      Criar Cadastro
                    </span>
                    <div className="h-[1px] bg-gradient-to-l from-transparent via-red-600/30 to-red-600/60 w-12 sm:w-16"></div>
                  </div>

                  {/* Feedback Message Panel */}
                  {msgErro && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-3 bg-red-950/30 border border-red-900/40 text-red-400 rounded text-xs font-tactical flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{msgErro}</span>
                    </motion.div>
                  )}

                  {msgSucesso && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-3 bg-green-950/20 border border-green-900/30 text-green-400 rounded text-xs font-tactical flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <span>{msgSucesso}</span>
                    </motion.div>
                  )}

                  <form onSubmit={lidarComRegistro} className="space-y-4">
                    {/* User Desired Nick */}
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors">
                        <User className="w-[18px] h-[18px]" />
                      </div>
                      <input
                        type="text"
                        placeholder="Nome de Policial (Ex: Soldado_Vasco)"
                        value={regNick}
                        onChange={(e) => setRegNick(e.target.value)}
                        className="w-full bg-[#120808]/90 border border-zinc-900 focus:border-red-900 focus:ring-1 focus:ring-red-900 text-zinc-200 font-tactical text-sm pl-11 pr-4 py-3 rounded-md outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>

                    {/* Desired Password */}
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors">
                        <Lock className="w-[18px] h-[18px]" />
                      </div>
                      <input
                        type="password"
                        placeholder="Senha militar (Mínimo 4 dígitos)"
                        value={regSenha}
                        onChange={(e) => setRegSenha(e.target.value)}
                        className="w-full bg-[#120808]/90 border border-zinc-900 focus:border-red-900 focus:ring-1 focus:ring-red-900 text-zinc-200 font-tactical text-sm pl-11 pr-4 py-3 rounded-md outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>

                    {/* Real Habbo user reference to pull original PNG avatar */}
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors">
                        <Sparkles className="w-[18px] h-[18px]" />
                      </div>
                      <input
                        type="text"
                        placeholder="Seu Nick no Habbo (para carregar avatar)"
                        value={regHabbo}
                        onChange={(e) => setRegHabbo(e.target.value)}
                        className="w-full bg-[#120808]/90 border border-zinc-900 focus:border-red-900 focus:ring-1 focus:ring-red-900 text-zinc-200 font-tactical text-sm pl-11 pr-4 py-3 rounded-md outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>

                    {/* Submit Register Button */}
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-red-950 via-red-800 to-red-950 hover:from-red-900 hover:via-red-700 hover:to-red-900 text-zinc-100 font-tactical font-bold tracking-widest text-sm rounded-md transition-all duration-300 transform active:scale-[0.98] cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-red-950 hover:border-red-800"
                    >
                      ENVIAR SOLICITAÇÃO DE ALISTAMENTO
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="h-[1px] bg-zinc-900 w-1/3"></div>
                    <span className="text-[10px] font-tactical text-zinc-600 tracking-wider">OU</span>
                    <div className="h-[1px] bg-zinc-900 w-1/3"></div>
                  </div>

                  {/* Back to Login */}
                  <button
                    onClick={() => alternarTela('login')}
                    className="w-full py-3 border border-zinc-900 hover:border-red-900/60 text-zinc-400 hover:text-zinc-200 font-tactical font-semibold text-xs tracking-wider rounded-md transition-all hover:bg-zinc-900/50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>VOLTAR AO LOGIN</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer exactly like image */}
      <footer className="py-4 text-center text-[10px] text-zinc-600 leading-relaxed font-tactical z-10">
        <p className="max-w-2xl mx-auto">
          Esse site não possui vínculo com a Sulake Corporation tampouco com o Habbo Hotel.
          <br />
          Polícia CIA © 2026 todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
