import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { api } from "../api/client";
import type { CalendarEvent, ProposedEvent } from "../api/types";
import { EventList } from "../components/events";
import { Icon } from "../components/icons";
import { Button, PageHeader, useErrorToast } from "../components/ui";
import { errorText, formatDate, formatTime } from "../lib/format";
import { navigate, useLocation, useTitle } from "../router";

type Mode = "plan" | "search";

type Message =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; text: string | null; proposed?: ProposedEvent[]; created?: CalendarEvent[]; found?: CalendarEvent[] }
  | { id: number; role: "error"; text: string };

const EXAMPLES: Record<Mode, string[]> = {
  plan: ["Созвон с командой завтра в 11:00 на час", "Каждую пятницу в 18:00 спортзал, напомни за 30 минут", "Сдать отчёт 15 числа"],
  search: ["Что у меня на этой неделе?", "Когда встреча с Олей?", "Все созвоны в октябре"],
};

let messageId = 0;

export function AssistantPage() {
  useTitle("Ассистент");
  const { query } = useLocation();
  const [mode, setMode] = useState<Mode>("plan");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const push = (message: Message) => setMessages((items) => [...items, message]);

  const send = async (input: string) => {
    const value = input.trim();
    if (!value || busy) return;
    setText("");
    push({ id: ++messageId, role: "user", text: value });
    setBusy(true);
    try {
      if (mode === "search") {
        const result = await api.assistant.search(value);
        push({ id: ++messageId, role: "assistant", text: result.events.length ? `Нашёл событий: ${result.events.length}` : "Ничего не нашлось.", found: result.events });
      } else {
        const result = await api.assistant.message(value);
        push({
          id: ++messageId,
          role: "assistant",
          text: result.answer ?? (result.proposed_events.length ? "Вот что я понял — проверьте и добавьте:" : "Не нашёл событий в запросе."),
          proposed: result.proposed_events,
        });
      }
    } catch (error) {
      push({ id: ++messageId, role: "error", text: errorText(error) });
    } finally {
      setBusy(false);
    }
  };

  const initial = query.get("q");
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!initial || handled.current === initial) return;
    handled.current = initial;
    navigate("/assistant", { replace: true });
    send(initial);
  }, [initial]);

  const onConfirmed = (messageIndex: number, created: CalendarEvent[]) =>
    setMessages((items) => items.map((item) => (item.id === messageIndex && item.role === "assistant" ? { ...item, proposed: [], created } : item)));

  return (
    <div className="page assistant-page">
      <PageHeader
        title="Ассистент"
        subtitle="Опишите планы своими словами, голосом или документом — GigaChat превратит их в события."
        actions={
          <div className="segmented" role="tablist" aria-label="Режим">
            <button role="tab" aria-selected={mode === "plan"} className={mode === "plan" ? "active" : ""} onClick={() => setMode("plan")}>
              Запланировать
            </button>
            <button role="tab" aria-selected={mode === "search"} className={mode === "search" ? "active" : ""} onClick={() => setMode("search")}>
              Найти
            </button>
          </div>
        }
      />

      <div className="chat" aria-live="polite">
        {messages.length === 0 && (
          <div className="chat-empty">
            <Icon name="assistant" size={32} />
            <p>{mode === "plan" ? "Что запланируем?" : "Что найти в календаре?"}</p>
            <div className="examples">
              {EXAMPLES[mode].map((example) => (
                <button key={example} className="example" onClick={() => send(example)}>
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onConfirmed={onConfirmed} />
        ))}
        {busy && (
          <div className="bubble bubble-assistant typing" aria-label="Ассистент думает">
            <i />
            <i />
            <i />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <Composer value={text} onChange={setText} onSend={() => send(text)} busy={busy} mode={mode} />
    </div>
  );
}

function ChatMessage({ message, onConfirmed }: { message: Message; onConfirmed: (id: number, created: CalendarEvent[]) => void }) {
  if (message.role === "user") return <div className="bubble bubble-user">{message.text}</div>;
  if (message.role === "error") return <div className="bubble bubble-error" role="alert">{message.text}</div>;
  return (
    <div className="bubble bubble-assistant">
      {message.text && <p>{message.text}</p>}
      {message.proposed && message.proposed.length > 0 && <Proposal events={message.proposed} onConfirmed={(created) => onConfirmed(message.id, created)} />}
      {message.created && message.created.length > 0 && (
        <>
          <p className="ok">
            <Icon name="check" size={16} /> Добавлено в календарь
          </p>
          <EventList events={message.created} showDate />
        </>
      )}
      {message.found && message.found.length > 0 && <EventList events={message.found} showDate />}
    </div>
  );
}

function Proposal({ events, onConfirmed }: { events: ProposedEvent[]; onConfirmed: (created: CalendarEvent[]) => void }) {
  const [selected, setSelected] = useState(() => events.map(() => true));
  const [busy, setBusy] = useState(false);
  const reportError = useErrorToast();
  const chosen = events.filter((_, index) => selected[index]);

  const confirm = async () => {
    setBusy(true);
    try {
      const result = await api.assistant.confirm(chosen);
      onConfirmed(result.created_events);
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="proposal">
      {events.map((event, index) => {
        const start = new Date(event.starts_at);
        const valid = !Number.isNaN(start.getTime());
        return (
          <label key={index} className="proposal-item">
            <input type="checkbox" checked={selected[index]} onChange={(e) => setSelected((items) => items.map((value, i) => (i === index ? e.target.checked : value)))} />
            <span>
              <strong>{event.title}</strong>
              <span className="muted">
                {valid ? `${formatDate(start, { weekday: "short", day: "numeric", month: "long" })}, ${formatTime(start)}` : event.starts_at}
                {event.location ? ` · ${event.location}` : ""}
              </span>
              {event.description && <span className="muted small">{event.description}</span>}
            </span>
          </label>
        );
      })}
      <Button variant="primary" size="sm" icon="plus" busy={busy} disabled={!chosen.length} onClick={confirm}>
        Добавить {chosen.length > 1 ? `(${chosen.length})` : ""}
      </Button>
    </div>
  );
}

function Composer({ value, onChange, onSend, busy, mode }: { value: string; onChange: (value: string) => void; onSend: () => void; busy: boolean; mode: Mode }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [working, setWorking] = useState<"voice" | "file" | null>(null);
  const reportError = useErrorToast();

  const append = (extra: string) => onChange(value ? `${value}\n${extra}` : extra);

  const toggleRecording = async () => {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const media = new MediaRecorder(stream);
      media.ondataavailable = (event) => chunks.push(event.data);
      media.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setWorking("voice");
        try {
          const result = await api.assistant.transcribe(new Blob(chunks, { type: media.mimeType }));
          append(result.text);
        } catch (error) {
          reportError(errorText(error));
        } finally {
          setWorking(null);
        }
      };
      recorder.current = media;
      media.start();
      setRecording(true);
    } catch {
      reportError("Нет доступа к микрофону");
    }
  };

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    setWorking("file");
    try {
      const result = await api.assistant.readFile(file);
      append(result.text);
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setWorking(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSend();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <form className="composer" onSubmit={submit}>
      <input ref={fileInput} type="file" accept=".pdf,.docx" hidden onChange={(e) => readFile(e.target.files?.[0])} />
      <Button variant="ghost" icon="clip" aria-label="Прочитать PDF или DOCX" title="PDF или DOCX" busy={working === "file"} onClick={() => fileInput.current?.click()} />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder={recording ? "Говорите…" : mode === "plan" ? "Что запланировать?" : "Что найти?"}
        aria-label="Сообщение"
        maxLength={50000}
      />
      {"MediaRecorder" in window && (
        <Button
          variant={recording ? "danger" : "ghost"}
          icon={recording ? "stop" : "mic"}
          aria-label={recording ? "Остановить запись" : "Записать голосом"}
          busy={working === "voice"}
          onClick={toggleRecording}
        />
      )}
      <Button type="submit" variant="primary" icon="send" aria-label="Отправить" disabled={!value.trim() || busy} />
    </form>
  );
}
