import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  StickyNote,
  CalendarClock,
  MessageSquare,
  Check,
  Sparkles,
  Info,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

const TOTAL = 10;

type Source = {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  gradient: string;
  example: string;
};

const SOURCES: Source[] = [
  {
    id: "head",
    label: "Из головы",
    hint: "Идеи и задачи, которые ещё нигде не записаны",
    icon: Brain,
    gradient: "from-violet-400 to-purple-600",
    example: "«Надо не забыть позвонить маме»",
  },
  {
    id: "notes",
    label: "Из заметок",
    hint: "Заметки, чек-листы, документы",
    icon: StickyNote,
    gradient: "from-amber-400 to-orange-500",
    example: "«Купить подарок» в заметках",
  },
  {
    id: "calendar",
    label: "Из календарей",
    hint: "Встречи, занятия, события",
    icon: CalendarClock,
    gradient: "from-blue-400 to-indigo-600",
    example: "Созвон в Google Calendar",
  },
  {
    id: "messengers",
    label: "Из мессенджеров и почты",
    hint: "Сообщения, письма, чаты",
    icon: MessageSquare,
    gradient: "from-emerald-400 to-teal-600",
    example: "Пересланное сообщение в Telegram",
  },
];

export const SourcesImport: React.FC = () => {
  const navigate = useNavigate();
  const { data, update } = useOnboarding();
  const [selected, setSelected] = React.useState<string[]>(data.importedSources);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    update("importedSources", selected);
    navigate("/onboarding/fast-tasks-enter");
  };

  const handleSkip = () => {
    update("importedSources", []);
    navigate("/onboarding/fast-tasks-enter");
  };

  return (
    <OnboardingLayout
      step={7}
      totalSteps={TOTAL}
      title="Откуда к вам обычно приходят задачи?"
      subtitle="Так я пойму, в каких местах стоит подстраховать вас. Это ни к чему не обязывает — просто отметим важное."
      onBack={() => navigate("/onboarding/apple-google-logging")}
      onNext={handleNext}
      onSkip={handleSkip}
      nextLabel={`Далее${selected.length > 0 ? ` · ${selected.length}` : ""}`}
    >
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute -inset-8 -z-10 pointer-events-none"
        >
          <div className="absolute -top-10 left-1/4 w-72 h-72 rounded-full bg-violet-400/15 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-emerald-400/15 blur-3xl" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              aria-hidden="true"
              className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-sm"
            >
              <Sparkles size={13} />
            </div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">
              Источники задач
            </p>
          </div>

          {selected.length > 0 ? (
            <Badge variant="success">
              <Check size={11} className="mr-1" aria-hidden="true" />
              Выбрано: {selected.length}
            </Badge>
          ) : (
            <Badge variant="neutral">Ничего не выбрано</Badge>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-2.5">
          {SOURCES.map((src) => {
            const active = selected.includes(src.id);
            const Icon = src.icon;

            return (
              <button
                key={src.id}
                type="button"
                onClick={() => toggle(src.id)}
                aria-pressed={active}
                className={cn(
                  "group relative text-left",
                  "rounded-2xl p-4",
                  "bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm",
                  "border transition-all duration-300",
                  "hover:-translate-y-0.5 hover:shadow-lg",
                  active
                    ? "border-transparent ring-2 ring-blue-500/60 shadow-md"
                    : "border-gray-200/70 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300",
                    "bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5",
                    active ? "opacity-100" : "opacity-0"
                  )}
                />

                <div className="relative flex items-start gap-3">
                  <div
                    className={cn(
                      "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm",
                      "bg-gradient-to-br transition-transform duration-300",
                      "group-hover:scale-105",
                      src.gradient
                    )}
                    aria-hidden="true"
                  >
                    <Icon size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white leading-snug">
                      {src.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {src.hint}
                    </p>
                    <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500 italic truncate">
                      {src.example}
                    </p>
                  </div>

                  <span
                    aria-hidden="true"
                    className={cn(
                      "shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                      active
                        ? "bg-blue-500 border-blue-500 text-white scale-100"
                        : "border-gray-300 dark:border-gray-600 scale-95"
                    )}
                  >
                    {active && <Check size={12} strokeWidth={3} />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Info size={12} className="shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            Ничего не загружаем без вашего ведома — отметили пункт, значит
            подскажем, как быстро переносить отсюда задачи.
          </p>
        </div>

        {selected.length === 0 && (
          <div className="mt-6 flex flex-col items-center text-center py-6">
            <div
              aria-hidden="true"
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400/20 to-emerald-500/20 flex items-center justify-center mb-3"
            >
              <Sparkles
                size={24}
                className="text-violet-500 dark:text-violet-400"
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Можно пропустить — но если отметить источники, Dayla будет
              чаще напоминать о них в нужный момент.
            </p>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
};
