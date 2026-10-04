import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, GraduationCap, Dumbbell, Languages, HeartPulse,
  Home, Coffee, Users, BookOpen, Palette,
  Plus, X, GripVertical, Sparkles, Check,
  ChevronUp, ChevronDown,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding, Sphere } from "./OnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-field";
import { cn } from "@/utils/cn";
import { glass } from "@/styles/glass";

const TOTAL = 10;

const G = glass.medium;

type Preset = {
  name: string;
  icon: LucideIcon;
  tint: string;
  tintSoft: string;
  tintRing: string;
};

const PRESETS: Preset[] = [
  { name: "Работа",       icon: Briefcase,     tint: "text-slate-600 dark:text-slate-300",     tintSoft: "bg-slate-100/55 dark:bg-slate-500/10",     tintRing: "ring-slate-200/60 dark:ring-slate-400/20" },
  { name: "Учёба",        icon: GraduationCap, tint: "text-teal-600 dark:text-teal-300",       tintSoft: "bg-teal-100/55 dark:bg-teal-500/10",       tintRing: "ring-teal-200/60 dark:ring-teal-400/20" },
  { name: "Спорт",        icon: Dumbbell,      tint: "text-orange-600 dark:text-orange-300",   tintSoft: "bg-orange-100/55 dark:bg-orange-500/10",   tintRing: "ring-orange-200/60 dark:ring-orange-400/20" },
  { name: "Языки",        icon: Languages,     tint: "text-violet-600 dark:text-violet-300",   tintSoft: "bg-violet-100/55 dark:bg-violet-500/10",   tintRing: "ring-violet-200/60 dark:ring-violet-400/20" },
  { name: "Здоровье",     icon: HeartPulse,    tint: "text-rose-600 dark:text-rose-300",       tintSoft: "bg-rose-100/55 dark:bg-rose-500/10",       tintRing: "ring-rose-200/60 dark:ring-rose-400/20" },
  { name: "Дом и быт",    icon: Home,          tint: "text-amber-600 dark:text-amber-300",     tintSoft: "bg-amber-100/55 dark:bg-amber-500/10",     tintRing: "ring-amber-200/60 dark:ring-amber-400/20" },
  { name: "Отдых",        icon: Coffee,        tint: "text-cyan-600 dark:text-cyan-300",       tintSoft: "bg-cyan-100/55 dark:bg-cyan-500/10",       tintRing: "ring-cyan-200/60 dark:ring-cyan-400/20" },
  { name: "Отношения",    icon: Users,         tint: "text-pink-600 dark:text-pink-300",       tintSoft: "bg-pink-100/55 dark:bg-pink-500/10",       tintRing: "ring-pink-200/60 dark:ring-pink-400/20" },
  { name: "Саморазвитие", icon: BookOpen,      tint: "text-indigo-600 dark:text-indigo-300",   tintSoft: "bg-indigo-100/55 dark:bg-indigo-500/10",   tintRing: "ring-indigo-200/60 dark:ring-indigo-400/20" },
  { name: "Хобби",        icon: Palette,       tint: "text-lime-600 dark:text-lime-300",       tintSoft: "bg-lime-100/55 dark:bg-lime-500/10",       tintRing: "ring-lime-200/60 dark:ring-lime-400/20" },
];

const PALETTE = [
  "#64748b", "#14b8a6", "#f97316", "#8b5cf6", "#f43f5e",
  "#f59e0b", "#06b6d4", "#ec4899", "#6366f1", "#84cc16",
];

const uid = () => Math.random().toString(36).slice(2, 9);

const reorderById = (list: Sphere[], fromId: string, toId: string): Sphere[] => {
  const from = list.findIndex((s) => s.id === fromId);
  const to = list.findIndex((s) => s.id === toId);
  if (from === -1 || to === -1 || from === to) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((s, i) => ({ ...s, priority: i }));
};

