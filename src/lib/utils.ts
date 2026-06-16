export function getHighResCoverUrl(url: string | null): string | undefined {
  if (!url) return undefined;
  return url
    .replace(/^http:\/\//i, 'https://')
    .replace(/&edge=curl/i, '');
}
