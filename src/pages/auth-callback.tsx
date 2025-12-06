import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { useNavigation } from '../components/navigation-context';

export function AuthCallbackPage() {
  const { navigate } = useNavigation();
  const [status, setStatus] = useState('登录中... / Logging in...');

  useEffect(() => {
    const run = async () => {
      try {
        const url = window.location.href;

        // 核心：从 OAuth 回调 URL 交换 code，创建登录 session
        const { data, error } = await supabase.auth.exchangeCodeForSession(url);

        if (error) {
          console.error('OAuth callback error:', error);
          setStatus('登录失败 / Login failed');
          setTimeout(() => navigate('home'), 1500);
          return;
        }

        setStatus('登录成功！/ Login successful!');
        setTimeout(() => navigate('profile'), 500);
      } catch (err) {
        console.error('Auth callback exception:', err);
        setStatus('登录失败 / Login failed');
        setTimeout(() => navigate('home'), 1500);
      }
    };

    run();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg text-slate-700 dark:text-slate-300">{status}</p>
      </div>
    </div>
  );
}
