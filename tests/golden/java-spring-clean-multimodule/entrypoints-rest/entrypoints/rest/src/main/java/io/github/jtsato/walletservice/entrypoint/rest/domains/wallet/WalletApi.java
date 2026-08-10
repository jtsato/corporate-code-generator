package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet;

import io.github.jtsato.walletservice.entrypoint.rest.common.ResponseStatus;
import io.github.jtsato.walletservice.entrypoint.rest.common.WalletPageResponse;
import io.github.jtsato.walletservice.entrypoint.rest.common.WalletTombstonePageResponse;
import io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.request.CreateWalletRequest;
import io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.request.PatchWalletRequest;
import io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.request.UpdateWalletRequest;
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
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;


/**
 * OpenAPI contract for the Wallets resource.
 *
 * <p>The specification annotations live here and the routing lives on the implementing
 * controller, so the documented contract can be read without scrolling past request handling.</p>
 */
@Tag(name = "Wallets", description = "Wallet operations")
public interface WalletApi {

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
    WalletPageResponse findAll(List<String> filter, Integer page, Integer size, List<String> sort);

    @Operation(summary = "Find deleted wallets", description = "Returns deleted wallets.")
    @Parameter(name = "filter", description = "Filter expression as <field>:<operator>[:<value>]. Repeat to combine with AND. Fields: id (eq, ne, in, isnull, notnull); balance (eq, ne, gt, gte, lt, lte, in, isnull, notnull).", example = "balance:gt:100", array = @ArraySchema(schema = @Schema(type = "string")))
    @Parameter(name = "page", description = "Zero-based page index. Defaults to 0.", schema = @Schema(type = "integer", defaultValue = "0", minimum = "0"))
    @Parameter(name = "size", description = "Number of items per page. Defaults to 20.", schema = @Schema(type = "integer", defaultValue = "20", minimum = "1"))
    @Parameter(name = "sort", description = "Sort expression as <field>:<direction>. Repeat to apply multiple orders in order. Fields: id, balance. Directions: asc, desc.", example = "balance:desc", array = @ArraySchema(schema = @Schema(type = "string")))
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Deleted Wallets found", content = @Content(schema = @Schema(implementation = WalletTombstonePageResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid filter", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = ResponseStatus.class)))
    })
    WalletTombstonePageResponse findDeleted(List<String> filter, Integer page, Integer size, List<String> sort);

    @Operation(summary = "Find wallet by id", description = "Returns a wallet by its identifier.")
    @Parameter(name = "id", in = ParameterIn.PATH, required = true, schema = @Schema(type = "string", format = "uuid"))
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Wallet found", content = @Content(schema = @Schema(implementation = WalletResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid identifier", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "404", description = "Wallet not found", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = ResponseStatus.class)))
    })
    WalletResponse findById(UUID id);

    @Operation(summary = "Find deleted wallet by id", description = "Returns a deleted wallet by its identifier.")
    @Parameter(name = "id", in = ParameterIn.PATH, required = true, schema = @Schema(type = "string", format = "uuid"))
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Deleted Wallet found", content = @Content(schema = @Schema(implementation = WalletTombstoneResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid identifier", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "404", description = "Wallet not found", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = ResponseStatus.class)))
    })
    WalletTombstoneResponse findDeletedById(UUID id);

    @Operation(summary = "Update wallet", description = "Updates a wallet.")
    @Parameter(name = "id", in = ParameterIn.PATH, required = true, schema = @Schema(type = "string", format = "uuid"))
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Wallet updated", content = @Content(schema = @Schema(implementation = WalletResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid request", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "404", description = "Wallet not found", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = ResponseStatus.class)))
    })
    WalletResponse update(UUID id, UpdateWalletRequest request);

    @Operation(summary = "Patch wallet", description = "Partially updates a wallet.")
    @Parameter(name = "id", in = ParameterIn.PATH, required = true, schema = @Schema(type = "string", format = "uuid"))
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Wallet patched", content = @Content(schema = @Schema(implementation = WalletResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid request", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "404", description = "Wallet not found", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = ResponseStatus.class)))
    })
    WalletResponse patch(UUID id, PatchWalletRequest request);

    @Operation(summary = "Create wallet", description = "Creates a wallet.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Wallet created", headers = @Header(name = "Location", description = "Location of the created resource", schema = @Schema(type = "string")), content = @Content(schema = @Schema(implementation = WalletResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid request", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "409", description = "Wallet already exists", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = ResponseStatus.class)))
    })
    ResponseEntity<WalletResponse> create(CreateWalletRequest request);

    @Operation(summary = "Delete wallet", description = "Deletes a wallet.")
    @Parameter(name = "id", in = ParameterIn.PATH, required = true, schema = @Schema(type = "string", format = "uuid"))
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Wallet deleted"),
        @ApiResponse(responseCode = "400", description = "Invalid identifier", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "404", description = "Wallet not found", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = ResponseStatus.class)))
    })
    ResponseEntity<Void> delete(UUID id);

    @Operation(summary = "Restore wallet", description = "Restores a deleted wallet.")
    @Parameter(name = "id", in = ParameterIn.PATH, required = true, schema = @Schema(type = "string", format = "uuid"))
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Wallet restored"),
        @ApiResponse(responseCode = "400", description = "Invalid identifier", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "404", description = "Wallet not found", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "409", description = "Wallet cannot be restored", content = @Content(schema = @Schema(implementation = ResponseStatus.class))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = ResponseStatus.class)))
    })
    ResponseEntity<Void> restore(UUID id);
}
