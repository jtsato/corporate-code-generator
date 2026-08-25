import { ExecutionContext, Injectable } from '@nestjs/common';
import { I18nResolver } from 'nestjs-i18n';

import { negotiateLanguage } from './language-negotiation';

/**
 * Resolves the request language through the project's own negotiation policy.
 *
 * This replaces `nestjs-i18n`'s `AcceptLanguageResolver`, which hands the raw
 * header through and leaves the outcome for an unsupported tag to library
 * fallback rules. Deciding here means the resolved language is always one this
 * project ships a catalog for, and the decision is unit-tested without a running
 * application.
 */
@Injectable()
export class SupportedLanguageResolver implements I18nResolver {
  public resolve(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest<{ headers?: Record<string, unknown> }>();
    const header = request?.headers?.['accept-language'];

    // Node collapses repeated headers into an array; a comma join restores the
    // single-header form the negotiation policy parses.
    return negotiateLanguage(Array.isArray(header) ? header.join(',') : (header as string | undefined));
  }
}
