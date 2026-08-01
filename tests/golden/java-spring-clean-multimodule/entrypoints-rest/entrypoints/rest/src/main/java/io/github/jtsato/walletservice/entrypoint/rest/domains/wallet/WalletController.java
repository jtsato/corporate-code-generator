package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet;

import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsUseCase;
import io.github.jtsato.walletservice.entrypoint.rest.common.ResponseStatus;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/wallets")
@Tag(name = "Wallets", description = "Wallet operations")
public class WalletController {
    private final FindWalletsUseCase findWalletsUseCase;

    public WalletController(FindWalletsUseCase findWalletsUseCase) {
        this.findWalletsUseCase = findWalletsUseCase;
    }

    @GetMapping
    @Operation(summary = "Find wallets", description = "Returns all wallets.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Wallets found"),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = ResponseStatus.class)))
    })
    public List<WalletResponse> findAll() {
        return findWalletsUseCase.execute()
            .stream()
            .map(WalletResponse::from)
            .toList();
    }
}
