package io.github.jtsato.walletservice.application;

import io.github.jtsato.walletservice.domain.Wallet;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class WalletService {
    public List<Wallet> findAll() {
        return List.of();
    }
}
