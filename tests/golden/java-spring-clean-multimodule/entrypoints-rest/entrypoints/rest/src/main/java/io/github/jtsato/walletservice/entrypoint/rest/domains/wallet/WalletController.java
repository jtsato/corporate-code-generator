package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet;

import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsUseCase;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/wallets")
public class WalletController {
    private final FindWalletsUseCase findWalletsUseCase;

    public WalletController(FindWalletsUseCase findWalletsUseCase) {
        this.findWalletsUseCase = findWalletsUseCase;
    }

    @GetMapping
    public List<WalletResponse> findAll() {
        return findWalletsUseCase.execute()
            .stream()
            .map(WalletResponse::from)
            .toList();
    }
}
