import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Send, Calendar, BarChart3,
  Mic, Zap, Target, ArrowRight, Check,
  Reply,
  Copy,
  Download,
  Pin,
  Forward,
  Trash2,
  ArrowDown,
  Hash,
  Video,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

import {
  getPerspectiveMatrix,
  usePerspectiveTransform,
  type Point,
} from "@/utils/perspective";

import { Button, InteractiveButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

type Priority = "A" | "B" | "C" | "D" | "E" | "F";

const PRIORITY_STYLES: Record<
  Priority,
  { bg: string; solid: string; text: string; ring: string }
> = {
  A: { bg: "bg-red-100 dark:bg-red-900/40",       solid: "bg-red-500",     text: "text-red-700 dark:text-red-300",       ring: "ring-red-300/60 dark:ring-red-700/60" },
  B: { bg: "bg-orange-100 dark:bg-orange-900/40", solid: "bg-orange-500",  text: "text-orange-700 dark:text-orange-300", ring: "ring-orange-300/60 dark:ring-orange-700/60" },
  C: { bg: "bg-amber-100 dark:bg-amber-900/40",   solid: "bg-amber-500",   text: "text-amber-700 dark:text-amber-300",   ring: "ring-amber-300/60 dark:ring-amber-700/60" },
  D: { bg: "bg-blue-100 dark:bg-blue-900/40",     solid: "bg-blue-500",    text: "text-blue-700 dark:text-blue-300",     ring: "ring-blue-300/60 dark:ring-blue-700/60" },
  E: { bg: "bg-slate-100 dark:bg-slate-800/60",   solid: "bg-slate-400",   text: "text-slate-600 dark:text-slate-300",   ring: "ring-slate-300/60 dark:ring-slate-700/60" },
  F: { bg: "bg-slate-50 dark:bg-slate-800/40",    solid: "bg-slate-300",   text: "text-slate-500 dark:text-slate-400",   ring: "ring-slate-200/60 dark:ring-slate-700/40" },
};

export const Start: React.FC = () => {
  const navigate = useNavigate();
  const start = () => navigate("/onboarding/for-what-using");

  const [finalCtaActive, setFinalCtaActive] = React.useState(false);
  const handleFinalCtaActive = React.useCallback((active: boolean) => {
    setFinalCtaActive(active);
  }, []);

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden">
      <PageBackdrop />
      <LandingHeader />
      <div className="relative z-10">
        <Hero onStart={start} />
        <UserCaseCarousel paused={finalCtaActive} />
        <FinalCTA onStart={start} onActiveChange={handleFinalCtaActive} />
        <LandingFooter />
      </div>
    </div>
  );
};

type MenuItem = {
  label: string;
  icon: LucideIcon;
  tone?: "default" | "danger";
};

const CONTEXT_MENU_ITEMS: MenuItem[] = [
  { label: "Ответить",         icon: Reply },
  { label: "Скопировать",      icon: Copy },
  { label: "Сохранить фото",   icon: Download },
  { label: "Переслать Dayla",        icon: Forward },
  { label: "Удалить",          icon: Trash2, tone: "danger" },
];

const ChatContextMenu: React.FC = () => (
  <div
    className="
      relative rounded-2xl overflow-visible
      bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
      ring-1 ring-gray-200/80 dark:ring-gray-700/60
      shadow-2xl
    "
    role="menu"
    aria-label="Действия с сообщением"
  >
    {CONTEXT_MENU_ITEMS.map(({ label, icon: Icon, tone }, i) => {
      const isDanger = tone === "danger";
      const isHighlighted = label === "Переслать Dayla";

      return (
        <React.Fragment key={label}>
          {isDanger && i > 0 && (
            <div className="h-px bg-gray-100 dark:bg-gray-800" />
          )}

          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            className={cn(
                "relative isolate w-full flex items-center gap-2.5",
                "px-3 py-2 text-left text-[20px] font-medium",
                "transition-colors rounded-xl",
                isHighlighted ? "z-10" : "z-0",
                isDanger &&
                "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40",
                !isDanger &&
                !isHighlighted &&
                "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60"
            )}
            >
            {isHighlighted && (
                <>
                <span
                    aria-hidden="true"
                    className="
                    absolute inset-[-30%] z-0 pointer-events-none
                    blur-xl rounded-full
                    "
                    style={{
                    background:
                        "radial-gradient(circle at center, rgba(59,130,246,0.75) 0%, rgba(99,102,241,0.45) 40%, rgba(139,92,246,0.2) 65%, transparent 90%)",
                    }}
                />

                <span
                    aria-hidden="true"
                    className="
                    absolute inset-0 z-10 pointer-events-none
                    rounded-xl
                    bg-white dark:bg-gray-900
                    shadow-md
                    "
                />
                </>
            )}

            <Icon
                size={13}
                className={cn(
                "shrink-0 relative z-20",
                isDanger && "text-red-500 dark:text-red-400",
                !isDanger && !isHighlighted && "text-gray-400 dark:text-gray-500"
                )}
                aria-hidden="true"
            />

            <span className="relative z-20 flex-1 truncate">{label}</span>
            </button>
        </React.Fragment>
      );
    })}
  </div>
);

const GTD_SOURCES = [
  { id: "jira",     name: "Jira",     src: "/images/Jira_Software_Logo.svg", count: 6 },
  { id: "trueconf", name: "TrueConf", src: "/images/tc_logo_square.png",    count: 3 },
  { id: "slack",    name: "Slack",    src: "/images/slack.png",            count: 3 },
];

const GTDAggregation: React.FC = () => (
  <div className="relative w-full max-w-[460px]">
    <div
      aria-hidden="true"
      className="absolute inset-[-10%] -z-10 rounded-full bg-slate-400/10 blur-3xl"
    />

    <div className="grid grid-cols-3 gap-3 mb-1">
      {GTD_SOURCES.map(({ id, name, src, count }) => (
        <div
          key={id}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm ring-1 ring-gray-200/80 dark:ring-gray-700/60 shadow-sm"
        >
          <div className="w-14 h-14 rounded-xl bg-white dark:bg-gray-800 ring-1 ring-gray-200/70 dark:ring-gray-700/60 flex items-center justify-center">
            <img
              src={src}
              alt={name}
              className="w-9 h-9 object-contain select-none pointer-events-none"
              loading="lazy"
              draggable={false}
            />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
            {count} задач
          </span>
        </div>
      ))}
    </div>

    <div className="text-slate-300 dark:text-slate-700">
      <svg
        viewBox="0 0 400 56"
        className="w-full h-12"
        aria-hidden="true"
        fill="none"
      >
        <defs>
          <linearGradient id="gtd-line-down" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="currentColor" stopOpacity="0" />
            <stop offset="35%"  stopColor="currentColor" stopOpacity="0.4" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.85" />
          </linearGradient>

          <radialGradient id="gtd-node" cx="35%" cy="30%" r="65%">
            <stop offset="0%"   stopColor="#ffffff"       stopOpacity="0.95" />
            <stop offset="55%"  stopColor="currentColor"  stopOpacity="0.55" />
            <stop offset="100%" stopColor="currentColor"  stopOpacity="0.3" />
          </radialGradient>

          <filter id="gtd-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>

        <g
          filter="url(#gtd-glow)"
          opacity="0.35"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M72 4 Q72 32 200 46" />
          <path d="M200 4 L200 46" />
          <path d="M328 4 Q328 32 200 46" />
        </g>

        <g
          stroke="url(#gtd-line-down)"
          strokeWidth="1.25"
          strokeLinecap="round"
        >
          <path d="M72 4 Q72 32 200 46" />
          <path d="M200 4 L200 46" />
          <path d="M328 4 Q328 32 200 46" />
        </g>

        <circle cx="72"  cy="4"  r="3" fill="url(#gtd-node)" />
        <circle cx="200" cy="4"  r="3" fill="url(#gtd-node)" />
        <circle cx="328" cy="4"  r="3" fill="url(#gtd-node)" />
        <circle cx="200" cy="46" r="4" fill="url(#gtd-node)" />
      </svg>
    </div>

    <div className="flex justify-center">
      <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 shadow-md">
        <div className="w-9 h-9 rounded-full bg-slate-800 dark:bg-slate-700 flex items-center justify-center text-white shadow-sm shrink-0">
          <Sparkles size={15} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Dayla разложила по GTD
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            12 задач · 4 проекта · 3 источника
          </p>
        </div>
      </div>
    </div>

    <div className="flex justify-center my-1 text-slate-300 dark:text-slate-700">
      <svg
        viewBox="0 0 40 40"
        className="w-10 h-10"
        aria-hidden="true"
        fill="none"
      >
        <defs>
          <linearGradient id="gtd-line-bottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="currentColor" stopOpacity="0.85" />
            <stop offset="60%"  stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="gtd-node-bottom" cx="35%" cy="30%" r="65%">
            <stop offset="0%"   stopColor="#ffffff"       stopOpacity="0.95" />
            <stop offset="55%"  stopColor="currentColor"  stopOpacity="0.55" />
            <stop offset="100%" stopColor="currentColor"  stopOpacity="0.3" />
          </radialGradient>
        </defs>

        <path
          d="M20 6 L20 32"
          stroke="url(#gtd-line-bottom)"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <circle cx="20" cy="6" r="4" fill="url(#gtd-node-bottom)" />
      </svg>
    </div>

    <div className="flex justify-center">
      <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 shadow-md">
        <img
          src="/images/google-calendar.png"
          alt="Google Calendar"
          className="w-7 h-7 object-contain select-none pointer-events-none shrink-0"
          loading="lazy"
          draggable={false}
        />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Внести в Google Calendar
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Слоты подобраны по вашему графику
          </p>
        </div>
      </div>
    </div>
  </div>
);

