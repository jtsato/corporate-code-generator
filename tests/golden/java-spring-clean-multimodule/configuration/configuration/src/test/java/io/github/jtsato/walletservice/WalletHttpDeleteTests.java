package io.github.jtsato.walletservice;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.jtsato.walletservice.infra.domains.wallet.entity.WalletEntity;
import io.github.jtsato.walletservice.infra.domains.wallet.repository.WalletRepository;
import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class WalletHttpDeleteTests {
    private static final UUID WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final BigDecimal WALLET_BALANCE = new BigDecimal("123.45");
    private static final HttpClient HTTP_CLIENT = HttpClient.newHttpClient();
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @LocalServerPort
    private int port;

    @Autowired
    private WalletRepository walletRepository;

    @AfterEach
    void cleanUp() {
        walletRepository.deleteAll();
    }

    @Test
    void shouldDeleteExistingWallet() throws Exception {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE
        ));

        HttpResponse<String> response = delete("/wallets/" + WALLET_ID);

        assertThat(response.statusCode()).isEqualTo(204);
        assertThat(response.body()).isEmpty();
        assertThat(walletRepository.findById(WALLET_ID)).isEmpty();
    }

    @Test
    void shouldReturnNotFoundAfterDeleteOnSubsequentGet() throws Exception {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE
        ));
        assertThat(delete("/wallets/" + WALLET_ID).statusCode()).isEqualTo(204);

        HttpResponse<String> response = get("/wallets/" + WALLET_ID);

        assertThat(response.statusCode()).isEqualTo(404);
    }

    @Test
    void shouldReturnNotFoundForMissingWallet() throws Exception {
        HttpResponse<String> response = delete("/wallets/" + UUID.fromString("11111111-1111-1111-1111-111111111112"));

        assertThat(response.statusCode()).isEqualTo(404);
        JsonNode body = OBJECT_MAPPER.readTree(response.body());
        assertThat(body.path("code").asInt()).isEqualTo(404);
    }

    @Test
    void shouldReturnNotFoundOnRepeatedDelete() throws Exception {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE
        ));
        assertThat(delete("/wallets/" + WALLET_ID).statusCode()).isEqualTo(204);

        HttpResponse<String> response = delete("/wallets/" + WALLET_ID);

        assertThat(response.statusCode()).isEqualTo(404);
    }

    @Test
    void shouldRejectInvalidPathIdentifier() throws Exception {
        assertThat(delete("/wallets/not-a-uuid").statusCode()).isEqualTo(400);
    }

    private HttpResponse<String> delete(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).DELETE().build();
        return HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> get(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET().build();
        return HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
    }
}
