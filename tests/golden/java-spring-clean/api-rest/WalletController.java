package io.github.jtsato.walletservice.api;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/wallets")
public class WalletController {
    @GetMapping
    public List<WalletResponse> findAll() {
        return List.of();
    }
}
