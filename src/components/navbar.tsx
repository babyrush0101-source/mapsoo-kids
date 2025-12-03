import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Sun, Moon, ChevronDown, User as UserIcon, LogOut } from 'lucide-react';
import { useLanguage } from './language-context';
import { LanguageSelector } from './language-selector';
import { useNavigation } from './navigation-context';
import { useTheme } from './theme-context';
import { useAuth } from './auth-context';
import { Logo } from './ui/logo';
import { useAuthModal } from './auth/auth-modal-context';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const { t, region } = useLanguage();
  const { setView } = useNavigation();
  const { theme, toggleTheme } = useTheme();
  const { currentUser, isLoggedIn, logout } = useAuth();
  const { openAuthModal } = useAuthModal();

  const handleNavClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    action();
    setIsMobileMenuOpen(false);
  };

  const productLinks = [
    { name: t('p1.name'), view: 'product-early', color: 'text-cyan-500' },
    { name: t('p2.name'), view: 'product-growth', color: 'text-purple-500' },
    { name: t('p3.name'), view: 'product-explore', color: 'text-blue-500' },
    { name: t('p4.name'), view: 'product-memory', color: 'text-green-500' }
  ];

  return (
    <>
      {/* Floating Capsule Navbar */}
      <div className="fixed top-6 left-0 right-0 z-50 px-4">
        <motion.nav 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`w-full max-w-7xl mx-auto px-4 md:px-6 py-3 rounded-full shadow-2xl backdrop-blur-xl border transition-all duration-500 ${
            theme === 'dark' 
              ? 'bg-white/5 border-white/10 shadow-black/20 text-white' 
              : 'bg-white/70 border-white/40 shadow-yellow-900/5 text-slate-900'
          }`}
        >
          <div className="flex items-center">
            {/* Left Slot */}
            <div className="w-[220px] flex items-center justify-start">
              <a 
                href="#" 
                onClick={(e) => handleNavClick(e, () => { setView('home'); window.scrollTo(0, 0); })}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Logo className="w-8 h-8 flex-shrink-0" withText={true} />
              </a>
            </div>

            {/* Center: Desktop Navigation Links */}
            <div className="flex-1 hidden md:flex items-center justify-center">
              <div className={`flex items-center gap-1 text-sm font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                <a 
                  href="#" 
                  onClick={(e) => handleNavClick(e, () => { setView('home'); window.scrollTo(0, 0); })}
                  className={`px-3.5 py-2 rounded-full transition-colors whitespace-nowrap ${theme === 'dark' ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  {t('nav.home')}
                </a>

                {/* Products Dropdown */}
                <div 
                  className="relative group"
                  onMouseEnter={() => setIsProductMenuOpen(true)}
                  onMouseLeave={() => setIsProductMenuOpen(false)}
                >
                  <button 
                    className={`flex items-center gap-1 px-3.5 py-2 rounded-full transition-colors whitespace-nowrap ${theme === 'dark' ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                    {t('nav.products')} <ChevronDown className="w-3 h-3" />
                  </button>
                  
                  <AnimatePresence>
                    {isProductMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 rounded-2xl p-1 shadow-xl border overflow-hidden ${
                          theme === 'dark' 
                            ? 'bg-[#1a1a1a] border-white/10 text-white' 
                            : 'bg-white/90 border-white/20 text-slate-900'
                        }`}
                      >
                        {productLinks.map((item) => (
                          <button
                            key={item.name}
                            onClick={() => setView(item.view as any)}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                              theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                            }`}
                          >
                            <span className={item.color}>●</span> {item.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <a 
                  href="#" 
                  onClick={(e) => handleNavClick(e, () => setView('philosophy'))}
                  className={`px-3.5 py-2 rounded-full transition-colors whitespace-nowrap ${theme === 'dark' ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  {t('nav.philosophy')}
                </a>

                <a 
                  href="#" 
                  onClick={(e) => handleNavClick(e, () => setView('blog'))}
                  className={`px-3.5 py-2 rounded-full transition-colors whitespace-nowrap ${theme === 'dark' ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  {t('nav.blog')}
                </a>
              </div>
            </div>

            {/* Right Slot */}
            <div className="w-[220px] flex items-center justify-end gap-2 md:gap-3">
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-all ${
                  theme === 'dark' 
                    ? 'text-yellow-400 hover:bg-white/10' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <div className="hidden md:block">
                 <LanguageSelector />
              </div>

              {/* User Menu or Login Button */}
              {isLoggedIn ? (
                <div 
                  className="relative"
                  onMouseEnter={() => setIsUserMenuOpen(true)}
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <button 
                    className={`flex items-center justify-center ml-1 md:ml-2 p-2 rounded-full text-sm font-bold transition-all ${
                      theme === 'dark' 
                        ? 'bg-white/10 text-white hover:bg-white/20' 
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs">
                      {currentUser?.user_metadata?.name?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={`absolute top-full right-0 mt-2 w-48 rounded-2xl p-2 shadow-xl border overflow-hidden ${
                          theme === 'dark' 
                            ? 'bg-[#1a1a1a] border-white/10 text-white' 
                            : 'bg-white/90 border-white/20 text-slate-900'
                        }`}
                      >
                        <div className="px-4 py-3 border-b border-white/10">
                          <p className="text-xs text-gray-400">Signed in as</p>
                          <p className="text-sm font-medium truncate">{currentUser?.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            setView('profile');
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 mt-1 ${
                            theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                          }`}
                        >
                          <UserIcon className="w-4 h-4" /> Profile
                        </button>
                        <button
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                            theme === 'dark' ? 'hover:bg-white/10 text-red-400' : 'hover:bg-slate-100 text-red-600'
                          }`}
                        >
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button 
                  onClick={() => openAuthModal()} 
                  className={`ml-1 md:ml-2 px-4 md:px-5 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-all shadow-lg whitespace-nowrap ${
                    theme === 'dark' 
                      ? 'bg-white text-black hover:bg-gray-100' 
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
                  }`}
                >
                  {region === 'CN' ? '登录' : 'Login'}
                </button>
              )}

               {/* Mobile Menu Toggle */}
              <button 
                className={`md:hidden p-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </motion.nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed inset-x-4 top-24 z-40 rounded-3xl backdrop-blur-xl border shadow-2xl md:hidden ${
               theme === 'dark' 
                 ? 'bg-[#1d1d1f]/95 border-white/10 text-white' 
                 : 'bg-white/95 border-white/40 text-slate-900'
            }`}
          >
            <div className="p-6 flex flex-col gap-4">
              <a href="#" onClick={(e) => handleNavClick(e, () => setView('home'))} className={`text-lg font-bold py-2 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
                {t('nav.home')}
              </a>
              
              <div className="py-2">
                <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>
                  {t('nav.productsTitle')}
                </div>
                <div className="flex flex-col gap-3 pl-2">
                   {productLinks.map((item) => (
                     <button 
                        key={item.name}
                        onClick={() => { setView(item.view as any); setIsMobileMenuOpen(false); }} 
                        className="text-left font-medium"
                     >
                        {item.name}
                     </button>
                   ))}
                </div>
              </div>

              <a href="#" onClick={(e) => handleNavClick(e, () => setView('philosophy'))} className={`text-lg font-bold py-2 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
                {t('nav.philosophy')}
              </a>
              <a href="#" onClick={(e) => handleNavClick(e, () => setView('blog'))} className={`text-lg font-bold py-2 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
                {t('nav.blog')}
              </a>
              {/* Community link removed from mobile menu - feature frozen */}
              
              {isLoggedIn && (
                <div className={`pt-4 mt-2 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white">
                      {currentUser?.user_metadata?.name?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{currentUser?.user_metadata?.name || 'User'}</p>
                      <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                      theme === 'dark' ? 'hover:bg-white/10 text-red-400' : 'hover:bg-slate-100 text-red-600'
                    }`}
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
              
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm font-medium">{t('nav.language')}</span>
                <LanguageSelector />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}