import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, ShoppingBag, Users, Globe, TrendingUp, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAIChat } from "@/hooks/use-chat";

const EARNING_OPTIONS = [
  {
    icon: ShoppingBag,
    label: "Créer ma boutique",
    desc: "Vendre mes produits en vidéo",
    color: "from-violet-500 to-purple-600",
    message: "Je veux créer ma boutique et vendre mes produits en vidéo sur ViralStore. Guide-moi !",
  },
  {
    icon: Users,
    label: "Parrainer des amis",
    desc: "Gagner des bonus de parrainage",
    color: "from-blue-500 to-cyan-500",
    message: "Explique-moi comment fonctionne le système de parrainage et combien je peux gagner.",
  },
  {
    icon: Globe,
    label: "Mon domaine perso",
    desc: "6 500 FCFA — boutique pro",
    color: "from-emerald-500 to-teal-500",
    message: "Je veux acheter un domaine personnalisé pour ma boutique à 6 500 FCFA. Comment ça marche ?",
  },
  {
    icon: TrendingUp,
    label: "Revenus AdSense",
    desc: "500 vues = commissions automatiques",
    color: "from-orange-500 to-amber-500",
    message: "Explique-moi comment gagner de l'argent avec les revenus AdSense dès 500 vues.",
  },
];

export function AiCoach() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [welcomed, setWelcomed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isStreaming, streamingContent, sendMessage, isReady } = useAIChat();

  // Show welcome message when chat opens for first time
  useEffect(() => {
    if (isOpen && isReady && messages.length === 0 && !welcomed && !isStreaming) {
      setWelcomed(true);
    }
  }, [isOpen, isReady, messages.length, welcomed, isStreaming]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;
    sendMessage(inputValue);
    setInputValue("");
  };

  const handleOption = (message: string) => {
    sendMessage(message);
  };

  const showWelcomeScreen = messages.length === 0 && !isStreaming;

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/40 flex items-center justify-center"
      >
        <Sparkles className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-400 border-2 border-background"></span>
        </span>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 w-[370px] max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
            style={{ background: "#0f0f13", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-none">Coach ViralStore</p>
                  <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    En ligne · Llama 3.3
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto" style={{ minHeight: "320px", maxHeight: "460px" }}>
              {showWelcomeScreen ? (
                /* Welcome Screen */
                <div className="flex flex-col items-center px-4 py-6 gap-4">
                  {/* Greeting */}
                  <div className="w-full">
                    <div className="flex justify-start">
                      <div className="max-w-[88%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-white/90 leading-relaxed"
                        style={{ background: "rgba(255,255,255,0.07)" }}>
                        👋 <strong>Bienvenue sur ViralStore !</strong> Je suis ton Coach Business personnel.<br /><br />
                        Je vais t'aider à gagner de l'argent. Choisis ce qui t'intéresse 👇
                      </div>
                    </div>
                  </div>

                  {/* Option Cards */}
                  <div className="w-full grid grid-cols-2 gap-2">
                    {EARNING_OPTIONS.map((opt) => (
                      <motion.button
                        key={opt.label}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleOption(opt.message)}
                        className={`rounded-xl p-3 text-left flex flex-col gap-1.5 bg-gradient-to-br ${opt.color} relative overflow-hidden`}
                      >
                        <opt.icon className="w-5 h-5 text-white" />
                        <p className="text-xs font-semibold text-white leading-tight">{opt.label}</p>
                        <p className="text-[10px] text-white/70 leading-tight">{opt.desc}</p>
                      </motion.button>
                    ))}
                  </div>

                  <p className="text-xs text-white/30 text-center">
                    ou écris directement ta question ci-dessous
                  </p>
                </div>
              ) : (
                /* Messages */
                <div className="p-4 space-y-3">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "text-white rounded-br-sm bg-gradient-to-r from-violet-600 to-purple-600"
                            : "text-white/90 rounded-bl-sm"
                        }`}
                        style={msg.role === "assistant" ? { background: "rgba(255,255,255,0.07)" } : {}}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {isStreaming && streamingContent && (
                    <div className="flex justify-start">
                      <div
                        className="max-w-[88%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-white/90 leading-relaxed"
                        style={{ background: "rgba(255,255,255,0.07)" }}
                      >
                        {streamingContent}
                        <span className="inline-block w-1 h-4 ml-0.5 bg-violet-400 animate-pulse align-middle rounded-full" />
                      </div>
                    </div>
                  )}

                  {isStreaming && !streamingContent && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-bl-sm px-4 py-3" style={{ background: "rgba(255,255,255,0.07)" }}>
                        <div className="flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Bottom Input */}
            <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <form onSubmit={handleSend}>
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Message ou maintenir pour parler..."
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
                    disabled={isStreaming}
                  />
                  <button
                    type="button"
                    className="text-white/30 hover:text-white/60 transition-colors"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isStreaming}
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-600 disabled:opacity-30 hover:bg-violet-500 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-white ml-0.5" />
                  </button>
                </div>

                {/* Mode Tabs */}
                <div className="flex items-center gap-2 mt-2 px-1">
                  <button type="button" className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70 transition-colors rounded-full px-2 py-0.5 hover:bg-white/5">
                    <span className="w-1 h-1 rounded-full bg-blue-400 inline-block" />
                    Réflexion
                  </button>
                  <button type="button" className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70 transition-colors rounded-full px-2 py-0.5 hover:bg-white/5">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block" />
                    Rechercher
                  </button>
                  <div className="flex-1" />
                  <span className="text-[9px] text-white/20">Llama 3.3 · Groq</span>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
