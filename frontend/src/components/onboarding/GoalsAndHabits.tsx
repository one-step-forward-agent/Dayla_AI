import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Target, Sparkles, Trophy, Rocket, Heart, Star, Flag, Flame,
  Plus, X, Lightbulb, GripVertical, ChevronUp, ChevronDown,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-field";
import { cn } from "@/utils/cn";
import { glass } from "@/styles/glass";

const TOTAL = 10;

const G = glass.strong;

type GoalVisual = {
  icon: LucideIcon;
  tint: string;
  tintSoft: string;
  tintRing: string;
};

const GOAL_VISUALS: GoalVisual[] = [
  { icon: Target,   tint: "text-blue-600 dark:text-blue-300",       tintSoft: "bg-blue-100/55 dark:bg-blue-500/10",       tintRing: "ring-blue-200/60 dark:ring-blue-400/20" },
  { icon: Sparkles, tint: "text-violet-600 dark:text-violet-300",   tintSoft: "bg-violet-100/55 dark:bg-violet-500/10",   tintRing: "ring-violet-200/60 dark:ring-violet-400/20" },
  { icon: Trophy,   tint: "text-amber-600 dark:text-amber-300",     tintSoft: "bg-amber-100/55 dark:bg-amber-500/10",     tintRing: "ring-amber-200/60 dark:ring-amber-400/20" },
  { icon: Rocket,   tint: "text-cyan-600 dark:text-cyan-300",       tintSoft: "bg-cyan-100/55 dark:bg-cyan-500/10",       tintRing: "ring-cyan-200/60 dark:ring-cyan-400/20" },
  { icon: Heart,    tint: "text-pink-600 dark:text-pink-300",       tintSoft: "bg-pink-100/55 dark:bg-pink-500/10",       tintRing: "ring-pink-200/60 dark:ring-pink-400/20" },
  { icon: Star,     tint: "text-yellow-600 dark:text-yellow-300",   tintSoft: "bg-yellow-100/55 dark:bg-yellow-500/10",   tintRing: "ring-yellow-200/60 dark:ring-yellow-400/20" },
  { icon: Flag,     tint: "text-emerald-600 dark:text-emerald-300", tintSoft: "bg-emerald-100/55 dark:bg-emerald-500/10", tintRing: "ring-emerald-200/60 dark:ring-emerald-400/20" },
  { icon: Flame,    tint: "text-rose-600 dark:text-rose-300",       tintSoft: "bg-rose-100/55 dark:bg-rose-500/10",       tintRing: "ring-rose-200/60 dark:ring-rose-400/20" },
];

const visualForGoal = (text: string): GoalVisual => {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0;
  }
  return GOAL_VISUALS[h % GOAL_VISUALS.length];
};

const SUGGESTIONS = [
  "Заниматься спортом 3 раза в неделю",
  "Учить английский по 20 минут",
  "Читать каждый день",
  "Больше гулять",
  "Рано вставать",
  "Медитировать",
];

