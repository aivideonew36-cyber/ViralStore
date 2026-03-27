import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAIChat } from "@/hooks/use-chat";
import { useListProducts } from "@workspace/api-client-react";

export function AiCoach() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, isStreaming, streamingContent, sendMessage, isReady } = useAIChat();
  const { data: products } = useListProducts();

  // Auto-trigger if no products and chat is empty
  useEffect(() => {
    if (isReady && messages.length === 0 && products?.length === 0 && !isStreaming) {
      // Small delay to make it feel natural
      const timer = setTimeout(() => {
        sendMessage("Salut ! Je suis prêt à lancer ma boutique.");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isReady, messages.length, products?.length, isStreaming]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;
    sendMessage(inputValue);
    setInputValue("");
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary p-[2px] shadow-lg shadow-primary/30"
      >
        <div className="w-full h-full rounded-full bg-background flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/20 blur-xl"></div>
          <Sparkles className="w-6 h-6 text-foreground relative z-10" />
        </div>
        {/* Notification dot */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-secondary border-2 border-background"></span>
        </span>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[350px] h-[500px] max-h-[80vh] flex flex-col rounded-2xl glass-panel overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm">Coach ViralStore</h3>
                  <p className="text-[10px] text-secondary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                    En ligne
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-primary to-accent text-white rounded-br-sm' 
                      : 'bg-white/10 text-foreground border border-white/5 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isStreaming && streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-white/10 text-foreground border border-white/5 rounded-bl-sm">
                    {streamingContent}
                    <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10 bg-black/20">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Écrivez un message..."
                  className="w-full bg-black/40 border border-white/10 rounded-full pl-4 pr-12 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isStreaming}
                  className="absolute right-1.5 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
