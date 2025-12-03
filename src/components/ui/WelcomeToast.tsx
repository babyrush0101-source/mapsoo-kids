import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { useAuth } from '../auth-context';

export function WelcomeToast() {
  const { currentUser, isLoggedIn } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      // Check if user has seen welcome message
      const hasSeenWelcome = localStorage.getItem(`welcome_shown_${currentUser.id}`);
      if (!hasSeenWelcome) {
        setShow(true);
        localStorage.setItem(`welcome_shown_${currentUser.id}`, 'true');
        
        // Auto hide after 5 seconds
        const timer = setTimeout(() => setShow(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoggedIn, currentUser]);

  if (!currentUser) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-24 right-4 z-50 max-w-sm"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 relative overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-50" />
            
            {/* Content */}
            <div className="relative">
              <button
                onClick={() => setShow(false)}
                className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    Welcome, {currentUser.name || currentUser.email.split('@')[0]}! 🎉
                  </h3>
                  <p className="text-sm text-gray-600">
                    You can now:
                  </p>
                </div>
              </div>

              <ul className="space-y-2 ml-13 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">✓</span>
                  <span>Join Community discussions</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">✓</span>
                  <span>Create and reply to posts</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-pink-500">✓</span>
                  <span>One-click submit with your email</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
