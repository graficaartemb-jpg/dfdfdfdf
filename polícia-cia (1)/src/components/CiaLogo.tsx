import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { obterConfiguracaoSite } from '../lib/db';
import { ConfiguracaoSite } from '../types';

export default function CiaLogo() {
  const [config, setConfig] = useState<ConfiguracaoSite | null>(null);

  useEffect(() => {
    try {
      const siteConfig = obterConfiguracaoSite();
      setConfig(siteConfig);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const nomeSite = config?.nomeSite || 'POLÍCIA CIA';
  const logoTexto = config?.logoTexto || 'CIA';
  const logoUrl = config?.logoUrl;

  // Split title dynamically to preserve the exact stylish design of original
  let part1 = 'Polícia';
  let part2 = 'CIA';

  if (nomeSite) {
    const parts = nomeSite.trim().split(' ');
    if (parts.length >= 2) {
      part1 = parts[0];
      part2 = parts.slice(1).join(' ');
    } else {
      part1 = nomeSite;
      part2 = '';
    }
  }

  return (
    <div className="flex flex-col items-center select-none">
      {/* SVG Header - Wings, Shield & Eagle */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-[420px] h-20 flex items-center justify-center relative"
      >
        {/* Left Wing */}
        <div className="flex flex-col gap-1.5 items-end justify-center w-1/3 pr-3">
          <div className="h-[3px] bg-gradient-to-l from-zinc-500 to-transparent w-full opacity-60"></div>
          <div className="h-[4px] bg-gradient-to-l from-zinc-500 to-transparent w-4/5 opacity-70"></div>
          <div className="h-[3px] bg-gradient-to-l from-zinc-600 to-transparent w-2/3 opacity-50"></div>
        </div>

        {/* Central Shield or custom Logo */}
        <div className="relative w-16 h-16 flex items-center justify-center z-10">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(239,68,68,0.25)]"
            />
          ) : (
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full drop-shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            >
              {/* Outer Shield Outline */}
              <path
                d="M10 20 L50 10 L90 20 Q90 60 50 90 Q10 60 10 20 Z"
                fill="#18181b"
                stroke="#b45309"
                strokeWidth="2.5"
              />
              {/* Inner Shield Outline */}
              <path
                d="M15 24 L50 15 L85 24 Q85 58 50 85 Q15 58 15 24 Z"
                fill="#09090b"
                stroke="#78350f"
                strokeWidth="1.5"
              />
              {/* Stars on Top Banner */}
              <text
                x="50"
                y="32"
                fill="#f59e0b"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
                letterSpacing="2"
                className="font-sans"
              >
                ★{logoTexto}★
              </text>
              {/* Golden Eagle Head */}
              <g transform="translate(25, 34) scale(0.5)">
                {/* Eagle Head & Neck */}
                <path
                  d="M 50 10 
                     C 35 15, 30 25, 28 35 
                     C 26 45, 32 60, 40 70 
                     C 42 72, 45 68, 43 65 
                     C 35 55, 38 45, 45 42 
                     C 48 40, 52 45, 50 50 
                     C 48 55, 42 58, 45 62 
                     C 50 65, 60 58, 65 45 
                     C 70 30, 65 15, 50 10 Z"
                  fill="#d97706"
                />
                {/* Eagle Beak */}
                <path
                  d="M 28 35 
                     C 20 38, 12 45, 10 52 
                     C 14 53, 18 50, 22 45 
                     C 24 42, 26 38, 28 35 Z"
                  fill="#f59e0b"
                />
                {/* Eye */}
                <circle cx="38" cy="30" r="3" fill="#fef08a" />
                <circle cx="38" cy="30" r="1" fill="#000" />
                {/* Details / Feathers */}
                <path
                  d="M 45 18 C 40 22, 42 26, 45 28"
                  stroke="#fef08a"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M 52 25 C 48 30, 50 35, 52 38"
                  stroke="#fef08a"
                  strokeWidth="1"
                  fill="none"
                />
              </g>
            </svg>
          )}
        </div>

        {/* Right Wing */}
        <div className="flex flex-col gap-1.5 items-start justify-center w-1/3 pl-3">
          <div className="h-[3px] bg-gradient-to-r from-zinc-500 to-transparent w-full opacity-60"></div>
          <div className="h-[4px] bg-gradient-to-r from-zinc-500 to-transparent w-4/5 opacity-70"></div>
          <div className="h-[3px] bg-gradient-to-r from-zinc-600 to-transparent w-2/3 opacity-50"></div>
        </div>
      </motion.div>

      {/* Main Text Title */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        className="flex items-center gap-4 mt-2 select-none"
      >
        <span className="text-[52px] sm:text-[64px] font-anton tracking-wide text-metallic leading-none uppercase">
          {part1}
        </span>
        {part2 && (
          <span className="text-[52px] sm:text-[64px] font-anton tracking-wide text-red-600 text-red-glow leading-none uppercase">
            {part2}
          </span>
        )}
      </motion.div>

      {/* Underline Decoration */}
      <div className="w-full max-w-[450px] flex items-center justify-between gap-4 mt-1">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-red-600/60 to-red-600 w-1/2 relative">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-600 blur-[2px]"></div>
        </div>
        <div className="flex gap-1">
          <span className="text-red-600 text-xs text-red-glow animate-pulse">★</span>
          <span className="text-red-500 text-sm text-red-glow">★</span>
          <span className="text-red-600 text-xs text-red-glow animate-pulse">★</span>
        </div>
        <div className="h-[1px] bg-gradient-to-l from-transparent via-red-600/60 to-red-600 w-1/2 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-600 blur-[2px]"></div>
        </div>
      </div>
    </div>
  );
}
