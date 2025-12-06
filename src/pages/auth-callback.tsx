import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { useNavigation } from '../components/navigation-context';
import { useAuth } from '../components/auth-context';

export function AuthCallbackPage() {
  const { navigate } = useNavigation();
  const { handleRedirectCallback } = useAuth();
  const [status, setStatus] = useState('登录中... / Logging in...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Use the context handler if available, or fallback to direct Supabase call
        if (handleRedirectCallback) {
            await handleRedirectCallback();
        } else {
            const { error } = await supabase.auth.getSession();
            if (error) throw error;
        }
        
        setStatus('登录成功！/ Login successful!');
        // Redirect to profile as requested
        setTimeout(() => navigate('profile'), 1000);
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('登录失败 / Login failed');
        setTimeout(() => navigate('home'), 2000);
      }
    };

    handleCallback();
  }, [navigate, handleRedirectCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg text-slate-700 dark:text-slate-300">{status}</p>
      </div>
    </div>
  );
}
