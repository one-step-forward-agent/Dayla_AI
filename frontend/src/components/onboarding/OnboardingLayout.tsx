import * as React from "react";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/theme";
import { cn } from "@/utils/cn";
import { PageBackdrop } from "@/components/onboarding/PageBackdrop";

export interface OnboardingLayoutProps {
  step: number;
  totalSteps: number;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  onSkip,
  nextLabel = "Далее",
  nextDisabled,
  loading,
}) => {
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden flex flex-col">
      <PageBackdrop />

      <header className="relative z-20 flex items-center justify-between px-4 pt-4 md:px-6">
        <Link to="/" className="inline-flex items-center gap-2 font-semibold text-gray-900 dark:text-white" aria-label="Dayla — на главную">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-white" aria-hidden="true">
            <Sparkles size={15} strokeWidth={2} />
          </span>
          Dayla
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex-1 flex items-start md:items-center justify-center px-4 md:px-6 py-8 md:py-10">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400 mt-2">{subtitle}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>
      </main>

      <footer className="relative z-10 px-4 md:px-6 pb-6 md:pb-8">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {onBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="dark:text-white dark:border-gray-600"
            >
              Назад
            </Button>
          )}
          <div className="flex-1" />
          {onSkip && (
            <Button type="button" variant="ghost" onClick={onSkip}>
              Пропустить
            </Button>
          )}
          {onNext && (
            <Button
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              isLoading={loading}
              className={cn(nextDisabled && "opacity-50")}
            >
              {nextLabel}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};
