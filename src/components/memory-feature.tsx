import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from './language-context';
import { useTheme } from './theme-context';
import { useNavigation } from './navigation-context';
import { ArrowRight, HardDrive, Cloud, Brain } from 'lucide-react';

import imgMemory from 'figma:asset/3d1e625e1158e8a0c194b80170fc6f75c5bc139f.png';

export function MemoryFeature() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { setView } = useNavigation();

  return (
    <section className={`py-24 relative overflow-hidden ${theme === 'dark' ? 'bg-black' : 'bg-slate-50'}`}>
      <div className="container mx-auto px-4">
        <div className={`rounded-[3rem] p-8 md:p-16 border relative overflow-hidden ${
            theme === 'dark' 
                ? 'bg-[#111] border-white/10' 
                : 'bg-white border-slate-200 shadow-2xl shadow-slate-200/50'
        }`}>
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-cyan-500/20 to-transparent blur-3xl rounded-full opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                {/* Content */}
                <div className="order-2 lg:order-1">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6 ${
                        theme === 'dark' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                        <HardDrive className="w-4 h-4" /> {t('home.memory.subtitle')}
                    </div>
                    <h2 className={`text-4xl md:text-5xl font-black mb-6 leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {t('home.memory.title')}
                    </h2>
                    <p className={`text-lg md:text-xl font-medium mb-6 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {t('home.memory.desc')}
                    </p>
                    <div className={`p-6 rounded-2xl mb-8 border ${
                        theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-amber-50 border-amber-100'
                    }`}>
                        <div className="flex items-start gap-4">
                            <Brain className="w-6 h-6 text-amber-500 mt-1 flex-shrink-0" />
                            <p className={`text-sm font-bold ${theme === 'dark' ? 'text-amber-200' : 'text-amber-800'}`}>
                                {t('home.memory.benefit')}
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setView('product-memory')}
                        className={`group inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-bold transition-all ${
                            theme === 'dark' 
                                ? 'bg-white text-black hover:bg-slate-200' 
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                    >
                        {t('home.memory.cta')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Image */}
                <div className="order-1 lg:order-2 flex justify-center">
                    <motion.div 
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="relative w-full max-w-md aspect-square"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-tr from-cyan-500/30 to-purple-500/30 rounded-full blur-3xl ${theme === 'dark' ? 'opacity-40' : 'opacity-60'}`} />
                        <img 
                            src={imgMemory} 
                            alt="Baseul Memory" 
                            className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                        />
                    </motion.div>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
}
