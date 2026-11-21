"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle, ArrowLeft, ArrowUpRight, Eye, EyeOff, FileText, MoreHorizontal, RotateCw, Sparkles, Star, Trash2, Waypoints, X, MessageSquareText,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useItem, useRefreshLibrary, useRelated } from "@/lib/hooks";
import { fileSize, itemTitle, KIND_LABEL, longDate, readingTime, relativeTime, sourceLabel } from "@/lib/format";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { KindIcon } from "@/components/ui/misc";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Textarea } from "@/components/ui/input";

function useSaver(id: string) {
  const { mutate } = useItem(id);
  const refresh = useRefreshLibrary();
  return async (patch: Parameters<typeof api.content.update>[1], opts: { quiet?: boolean } = {}) => {
    try {
      const updated = await api.content.update(id, patch);
      await mutate((prev) => (prev ? { ...prev, ...updated, extractedText: patch.extractedText ?? prev.extractedText } : updated), { revalidate: false });
      refresh();
      return true;
    } catch (e) {
      if (!opts.quiet) toast.error(e instanceof ApiError ? e.message : "Could not save");
      return false;
    }
  };
}

function EditableTitle({ item }: { item: Item }) {
  const save = useSaver(item._id);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(itemTitle(item));
  useEffect(() => setValue(itemTitle(item)), [item]);

  const commit = async () => {
    setEditing(false);
    const v = value.trim();
    if (v && v !== itemTitle(item)) await save({ title: v });
    else setValue(itemTitle(item));
  };

  if (editing) {
    return (
      <textarea
        autoFocus
        value={value}
        rows={2}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void commit();
          }
          if (e.key === "Escape") {
            setValue(itemTitle(item));
            setEditing(false);
          }
        }}
        className="w-full resize-none bg-transparent font-display text-4xl leading-[1.1] text-ink outline-none sm:text-[52px]"
      />
    );
  }
  return (
    <h1
      onClick={() => setEditing(true)}
      title="Click to rename"
      className="cursor-text font-display text-4xl leading-[1.1] text-ink decoration-line-strong decoration-1 underline-offset-8 hover:underline sm:text-[52px]"
    >
      {itemTitle(item)}
    </h1>
  );
}

function TagEditor({ item }: { item: Item }) {
  const save = useSaver(item._id);
  const [draft, setDraft] = useState("");
  const add = async () => {
    const t = draft.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");
    setDraft("");
    if (!t || item.tags.includes(t)) return;
    await save({ tags: [...item.tags, t] });
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {item.tags.map((t) => (
        <span key={t} className="group inline-flex items-center gap-1 border border-line-strong py-0.5 pl-2 pr-1 font-mono text-[11.5px] text-ink-2">
          <Link href={`/library?tag=${encodeURIComponent(t)}`} className="hover:text-ink">
            <span className="opacity-50">#</span>
            {t}
          </Link>
          <button onClick={() => save({ tags: item.tags.filter((x) => x !== t) })} className="p-0.5 text-ink-3 hover:bg-paper-2 hover:text-ink" aria-label={`Remove ${t}`}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            void add();
          }
        }}
        onBlur={() => draft && add()}
        placeholder={item.tags.length ? "Add…" : "Add a tag…"}
        aria-label="Add tag"
        className="h-6 w-24 bg-transparent text-xs text-ink outline-none placeholder:text-ink-3"
      />
    </div>
  );
}

