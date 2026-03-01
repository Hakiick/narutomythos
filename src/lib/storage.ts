/**
 * Resolve a relative storage path to a full URL.
 *
 * If the path is already an absolute URL (http/https), it is returned as-is
 * for backward compatibility during migration.
 */
export function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const base = process.env.NEXT_PUBLIC_STORAGE_URL;
  if (!base) return null;

  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return `${cleanBase}/${cleanPath}`;
}
