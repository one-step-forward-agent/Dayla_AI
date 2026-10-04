import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap, Bell, ListChecks, Scale, Target, Clock,
  Sparkles, ArrowRight, Check,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { glass } from "@/styles/glass";

const TOTAL = 10;

const G = glass.subtle;

type Option = {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  tint: string;
  tintSoft: string;
  tintRing: string;
  tintActiveBg: string;
  tintActiveRing: string;
  tintActiveShadow: string;
  tintGlow: string;
};

const OPTIONS: Option[] = [
  {
    id: "productivity",
    label: "Повысить продуктивность",
    hint: "Успевать больше без выгорания",
    icon: Zap,
    tint:     "text-amber-600 dark:text-amber-300",
    tintSoft: "bg-amber-100/55 dark:bg-amber-500/10",
    tintRing: "ring-amber-200/60 dark:ring-amber-400/20",
    tintActiveBg:     "bg-amber-500",
    tintActiveRing:   "ring-amber-400/70",
    tintActiveShadow: "shadow-[0_4px_14px_rgba(245,158,11,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]",
    tintGlow:         "from-amber-400/60 to-orange-500/40",
  },
  {
    id: "remember",
    label: "Не забывать",
    hint: "Держать всё под рукой",
    icon: Bell,
    tint:     "text-sky-600 dark:text-sky-300",
    tintSoft: "bg-sky-100/55 dark:bg-sky-500/10",
    tintRing: "ring-sky-200/60 dark:ring-sky-400/20",
    tintActiveBg:     "bg-sky-500",
    tintActiveRing:   "ring-sky-400/70",
    tintActiveShadow: "shadow-[0_4px_14px_rgba(14,165,233,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]",
    tintGlow:         "from-sky-400/60 to-blue-500/40",
  },
  {
    id: "order",
    label: "Навести порядок в делах",
    hint: "Собрать всё в одном месте",
    icon: ListChecks,
    tint:     "text-emerald-600 dark:text-emerald-300",
    tintSoft: "bg-emerald-100/55 dark:bg-emerald-500/10",
    tintRing: "ring-emerald-200/60 dark:ring-emerald-400/20",
    tintActiveBg:     "bg-emerald-500",
    tintActiveRing:   "ring-emerald-400/70",
    tintActiveShadow: "shadow-[0_4px_14px_rgba(16,185,129,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]",
    tintGlow:         "from-emerald-400/60 to-teal-500/40",
  },
  {
    id: "balance",
    label: "Совмещать работу и личное",
    hint: "Баланс без перекосов",
    icon: Scale,
    tint:     "text-rose-600 dark:text-rose-300",
    tintSoft: "bg-rose-100/55 dark:bg-rose-500/10",
    tintRing: "ring-rose-200/60 dark:ring-rose-400/20",
    tintActiveBg:     "bg-rose-500",
    tintActiveRing:   "ring-rose-400/70",
    tintActiveShadow: "shadow-[0_4px_14px_rgba(244,63,94,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]",
    tintGlow:         "from-rose-400/60 to-pink-500/40",
  },
  {
    id: "goals",
    label: "Двигаться к своим целям",
    hint: "Маленькими шагами каждый день",
    icon: Target,
    tint:     "text-violet-600 dark:text-violet-300",
    tintSoft: "bg-violet-100/55 dark:bg-violet-500/10",
    tintRing: "ring-violet-200/60 dark:ring-violet-400/20",
    tintActiveBg:     "bg-violet-500",
    tintActiveRing:   "ring-violet-400/70",
    tintActiveShadow: "shadow-[0_4px_14px_rgba(139,92,246,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]",
    tintGlow:         "from-violet-400/60 to-purple-500/40",
  },
  {
    id: "time",
    label: "Понять, куда уходит время",
    hint: "Увидеть настоящую картину дня",
    icon: Clock,
    tint:     "text-cyan-600 dark:text-cyan-300",
    tintSoft: "bg-cyan-100/55 dark:bg-cyan-500/10",
    tintRing: "ring-cyan-200/60 dark:ring-cyan-400/20",
    tintActiveBg:     "bg-cyan-500",
    tintActiveRing:   "ring-cyan-400/70",
    tintActiveShadow: "shadow-[0_4px_14px_rgba(6,182,212,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]",
    tintGlow:         "from-cyan-400/60 to-sky-500/40",
  },
];

const SpecularHighlight: React.FC<{ className?: string }> = ({ className }) => (
  <span aria-hidden="true" className={cn(G.specular, className)} />
);