const SourceBadge: React.FC<{ kind: "jira" | "trueconf" | "slack" }> = ({ kind }) => {
  const cfg = {
    jira:     { label: "Jira",     tint: "jira" as const },
    trueconf: { label: "TrueConf", tint: "trueconf" as const },
    slack:    { label: "Slack",    tint: "slack" as const },
  }[kind];

  return (
    <span
      className={cn(
        "shrink-0 inline-flex items-center gap-1.5",
        "text-[10px] px-1.5 py-0.5 rounded",
        "bg-gray-100/80 dark:bg-gray-800/80",
        "backdrop-blur-sm",
        "ring-1 ring-white/40 dark:ring-white/5",
        "text-gray-700 dark:text-gray-300 font-medium",
      )}
    >
      <GlassDot tint={cfg.tint} size={6} />
      {cfg.label}
    </span>
  );
};

type GlassTint = "red" | "amber" | "slate" | "blue" | "jira" | "trueconf" | "slack";

const GLASS_TINTS: Record<GlassTint, string> = {
  red:      "from-red-300/80       to-red-500/60       shadow-red-400/30",
  amber:    "from-amber-300/80     to-amber-500/60     shadow-amber-400/30",
  slate:    "from-slate-300/80     to-slate-500/60     shadow-slate-400/30",
  blue:     "from-blue-300/80      to-blue-500/60      shadow-blue-400/30",
  jira:     "from-blue-300/80      to-indigo-500/60    shadow-indigo-400/30",
  trueconf: "from-emerald-300/80   to-teal-500/60      shadow-teal-400/30",
  slack:    "from-fuchsia-300/80   to-purple-500/60    shadow-purple-400/30",
};

const GlassDot: React.FC<{ tint: GlassTint; size?: number }> = ({
  tint,
  size = 8,
}) => (
  <span
    aria-hidden="true"
    className={cn(
      "relative inline-block rounded-full shrink-0",
      "bg-gradient-to-br",
      GLASS_TINTS[tint],
      "ring-1 ring-white/60 dark:ring-white/15",
      "backdrop-blur-[2px]",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(15,23,42,0.06)]",
      "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.4)]",
    )}
    style={{ width: size, height: size }}
  >
    <span
      className="absolute rounded-full bg-white/80 blur-[0.5px]"
      style={{
        top: "15%",
        left: "15%",
        width: "35%",
        height: "35%",
      }}
    />
  </span>
);

const GlassPill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    className={cn(
      "relative inline-flex items-center gap-1.5",
      "px-2.5 py-1 rounded-full",
      "bg-white/35 dark:bg-white/[0.04]",
      "backdrop-blur-md",
      "ring-1 ring-white/50 dark:ring-white/10",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.05)]",
      "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.35)]",
      "text-[11px] uppercase tracking-widest font-medium",
      "text-gray-600 dark:text-gray-300",
    )}
  >
    {children}
  </span>
);

const SectionLabel: React.FC<{ tint: GlassTint; children: React.ReactNode }> = ({
  tint,
  children,
}) => (
  <div className="mb-2">
    <GlassPill>
      <GlassDot tint={tint} size={7} />
      {children}
    </GlassPill>
  </div>
);

const GTD_RESPONSE = (
  <div className="space-y-3">
    <p>
      Собрала <strong className="font-semibold">12 задач</strong> за период 30.09–06.10
      из <strong>Jira</strong>, <strong>TrueConf</strong> и <strong>Slack</strong>.
      Разложила по GTD:
    </p>

    <div>
      <SectionLabel tint="red">Дедлайн сегодня</SectionLabel>
      <ul className="space-y-1.5">
        <li className="flex items-start gap-2">
          <SourceBadge kind="jira" />
          <span className="flex-1">Ревью PR #482 — до 18:00</span>
        </li>
        <li className="flex items-start gap-2">
          <SourceBadge kind="slack" />
          <span className="flex-1">Ответить клиенту по SSO — до 12:00</span>
        </li>
      </ul>
    </div>

    <div>
      <SectionLabel tint="amber">На этой неделе</SectionLabel>
      <ul className="space-y-1.5">
        <li className="flex items-start gap-2">
          <SourceBadge kind="jira" />
          <span className="flex-1">Спринт-планирование Q4 — 03.10, 11:00</span>
        </li>
        <li className="flex items-start gap-2">
          <SourceBadge kind="trueconf" />
          <span className="flex-1">Созвон с продажами — 03.10, 15:00</span>
        </li>
        <li className="flex items-start gap-2">
          <SourceBadge kind="slack" />
          <span className="flex-1">Согласовать бюджет на ноябрь — 04.10, до 17:00</span>
        </li>
        <li className="flex items-start gap-2">
          <SourceBadge kind="jira" />
          <span className="flex-1">Закрыть 3 задачи из Sprint 24 — 04.10</span>
        </li>
      </ul>
    </div>

    <div>
      <SectionLabel tint="slate">На следующей неделе</SectionLabel>
      <ul className="space-y-1.5">
        <li className="flex items-start gap-2">
          <SourceBadge kind="jira" />
          <span className="flex-1">Ретроспектива спринта — 08.10, 16:00</span>
        </li>
        <li className="flex items-start gap-2">
          <SourceBadge kind="trueconf" />
          <span className="flex-1">Демо для партнёров — 09.10, 14:00</span>
        </li>
        <li className="flex items-start gap-2">
          <SourceBadge kind="slack" />
          <span className="flex-1">Квартальный отчёт — 10.10</span>
        </li>
      </ul>
    </div>

    <div
      className={cn(
        "rounded-xl p-3",
        "bg-white/40 dark:bg-white/[0.03]",
        "backdrop-blur-md",
        "ring-1 ring-white/50 dark:ring-white/10",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(15,23,42,0.04)]",
        "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.3)]",
      )}
    >
      <SectionLabel tint="blue">
        План по вашему графику · Пн–Пт 09:00–18:00
      </SectionLabel>

      <div className="space-y-2 text-[12px] leading-snug mt-1">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Чт, 03.10</p>
          <p className="text-gray-600 dark:text-gray-300">
            09:00–10:30 — Ревью PR #482 · 11:00–12:00 — Планирование Q4 · 15:00–16:00 — Созвон с продажами
          </p>
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Пт, 04.10</p>
          <p className="text-gray-600 dark:text-gray-300">
            09:00–10:00 — Ответить клиенту · 10:00–12:00 — Задачи Sprint 24 · 14:00–15:30 — Бюджет на ноябрь
          </p>
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Пн, 07.10</p>
          <p className="text-gray-600 dark:text-gray-300">
            10:00–11:00 — Разбор входящих · 14:00–15:00 — Подготовка к демо
          </p>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
        Добавила буферы 15 мин до и после каждого созвона. Обед 13:00–14:00 не тронут.
      </p>
    </div>

    <div className="pt-1 flex flex-wrap gap-1.5">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 shadow-sm transition-all hover:-translate-y-0.5"
      >
        <Check size={12} aria-hidden="true" />
        Внести в календарь
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all hover:-translate-y-0.5"
      >
        Изменить
      </button>
      <button
        type="button"
        className="inline-flex items-center text-xs font-medium px-3 py-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        Отмена
      </button>
    </div>
  </div>
);

