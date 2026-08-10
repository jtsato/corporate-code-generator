package io.github.jtsato.walletservice.smoke;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Locale;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.MessageSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.servlet.LocaleResolver;

@SpringBootTest
@ActiveProfiles("test")
class LocaleNegotiationTests {
    @Autowired private LocaleResolver localeResolver;
    @Autowired private MessageSource messageSource;

    @Test
    void negotiatesSupportedLocaleAndMessage() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Accept-Language", "pt-BR");

        Locale locale = localeResolver.resolveLocale(request);

        assertThat(locale).isEqualTo(Locale.forLanguageTag("pt-BR"));
        assertThat(messageSource.getMessage("common.error.invalid-request", null, "Invalid request.", locale))
            .isEqualTo("Requisição inválida.");
    }

    @Test
    void usesEnglishForUnsupportedAndMissingLocales() {
        MockHttpServletRequest unsupportedRequest = new MockHttpServletRequest();
        unsupportedRequest.addHeader("Accept-Language", "fr-FR");
        assertThat(localeResolver.resolveLocale(unsupportedRequest)).isEqualTo(Locale.ENGLISH);

        MockHttpServletRequest missingRequest = new MockHttpServletRequest();
        Locale locale = localeResolver.resolveLocale(missingRequest);
        assertThat(locale).isEqualTo(Locale.ENGLISH);
        assertThat(messageSource.getMessage("common.error.invalid-request", null, "Invalid request.", locale))
            .isEqualTo("Invalid request.");
    }
}
