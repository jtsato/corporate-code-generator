package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.sort;

import io.github.jtsato.walletservice.entrypoint.rest.common.sort.RestSortDefinition;
import io.github.jtsato.walletservice.entrypoint.rest.common.sort.RestSortFieldDefinition;
import java.util.List;

public final class WalletRestSortDefinition {
    private WalletRestSortDefinition() { }
    public static RestSortDefinition create() { return RestSortDefinition.of(List.of(
        RestSortFieldDefinition.of("id", "id"),
        RestSortFieldDefinition.of("balance", "balance")
    )); }
}
