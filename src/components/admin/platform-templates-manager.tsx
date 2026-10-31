"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, FileArchive, Loader2, Trash2, UploadCloud, X } from "lucide-react";
import { storeService, type PlatformTemplate } from "@/lib/store-service";
import { PLATFORM_THEMES, TEMPLATE_LAYOUTS } from "@/lib/themes";
import { parseTemplateZip, TEMPLATE_FORMAT, type ParsedTemplate } from "@/lib/templates/package";

const TIER_LABEL = { free: "Free", starter: "Growth", pro: "Pro" } as const;

/** Admin: upload storefront templates as ZIP packages and publish them to every seller. */
export function PlatformTemplatesManager() {
  const [templates, setTemplates] = useState<PlatformTemplate[]>([]);
  const [pending, setPending] = useState<{ parsed: ParsedTemplate; fileName: string; previewUrl?: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sync = () => setTemplates([...storeService.getPlatformTemplates()]);
    sync();
    return storeService.subscribe(sync);
  }, []);

  // show the image that will be used on the seller's card before uploading
  useEffect(() => {
    return () => {
      if (pending?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(pending.previewUrl);
    };
  }, [pending]);

  const pick = async (file?: File | null) => {
    setErrors([]);
    setPending(null);
    if (!file) return;
    const res = await parseTemplateZip(file, templates.map((t) => t.id));
    if (inputRef.current) inputRef.current.value = "";
    if (!res.ok) return setErrors(res.errors);
    const { files, links } = res.template;
    setPending({
      parsed: res.template,
      fileName: file.name,
      previewUrl: files.preview ? URL.createObjectURL(files.preview) : links.preview,
    });
  };

  const upload = async (publish: boolean) => {
    if (!pending) return;
    setBusy(true);
    try {
      await storeService.addPlatformTemplate(pending.parsed, pending.fileName, publish);
      setPending(null);
    } catch (err) {
      console.error(err);
      setErrors(["Couldn't save the template. Try again."]);
    } finally {
      setBusy(false);
    }
  };

  const replacing = pending && templates.some((t) => t.id === pending.parsed.manifest.slug);
  const publishedCount = useMemo(() => templates.filter((t) => t.status === "published").length, [templates]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">Storefront templates</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Upload templates as ZIP packages. Published ones appear in every seller&apos;s Themes page, next to the{" "}
            {Object.keys(PLATFORM_THEMES).length} built-in templates.
          </p>
        </div>
        <span className="text-xs font-semibold text-neutral-500">
          {publishedCount} published · {templates.length - publishedCount} draft
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Upload */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 space-y-4">
          {!pending ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pick(e.dataTransfer.files?.[0]);
              }}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center cursor-pointer hover:border-neutral-500 transition-colors"
            >
              <FileArchive className="w-8 h-8 text-neutral-500" />
              <span className="text-sm font-semibold text-neutral-800">Click or drop a template .zip</span>
              <span className="text-xs text-neutral-500">It&apos;s checked before anything is uploaded</span>
            </div>
          ) : (
            <TemplateReview pending={pending} />
          )}
          <input ref={inputRef} type="file" accept=".zip,application/zip" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />

          {errors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <span className="flex items-center gap-2 text-sm font-semibold text-red-700">
                <AlertTriangle className="w-4 h-4" />
                This package can&apos;t be uploaded yet
              </span>
              <ul className="mt-2 list-disc pl-6 space-y-1 text-xs text-red-700">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {pending && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                disabled={busy}
                className="h-10 px-4 rounded-lg border border-neutral-200 text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:border-neutral-900"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={() => upload(false)}
                disabled={busy}
                className="h-10 px-4 rounded-lg border border-neutral-300 text-sm font-semibold hover:border-neutral-900 sm:ml-auto"
              >
                Save as draft
              </button>
              <button
                type="button"
                onClick={() => upload(true)}
                disabled={busy}
                className="h-10 px-5 rounded-lg bg-neutral-900 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-black disabled:opacity-60"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                {busy ? "Uploading…" : replacing ? "Replace & publish" : "Upload & publish"}
              </button>
            </div>
          )}
        </div>

        {/* Format guide */}
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6 text-sm">
          <span className="font-bold text-neutral-900">Package format</span>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-neutral-900 p-3 text-[11px] leading-relaxed text-neutral-100">{`my-template.zip
