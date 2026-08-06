package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet;

import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.common.paging.SortOrder;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.create.CreateWalletUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletByIdUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsByFilterPageUseCase;
import io.github.jtsato.walletservice.entrypoint.rest.common.filter.RestFilterParser;
import io.github.jtsato.walletservice.entrypoint.rest.common.ResponseStatus;
import io.github.jtsato.walletservice.entrypoint.rest.common.sort.RestSortParser;
import io.github.jtsato.walletservice.entrypoint.rest.common.WalletPageResponse;
import io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.filter.WalletRestFilterDefinition;
import io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.request.CreateWalletRequest;
import io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.sort.WalletRestSortDefinition;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/wallets")
@Tag(name = "Wallets", description = "Wallet operations")
public class WalletController {
    private final FindWalletsByFilterPageUseCase findWalletsByFilterPageUseCase;
    private final FindWalletByIdUseCase findWalletByIdUseCase;
    private final CreateWalletUseCase createWalletUseCase;

    public WalletController(FindWalletsByFilterPageUseCase findWalletsByFilterPageUseCase, FindWalletByIdUseCase findWalletByIdUseCase, CreateWalletUseCase createWalletUseCase) {
        this.findWalletsByFilterPageUseCase = findWalletsByFilterPageUseCase;
        this.findWalletByIdUseCase = findWalletByIdUseCase;
        this.createWalletUseCase = createWalletUseCase;
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

    @GetMapping("/{id}")
    @Operation(summary = "Find wallet by id", description = "Returns a wallet by its identifier.")
    @Parameter(name = "id", in = ParameterIn.PATH, required = true, schema = @Schema(type = "string", format = "uuid"))
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Wallet found", content = @Content(schema = @Schema(implementation = WalletResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid identifier", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "404", description = "Wallet not found", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = ResponseStatus.class)))
    })
    public WalletResponse findById(@PathVariable UUID id) {
        Wallet result = findWalletByIdUseCase.execute(id);
        return WalletResponse.from(result);
    }

    @PostMapping
    @Operation(summary = "Create wallet", description = "Creates a wallet.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Wallet created", headers = @Header(name = "Location", description = "Location of the created resource", schema = @Schema(type = "string")), content = @Content(schema = @Schema(implementation = WalletResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid request", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "409", description = "Wallet already exists", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = ResponseStatus.class)))
    })
    public ResponseEntity<WalletResponse> create(@RequestBody CreateWalletRequest request) {
        Wallet created = createWalletUseCase.execute(request.toCommand());
        return ResponseEntity
            .created(URI.create("/wallets/" + created.getId()))
            .body(WalletResponse.from(created));
    }
}
