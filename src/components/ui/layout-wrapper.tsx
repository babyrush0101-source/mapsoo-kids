import React, { ReactNode } from 'react';
import { InteractiveBackground } from './interactive-background';
import { useTheme } from '../theme-context';

export function LayoutWrapper({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen w-full overflow-hidden relative font-sans transition-colors duration-700 ${
      theme === 'dark' 
        ? 'bg-[#050505] text-slate-50 selection:bg-yellow-500 selection:text-black' 
        : 'bg-white text-slate-900 selection:bg-yellow-200 selection:text-yellow-900'
    }`}>
      {/* Base Gradient Layer - Warm Yellow / Haivivi Style */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Light Mode: Pure White with soft Yellow/Amber glows */}
        <div className={`absolute top-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full blur-[120px] animate-pulse-slow transition-opacity duration-1000 ${
            theme === 'dark' ? 'bg-yellow-900/10 opacity-40 mix-blend-screen' : 'bg-yellow-200/40 mix-blend-multiply'
        }`} />
        <div className={`absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[100px] animate-float transition-opacity duration-1000 ${
            theme === 'dark' ? 'bg-amber-900/10 opacity-40 mix-blend-screen' : 'bg-orange-100/60 mix-blend-multiply'
        }`} />
        <div className={`absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] rounded-full blur-[120px] animate-pulse-slower transition-opacity duration-1000 ${
            theme === 'dark' ? 'bg-yellow-600/5 opacity-20 mix-blend-screen' : 'bg-yellow-50/80 mix-blend-multiply'
        }`} />
        
        {/* Dark Mode: Deep Warm Black overlay */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${
          theme === 'dark' ? 'bg-gradient-to-b from-[#050505]/80 via-transparent to-[#050505] opacity-100' : 'opacity-0'
        }`} />
      </div>

      {/* Interactive Canvas Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <InteractiveBackground />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