├── template.json
├── preview.jpg   (gallery card)
└── hero.jpg      (storefront hero)`}</pre>
          <p className="mt-3 text-xs text-neutral-600">
            <code className="font-mono">template.json</code> sets <code className="font-mono">format</code> to{" "}
            <code className="font-mono">{TEMPLATE_FORMAT}</code> and gives the slug, name, tagline, description, category, tier
            (free, starter or pro), colours, radius, font and one of these layouts:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-neutral-600">
            {Object.entries(TEMPLATE_LAYOUTS).map(([id, text]) => (
              <li key={id}>
                <code className="font-mono font-semibold text-neutral-800">{id}</code>: {text}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-neutral-500">Re-uploading a package with the same slug replaces that template.</p>
        </div>
      </div>

      {/* Uploaded templates */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-neutral-900">Uploaded templates ({templates.length})</h3>
        {templates.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
            No templates uploaded yet. Sellers see the built-in templates until you publish one.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map((t) => (
              <TemplateRow key={t.id} template={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateReview({ pending }: { pending: { parsed: ParsedTemplate; fileName: string; previewUrl?: string } }) {
  const m = pending.parsed.manifest;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
        <CheckCircle2 className="w-4 h-4" />
        {pending.fileName} looks good
      </div>
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <div className="aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100">
          {pending.previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pending.previewUrl} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="space-y-2 text-sm">
          <span className="block text-lg font-bold text-neutral-900">{m.name}</span>
          <span className="block text-neutral-600">{m.tagline}</span>
          <dl className="grid grid-cols-[90px_1fr] gap-y-1 text-xs">
            <dt className="text-neutral-500">Slug</dt>
            <dd className="font-mono">{m.slug}</dd>
            <dt className="text-neutral-500">Layout</dt>
            <dd className="font-mono">{m.layout}</dd>
            <dt className="text-neutral-500">Plan</dt>
            <dd>{TIER_LABEL[m.tier]}</dd>
            <dt className="text-neutral-500">Category</dt>
            <dd>{m.category}</dd>
            <dt className="text-neutral-500">Font</dt>
            <dd>{m.tokens.fontFamily || "Default"}</dd>
          </dl>
          <div className="flex gap-1.5 pt-1">
            {[m.tokens.background, m.tokens.foreground, m.tokens.primary, m.tokens.accent, m.tokens.muted].map((c, i) => (
              <span key={i} className="w-6 h-6 rounded-full border border-neutral-200" style={{ background: c }} title={c} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateRow({ template }: { template: PlatformTemplate }) {
  const t = template.theme;
  const live = template.status === "published";
  const inUse = storeService.countStoresUsingTheme(t.slug);
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="relative aspect-[16/10] bg-neutral-100">
        {t.previewImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.previewImage} alt="" className="w-full h-full object-cover" />
        )}
        <span
          className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            live ? "bg-emerald-500 text-white" : "bg-white/90 text-neutral-700"
          }`}
        >
          {live ? "Published" : "Draft"}
        </span>
      </div>
      <div className="p-3 space-y-1">
        <span className="block text-sm font-bold text-neutral-900 truncate">{t.name}</span>
        <span className="block text-[11px] text-neutral-500 truncate">
          {t.layoutType} · {TIER_LABEL[t.tier]} · {inUse} store{inUse === 1 ? "" : "s"} using it
        </span>
      </div>
      <div className="flex gap-2 px-3 pb-3">
        <button
          type="button"
          onClick={() => storeService.setPlatformTemplateStatus(template.id, live ? "draft" : "published")}
          className="flex-1 h-9 rounded-lg border border-neutral-200 text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:border-neutral-900"
        >
          {live ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {live ? "Unpublish" : "Publish"}
        </button>
        <button
          type="button"
          aria-label={`Delete ${t.name}`}
          onClick={() => {
            const note = inUse ? ` ${inUse} store${inUse === 1 ? " uses" : "s use"} it and will switch to Lume Editorial.` : "";
            if (confirm(`Delete "${t.name}"?${note}`)) storeService.deletePlatformTemplate(template.id);
          }}
          className="h-9 w-9 rounded-lg border border-neutral-200 text-neutral-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
