import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES, negotiateLanguage } from './language-negotiation';

describe('negotiateLanguage', () => {
  it('falls back when the header is absent or empty', () => {
    expect(negotiateLanguage(undefined)).toBe(FALLBACK_LANGUAGE);
    expect(negotiateLanguage('')).toBe(FALLBACK_LANGUAGE);
    expect(negotiateLanguage('   ')).toBe(FALLBACK_LANGUAGE);
  });

  it.each(SUPPORTED_LANGUAGES)('selects the supported language %s', (language) => {
    expect(negotiateLanguage(language)).toBe(language);
  });

  it('resolves a regional tag to its base language', () => {
    expect(negotiateLanguage('pt-BR')).toBe('pt');
    expect(negotiateLanguage('pt-PT')).toBe('pt');
    expect(negotiateLanguage('en-GB')).toBe('en');
  });

  it('is case insensitive', () => {
    expect(negotiateLanguage('PT-br')).toBe('pt');
  });

  it('falls back for a language with no catalog, rather than failing', () => {
    expect(negotiateLanguage('fr-FR')).toBe(FALLBACK_LANGUAGE);
    expect(negotiateLanguage('de, ja, zh-Hans')).toBe(FALLBACK_LANGUAGE);
  });

  it('honours quality weights over header order', () => {
    expect(negotiateLanguage('en;q=0.4, pt;q=0.9')).toBe('pt');
    expect(negotiateLanguage('pt;q=0.2, en;q=0.8')).toBe('en');
  });

  it('keeps client order when weights tie', () => {
    expect(negotiateLanguage('pt, en')).toBe('pt');
    expect(negotiateLanguage('en, pt')).toBe('en');
    expect(negotiateLanguage('pt;q=0.5, en;q=0.5')).toBe('pt');
  });

  it('skips an unsupported language that outranks a supported one', () => {
    expect(negotiateLanguage('fr;q=1.0, pt;q=0.1')).toBe('pt');
  });

  it('treats q=0 as not acceptable', () => {
    expect(negotiateLanguage('pt;q=0, en;q=0.5')).toBe('en');
    expect(negotiateLanguage('pt;q=0')).toBe(FALLBACK_LANGUAGE);
  });

  it('disqualifies a tag whose quality is malformed', () => {
    expect(negotiateLanguage('pt;q=high, en')).toBe('en');
    expect(negotiateLanguage('pt;q=7, en')).toBe('en');
  });

  it('matches the wildcard to the fallback', () => {
    expect(negotiateLanguage('*')).toBe(FALLBACK_LANGUAGE);
    expect(negotiateLanguage('pt;q=0.9, *;q=0.1')).toBe('pt');
  });

  it('ignores empty entries and stray whitespace', () => {
    expect(negotiateLanguage(' , , pt-BR , ')).toBe('pt');
  });

  it('only ever returns a language the project ships a catalog for', () => {
    const headers = ['fr', '*', 'xx-YY;q=1', '', 'pt-BR;q=0.3, ja;q=0.9'];

    for (const header of headers) {
      expect(SUPPORTED_LANGUAGES).toContain(negotiateLanguage(header));
    }
  });
});
