import { unzipSync, strFromU8 } from "fflate";
import { PLATFORM_THEMES, TEMPLATE_LAYOUTS, type LayoutType, type ThemeDefinition } from "../themes";

/**
 * A template package is a ZIP holding `template.json` (the manifest below) and, optionally,
 * the images it names. Images may also be full https:// links instead of files in the ZIP.
 *
 *   my-template.zip
 *   ├── template.json
 *   ├── preview.jpg   (card image in the seller's theme gallery)
 *   ├── hero.jpg      (opening image on the storefront)
 *   └── gallery-1.jpg (up to 6 extra images the layout uses for collages, promos and interludes)
 */
export const TEMPLATE_FORMAT = "shopper-template@1";

export interface TemplateManifest {
  format: typeof TEMPLATE_FORMAT;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  tier: "free" | "starter" | "pro";
  category: string;
  layout: LayoutType;
  tokens: ThemeDefinition["tokens"];
  previewColors?: string[];
  images?: { preview?: string; hero?: string; gallery?: string[] };
}

export interface ParsedTemplate {
  manifest: TemplateManifest;
  /** image files found inside the ZIP, keyed by role */
  files: { preview?: File; hero?: File; gallery: File[] };
  /** image links given in the manifest instead of files */
  links: { preview?: string; hero?: string; gallery: string[] };
}

export type ParseResult = { ok: true; template: ParsedTemplate } | { ok: false; errors: string[] };

const COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const IMAGE_TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const TOKEN_COLORS: (keyof ThemeDefinition["tokens"])[] = [
  "background",
  "foreground",
  "card",
  "cardForeground",
  "primary",
  "primaryForeground",
  "accent",
  "accentForeground",
  "muted",
  "mutedForeground",
  "border",
];

/** Checks a manifest object and lists everything that's wrong with it. */
export function validateManifest(raw: unknown, existingSlugs: string[] = []): { manifest?: TemplateManifest; errors: string[] } {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") return { errors: ["template.json must contain a JSON object."] };
  const m = raw as Record<string, unknown>;
  const text = (key: string, max: number) => {
    const v = m[key];
    if (typeof v !== "string" || !v.trim()) errors.push(`"${key}" is required.`);
    else if (v.length > max) errors.push(`"${key}" must be ${max} characters or fewer.`);
  };

  if (m.format !== TEMPLATE_FORMAT) errors.push(`"format" must be "${TEMPLATE_FORMAT}".`);
  if (typeof m.slug !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(m.slug) || m.slug.length > 40) {
    errors.push(`"slug" must be lowercase letters, numbers and dashes, like "aurora-showroom".`);
  } else if (PLATFORM_THEMES[m.slug]) {
    errors.push(`"${m.slug}" is a built-in template name. Pick another slug.`);
  } else if (existingSlugs.includes(m.slug)) {
    // re-uploading the same slug replaces that template, which is allowed
  }
  text("name", 40);
  text("tagline", 80);
  text("description", 400);
  text("category", 40);
  if (!["free", "starter", "pro"].includes(m.tier as string)) errors.push(`"tier" must be "free", "starter" or "pro".`);
  if (typeof m.layout !== "string" || !(m.layout in TEMPLATE_LAYOUTS)) {
    errors.push(`"layout" must be one of: ${Object.keys(TEMPLATE_LAYOUTS).join(", ")}.`);
  }

  const tokens = m.tokens as Record<string, unknown> | undefined;
  if (!tokens || typeof tokens !== "object") {
    errors.push(`"tokens" is required.`);
  } else {
    TOKEN_COLORS.forEach((k) => {
      if (typeof tokens[k] !== "string" || !COLOR.test(tokens[k] as string)) errors.push(`"tokens.${k}" must be a hex colour like #1A1A1A.`);
    });
    if (typeof tokens.radius !== "string" || !/^\d{1,2}px$/.test(tokens.radius)) errors.push(`"tokens.radius" must look like "12px".`);
    if (tokens.fontFamily !== undefined && typeof tokens.fontFamily !== "string") errors.push(`"tokens.fontFamily" must be a font name.`);
  }

  if (m.previewColors !== undefined) {
    if (!Array.isArray(m.previewColors) || m.previewColors.some((c) => typeof c !== "string" || !COLOR.test(c))) {
      errors.push(`"previewColors" must be a list of hex colours.`);
    }
  }
  if (m.images !== undefined && (typeof m.images !== "object" || m.images === null)) errors.push(`"images" must be an object.`);
  const gallery = (m.images as Record<string, unknown> | undefined)?.gallery;
  if (gallery !== undefined && (!Array.isArray(gallery) || gallery.length > 6 || gallery.some((g) => typeof g !== "string"))) {
    errors.push(`"images.gallery" must be a list of up to 6 image files or links.`);
  }

  return errors.length ? { errors } : { manifest: m as unknown as TemplateManifest, errors };
}

