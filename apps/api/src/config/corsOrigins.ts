const normalizeOrigin = (value: string): string => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid CORS origin: ${value}`);
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(`CORS_ORIGIN entries must be bare HTTP(S) origins: ${value}`);
  }

  return url.origin;
};

export const parseCorsOrigins = (configuredOrigins: string | undefined): Set<string> =>
  new Set(
    (configuredOrigins || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map(normalizeOrigin),
  );

export const isCorsOriginAllowed = (
  requestOrigin: string | undefined,
  allowedOrigins: Set<string>,
): boolean => {
  if (!requestOrigin) return true;

  try {
    return allowedOrigins.has(normalizeOrigin(requestOrigin));
  } catch {
    return false;
  }
};