const UserCaseGTD: React.FC = () => (
  <section id="usecase-gtd" className="relative py-20 md:py-28 overflow-hidden">
    <div className="relative max-w-6xl mx-auto px-4 md:px-6">
      <div className="max-w-2xl mb-12 md:mb-16">
        <Badge className="text-eyebrow mb-3">Систематизация по GTD</Badge>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Одна фраза — и всё разложено по полочкам
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Jira, TrueConf, Slack — Dayla соберёт задачи из всех источников,
          расставит дедлайны и впишет их в ваш календарь.
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] gap-12 lg:gap-16 items-center">
        <div className="relative flex justify-center">
          <GTDAggregation />
        </div>

        <div className="relative">
          <DaylaChatCard
            userMessage="Систематизируй задачи по Getting Things Done, которые мне прислали на этой неделе из Jira, TrueConf и Slack, в мой Гугл календарь"
            daylaMessage={GTD_RESPONSE}
          />
        </div>
      </div>

      <div className="mt-12 md:mt-16 max-w-2xl mx-auto text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-blue-500" aria-hidden="true" />
          Вы утверждаете план одним нажатием — Dayla сама внесёт всё в календарь
        </p>
      </div>
    </div>
  </section>
);

const IMG_W = 396;
const IMG_H = 773;

const UI_W = 400;
const UI_H = 866;

const IPHONE_SCREEN_CORNERS: [Point, Point, Point, Point] = [
  [37, -0.3],
  [98, 17.3],
  [97, 98],
  [7, 96],
];

const IPhoneScene: React.FC = () => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.4);

  React.useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / IMG_W);
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const matrix = React.useMemo(() => {
    const dst = IPHONE_SCREEN_CORNERS.map(([px, py]) => [
      (px / 100) * IMG_W,
      (py / 100) * IMG_H,
    ]) as [Point, Point, Point, Point];

    return getPerspectiveMatrix(
      [
        [0, 0],
        [UI_W, 0],
        [UI_W, UI_H],
        [0, UI_H],
      ],
      dst
    );
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      style={{ height: IMG_H * scale }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
            width: IMG_W,
            height: IMG_H,
            transform: `scale(${scale})`,
            WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.25) 65%, transparent 78%, transparent 100%)",
            maskImage:
            "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.25) 65%, transparent 78%, transparent 100%)",
        }}
      >
        <img
          src="/images/iPhone.png"
          alt="iPhone"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          loading="lazy"
          draggable={false}
        />

        <div
          className="absolute top-0 left-0 overflow-hidden pointer-events-none select-none"
          style={{
            width: UI_W,
            height: UI_H,
            transformOrigin: "0 0",
            transform: matrix,
            borderRadius: 50,
          }}
        >
          <div className="absolute inset-0 flex flex-col bg-white dark:bg-gray-950">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                АС
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[20px] font-medium text-gray-900 dark:text-white truncate">
                  Андрей Смирнов
                </p>
                <p className="text-[20px] text-emerald-500">онлайн</p>
              </div>
            </div>

            <div className="flex-1 p-3 space-y-2">
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5">
                  <p className="text-[25px] text-gray-800 dark:text-gray-200">
                    Привет! Не забудь про рейс ✈️
                  </p>
                </div>
              </div>
            </div>
          </div>

          <img
            src="/images/airplaneTicketWB-mes.png"
            alt="Сообщение с авиабилетом"
            className="
              absolute left-[3%] top-[27%] z-20
              w-[84%] h-auto
              rounded-2xl shadow-lg
              pointer-events-none select-none
            "
            loading="lazy"
          />

          <div
            className="
              absolute left-[3%] top-[48%] z-30
              w-[53%]
              pointer-events-none select-none
            "
          >
            <ChatContextMenu />
          </div>
        </div>
      </div>
    </div>
  );
};

interface DaylaChatCardProps {
  forwardedFrom?: string;
  userMessage?: string;
  daylaMessage: React.ReactNode;
}

const DaylaChatCard: React.FC<DaylaChatCardProps> = ({
  forwardedFrom,
  userMessage,
  daylaMessage,
}) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-2xl",
      "bg-white/55 dark:bg-gray-900/40",
      "backdrop-blur-2xl",
      "ring-1 ring-white/60 dark:ring-white/10",
      "shadow-[0_8px_32px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.75)]",
      "dark:shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]",
    )}
  >
    <div className="relative flex items-center gap-3 px-4 py-3 border-b border-white/40 dark:border-white/5 bg-white/30 dark:bg-white/[0.03] backdrop-blur-md">
      <div
        aria-hidden="true"
        className="w-9 h-9 rounded-full shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-md ring-1 ring-white/40"
      >
        <Sparkles size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-900 dark:text-white">Dayla</p>
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Онлайн
        </p>
      </div>
    </div>

    <div className="relative p-4 space-y-4">
      {(forwardedFrom || userMessage) && (
        <div className="flex justify-end">
          <div
            className={cn(
              "max-w-[82%] rounded-2xl rounded-br-sm",
              "bg-gradient-to-br from-blue-500/90 to-blue-600/90",
              "backdrop-blur-md text-white px-4 py-2.5",
              "ring-1 ring-white/25",
              "shadow-[0_4px_16px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]",
            )}
          >
            {forwardedFrom && (
              <p className="text-[10px] uppercase tracking-wide opacity-75 mb-1">
                {forwardedFrom}
              </p>
            )}
            {userMessage && <p className="text-sm leading-snug">{userMessage}</p>}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div
          aria-hidden="true"
          className="w-7 h-7 rounded-full shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-md ring-1 ring-white/40"
        >
          <Sparkles size={13} />
        </div>

        <div className="max-w-[86%] min-w-0">
          <div
            className={cn(
              "rounded-2xl rounded-bl-sm px-4 py-3",
              "bg-white/55 dark:bg-white/[0.06]",
              "backdrop-blur-md",
              "ring-1 ring-white/50 dark:ring-white/5",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_2px_8px_rgba(15,23,42,0.05)]",
              "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_8px_rgba(0,0,0,0.25)]",
            )}
          >
            <div className="text-sm text-gray-900 dark:text-white leading-snug">
              {daylaMessage}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="relative px-4 py-3 border-t border-white/40 dark:border-white/5 bg-white/25 dark:bg-white/[0.02] backdrop-blur-md">
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Send size={14} aria-hidden="true" />
        <span>Сообщение Dayla…</span>
      </div>
    </div>
  </div>
);

