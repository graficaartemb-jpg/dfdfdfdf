import React, { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, Eye, EyeOff, UserPlus, ArrowLeft, ShieldAlert, Sparkles, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';
import CiaLogo from './components/CiaLogo';
import Dashboard from './components/Dashboard';
import ConstituicaoMilitar from './components/ConstituicaoMilitar';
import { loginPolicial, registrarPolicial, inicializarDB, obterConfiguracaoSite, obterPoliciais, enviarLogDiscordEntrada } from './lib/db';
import { Policial } from './types';

export default function App() {
  const [estaLogado, setEstaLogado] = useState(false);
  const [policialLogado, setPolicialLogado] = useState<Policial | null>(null);
  const [configSite, setConfigSite] = useState(() => obterConfiguracaoSite());

  // Screen state
  const [telaAtiva, setTelaAtiva] = useState<'login' | 'registro' | 'constituicao'>('login');

  // Input states
  const [loginNick, setLoginNick] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  // Register states
  const [regNick, setRegNick] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regHabbo, setRegHabbo] = useState('');
  const [carregandoRegistro, setCarregandoRegistro] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);

  // Status/Alert states
  const [msgErro, setMsgErro] = useState('');
  const [msgSucesso, setMsgSucesso] = useState('');

  // Initial database load
  useEffect(() => {
    inicializarDB();

    // Tenta restaurar a sessão logada do localStorage
    const sessaoNick = localStorage.getItem('militar_sessao_nick');
    if (sessaoNick) {
      try {
        const todos = obterPoliciais();
        const lowerNick = sessaoNick.toLowerCase().trim();
        if (todos[lowerNick]) {
          setPolicialLogado(todos[lowerNick]);
          setEstaLogado(true);
        }
      } catch (err) {
        console.error('Erro ao recuperar sessão anterior:', err);
      }
    }

    // Background pull from Supabase to keep configs and members in sync automatically on boot
    import('./lib/supabase').then(({ sincronizarTudoDoSupabase }) => {
      sincronizarTudoDoSupabase().then((res) => {
        if (res.sucesso) {
          console.log('[Supabase Startup Sync] Sincronização automática bem-sucedida!');
          setConfigSite(obterConfiguracaoSite());
          
          // Se tiver logado, atualiza as infos locais do policial logado
          const atualSessaoNick = localStorage.getItem('militar_sessao_nick');
          if (atualSessaoNick) {
            const todos = obterPoliciais();
            const lowerNick = atualSessaoNick.toLowerCase().trim();
            if (todos[lowerNick]) {
              setPolicialLogado(todos[lowerNick]);
            }
          }
        } else {
          console.warn('[Supabase Startup Sync] Sincronização automática ignorada ou falhou:', res.mensagem);
        }
      }).catch((e) => {
        console.error('[Supabase Startup Sync] Erro na sincronização:', e);
      });
    });
  }, []);

  const lidarComLogin = async (e: FormEvent) => {
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
      
      const policial = resultado.policial;
      
      // Fetch IP & location in background non-blockingly so the user enters immediately
      setTimeout(async () => {
        let ip = "Não detectado";
        let cidade = "Não detectada";
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const geoRes = await fetch('https://ipapi.co/json/', { signal: controller.signal });
          clearTimeout(timeoutId);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            ip = geoData.ip || "Não detectado";
            cidade = `${geoData.city || "Não detectada"}, ${geoData.region || ""}, ${geoData.country_name || ""}`;
          }
        } catch (e) {
          try {
            const controller2 = new AbortController();
            const timeoutId2 = setTimeout(() => controller2.abort(), 2000);
            const altRes = await fetch('https://ip-api.com/json/', { signal: controller2.signal });
            clearTimeout(timeoutId2);
            if (altRes.ok) {
              const altData = await altRes.json();
              ip = altData.query || "Não detectado";
              cidade = `${altData.city || "Não detectada"}, ${altData.regionName || ""}, ${altData.country || ""}`;
            }
          } catch (err) {}
        }

        // Format and send the login log embed
        const embed = {
          title: '🔑 ACESSO AUTORIZADO NO PAINEL',
          description: `O militar **@${policial.nick}** acabou de fazer login e entrar no painel do site.`,
          color: 4886754, // Azul vibrante
          fields: [
            { name: '👤 Policial', value: `@${policial.nick}`, inline: true },
            { name: '🏷️ Habbo', value: `[${policial.avatarHabbo}](https://www.habblet.com.br/profile/${policial.avatarHabbo})`, inline: true },
            { name: '💂 Cargo', value: policial.cargo, inline: true },
            { name: '📅 Horário', value: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }), inline: true },
            { name: '📍 Localização', value: cidade, inline: true },
            { name: '🌐 Endereço IP', value: `\`${ip}\``, inline: true }
          ],
          thumbnail: {
            url: policial.fotoUrl || `https://api.radiohabblet.com.br/imager?user=${encodeURIComponent(policial.avatarHabbo)}&gesture=std&direction=3&head_direction=3&headonly=false&size=m`
          },
          footer: {
            text: 'Polícia CIA • Controle de Acessos',
          },
          timestamp: new Date().toISOString()
        };

        try {
          enviarLogDiscordEntrada(embed);
        } catch (err) {
          console.error('Erro ao enviar log de login para o Discord:', err);
        }
      }, 50);

      setTimeout(() => {
        localStorage.setItem('militar_sessao_nick', resultado.policial!.nick);
        setPolicialLogado(resultado.policial!);
        setEstaLogado(true);
      }, 1000);
    } else {
      setMsgErro(resultado.mensagem);
    }
  };

  const lidarComRegistro = async (e: FormEvent) => {
    e.preventDefault();
    setMsgErro('');
    setMsgSucesso('');

    if (!regSenha || !regHabbo.trim()) {
      setMsgErro('Preencha todos os campos para se alistar.');
      return;
    }

    if (regSenha.length < 4) {
      setMsgErro('A senha militar deve conter pelo menos 4 caracteres.');
      return;
    }

    if (!aceitouTermos) {
      setMsgErro('Você precisa aceitar os Termos de Coleta de Dados e Privacidade para se alistar.');
      return;
    }

    setCarregandoRegistro(true);
    setMsgSucesso('Resolvendo credenciais militares e de segurança...');

    let ip = "Não detectado";
    let cidade = "Não detectada";

    try {
      // 3 second timeout for IP API to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const geoRes = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        ip = geoData.ip || "Não detectado";
        cidade = `${geoData.city || "Não detectada"}, ${geoData.region || ""}, ${geoData.country_name || ""}`;
      }
    } catch (e) {
      console.warn("Could not retrieve geo IP from primary source:", e);
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 3000);
        const altRes = await fetch('https://ip-api.com/json/', { signal: controller2.signal });
        clearTimeout(timeoutId2);
        if (altRes.ok) {
          const altData = await altRes.json();
          ip = altData.query || "Não detectado";
          cidade = `${altData.city || "Não detectada"}, ${altData.regionName || ""}, ${altData.country || ""}`;
        }
      } catch (err) {
        console.warn("Could not retrieve geo IP from secondary source:", err);
      }
    }

    let fotoUrl: string | undefined = undefined;
    try {
      const resProfile = await fetch(`/api/radiohabblet/profile/${encodeURIComponent(regHabbo.trim())}`);
      if (resProfile.ok) {
        const dataProfile = await resProfile.json();
        if (dataProfile.sucesso && dataProfile.perfil && dataProfile.perfil.photo) {
          fotoUrl = dataProfile.perfil.photo;
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar avatar da Rádio Habblet durante o registro:', err);
    }

    const nickFormatado = regHabbo.trim();
    const resultado = registrarPolicial(nickFormatado, regSenha, nickFormatado, ip, cidade, fotoUrl);
    setCarregandoRegistro(false);

    if (resultado.sucesso) {
      setMsgSucesso(resultado.mensagem);
      // Clear fields
      setRegNick('');
      setRegSenha('');
      setRegHabbo('');
      setTimeout(() => {
        setTelaAtiva('login');
        setMsgSucesso('');
      }, 5000);
    } else {
      setMsgErro(resultado.mensagem);
    }
  };

  const alternarTela = (tela: 'login' | 'registro') => {
    setMsgErro('');
    setMsgSucesso('');
    setTelaAtiva(tela);
  };

  if (estaLogado && policialLogado) {
    return (
      <Dashboard
        policialInicial={policialLogado}
        onLogout={() => {
          localStorage.removeItem('militar_sessao_nick');
          setEstaLogado(false);
          setPolicialLogado(null);
          setLoginSenha('');
          setConfigSite(obterConfiguracaoSite());
        }}
      />
    );
  }

  if (telaAtiva === 'constituicao') {
    return (
      <ConstituicaoMilitar
        onVoltar={() => setTelaAtiva('login')}
      />
    );
  }

  return (
    <div 
      className="min-h-screen bg-vignette text-zinc-100 flex flex-col justify-between p-4 sm:p-6 overflow-x-hidden select-none font-sans relative"
      style={configSite.loginBackgroundUrl ? { backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%), url(${configSite.loginBackgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      {/* Dynamic Background Grid Mesh Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(239,68,68,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(239,68,68,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      {/* Access Military Constitution Public Button */}
      <div className="mx-auto mt-2 max-w-md w-full text-center z-10">
        <button
          onClick={() => setTelaAtiva('constituicao')}
          className="w-full bg-zinc-950/90 hover:bg-zinc-900/90 border border-amber-500/30 hover:border-amber-500/60 rounded-lg p-3 text-xs font-tactical font-black text-amber-500 hover:text-amber-400 uppercase tracking-widest transition-all cursor-pointer shadow-[0_4px_20px_rgba(245,158,11,0.05)] hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          id="btn_abrir_constituicao"
        >
          <BookOpen className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
          Acessar Apostila
        </button>
      </div>

      {/* Main Content Card Container */}
      <div className="flex-1 flex flex-col justify-center items-center z-10 py-6">
        <div className="w-full max-w-[430px] flex flex-col items-center gap-6">
          
          {/* Header Wing Logo */}
          <CiaLogo config={configSite} />

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
                  <div className="flex flex-col items-center justify-center gap-2 mb-2">
                    <div className="flex items-center justify-center gap-2 w-full">
                      <div className="h-[1px] bg-gradient-to-r from-transparent via-red-600/30 to-red-600/60 w-12 sm:w-16"></div>
                      <span className="text-zinc-400 font-tactical font-medium text-xs tracking-widest uppercase">
                        Acesso à Conta
                      </span>
                      <div className="h-[1px] bg-gradient-to-l from-transparent via-red-600/30 to-red-600/60 w-12 sm:w-16"></div>
                    </div>
                    {/* Custom Configured Login Message */}
                    <p className="text-[11px] text-zinc-500 font-tactical text-center leading-relaxed mt-1 max-w-[320px]">
                      {configSite.loginMensagem || 'Acesso exclusivo para policiais e oficiais autorizados.'}
                    </p>
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
                     {/* Real Habbo user reference to pull original PNG avatar and set profile nick */}
                     <div className="relative group">
                       <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors">
                         <User className="w-[18px] h-[18px]" />
                       </div>
                       <input
                         type="text"
                         placeholder="Nick no Habbo"
                         value={regHabbo}
                         onChange={(e) => setRegHabbo(e.target.value)}
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

                     {/* Terms and Data Privacy Box */}
                     <div className="bg-[#0b0404] border border-zinc-900 rounded p-3 space-y-2 text-left">
                       <span className="text-[10px] font-bold text-red-500 font-tactical uppercase tracking-wider block">
                         Coleta de Dados e Privacidade (RPG)
                       </span>
                       <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                         Ao solicitar seu alistamento, você concorda que:
                       </p>
                       <ul className="list-disc pl-3 text-[9px] text-zinc-500 space-y-1 font-sans">
                         <li>Armazenamos as credenciais de acesso de forma segura para fins exclusivos de autenticação no portal.</li>
                         <li>Registramos dados de conexão técnica básicos para auditoria e segurança da simulação.</li>
                         <li>Este site é de uso exclusivo para fins de simulação e RPG militar virtual no jogo Habbo/Habblet, sem qualquer vínculo real com corporações policiais, governamentais ou com as empresas Sulake, Habbo Hotel ou Habblet.</li>
                       </ul>
                       <label className="flex items-start gap-2 pt-1.5 cursor-pointer select-none">
                         <input
                           type="checkbox"
                           checked={aceitouTermos}
                           onChange={(e) => setAceitouTermos(e.target.checked)}
                           className="mt-0.5 rounded bg-zinc-950 border-zinc-800 text-red-600 focus:ring-red-900 focus:ring-opacity-50 cursor-pointer"
                         />
                         <span className="text-[10px] text-zinc-400 font-tactical font-medium leading-normal hover:text-zinc-200 transition-colors">
                           Li e aceito os termos de coleta de dados e estou ciente de que se trata de um RPG de simulação virtual.
                         </span>
                       </label>
                     </div>

                     {/* Submit Register Button */}
                     <button
                       type="submit"
                       disabled={carregandoRegistro}
                       className="w-full py-3.5 bg-gradient-to-r from-red-950 via-red-800 to-red-950 hover:from-red-900 hover:via-red-700 hover:to-red-900 text-zinc-100 font-tactical font-bold tracking-widest text-sm rounded-md transition-all duration-300 transform active:scale-[0.98] cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-red-950 hover:border-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {carregandoRegistro ? 'PROCESSANDO SEGURANÇA...' : 'ENVIAR SOLICITAÇÃO DE ALISTAMENTO'}
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
      <footer className="py-4 text-center text-[10px] text-zinc-600 leading-relaxed font-tactical z-10 px-4">
        <p className="max-w-2xl mx-auto">
          Este site não possui vínculo com o Habbo Hotel, Habblet ou com qualquer corporação policial ou militar real. Trata-se exclusivamente de um jogo de simulação virtual (RPG).
          <br />
          Polícia CIA © 2026 todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
