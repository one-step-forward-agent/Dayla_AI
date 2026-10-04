import * as React from "react";
import { api } from "@/app/api/client";

export interface Sphere {
  id: string;
  name: string;
  color: string;
  priority: number;
}

export interface FirstTask {
  title: string;
  sphereId: string | null;
  reminder: "off" | "10m" | "30m" | "1h" | "1d";
}

export interface OnboardingData {
  purpose: string[];
  spheres: Sphere[];
  toneOfVoice: "neutral" | "supportive" | "motivating" | "strict" | null;
  goals: string[];
  googleConnected: boolean;
  telegramConnected: boolean;
  importedSources: string[];
  firstTask: FirstTask;
  tomorrowPlanned: boolean;
  integrations: string[];
  workDays: string[];
  workHoursFrom: string;
  workHoursTo: string;
  timezone: string;

  perDayWorkHours?: Partial<Record<DayShort, { from: string; to: string }>>;
}

const defaultData: OnboardingData = {
  purpose: [],
  spheres: [],
  toneOfVoice: null,
  goals: [],
  workDays: ["Пн", "Вт", "Ср", "Чт", "Пт"],
  workHoursFrom: "09:00",
  workHoursTo: "18:00",
  timezone:
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow"
      : "Europe/Moscow",
  googleConnected: false,
  telegramConnected: false,
  importedSources: [],
  firstTask: { title: "", sphereId: null, reminder: "off" },
  tomorrowPlanned: false,
  integrations: [],
};

interface OnboardingContextValue {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  patch: (partial: Partial<OnboardingData>) => void;
}

const OnboardingContext = React.createContext<OnboardingContextValue | null>(null);

const STORAGE_KEY = "dayla-onboarding";

function loadStored(): OnboardingData | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultData, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = React.useState<OnboardingData>(() => loadStored() ?? defaultData);

  React.useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
    }
  }, [data]);

  const update = React.useCallback(
    <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const patch = React.useCallback((partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <OnboardingContext.Provider value={{ data, update, patch }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextValue => {
  const ctx = React.useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
};

export type DayShort = "Пн" | "Вт" | "Ср" | "Чт" | "Пт" | "Сб" | "Вс";

const REMINDER_MINUTES: Record<FirstTask["reminder"], number | null> = {
  off: null,
  "10m": 10,
  "30m": 30,
  "1h": 60,
  "1d": 1440,
};

export async function applyOnboarding(): Promise<void> {
  const data = loadStored();
  if (!data) return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
  }
  try {
    if (data.timezone) await api.me.update({ timezone: data.timezone });
    const title = data.firstTask.title.trim();
    if (title) {
      const [hours, minutes] = (data.workHoursFrom || "09:00").split(":").map(Number);
      const start = new Date();
      start.setDate(start.getDate() + 1);
      start.setHours(hours || 9, minutes || 0, 0, 0);
      await api.events.create({
        title: title.slice(0, 300),
        start_at: start.toISOString(),
        end_at: new Date(start.getTime() + 60 * 60_000).toISOString(),
        timezone: data.timezone,
        reminder_minutes: REMINDER_MINUTES[data.firstTask.reminder] ?? null,
      });
    }
  } catch (error) {
    console.warn("Could not apply onboarding answers", error);
  }
}
