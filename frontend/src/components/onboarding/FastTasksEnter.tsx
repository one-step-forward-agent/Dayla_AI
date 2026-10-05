import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  PenLine, Sparkles, Bell, BellOff, Clock, AlarmClock,
  Sunrise, Check, Tag, Info,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/form-field";
import { cn } from "@/utils/cn";
import { glass } from "@/styles/glass";

const TOTAL = 10;

const G = glass.strong;

type ReminderId = "off" | "10m" | "30m" | "1h" | "1d";

type ReminderOption = {
  id: ReminderId;
  label: string;
  short: string;
  hint: string;
  icon: LucideIcon;
  tint: string;
  tintSoft: string;
  tintRing: string;
  tintActiveBg: string;
  tintActiveRing: string;
  tintActiveShadow: string;
};

const REMINDER_OPTIONS: ReminderOption[] = [
  {
    id: "off",
    label: "Без напоминания",
    short: "Выкл",
    hint: "Напомню, если попросите",
    icon: BellOff,
    tint:     "text-slate-600 dark:text-slate-300",
    tintSoft: "bg-slate-100/55 dark:bg-slate-500/10",
    tintRing: "ring-slate-200/60 dark:ring-slate-400/20",
    tintActiveBg:     "bg-slate-600",
    tintActiveRing:   "ring-slate-400/70",
    tintActiveShadow: "shadow-[0_4px_14px_rgba(71,85,105,0.45),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_14px_rgba(71,85,105,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]",
  },
  {
    id: "10m",
    label: "За 10 минут",
    short: "10 мин",
    hint: "Прямо перед началом",
    icon: Clock,
    tint:     "text-cyan-600 dark:text-cyan-300",
    tintSoft: "bg-cyan-100/55 dark:bg-cyan-500/10",
    tintRing: "ring-cyan-200/60 dark:ring-cyan-400/20",
    tintActiveBg:     "bg-cyan-500",
    tintActiveRing:   "ring-cyan-400/70",
    tintActiveShadow: "shadow-[0_4px_14px_rgba(6,182,212,0.45),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_14px_rgba(6,182,212,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]",
  },
  {
    id: "30m",
    label: "За 30 минут",
    short: "30 мин",
    hint: "Время собраться",
    icon: AlarmClock,
    tint:     "text-blue-600 dark:text-blue-300",
    tintSoft: "bg-blue-100/55 dark:bg-blue-500/10",
    tintRing: "ring-blue-200/60 dark:ring-blue-400/20",
    tintActiveBg:     "bg-blue-500",
    tintActiveRing:   "ring-blue-400/70",
    tintActiveShadow: "shadow-[0_4px_14px_rgba(59,130,246,0.45),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_14px_rgba(59,130,246,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]",
  },
  {
    id: "1h",
    label: "За час",
    short: "1 час",
    hint: "Успеть переключиться",
    icon: Bell,
    tint:     "text-violet-600 dark:text-violet-300",
    tintSoft: "bg-violet-100/55 dark:bg-violet-500/10",
    tintRing: "ring-violet-200/60 dark:ring-violet-400/20",
    tintActiveBg:     "bg-violet-500",
    tintActiveRing:   "ring-violet-400/70",
    tintActiveShadow: "shadow-[0_4px_14px_rgba(139,92,246,0.45),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_14px_rgba(139,92,246,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]",
  },
  {
    id: "1d",
    label: "За день",
    short: "1 день",
    hint: "Накануне, вечером",
    icon: Sunrise,
    tint:     "text-amber-600 dark:text-amber-300",
    tintSoft: "bg-amber-100/55 dark:bg-amber-500/10",
    tintRing: "ring-amber-200/60 dark:ring-amber-400/20",
    tintActiveBg:     "bg-amber-500",
    tintActiveRing:   "ring-amber-400/70",
    tintActiveShadow: "shadow-[0_4px_14px_rgba(245,158,11,0.45),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_14px_rgba(245,158,11,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]",
  },
];

const SpecularHighlight: React.FC<{ className?: string }> = ({ className }) => (
  <span aria-hidden="true" className={cn(G.specular, className)} />
);

