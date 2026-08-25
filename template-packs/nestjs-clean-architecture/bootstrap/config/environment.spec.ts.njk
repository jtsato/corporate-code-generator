import { EnvironmentValidationError, validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  it('applies documented defaults when nothing is set', () => {
    const environment = validateEnvironment({});

    expect(environment.name).toBe('development');
    expect(environment.port).toBe(3000);
    expect(environment.cors.enabled).toBe(false);
    expect(environment.cors.allowCredentials).toBe(false);
    expect(environment.cors.maxAge).toBe(3600);
  });

  it('reads a complete configuration', () => {
    const environment = validateEnvironment({
      NODE_ENV: 'production',
      PORT: '8080',
      CORS_ALLOWED_ORIGINS: 'https://a.example, https://b.example',
      CORS_ALLOWED_METHODS: 'GET,POST',
      CORS_ALLOWED_HEADERS: 'Content-Type',
      CORS_EXPOSED_HEADERS: 'Location',
      CORS_ALLOW_CREDENTIALS: 'true',
      CORS_MAX_AGE: '600',
    });

    expect(environment.name).toBe('production');
    expect(environment.port).toBe(8080);
    expect(environment.cors).toEqual({
      enabled: true,
      allowedOrigins: ['https://a.example', 'https://b.example'],
      allowedMethods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
      exposedHeaders: ['Location'],
      allowCredentials: true,
      maxAge: 600,
    });
  });

  it('treats an empty origin list as CORS disabled', () => {
    expect(validateEnvironment({ CORS_ALLOWED_ORIGINS: '  ,  ' }).cors.enabled).toBe(false);
  });

  it('accepts port zero as a request for an ephemeral port', () => {
    expect(validateEnvironment({ PORT: '0' }).port).toBe(0);
  });

  it.each([
    ['NODE_ENV', { NODE_ENV: 'staging' }],
    ['PORT', { PORT: 'eighty' }],
    ['PORT', { PORT: '70000' }],
    ['CORS_ALLOW_CREDENTIALS', { CORS_ALLOW_CREDENTIALS: 'yes' }],
    ['CORS_MAX_AGE', { CORS_MAX_AGE: '-1' }],
  ])('rejects an invalid %s', (variable, source) => {
    expect(() => validateEnvironment(source)).toThrow(EnvironmentValidationError);
    expect(() => validateEnvironment(source)).toThrow(new RegExp(variable));
  });

  it('rejects credentials together with a wildcard origin', () => {
    expect(() =>
      validateEnvironment({ CORS_ALLOWED_ORIGINS: '*', CORS_ALLOW_CREDENTIALS: 'true' }),
    ).toThrow(/cannot be true/);
  });

  it('reports every problem at once', () => {
    // `expect.assertions` rather than a `fail()` call: jest-circus removed that
    // Jasmine global, and a try/catch with no assertion count would pass silently
    // if validation stopped throwing.
    expect.assertions(1);
    try {
      validateEnvironment({ NODE_ENV: 'staging', PORT: 'eighty', CORS_ALLOW_CREDENTIALS: 'yes' });
    } catch (error) {
      expect((error as EnvironmentValidationError).problems).toHaveLength(3);
    }
  });
});
