import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart, Minus, Flame, ShieldAlert,
  Sparkles, Check,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding, OnboardingData } from "./OnboardingContext";
import { cn } from "@/utils/cn";
import { glass } from "@/styles/glass";

const TOTAL = 10;

const G = glass.strong;

type Tone = NonNullable<OnboardingData["toneOfVoice"]>;

type ToneOption = {
  id: Tone;
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
  tintActiveCardRing: string;
};

const OPTIONS: ToneOption[] = [
  {
    id: "supportive",
    label: "Мягкий, поддерживающий",
    hint: "Бережно, с заботой о состоянии",
    icon: Heart,
    tint:     "text-pink-600 dark:text-pink-300",
    tintSoft: "bg-pink-100/55 dark:bg-pink-500/10",
    tintRing: "ring-pink-200/60 dark:ring-pink-400/20",
    tintActiveBg:       "bg-pink-500",
    tintActiveRing:     "ring-pink-400/70",
    tintActiveShadow:   "shadow-[0_4px_14px_rgba(236,72,153,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]",
    tintGlow:           "from-pink-400/60 to-rose-500/40",
    tintActiveCardRing: "ring-pink-400/60 dark:ring-pink-400/50",
  },
  {
    id: "neutral",
    label: "Нейтральный",
    hint: "По делу, без лишних эмоций",
    icon: Minus,
    tint:     "text-slate-600 dark:text-slate-300",
    tintSoft: "bg-slate-100/55 dark:bg-slate-500/10",
    tintRing: "ring-slate-200/60 dark:ring-slate-400/20",
    tintActiveBg:       "bg-slate-600",
    tintActiveRing:     "ring-slate-400/70",
    tintActiveShadow:   "shadow-[0_4px_14px_rgba(71,85,105,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]",
    tintGlow:           "from-slate-400/60 to-slate-500/40",
    tintActiveCardRing: "ring-slate-400/60 dark:ring-slate-400/50",
  },
  {
    id: "motivating",
    label: "Мотивирующий",
    hint: "Бодро, с драйвом и целями",
    icon: Flame,
    tint:     "text-amber-600 dark:text-amber-300",
    tintSoft: "bg-amber-100/55 dark:bg-amber-500/10",
    tintRing: "ring-amber-200/60 dark:ring-amber-400/20",
    tintActiveBg:       "bg-amber-500",
    tintActiveRing:     "ring-amber-400/70",
    tintActiveShadow:   "shadow-[0_4px_14px_rgba(245,158,11,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]",
    tintGlow:           "from-amber-400/60 to-orange-500/40",
    tintActiveCardRing: "ring-amber-400/60 dark:ring-amber-400/50",
  },
  {
    id: "strict",
    label: "Строгий",
    hint: "Чётко, дисциплинированно, без поблажек",
    icon: ShieldAlert,
    tint:     "text-rose-600 dark:text-rose-300",
    tintSoft: "bg-rose-100/55 dark:bg-rose-500/10",
    tintRing: "ring-rose-200/60 dark:ring-rose-400/20",
    tintActiveBg:       "bg-rose-600",
    tintActiveRing:     "ring-rose-500/70",
    tintActiveShadow:   "shadow-[0_4px_14px_rgba(225,29,72,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]",
    tintGlow:           "from-rose-400/60 to-red-500/40",
    tintActiveCardRing: "ring-rose-500/60 dark:ring-rose-400/50",
  },
];

const SpecularHighlight: React.FC<{ className?: string }> = ({ className }) => (
  <span aria-hidden="true" className={cn(G.specular, className)} />
);

export const ToneOfVoice: React.FC = () => {
  const navigate = useNavigate();
  const { data, update } = useOnboarding();
  const [selected, setSelected] = React.useState<Tone | null>(data.toneOfVoice);

  const handleNext = () => {
    if (!selected) return;
    update("toneOfVoice", selected);
    navigate("/onboarding/goals-and-habits");
  };

  return (
    <OnboardingLayout
      step={3}
      totalSteps={TOTAL}
      title="Как со мной общаться?"
      subtitle="Тон влияет только на формулировки. Правила планирования не меняются."
      onBack={() => navigate("/onboarding/field-of-activity")}
      onNext={handleNext}
      nextDisabled={!selected}
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
            Тон общения
          </span>

          <span className="text-xs text-gray-500 dark:text-gray-400">
            {selected ? "Выбрано" : "Ничего не выбрано"}
          </span>
        </div>

        <div className="space-y-3" role="radiogroup" aria-label="Тон общения">
          {OPTIONS.map((opt) => {
            const active = selected === opt.id;
            const Icon = opt.icon;

            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(opt.id)}
                className={cn(
                  "group relative isolate block w-full overflow-hidden text-left",
                  "rounded-2xl p-4 md:p-5",
                  G.surface,
                  active && [
                    `ring-2 ${opt.tintActiveCardRing}`,
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
                      "overflow-hidden ring-1 backdrop-blur-md",
                      "transition-all duration-300",
                      active
                        ? [
                            opt.tintActiveBg,
                            "text-white",
                            opt.tintActiveRing,
                            opt.tintActiveShadow,
                          ]
                        : [
                            opt.tint,
                            opt.tintSoft,
                            opt.tintRing,
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

        {selected && (
          <div className="mt-5 flex items-center justify-center gap-2 animate-in fade-in duration-300">
            <Sparkles size={14} className="text-blue-500" aria-hidden="true" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Стиль общения можно поменять в настройках в любой момент
            </p>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
};
