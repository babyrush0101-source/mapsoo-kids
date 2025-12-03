import React, { useState } from 'react';
import { useAuth } from '../auth-context';
import { useNavigation } from '../navigation-context';
import { useLanguage } from '../language-context';
import { Mail, Lock, User } from 'lucide-react';

interface AuthCardProps {
  mode?: 'login' | 'signup';
  onSuccess?: () => void;
}

export function AuthCard({ mode: initialMode = 'login', onSuccess }: AuthCardProps) {
  const { login, signup, loginWithGoogle } = useAuth();
  const { navigate } = useNavigation();
  const { language } = useLanguage();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isLogin
        ? await login(email, password)
        : await signup(email, password, name);

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('home');
        }
      } else {
        setError(result.error || 'Something went wrong');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('home');
        }
      } else {
        setError(result.error || 'Google login failed');
      }
    } catch (err) {
      setError('Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const text: Record<string, any> = {
    en: {
      login: 'Login',
      signup: 'Sign Up',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      loginButton: 'Login',
      signupButton: 'Create Account',
      switchToSignup: "Don't have an account? Sign up",
      switchToLogin: 'Already have an account? Login',
      continueWithGoogle: 'Continue with Google',
      orDivider: 'or',
      title: 'Login to Baseul Kids',
      subtitle: 'Manage your child\'s growth data and AI companion settings.',
      hint1: 'Tip: Use any email to register (password must be at least 6 characters).',
      hint2: 'Need help? Contact: admin@baseul.com',
    },
    zh: {
      login: '登录',
      signup: '注册',
      email: '邮箱',
      password: '密码',
      name: '姓名',
      loginButton: '登录',
      signupButton: '创建账户',
      switchToSignup: '还没有账户？立即注册',
      switchToLogin: '已有账户？立即登录',
      continueWithGoogle: '使用 Google 登录',
      orDivider: '或',
      title: '登录 Baseul Kids',
      subtitle: '管理孩子的成长数据与 AI 陪伴设置。',
      hint1: '提示：使用任意邮箱即可注册(密码不少于 6 位)。',
      hint2: '如需帮助，请联系：admin@baseul.com',
    },
    fr: {
      login: 'Connexion',
      signup: 'Inscription',
      email: 'Email',
      password: 'Mot de passe',
      name: 'Nom',
      loginButton: 'Se connecter',
      signupButton: 'Créer un compte',
      switchToSignup: "Pas de compte? S'inscrire",
      switchToLogin: 'Déjà un compte? Se connecter',
      continueWithGoogle: 'Continuer avec Google',
      orDivider: 'ou',
      title: 'Connexion à Baseul Kids',
      subtitle: 'Gérez les données de croissance et les paramètres d\'accompagnement IA de votre enfant.',
      hint1: 'Astuce: Utilisez n\'importe quel email pour vous inscrire (mot de passe minimum 6 caractères).',
      hint2: 'Besoin d\'aide? Contactez: admin@baseul.com',
    },
    de: {
      login: 'Anmelden',
      signup: 'Registrieren',
      email: 'E-Mail',
      password: 'Passwort',
      name: 'Name',
      loginButton: 'Anmelden',
      signupButton: 'Konto erstellen',
      switchToSignup: 'Kein Konto? Registrieren',
      switchToLogin: 'Bereits ein Konto? Anmelden',
      continueWithGoogle: 'Mit Google fortfahren',
      orDivider: 'oder',
      title: 'Bei Baseul Kids anmelden',
      subtitle: 'Verwalten Sie die Wachstumsdaten Ihres Kindes und KI-Begleiteinstellungen.',
      hint1: 'Tipp: Verwenden Sie eine beliebige E-Mail zur Registrierung (Passwort mindestens 6 Zeichen).',
      hint2: 'Benötigen Sie Hilfe? Kontakt: admin@baseul.com',
    },
  };

  const t = text[language] || text.en;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl text-slate-900 dark:text-white mb-2">{t.title}</h1>
        <p className="text-base text-slate-600 dark:text-slate-400">{t.subtitle}</p>
      </div>

      {/* Main Card Content */}
      <div>
        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isLogin
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t.login}
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              !isLogin
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t.signup}
          </button>
        </div>

        {/* Google Login Button */}
        <div className="mb-5">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-slate-900 dark:text-white font-medium text-sm">{t.continueWithGoogle}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">{t.orDivider}</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs mb-1.5 text-slate-700 dark:text-slate-300 font-medium">{t.name}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder={t.name}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs mb-1.5 text-slate-700 dark:text-slate-300 font-medium">{t.email}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder-slate-400 dark:placeholder-slate-500"
                placeholder={t.email}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5 text-slate-700 dark:text-slate-300 font-medium">{t.password}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder-slate-400 dark:placeholder-slate-500"
                placeholder={t.password}
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 font-medium text-sm"
          >
            {loading ? '...' : isLogin ? t.loginButton : t.signupButton}
          </button>
        </form>

        {/* Switch Mode */}
        <div className="mt-5 text-center">
          <button
            onClick={() => setMode(isLogin ? 'signup' : 'login')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {isLogin ? t.switchToSignup : t.switchToLogin}
          </button>
        </div>
      </div>

      {/* Help Info */}
      <div className="mt-5 text-center space-y-0.5">
        <p className="text-xs text-slate-500 dark:text-slate-400">{t.hint1}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t.hint2}</p>
      </div>
    </div>
  );
}