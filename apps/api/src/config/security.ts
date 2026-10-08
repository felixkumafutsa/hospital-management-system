export const getJwtPrivateKey = (): string => {
  const key = process.env.JWT_PRIVATE_KEY;
  if (key) return key;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_PRIVATE_KEY must be set in production');
  }

  return 'development-only-key-do-not-use-in-production';
};

export const assertProductionConfiguration = (): void => {
  if (process.env.NODE_ENV !== 'production') return;

  const key = process.env.JWT_PRIVATE_KEY;
  if (!key || Buffer.byteLength(key, 'utf8') < 32) {
    throw new Error('Production requires a JWT_PRIVATE_KEY of at least 32 bytes');
  }
};
