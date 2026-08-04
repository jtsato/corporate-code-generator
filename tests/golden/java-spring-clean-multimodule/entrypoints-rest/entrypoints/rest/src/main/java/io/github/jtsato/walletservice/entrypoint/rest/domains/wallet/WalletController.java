package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet;

import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.common.paging.SortOrder;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsByFilterPageUseCase;
import io.github.jtsato.walletservice.entrypoint.rest.common.filter.RestFilterParser;
import io.github.jtsato.walletservice.entrypoint.rest.common.ResponseStatus;
import io.github.jtsato.walletservice.entrypoint.rest.common.sort.RestSortDefinition;
import io.github.jtsato.walletservice.entrypoint.rest.common.sort.RestSortFieldDefinition;
import io.github.jtsato.walletservice.entrypoint.rest.common.sort.RestSortParser;
import io.github.jtsato.walletservice.entrypoint.rest.common.WalletPageResponse;
import io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.filter.WalletRestFilterDefinition;
import io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.sort.WalletRestSortDefinition;
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
    private final FindWalletsByFilterPageUseCase findWalletsByFilterPageUseCase;

    public WalletController(FindWalletsByFilterPageUseCase findWalletsByFilterPageUseCase) {
        this.findWalletsByFilterPageUseCase = findWalletsByFilterPageUseCase;
    }

    @GetMapping
    @Operation(summary = "Find wallets", description = "Returns all wallets.")
    @Parameter(name = "filter", description = "Filter expression as <field>:<operator>[:<value>]. Repeat to combine with AND. Fields: id (eq, ne, in, isnull, notnull); balance (eq, ne, gt, gte, lt, lte, in, isnull, notnull).", example = "balance:gt:100", array = @ArraySchema(schema = @Schema(type = "string")))
    @Parameter(name = "page", description = "Zero-based page index. Defaults to 0.", schema = @Schema(type = "integer", defaultValue = "0", minimum = "0"))
    @Parameter(name = "size", description = "Number of items per page. Defaults to 20.", schema = @Schema(type = "integer", defaultValue = "20", minimum = "1"))
    @Parameter(name = "sort", description = "Sort expression as <field>:<direction>. Repeat to apply multiple orders in order. Fields: id, balance. Directions: asc, desc.", example = "balance:desc", array = @ArraySchema(schema = @Schema(type = "string")))
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Wallets found", content = @Content(schema = @Schema(implementation = WalletPageResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid filter", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = ResponseStatus.class)))
    })
    public WalletPageResponse findAll(
        @RequestParam(name = "filter", required = false) List<String> filter,
        @RequestParam(name = "page", required = false) Integer page,
        @RequestParam(name = "size", required = false) Integer size,
        @RequestParam(name = "sort", required = false) List<String> sort
    ) {
        FilterExpression expression = RestFilterParser.parse(filter, WalletRestFilterDefinition.create());
        List<SortOrder> sortOrders = RestSortParser.parse(sort, WalletRestSortDefinition.create());
        PageRequest pageRequest = PageRequest.of(
            page == null ? PageRequest.DEFAULT_PAGE : page,
            size == null ? PageRequest.DEFAULT_SIZE : size,
            sortOrders
        );
        PageResult<Wallet> result = findWalletsByFilterPageUseCase.execute(expression, pageRequest);
        List<WalletResponse> items = result.items()
            .stream()
            .map(WalletResponse::from)
            .toList();
        return new WalletPageResponse(items, result.page(), result.size(), result.totalItems(), result.totalPages());
    }
}
