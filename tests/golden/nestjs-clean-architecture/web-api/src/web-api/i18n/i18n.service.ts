import { messages } from './messages';

export type SupportedLocale = keyof typeof messages;

export class I18nService {
  public locale(header: string | string[] | undefined): SupportedLocale {
    const value = Array.isArray(header) ? header[0] : header;
    return value !== undefined && /^pt(?:-|$)/i.test(value.trim()) ? 'pt' : 'en';
  }

  public translate(key: keyof typeof messages.en, header: string | string[] | undefined): string {
    return messages[this.locale(header)][key];
  }
}
