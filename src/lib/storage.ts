/**
 * Resolve a relative storage path to a URL via the Next.js /storage/ proxy.
 *
 * If the path is already an absolute URL (http/https), it is returned as-is
 * for backward compatibility during migration.
 */
export function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return `/storage/${cleanPath}`;
}
