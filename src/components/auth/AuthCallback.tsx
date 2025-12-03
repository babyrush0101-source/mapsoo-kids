import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase/client';
import { useNavigation } from '../navigation-context';

export function AuthCallback() {
  const { navigate } = useNavigation();
  const [status, setStatus] = useState('登录中... / Logging in...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setStatus('登录失败 / Login failed');
          setTimeout(() => navigate('home'), 2000);
          return;
        }

        if (session) {
          setStatus('登录成功！/ Login successful!');
          setTimeout(() => navigate('home'), 1000);
        } else {
          setStatus('未找到会话 / No session found');
          setTimeout(() => navigate('home'), 2000);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setStatus('发生错误 / An error occurred');
        setTimeout(() => navigate('home'), 2000);
      }
    };

    handleCallback();
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
