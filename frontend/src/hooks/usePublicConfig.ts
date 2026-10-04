import { useEffect, useState } from "react";

export interface PublicConfig {
  telegramBotUsername: string | null;
  online: boolean;
}

let cached: Promise<PublicConfig> | null = null;

function load(): Promise<PublicConfig> {
  cached ??= fetch("/api/public/config", { credentials: "same-origin" })
    .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
    .then((data) => ({ telegramBotUsername: data.telegram_bot_username ?? null, online: true }))
    .catch(() => {
      cached = null;
      return { telegramBotUsername: null, online: false };
    });
  return cached;
}

export function usePublicConfig(): PublicConfig | null {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  useEffect(() => {
    let active = true;
    load().then((value) => active && setConfig(value));
    return () => {
      active = false;
    };
  }, []);
  return config;
}

export const telegramUrl = (config: PublicConfig | null) =>
  config?.telegramBotUsername ? `https://t.me/${config.telegramBotUsername}` : null;
