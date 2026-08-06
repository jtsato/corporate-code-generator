package io.github.jtsato.walletservice.configuration.exception;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ConflictException;
import io.github.jtsato.walletservice.core.common.exception.NotFoundException;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.List;
import java.util.Locale;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.http.converter.HttpMessageNotReadableException;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class GlobalExceptionHandlerTests {
    @Autowired private GlobalExceptionHandler handler;

    @Test void translatesValidationFieldsInOrderAndLocale() {
        var response = handler.handleValidationException(new ValidationException("common.error.invalid-request", "Invalid request.", List.of(new FieldViolation("balance", "common.error.not-found", "Resource not found."), new FieldViolation("id", "common.error.invalid-request", "Invalid request."))), Locale.forLanguageTag("pt-BR"));
        assertThat(response.getBody().code()).isEqualTo(400);
        assertThat(response.getBody().message()).isEqualTo("Requisição inválida.");
        assertThat(response.getBody().fields()).extracting(field -> field.name()).containsExactly("balance", "id");
        assertThat(response.getBody().fields()).extracting(field -> field.message()).containsExactly("Recurso não encontrado.", "Requisição inválida.");
    }

    @Test void translatesNotFoundAndUnexpectedExceptions() {
        assertThat(handler.handleNotFoundException(new NotFoundException("common.error.not-found", "Resource not found."), Locale.ENGLISH).getBody().code()).isEqualTo(404);
        assertThat(handler.handleUnexpectedException(new RuntimeException(), Locale.ENGLISH).getBody().code()).isEqualTo(500);
    }

    @Test void translatesConflictAndUnreadableBody() {
        var conflict = handler.handleConflictException(new ConflictException("wallet.already-exists", "Wallet already exists."), Locale.ENGLISH);
        assertThat(conflict.getBody().code()).isEqualTo(409);
        assertThat(conflict.getBody().message()).isEqualTo("Wallet already exists.");

        var invalidBody = handler.handleHttpMessageNotReadableException(new HttpMessageNotReadableException("invalid", null), Locale.ENGLISH);
        assertThat(invalidBody.getBody().code()).isEqualTo(400);
        assertThat(invalidBody.getBody().message()).isEqualTo("Invalid request.");
    }
}
