import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Plus, AlignLeft, Send, Mic, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAIChat } from "@/hooks/use-chat";

/* ─── Earning options shown in the center ─── */
const OPTIONS = [
  {
    emoji: "🛍️",
    label: "Créer ma boutique",
    sub: "Vendre mes produits en vidéo",
    msg: "Je veux créer ma boutique et vendre mes produits en vidéo. Guide-moi pas à pas !",
  },
  {
    emoji: "👥",
    label: "Parrainer des amis",
    sub: "Gagner des bonus de parrainage",
    msg: "Explique-moi comment fonctionne le système de parrainage et combien je peux gagner.",
  },
  {
    emoji: "🌐",
    label: "Mon domaine perso",
    sub: "6 500 FCFA — boutique pro",
    msg: "Je veux acheter un domaine personnalisé pour ma boutique à 6 500 FCFA. Comment ça marche ?",
  },
  {
    emoji: "📈",
    label: "Revenus AdSense",
    sub: "500 vues = commissions auto",
    msg: "Comment je gagne de l'argent avec les revenus AdSense à partir de 500 vues ?",
  },
];

/* ─── Mode tabs ─── */
type Mode = "reflexion" | "rechercher";

export default function CoachPage() {
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("rechercher");
  const [autoStarted, setAutoStarted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, isStreaming, streamingContent, sendMessage, isReady, reset } =
    useAIChat();

  /* Auto-mode: Groq greets automatically when page loads */
  useEffect(() => {
    if (
      mode === "rechercher" &&
      isReady &&
      !autoStarted &&
      messages.length === 0 &&
      !isStreaming
    ) {
      setAutoStarted(true);
      setTimeout(() => {
        sendMessage("__BIENVENUE__");
      }, 600);
    }
  }, [mode, isReady, autoStarted, messages.length, isStreaming]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    sendMessage(text);
    setInput("");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOption = (msg: string) => sendMessage(msg);

  const handleNew = () => {
    reset?.();
    setAutoStarted(false);
    setInput("");
  };

  const handleModeSwitch = (m: Mode) => {
    setMode(m);
    if (m === "rechercher" && messages.length === 0) {
      setAutoStarted(false);
    }
  };

  const showEmpty = messages.length === 0 && !isStreaming && !streamingContent;
  const showOptions = showEmpty && mode === "reflexion";

  /* Filter out internal trigger message from display */
  const visibleMessages = messages.filter((m) => m.content !== "__BIENVENUE__");

  return (
    <div className="flex flex-col h-screen bg-[#0c0c10] text-white overflow-hidden">

      {/* ── HEADER (3 items) ── */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Left: sidebar / back */}
        <button
          onClick={() => setLocation("/dashboard")}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/8 transition-colors"
        >
          <AlignLeft className="w-5 h-5 text-white/60" />
        </button>

        {/* Center: title */}
        <span className="text-[15px] font-medium text-white/90 tracking-tight">
          Nouvelle discussion
        </span>

        {/* Right: new chat */}
        <button
          onClick={handleNew}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/8 transition-colors border border-white/10"
        >
          <Plus className="w-5 h-5 text-white/60" />
        </button>
      </header>

      {/* ── MESSAGES / EMPTY STATE ── */}
      <div className="flex-1 overflow-y-auto">
        {showEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <span className="text-3xl">🐋</span>
              </div>
              <p className="text-xl font-semibold text-white/90 text-center">
                Comment puis-je vous aider ?
              </p>
              <p className="text-sm text-white/40 text-center">
                {mode === "reflexion"
                  ? "Choisissez ce qui vous intéresse ou posez une question"
                  : "Le coach va vous guider automatiquement..."}
              </p>
            </motion.div>

            {/* Option cards — shown in Réflexion mode */}
            {showOptions && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-sm grid grid-cols-2 gap-2.5"
              >
                {OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => handleOption(opt.msg)}
                    className="rounded-2xl p-3.5 text-left flex flex-col gap-1 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <span className="text-xs font-semibold text-white/90 leading-tight">{opt.label}</span>
                    <span className="text-[10px] text-white/45 leading-tight">{opt.sub}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        ) : (
          /* Chat messages */
          <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-4">
            <AnimatePresence initial={false}>
              {visibleMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center mr-2.5 shrink-0 mt-0.5">
                      <span className="text-sm">🐋</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-br-sm text-white bg-gradient-to-br from-violet-600 to-purple-700"
                        : "rounded-bl-sm text-white/90"
                    }`}
                    style={msg.role === "assistant" ? { background: "rgba(255,255,255,0.07)" } : {}}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {/* Streaming */}
              {(isStreaming || streamingContent) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center mr-2.5 shrink-0 mt-0.5">
                    <span className="text-sm">🐋</span>
                  </div>
                  <div
                    className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-white/90 leading-relaxed"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  >
                    {streamingContent ? (
                      <>
                        {streamingContent}
                        <span className="inline-block w-0.5 h-4 ml-0.5 bg-violet-400 animate-pulse align-middle rounded-full" />
                      </>
                    ) : (
                      <span className="flex gap-1 items-center h-4">
                        {[0, 150, 300].map((d) => (
                          <span
                            key={d}
                            className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                            style={{ animationDelay: `${d}ms` }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── BOTTOM INPUT ── */}
      <div className="shrink-0 px-4 pb-6 pt-2">
        <div className="max-w-2xl mx-auto">
          {/* Input card */}
          <div
            className="rounded-2xl px-4 py-3 flex flex-col gap-2"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Message ou maintenir pour parler..."
              disabled={isStreaming}
              className="w-full bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none resize-none leading-relaxed"
              style={{ maxHeight: "120px" }}
            />

            {/* Bottom row of input */}
            <div className="flex items-center justify-between">
              {/* Left: mode tabs */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleModeSwitch("reflexion")}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                    mode === "reflexion"
                      ? "border-violet-500/50 text-violet-300 bg-violet-500/10"
                      : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                  }`}
                >
                  <RotateCcw className="w-3 h-3" />
                  Réflexion
                </button>
                <button
                  onClick={() => handleModeSwitch("rechercher")}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                    mode === "rechercher"
                      ? "border-blue-500/50 text-blue-300 bg-blue-500/10"
                      : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full border border-current flex items-center justify-center">
                    <span className="w-1 h-1 rounded-full bg-current" />
                  </span>
                  Rechercher
                </button>
              </div>

              {/* Right: mic + send */}
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/8 transition-colors">
                  <Mic className="w-4 h-4 text-white/40" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-3.5 h-3.5 text-white ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
