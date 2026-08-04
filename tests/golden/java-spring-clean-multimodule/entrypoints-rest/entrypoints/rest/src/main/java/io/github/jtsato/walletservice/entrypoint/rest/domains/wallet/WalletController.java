package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet;

import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsByFilterUseCase;
import io.github.jtsato.walletservice.entrypoint.rest.common.filter.RestFilterParser;
import io.github.jtsato.walletservice.entrypoint.rest.common.ResponseStatus;
import io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.filter.WalletRestFilterDefinition;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/wallets")
@Tag(name = "Wallets", description = "Wallet operations")
public class WalletController {
    private final FindWalletsByFilterUseCase findWalletsByFilterUseCase;

    public WalletController(FindWalletsByFilterUseCase findWalletsByFilterUseCase) {
        this.findWalletsByFilterUseCase = findWalletsByFilterUseCase;
    }

    @GetMapping
    @Operation(summary = "Find wallets", description = "Returns all wallets.")
    @Parameter(name = "filter", description = "Filter expression as <field>:<operator>[:<value>]. Repeat to combine with AND. Fields: id (eq, ne, in, isnull, notnull); balance (eq, ne, gt, gte, lt, lte, in, isnull, notnull).", example = "balance:gt:100", array = @ArraySchema(schema = @Schema(type = "string")))
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Wallets found"),
        @ApiResponse(responseCode = "400", description = "Invalid filter", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = ResponseStatus.class)))
    })
    public List<WalletResponse> findAll(@RequestParam(name = "filter", required = false) List<String> filter) {
        FilterExpression expression = RestFilterParser.parse(filter, WalletRestFilterDefinition.create());
        return findWalletsByFilterUseCase.execute(expression)
            .stream()
            .map(WalletResponse::from)
            .toList();
    }
}
