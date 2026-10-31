import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { zipSync, strToU8 } from "fflate";

// fflate checks `instanceof Uint8Array`; wrap its output in this realm's Uint8Array so jsdom treats it as file data
const bytes = (text: string) => new Uint8Array(strToU8(text));
import { parseTemplateZip, manifestToTheme, validateManifest } from "@/lib/templates/package";
import { getAllThemes, getTheme, registerUploadedThemes, PLATFORM_THEMES, TEMPLATE_LAYOUTS } from "@/lib/themes";
import { isThemeAllowed } from "@/lib/plans";

const zipFile = (name: string, entries: Record<string, Uint8Array>) => new File([zipSync(entries).slice()], name, { type: "application/zip" });
const manifest = (overrides: Record<string, unknown> = {}) =>
  JSON.parse(readFileSync(join(process.cwd(), "templates/aurora-showroom/template.json"), "utf8")) as Record<string, unknown> & typeof overrides;

describe("Template packages", () => {
  afterEach(() => registerUploadedThemes([]));

  it("reads each bundled template ZIP and uses a distinct layout", async () => {
    const slugs = ["aurora-showroom", "folio-catalogue", "bazaar-market", "atelier-gallery"];
    const layouts = new Set<string>();
    for (const slug of slugs) {
      const bytes = readFileSync(join(process.cwd(), "templates", slug, "template.json"));
      const res = await parseTemplateZip(zipFile(`${slug}.zip`, { "template.json": new Uint8Array(bytes) }));
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.template.manifest.slug).toBe(slug);
        expect(res.template.links.preview).toMatch(/^https:\/\//);
        expect(res.template.links.hero).toMatch(/^https:\/\//);
        expect(res.template.links.gallery.length).toBe(3);
        layouts.add(res.template.manifest.layout);
      }
    }
    expect(layouts.size).toBe(slugs.length);
  });

  it("accepts images packed inside the ZIP, even under a top-level folder", async () => {
    const m = { ...manifest(), images: { preview: "preview.png", hero: "img/hero.jpg" } };
    const res = await parseTemplateZip(
      zipFile("pack.zip", {
        "pack/template.json": bytes(JSON.stringify(m)),
        "pack/preview.png": new Uint8Array([137, 80, 78, 71]),
        "pack/img/hero.jpg": new Uint8Array([255, 216, 255]),
      })
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.template.files.preview?.type).toBe("image/png");
      expect(res.template.files.hero?.type).toBe("image/jpeg");
    }
  });

  it("gives every bundled template its own photos", () => {
    const seen = new Set<string>();
    for (const slug of ["aurora-showroom", "folio-catalogue", "bazaar-market", "atelier-gallery"]) {
      const m = JSON.parse(readFileSync(join(process.cwd(), "templates", slug, "template.json"), "utf8"));
      const photos: string[] = [m.images.preview, m.images.hero, ...m.images.gallery].map((u: string) => u.split("?")[0]);
      photos.forEach((u) => {
        expect(seen.has(u)).toBe(false);
        seen.add(u);
      });
    }
  });

  it("explains what's wrong with a broken package", async () => {
    const noManifest = await parseTemplateZip(zipFile("x.zip", { "readme.txt": bytes("hi") }));
    expect(noManifest).toEqual({ ok: false, errors: ["template.json is missing from the ZIP."] });

    const missingImage = await parseTemplateZip(
      zipFile("x.zip", { "template.json": bytes(JSON.stringify({ ...manifest(), images: { preview: "nope.jpg" } })) })
    );
    expect(missingImage.ok).toBe(false);
    if (!missingImage.ok) expect(missingImage.errors[0]).toContain("isn't in the ZIP");

    expect((await parseTemplateZip(new File(["x"], "theme.rar"))).ok).toBe(false);

    const { errors } = validateManifest({ ...manifest(), slug: "Bad Slug", layout: "carousel", tier: "gold", tokens: { radius: "big" } });
    expect(errors.some((e) => e.startsWith('"slug"'))).toBe(true);
    expect(errors.some((e) => e.startsWith('"layout"'))).toBe(true);
    expect(errors.some((e) => e.startsWith('"tier"'))).toBe(true);
    expect(errors.some((e) => e.startsWith('"tokens.primary"'))).toBe(true);
    expect(errors.some((e) => e.startsWith('"tokens.radius"'))).toBe(true);
  });

  it("refuses to overwrite a built-in template", () => {
    const { errors } = validateManifest({ ...manifest(), slug: "classic-bloom" });
    expect(errors[0]).toContain("built-in");
  });

  it("makes published templates resolvable and gates them by plan tier", () => {
    const m = validateManifest({ ...manifest(), slug: "growth-only", tier: "starter" }).manifest!;
    registerUploadedThemes([manifestToTheme(m, { preview: "https://example.com/p.jpg" })]);

    expect(getTheme("growth-only").name).toBe("Aurora Showroom");
    expect(getTheme("growth-only").layoutType).toBe("showroom-split");
    expect(getAllThemes().map((t) => t.slug)).toContain("growth-only");
    expect(isThemeAllowed("growth-only", "free")).toBe(false);
    expect(isThemeAllowed("growth-only", "starter")).toBe(true);
    expect(isThemeAllowed("growth-only", "pro")).toBe(true);

    // unpublishing removes it; stores on it fall back to the default template
    registerUploadedThemes([]);
    expect(getTheme("growth-only").slug).toBe("classic-bloom");
  });

  it("keeps one built-in template per layout (no colour-only duplicates)", () => {
    const layouts = Object.values(PLATFORM_THEMES).map((t) => t.layoutType || "editorial");
    expect(new Set(layouts).size).toBe(layouts.length);
    layouts.forEach((l) => expect(l in TEMPLATE_LAYOUTS).toBe(true));
  });
});