const reorder = (list: string[], from: number, to: number): string[] => {
  if (from === to) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

const move = (list: string[], index: number, delta: number): string[] => {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  return next;
};

const SpecularHighlight: React.FC<{ className?: string }> = ({ className }) => (
  <span aria-hidden="true" className={cn(G.specular, className)} />
);

export const GoalsAndHabits: React.FC = () => {
  const navigate = useNavigate();
  const { data, update } = useOnboarding();
  const [goal, setGoal] = React.useState("");
  const [goals, setGoals] = React.useState<string[]>(data.goals);

  const [draggingIdx, setDraggingIdx] = React.useState<number | null>(null);
  const [overIdx, setOverIdx] = React.useState<number | null>(null);

  const add = (value?: string) => {
    const v = (value ?? goal).trim();
    if (!v) return;
    if (goals.some((g) => g.toLowerCase() === v.toLowerCase())) {
      setGoal("");
      return;
    }
    setGoals((prev) => [...prev, v]);
    setGoal("");
  };

  const remove = (value: string) => {
    setGoals((prev) => prev.filter((g) => g !== value));
  };

  const handleNext = () => {
    update("goals", goals);
    navigate("/onboarding/existing-plans");
  };

  const handleSkip = () => {
    update("goals", []);
    navigate("/onboarding/existing-plans");
  };

  const onDragStart = (e: React.DragEvent, idx: number) => {
    setDraggingIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  };
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (idx !== overIdx) setOverIdx(idx);
  };
  const onDragLeave = () => setOverIdx(null);
  const onDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    const from = draggingIdx ?? Number(e.dataTransfer.getData("text/plain"));
    if (Number.isFinite(from) && from !== idx) {
      setGoals((prev) => reorder(prev, from, idx));
    }
    setDraggingIdx(null);
    setOverIdx(null);
  };
  const onDragEnd = () => {
    setDraggingIdx(null);
    setOverIdx(null);
  };

  return (
    <OnboardingLayout
      step={4}
      totalSteps={TOTAL}
      title="Что вы хотите встроить в свою жизнь?"
      onBack={() => navigate("/onboarding/tone-of-voice")}
      onNext={handleNext}
      onSkip={handleSkip}
      nextLabel={`Далее${goals.length > 0 ? ` · ${goals.length}` : ""}`}
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
            Намерения
          </span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Target
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
              aria-hidden="true"
            />
            <Input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Например: бегать 3 раза в неделю"
              aria-label="Новое намерение"
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            onClick={() => add()}
            disabled={!goal.trim()}
            className="shrink-0"
          >
            <Plus size={16} className="mr-1" aria-hidden="true" />
            Добавить
          </Button>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={14} className="text-amber-500" aria-hidden="true" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Или выберите из готовых
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => {
              const already = goals.some(
                (g) => g.toLowerCase() === s.toLowerCase()
              );
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => add(s)}
                  disabled={already}
                  className={cn(
                    "group relative inline-flex items-center gap-1.5",
                    "px-3 py-1.5 rounded-full text-xs font-medium",
                    "overflow-hidden transition-all duration-200",
                    "backdrop-blur-md",
                    !already && [
                      "bg-white/50 dark:bg-white/[0.05]",
                      "ring-1 ring-white/60 dark:ring-white/10",
                      "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.04)]",
                      "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.3)]",
                      "text-gray-700 dark:text-gray-300",
                      "hover:-translate-y-0.5 hover:bg-white/70 dark:hover:bg-white/[0.08]",
                    ],
                    already && [
                      "bg-emerald-500/15 dark:bg-emerald-500/15",
                      "ring-1 ring-emerald-400/40 dark:ring-emerald-400/30",
                      "text-emerald-700 dark:text-emerald-300",
                      "cursor-default",
                    ]
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-2 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/60 to-transparent dark:from-white/[0.06] blur-[1px]"
                  />
                  <Plus
                    size={12}
                    className={cn(
                      "relative transition-transform",
                      !already && "group-hover:rotate-90"
                    )}
                    aria-hidden="true"
                  />
                  <span className="relative">{s}</span>
                </button>
              );
            })}
          </div>
        </div>

        {goals.length > 0 && (
          <div className="mt-8">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <span
                  className={cn(
                    "relative inline-flex items-center gap-1.5",
                    "px-2.5 py-1 rounded-full",
                    G.surface,
                    "text-[11px] uppercase tracking-widest font-medium",
                    "text-gray-600 dark:text-gray-300"
                  )}
                >
                  Приоритеты
                </span>
                <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                  Что для вас важнее всего
                </h3>
              </div>
              <span className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">
                Перетащите или ▲▼
              </span>
            </div>

            <div className={cn("relative overflow-hidden rounded-2xl", G.surface)}>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 top-1 h-16 rounded-full bg-gradient-to-b from-white/60 to-transparent dark:from-white/[0.06] opacity-60 blur-md"
              />

              <div className="relative p-3 sm:p-4">
                <ul className="space-y-2">
                  {goals.map((g, i) => {
                    const visual = visualForGoal(g);
                    const Icon = visual.icon;
                    const isDragging = draggingIdx === i;
                    const isOver =
                      overIdx === i && draggingIdx !== null && draggingIdx !== i;

                    return (
                      <li
                        key={g}
                        draggable
                        onDragStart={(e) => onDragStart(e, i)}
                        onDragOver={(e) => onDragOver(e, i)}
                        onDragLeave={onDragLeave}
                        onDrop={(e) => onDrop(e, i)}
                        onDragEnd={onDragEnd}
                        className={cn(
                          "group relative flex items-center gap-3 px-3 py-3 rounded-xl",
                          "bg-white/50 dark:bg-white/[0.03]",
                          "backdrop-blur-md",
                          "ring-1 ring-white/60 dark:ring-white/10",
                          "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(15,23,42,0.04)]",
                          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.3)]",
                          "transition-all duration-200",
                          "hover:bg-white/70 dark:hover:bg-white/[0.06]",
                          isDragging && "opacity-40 cursor-grabbing",
                          isOver && "ring-2 ring-blue-500/60 -translate-y-1",
                          "cursor-grab active:cursor-grabbing"
                        )}
                      >
                        <GripVertical
                          size={16}
                          className="shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors"
                          aria-hidden="true"
                        />

                        <span
                          className={cn(
                            "relative shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold tabular-nums",
                            "bg-white/60 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300",
                            "ring-1 ring-white/70 dark:ring-white/10",
                            "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.05)]",
                            "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.3)]"
                          )}
                          aria-label={`Приоритет ${i + 1}`}
                        >
                          {i + 1}
                        </span>

                        <div
                          className={cn(
                            "relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden",
                            "ring-1 backdrop-blur-md",
                            visual.tint,
                            visual.tintSoft,
                            visual.tintRing,
                            "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.06)]",
                            "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.35)]"
                          )}
                          aria-hidden="true"
                        >
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/70 to-transparent dark:from-white/[0.06] blur-[0.5px]"
                          />
                          <Icon size={16} className="relative" />
                        </div>

                        <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                          {g}
                        </span>

                        <div className="shrink-0 flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setGoals((prev) => move(prev, i, -1))}
                            disabled={i === 0}
                            aria-label={`Поднять «${g}» выше`}
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center",
                              "text-gray-400 hover:text-gray-800 hover:bg-white/60",
                              "dark:hover:text-gray-100 dark:hover:bg-white/[0.08]",
                              "disabled:opacity-30 disabled:cursor-not-allowed",
                              "transition-colors"
                            )}
                          >
                            <ChevronUp size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setGoals((prev) => move(prev, i, 1))}
                            disabled={i === goals.length - 1}
                            aria-label={`Опустить «${g}» ниже`}
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center",
                              "text-gray-400 hover:text-gray-800 hover:bg-white/60",
                              "dark:hover:text-gray-100 dark:hover:bg-white/[0.08]",
                              "disabled:opacity-30 disabled:cursor-not-allowed",
                              "transition-colors"
                            )}
                          >
                            <ChevronDown size={15} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => remove(g)}
                          className={cn(
                            "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                            "text-gray-400 hover:text-red-500",
                            "hover:bg-white/60 dark:hover:bg-white/[0.08]",
                            "transition-colors",
                            "opacity-0 group-hover:opacity-100 focus:opacity-100"
                          )}
                          title="Убрать"
                          aria-label={`Убрать цель «${g}»`}
                        >
                          <X size={15} />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-3 flex items-center gap-2 px-2 text-[11px] text-gray-500 dark:text-gray-400">
                  <Sparkles size={12} className="text-blue-500" aria-hidden="true" />
                  Первый в списке — главный приоритет. Я подскажу, если что-то
                  будет идти вразрез с ним.
                </div>
              </div>
            </div>
          </div>
        )}

        {goals.length === 0 && (
          <div className="mt-6 flex flex-col items-center text-center py-8">
            <div
              aria-hidden="true"
              className={cn(
                "relative w-14 h-14 rounded-2xl flex items-center justify-center mb-3 overflow-hidden",
                "bg-white/55 dark:bg-white/[0.05]",
                "backdrop-blur-2xl",
                "ring-1 ring-white/60 dark:ring-white/10",
                "shadow-[0_8px_32px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.75)]",
                "dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]"
              )}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-2 top-1 h-1/2 rounded-full bg-gradient-to-b from-white/70 to-transparent dark:from-white/[0.06] blur-[1px]"
              />
              <Target size={24} className="relative text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Добавьте хотя бы одно намерение — или пропустите шаг, если пока не готовы формулировать.
            </p>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
};
