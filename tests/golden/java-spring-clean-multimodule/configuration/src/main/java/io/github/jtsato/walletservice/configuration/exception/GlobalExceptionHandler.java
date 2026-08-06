package io.github.jtsato.walletservice.configuration.exception;

import io.github.jtsato.walletservice.entrypoint.rest.common.ResponseStatus;
import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ConflictException;
import io.github.jtsato.walletservice.core.common.exception.NotFoundException;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private final MessageSource messageSource;
    public GlobalExceptionHandler(MessageSource messageSource) { this.messageSource = messageSource; }

    @ExceptionHandler(ValidationException.class)
    ResponseEntity<ResponseStatus> handleValidationException(ValidationException exception, Locale locale) {
        List<ResponseStatus.Field> fields = exception.getFields().stream().map(field -> toField(field, locale)).toList();
        return response(HttpStatus.BAD_REQUEST, resolveMessage(exception.getMessageKey(), exception.getDefaultMessage(), locale), fields);
    }

    @ExceptionHandler(NotFoundException.class)
    ResponseEntity<ResponseStatus> handleNotFoundException(NotFoundException exception, Locale locale) {
        return response(HttpStatus.NOT_FOUND, resolveMessage(exception.getMessageKey(), exception.getDefaultMessage(), locale), List.of());
    }

    @ExceptionHandler(ConflictException.class)
    ResponseEntity<ResponseStatus> handleConflictException(ConflictException exception, Locale locale) {
        return response(HttpStatus.CONFLICT, resolveMessage(exception.getMessageKey(), exception.getDefaultMessage(), locale), List.of());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ResponseStatus> handleHttpMessageNotReadableException(HttpMessageNotReadableException exception, Locale locale) {
        return response(HttpStatus.BAD_REQUEST, resolveMessage("common.error.invalid-request", "Invalid request.", locale), List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ResponseStatus> handleMethodArgumentNotValidException(MethodArgumentNotValidException exception, Locale locale) {
        List<ResponseStatus.Field> fields = exception.getBindingResult().getFieldErrors().stream()
            .map(error -> new ResponseStatus.Field(error.getField(), error.getDefaultMessage()))
            .sorted(Comparator.comparing(ResponseStatus.Field::name).thenComparing(ResponseStatus.Field::message))
            .toList();
        return response(HttpStatus.BAD_REQUEST, resolveMessage("common.error.invalid-request", "Invalid request.", locale), fields);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ResponseStatus> handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException exception, Locale locale) {
        List<ResponseStatus.Field> fields = List.of(new ResponseStatus.Field(exception.getName(), "Invalid value."));
        return response(HttpStatus.BAD_REQUEST, resolveMessage("common.error.invalid-request", "Invalid request.", locale), fields);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ResponseStatus> handleUnexpectedException(Exception exception, Locale locale) {
        return response(HttpStatus.INTERNAL_SERVER_ERROR, resolveMessage("common.error.internal-server-error", "Internal server error.", locale), List.of());
    }

    private ResponseStatus.Field toField(FieldViolation field, Locale locale) { return new ResponseStatus.Field(field.name(), resolveMessage(field.messageKey(), field.defaultMessage(), locale)); }
    private String resolveMessage(String key, String defaultMessage, Locale locale) { return messageSource.getMessage(key, null, defaultMessage, locale); }
    private ResponseEntity<ResponseStatus> response(HttpStatus status, String message, List<ResponseStatus.Field> fields) { return ResponseEntity.status(status).body(new ResponseStatus(status.value(), message, fields)); }
}
