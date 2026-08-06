package io.github.jtsato.walletservice.infra.database.domains.wallet.query;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.UUID;
import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

class WalletPredicateBuilderTests {
    @Test void shouldBuildIdEqualsPredicate() { assertNotNull(WalletPredicateBuilder.idEquals(UUID.fromString("11111111-1111-1111-1111-111111111111"))); }
    @Test void shouldRejectNullId() { assertViolation("id", "common.querydsl.wallet.id.required", () -> WalletPredicateBuilder.idEquals(null)); }
    @Test void shouldBuildBalanceEqualsPredicate() { assertNotNull(WalletPredicateBuilder.balanceEquals(new BigDecimal("124.45"))); }
    @Test void shouldRejectNullBalance() { assertViolation("balance", "common.querydsl.wallet.balance.required", () -> WalletPredicateBuilder.balanceEquals(null)); }
    @Test void shouldBuildCurrencyEqualsPredicate() { assertNotNull(WalletPredicateBuilder.currencyEquals("sample-3")); }
    @Test void shouldRejectNullCurrency() { assertViolation("currency", "common.querydsl.wallet.currency.required", () -> WalletPredicateBuilder.currencyEquals(null)); }

    private static void assertViolation(String name, String key, org.junit.jupiter.api.function.Executable executable) { var violation = assertThrows(ValidationException.class, executable).getFields().getFirst(); assertEquals(name, violation.name()); assertEquals(key, violation.messageKey()); }
}
