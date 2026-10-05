import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles, Check, ChevronDown, ChevronUp, GraduationCap, Link2,
  Loader2, ShieldCheck, UserPlus, X, ExternalLink, AlertCircle,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { api, ApiError } from "@/app/api/client";
import type { Integration as BackendIntegration, TelegramLink } from "@/app/api/types";
import { Alert, FormField, Input } from "@/components/ui";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";
import { glass } from "@/styles/glass";

const TOTAL = 10;
const STEP_PATH = "/onboarding/apple-google-logging";

const G = glass.strong;

const SpecularHighlight: React.FC<{ className?: string }> = ({ className }) => (
  <span aria-hidden="true" className={cn(G.specular, className)} />
);

type ConnectVia = "backend" | "telegram" | "soon";

type Integration = {
  id: string;
  name: string;
  hint: string;
  src: string;
  w: number;
  via: ConnectVia;
};

const INTEGRATIONS: Integration[] = [
  { id: "google", name: "Google Calendar", hint: "Учитываю занятые интервалы, когда предлагаю слоты", src: "/images/google-calendar.png", w: 40, via: "backend" },
  { id: "apple", name: "Apple Calendar", hint: "События из macOS и iPhone — в одном плане дня", src: `/images/${encodeURIComponent("Календарь_для_macOS.png")}`, w: 40, via: "backend" },
  { id: "jira", name: "Jira", hint: "Задачи из спринта попадают в календарь как обычные дела", src: "/images/Jira_Software_Logo.svg", w: 36, via: "backend" },
  { id: "notion", name: "Notion", hint: "Страницы и чек-листы — в едином ритме с задачами", src: "/images/Notion.png", w: 40, via: "backend" },
  { id: "obsidian", name: "Obsidian", hint: "Идеи и заметки, которые стоит превратить в действия", src: "/images/Obsidian.png", w: 40, via: "backend" },
  { id: "telegram", name: "Telegram", hint: "Пишите планы боту и получайте напоминания", src: "/images/TelegramWB.png", w: 40, via: "telegram" },
  { id: "slack", name: "Slack", hint: "Рабочие обсуждения превращаю в задачи и напоминания", src: "/images/slack.png", w: 40, via: "soon" },
  { id: "trueconf", name: "TrueConf", hint: "Созвоны и встречи попадают в календарь автоматически", src: "/images/tc_logo_square.png", w: 40, via: "soon" },
];

const errorText = (error: unknown) =>
  error instanceof ApiError || error instanceof Error ? error.message : "Не удалось подключить";

const SectionDivider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-3">
    <div className="h-px flex-1 bg-white/60 dark:bg-white/10" />
    <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium">
      {children}
    </span>
    <div className="h-px flex-1 bg-white/60 dark:bg-white/10" />
  </div>
);

