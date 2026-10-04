import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Send,
  Mic,
  Check,
  Loader2,
  Info,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/form-field";
import { cn } from "@/utils/cn";

const TOTAL = 10;

type Message = {
  id: string;
  from: "ai" | "user";
  text: string;
  chips?: string[];
  pending?: boolean;
};

const uid = () => Math.random().toString(36).slice(2, 9);

const AI_GREETING_CHIPS = [
  "Добавь встречу с Машей в кафе на вторник",
  "Найди свободное окно завтра",
  "Перенеси мою задачу на утро",
];

export const LetsPlanTomorrow: React.FC = () => {
  const navigate = useNavigate();
  const { data, patch } = useOnboarding();

  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: uid(),
      from: "ai",
      text: "Давай спланируем завтрашний день?",
      chips: AI_GREETING_CHIPS,
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isThinking, setIsThinking] = React.useState(false);
  const [telegramConnected, setTelegramConnected] = React.useState(
    data.telegramConnected
  );

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  const send = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || isThinking) return;

    const userMsg: Message = { id: uid(), from: "user", text: value };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    await new Promise((r) => setTimeout(r, 700));

    const aiMsg: Message = {
      id: uid(),
      from: "ai",
      text: `Понял: «${value}». Готово — добавлю, когда подтвердишь.`,
      chips: ["Подтвердить", "Изменить", "Отменить"],
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsThinking(false);
    patch({ tomorrowPlanned: true });
  };

  const handleNext = () => {
    patch({ telegramConnected });
    navigate("/onboarding/success-and-learning");
  };

  return (
    <OnboardingLayout
      step={9}
      totalSteps={TOTAL}
      title="Попробуем вместе"
      subtitle="Это демо-чат — просто посмотрите, как со мной можно разговаривать. Позже здесь будет настоящий ассистент."
      onBack={() => navigate("/onboarding/fast-tasks-enter")}
      onNext={handleNext}
    >
      <div className="relative space-y-4">
        <div
          aria-hidden="true"
          className="absolute -inset-8 -z-10 pointer-events-none"
        >
          <div className="absolute -top-10 left-1/4 w-72 h-72 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-violet-400/15 blur-3xl" />
        </div>

        <Card className="relative overflow-hidden p-0">
          <div className="relative flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
            <div
              aria-hidden="true"
              className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-sm"
            >
              <Sparkles size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-gray-900 dark:text-white">
                Dayla
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Онлайн
              </p>
            </div>
            <Badge variant="default" className="text-[10px]">
              Демо
            </Badge>
          </div>

          <div
            ref={scrollRef}
            className="relative h-80 overflow-y-auto px-4 py-4 flex flex-col gap-3 scroll-smooth"
          >
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                onChipClick={(chip) => send(chip)}
              />
            ))}

            {isThinking && (
              <div className="self-start flex items-end gap-2 animate-in fade-in duration-200">
                <AiAvatar />
                <div className="rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center gap-1">
                  <Dot delay={0} />
                  <Dot delay={150} />
                  <Dot delay={300} />
                </div>
              </div>
            )}
          </div>

          <div className="relative px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
            <div className="flex gap-2 items-center">
              <button
                type="button"
                aria-label="Голосовой ввод"
                className={cn(
                  "shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                  "text-gray-500 dark:text-gray-400",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "transition-colors"
                )}
              >
                <Mic size={16} />
              </button>

              <div className="relative flex-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Сообщение Dayla…"
                  aria-label="Сообщение ассистенту"
                  disabled={isThinking}
                />
              </div>

              <Button
                type="button"
                onClick={() => send()}
                disabled={!input.trim() || isThinking}
                size="icon"
                className="shrink-0 rounded-full"
                aria-label="Отправить"
              >
                {isThinking ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-sky-400/20 to-blue-500/20 blur-3xl"
          />

          <CardContent className="relative p-4 md:p-5">
            <div className="flex items-start gap-3">
              <div
                aria-hidden="true"
                className="shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-md"
              >
                <Send size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Telegram-бот
                  </p>
                  {telegramConnected && (
                    <Badge variant="success" className="text-[10px]">
                      <Check size={10} className="mr-0.5" aria-hidden="true" />
                      Подключён
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Отправьте задачу в Telegram — и я перенесу её в календарь.
                  Пойму текст, голос и пересланные сообщения.
                </p>

                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setTelegramConnected(true)}
                    disabled={telegramConnected}
                    className={cn(
                      telegramConnected &&
                        "bg-emerald-500 hover:bg-emerald-600"
                    )}
                  >
                    {telegramConnected ? (
                      <>
                        <Check size={14} className="mr-1.5" aria-hidden="true" />
                        Подключён
                      </>
                    ) : (
                      "Подключить бота"
                    )}
                  </Button>

                  {!telegramConnected && (
                    <p className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                      <Info size={11} aria-hidden="true" />
                      Можно сделать позже в настройках
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OnboardingLayout>
  );
};

const AiAvatar: React.FC = () => (
  <div
    aria-hidden="true"
    className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-sm"
  >
    <Sparkles size={13} />
  </div>
);

interface MessageBubbleProps {
  message: Message;
  onChipClick: (chip: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onChipClick,
}) => {
  const isAi = message.from === "ai";

  return (
    <div
      className={cn(
        "flex items-end gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300",
        isAi ? "self-start max-w-[85%]" : "self-end max-w-[85%]"
      )}
    >
      {isAi && <AiAvatar />}

      <div className="min-w-0">
        {isAi && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 ml-1">
            Dayla
          </p>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
            isAi
              ? "rounded-bl-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              : "rounded-br-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white"
          )}
        >
          <div className="leading-snug">{message.text}</div>
        </div>

        {message.chips && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onChipClick(chip)}
                className={cn(
                  "text-xs px-2.5 py-1.5 rounded-full",
                  "border transition-all",
                  "hover:-translate-y-0.5 hover:shadow-sm",
                  "bg-white dark:bg-gray-900",
                  "border-gray-200 dark:border-gray-700",
                  "text-gray-700 dark:text-gray-300",
                  "hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400"
                )}
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Dot: React.FC<{ delay: number }> = ({ delay }) => (
  <span
    aria-hidden="true"
    className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"
    style={{ animationDelay: `${delay}ms` }}
  />
);
