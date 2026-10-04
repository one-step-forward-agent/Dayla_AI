import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, Sparkles, ArrowRight } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { Alert, FormField, Input } from '@/components/ui';
import { cn } from '@/utils/cn';

export const safeNext = (next: string | null): string =>
  next && next.startsWith('/') && !next.startsWith('//') ? next : '/app';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, login, isSubmitting: isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate(safeNext(searchParams.get('next')), { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
    } catch {
    }
  };

  return (
    <div className="relative max-w-md w-full mx-auto">
      <div className="mb-6 flex items-center justify-center gap-3">
        <span
          className={cn(
            "relative inline-flex items-center gap-1.5",
            "px-2.5 py-1 rounded-full",
            "bg-white/50 dark:bg-white/[0.05]",
            "backdrop-blur-md",
            "ring-1 ring-white/60 dark:ring-white/10",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.04)]",
            "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.3)]",
            "text-[11px] uppercase tracking-widest font-medium",
            "text-gray-600 dark:text-gray-300"
          )}
        >
          <LogIn size={11} aria-hidden="true" />
          Вход
        </span>

        <span className="text-xs text-gray-500 dark:text-gray-400">
          Рады видеть снова
        </span>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
          Вход в аккаунт
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Введите данные, чтобы продолжить
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField id="email" label="Email" required>
          {(field) => (
            <Input
              {...field}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          )}
        </FormField>

        <FormField id="password" label="Пароль" required>
          {(field) => (
            <Input
              {...field}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Минимум 8 символов"
              required
            />
          )}
        </FormField>

        {error && (
          <Alert
            variant="error"
            className="animate-in fade-in slide-in-from-top-1 duration-200"
          >
            {error}
          </Alert>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "group relative overflow-hidden w-full",
            "inline-flex items-center justify-center gap-2",
            "h-12 rounded-full",
            "text-sm md:text-base font-semibold",
            "text-sky-700 dark:text-sky-300",
            "bg-white/75 dark:bg-white/15",
            "backdrop-blur-xl",
            "ring-1 ring-white/70 dark:ring-white/20",
            "shadow-[0_8px_32px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(255,255,255,0.4)]",
            "dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(255,255,255,0.06)]",
            "hover:bg-white/90 dark:hover:bg-white/25",
            "hover:-translate-y-0.5 active:translate-y-0",
            "disabled:opacity-60 disabled:pointer-events-none",
            "transition-all duration-300"
          )}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-6 top-1 h-1/2 rounded-full bg-gradient-to-b from-white/80 to-transparent opacity-90 blur-[1px]"
          />

          <span className="relative inline-flex items-center gap-2">
            {isLoading ? (
              <>
                <span
                  aria-hidden="true"
                  className="w-4 h-4 rounded-full border-2 border-sky-500/40 border-t-sky-600 animate-spin"
                />
                Входим…
              </>
            ) : (
              <>
                Войти
                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </>
            )}
          </span>
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/60 dark:bg-white/10" />
        <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium">
          или
        </span>
        <div className="h-px flex-1 bg-white/60 dark:bg-white/10" />
      </div>

      <p className="mt-5 text-center text-sm text-gray-600 dark:text-gray-400">
        Нет аккаунта?{' '}
        <Link
          to="/register"
          className={cn(
            "group relative inline-flex items-center gap-1",
            "font-medium text-sky-600 dark:text-sky-400",
            "hover:text-sky-700 dark:hover:text-sky-300",
            "transition-colors"
          )}
        >
          Зарегистрироваться
          <ArrowRight
            size={13}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </p>

      <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
        <Sparkles size={11} aria-hidden="true" />
        Ваши данные защищены
      </div>
    </div>
  );
};

export default LoginPage;
