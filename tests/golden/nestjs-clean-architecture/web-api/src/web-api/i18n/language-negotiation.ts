/**
 * Locale negotiation policy.
 *
 * The policy is stated here rather than left to framework defaults, so the
 * language of a response depends only on the request and never on the host's
 * configuration. Every path through this module returns a language the project
 * actually ships a catalog for.
 */

/**
 * The catalogs under `src/web-api/i18n`. Regional tags resolve to their base
 * language, so `pt-BR` and `pt-PT` both select `pt`.
 */
export const SUPPORTED_LANGUAGES = ['en', 'pt'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Used when the header is absent, malformed, or names nothing this project ships. */
export const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

interface WeightedTag {
  readonly language: string;
  readonly quality: number;
  /** Preserves header order so equally weighted tags keep the client's preference. */
  readonly position: number;
}

function isSupported(language: string): language is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(language);
}

function parseQuality(parameters: readonly string[]): number {
  for (const parameter of parameters) {
    const [name, value] = parameter.split('=').map((part) => part.trim());
    if (name !== 'q') continue;
    const quality = Number(value);
    // A malformed q disqualifies the tag rather than defaulting to 1: the client
    // asked for something specific and we cannot tell what.
    if (!Number.isFinite(quality) || quality < 0 || quality > 1) return -1;
    return quality;
  }
  return 1;
}

function parseHeader(header: string): readonly WeightedTag[] {
  return header
    .split(',')
    .map((entry, position): WeightedTag => {
      const [tag, ...parameters] = entry.split(';');
      return {
        language: (tag ?? '').trim().toLowerCase(),
        quality: parseQuality(parameters),
        position,
      };
    })
    .filter((candidate) => candidate.language !== '' && candidate.quality > 0)
    .sort((left, right) =>
      left.quality === right.quality ? left.position - right.position : right.quality - left.quality,
    );
}

/**
 * Chooses the response language for an `Accept-Language` header.
 *
 * Quality weights are honoured, `q=0` means "not acceptable" and excludes a tag,
 * and `*` matches the fallback. An unsupported language is never an error: the
 * request is served in {@link FALLBACK_LANGUAGE} instead.
 */
export function negotiateLanguage(header: string | undefined): SupportedLanguage {
  if (header === undefined || header.trim() === '') return FALLBACK_LANGUAGE;

  for (const candidate of parseHeader(header)) {
    if (candidate.language === '*') return FALLBACK_LANGUAGE;

    const base = candidate.language.split('-')[0] ?? '';
    if (isSupported(base)) return base;
  }

  return FALLBACK_LANGUAGE;
}