function Annotation({ item }: { item: Item }) {
  const save = useSaver(item._id);
  const [value, setValue] = useState(item.annotation ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const lastSaved = useRef(item.annotation ?? "");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Avoid issuing a PATCH on mount. In React Strict Mode the mount effect
    // runs twice in development, and the previous first-run flag allowed an
    // unchanged empty annotation to be saved on that second pass.
    if (value === lastSaved.current) return;
    setState("saving");
    const t = setTimeout(async () => {
      const ok = await save({ annotation: value.trim() ? value : null }, { quiet: true });
      if (ok) lastSaved.current = value;
      setState(ok ? "saved" : "idle");
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.max(el.scrollHeight, 88)}px`;
    }
  }, [value]);

  return (
    <section className="mt-10">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="eyebrow">Your notes</h2>
        <span className="text-xs text-ink-3">{state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Included in search & answers"}</span>
      </div>
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Why did you save this? What do you think about it?"
        className="min-h-[88px] border-dashed bg-transparent shadow-none focus:border-solid focus:bg-card"
      />
    </section>
  );
}

function NoteBody({ item }: { item: Item }) {
  const save = useSaver(item._id);
  const [value, setValue] = useState(item.extractedText ?? "");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!dirty) setValue(item.extractedText ?? "");
  }, [item.extractedText, dirty]);
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value]);

  return (
    <section className="mt-8">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setDirty(true);
        }}
        aria-label="Note text"
        className="w-full resize-none bg-transparent text-[17px] leading-[1.75] text-ink outline-none"
      />
      {dirty && (
        <div className="sticky bottom-4 mt-2 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setValue(item.extractedText ?? ""); setDirty(false); }}>
            Discard
          </Button>
          <Button
            size="sm"
            loading={saving}
            disabled={!value.trim()}
            onClick={async () => {
              setSaving(true);
              if (await save({ extractedText: value })) setDirty(false);
              setSaving(false);
            }}
          >
            Save note
          </Button>
        </div>
      )}
    </section>
  );
}

function FullText({ text, words }: { text: string; words?: number }) {
  const [open, setOpen] = useState(false);
  const paragraphs = text.split(/\n+/).filter(Boolean);
  const long = text.length > 1400;
  // Collapsed: enough paragraphs (~900 chars) to fill the preview under the fade.
  const preview: string[] = [];
  for (let used = 0, i = 0; i < paragraphs.length && used < 900; i++) {
    const p = paragraphs[i].length > 900 - used ? `${paragraphs[i].slice(0, 900 - used)}…` : paragraphs[i];
    preview.push(p);
    used += p.length;
  }
  const shown = open || !long ? paragraphs : preview;
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="eyebrow">Saved text</h2>
        {words ? <span className="font-mono text-xs text-ink-3">{words.toLocaleString()} words · {readingTime(words)}</span> : null}
      </div>
      <div className={cn("relative space-y-4 text-[16px] leading-[1.75] text-ink-2", !open && long && "max-h-[340px] overflow-hidden")}>
        {shown.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {!open && long && <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-paper to-transparent" />}
      </div>
      {long && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => setOpen((o) => !o)}>
          {open ? "Collapse" : "Read the full text"}
        </Button>
      )}
    </section>
  );
}

function Connections({ item }: { item: Item }) {
  const { data, isLoading } = useRelated(item._id, item.status === "ready");
  return (
    <section>
      <h2 className="eyebrow mb-3 flex items-center gap-1.5">
        <Waypoints className="size-3.5" /> Connections
      </h2>
      {item.status !== "ready" || isLoading ? (
        <div className="space-y-2">
          <div className="h-14 skeleton" />
          <div className="h-14 skeleton" />
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-ink-3">No strong connections yet. As your library grows, related ideas will show up here.</p>
      ) : (
        <ul className="border-t border-ink">
          {data.map((r) => (
            <li key={r.item._id}>
              <Link href={`/item/${r.item._id}`} className="wipe group block border-b border-line p-2.5">
                <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.04em] opacity-70">
                  <KindIcon kind={r.item.type} className="size-3" />
                  <span className="truncate">{sourceLabel(r.item)}</span>
                  <span className="ml-auto font-mono" title="Similarity">{Math.round(r.score * 100)}%</span>
                </div>
                <p className="mt-1 line-clamp-2 text-[14px] font-medium leading-snug">{itemTitle(r.item)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ItemView({ id }: { id: string }) {
  const router = useRouter();
  const { data: item, error, isLoading, mutate } = useItem(id);
  const save = useSaver(id);
  const refresh = useRefreshLibrary();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-4xl">Not found</h1>
        <p className="mt-2 text-ink-2">This item doesn’t exist or was deleted.</p>
        <Button className="mt-6" variant="secondary" onClick={() => router.push("/library")}>
          Back to library
        </Button>
      </div>
    );
  }

  if (isLoading || !item) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 py-12 sm:px-8">
        <div className="h-4 w-32 skeleton" />
        <div className="mt-6 h-12 w-3/4 skeleton" />
        <div className="mt-3 h-12 w-1/2 skeleton" />
        <div className="mt-10 h-32 w-full max-w-2xl skeleton" />
      </div>
    );
  }

  const reprocess = async () => {
    try {
      await api.content.reprocess(id);
      await mutate();
      refresh();
      toast.success("Reprocessing", { description: "SuperBrain is reading it again." });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not reprocess");
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.content.remove(id);
      refresh();
      toast.success("Deleted", { description: "The item, its index and any file are gone." });
      router.push("/library");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not delete");
      setDeleting(false);
    }
  };

  const processing = item.status === "processing";
  const failed = item.status === "failed";
  const isWebSource = item.originalLink && /^https?:\/\//.test(item.originalLink);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-24 pt-6 sm:px-8 lg:pt-10">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => (history.length > 1 ? router.back() : router.push("/library"))} className="flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-ink">
          <ArrowLeft className="size-4" /> Back
        </button>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => save({ favorite: !item.favorite })}
            aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={item.favorite}
          >
            <Star className={cn("size-4", item.favorite && "fill-accent text-accent")} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/ask?about=${id}&q=${encodeURIComponent(`What are the key ideas in “${itemTitle(item)}”?`)}`)} aria-label="Ask about this">
            <MessageSquareText className="size-4" />
          </Button>
          <Menu>
            <MenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="More actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </MenuTrigger>
            <MenuContent>
              <MenuItem onSelect={reprocess}>
                <RotateCw className="size-4" /> Reprocess
              </MenuItem>
              {item.type !== "note" && !item.fileName && (
                <MenuItem onSelect={() => save({ isPrivate: !item.isPrivate })}>
                  {item.isPrivate ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  {item.isPrivate ? "Show on public page" : "Hide from public page"}
                </MenuItem>
              )}
              <MenuSeparator />
              <MenuItem danger onSelect={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" /> Delete
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </div>

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0 max-w-[720px] animate-fade-up">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
            <span className="flex items-center gap-1.5">
              <KindIcon kind={item.type} /> {KIND_LABEL[item.type]}
            </span>
            {sourceLabel(item) && item.type !== "note" && <span>{sourceLabel(item)}</span>}
            {item.author && <span>by {item.author}</span>}
            <span className="font-mono text-xs">Saved {relativeTime(item.createdAt)}</span>
            {item.isPrivate && (
              <span className="flex items-center gap-1 bg-paper-2 px-2 py-0.5 text-xs">
                <EyeOff className="size-3" /> Hidden from public page
              </span>
            )}
          </div>

          <div className="mt-3">
            <EditableTitle item={item} />
          </div>

          {(isWebSource || item.fileName) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {isWebSource && (
                <a href={item.originalLink} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm">
                    Open original <ArrowUpRight className="size-3.5" />
                  </Button>
                </a>
              )}
              {item.fileName && item.type === "pdf" && (
                <a href={api.content.fileUrl(item._id)} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm">
                    <FileText className="size-3.5" /> Open PDF
                  </Button>
                </a>
              )}
            </div>
          )}

          {item.type === "image" && item.fileName && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={api.content.fileUrl(item._id)} alt={itemTitle(item)} className="mt-8 w-full border border-line" />
          )}

          {processing ? (
            <div className="mt-10 border border-ink p-5">
              <p className="flex items-center gap-2 text-sm text-ink-2">
                <Sparkles className="size-4 animate-pulse text-accent" /> SuperBrain is preparing the summary and search index…
              </p>
              {item.summary ? <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{item.summary}</p> : <div className="mt-4 space-y-2"><div className="h-3 w-full skeleton" /><div className="h-3 w-11/12 skeleton" /></div>}
            </div>
          ) : failed ? (
            <div className="mt-10 flex items-start gap-3 border border-danger/20 bg-danger-soft p-5 text-danger">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Couldn’t process this item</p>
                <p className="mt-1 text-sm opacity-90">{item.error || "Something went wrong."}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={reprocess}>
                <RotateCw className="size-3.5" /> Try again
              </Button>
            </div>
          ) : (
            item.type !== "note" &&
            (item.summary || item.keyPoints.length > 0) && (
              <section className="mt-10 border border-ink p-5 sm:p-6">
                <h2 className="eyebrow flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-accent" /> Summary
                </h2>
                {item.summary && <p className="mt-3 text-[17px] leading-relaxed text-ink">{item.summary}</p>}
                {item.keyPoints.length > 0 && (
                  <ul className="mt-4 divide-y divide-line border-t border-ink">
                    {item.keyPoints.map((k, i) => (
                      <li key={i} className="flex gap-3 py-2.5 text-[15px] leading-relaxed text-ink-2">
                        <span className="w-6 shrink-0 pt-[3px] font-mono text-[11px] text-ink-3">{String(i + 1).padStart(2, "0")}</span> {k}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          )}

          {item.type === "note" && !processing && <NoteBody item={item} />}

          <Annotation item={item} />

          {item.type !== "note" && item.extractedText && <FullText text={item.extractedText} words={item.wordCount} />}
        </article>

        <aside className="space-y-10 lg:sticky lg:top-8 lg:self-start">
          <section>
            <h2 className="eyebrow mb-3">Tags</h2>
            <TagEditor item={item} />
          </section>
          <Connections item={item} />
          <section>
            <h2 className="eyebrow mb-3">Details</h2>
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-3">Saved</dt>
                <dd className="text-ink-2">{longDate(item.createdAt)}</dd>
              </div>
              {item.wordCount ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-3">Length</dt>
                  <dd className="text-ink-2">{item.wordCount.toLocaleString()} words</dd>
                </div>
              ) : null}
              {item.fileSize ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-3">File</dt>
                  <dd className="truncate text-ink-2">{fileSize(item.fileSize)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-ink-3">Visibility</dt>
                <dd className="text-ink-2">{item.type === "note" || item.fileName || item.isPrivate ? "Private" : "Public page, if sharing is on"}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      <Dialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this item?"
        description="It will be removed from your library, search index and answers. Uploaded files are deleted too. This can’t be undone."
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={remove} loading={deleting}>
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
