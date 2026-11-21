"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { toast } from "sonner";
import { CornerDownLeft, Link2, Paperclip, StickyNote } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useRefreshLibrary } from "@/lib/hooks";
import { hostname, looksLikeUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/misc";
import { useShell } from "./shell";

/** Pull `#tags` out of capture text. */
function splitTags(text: string): { body: string; tags: string[] } {
  const tags: string[] = [];
  const body = text.replace(/(^|\s)#([\p{L}\p{N}_-]{1,32})(?=\s|$)/gu, (_, pre, tag) => {
    tags.push(tag.toLowerCase());
    return pre;
  });
  return { body: body.trim(), tags: [...new Set(tags)] };
}

export interface CaptureBarHandle {
  focus: () => void;
}

/**
 * One input for everything: paste a link, type a note, or attach a file.
 * Detects intent from what you type. `#tags` are pulled out automatically.
 */
export const CaptureBar = forwardRef<CaptureBarHandle>(function CaptureBar(_, ref) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const refresh = useRefreshLibrary();
  const { uploadFiles } = useShell();

  useImperativeHandle(ref, () => ({ focus: () => textarea.current?.focus() }));

  const { body, tags } = splitTags(value);
  const isUrl = looksLikeUrl(body);
  const hasText = body.length > 0;

  const resize = () => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  };

  const submit = async () => {
    if (!hasText || busy) return;
    setBusy(true);
    try {
      if (isUrl) {
        await api.content.createLink(body, { tags });
        toast.success("Saved", { description: `Reading ${hostname(body.startsWith("http") ? body : `https://${body}`)}. It'll be searchable in a moment.` });
      } else {
        await api.content.createNote(body, { tags });
        toast.success("Note saved");
      }
      setValue("");
      requestAnimationFrame(resize);
      refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save that");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={cn(
        "border bg-card transition-[outline-color] duration-200",
        focused ? "border-ink outline outline-1 outline-ink" : "border-ink",
      )}
    >
      <div className="flex items-start gap-3 px-4 pt-3.5">
        <span className={cn("mt-1 flex size-6 shrink-0 items-center justify-center transition-colors", isUrl ? "bg-kind-link/10 text-kind-link" : hasText ? "bg-kind-note/10 text-kind-note" : "text-ink-3")}>
          {isUrl ? <Link2 className="size-4" /> : <StickyNote className="size-4" />}
        </span>
        <textarea
          ref={textarea}
          id="capture"
          rows={1}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            resize();
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void submit();
            }
          }}
          onPaste={(e) => {
            const files = Array.from(e.clipboardData.files);
            if (files.length) {
              e.preventDefault();
              void uploadFiles(files);
            }
          }}
          placeholder="Paste a link or jot a thought"
          aria-label="Capture a link or note"
          className="min-h-[40px] flex-1 resize-none bg-transparent py-1 text-[17px] leading-relaxed text-ink outline-none placeholder:text-ink-3"
        />
      </div>

      <div className="flex items-center gap-2 border-t border-line px-3 py-2">
        <Button variant="ghost" size="sm" onClick={() => fileInput.current?.click()} className="text-ink-3">
          <Paperclip className="size-3.5" /> <span className="hidden sm:inline">PDF or image</span>
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp,image/gif"
          multiple
          hidden
          onChange={(e) => {
            void uploadFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <div className="ml-1 hidden min-w-0 flex-1 items-center gap-1.5 truncate text-xs text-ink-3 sm:flex">
          {tags.length > 0 ? (
            tags.map((t) => (
              <span key={t} className="border border-line-strong px-1.5 py-0.5 font-mono text-[11px] text-ink-2">
                #{t}
              </span>
            ))
          ) : hasText ? (
            <span>Tip: add #tags inline</span>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {hasText && (
            <span className="hidden items-center gap-1 text-xs text-ink-3 md:flex">
              <Kbd>⇧</Kbd>
              <Kbd>↵</Kbd> new line
            </span>
          )}
          <Button size="sm" onClick={submit} disabled={!hasText} loading={busy}>
            {isUrl ? "Save link" : "Save note"} {!busy && <CornerDownLeft className="size-3.5 opacity-60" />}
          </Button>
        </div>
      </div>
    </div>
  );
});
