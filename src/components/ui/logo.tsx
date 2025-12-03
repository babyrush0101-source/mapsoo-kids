import React from 'react';
import { useTheme } from '../theme-context';

export function Logo({ className = "w-10 h-10", withText = false }: { className?: string, withText?: boolean }) {
  const { theme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <svg 
        viewBox="0 0 100 100" 
        className={className}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" /> {/* Purple */}
            <stop offset="50%" stopColor="#3B82F6" /> {/* Blue */}
            <stop offset="100%" stopColor="#06B6D4" /> {/* Cyan */}
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Superellipse (Squircle) Base */}
        <path 
          d="M 20 50 C 20 20 20 20 50 20 C 80 20 80 20 80 50 C 80 80 80 80 50 80 C 20 80 20 80 20 50 Z" 
          fill="url(#logoGradient)"
          className="opacity-90"
        />
        
        {/* North Star (Extending beyond) */}
        <path 
          d="M 50 5 C 55 40 60 45 95 50 C 60 55 55 60 50 95 C 45 60 40 55 5 50 C 40 45 45 40 50 5 Z" 
          fill="white"
          filter="url(#glow)"
          className="drop-shadow-lg"
        />
      </svg>
      
      {withText && (
        <span className={`font-bold tracking-tight text-lg md:text-xl whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          Baseul <span className="font-light">Kids</span>
        </span>
      )}
    </div>
  );
}
