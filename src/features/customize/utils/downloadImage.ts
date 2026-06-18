/**
 * Downloads a remote image to the user's device.
 *
 * Tries to fetch the image as a blob first (which forces a real download and
 * lets us name the file). If that fails — typically a cross-origin host without
 * permissive CORS headers — it falls back to opening the image in a new tab so
 * the user can still save it manually.
 */
export async function downloadImage(
  url: string,
  fileName: string,
): Promise<void> {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) {
      throw new Error(`Failed to fetch image (${response.status})`);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    triggerDownload(objectUrl, fileName);
    URL.revokeObjectURL(objectUrl);
  } catch {
    // CORS or network failure — open in a new tab as a graceful fallback.
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function triggerDownload(href: string, fileName: string): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
