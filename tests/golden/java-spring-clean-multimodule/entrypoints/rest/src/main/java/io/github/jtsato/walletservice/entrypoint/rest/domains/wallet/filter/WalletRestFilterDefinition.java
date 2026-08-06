package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.filter;

import io.github.jtsato.walletservice.entrypoint.rest.common.filter.RestFilterDefinition;
import io.github.jtsato.walletservice.entrypoint.rest.common.filter.RestFilterFieldDefinition;
import io.github.jtsato.walletservice.entrypoint.rest.common.filter.RestFilterOperator;
import java.util.List;

public final class WalletRestFilterDefinition {
    private WalletRestFilterDefinition() { }
    public static RestFilterDefinition create() { return RestFilterDefinition.of(List.of(
        RestFilterFieldDefinition.of("id", "id", List.of(RestFilterOperator.EQ, RestFilterOperator.NE, RestFilterOperator.IN, RestFilterOperator.IS_NULL, RestFilterOperator.NOT_NULL)),
        RestFilterFieldDefinition.of("balance", "balance", List.of(RestFilterOperator.EQ, RestFilterOperator.NE, RestFilterOperator.GT, RestFilterOperator.GTE, RestFilterOperator.LT, RestFilterOperator.LTE, RestFilterOperator.IN, RestFilterOperator.IS_NULL, RestFilterOperator.NOT_NULL))
    )); }
}
