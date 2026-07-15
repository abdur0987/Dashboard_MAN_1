"use client";

import Image from "next/image";
import {
  Bot,
  Loader2,
  MessageSquare,
  Mic,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type AiAssistantProps = {
  variant?: "dashboard" | "slideshow";
};

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

type AssistantResponse = {
  answer: string;
  suggestions?: string[];
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

const openingMessage =
  "Assalamualaikum. Saya asisten data Dashboard MAN 1 Lampung Selatan. Saya membantu membaca ringkasan EMIS, SIMPEG, dan menyusun poin penting untuk pimpinan.";

const defaultSuggestions = [
  "Buat poin penting pimpinan",
  "Ringkas agenda terdekat",
  "Indikator tertinggi",
  "Berita terbaru",
];

export function AiAssistant({ variant = "dashboard" }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: "assistant", content: openingMessage },
  ]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState(defaultSuggestions);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const isSlideshow = variant === "slideshow";

  useEffect(() => {
    const speechWindow = window as SpeechWindow;
    setVoiceSupported("speechSynthesis" in window);
    setRecognitionSupported(
      Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition),
    );
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled || !voiceSupported || !window.speechSynthesis) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(stripSpeechText(text));
      utterance.lang = "id-ID";
      utterance.rate = 0.95;
      utterance.pitch = 0.98;
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled, voiceSupported],
  );

  const sendMessage = useCallback(
    async (text: string, shouldSpeak = false) => {
      const trimmedText = text.trim();
      if (!trimmedText || isLoading) return;

      const userMessage: ChatMessage = {
        id: Date.now(),
        role: "user",
        content: trimmedText,
      };

      setMessages((current) => [...current, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmedText,
            source: variant,
          }),
        });

        if (!response.ok) {
          throw new Error(`Assistant API failed with ${response.status}`);
        }

        const data = (await response.json()) as AssistantResponse;
        const answer = data.answer || "Maaf, saya belum mendapatkan jawaban dari dashboard.";

        setMessages((current) => [
          ...current,
          {
            id: Date.now() + 1,
            role: "assistant",
            content: answer,
          },
        ]);
        setSuggestions(data.suggestions?.length ? data.suggestions : defaultSuggestions);

        if (shouldSpeak) {
          speak(answer);
        }
      } catch {
        const errorMessage =
          "Mohon maaf, assistant belum bisa membaca data saat ini. Coba beberapa saat lagi atau cek koneksi API dashboard.";

        setMessages((current) => [
          ...current,
          {
            id: Date.now() + 1,
            role: "assistant",
            content: errorMessage,
          },
        ]);

        if (shouldSpeak) {
          speak(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, speak, variant],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const toggleVoiceInput = () => {
    const speechWindow = window as SpeechWindow;
    const SpeechRecognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setInput(transcript);
      void sendMessage(transcript, true);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const panelClassName = useMemo(
    () =>
      [
        "ai-assistant-panel",
        isSlideshow ? "ai-assistant-panel-slideshow" : "",
        isOpen ? "ai-assistant-panel-open" : "ai-assistant-panel-closed",
      ]
        .filter(Boolean)
        .join(" "),
    [isOpen, isSlideshow],
  );

  return (
    <>
      {!isOpen ? (
        <button
          type="button"
          className={`ai-assistant-trigger ${isSlideshow ? "ai-assistant-trigger-slideshow" : ""}`}
          onClick={() => setIsOpen(true)}
          aria-label="Buka AI Kemenag"
        >
          <Sparkles className="absolute right-3 top-3 h-4 w-4 text-amber-200" />
          <MessageSquare className="h-7 w-7" />
        </button>
      ) : null}

      <aside className={panelClassName} aria-label="AI Kemenag">
        <div className="relative overflow-hidden border-b border-white/18 bg-gradient-to-r from-emerald-950 via-emerald-800 to-green-600 p-5 text-white">
          <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-amber-300/25 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative grid h-12 w-12 place-items-center rounded-xl border border-white/50 bg-white p-1.5 shadow-xl">
                <Image
                  src="/brand/man1/logo.png"
                  alt="Logo MAN 1 Lampung Selatan"
                  fill
                  sizes="48px"
                  className="object-contain p-1"
                />
                <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight">AI Data MAN 1</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-emerald-50/85">
                  <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                  Asisten data pimpinan
                </p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-full p-2 text-white/80 transition hover:bg-white/12 hover:text-white"
              onClick={() => setIsOpen(false)}
              aria-label="Tutup AI Kemenag"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="ai-assistant-scroll">
          <div className="mx-auto mb-4 w-fit rounded-full border border-emerald-200/70 bg-emerald-50/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800 shadow-sm backdrop-blur-xl">
            Pusat informasi digital
          </div>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" ? (
                <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-emerald-100 bg-white p-1 shadow-sm">
                  <Image
                    src="/brand/logo-kanwil-kemenag-lampung-icon.png"
                    alt=""
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </div>
              ) : null}
              <div
                className={`ai-assistant-bubble ${
                  message.role === "user"
                    ? "ai-assistant-bubble-user"
                    : "ai-assistant-bubble-assistant"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isLoading ? (
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg border border-emerald-100 bg-white text-emerald-700 shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/75 bg-white/85 px-4 py-3 text-emerald-800 shadow-sm backdrop-blur-xl">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-semibold">Membaca data dashboard...</span>
              </div>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        <div className="border-t border-white/70 bg-white/80 p-4 shadow-[0_-16px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="shrink-0 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
                onClick={() => void sendMessage(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <button
              type="button"
              className={`ai-assistant-icon-button ${isListening ? "ai-assistant-icon-button-live" : ""}`}
              onClick={toggleVoiceInput}
              title={
                recognitionSupported
                  ? "Perintah suara"
                  : "Browser belum mendukung speech recognition"
              }
            >
              <Mic className="h-4 w-4" />
            </button>
            <div className="relative flex-1">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={isListening ? "Mendengarkan suara..." : "Tanyakan data dashboard..."}
                className="h-11 w-full rounded-full border border-slate-200 bg-slate-100/90 px-4 pr-11 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
              />
              <button
                type="button"
                className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-white hover:text-emerald-700"
                onClick={() => setVoiceEnabled((current) => !current)}
                title={voiceEnabled ? "Matikan jawaban suara" : "Aktifkan jawaban suara"}
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-700 to-green-500 text-white shadow-lg shadow-emerald-700/25 transition hover:scale-105 disabled:scale-100 disabled:opacity-45"
              aria-label="Kirim pertanyaan"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

function stripSpeechText(value: string) {
  return value
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[-*#_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
