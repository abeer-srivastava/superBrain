"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Download, ExternalLink, GripVertical, Monitor, Moon, RefreshCw, Sun } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useMe, useShare } from "@/lib/hooks";
import { useTheme, type ThemePref } from "@/lib/theme";
import { longDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldError, Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/misc";
import { ScrollRail } from "@/components/ui/scroll-rail";

const SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "sharing", label: "Public page" },
  { id: "capture", label: "Capture" },
  { id: "appearance", label: "Appearance" },
  { id: "security", label: "Security" },
  { id: "data", label: "Your data" },
  { id: "danger", label: "Danger zone" },
];

function Section({ id, title, description, children }: { id: string; title: string; description?: React.ReactNode; children: React.ReactNode }) {
  const n = SETTINGS_SECTIONS.findIndex((s) => s.id === id) + 1;
  return (
    <section id={id} className="grid scroll-mt-8 gap-6 border-t border-ink py-10 md:grid-cols-[240px_minmax(0,1fr)]">
      <div>
        <p className="eyebrow mb-2">{String(n).padStart(2, "0")}</p>
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {description && <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Profile() {
  const { user, mutate } = useMe();
  const [name, setName] = useState(user?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  if (!user) return null;
  const save = async () => {
    setSaving(true);
    try {
      const r = await api.account.update({ displayName: name.trim() || null });
      await mutate(r, { revalidate: false });
      toast.success("Profile saved");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="max-w-md space-y-5">
      <div>
        <Label htmlFor="displayName" hint="Shown on your public page">Display name</Label>
        <div className="flex gap-2">
          <Input id="displayName" value={name} onChange={(e) => setName(e.target.value)} placeholder={user.username} maxLength={60} />
          <Button variant="secondary" onClick={save} loading={saving} disabled={(user.displayName ?? "") === name.trim()} className="h-11">
            Save
          </Button>
        </div>
      </div>
      <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
        <dt className="text-ink-3">Username</dt>
        <dd className="text-ink">{user.username}</dd>
        <dt className="text-ink-3">Email</dt>
        <dd className="text-ink">{user.email}</dd>
        <dt className="text-ink-3">Member since</dt>
        <dd className="text-ink">{longDate(user.createdAt)}</dd>
      </dl>
    </div>
  );
}

function Sharing() {
  const { data, mutate } = useShare();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const url = data?.hash ? `${origin}/share/${data.hash}` : "";

  const toggle = async (enabled: boolean) => {
    setBusy(true);
    try {
      await mutate(await api.share.toggle(enabled), { revalidate: false });
      toast.success(enabled ? "Your public page is live" : "Your public page is now offline");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not update sharing");
    } finally {
      setBusy(false);
    }
  };
  const rotate = async () => {
    setBusy(true);
    try {
      await mutate(await api.share.rotate(), { revalidate: false });
      toast.success("New link created", { description: "The old link no longer works." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between gap-4 border border-line bg-card p-4">
        <div>
          <p className="text-[15px] font-medium text-ink">Public reading list</p>
          <p className="text-[13px] text-ink-3">{data?.enabled ? "Anyone with the link can view it." : "Off. Nothing is public."}</p>
        </div>
        <Switch checked={!!data?.enabled} onChange={toggle} disabled={busy || !data} label="Public page" />
      </div>
      {data?.enabled && url && (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2">
            <Input readOnly value={url} onFocus={(e) => e.target.select()} className="font-mono text-[13px]" />
            <Button
              variant="secondary"
              className="h-11"
              onClick={() => {
                void navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <ExternalLink className="size-3.5" /> Preview
              </Button>
            </a>
            <Button variant="ghost" size="sm" onClick={rotate} disabled={busy}>
              <RefreshCw className="size-3.5" /> Reset link
            </Button>
          </div>
        </div>
      )}
      <p className="mt-4 text-[13px] leading-relaxed text-ink-3">
        Your public page lists the <span className="text-ink-2">web links</span> you’ve saved, with their titles, summaries and tags. Your notes, uploaded files, saved text and private annotations are never shown. You can hide individual links from an item’s menu.
      </p>
    </div>
  );
}

function Bookmarklet() {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    // React blocks javascript: URLs in JSX, so the bookmarklet href is set imperatively.
    const code = `javascript:(function(){window.open('${window.location.origin}/capture?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title),'superbrain','width=460,height=600');})();`;
    ref.current?.setAttribute("href", code);
  }, []);
  return (
    <div className="max-w-xl">
      <div className="flex flex-wrap items-center gap-4 border border-dashed border-line-strong p-5">
        <a
          ref={ref}
          onClick={(e) => {
            e.preventDefault();
            toast("Drag this button to your bookmarks bar", { description: "Then click it on any page to save it." });
          }}
          className="btn-slab inline-flex cursor-grab items-center gap-2 px-5 py-3 text-sm font-semibold active:cursor-grabbing"
        >
          <GripVertical className="size-4 opacity-60" /> Save to SuperBrain
        </a>
        <p className="flex-1 text-[13px] leading-relaxed text-ink-3">Drag it to your bookmarks bar. On any page, click it to save that page with an optional note.</p>
      </div>
    </div>
  );
}

function Appearance() {
  const { pref, setPref } = useTheme();
  const options: { v: ThemePref; label: string; icon: React.ElementType }[] = [
    { v: "system", label: "System", icon: Monitor },
    { v: "light", label: "Light", icon: Sun },
    { v: "dark", label: "Dark", icon: Moon },
  ];
  return (
    <div className="inline-flex border border-ink" role="radiogroup" aria-label="Theme">
      {options.map(({ v, label, icon: Icon }) => (
        <button
          key={v}
          role="radio"
          aria-checked={pref === v}
          onClick={() => setPref(v)}
          data-active={pref === v}
          className={cn("wipe flex items-center gap-2 px-4 py-2 text-sm", pref === v ? "text-paper" : "text-ink")}
        >
          <Icon className="size-4" /> {label}
        </button>
      ))}
    </div>
  );
}

function Security() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.account.changePassword(current, next);
      setCurrent("");
      setNext("");
      toast.success("Password changed", { description: "You’ve been signed out on all other devices." });
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, "Could not change password"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md space-y-8">
      <form onSubmit={change} className="space-y-4">
        <div>
          <Label htmlFor="current">Current password</Label>
          <Input id="current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="new" hint="At least 8 characters">New password</Label>
          <Input id="new" type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required invalid={!!error?.fieldError("newPassword")} />
          <FieldError>{error?.fieldError("newPassword") ?? (error && !error.errors ? error.message : undefined)}</FieldError>
        </div>
        <Button type="submit" variant="secondary" loading={saving} disabled={!current || next.length < 8}>
          Change password
        </Button>
      </form>
      <div className="border border-line p-4">
        <p className="text-sm font-medium text-ink">Sign out everywhere</p>
        <p className="mt-1 text-[13px] text-ink-3">Ends every session on every device, including this one.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={async () => {
            await api.auth.signoutAll();
            router.replace("/signin");
          }}
        >
          Sign out of all devices
        </Button>
      </div>
    </div>
  );
}

function YourData() {
  const [reindexing, setReindexing] = useState(false);
  return (
    <div className="max-w-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border border-line bg-card p-4">
        <div>
          <p className="text-[15px] font-medium text-ink">Export everything</p>
          <p className="text-[13px] text-ink-3">All items, full text, notes, tags and conversations as JSON.</p>
        </div>
        <a href={api.account.exportUrl} download>
          <Button variant="secondary" size="sm">
            <Download className="size-3.5" /> Download
          </Button>
        </a>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border border-line bg-card p-4">
        <div>
          <p className="text-[15px] font-medium text-ink">Rebuild search index</p>
          <p className="text-[13px] text-ink-3">Re-embeds your whole library in the background. Rarely needed.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          loading={reindexing}
          onClick={async () => {
            setReindexing(true);
            try {
              const r = await api.content.reindex();
              toast.success(`Re-indexing ${r.queued} items`, { description: "Search keeps working while this runs." });
            } catch (e) {
              toast.error(e instanceof ApiError ? e.message : "Could not start re-indexing");
            } finally {
              setReindexing(false);
            }
          }}
        >
          <RefreshCw className="size-3.5" /> Rebuild
        </Button>
      </div>
    </div>
  );
}

function DangerZone() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="max-w-xl border border-danger p-5">
      <p className="text-[15px] font-medium text-ink">Delete account</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-3">
        Permanently deletes your account, every saved item, uploaded files, search index and conversations. This can’t be undone. Consider exporting first.
      </p>
      <Button variant="danger" size="sm" className="mt-4" onClick={() => setOpen(true)}>
        Delete my account
      </Button>
      <Dialog open={open} onOpenChange={setOpen} title="Delete your account?" description="Everything you’ve saved will be erased immediately. Enter your password to confirm.">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setDeleting(true);
            setError("");
            try {
              await api.account.delete(password);
              router.replace("/?deleted=1");
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Could not delete account");
              setDeleting(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="confirm-password">Password</Label>
            <Input id="confirm-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!error} autoFocus />
            <FieldError>{error}</FieldError>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={deleting} disabled={!password}>
              Delete forever
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export function SettingsView() {
  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 pb-24 pt-8 sm:px-8 lg:pt-12">
      <ScrollRail sections={SETTINGS_SECTIONS} />
      <p className="eyebrow">— Account</p>
      <h1 className="mt-2 font-display text-5xl text-ink sm:text-[64px]">Settings</h1>
      <div className="mt-10">
        <Section id="profile" title="Profile">
          <Profile />
        </Section>
        <Section id="sharing" title="Public page" description="Share a curated reading list, or keep everything private. Private is the default.">
          <Sharing />
        </Section>
        <Section id="capture" title="Capture anywhere" description="Save pages from your browser without opening SuperBrain.">
          <Bookmarklet />
        </Section>
        <Section id="appearance" title="Appearance">
          <Appearance />
        </Section>
        <Section id="security" title="Security">
          <Security />
        </Section>
        <Section id="data" title="Your data" description="It’s yours. Take it with you any time.">
          <YourData />
        </Section>
        <Section id="danger" title="Danger zone">
          <DangerZone />
        </Section>
      </div>
    </div>
  );
}