export const FastTasksEnter: React.FC = () => {
  const navigate = useNavigate();
  const { data, patch } = useOnboarding();

  const [title, setTitle] = React.useState(data.firstTask.title);
  const [sphereId, setSphereId] = React.useState<string | null>(
    data.firstTask.sphereId ?? data.spheres[0]?.id ?? null
  );
  const [reminder, setReminder] = React.useState<ReminderId>(data.firstTask.reminder);

  const activeSphere = data.spheres.find((s) => s.id === sphereId) ?? null;
  const activeReminder = REMINDER_OPTIONS.find((r) => r.id === reminder) ?? null;
  const canContinue = title.trim().length > 0;

  const handleNext = () => {
    if (!canContinue) return;
    patch({
      firstTask: { title: title.trim(), sphereId, reminder },
    });
    navigate("/onboarding/success-and-learning");
  };

  return (
    <OnboardingLayout
      step={8}
      totalSteps={TOTAL}
      title="Создайте первую задачу"
      onBack={() => navigate("/onboarding/sources-import")}
      onNext={handleNext}
      nextDisabled={!canContinue}
    >
      <div className="relative space-y-5">
        <div className="flex items-center gap-3">
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
            Первый шаг
          </span>

        </div>

        <div>
          <label
            htmlFor="first-task-title"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            <PenLine
              size={14}
              className="text-blue-500 dark:text-blue-400"
              aria-hidden="true"
            />
            Название задачи
            <span className="text-red-500" aria-hidden="true">*</span>
          </label>

          <Input
            id="first-task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: подготовить отчёт"
            autoFocus
          />
        </div>

        {data.spheres.length > 0 && (
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">
              <Tag
                size={14}
                className="text-blue-500 dark:text-blue-400"
                aria-hidden="true"
              />
              Сфера
            </p>

            <div className="flex flex-wrap gap-2">
              {data.spheres.map((s) => {
                const active = sphereId === s.id;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSphereId(s.id)}
                    aria-pressed={active}
                    style={
                      active
                        ? {
                            boxShadow: `0 0 0 2px ${s.color}55, 0 4px 14px ${s.color}33, inset 0 1px 0 rgba(255,255,255,0.7)`,
                          }
                        : undefined
                    }
                    className={cn(
                      "group relative inline-flex items-center gap-2 overflow-hidden",
                      "px-3 py-2 rounded-full text-sm font-medium",
                      "backdrop-blur-md ring-1 transition-all duration-200",
                      "hover:-translate-y-0.5",
                      active
                        ? "bg-white/70 dark:bg-white/[0.08] ring-transparent"
                        : [
                            "bg-white/50 dark:bg-white/[0.05]",
                            "ring-white/60 dark:ring-white/10",
                            "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.04)]",
                            "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.3)]",
                            "text-gray-700 dark:text-gray-300",
                            "hover:bg-white/70 dark:hover:bg-white/[0.08]",
                          ]
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-2 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/60 to-transparent dark:from-white/[0.06] blur-[1px]"
                    />

                    <span
                      className="relative w-3 h-3 rounded-full shrink-0 transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: s.color,
                        boxShadow: `0 1px 2px ${s.color}88, inset 0 1px 0 rgba(255,255,255,0.5)`,
                      }}
                      aria-hidden="true"
                    />
                    <span className="relative text-gray-900 dark:text-white">
                      {s.name}
                    </span>
                    {active && (
                      <Check
                        size={13}
                        strokeWidth={3}
                        className="relative text-blue-600 dark:text-blue-300"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">
            <Bell
              size={14}
              className="text-blue-500 dark:text-blue-400"
              aria-hidden="true"
            />
            Напоминание
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {REMINDER_OPTIONS.map((opt) => {
              const active = reminder === opt.id;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReminder(opt.id)}
                  aria-pressed={active}
                  title={opt.hint}
                  className={cn(
                    "group relative isolate overflow-hidden flex flex-col items-center gap-1.5",
                    "px-2 py-3 rounded-2xl",
                    G.surface,
                    active && [
                    `ring-2 ${opt.tintActiveRing}`,
                    "shadow-[0_12px_40px_rgba(15,23,42,0.15),inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(255,255,255,0.4)] dark:shadow-[0_12px_40px_rgba(15,23,42,0.15),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(255,255,255,0.06)]",
                    ],
                    "transition-all duration-300",
                    "hover:-translate-y-0.5",
                    "hover:bg-white/70 dark:hover:bg-gray-900/55"
                  )}
                >
                  <SpecularHighlight className="opacity-80" />

                  <div
                    className={cn(
                        "relative w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden",
                        "ring-1 backdrop-blur-md transition-all duration-300",
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
                      className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/70 to-transparent dark:from-white/[0.06] blur-[0.5px]"
                    />
                    <Icon size={16} className="relative" />
                  </div>

                  <span className="relative text-[11px] font-medium text-gray-800 dark:text-gray-100 leading-tight text-center">
                    {opt.short}
                  </span>

                  {active && (
                    <span
                        aria-hidden="true"
                        className={cn(
                        "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white",
                        "ring-1 ring-white/60 dark:ring-white/20",
                        opt.tintActiveBg,
                        "shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        )}
                    >
                        <Check size={10} strokeWidth={3} />
                    </span>
                    )}
                </button>
              );
            })}
          </div>

          {reminder !== "off" && !data.telegramConnected && (
            <Alert variant="info" className="mt-3">
              Напоминания приходят в Telegram. Подключить бота можно на
              следующем шаге.
            </Alert>
          )}
        </div>

        <div className={cn("relative overflow-hidden rounded-2xl", G.surface)}>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-6 top-1 h-16 rounded-full bg-gradient-to-b from-white/60 to-transparent dark:from-white/[0.06] opacity-60 blur-md"
          />

          <div className="relative p-4 md:p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <span
                aria-hidden="true"
                className={cn(
                  "relative shrink-0 w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden",
                  "bg-white/60 dark:bg-white/[0.06] text-blue-600 dark:text-blue-300",
                  "ring-1 ring-white/70 dark:ring-white/10",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.05)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(15,23,42,0.05)]"
                )}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/70 to-transparent dark:from-white/[0.06] blur-[0.5px]"
                />
                <Sparkles size={14} className="relative" />
              </span>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Так задача появится у вас
              </p>
            </div>

            <div
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-xl",
                "bg-white/50 dark:bg-white/[0.03]",
                "backdrop-blur-md",
                "ring-1 ring-white/60 dark:ring-white/10",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(15,23,42,0.04)]",
                "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.3)]"
              )}
            >
              <span
                className="w-1 self-stretch rounded shrink-0"
                style={{
                  backgroundColor: activeSphere?.color ?? "#9ca3af",
                  boxShadow: activeSphere
                    ? `0 0 8px ${activeSphere.color}55`
                    : undefined,
                }}
                aria-hidden="true"
              />

              <span
                className={cn(
                  "flex-1 min-w-0 text-sm truncate",
                  title.trim()
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-gray-500 italic"
                )}
              >
                {title.trim() || "Название задачи"}
              </span>

              {activeSphere && (
                <span
                  className={cn(
                    "relative shrink-0 inline-flex items-center gap-1.5",
                    "px-2 py-1 rounded-full",
                    "bg-white/50 dark:bg-white/[0.05]",
                    "backdrop-blur-md",
                    "ring-1 ring-white/60 dark:ring-white/10",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(15,23,42,0.04)]",
                    "text-[10px] font-medium text-gray-700 dark:text-gray-300"
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: activeSphere.color,
                      boxShadow: `0 1px 2px ${activeSphere.color}88`,
                    }}
                    aria-hidden="true"
                  />
                  <span className="truncate max-w-[100px]">
                    {activeSphere.name}
                  </span>
                </span>
              )}

              {activeReminder && activeReminder.id !== "off" && (
                <span
                  className="shrink-0 hidden sm:inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400"
                  title={activeReminder.hint}
                >
                  <Bell size={11} aria-hidden="true" />
                  {activeReminder.short}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
};
