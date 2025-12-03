import React from 'react';
import { AuthCard } from './AuthCard';

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <AuthCard mode="login" />
    </div>
  );
}