export const ForWhatUsing: React.FC = () => {
  const navigate = useNavigate();
  const { data, update } = useOnboarding();
  const [selected, setSelected] = React.useState<string[]>(data.purpose);
  const [confirmed, setConfirmed] = React.useState(data.purpose.length > 0);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
    setConfirmed(false);
  };

  const handleConfirm = () => {
    update("purpose", selected);
    setConfirmed(true);
  };

  const handleNext = () => navigate("/onboarding/field-of-activity");

  return (
    <OnboardingLayout
      step={1}
      totalSteps={TOTAL}
      title="Зачем Вам приложение?"
      subtitle="Выберите всё, что откликается — можно несколько вариантов."
      onBack={() => navigate("/")}
      onNext={handleNext}
      nextDisabled={selected.length === 0}
    >
      <div className="relative">
        <div className="mb-5 flex items-center gap-3">
          <span
            className={cn(
              "relative inline-flex items-center gap-1.5",
              "px-2.5 py-1 rounded-full",
              G.surface,
              "text-[11px] uppercase tracking-widest font-medium",
              "text-gray-600 dark:text-gray-300"
            )}
          >
            <Sparkles size={11} aria-hidden="true" />
            Ваша цель
          </span>

          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {selected.length > 0
              ? `Выбрано: ${selected.length}`
              : "Ничего не выбрано"}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {OPTIONS.map((opt) => {
            const active = selected.includes(opt.id);
            const Icon = opt.icon;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggle(opt.id)}
                aria-pressed={active}
                className={cn(
                  "group relative isolate overflow-hidden text-left",
                  "rounded-2xl p-4",
                  G.surface,
                  active && [
                    `ring-2 ${opt.tintActiveRing}`,
                    "shadow-[0_12px_40px_rgba(15,23,42,0.15),inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(255,255,255,0.4)]",
                    ],
                  "transition-all duration-300",
                  "hover:-translate-y-0.5",
                  "hover:bg-white/70 dark:hover:bg-gray-900/55"
                )}
              >
                <SpecularHighlight className="opacity-90" />

                {active && (
                    <span
                        aria-hidden="true"
                        className={cn(
                        "absolute -inset-4 -z-10 rounded-full blur-2xl opacity-25",
                        "bg-gradient-to-br",
                        opt.tintGlow
                        )}
                    />
                    )}

                <div className="relative flex items-start gap-3">
                  <div
                    className={cn(
                        "relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center",
                        "overflow-hidden ring-1 transition-all duration-300",
                        active
                            ? [
                                opt.tintActiveBg,
                                opt.tintActiveRing,
                                opt.tintActiveShadow,
                                "text-white",
                            ]
                            : [
                                opt.tint,
                                opt.tintSoft,
                                opt.tintRing,
                                "backdrop-blur-md",
                                "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.06)]",
                                "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.35)]",
                            ]
                        )}
                    aria-hidden="true"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/70 to-transparent blur-[0.5px]"
                    />
                    <Icon size={20} className="relative" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white leading-snug">
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {opt.hint}
                    </p>
                  </div>

                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                      "transition-all duration-300",
                      active
                        ? [
                            opt.tintActiveBg,
                            `border ${opt.tintActiveRing}`,
                            "text-white",
                            opt.tintActiveShadow,
                            "scale-100",
                            ]
                        : [
                            "border border-white/70 dark:border-white/15",
                            "bg-white/40 dark:bg-white/[0.05]",
                            "backdrop-blur-sm",
                            "scale-90",
                          ]
                    )}
                  >
                    {active && <Check size={12} strokeWidth={3} className="relative" />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {selected.length > 0 && !confirmed && (
          <div className="mt-6 flex items-center justify-end gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
            <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
              {selected.length} из {OPTIONS.length}
            </span>
            <Button type="button" onClick={handleConfirm}>
              Подтвердить
              <ArrowRight size={16} className="ml-1" aria-hidden="true" />
            </Button>
          </div>
        )}

        {confirmed && (
          <div
            className={cn(
              "mt-6 relative overflow-hidden rounded-2xl",
              "animate-in fade-in slide-in-from-bottom-2 duration-500",
              G.surface
            )}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 top-1 h-20 rounded-full bg-gradient-to-b from-white/60 to-transparent opacity-70 blur-md"
            />

            <span
              aria-hidden="true"
              className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/15 blur-3xl"
            />

            <div className="relative p-5">
              <div className="flex items-start gap-3">
                <div
                  aria-hidden="true"
                  className={cn(
                    "relative shrink-0 w-10 h-10 rounded-full overflow-hidden",
                    "bg-gradient-to-br from-blue-500 to-purple-600",
                    "flex items-center justify-center text-white",
                    "ring-1 ring-white/40",
                    "shadow-[0_4px_14px_rgba(99,102,241,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/70 to-transparent blur-[0.5px]"
                  />
                  <Sparkles size={18} className="relative" />
                </div>

                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Похоже, мы нашли друг друга
                  </p>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    Я —{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Dayla
                    </span>
                    . Буду рядом, чтобы помочь вам:
                  </p>

                  <ul className="mt-3 text-sm text-gray-600 dark:text-gray-300 space-y-1.5">
                    {[
                      "собрать дела в понятный план на день;",
                      "не потеряться среди задач;",
                      "понять, что делать дальше.",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="shrink-0 mt-0.5 text-blue-500"
                          aria-hidden="true"
                        />
                        {t}
                      </li>
                    ))}
                  </ul>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Чтобы мои рекомендации были точнее, мне нужно немного узнать о вас.
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span
                      className={cn(
                        "relative inline-flex items-center gap-1.5",
                        "px-2.5 py-1 rounded-full",
                        G.surface,
                        "text-xs font-medium text-gray-700 dark:text-gray-300"
                      )}
                    >
                      Выбрано:
                      <span className="tabular-nums">{selected.length}</span>
                    </span>

                    <button
                      type="button"
                      onClick={handleNext}
                      className={cn(
                        "group relative overflow-hidden",
                        "inline-flex items-center gap-1.5",
                        "px-4 py-2 rounded-full",
                        "text-sm font-semibold",
                        "text-blue-700 dark:text-blue-300",
                        "bg-white/70 dark:bg-white/15",
                        "backdrop-blur-xl",
                        "ring-1 ring-white/70 dark:ring-white/20",
                        "shadow-[0_4px_16px_rgba(59,130,246,0.15),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(255,255,255,0.4)]",
                        "hover:bg-white/85 dark:hover:bg-white/20",
                        "hover:shadow-[0_8px_24px_rgba(59,130,246,0.25),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(255,255,255,0.5)]",
                        "transition-all duration-300"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-3 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/80 to-transparent opacity-90 blur-[1px]"
                      />
                      <span className="relative inline-flex items-center gap-1.5">
                        Начать
                        <ArrowRight
                          size={14}
                          className="transition-transform duration-300 group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
};
