import { del, put } from "@vercel/blob";

export interface UploadedBlob {
  url: string;
  /** Removes the blob from storage. Useful for cleaning up temporary uploads. */
  delete: () => Promise<void>;
}

/**
 * Uploads a file to Vercel Blob and returns its public URL.
 *
 * Reads the `BLOB_READ_WRITE_TOKEN` env var automatically. A random suffix is
 * appended to avoid collisions between uploads that share a filename.
 */
export async function uploadToBlob(
  pathname: string,
  file: File | Blob,
): Promise<UploadedBlob> {
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return {
    url: blob.url,
    delete: async () => {
      await del(blob.url);
    },
  };
}
