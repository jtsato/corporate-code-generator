package io.github.jtsato.walletservice;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.jtsato.walletservice.infra.domains.wallet.entity.WalletEntity;
import io.github.jtsato.walletservice.infra.domains.wallet.repository.WalletRepository;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class WalletHttpPersistenceReadTests {
    private static final UUID WALLET_ID =
        UUID.fromString("11111111-1111-1111-1111-111111111111");

    private static final BigDecimal WALLET_BALANCE =
        new BigDecimal("123.45");

    private static final String WALLET_CURRENCY =
        "sample";

    @LocalServerPort
    private int port;

    @Autowired
    private WalletRepository walletRepository;

    @AfterEach
    void cleanUp() {
        walletRepository.deleteAll();
    }

    @Test
    void findAllReturnsPersistedWallet() throws Exception {
        walletRepository.deleteAll();
        walletRepository.saveAndFlush(
            new WalletEntity(
                WALLET_ID,
                WALLET_BALANCE,
                WALLET_CURRENCY
            )
        );

        HttpRequest request = HttpRequest.newBuilder(
            URI.create("http://localhost:" + port + "/wallets")
        ).GET().build();

        HttpResponse<String> response = HttpClient.newHttpClient().send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.headers().firstValue("Content-Type"))
            .hasValueSatisfying(contentType ->
                assertThat(contentType).startsWith("application/json")
            );
        JsonNode root = new ObjectMapper().readTree(response.body());
        assertThat(root.path("items").toString()).isEqualTo(
            "[{\"id\":\"11111111-1111-1111-1111-111111111111\",\"balance\":123.45,\"currency\":\"sample\"}]"
        );
    }
}
