package io.github.jtsato.walletservice.http;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.jtsato.walletservice.infra.database.domains.wallet.entity.WalletEntity;
import io.github.jtsato.walletservice.infra.database.domains.wallet.repository.WalletRepository;
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
class WalletHttpFindByIdTests {
    private static final UUID WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final BigDecimal WALLET_BALANCE = new BigDecimal("124.45");

    @LocalServerPort
    private int port;

    @Autowired
    private WalletRepository walletRepository;

    @AfterEach
    void cleanUp() {
        walletRepository.deleteAll();
    }

    @Test
    void shouldReturnPersistedEntityByIdentifier() throws Exception {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE
        ));

        HttpResponse<String> response = send("/wallets/" + WALLET_ID);

        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode body = new ObjectMapper().readTree(response.body());
        assertThat(body.path("id").asText()).isEqualTo(String.valueOf(WALLET_ID));
        assertThat(body.path("balance").asText()).isEqualTo(String.valueOf(WALLET_BALANCE));
    }

    @Test
    void shouldReturnNotFoundForUnknownIdentifier() throws Exception {
        HttpResponse<String> response = send("/wallets/" + UUID.fromString("11111111-1111-1111-1111-111111111112"));

        assertThat(response.statusCode()).isEqualTo(404);
        JsonNode body = new ObjectMapper().readTree(response.body());
        assertThat(body.path("code").asInt()).isEqualTo(404);
    }

    @Test
    void shouldRejectInvalidIdentifier() throws Exception {
        HttpResponse<String> response = send("/wallets/not-a-uuid");

        assertThat(response.statusCode()).isEqualTo(400);
    }

    private HttpResponse<String> send(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET().build();
        return HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
    }
}
