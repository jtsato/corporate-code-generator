package io.github.jtsato.walletservice;

import static org.assertj.core.api.Assertions.assertThat;

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
class WalletHttpRestoreTests {
    private static final UUID WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final BigDecimal WALLET_BALANCE = new BigDecimal("123.45");
    private static final String WALLET_CURRENCY = "sample";
    private static final HttpClient HTTP_CLIENT = HttpClient.newHttpClient();

    @LocalServerPort
    private int port;

    @Autowired
    private WalletRepository walletRepository;

    @AfterEach
    void cleanUp() {
        walletRepository.deleteAll();
    }

    @Test
    void shouldRestoreDeletedWalletWithNoContent() throws Exception {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE,
            WALLET_CURRENCY
        ));
        assertThat(delete("/wallets/" + WALLET_ID).statusCode()).isEqualTo(204);

        HttpResponse<String> restore = post("/wallets/" + WALLET_ID + "/restore");

        assertThat(restore.statusCode()).isEqualTo(204);
        assertThat(restore.body()).isEmpty();
        assertThat(get("/wallets/" + WALLET_ID).statusCode()).isEqualTo(200);
    }

    @Test
    void shouldRejectRepeatedRestoreAndUniqueConflict() throws Exception {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE,
            WALLET_CURRENCY
        ));
        assertThat(delete("/wallets/" + WALLET_ID).statusCode()).isEqualTo(204);
        assertThat(post("/wallets/" + WALLET_ID + "/restore").statusCode()).isEqualTo(204);
        assertThat(post("/wallets/" + WALLET_ID + "/restore").statusCode()).isEqualTo(409);
    }

    private HttpResponse<String> delete(String path) throws Exception {
        return HTTP_CLIENT.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).DELETE().build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> get(String path) throws Exception {
        return HTTP_CLIENT.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET().build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> post(String path) throws Exception {
        return HTTP_CLIENT.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).POST(HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
    }
}
