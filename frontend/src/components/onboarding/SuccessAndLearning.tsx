import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  PartyPopper, Sun, MessageCircle, Settings2,
  Sparkles, Check, CalendarDays, Target, Link2,
  ArrowRight, Rocket,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useAuthStore } from "@/store/authStore";
import { applyOnboarding, useOnboarding } from "./OnboardingContext";
import { cn } from "@/utils/cn";
import { glass } from "@/styles/glass";

const TOTAL = 10;

const G = glass.strong;

const SpecularHighlight: React.FC<{ className?: string }> = ({ className }) => (
  <span aria-hidden="true" className={cn(G.specular, className)} />
);

type Highlight = {
  icon: LucideIcon;
  tint: string;
  tintSoft: string;
  tintRing: string;
  title: string;
};

const HIGHLIGHTS: Highlight[] = [
  {
    icon: Sun,
    tint:     "text-amber-600 dark:text-amber-300",
    tintSoft: "bg-amber-100/55 dark:bg-amber-500/10",
    tintRing: "ring-amber-200/60 dark:ring-amber-400/20",
    title: "Экран «Сегодня»",
  },
  {
    icon: MessageCircle,
    tint:     "text-sky-600 dark:text-sky-300",
    tintSoft: "bg-sky-100/55 dark:bg-sky-500/10",
    tintRing: "ring-sky-200/60 dark:ring-sky-400/20",
    title: "Чат с Dayla",
  },
  {
    icon: Settings2,
    tint:     "text-emerald-600 dark:text-emerald-300",
    tintSoft: "bg-emerald-100/55 dark:bg-emerald-500/10",
    tintRing: "ring-emerald-200/60 dark:ring-emerald-400/20",
    title: "Настройки под вас",
  },
];

export const SuccessAndLearning: React.FC = () => {
  const navigate = useNavigate();
  const { data } = useOnboarding();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const finish = async () => {
    if (isAuthenticated) {
      await applyOnboarding();
      navigate("/app", { replace: true });
    } else {
      navigate("/register", { replace: true });
    }
  };

  const summary = React.useMemo(() => {
    const items: { icon: LucideIcon; label: string; value: string }[] = [];

    if (data.spheres.length > 0) {
      items.push({
        icon: Target,
        label: "Сферы",
        value: `${data.spheres.length} ${plural(data.spheres.length, "сфера", "сферы", "сфер")}`,
      });
    }
    if (data.goals.length > 0) {
      items.push({
        icon: Sparkles,
        label: "Намерения",
        value: `${data.goals.length} ${plural(data.goals.length, "цель", "цели", "целей")}`,
      });
    }
    if ((data.integrations ?? []).length > 0) {
      items.push({
        icon: Link2,
        label: "Интеграции",
        value: `${data.integrations.length} ${plural(data.integrations.length, "сервис", "сервиса", "сервисов")}`,
      });
    }
    return items;
  }, [data]);

  return (
    <OnboardingLayout
      step={TOTAL}
      totalSteps={TOTAL}
      title="Всё готово!"
      subtitle="Дальше — только вы и ваш план. Я рядом."
      onBack={() => navigate("/onboarding/lets-plan-tomorrow")}
    >
      <div className="relative space-y-5">
        <div className={cn("relative overflow-hidden rounded-2xl", G.surface)}>
          <SpecularHighlight />

          <div className="relative p-6 md:p-8 text-center">
            <div className="relative flex justify-center mb-5">
              <div
                aria-hidden="true"
                className={cn(
                  "relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden",
                  "bg-white/60 dark:bg-white/[0.06] text-sky-600 dark:text-sky-300",
                  "ring-1 ring-white/70 dark:ring-white/15",
                  "shadow-[0_8px_24px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]",
                  "dark:shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]"
                )}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-2 top-1 h-1/2 rounded-full bg-gradient-to-b from-white/80 to-transparent blur-[1px]"
                />
                <PartyPopper size={28} className="relative" />
              </div>
            </div>

            <p className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
              Онбординг пройден
            </p>
          </div>
        </div>

        {summary.length > 0 && (
          <div className={cn("relative overflow-hidden rounded-2xl", G.surface)}>
            <SpecularHighlight />

            <div className="relative p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative shrink-0 w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden",
                    "bg-emerald-500/15 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                    "ring-1 ring-emerald-400/40 dark:ring-emerald-400/30",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(15,23,42,0.05)]"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/60 to-transparent blur-[0.5px]"
                  />
                  <Check size={14} strokeWidth={3} className="relative" />
                </span>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  Ваш профиль настроен
                </p>
              </div>

              <ul className="grid sm:grid-cols-2 gap-2.5">
                {summary.map((s) => {
                  const Icon = s.icon;
                  return (
                    <li
                      key={s.label}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                        "bg-white/50 dark:bg-white/[0.03]",
                        "backdrop-blur-md",
                        "ring-1 ring-white/60 dark:ring-white/10",
                        "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(15,23,42,0.04)]",
                        "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.3)]"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "relative shrink-0 w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden",
                          "bg-white/60 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300",
                          "ring-1 ring-white/70 dark:ring-white/10",
                          "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.05)]"
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/70 to-transparent blur-[0.5px]"
                        />
                        <Icon size={14} className="relative" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {s.label}
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                          {s.value}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {data.spheres.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/40 dark:border-white/10">
                  <p className="text-[11px] uppercase tracking-widest font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Ваши сферы
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.spheres.map((s) => (
                      <span
                        key={s.id}
                        className={cn(
                          "relative inline-flex items-center gap-1.5",
                          "px-2.5 py-1 rounded-full",
                          "bg-white/50 dark:bg-white/[0.05]",
                          "backdrop-blur-md",
                          "ring-1 ring-white/60 dark:ring-white/10",
                          "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.04)]",
                          "text-xs font-medium text-gray-700 dark:text-gray-300"
                        )}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: s.color,
                            boxShadow: `0 1px 2px ${s.color}88`,
                          }}
                          aria-hidden="true"
                        />
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={finish}
            className={cn(
              "group relative overflow-hidden w-full",
              "inline-flex items-center justify-center gap-2",
              "px-6 py-4 rounded-full",
              "text-base font-semibold",
              "text-sky-700 dark:text-sky-300",
              "bg-white/75 dark:bg-white/15",
              "backdrop-blur-xl",
              "ring-1 ring-white/70 dark:ring-white/20",
              "shadow-[0_8px_32px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(255,255,255,0.4)]",
              "dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(255,255,255,0.06)]",
              "hover:bg-white/90 dark:hover:bg-white/25",
              "hover:-translate-y-0.5 active:translate-y-0",
              "transition-all duration-300"
            )}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 top-1 h-1/2 rounded-full bg-gradient-to-b from-white/80 to-transparent opacity-90 blur-[1px]"
            />
            <Rocket
              size={18}
              className="relative transition-transform duration-300 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
            <span className="relative">Начать</span>
            <ArrowRight
              size={18}
              className="relative transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>

          <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
            Настройки можно изменить в любой момент
          </p>
        </div>
      </div>
    </OnboardingLayout>
  );
};

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
