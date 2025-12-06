import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase/client';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  handleRedirectCallback: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Record<string, unknown>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化 & 监听登录状态变化
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error('Failed to get initial session:', error);
          setCurrentUser(null);
        } else {
          setCurrentUser(session?.user ?? null);
        }
      } catch (e) {
        console.error('Unexpected error while getting initial session:', e);
        if (isMounted) setCurrentUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || '登录失败 / Login failed',
      };
    }
  };

  const signup = async (
    email: string,
    password: string,
    name?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // 需要邮箱确认的情况（Supabase 默认行为）
      if (data.user && !data.session) {
        return {
          success: true,
          error: '请查收邮箱确认注册 / Please check your email to confirm',
        };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || '注册失败 / Signup failed',
      };
    }
  };

  const loginWithGoogle = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            // offline + consent = 能拿到 refresh token（如果 Google 端配置允许）
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // NOTE: 对于 OAuth，浏览器会跳转到 Google，再回到 redirectTo
      // 这里不需要立即设置 currentUser，回调页里会通过 getSession 刷新
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Google 登录失败 / Google login failed',
      };
    }
  };

  // 别名，方便在别处调用
  const signInWithGoogle = loginWithGoogle;

  // 在 /auth/callback 页面调用，用来把 code 换成 session 并更新上下文
  const handleRedirectCallback = async (): Promise<void> => {
    // Supabase v2: getSession 会在有 code 时自动完成 exchange
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Error in handleRedirectCallback:', error);
      throw error;
    }

    if (session) {
      setCurrentUser(session.user);
    } else {
      setCurrentUser(null);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Failed to sign out:', error);
      }
    } finally {
      setCurrentUser(null);
    }
  };

  const updateProfile = async (updates: Record<string, unknown>) => {
    if (!currentUser) return;

    const { error } = await supabase.auth.updateUser({
      data: updates,
    });

    if (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }

    // 同步本地 currentUser.user_metadata
    setCurrentUser((prev) =>
      prev
        ? ({
            ...prev,
            user_metadata: {
              ...(prev.user_metadata ?? {}),
              ...updates,
            },
          } as User)
        : prev
    );
  };

  const refreshUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Failed to refresh user:', error);
        return;
      }
      setCurrentUser(data.user ?? null);
    } catch (e) {
      console.error('Unexpected error while refreshing user:', e);
    }
  };

  // Admin 判定逻辑（可按需调整）
  const isAdmin =
    !!currentUser &&
    (currentUser.email === 'admin@baseul.com' ||
      currentUser.user_metadata?.role === 'admin');

  const value: AuthContextType = {
    currentUser,
    loading,
    isLoggedIn: !!currentUser,
    isAdmin,
    login,
    signup,
    loginWithGoogle,
    signInWithGoogle,
    handleRedirectCallback,
    logout,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
