import { loadEnv } from './env';

describe('loadEnv', () => {
  it('uses a dev-only secret outside production', () => {
    const e = loadEnv({ NODE_ENV: 'development' });
    expect(e.JWT_SECRET).toContain('dev-only');
  });

  it('refuses to boot in production without a strong secret and origins', () => {
    expect(() => loadEnv({ NODE_ENV: 'production', JWT_SECRET: 'short' })).toThrow(/JWT_SECRET[\s\S]*ALLOWED_ORIGINS/);
  });

  it('refuses private fetching in production', () => {
    expect(() =>
      loadEnv({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(40), ALLOWED_ORIGINS: 'https://app.example', ALLOW_PRIVATE_FETCH: 'true' }),
    ).toThrow(/ALLOW_PRIVATE_FETCH/);
  });

  it('accepts a valid production config', () => {
    const e = loadEnv({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(40), ALLOWED_ORIGINS: 'https://app.example' });
    expect(e.PORT).toBe(3000);
  });
});
