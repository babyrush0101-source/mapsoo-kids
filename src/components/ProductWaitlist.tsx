import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { useTheme } from './theme-context';
import { useAuth } from './auth-context';

interface ProductWaitlistProps {
  joined: boolean;
  handleJoin: (e?: React.FormEvent) => void;
  email: string;
  setEmail: (email: string) => void;
  addMemory: boolean;
  gradient: string;
  themeColor: string;
  productTitle: string;
}

export function ProductWaitlist({
  joined,
  handleJoin,
  email,
  setEmail,
  addMemory,
  gradient,
  themeColor,
  productTitle
}: ProductWaitlistProps) {
  const { theme } = useTheme();
  const { currentUser, isLoggedIn } = useAuth();

  return (
    <div className={`p-6 rounded-[2rem] border shadow-xl backdrop-blur-2xl ${
      theme === 'dark' 
        ? 'bg-white/5 border-white/10 shadow-cyan-900/20' 
        : 'bg-white/60 border-white/60 shadow-cyan-100/50'
    }`} id="email-signup">
      {!joined ? (
        <div className="flex flex-col gap-4">
          <div>
            <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
              Join the Waitlist {addMemory && ' (Bundle)'}
            </label>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Limited spots available for the first batch.</p>
          </div>
          {isLoggedIn ? (
            // Logged-in users: Show only button, no email input
            <div className="flex flex-col gap-3">
              <div className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-white/5 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                <p className="text-sm font-medium">✓ Logged in as: {currentUser?.email}</p>
              </div>
              <button 
                onClick={() => handleJoin()}
                className={`w-full px-8 py-3 rounded-xl bg-gradient-to-r ${gradient} text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all`}
              >
                Join Waitlist
              </button>
            </div>
          ) : (
            // Non-logged-in users: Show email input + button
            <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-2">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className={`flex-1 px-6 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-400 font-medium ${
                  theme === 'dark' 
                    ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500' 
                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-300'
                }`}
              />
              <button 
                type="submit"
                className={`w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r ${gradient} text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all`}
              >
                Join
              </button>
            </form>
          )}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4"
        >
          <div className={`w-16 h-16 bg-${themeColor}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Check className={`w-8 h-8 text-${themeColor}-600`} />
          </div>
          <h3 className={`text-2xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>You're on the list!</h3>
          <p className="text-slate-500 font-medium">We'll notify you when {productTitle} is ready.</p>
        </motion.div>
      )}
    </div>
  );
}
