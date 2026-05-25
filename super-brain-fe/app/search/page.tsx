"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Sparkles, MessageSquare, BookOpen, Send, Trash2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { searchAPI } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: any[];
}

const SUGGESTED_PROMPTS = [
  "Summarize my recent bookmarks",
  "What is NestJS used for?",
  "Find notes about my databases",
  "What coding frameworks am I using?"
];

export default function SearchPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("brain_chat_history");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse chat history:", e);
      }
    }
  }, []);

  // Save chat history to localStorage
  const saveHistory = (newMessages: Message[]) => {
    setMessages(newMessages);
    localStorage.setItem("brain_chat_history", JSON.stringify(newMessages));
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    setError(null);
    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    saveHistory(updatedMessages);
    setInputValue("");
    setLoading(true);

    try {
      // Pass the current history (excluding the new user message) so that the LLM has context
      const chatHistoryForAPI = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const res = await searchAPI.ask(text, chatHistoryForAPI);
      
      const assistantMessage: Message = {
        role: "assistant",
        content: res.answer,
        sources: res.sources,
      };

      saveHistory([...updatedMessages, assistantMessage]);
    } catch (err: any) {
      console.error("Failed to ask AI:", err);
      const errorMsg = err.response?.data?.message || "Something went wrong. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  const handleClearChat = () => {
    saveHistory([]);
    setError(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-4 bg-main rounded-[var(--radius-base)] border-4 border-border shadow-[var(--shadow)] mb-2">
              <Sparkles className="w-8 h-8 text-main-foreground" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-foreground">
              SecondBrain AI Assistant
            </h1>
            <p className="text-foreground/70 font-base max-w-2xl mx-auto">
              Have a conversation with your knowledge vault using natural language.
            </p>
          </div>

          {/* Chat Interface Container */}
          <Card className="flex flex-col h-[650px] overflow-hidden border-4 border-border shadow-[var(--shadow)] hover:translate-y-0 hover:shadow-[var(--shadow)]">
            {/* Chat Header */}
            <CardHeader className="bg-main/10 border-b-4 border-border py-4 px-6 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-main text-xl">
                <MessageSquare className="w-6 h-6" />
                Ask Your Brain
              </CardTitle>
              {messages.length > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleClearChat}
                  className="flex items-center gap-2 border-2 border-border shadow-[2px_2px_0px_0px_var(--border)] active:translate-y-[2px] active:shadow-none"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Chat
                </Button>
              )}
            </CardHeader>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-6 bg-secondary-background space-y-6">
              <AnimatePresence initial={false}>
                {messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col justify-center items-center text-center max-w-lg mx-auto space-y-6"
                  >
                    <div className="p-4 bg-main/5 rounded-full border-4 border-dashed border-border mb-2 animate-pulse">
                      <Sparkles className="w-10 h-10 text-main" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-heading font-bold text-foreground">
                        Your AI knowledge assistant is ready!
                      </h3>
                      <p className="text-sm text-foreground/70 font-base leading-relaxed">
                        Start asking questions about notes, files, links, or documents you've uploaded to your SecondBrain. Try one of these prompts to get started:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
                      {SUGGESTED_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => handleSend(prompt)}
                          className="flex items-center justify-between p-3.5 text-left text-sm font-base font-semibold text-foreground bg-background border-4 border-border rounded-[var(--radius-base)] shadow-[4px_4px_0px_0px_var(--border)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all group"
                        >
                          <span className="pr-2">{prompt}</span>
                          <ArrowRight className="w-4 h-4 text-main shrink-0 transition-transform group-hover:translate-x-1" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  messages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex flex-col ${
                        msg.role === "user" ? "items-end" : "items-start"
                      } space-y-1.5`}
                    >
                      {/* Message Sender */}
                      <span className="text-xs font-heading font-bold text-foreground/60 px-1">
                        {msg.role === "user" ? "You" : "Brain AI"}
                      </span>

                      {/* Message Bubble */}
                      <div
                        className={`max-w-[85%] border-4 border-border p-4 shadow-[4px_4px_0px_0px_var(--border)] rounded-[var(--radius-base)] ${
                          msg.role === "user"
                            ? "bg-main text-main-foreground ml-auto"
                            : "bg-background text-foreground mr-auto"
                        }`}
                      >
                        <p className="text-base font-base leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>

                        {/* Sources section inside bubble for assistant */}
                        {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-4 pt-3 border-t-2 border-dashed border-border/40 space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-foreground/60">
                              <BookOpen className="w-3.5 h-3.5" />
                              Sources found in your brain:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {msg.sources.map((src, srcIdx) => {
                                const resolvedLink = src.link || src.originalLink || "#";
                                return (
                                  <a
                                    key={srcIdx}
                                    href={resolvedLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-chart-4 text-main-foreground text-xs font-heading font-bold border-2 border-border rounded-[var(--radius-base)] shadow-[2px_2px_0px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_var(--border)] hover:bg-chart-4/90 transition-all"
                                  >
                                    <span className="max-w-[120px] truncate">{src.title}</span>
                                    {resolvedLink !== "#" && <ExternalLink className="w-3 h-3 flex-shrink-0" />}
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>

              {/* Loader */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-start space-y-1.5"
                >
                  <span className="text-xs font-heading font-bold text-foreground/60 px-1">
                    Brain AI
                  </span>
                  <div className="border-4 border-border p-4 bg-background rounded-[var(--radius-base)] shadow-[4px_4px_0px_0px_var(--border)] mr-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-main rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2.5 h-2.5 bg-main rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2.5 h-2.5 bg-main rounded-full animate-bounce"></div>
                      <span className="text-sm font-base font-semibold text-foreground/60 pl-2">
                        Consulting your vault...
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error message */}
              {error && (
                <div className="p-4 rounded-[var(--radius-base)] border-4 border-border bg-chart-3/20 text-chart-3 font-base font-bold shadow-[2px_2px_0px_0px_var(--border)]">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form Footer */}
            <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4 bg-background border-t-4 border-border">
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about your notes, files, or links..."
                disabled={loading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="flex items-center gap-2 h-10 px-5 active:translate-y-1 shadow-[var(--shadow)]"
              >
                <span className="hidden sm:inline">Send</span>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
