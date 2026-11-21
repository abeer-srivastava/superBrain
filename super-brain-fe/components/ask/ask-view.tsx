"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp, FileText, MessageSquarePlus, PanelLeft, Square, Trash2, X } from "lucide-react";
import { api, askStream } from "@/lib/api";
import { useFeatures, useItem, useStats, useThread, useThreads } from "@/lib/hooks";
import { itemTitle, relativeTime } from "@/lib/format";
import type { Message, Source } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AnswerMarkdown, SourceList } from "./answer";

interface LiveMessage extends Message {
  streaming?: boolean;
  error?: string;
}

function ThreadList({ activeId, onNew, onPick }: { activeId: string | null; onNew: () => void; onPick: () => void }) {
  const { data: threads, mutate } = useThreads();
  const router = useRouter();
  const remove = async (id: string) => {
    await api.threads.remove(id).catch(() => toast.error("Could not delete conversation"));
    await mutate();
    if (id === activeId) router.replace("/ask");
  };
  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button variant="secondary" size="sm" className="w-full justify-start" onClick={onNew}>
          <MessageSquarePlus className="size-4" /> New conversation
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
        {threads && threads.length > 0 ? (
          <ul className="space-y-0.5">
            {threads.map((t) => (
              <li key={t._id} className="group relative">
                <Link
                  href={`/ask?t=${t._id}`}
                  onClick={onPick}
                  data-active={t._id === activeId}
                  className="wipe block px-3 py-2 pr-8"
                >
                  <span className="line-clamp-1 text-[13.5px]">{t.title}</span>
                  <span className="font-mono text-[11px] opacity-60">{relativeTime(t.updatedAt)}</span>
                </Link>
                <button
                  onClick={() => remove(t._id)}
                  className="absolute right-2 top-2.5 p-1 text-ink-3 opacity-0 transition-opacity hover:bg-paper-2 hover:text-danger group-hover:opacity-100 focus:opacity-100"
                  aria-label={`Delete ${t.title}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-2 text-[13px] leading-relaxed text-ink-3">Your conversations are saved here so you can pick up where you left off.</p>
        )}
      </div>
    </div>
  );
}

export function AskView() {
  const router = useRouter();
  const params = useSearchParams();
  const threadParam = params.get("t");
  const initialQ = params.get("q");
  const about = params.get("about");

  const features = useFeatures();
  const { data: stats } = useStats();
  const { data: thread } = useThread(threadParam);
  const { mutate: refreshThreads } = useThreads();
  const { data: aboutItem } = useItem(about);

  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(threadParam);
  const [scope, setScope] = useState<string | null>(about);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const askedInitial = useRef(false);

  // Load a saved thread.
  useEffect(() => {
    if (threadParam && thread && thread._id === threadParam && !busy) {
      setMessages(thread.messages);
      setThreadId(thread._id);
    }
    if (!threadParam && !busy && !initialQ) {
      setMessages([]);
      setThreadId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadParam, thread]);

  useEffect(() => setScope(about), [about]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || busy) return;
      setInput("");
      requestAnimationFrame(resize);
      setBusy(true);
      setMessages((m) => [...m, { role: "user", content: q, sources: [] }, { role: "assistant", content: "", sources: [], streaming: true }]);

      const update = (fn: (m: LiveMessage) => LiveMessage) =>
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = fn(next[next.length - 1]);
          return next;
        });

      const controller = new AbortController();
      abortRef.current = controller;
      await askStream(
        q,
        { threadId: threadId ?? undefined, contentId: scope ?? undefined },
        {
          onSources: (sources: Source[]) => update((m) => ({ ...m, sources })),
          onToken: (delta) => update((m) => ({ ...m, content: m.content + delta })),
          onThread: ({ id }) => {
            if (id !== threadId) {
              setThreadId(id);
              router.replace(`/ask?t=${id}`, { scroll: false });
            }
            void refreshThreads();
          },
          onError: (message) => update((m) => ({ ...m, error: message })),
        },
        controller.signal,
      );
      update((m) => ({ ...m, streaming: false }));
      setBusy(false);
      abortRef.current = null;
      textareaRef.current?.focus();
    },
    [busy, threadId, scope, router, refreshThreads],
  );

  // Arriving with ?q= (from the command palette or an item page).
  useEffect(() => {
    if (initialQ && !askedInitial.current) {
      askedInitial.current = true;
      void ask(initialQ);
    }
  }, [initialQ, ask]);

  const newConversation = () => {
    abortRef.current?.abort();
    setMessages([]);
    setThreadId(null);
    setScope(null);
    setShowThreads(false);
    router.replace("/ask");
    textareaRef.current?.focus();
  };

  const suggestions = (stats?.tags ?? []).slice(0, 3).map((t) => `What have I saved about ${t.tag}?`);
  const fallbackSuggestions = ["What are the big ideas across everything I've saved?", "Which of my notes mention habits?", "Summarize what I know about productivity."];
  const prompts = suggestions.length >= 2 ? [...suggestions, "What connects the things I've saved recently?"] : fallbackSuggestions;
  const empty = messages.length === 0;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] lg:h-dvh">
      {/* Threads */}
      <aside className="hidden w-[260px] shrink-0 border-r border-line-strong md:block">
        <ThreadList activeId={threadId} onNew={newConversation} onPick={() => undefined} />
      </aside>
      {showThreads && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setShowThreads(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] border-r border-line bg-paper shadow-lg">
            <ThreadList activeId={threadId} onNew={newConversation} onPick={() => setShowThreads(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 px-4 pt-3 md:hidden">
          <Button variant="ghost" size="sm" onClick={() => setShowThreads(true)}>
            <PanelLeft className="size-4" /> Conversations
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto w-full max-w-[760px] px-4 pb-8 pt-8 sm:px-8 lg:pt-14">
            {empty ? (
              <div className="animate-fade-up pt-6 sm:pt-14">
                <p className="eyebrow">— Ask</p>
                <h1 className="mt-4 font-display text-5xl leading-[1] text-ink sm:text-[72px]">
                  Ask your <span className="text-accent">library</span>.
                </h1>
                <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-2">
                  Answers come only from what you’ve saved, with every claim cited back to its source. If it isn’t in your library, SuperBrain will tell you.
                </p>
                {features && !features.ask && (
                  <p className="mt-6 border-l border-accent bg-paper-2 px-4 py-3 text-[13px] text-ink-2">
                    AI answers are paused on this server, but you can still ask. SuperBrain will show the saved items most relevant to your question.
                  </p>
                )}
                <div className="mt-10 grid gap-px border border-ink bg-ink sm:grid-cols-2">
                  {prompts.map((p, idx) => (
                    <button
                      key={p}
                      onClick={() => ask(p)}
                      className="wipe flex items-start gap-3 bg-paper px-4 py-4 text-left text-[15px] text-ink"
                    >
                      <span className="pt-0.5 font-mono text-[11px] opacity-60">{String(idx + 1).padStart(2, "0")}</span>
                      <span>{p}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-10">
                {messages.map((m, i) =>
                  m.role === "user" ? (
                    <h2 key={i} className="border-t border-ink pt-5 font-display text-[28px] leading-tight text-ink animate-fade-up sm:text-[34px]">
                      {m.content}
                    </h2>
                  ) : (
                    <div key={i} className="-mt-5 animate-fade-up space-y-5">
                      {m.sources.length > 0 && (
                        <div>
                          <p className="eyebrow mb-2">
                            {m.sources.length} {m.sources.length === 1 ? "source" : "sources"} from your library
                          </p>
                          <SourceList sources={m.sources} />
                        </div>
                      )}
                      {m.streaming && !m.content && !m.error ? (
                        <div className="space-y-2 pt-1">
                          <div className="h-3 w-full skeleton" />
                          <div className="h-3 w-5/6 skeleton" />
                          <div className="h-3 w-2/3 skeleton" />
                        </div>
                      ) : (
                        <AnswerMarkdown text={m.content} sources={m.sources} streaming={m.streaming} />
                      )}
                      {m.error && <p className="bg-danger-soft px-3 py-2 text-sm text-danger">{m.error}</p>}
                    </div>
                  ),
                )}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-ink bg-paper">
          <div className="mx-auto w-full max-w-[760px] px-4 py-4 sm:px-8">
            {scope && (
              <div className="mb-2 flex items-center gap-2 text-[13px] text-ink-2">
                <span className="inline-flex max-w-full items-center gap-1.5 border border-ink py-1 pl-2.5 pr-1 font-mono text-[12px]">
                  <FileText className="size-3.5 text-ink-3" />
                  <span className="truncate">Asking about: {aboutItem ? itemTitle(aboutItem) : "this item"}</span>
                  <button onClick={() => setScope(null)} className="p-0.5 text-ink-3 hover:bg-paper-2 hover:text-ink" aria-label="Ask the whole library instead">
                    <X className="size-3" />
                  </button>
                </span>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void ask(input);
              }}
              className="flex items-end gap-2 border border-ink bg-card p-2 pl-4 transition-colors focus-within:outline focus-within:outline-1 focus-within:outline-ink"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                autoFocus
                onChange={(e) => {
                  setInput(e.target.value);
                  resize();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    void ask(input);
                  }
                }}
                placeholder={empty ? "Ask anything about what you’ve saved…" : "Ask a follow-up…"}
                aria-label="Your question"
                className="max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink-3"
              />
              {busy ? (
                <Button type="button" size="icon" variant="secondary" onClick={() => abortRef.current?.abort()} aria-label="Stop">
                  <Square className="size-3.5 fill-current" />
                </Button>
              ) : (
                <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Ask">
                  <ArrowUp className="size-4" />
                </Button>
              )}
            </form>
            <p className="mt-2 text-center text-[11px] text-ink-3">Answers are generated from your saved items and can be imperfect. Check the cited sources.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
