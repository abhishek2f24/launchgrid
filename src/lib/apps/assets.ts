import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Finds an app's images on disk at build time.
 *
 * WHY READ THE FILESYSTEM RATHER THAN LIST FILES IN THE REGISTRY
 *   Screenshots arrive in batches, get replaced, and get reordered. A hardcoded
 *   list in apps.ts would mean every asset drop needs a matching code edit, and
 *   the first time someone forgets, the page renders a broken image — which is
 *   worse than no image. Reading the directory means dropping files in is the
 *   whole job.
 *
 *   This runs only during the build (these are server components on statically
 *   prerendered routes), so it costs nothing at request time and cannot fail
 *   for a visitor.
 *
 * NAMING
 *   public/apps/<slug>/icon.png                  — 512×512 app icon
 *   public/apps/<slug>/feature.png               — 1024×500 feature graphic
 *   public/apps/<slug>/screenshots/01-home.png   — sorted by filename
 *
 *   Number the screenshots. Sorting is lexicographic, so `10-x.png` sorts
 *   before `2-x.png` unless you zero-pad.
 */

const PUBLIC_DIR = join(process.cwd(), 'public');
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp)$/i;

/** Turns `01-home-screen.png` into `Home screen` for the alt text. */
function labelFromFilename(filename: string): string {
  const base = filename
    .replace(IMAGE_EXTENSIONS, '')
    .replace(/^\d+[-_]?/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
  if (!base) return 'Screenshot';
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export interface AppScreenshot {
  src: string;
  alt: string;
}

export function appScreenshots(slug: string, appName: string): AppScreenshot[] {
  const dir = join(PUBLIC_DIR, 'apps', slug, 'screenshots');
  if (!existsSync(dir)) return [];

  try {
    return readdirSync(dir)
      .filter((file) => IMAGE_EXTENSIONS.test(file))
      .sort()
      .map((file) => ({
        src: `/apps/${slug}/screenshots/${file}`,
        alt: `${appName} — ${labelFromFilename(file)}`,
      }));
  } catch {
    // A missing or unreadable directory means no screenshots, not a broken build.
    return [];
  }
}

/** Returns the icon path, or null when none has been added yet. */
export function appIcon(slug: string): string | null {
  for (const extension of ['png', 'webp', 'jpg']) {
    const relative = `/apps/${slug}/icon.${extension}`;
    if (existsSync(join(PUBLIC_DIR, relative))) return relative;
  }
  return null;
}

/** Returns the feature graphic path, or null when none has been added yet. */
export function appFeatureGraphic(slug: string): string | null {
  for (const extension of ['png', 'webp', 'jpg']) {
    const relative = `/apps/${slug}/feature.${extension}`;
    if (existsSync(join(PUBLIC_DIR, relative))) return relative;
  }
  return null;
}
