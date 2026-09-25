# App assets — where to put screenshots and icons

App pages read this directory **at build time**. Drop files in the right place,
redeploy, and the page picks them up. No code change is needed.

## Layout

```
public/apps/<slug>/
  icon.png                    512 × 512   app icon
  feature.png                1024 × 500   feature graphic (used as the OG image)
  screenshots/
    01-home.png                           sorted by filename
    02-editor.png
    03-schedule.png
```

`<slug>` must match the slug in `src/data/apps.ts`:

`gst-sahayak` · `kinly` · `nyayai` · `whatsapp` · `medicine` · `periods` · `water`

## Rules that actually matter

**Zero-pad the numbers.** Sorting is lexicographic, so `10-x.png` sorts *before*
`2-x.png`. Use `01`, `02`, … `10`.

**The filename becomes the alt text.** `02-safety-check-in.png` renders as
"SendLater — Safety check in". Name files after what the screen shows, not
`Screenshot_20260925_101433.png`. This is the accessible name *and* what an
image search indexes, so it is worth ten seconds.

**Use the Play Store assets you already made.** Play requires the longer side to
be at most twice the shorter side (e.g. 1080 × 2160). The same files work here.

**`.png`, `.jpg` or `.webp`.** Anything else is ignored.

## What happens with no assets

The page still renders and is still indexable — it falls back to a line icon and
omits the screenshot strip entirely. There are no broken images and no empty
frames, so publishing before the assets exist is safe.

## Metrics — read before filling them in

`rating`, `ratingCount` and `installs` in `src/data/apps.ts` must be the **real
figures from Play Console**, or left undefined.

When a rating is present the page emits schema.org `aggregateRating`, which
Google treats as a factual claim about your product. An invented rating is a
structured-data policy violation and can earn a manual action — which would bury
these pages instead of ranking them. This repo already shipped one invented
`aggregateRating` (4.9 from "142 reviews", with no review system behind it); it
was removed for exactly this reason.

Undefined is always safe. The page simply omits the block.

## The privacy policies are not in here

They live at `/apps/<slug>/privacy-policy.html` and are already submitted to
Google Play. Some are static files in this directory, some are route handlers
under `src/app/apps/`. **Do not move or rename them** — the URLs are referenced
from live Play Console listings.
