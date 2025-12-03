import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Check } from 'lucide-react';
import { useLanguage, Region } from './language-context';
import { useTheme } from './theme-context';

const regions: { code: Region; label: string; lang: string; flag: string }[] = [
  { code: 'US', label: 'United States', lang: 'English', flag: '🇺🇸' },
  { code: 'CN', label: 'China', lang: '中文', flag: '🇨🇳' },
  { code: 'CA', label: 'Canada', lang: 'English / Français', flag: '🇨🇦' },
  { code: 'FR', label: 'France', lang: 'Français', flag: '🇫🇷' },
  { code: 'DE', label: 'Germany', lang: 'Deutsch', flag: '🇩🇪' },
  { code: 'ES', label: 'Spain', lang: 'Español', flag: '🇪🇸' },
];

export function LanguageSelector() {
  const { region, setRegion } = useLanguage();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const currentRegion = regions.find(r => r.code === region);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors font-medium ${
          theme === 'dark' 
            ? 'text-slate-300 hover:bg-white/10 hover:text-white' 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <Globe className={`w-5 h-5 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`} />
        <span className="hidden sm:inline">{currentRegion?.flag}</span>
        <span className="text-sm">{region}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border overflow-hidden z-50 origin-top-right ${
                theme === 'dark'
                  ? 'bg-[#1a1a1a] border-white/10 shadow-black/50'
                  : 'bg-white/90 border-white/40 shadow-cyan-900/10'
              }`}
            >
              <div className="p-2 max-h-[300px] overflow-y-auto">
                <div className={`px-3 py-2 text-xs font-bold uppercase tracking-wider ${
                   theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Select Region
                </div>
                {regions.map((r) => (
                  <button
                    key={r.code}
                    onClick={() => {
                      setRegion(r.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all group ${
                      region === r.code 
                        ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900')
                        : (theme === 'dark' ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900')
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{r.flag}</span>
                      <div>
                        <div className="text-sm font-bold">{r.label}</div>
                        <div className="text-xs opacity-70">{r.lang}</div>
                      </div>
                    </div>
                    {region === r.code && (
                      <Check className="w-4 h-4 text-cyan-500" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
