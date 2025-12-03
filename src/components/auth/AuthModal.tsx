import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { AuthCard } from './AuthCard';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, mode = 'login' }: AuthModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Top Right */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-lg hover:scale-110"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Auth Card with semi-transparent background */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20 dark:border-slate-700/50">
          <AuthCard mode={mode} onSuccess={onClose} />
        </div>
      </div>
    </div>
  );
}