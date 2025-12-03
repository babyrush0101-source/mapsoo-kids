import React, { useState } from 'react';
import { useLanguage } from './language-context';
import { Logo } from './ui/logo';
import { useTheme } from './theme-context';
import { useNavigation } from './navigation-context';
import { useAuth } from './auth-context';
import { useAdmin } from './admin/admin-context';

export function Footer() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { setView } = useNavigation();
  const { isLoggedIn, currentUser } = useAuth();
  const { content } = useAdmin();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (!isLoggedIn) {
      setView('login');
      return;
    }
    // Simulate subscription
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <footer className="relative z-10 mt-20">
      {/* Curved Top */}
      <div className={`absolute top-[-3rem] left-0 right-0 h-24 rounded-t-[50%] transform scale-x-125 z-0 shadow-2xl ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 shadow-black/50' 
          : 'bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 shadow-slate-200'
      }`} />

      <div className={`pt-20 pb-10 relative z-10 text-center border-t ${
        theme === 'dark'
          ? 'bg-gradient-to-b from-slate-800 via-slate-900 to-black text-slate-200 border-white/5'
          : 'bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 text-slate-900 border-white/50'
      }`}>
        <div className="container mx-auto px-4">
          <div className="mb-16">
            <div className="flex justify-center mb-6">
               <div className="animate-bounce">
                 <Logo className="w-16 h-16" />
               </div>
            </div>
            <h2 className={`text-2xl md:text-7xl font-black tracking-tighter mb-8 drop-shadow-sm ${
              theme === 'dark' 
                ? 'text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500' 
                : 'text-transparent bg-clip-text bg-gradient-to-b from-slate-800 to-slate-500'
            }`}>
              {t('footer.title.line1')} <br/>
              {t('footer.title.line2')}
            </h2>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col md:flex-row justify-center gap-6 mb-16">
            {/* Waitlist section - only show for non-logged-in users */}
            {!isLoggedIn && (
              <>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('footer.subscribe.placeholder')}
                  className={`px-8 py-4 rounded-full w-full md:w-80 text-lg font-medium focus:outline-none focus:ring-4 transition-all ${
                    theme === 'dark'
                      ? 'bg-white/5 border border-white/10 text-white focus:ring-slate-700 placeholder:text-slate-600'
                      : 'bg-white border border-slate-300 text-slate-900 focus:ring-slate-300 placeholder:text-slate-400'
                  }`}
                />
                <button 
                  onClick={handleSubscribe}
                  className={`px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-transform ${
                    theme === 'dark'
                      ? 'bg-white/10 text-white border border-white/10 hover:bg-white hover:text-slate-900'
                      : 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  {t('footer.subscribe.button')}
                </button>
              </>
            )}
          </div>

          <div className={`flex flex-col md:flex-row justify-between items-center gap-8 border-t pt-8 max-w-5xl mx-auto ${
            theme === 'dark' ? 'border-white/10' : 'border-slate-300'
          }`}>
            <div className="flex gap-4">
              <a href="#" className={`px-4 py-2 rounded-full font-bold transition-colors text-sm ${
                theme === 'dark' 
                  ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white' 
                  : 'bg-white/50 hover:bg-white text-slate-600 hover:text-slate-900'
              }`}>Instagram</a>
              <a href="#" className={`px-4 py-2 rounded-full font-bold transition-colors text-sm ${
                theme === 'dark' 
                  ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white' 
                  : 'bg-white/50 hover:bg-white text-slate-600 hover:text-slate-900'
              }`}>Twitter</a>
              <a href="#" className={`px-4 py-2 rounded-full font-bold transition-colors text-sm ${
                theme === 'dark' 
                  ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white' 
                  : 'bg-white/50 hover:bg-white text-slate-600 hover:text-slate-900'
              }`}>Discord</a>
            </div>
            
            <div className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'} flex items-center gap-4`}>
              <button 
                onClick={() => setView('admin-login')}
                className="text-xs opacity-50 hover:opacity-100 transition-opacity"
              >
                Admin
              </button>
              <p>{content['footer.copyright'] || t('footer.copyright')}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}