type PageBlob = {
  left: string;
  top: string;
  size: string;
  gradient: string;
  shape: string;
  duration: string;
  delay: string;
};

const PAGE_BLOBS: PageBlob[] = [
  { left: "-10%", top: "-2%",  size: "32rem", gradient: "from-blue-500/22     to-indigo-500/10",   shape: "60% 40% 70% 30% / 60% 30% 70% 40%", duration: "24s", delay: "0s"   },
  { left: "55%",  top: "6%",   size: "28rem", gradient: "from-purple-500/18   to-fuchsia-500/10",  shape: "40% 60% 30% 70% / 50% 60% 40% 50%", duration: "28s", delay: "3s"   },

  { left: "60%",  top: "16%",  size: "30rem", gradient: "from-indigo-500/20   to-violet-500/10",   shape: "50% 50% 60% 40% / 40% 50% 60% 50%", duration: "30s", delay: "5s"   },
  { left: "-14%", top: "26%",  size: "28rem", gradient: "from-cyan-500/15     to-blue-500/8",      shape: "70% 30% 50% 50% / 50% 40% 60% 50%", duration: "26s", delay: "2s"   },

  { left: "58%",  top: "36%",  size: "30rem", gradient: "from-fuchsia-500/16  to-purple-500/8",    shape: "60% 40% 40% 60% / 50% 50% 40% 60%", duration: "24s", delay: "4s"   },
  { left: "-10%", top: "46%",  size: "32rem", gradient: "from-blue-500/18     to-indigo-500/8",    shape: "40% 60% 50% 50% / 60% 40% 60% 40%", duration: "32s", delay: "6s"   },

  { left: "70%",  top: "56%",  size: "28rem", gradient: "from-purple-500/16   to-pink-500/8",      shape: "50% 50% 30% 70% / 40% 60% 40% 60%", duration: "28s", delay: "1s"   },
  { left: "-8%",  top: "66%",  size: "30rem", gradient: "from-indigo-500/18   to-blue-500/8",      shape: "60% 40% 50% 50% / 50% 50% 60% 40%", duration: "30s", delay: "3.5s" },

  { left: "40%",  top: "80%",  size: "30rem", gradient: "from-fuchsia-500/14  to-purple-500/8",    shape: "40% 60% 60% 40% / 50% 50% 40% 60%", duration: "32s", delay: "5s"   },
  { left: "-12%", top: "92%",  size: "28rem", gradient: "from-blue-500/16     to-cyan-500/8",      shape: "50% 50% 40% 60% / 60% 40% 50% 50%", duration: "34s", delay: "7s"   },
];

type PagePulse = {
  left: string;
  top: string;
  color: string;
  delay: string;
  duration: string;
};

const PAGE_PULSES: PagePulse[] = [
  { left: "14%",  top: "12%", color: "bg-blue-400/40",    delay: "0s",   duration: "7s"  },
  { left: "82%",  top: "22%", color: "bg-purple-400/35",  delay: "1.5s", duration: "9s"  },
  { left: "28%",  top: "34%", color: "bg-indigo-400/35",  delay: "3s",   duration: "11s" },
  { left: "58%",  top: "44%", color: "bg-fuchsia-400/30", delay: "4.5s", duration: "8s"  },
  { left: "36%",  top: "56%", color: "bg-violet-400/35",  delay: "2s",   duration: "9s"  },
  { left: "72%",  top: "68%", color: "bg-pink-400/30",    delay: "5.5s", duration: "12s" },
  { left: "12%",  top: "78%", color: "bg-indigo-400/35",  delay: "0.6s", duration: "9s"  },
  { left: "84%",  top: "88%", color: "bg-blue-400/30",    delay: "3.8s", duration: "10s" },
];