// File.arrayBuffer() is missing in some older browsers, so fall back to FileReader
function readBytes(file: File): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === "function") return file.arrayBuffer().then((b) => new Uint8Array(b));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/** Reads a template ZIP. Returns the manifest and its images, or the problems found. */
export async function parseTemplateZip(file: File, existingSlugs: string[] = []): Promise<ParseResult> {
  if (!/\.zip$/i.test(file.name)) return { ok: false, errors: ["Upload a .zip file."] };
  if (file.size > 15 * 1024 * 1024) return { ok: false, errors: ["The ZIP is over 15 MB."] };

  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(await readBytes(file));
  } catch {
    return { ok: false, errors: ["That file isn't a readable ZIP."] };
  }

  // allow everything to sit inside one top-level folder
  const names = Object.keys(entries).filter((n) => !n.endsWith("/") && !n.startsWith("__MACOSX/"));
  const manifestPath = names.find((n) => n === "template.json" || /^[^/]+\/template\.json$/.test(n));
  if (!manifestPath) return { ok: false, errors: ["template.json is missing from the ZIP."] };
  const root = manifestPath.slice(0, -"template.json".length);

  let raw: unknown;
  try {
    raw = JSON.parse(strFromU8(entries[manifestPath]));
  } catch {
    return { ok: false, errors: ["template.json isn't valid JSON."] };
  }
  const { manifest, errors } = validateManifest(raw, existingSlugs);
  if (!manifest) return { ok: false, errors };

  const files: ParsedTemplate["files"] = { gallery: [] };
  const links: ParsedTemplate["links"] = { gallery: [] };
  const imageErrors: string[] = [];
  // an image is either an https:// link or a file inside the ZIP
  const resolve = (ref: string, label: string): { link?: string; file?: File } => {
    if (/^https:\/\//.test(ref)) return { link: ref };
    const data = entries[root + ref.replace(/^\.?\//, "")];
    const ext = ref.split(".").pop()?.toLowerCase() || "";
    if (!data) {
      imageErrors.push(`${label} points to "${ref}", which isn't in the ZIP.`);
      return {};
    }
    if (!IMAGE_TYPES[ext]) {
      imageErrors.push(`${label} must be a .jpg, .png or .webp file.`);
      return {};
    }
    return { file: new File([data.slice()], ref.split("/").pop() || `image.${ext}`, { type: IMAGE_TYPES[ext] }) };
  };
  (["preview", "hero"] as const).forEach((role) => {
    const ref = manifest.images?.[role];
    if (!ref) return;
    const { link, file } = resolve(ref, `images.${role}`);
    if (link) links[role] = link;
    if (file) files[role] = file;
  });
  (manifest.images?.gallery || []).forEach((ref, i) => {
    const { link, file } = resolve(ref, `images.gallery[${i}]`);
    if (link) links.gallery.push(link);
    if (file) files.gallery.push(file);
  });
  if (!files.preview && !links.preview) imageErrors.push("images.preview is required (a file in the ZIP or an https:// link).");
  if (imageErrors.length) return { ok: false, errors: imageErrors };

  return { ok: true, template: { manifest, files, links } };
}

/** Turns a manifest plus its hosted image links into a theme the storefront can use. */
export function manifestToTheme(manifest: TemplateManifest, images: { preview?: string; hero?: string; gallery?: string[] }): ThemeDefinition {
  return {
    id: manifest.slug,
    slug: manifest.slug,
    name: manifest.name.trim(),
    tagline: manifest.tagline.trim(),
    description: manifest.description.trim(),
    tier: manifest.tier,
    category: manifest.category.trim(),
    layoutType: manifest.layout,
    previewImage: images.preview,
    heroImage: images.hero || images.preview,
    galleryImages: images.gallery?.length ? images.gallery : undefined,
    previewColors: manifest.previewColors?.length
      ? manifest.previewColors
      : [manifest.tokens.background, manifest.tokens.primary, manifest.tokens.accent, manifest.tokens.foreground],
    tokens: { ...manifest.tokens },
    source: "uploaded",
  };
}
