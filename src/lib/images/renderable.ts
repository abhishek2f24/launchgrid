/**
 * Guards for merchant image uploads.
 *
 * WHY THIS EXISTS
 *   Every upload picker in the dashboard used `accept="image/*"`. On iOS and
 *   macOS that includes HEIC, which is what you get by photographing something
 *   with an iPhone. A HEIC file uploads perfectly happily — Supabase stores it,
 *   the mime type is an honest `image/heic` — and then renders nowhere,
 *   because no mainstream browser decodes HEIC in an `<img>`.
 *
 *   The merchant sees a blank preview and reports "the upload failed". The
 *   worse case is when they save it anyway: the broken image is then served to
 *   customers, as an invisible UPI QR at checkout or an invisible product
 *   photo on the storefront. Nothing errors. The sale just doesn't happen.
 *
 * WHY DECODING RATHER THAN CHECKING file.type
 *   A mime check cannot catch this, because the mime type is not lying. The
 *   only question that matters is whether a browser can display the file, and
 *   the only reliable way to answer it is to ask a browser to display it.
 *   Decoding also catches truncated downloads and files renamed to .png.
 */

/** Upload ceiling. A QR screenshot or product photo is far below this. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/** Formats every browser we serve can decode. Use for `accept`. */
export const RENDERABLE_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp'

/**
 * Resolves true when the browser can actually decode `file` as an image.
 * Never rejects — a failure to decode is the answer, not an exception.
 */
export function canBrowserRender(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img.naturalWidth > 0 && img.naturalHeight > 0)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(false)
    }
    img.src = url
  })
}

/** Wording shared by every picker, so the advice is identical everywhere. */
export const UNRENDERABLE_IMAGE_MESSAGE =
  "That file can't be displayed as an image in a web browser — iPhone photos saved as HEIC are the usual cause. Open it and save or export as PNG or JPG, then upload again."

export function tooLargeMessage(bytes: number): string {
  return `That image is ${(bytes / 1024 / 1024).toFixed(1)} MB. Please use one under 5 MB.`
}

/**
 * Returns an error message when the file should be rejected, or null when it
 * is safe to upload.
 */
export async function checkUploadableImage(file: File): Promise<string | null> {
  if (file.size > MAX_IMAGE_BYTES) return tooLargeMessage(file.size)
  if (!(await canBrowserRender(file))) return UNRENDERABLE_IMAGE_MESSAGE
  return null
}