const PageBackdrop: React.FC = () => (
  <>
    <style>{`
      @keyframes page-blob-drift {
        0%, 100% { transform: translate3d(0, 0, 0)    rotate(0deg)  scale(1);    }
        50%      { transform: translate3d(2%, -2%, 0) rotate(10deg) scale(1.09); }
      }
      @keyframes page-pulse {
        0%, 100% { transform: scale(0.6); opacity: 0; }
        50%      { transform: scale(1.5); opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        .page-blob, .page-pulse { animation: none; }
      }
    `}</style>

    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
    >
      {PAGE_BLOBS.map((b, i) => (
        <div
          key={`blob-${i}`}
          className={`absolute bg-gradient-to-br blur-3xl page-blob ${b.gradient}`}
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            borderRadius: b.shape,
            animation: `page-blob-drift ${b.duration} ease-in-out ${b.delay} infinite`,
          }}
        />
      ))}

      {PAGE_PULSES.map((p, i) => (
        <span
          key={`pulse-${i}`}
          className={`absolute w-2 h-2 rounded-full blur-[1px] page-pulse ${p.color}`}
          style={{
            left: p.left,
            top: p.top,
            animation: `page-pulse ${p.duration} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}

      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          color: "#000",
        }}
      />
    </div>
  </>
);

const UserCase: React.FC = () => (
  <section id="usecase" className="relative py-20 md:py-28 overflow-hidden">

    <div className="relative max-w-5xl mx-auto px-4 md:px-6">
      <div className="max-w-2xl mb-12 md:mb-16">
        <Badge className="text-eyebrow mb-3">Реальный сценарий</Badge>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Пересылайте события — Dayla всё спланирует
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Не нужно вручную копировать дату, время и место. Отправьте сообщение
          боту — Dayla разберётся сама.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="relative flex justify-center">
        <div className="relative w-full max-w-[400px]">
            <IPhoneScene />
        </div>
        </div>

        <div className="relative">
            <DaylaChatCard
                forwardedFrom="Переслано от Андрея Смирнова"
                userMessage="Авиабилет PD-205 · VKO → LED"
                daylaMessage={
                <>
                    Распознала авиабилет:{' '}
                    <strong className="font-semibold">дата — 05 апреля, 21:55</strong>,{' '}
                    <strong className="font-semibold">место посадки — Внуково, терминал A</strong>.
                    Куда добавить событие?
                </>
                }
            />
            </div>
      </div>

      <div className="mt-12 md:mt-16 max-w-2xl mx-auto text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-blue-500" aria-hidden="true" />
          Dayla ничего не меняет без подтверждения — вы решаете, что делать с&nbsp;событием
        </p>
      </div>
    </div>
  </section>
);

const ExcelPreview: React.FC = () => (
  <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md">
    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/60">
      <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
        X
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[20px] font-medium text-gray-900 dark:text-white truncate">
          Финансовый_отчёт_Q4.xlsx
        </p>
        <p className="text-[9px] text-gray-500 dark:text-gray-400">
          Excel · 24 КБ
        </p>
      </div>
    </div>

    <div className="p-2.5">
      <table className="w-full text-[15px] leading-tight">
        <thead>
          <tr className="text-left text-gray-500 dark:text-gray-400">
            <th className="pb-1 font-medium">Статья</th>
            <th className="pb-1 text-right font-medium">План</th>
            <th className="pb-1 text-right font-medium">Факт</th>
            <th className="pb-1 text-right font-medium">Δ</th>
          </tr>
        </thead>
        <tbody className="text-gray-800 dark:text-gray-200">
          <tr>
            <td className="py-0.5">Выручка</td>
            <td className="py-0.5 text-right tabular-nums">2 400</td>
            <td className="py-0.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">2 580</td>
            <td className="py-0.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">+7,5%</td>
          </tr>
          <tr>
            <td className="py-0.5">Себестоимость</td>
            <td className="py-0.5 text-right tabular-nums">1 100</td>
            <td className="py-0.5 text-right tabular-nums text-red-500 dark:text-red-400">1 240</td>
            <td className="py-0.5 text-right tabular-nums text-red-500 dark:text-red-400">+12,7%</td>
          </tr>
          <tr className="border-t border-gray-100 dark:border-gray-800">
            <td className="py-1 font-medium">Маржа</td>
            <td className="py-1 text-right tabular-nums font-medium">1 300</td>
            <td className="py-1 text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">1 340</td>
            <td className="py-1 text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">+3,1%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const MON_IMG_W = 1144;
const MON_IMG_H = 938;

const MON_UI_W = 800;
const MON_UI_H = 400;

const MONITOR_SCREEN_CORNERS: [Point, Point, Point, Point] = [
  [1, 1.7],
  [99, 3],
  [94, 74],
  [7.2, 60],
];

const MonitorScene: React.FC = () => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.5);

  React.useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / MON_IMG_W);
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const matrix = React.useMemo(() => {
    const dst = MONITOR_SCREEN_CORNERS.map(([px, py]) => [
      (px / 100) * MON_IMG_W,
      (py / 100) * MON_IMG_H,
    ]) as [Point, Point, Point, Point];

    return getPerspectiveMatrix(
      [
        [0, 0],
        [MON_UI_W, 0],
        [MON_UI_W, MON_UI_H],
        [0, MON_UI_H],
      ],
      dst
    );
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      style={{ height: MON_IMG_H * scale }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: MON_IMG_W,
          height: MON_IMG_H,
          transform: `scale(${scale})`,
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.7) 65%, rgba(0,0,0,0.25) 70%, transparent 87%, transparent 100%)",
            maskImage:
            "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.7) 65%, rgba(0,0,0,0.25) 70%, transparent 87%, transparent 100%)",
        }}
      >
        <img
          src="/images/Monitor.png"
          alt="Монитор с финансовым отчётом"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          loading="lazy"
          draggable={false}
        />

        <div
          className="absolute top-0 left-0 overflow-hidden pointer-events-none select-none"
          style={{
            width: MON_UI_W,
            height: MON_UI_H,
            transformOrigin: "0 0",
            transform: matrix,
            borderRadius: 16,
          }}
        >
          <div className="absolute inset-0 flex flex-col bg-white dark:bg-gray-950">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                СН
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[20px] font-medium text-gray-900 dark:text-white truncate">
                  Сергей Ненашев
                </p>
                <p className="text-[16px] text-emerald-500">онлайн</p>
              </div>
            </div>

            <div className="flex-1 p-5 space-y-3 overflow-hidden">

              <div className="flex justify-center">
                <div
                  className="
                    px-3 py-1 rounded-full
                    bg-blue-50 dark:bg-blue-950/50
                    ring-1 ring-blue-100 dark:ring-blue-900/60
                    text-blue-700 dark:text-blue-300
                    text-[14px] font-medium
                    flex items-center gap-1.5
                  "
                >
                  <Sparkles size={13} aria-hidden="true" />
                  В этом диалоге сидит Dayla
                </div>
              </div>

              <div className="flex justify-start">
                <div className="max-w-[60%] space-y-2.5">
                  <div className="rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-3.5 py-2">
                    <p className="text-[20px] text-gray-800 dark:text-gray-200">
                      Не забудьте подать отчётность к концу квартала
                    </p>
                  </div>

                  <ExcelPreview />
                </div>
              </div>

              <div className="flex items-end gap-2">
                <div
                  aria-hidden="true"
                  className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-sm"
                >
                  <Sparkles size={14} />
                </div>
                <div className="max-w-[70%] min-w-0">
                  <div className="rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-3.5 py-2">
                    <p className="text-[18px] text-gray-900 dark:text-white leading-snug">
                      Зафиксировала задачу <strong className="font-semibold">«Подать фин отчёт»</strong> на 30.09.2027 (конец квартала). Собираю ваши документы к концу отчётного периода.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserCaseFinance: React.FC = () => (
  <section
    id="usecase-finance"
    className="relative py-20 md:py-28 overflow-hidden"
  >
    <div className="relative max-w-5xl mx-auto px-4 md:px-6">
      <div className="max-w-2xl mb-12 md:mb-16">
        <Badge className="text-eyebrow mb-3">Из рабочего чата — в план</Badge>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Прислали файл? Dayla превратит его в задачу
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Добавьте Dayla в чат.
          Она распознает, что к чему и когда это надо сдать.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20 items-center">
        <div className="relative">
            <DaylaChatCard
            daylaMessage={
                <>
                Подтянула Финансовый_отчёт_Q4.xlsx.
                Зафиксировала задачу{' '}
                <strong className="font-semibold">«Подать фин отчёт»</strong>{' '}
                на 30.09.2027 (конец квартала). Собираю ваши документы к концу
                отчётного периода.
                </>
            }
            />
        </div>

        <div className="relative flex justify-center">
            <div className="relative w-full max-w-[2000px]">
            <MonitorScene />
            </div>
        </div>
        </div>
    </div>
  </section>
);

const HERO_SCENE_W = 790;
const HERO_SCENE_H = 600;

const HeroScene: React.FC = () => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.5);

  React.useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / HERO_SCENE_W);
    };

    update();

    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      style={{ height: HERO_SCENE_H * scale }}
      aria-label="Календарь и голосовой ассистент Dayla"
      role="img"
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: HERO_SCENE_W,
          height: HERO_SCENE_H,
          transform: `scale(${scale})`,
        }}
      >
        <div
        className="absolute z-0"
        style={{
            left: -80,
            top: -170,
            width: 825,
            height: 1000,
            WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 50%, rgba(0,0,0,0.35) 72%, transparent 92%)",
            maskImage:
            "linear-gradient(to bottom, black 0%, black 50%, rgba(0,0,0,0.35) 72%, transparent 92%)",
        }}
        >
        <img
            src="/images/MaskotWB.png"
            alt="Ассистент Dayla говорит по телефону"
            className="w-full h-full object-contain select-none pointer-events-none"
            draggable={false}
            loading="lazy"
        />
        </div>

        <div
          className="absolute z-10"
          style={{ left: 250, top: 320, width: 500 }}
        >
          <HeroMockup />
        </div>

        <div
          className="absolute z-20"
          style={{ left: 441, top: 155, width: 595 }}
        >
          <SpeechBubble />
        </div>
      </div>
    </div>
  );
};

const Hero: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <section className="relative">
    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-28 md:pt-40 lg:pt-52 pb-4 md:pb-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
      <div className="text-eyebrow min-w-0">
        <Badge variant="default" className="mb-4">
          <Sparkles size={12} className="mr-1" aria-hidden="true" />
          Бесплатный персональный ИИ-ассистент
        </Badge>

        <h1 className="text-eyebrowtext-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
          Планируйте день{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            за минуту
          </span>
        </h1>

        <p className="mt-5 text-lg text-gray-600 dark:text-gray-400 max-w-xl">
          Скажите о своих планах — Dayla найдёт время в календаре, расставит
          приоритеты и напомнит. Вам не нужно вручную собирать задачи из
          заметок и чатов.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <InteractiveButton
            type="button"
            onClick={onStart}
            scaleAmount={1.2}
            className="text-eyebrow px-8"
          >
            Начать бесплатно
            <ArrowRight size={18} className="ml-1" aria-hidden="true" />
          </InteractiveButton>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              document.getElementById("usecases")?.scrollIntoView({ behavior: "smooth" })
            }
            className="dark:text-white dark"
          >
            <p className="text-eyebrow text-blue-600 dark:text-blue-400 mb-2">
                Как это работает
            </p>
          </Button>
        </div>

      </div>

      <div className="min-w-0">
        <HeroScene />
      </div>
    </div>
  </section>
);

const SpeechBubble: React.FC = () => (
  <Card className="relative p-5 md:p-5 shadow-lg">
    <CardContent className="p-0">
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
        >
          <Mic size={16} className="text-white" />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Голосовой запрос
          </p>
          <p className="text-base md:text-lg leading-snug text-gray-900 dark:text-white">
            «Dayla, тренировка отменилась»
          </p>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Dayla подберёт альтернативу под ваши цели.
          </p>
        </div>
      </div>
    </CardContent>

    <div
      aria-hidden="true"
      className= "absolute -left-2 top-[40%] -translate-y-1/2 w-4 h-4 rotate-45 bg-white dark:bg-gray-800"
    />
  </Card>
);

const MOCK_TASKS: Array<{
  time: string;
  title: string;
  tag: string;
  color: string;
  priority: Priority;
  checkpoints: { done: number; total: number };
  done?: boolean;
}> = [
  { time: "09:00", title: "Встреча с командой",        tag: "Работа", color: "#1a73e8", priority: "B", checkpoints: { done: 0, total: 1 } },
  { time: "11:30", title: "Ответить на письма",        tag: "Работа", color: "#1a73e8", priority: "D", checkpoints: { done: 3, total: 4 } },
  { time: "13:00", title: "Обед",                      tag: "Личное", color: "#e91e63", priority: "F", checkpoints: { done: 0, total: 1 } },
  { time: "15:00", title: "Тренировка",                tag: "Спорт",  color: "#188038", priority: "C", checkpoints: { done: 1, total: 1 }, done: true },
  { time: "18:30", title: "Лабораторная работа X",      tag: "Учёба",  color: "#bdfd46", priority: "A", checkpoints: { done: 2, total: 5 } },
  { time: "18:30", title: "Созвон с контрагентом Y",   tag: "Работа", color: "#1a73e8", priority: "A", checkpoints: { done: 0, total: 1 } },
];

const AI_RECOMMENDATION_STUDENT =
  "Перенести лабораторную работу X с 18:30 на 15:00?";
const AI_RECOMMENDATION_PRO =
  "Перенести онлайн-встречу с контрагентом Y с 18:30 на 15:00?";

const HeroMockup: React.FC = () => (
  <div className="relative w-full">
    <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/25 via-indigo-500/15 to-purple-500/25 rounded-3xl blur-2xl" />
    <Card className="relative w-full p-0 overflow-hidden shadow-xl">
      <div className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Сегодня</p>
          <p className="font-medium">понедельник, 14 октября</p>
        </div>
        <Badge variant="success">Выполнено 60%</Badge>
      </div>

      <ul className="p-3 space-y-1.5">
        {MOCK_TASKS.map((t) => {
          const pr = PRIORITY_STYLES[t.priority];
          const pct = Math.round((t.checkpoints.done / t.checkpoints.total) * 100);

          return (
            <li
              key={t.time + t.title}
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800/60",
                t.done && "opacity-60",
              )}
            >
              <span className="text-xs text-gray-400 w-11 tabular-nums shrink-0">
                {t.time}
              </span>

              <span
                className="w-1 self-stretch rounded shrink-0"
                style={{ backgroundColor: t.color }}
                aria-hidden="true"
              />

              <span
                className={cn(
                  "text-sm flex-1 min-w-0 truncate",
                  t.done && "line-through text-gray-400",
                )}
              >
                {t.title}
              </span>

              <span
                className={cn(
                  "shrink-0 inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ring-1",
                  pr.bg,
                  pr.text,
                  pr.ring,
                )}
                title={`Приоритет ${t.priority}`}
                aria-label={`Приоритет ${t.priority}`}
              >
                {t.priority}
              </span>

              <span
                className="hidden sm:flex shrink-0 items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 tabular-nums"
                title={`Чекпоинты: ${t.checkpoints.done} из ${t.checkpoints.total}`}
                aria-label={`Чекпоинты: ${t.checkpoints.done} из ${t.checkpoints.total}`}
              >
                <span className="relative h-1 w-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-green-500"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span>{t.checkpoints.done}/{t.checkpoints.total}</span>
              </span>

              <span className="hidden md:inline-block shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                {t.tag}
              </span>
            </li>
          );
        })}

        <li className="relative flex flex-col gap-2.5 p-3 rounded bg-blue-50/70 dark:bg-blue-900/20">
        <div className="flex items-center gap-3">

            <span className="relative shrink-0">
            <Sparkles size={14} className="text-blue-500" aria-hidden="true" />
            <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"
            />
            </span>

            <div className="relative flex-1 min-w-0 h-5" aria-label="Рекомендация ИИ">
            <span className="ai-reco-a absolute inset-0 flex items-center text-sm text-blue-800 dark:text-blue-200 whitespace-nowrap overflow-hidden text-ellipsis">
                {AI_RECOMMENDATION_STUDENT}
            </span>
            <span
                className="ai-reco-b absolute inset-0 flex items-center text-sm text-blue-800 dark:text-blue-200 whitespace-nowrap overflow-hidden text-ellipsis"
                aria-hidden="true"
            >
                {AI_RECOMMENDATION_PRO}
            </span>
            </div>
        </div>

        <div className="flex items-center">
            <button
            type="button"
            className="
                inline-flex items-center gap-1 px-2.5 h-6 rounded text-[11px] font-medium
                bg-blue-600 text-white hover:bg-blue-700 transition-colors
            "
            >
            Подтвердить
            </button>

            <button
            type="button"
            className="
                inline-flex items-center gap-1 px-2.5 h-6 rounded text-[11px] font-medium
                bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300
                hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors
            "
            >
            Изменить
            </button>

            <button
            type="button"
            className="
                inline-flex items-center px-2 h-6 rounded text-[11px] font-medium
                text-blue-700/70 dark:text-blue-300/70 hover:text-blue-900 dark:hover:text-blue-100
                transition-colors
            "
            >
            Позже
            </button>
        </div>
        </li>
      </ul>
    </Card>
  </div>
);

const WHITE_GRADIENT_STOPS = [
  { offset: "0%",   color: "#ffffff" },
  { offset: "60%",  color: "#f8fafc" },
  { offset: "100%", color: "#e2e8f0" },
];

const INTEGRATIONS = [
  { src: "/images/google-calendar.png",      alt: "Google Calendar", w: 44 },
  { src: "/images/Календарь_для_macOS.png",  alt: "Apple Calendar",  w: 44 },
  { src: "/images/Jira_Software_Logo.svg",   alt: "Jira",            w: 40 },
  { src: "/images/Notion.png",               alt: "Notion",          w: 44 },
  { src: "/images/Obsidian.png",             alt: "Obsidian",        w: 44 },
  { src: "/images/TelegramWB.png",             alt: "Telegram",        w: 44 },
  { src: "/images/slack.png",             alt: "Slack",        w: 44 },
  { src: "/images/tc_logo_square.png",             alt: "TrueConf",        w: 44 },
];

const FINAL_CTA_OVERLAP_TOP_VH = 10;
const FINAL_CTA_EXTRA_BOTTOM_VH = 55;

const ORBIT_PERIOD_MS = 24000;
const ORBIT_TRANSITION_MS = 700;
const ROW_ICON_SIZE = 56;
const ROW_ICON_IMG_SIZE = 36;
const ROW_GAP = 12;
const ROW_Y_OFFSET = 140;

const FinalCTA: React.FC<{
  onStart: () => void;
  onActiveChange?: (active: boolean) => void;
}> = ({ onStart, onActiveChange }) => {
  const sectionRef = React.useRef<HTMLElement>(null);
  const [active, setActive] = React.useState(false);
  const lastActive = React.useRef(false);
  const lastY = React.useRef(0);

  const iconRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    lastY.current = window.scrollY;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;

      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(vh, rect.bottom);
      const visible = Math.max(0, visibleBottom - visibleTop);
      const ratio = visible / Math.min(vh, rect.height || vh);

      const goingUp = window.scrollY < lastY.current;
      const next = goingUp ? false : ratio > 0.5;

      if (next !== lastActive.current) {
        lastActive.current = next;
        setActive(next);
        onActiveChange?.(next);
      }
      lastY.current = window.scrollY;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [onActiveChange]);

  React.useEffect(() => {
    const N = INTEGRATIONS.length;
    const icons = iconRefs.current;
    if (!icons.length) return;

    const computeRadius = () => Math.min(window.innerWidth * 0.45, 340);

    const orbitValues = (i: number, angle: number) => {
      const R = computeRadius();
      const baseAngle = (i / N) * 360;
      const rad = ((baseAngle + angle) * Math.PI) / 180;
      const x = R * Math.cos(rad);
      const y = R * Math.sin(rad);
      const t = (Math.sin(rad) + 1) / 2;
      const sf = 0.45 + 0.55 * t;
      return {
        x,
        y,
        opacity: 0.1 + 0.9 * t,
        outerSize: 80 + 16 * sf,
        imgSize: 44 + 12 * sf,
      };
    };

    const staticValues = (i: number, maxWidth: number) => {
      const perRow = Math.max(
        1,
        Math.floor((maxWidth + ROW_GAP) / (ROW_ICON_SIZE + ROW_GAP))
      );
      const rowIdx = Math.floor(i / perRow);
      const colIdx = i % perRow;
      const itemsInRow = Math.min(perRow, N - rowIdx * perRow);
      const rowWidth = itemsInRow * ROW_ICON_SIZE + (itemsInRow - 1) * ROW_GAP;
      const startX = -rowWidth / 2 + ROW_ICON_SIZE / 2;

      return {
        x: startX + colIdx * (ROW_ICON_SIZE + ROW_GAP),
        y: ROW_Y_OFFSET + rowIdx * (ROW_ICON_SIZE + ROW_GAP),
        opacity: 1,
        outerSize: ROW_ICON_SIZE,
        imgSize: ROW_ICON_IMG_SIZE,
      };
    };

    const writeIcon = (
      el: HTMLDivElement,
      v: { x: number; y: number; opacity: number; outerSize: number; imgSize: number }
    ) => {
      el.style.transform = `translate(-50%, -50%) translate(${v.x}px, ${v.y}px)`;
      el.style.opacity = v.opacity.toFixed(3);

      const inner = el.firstElementChild as HTMLElement | null;
      if (inner) {
        inner.style.width = `${v.outerSize}px`;
        inner.style.height = `${v.outerSize}px`;
        const img = inner.querySelector("img") as HTMLImageElement | null;
        if (img) {
          img.style.width = `${v.imgSize}px`;
          img.style.height = `${v.imgSize}px`;
        }
      }
    };

    const setTransition = (on: boolean) => {
      const tr = on
        ? `transform ${ORBIT_TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${ORBIT_TRANSITION_MS}ms ease-out`
        : "none";
      const trSize = on
        ? `width ${ORBIT_TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1), height ${ORBIT_TRANSITION_MS}ms cubic-bezier(0.4,0,0.2,1)`
        : "none";

      icons.forEach((el) => {
        if (!el) return;
        el.style.transition = tr;
        const inner = el.firstElementChild as HTMLElement | null;
        if (inner) {
          inner.style.transition = trSize;
          const img = inner.querySelector("img") as HTMLImageElement | null;
          if (img) img.style.transition = trSize;
        }
      });

      void (icons[0]?.offsetWidth ?? 0);
    };

    if (active) {
      setTransition(true);
      icons.forEach((el, i) => {
        if (el) writeIcon(el, orbitValues(i, 0));
      });

      let rafId = 0;
      const timeoutId = window.setTimeout(() => {
        setTransition(false);
        const started = performance.now();
        const tick = (now: number) => {
          const angle = (((now - started) / ORBIT_PERIOD_MS) * 360) % 360;
          icons.forEach((el, i) => {
            if (el) writeIcon(el, orbitValues(i, angle));
          });
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      }, ORBIT_TRANSITION_MS);

      return () => {
        window.clearTimeout(timeoutId);
        if (rafId) cancelAnimationFrame(rafId);
      };
    } else {
      const applyStatic = () => {
        const maxWidth = Math.min(window.innerWidth - 120, 600);
        setTransition(true);
        icons.forEach((el, i) => {
          if (el) writeIcon(el, staticValues(i, maxWidth));
        });
      };

      applyStatic();
      window.addEventListener("resize", applyStatic);
      return () => window.removeEventListener("resize", applyStatic);
    }
  }, [active]);

  return (
    <section
      ref={sectionRef}
      id="integrations"
      className="relative isolate w-full min-h-screen overflow-hidden"
      style={{
        minHeight: `calc(100vh + ${FINAL_CTA_EXTRA_BOTTOM_VH}vh)`,
        marginTop: `-${FINAL_CTA_OVERLAP_TOP_VH}vh`,
        paddingTop: `${FINAL_CTA_OVERLAP_TOP_VH}vh`,
      }}
    >
        <div
        aria-hidden="true"
        className="absolute inset-0 transition-[clip-path] duration-700 ease-out will-change-[clip-path]"
        style={{
            background:
            "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)",
            clipPath: active
            ? "inset(0% 0% 0% 0% round 0px)"
            : "inset(18% 12% 18% 12% round 32px)",

            WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 12%, black 28%)",
            maskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 12%, black 28%)",
        }}
        />

      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-700",
          active ? "opacity-25" : "opacity-0"
        )}
        style={{
          clipPath: active
            ? "inset(0% 0% 0% 0% round 0px)"
            : "inset(18% 12% 18% 12% round 32px)",
        }}
      >
        <div className="absolute -top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
        <div className="absolute -bottom-10 right-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
      </div>

      <div
        className={cn(
          "relative z-10 mx-auto w-full max-w-6xl px-6 md:px-16 text-white",
          "flex flex-col items-center justify-center"
        )}
        style={{
          minHeight: `calc(100vh + ${FINAL_CTA_EXTRA_BOTTOM_VH}vh)`,
        }}
      >
        <div className="text-center max-w-3xl">
          <p className="text-eyebrow text-white/70 mb-4">
            Один ритм вместо десяти приложений
          </p>

          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            Ваш день живёт в&nbsp;Google, Jira и&nbsp;блокноте.{" "}
            <span className="text-white/85">
              Dayla собирает его в&nbsp;одну картину.
            </span>
          </h2>

          <p className="mt-5 md:mt-6 text-base md:text-lg text-white/85 max-w-2xl mx-auto">
            Мы соединяем то, чем вы уже пользуетесь: календари, рабочие задачи,
            заметки и идеи. Без переносов вручную. Без копирования.
            Без «а где у меня это записано?».
          </p>
        </div>

        <div className="mt-16 flex flex-col items-center text-center">
          <p className="text-lg md:text-xl font-medium">
            Личный ИИ-ассистент, который держит день в&nbsp;форме.
          </p>

          <div className="relative mt-10 flex justify-center">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 pointer-events-none"
              style={{ width: 0, height: 0 }}
            >
              {INTEGRATIONS.map((i, idx) => (
                <div
                  key={i.alt}
                  ref={(el) => {
                    iconRefs.current[idx] = el;
                  }}
                  className="absolute top-0 left-0 will-change-transform"
                  style={{
                    transform: "translate(-50%, -50%)",
                    opacity: 0,
                  }}
                >
                  <div
                    className="rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_20px_rgba(0,0,0,0.2)]"
                    style={{ width: ROW_ICON_SIZE, height: ROW_ICON_SIZE }}
                  >
                    <img
                      src={i.src}
                      alt=""
                      className="object-contain"
                      style={{ width: ROW_ICON_IMG_SIZE, height: ROW_ICON_IMG_SIZE }}
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onStart}
              className={cn(
                "group relative z-10 inline-flex items-center justify-center",
                "px-14 md:px-16 h-16 md:h-20",
                "text-lg md:text-xl font-semibold text-blue-700",
                "rounded-full",
                "transition-all duration-300 ease-out",
                "hover:-translate-y-0.5 active:translate-y-0",
                "bg-white/70 dark:bg-white/20",
                "backdrop-blur-xl",
                "ring-1 ring-white/70 dark:ring-white/30",
                "shadow-[0_8px_32px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(255,255,255,0.4)]",
                "dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(255,255,255,0.1)]",
                "hover:bg-white/85 dark:hover:bg-white/25",
                "hover:shadow-[0_12px_40px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(255,255,255,0.5)]"
              )}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-3 top-1 h-1/2 rounded-full bg-gradient-to-b from-white/80 to-transparent opacity-90 blur-[1px]"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/60 mix-blend-overlay"
              />
              <span className="relative inline-flex items-center">
                Начать бесплатно
                <ArrowRight
                  size={22}
                  className="ml-2 transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const AUTO_ADVANCE_MS = 3000;
const MANUAL_PAUSE_MS = 12000;

const SlideFlight: React.FC = () => (
  <div className="py-10 md:py-16">
    <div className="max-w-5xl mx-auto px-4 md:px-6">
      <div className="max-w-2xl mb-10 md:mb-14">
        <Badge className="text-eyebrow mb-3">Реальный сценарий</Badge>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Пересылайте события — Dayla всё спланирует
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Не нужно вручную копировать дату, время и место. Отправьте сообщение
          боту — Dayla разберётся сама.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="relative flex justify-center">
          <div className="relative w-full max-w-[400px]">
            <IPhoneScene />
          </div>
        </div>
        <div className="relative">
          <DaylaChatCard
            forwardedFrom="Переслано от Андрея Смирнова"
            userMessage="Авиабилет PD-205 · VKO → LED"
            daylaMessage={
              <>
                Распознала авиабилет:{' '}
                <strong className="font-semibold">дата — 05 апреля, 21:55</strong>,{' '}
                <strong className="font-semibold">место посадки — Внуково, терминал A</strong>.
                Куда добавить событие?
              </>
            }
          />
        </div>
      </div>

      <div className="mt-10 max-w-2xl mx-auto text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-blue-500" aria-hidden="true" />
          Dayla ничего не меняет без подтверждения — вы решаете, что делать с&nbsp;событием
        </p>
      </div>
    </div>
  </div>
);

const SlideFinance: React.FC = () => (
  <div className="py-10 md:py-16">
    <div className="max-w-6xl mx-auto px-4 md:px-6">
      <div className="max-w-2xl mb-10 md:mb-14">
        <Badge className="text-eyebrow mb-3">Из рабочего чата — в план</Badge>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Прислали файл? Dayla превратит его в задачу
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Добавьте Dayla в чат. Она распознает, что к чему и когда это надо сдать.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-16 items-center">
        <div className="relative">
          <DaylaChatCard
            daylaMessage={
              <>
                Подтянула Финансовый_отчёт_Q4.xlsx. Зафиксировала задачу{' '}
                <strong className="font-semibold">«Подать фин отчёт»</strong>{' '}
                на 30.09.2027 (конец квартала). Собираю ваши документы к концу
                отчётного периода.
              </>
            }
          />
        </div>
        <div className="relative flex justify-center">
          <div className="relative w-full max-w-[2000px]">
            <MonitorScene />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SlideGTD: React.FC = () => (
  <div className="py-10 md:py-16">
    <div className="max-w-6xl mx-auto px-4 md:px-6">
      <div className="max-w-2xl mb-10 md:mb-14">
        <Badge className="text-eyebrow mb-3">Систематизация по GTD</Badge>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Одна фраза — и всё разложено по полочкам
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Jira, TrueConf, Slack — Dayla соберёт задачи из всех источников,
          расставит дедлайны и впишет их в ваш календарь.
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] gap-12 lg:gap-16 items-center">
        <div className="relative flex justify-center">
          <GTDAggregation />
        </div>
        <div className="relative">
          <DaylaChatCard
            userMessage="Систематизируй задачи по Getting Things Done, которые мне прислали на этой неделе из Jira, TrueConf и Slack, в мой Гугл календарь"
            daylaMessage={GTD_RESPONSE}
          />
        </div>
      </div>

      <div className="mt-10 max-w-2xl mx-auto text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-blue-500" aria-hidden="true" />
          Вы утверждаете план одним нажатием — Dayla сама внесёт всё в календарь
        </p>
      </div>
    </div>
  </div>
);

const USE_CASE_SLIDES: { id: string; render: () => React.ReactNode }[] = [
  { id: "flight",  render: () => <SlideFlight />  },
  { id: "finance", render: () => <SlideFinance /> },
  { id: "gtd",     render: () => <SlideGTD />     },
];

const UserCaseCarousel: React.FC<{ paused?: boolean }> = ({ paused = false }) => {
  const [index, setIndex] = React.useState(0);
  const total = USE_CASE_SLIDES.length;
  const pausedUntil = React.useRef<number>(0);

  const goTo = React.useCallback(
    (next: number) => {
      setIndex(((next % total) + total) % total);
      pausedUntil.current = Date.now() + MANUAL_PAUSE_MS;
    },
    [total]
  );

  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  React.useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      setIndex((i) => (i + 1) % total);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(t);
  }, [total, paused]);

  return (
    <section
      id="usecases"
      className="relative py-12 md:py-20 overflow-hidden"
      aria-roledescription="carousel"
    >
      <div className="relative">
        {USE_CASE_SLIDES.map((slide, i) => (
          <div
            key={slide.id}
            aria-hidden={i !== index}
            className={cn(
              "transition-opacity duration-700",
              i === index
                ? "opacity-100 relative z-10"
                : "opacity-0 absolute inset-0 z-0 pointer-events-none"
            )}
          >
            {slide.render()}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={prev}
        aria-label="Предыдущий сценарий"
        className={cn(
          "absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20",
          "w-11 h-11 md:w-12 md:h-12 rounded-full",
          "flex items-center justify-center",
          "bg-white/40 dark:bg-white/[0.06]",
          "backdrop-blur-xl",
          "ring-1 ring-white/60 dark:ring-white/10",
          "shadow-[0_4px_16px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.75)]",
          "dark:shadow-[0_4px_16px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]",
          "text-gray-700 dark:text-gray-200",
          "hover:bg-white/60 dark:hover:bg-white/[0.1]",
          "hover:scale-105 active:scale-95",
          "transition-all duration-200",
        )}
      >
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <button
        type="button"
        onClick={next}
        aria-label="Следующий сценарий"
        className={cn(
          "absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20",
          "w-11 h-11 md:w-12 md:h-12 rounded-full",
          "flex items-center justify-center",
          "bg-white/40 dark:bg-white/[0.06]",
          "backdrop-blur-xl",
          "ring-1 ring-white/60 dark:ring-white/10",
          "shadow-[0_4px_16px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.75)]",
          "dark:shadow-[0_4px_16px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]",
          "text-gray-700 dark:text-gray-200",
          "hover:bg-white/60 dark:hover:bg-white/[0.1]",
          "hover:scale-105 active:scale-95",
          "transition-all duration-200",
        )}
      >
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <div className="mt-6 flex items-center justify-center gap-2">
        {USE_CASE_SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Перейти к сценарию ${i + 1}`}
            aria-current={i === index}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === index
                ? "w-8 bg-gray-800/70 dark:bg-white/70"
                : "w-2 bg-gray-400/50 dark:bg-white/30 hover:bg-gray-500/70"
            )}
          />
        ))}
      </div>
    </section>
  );
};