const moveByIndex = (list: Sphere[], id: string, delta: number): Sphere[] => {
  const idx = list.findIndex((s) => s.id === id);
  const target = idx + delta;
  if (idx === -1 || target < 0 || target >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(idx, 1);
  next.splice(target, 0, moved);
  return next.map((s, i) => ({ ...s, priority: i }));
};

const SpecularHighlight: React.FC<{ className?: string }> = ({ className }) => (
  <span aria-hidden="true" className={cn(G.specular, className)} />
);

export const FieldOfActivity: React.FC = () => {
  const navigate = useNavigate();
  const { data, update } = useOnboarding();
  const [spheres, setSpheres] = React.useState<Sphere[]>(data.spheres);
  const [custom, setCustom] = React.useState("");
  const [showCustom, setShowCustom] = React.useState(false);

  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

  const usedColors = new Set(spheres.map((s) => s.color));
  const nextColor = PALETTE.find((c) => !usedColors.has(c)) ?? PALETTE[0];

  const togglePreset = (name: string) => {
    const existing = spheres.find((s) => s.name === name);
    if (existing) {
      setSpheres((prev) =>
        prev.filter((s) => s.id !== existing.id).map((s, i) => ({ ...s, priority: i }))
      );
    } else {
      setSpheres((prev) => [
        ...prev,
        { id: uid(), name, color: nextColor, priority: prev.length },
      ]);
    }
  };

  const addCustom = () => {
    const name = custom.trim();
    if (!name) return;
    if (spheres.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    setSpheres((prev) => [
      ...prev,
      { id: uid(), name, color: nextColor, priority: prev.length },
    ]);
    setCustom("");
    setShowCustom(false);
  };

  const removeSphere = (id: string) =>
    setSpheres((prev) =>
      prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, priority: i }))
    );

  const cycleColor = (id: string) =>
    setSpheres((prev) => {
      const used = new Set(prev.filter((s) => s.id !== id).map((s) => s.color));
      const current = prev.find((s) => s.id === id);
      if (!current) return prev;
      const free = PALETTE.filter((c) => !used.has(c) && c !== current.color);
      if (free.length === 0) return prev;
      return prev.map((s) => (s.id === id ? { ...s, color: free[0] } : s));
    });

  const handleNext = () => {
    if (spheres.length === 0) return;
    update("spheres", spheres);
    navigate("/onboarding/tone-of-voice");
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };
  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== overId) setOverId(id);
  };
  const onDragLeave = () => setOverId(null);
  const onDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    const src = draggingId ?? e.dataTransfer.getData("text/plain");
    if (src && src !== id) setSpheres((prev) => reorderById(prev, src, id));
    setDraggingId(null);
    setOverId(null);
  };
  const onDragEnd = () => {
    setDraggingId(null);
    setOverId(null);
  };

  return (
    <OnboardingLayout
      step={2}
      totalSteps={TOTAL}
      title="Отметьте важные для вас сферы"
      subtitle="Я учту их и помогу не потерять важное из виду. Изменить сферы всегда можно в настройках."
      onBack={() => navigate("/onboarding/for-what-using")}
      onNext={handleNext}
      nextDisabled={spheres.length === 0}
      nextLabel={`Далее${spheres.length > 0 ? ` · ${spheres.length}` : ""}`}
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
            Ваши сферы
          </span>

          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {spheres.length > 0
              ? `Выбрано: ${spheres.length}`
              : "Ничего не выбрано"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PRESETS.map((p) => {
            const sphere = spheres.find((s) => s.name === p.name);
            const active = !!sphere;
            const Icon = p.icon;

            return (
              <button
                key={p.name}
                type="button"
                onClick={() => togglePreset(p.name)}
                aria-pressed={active}
                style={
                  active && sphere
                    ? {
                        boxShadow: `0 12px 40px ${sphere.color}26, 0 0 0 2px ${sphere.color}99, inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(255,255,255,0.4)`,
                      }
                    : undefined
                }
                className={cn(
                  "group relative isolate overflow-hidden text-left",
                  "rounded-2xl p-4",
                  G.surface,
                  active && "ring-0",
                  "transition-all duration-300",
                  "hover:-translate-y-1",
                  "hover:bg-white/70 dark:hover:bg-gray-900/55"
                )}
              >
                <SpecularHighlight className="opacity-90" />

                {active && sphere && (
                  <span
                    aria-hidden="true"
                    style={{
                      background: `radial-gradient(circle at center, ${sphere.color}55 0%, transparent 70%)`,
                    }}
                    className="absolute -inset-6 -z-10 blur-2xl"
                  />
                )}

                <div className="relative flex items-center gap-3">
                  <div
                    className={cn(
                      "relative shrink-0 w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden",
                      "ring-1 backdrop-blur-md transition-all duration-300",
                      !active && [
                        p.tint,
                        p.tintSoft,
                        p.tintRing,
                        "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.06)]",
                        "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.35)]",
                      ],
                      active && "text-white ring-white/40"
                    )}
                    style={
                      active && sphere
                        ? {
                            backgroundColor: sphere.color,
                            boxShadow: `0 4px 14px ${sphere.color}66, inset 0 1px 0 rgba(255,255,255,0.5)`,
                          }
                        : undefined
                    }
                    aria-hidden="true"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/70 to-transparent blur-[0.5px]"
                    />
                    <Icon size={18} className="relative" />
                  </div>

                  <span className="flex-1 min-w-0 text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {p.name}
                  </span>

                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                      active
                        ? "text-white scale-100 border border-white/40"
                        : "border border-white/70 dark:border-white/15 bg-white/40 dark:bg-white/[0.05] backdrop-blur-sm scale-90"
                    )}
                    style={
                      active && sphere
                        ? {
                            backgroundColor: sphere.color,
                            boxShadow: `0 2px 8px ${sphere.color}66, inset 0 1px 0 rgba(255,255,255,0.5)`,
                          }
                        : undefined
                    }
                  >
                    {active && <Check size={13} strokeWidth={3} className="relative" />}
                  </span>
                </div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowCustom((v) => !v)}
            aria-pressed={showCustom}
            className={cn(
              "group relative overflow-hidden text-left rounded-2xl p-4",
              "border-2 border-dashed transition-all duration-300",
              "hover:-translate-y-1",
              showCustom
                ? "border-blue-500/60 bg-blue-50/30 dark:bg-blue-950/20 backdrop-blur-md"
                : "border-white/60 dark:border-white/15 hover:border-white/90 dark:hover:border-white/25 bg-white/30 dark:bg-white/[0.03] backdrop-blur-md"
            )}
          >
            <SpecularHighlight className="opacity-60" />

            <div className="relative flex items-center gap-3">
              <div
                className={cn(
                  "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                  "bg-white/60 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300",
                  "ring-1 ring-white/70 dark:ring-white/10",
                  "backdrop-blur-md",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.06)]",
                  "transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                )}
                aria-hidden="true"
              >
                <Plus size={18} />
              </div>
              <span className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Своя сфера
              </span>
            </div>
          </button>
        </div>

        {showCustom && (
          <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCustom();
                if (e.key === "Escape") {
                  setShowCustom(false);
                  setCustom("");
                }
              }}
              placeholder="Например: Пилатес, Волонтёрство, Книги..."
              aria-label="Название новой сферы"
              autoFocus
            />
            <Button type="button" onClick={addCustom} disabled={!custom.trim()}>
              Добавить
            </Button>
          </div>
        )}

        {spheres.length > 0 && (
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
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                Перетащите или ▲▼
              </span>
            </div>

            <div className={cn("relative overflow-hidden rounded-2xl", G.surface)}>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 top-1 h-20 rounded-full bg-gradient-to-b from-white/60 to-transparent opacity-60 blur-md"
              />

              <div className="relative p-3 sm:p-4">
                <ul className="space-y-2">
                  {spheres.map((s, i) => {
                    const isDragging = draggingId === s.id;
                    const isOver = overId === s.id && draggingId && draggingId !== s.id;

                    return (
                      <li
                        key={s.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, s.id)}
                        onDragOver={(e) => onDragOver(e, s.id)}
                        onDragLeave={onDragLeave}
                        onDrop={(e) => onDrop(e, s.id)}
                        onDragEnd={onDragEnd}
                        className={cn(
                          "group relative flex items-center gap-3 px-3 py-3 rounded-2xl",
                          "bg-white/50 dark:bg-white/[0.03]",
                          "backdrop-blur-md",
                          "ring-1 ring-white/60 dark:ring-white/10",
                          "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.04)]",
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

                        <button
                          type="button"
                          onClick={() => cycleColor(s.id)}
                          className={cn(
                            "relative shrink-0 w-7 h-7 rounded-full overflow-hidden",
                            "ring-2 ring-white/90 dark:ring-white/20",
                            "shadow-[0_2px_6px_rgba(15,23,42,0.15),inset_0_1px_0_rgba(255,255,255,0.5)]",
                            "hover:scale-110 active:scale-95 transition-transform"
                          )}
                          style={{ backgroundColor: s.color }}
                          title="Сменить цвет"
                          aria-label={`Сменить цвет сферы ${s.name}`}
                        >
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/60 to-transparent blur-[0.5px]"
                          />
                        </button>

                        <span className="flex-1 min-w-0 text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {s.name}
                        </span>

                        <div className="shrink-0 flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setSpheres((prev) => moveByIndex(prev, s.id, -1))}
                            disabled={i === 0}
                            aria-label={`Поднять ${s.name} выше`}
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
                            onClick={() => setSpheres((prev) => moveByIndex(prev, s.id, 1))}
                            disabled={i === spheres.length - 1}
                            aria-label={`Опустить ${s.name} ниже`}
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
                          onClick={() => removeSphere(s.id)}
                          className={cn(
                            "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                            "text-gray-400 hover:text-red-500 hover:bg-red-50/60 dark:hover:bg-red-950/30",
                            "transition-colors",
                            "opacity-0 group-hover:opacity-100 focus:opacity-100"
                          )}
                          title="Убрать сферу"
                          aria-label={`Убрать сферу ${s.name}`}
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

        {spheres.length === 0 && (
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Выберите хотя бы одну сферу, чтобы продолжить
          </p>
        )}
      </div>
    </OnboardingLayout>
  );
};