export const AppleAndGoogleLogging: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { patch } = useOnboarding();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [backend, setBackend] = React.useState<BackendIntegration[] | null>(null);
  const [telegramLinked, setTelegramLinked] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<string | null>(null);
  const [cardError, setCardError] = React.useState<{ id: string; message: string } | null>(null);
  const [editing, setEditing] = React.useState<BackendIntegration | null>(null);
  const [telegramLink, setTelegramLink] = React.useState<TelegramLink | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [gateHighlight, setGateHighlight] = React.useState(false);
  const [showGuide, setShowGuide] = React.useState(false);
  const gateRef = React.useRef<HTMLDivElement>(null);

  const reload = React.useCallback(async () => {
    try {
      const [list, telegram] = await Promise.all([api.integrations.list(), api.telegram.status()]);
      setBackend(list);
      setTelegramLinked(telegram.linked);
      setLoadError(null);
    } catch (error) {
      setLoadError(errorText(error));
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) void reload();
  }, [isAuthenticated, reload]);

  // Back from Google OAuth: /onboarding/apple-google-logging?connected=google
  React.useEffect(() => {
    const connected = searchParams.get("connected");
    if (!connected) return;
    const name = INTEGRATIONS.find((i) => i.id === connected)?.name ?? connected;
    setNotice(`${name} подключён`);
    navigate(STEP_PATH, { replace: true });
  }, [searchParams, navigate]);

  // While the Telegram deep link is open, wait for the bot to confirm the link.
  React.useEffect(() => {
    if (!telegramLink || telegramLinked) return;
    const timer = window.setInterval(async () => {
      try {
        const status = await api.telegram.status();
        if (status.linked) {
          setTelegramLinked(true);
          setTelegramLink(null);
          setNotice("Telegram подключён");
        }
      } catch {
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [telegramLink, telegramLinked]);

  const isConnected = (id: string) =>
    id === "telegram"
      ? telegramLinked
      : backend?.find((item) => item.slug === id)?.connection?.status === "connected";

  const connectedIds = INTEGRATIONS.filter((i) => isConnected(i.id)).map((i) => i.id);

  const askForAccount = () => {
    gateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setGateHighlight(true);
    window.setTimeout(() => setGateHighlight(false), 1200);
  };

  const connect = async (integration: Integration) => {
    if (!isAuthenticated) return askForAccount();
    setCardError(null);

    if (integration.via === "telegram") {
      setPending(integration.id);
      try {
        const link = await api.telegram.link();
        setTelegramLink(link);
        if (link.deep_link) window.open(link.deep_link, "_blank", "noopener,noreferrer");
      } catch (error) {
        setCardError({ id: integration.id, message: errorText(error) });
      } finally {
        setPending(null);
      }
      return;
    }

    const item = backend?.find((b) => b.slug === integration.id);
    if (!item) return;
    if (item.auth_type === "credentials") {
      setEditing(item);
      return;
    }
    setPending(integration.id);
    try {
      const result = await api.integrations.connect(item.slug, {}, STEP_PATH);
      if ("authorization_url" in result) window.location.assign(result.authorization_url);
      else await reload();
    } catch (error) {
      setCardError({ id: integration.id, message: errorText(error) });
      setPending(null);
    }
  };

  const finish = () => {
    patch({
      integrations: connectedIds,
      googleConnected: connectedIds.includes("google"),
      telegramConnected: connectedIds.includes("telegram"),
    });
    navigate("/onboarding/sources-import");
  };

  const accountQuery = `?next=${encodeURIComponent(STEP_PATH)}`;

  return (
    <>
      <OnboardingLayout
        step={6}
        totalSteps={TOTAL}
        title="Что подключим?"
        subtitle="Подключите сервисы прямо сейчас — Dayla сразу увидит ваши встречи и задачи."
        onBack={() => navigate("/onboarding/existing-plans")}
        onNext={finish}
        onSkip={connectedIds.length === 0 ? finish : undefined}
        nextLabel={connectedIds.length > 0 ? `Далее · подключено ${connectedIds.length}` : "Далее"}
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
              <Link2 size={11} aria-hidden="true" />
              Интеграции
            </span>
          </div>

          {notice && (
            <Alert variant="success" className="rounded-2xl">
              {notice}
            </Alert>
          )}

          {!authLoading && !isAuthenticated && (
            <div
              ref={gateRef}
              className={cn(
                "relative overflow-hidden rounded-2xl p-4 md:p-5 transition-all duration-500",
                G.surface,
                gateHighlight && "ring-2 ring-blue-500/70 scale-[1.01]"
              )}
            >
              <SpecularHighlight className="opacity-80" />
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                <div
                  aria-hidden="true"
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/15 text-blue-600 dark:text-blue-300 ring-1 ring-blue-400/40"
                >
                  <UserPlus size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Сервисы подключаются к вашему аккаунту
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Создайте аккаунт — займёт полминуты. Ответы онбординга сохранятся, и вы вернётесь на этот шаг.
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    to={`/register${accountQuery}`}
                    className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Создать аккаунт
                  </Link>
                  <Link
                    to={`/login${accountQuery}`}
                    className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-500/10 transition-colors"
                  >
                    Войти
                  </Link>
                </div>
              </div>
            </div>
          )}

          {loadError && (
            <Alert variant="error" className="rounded-2xl">
              Не удалось загрузить интеграции: {loadError}{" "}
              <button type="button" className="underline" onClick={() => void reload()}>
                Повторить
              </button>
            </Alert>
          )}

          <div className="grid sm:grid-cols-2 gap-2.5">
            {INTEGRATIONS.map((i) => (
              <IntegrationCard
                key={i.id}
                integration={i}
                connected={isConnected(i.id)}
                busy={pending === i.id}
                ready={!isAuthenticated || backend !== null}
                error={cardError?.id === i.id ? cardError.message : null}
                onConnect={() => void connect(i)}
              />
            ))}
          </div>

          {telegramLink && !telegramLinked && (
            <div className={cn("relative overflow-hidden rounded-2xl p-4", G.surface)}>
              <div className="relative flex items-start gap-3 text-sm">
                <Loader2 size={16} className="shrink-0 mt-0.5 animate-spin text-blue-500" aria-hidden="true" />
                <div className="min-w-0 flex-1 text-gray-600 dark:text-gray-300">
                  {telegramLink.deep_link ? (
                    <>
                      Нажмите «Start» в открывшемся чате с ботом — подключение произойдёт автоматически.{" "}
                      <a href={telegramLink.deep_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                        Открыть бота <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    </>
                  ) : (
                    <>
                      Отправьте боту Dayla команду{" "}
                      <code className="rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5">/start {telegramLink.code}</code>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <HseScheduleGuide open={showGuide} onToggle={() => setShowGuide((v) => !v)} />

          {connectedIds.length === 0 && (
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={14} className="text-blue-500" aria-hidden="true" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Можно пропустить — подключите интеграции позже в разделе «Интеграции»
              </p>
            </div>
          )}

          <SectionDivider>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck size={11} aria-hidden="true" />
              Доступы хранятся в зашифрованном виде
            </span>
          </SectionDivider>
        </div>
      </OnboardingLayout>

      {editing && (
        <CredentialsDialog
          item={editing}
          onClose={() => setEditing(null)}
          onConnected={async () => {
            setNotice(`${editing.title} подключён`);
            setEditing(null);
            await reload();
          }}
        />
      )}
    </>
  );
};

const IntegrationCard: React.FC<{
  integration: Integration;
  connected: boolean;
  busy: boolean;
  ready: boolean;
  error: string | null;
  onConnect: () => void;
}> = ({ integration: i, connected, busy, ready, error, onConnect }) => {
  const soon = i.via === "soon";

  return (
    <div
      className={cn(
        "group relative isolate overflow-hidden text-left",
        "rounded-2xl p-4",
        G.surface,
        connected && [
          "ring-2 ring-emerald-500/60 dark:ring-emerald-400/60",
          "shadow-[0_12px_40px_rgba(16,185,129,0.18),inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(255,255,255,0.4)] dark:shadow-[0_12px_40px_rgba(16,185,129,0.18),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(255,255,255,0.06)]",
        ],
        "transition-all duration-300",
        !soon && "hover:-translate-y-0.5 hover:bg-white/70 dark:hover:bg-gray-900/55",
        soon && "opacity-60"
      )}
    >
      <SpecularHighlight className="opacity-90" />

      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            "relative shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
            "overflow-hidden backdrop-blur-md ring-1",
            "bg-white/60 dark:bg-white/[0.06] ring-white/70 dark:ring-white/10",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.06)]",
            "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.35)]"
          )}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/70 to-transparent dark:from-white/[0.06] blur-[0.5px]"
          />
          <img
            src={i.src}
            alt=""
            style={{ width: i.w, height: "auto" }}
            className="relative max-h-7 object-contain select-none pointer-events-none"
            loading="lazy"
            draggable={false}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 dark:text-white leading-snug">{i.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{i.hint}</p>

          <div className="mt-3">
            {soon ? (
              <span className="text-[11px] uppercase tracking-widest font-medium text-gray-400 dark:text-gray-500">
                Скоро
              </span>
            ) : connected ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check size={10} strokeWidth={3} aria-hidden="true" />
                </span>
                Подключено
              </span>
            ) : (
              <button
                type="button"
                onClick={onConnect}
                disabled={busy || !ready}
                aria-label={`Подключить ${i.name}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium",
                  "bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors",
                  "disabled:opacity-60 disabled:pointer-events-none"
                )}
              >
                {(busy || !ready) && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
                Подключить
              </button>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-2 flex items-start gap-1 text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={12} className="shrink-0 mt-0.5" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const CredentialsDialog: React.FC<{
  item: BackendIntegration;
  onClose: () => void;
  onConnected: () => void | Promise<void>;
}> = ({ item, onClose, onConnected }) => {
  const [values, setValues] = React.useState<Record<string, unknown>>(() =>
    Object.fromEntries(
      item.fields.map((field) => [field.name, field.default ?? (field.type === "checkbox" ? false : "")])
    )
  );
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.integrations.connect(item.slug, values);
      await onConnected();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 dark:bg-gray-950/70 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-title"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        className={cn("relative w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl p-5 md:p-6 space-y-4", G.surface)}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="connect-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Подключить {item.title}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="shrink-0 rounded-full p-1 text-gray-500 hover:bg-gray-500/10">
            <X size={18} />
          </button>
        </div>

        {item.fields.map((field) =>
          field.type === "checkbox" ? (
            <label key={field.name} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="mt-1"
                checked={Boolean(values[field.name])}
                onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.checked }))}
              />
              <span>
                {field.label}
                {field.help && <span className="block text-xs text-gray-500 dark:text-gray-400">{field.help}</span>}
              </span>
            </label>
          ) : (
            <FormField
              key={field.name}
              id={`connect-${field.name}`}
              label={field.label}
              required={field.required}
              hint={field.help || undefined}
            >
              {(props) => (
                <Input
                  {...props}
                  type={field.type === "password" ? "password" : field.type === "url" ? "url" : "text"}
                  value={String(values[field.name] ?? "")}
                  placeholder={field.placeholder}
                  required={field.required}
                  autoComplete={field.secret ? "new-password" : "off"}
                  onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                />
              )}
            </FormField>
          )
        )}

        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-500/10">
            Отмена
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            Подключить
          </button>
        </div>
      </form>
    </div>
  );
};

const HseScheduleGuide: React.FC<{ open: boolean; onToggle: () => void }> = ({ open, onToggle }) => (
  <div className={cn("relative overflow-hidden rounded-2xl", G.surface)}>
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-6 top-1 h-14 rounded-full bg-gradient-to-b from-white/60 to-transparent dark:from-white/[0.06] opacity-60 blur-md"
    />

    <div className="relative p-4 md:p-5">
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full flex items-start gap-3 text-left">
        <div
          aria-hidden="true"
          className={cn(
            "relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden",
            "bg-emerald-500/15 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
            "ring-1 ring-emerald-400/40 dark:ring-emerald-400/30",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(15,23,42,0.05)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(15,23,42,0.05)]"
          )}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/60 to-transparent dark:from-white/[0.06] blur-[0.5px]"
          />
          <GraduationCap size={16} className="relative" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 dark:text-white">Студент Вышки?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Покажем, как импортировать расписание пар в Google Calendar.
          </p>
        </div>

        <span aria-hidden="true" className="shrink-0 mt-1 text-gray-400 dark:text-gray-500">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {open && (
        <ol className="mt-4 ml-12 space-y-2 text-sm text-gray-600 dark:text-gray-400 animate-in fade-in slide-in-from-top-1 duration-300">
          {[
            "Откройте личный кабинет ВШЭ → раздел «Расписание».",
            "Выгрузите расписание в формате ICS.",
            "В Google Calendar выберите «Импорт» и загрузите файл.",
            "Вернитесь сюда и подключите Google Calendar.",
          ].map((step, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                  "text-[11px] font-semibold",
                  "bg-emerald-500/15 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                  "ring-1 ring-emerald-400/40 dark:ring-emerald-400/30"
                )}
              >
                {idx + 1}
              </span>
              <span className="leading-snug">{step}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  </div>
);
