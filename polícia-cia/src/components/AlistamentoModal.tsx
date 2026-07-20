import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, X, ShieldAlert, Award, ChevronRight, UserPlus } from 'lucide-react';
import { salvarTeste } from '../lib/db';
import { RecrutaTeste } from '../types';

interface AlistamentoModalProps {
  examinador: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PERGUNTAS = [
  {
    id: 1,
    pergunta: 'Qual o significado da sigla C.I.A?',
    opcoes: [
      'Central de Inteligência Americana',
      'Centro de Instruções Associadas',
      'Controle Interno de Alistamento'
    ],
    respostaCorreta: 'Central de Inteligência Americana'
  },
  {
    id: 2,
    pergunta: 'Qual comando faz o policial ficar de pé e imóvel imediatamente?',
    opcoes: [
      'Sentido!',
      'À vontade!',
      'Atenção!',
      'Frente para o QG!'
    ],
    respostaCorreta: 'Sentido!'
  },
  {
    id: 3,
    pergunta: 'O que o recruta deve fazer ao receber o comando de "Sentido!"?',
    opcoes: [
      'Dar um aceno e dizer olá',
      'Ficar em pé na frente de sua cadeira, imóvel, em silêncio e sem dançar',
      'Sentar-se imediatamente e sussurrar com os colegas'
    ],
    respostaCorreta: 'Ficar em pé na frente de sua cadeira, imóvel, em silêncio e sem dançar'
  },
  {
    id: 4,
    pergunta: 'Quais acessórios são permitidos na farda preta padrão do Recruta?',
    opcoes: [
      'Bonés chamativos, asas ou efeitos brilhantes',
      'Nenhum acessório extravagante ou brilhante, apenas farda preta básica recomendada',
      'Máscaras coloridas e balões promocionais'
    ],
    respostaCorreta: 'Nenhum acessório extravagante ou brilhante, apenas farda preta básica recomendada'
  }
];

export default function AlistamentoModal({ examinador, onClose, onSuccess }: AlistamentoModalProps) {
  const [nickRecruta, setNickRecruta] = useState('');
  const [passo, setPasso] = useState(0); // 0: Nickname, 1-4: Questions, 5: Result
  const [respostas, setRespostas] = useState<{ pergunta: string; resposta: string; correta: boolean }[]>([]);
  const [motivoReprovacao, setMotivoReprovacao] = useState('');

  const lidarComResposta = (opcaoSelecionada: string) => {
    const perguntaAtual = PERGUNTAS[passo - 1];
    const correta = opcaoSelecionada === perguntaAtual.respostaCorreta;

    const novasRespostas = [
      ...respostas,
      {
        pergunta: perguntaAtual.pergunta,
        resposta: opcaoSelecionada,
        correta
      }
    ];

    setRespostas(novasRespostas);
    setPasso(passo + 1);
  };

  const calcularPontuacao = () => {
    return respostas.filter((r) => r.correta).length;
  };

  const finalizarTeste = () => {
    const acertos = calcularPontuacao();
    const reprovado = acertos < 3; // Must get at least 3 correct

    salvarTeste({
      nickRecruta: nickRecruta.trim(),
      reprovado,
      motivoReprovacao: reprovado ? motivoReprovacao || 'Não atingiu a nota mínima de 75%' : undefined,
      respostas,
      examinador
    });

    onSuccess();
    onClose();
  };

  const acertos = calcularPontuacao();
  const aprovado = acertos >= 3;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto custom-scrollbar">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden relative shadow-[0_0_50px_rgba(239,68,68,0.15)]"
      >
        {/* Glowing top bars */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-red-600"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-red-600"></div>

        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-900 bg-zinc-900/30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-red-500 text-red-glow" />
            <h3 className="font-tactical font-semibold text-zinc-100 tracking-wider">
              ALISTAMENTO / EXAME DE RECRUTAS
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer text-sm"
          >
            Fechar ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {passo === 0 && (
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm leading-relaxed">
                Bem-vindo ao sistema de alistamento tático da CIA. Aqui você avaliará o conhecimento do Recruta recrutado na recepção. Certifique-se de que ele esteja na farda padrão antes de prosseguir.
              </p>
              <div>
                <label className="block text-zinc-500 font-tactical text-xs tracking-wider mb-2">
                  NICK DO RECRUTA NO HABBO
                </label>
                <input
                  type="text"
                  placeholder="Ex: Recruta_Gabriel"
                  value={nickRecruta}
                  onChange={(e) => setNickRecruta(e.target.value)}
                  className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-red-600 text-zinc-100 font-tactical px-4 py-3 rounded-md outline-none transition-all placeholder:text-zinc-700"
                />
              </div>
              <button
                disabled={!nickRecruta.trim()}
                onClick={() => setPasso(1)}
                className="w-full bg-gradient-to-r from-red-950 via-red-800 to-red-950 text-white font-tactical font-semibold tracking-wider py-3 rounded-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-sm"
              >
                INICIAR TESTE OFICIAL
              </button>
            </div>
          )}

          {passo >= 1 && passo <= 4 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-tactical text-red-500 bg-red-950/20 px-2 py-0.5 rounded border border-red-900/30">
                  PERGUNTA {passo} DE 4
                </span>
                <span className="text-xs font-mono text-zinc-600">
                  Candidato: {nickRecruta}
                </span>
              </div>

              <h4 className="text-lg font-tactical font-medium text-zinc-100 leading-snug">
                {PERGUNTAS[passo - 1].pergunta}
              </h4>

              <div className="space-y-2.5">
                {PERGUNTAS[passo - 1].opcoes.map((opcao, i) => (
                  <button
                    key={i}
                    onClick={() => lidarComResposta(opcao)}
                    className="w-full text-left bg-zinc-900/40 hover:bg-red-950/20 hover:border-red-900/60 border border-zinc-900 rounded-md p-3.5 text-sm text-zinc-300 transition-all duration-200 cursor-pointer flex items-center justify-between group"
                  >
                    <span>{opcao}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-red-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {passo === 5 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center p-4 bg-zinc-900/20 rounded-lg border border-zinc-900">
                {aprovado ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-green-950/50 border border-green-500/50 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                      <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <h4 className="text-green-500 font-tactical text-xl font-bold tracking-wider">
                      RECRUTA APROVADO!
                    </h4>
                    <p className="text-zinc-400 text-sm mt-1 max-w-sm">
                      {nickRecruta} acertou {acertos} de 4 perguntas. O recruta está apto a receber as honras e ser promovido ao quadro oficial!
                    </p>
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-500 bg-amber-950/20 border border-amber-900/30 px-3 py-1 rounded-full font-tactical">
                      <Award className="w-4 h-4" />
                      <span>Você ganhará +5 Pontos de Promoção</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-red-950/50 border border-red-500/50 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                      <X className="w-8 h-8 text-red-500" />
                    </div>
                    <h4 className="text-red-500 font-tactical text-xl font-bold tracking-wider">
                      RECRUTA REPROVADO
                    </h4>
                    <p className="text-zinc-400 text-sm mt-1 max-w-sm">
                      O candidato acertou apenas {acertos} de 4 perguntas. O aproveitamento mínimo exigido é de 3 acertos.
                    </p>
                  </>
                )}
              </div>

              {!aprovado && (
                <div className="space-y-2">
                  <label className="block text-zinc-500 font-tactical text-xs tracking-wider">
                    MOTIVO DA REPROVAÇÃO (RELATÓRIO)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Erro crasso na pergunta de conduta e fardamento incorreto."
                    value={motivoReprovacao}
                    onChange={(e) => setMotivoReprovacao(e.target.value)}
                    className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-red-600 text-zinc-100 font-tactical px-3 py-2 rounded-md outline-none transition-all placeholder:text-zinc-700 text-sm"
                  />
                </div>
              )}

              <button
                onClick={finalizarTeste}
                className="w-full bg-gradient-to-r from-red-950 via-red-800 to-red-950 text-white font-tactical font-semibold tracking-wider py-3 rounded-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-sm"
              >
                SALVAR RELATÓRIO E FINALIZAR
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
