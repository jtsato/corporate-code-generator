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
class WalletHttpUpdateTests {
    private static final UUID WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final BigDecimal WALLET_BALANCE = new BigDecimal("123.45");
    private static final String WALLET_CURRENCY = "sample";
    private static final BigDecimal WALLET_UPDATED_BALANCE = new BigDecimal("124.45");
    private static final String WALLET_UPDATED_CURRENCY = "sample-2";
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
    void shouldUpdateAndPersistWallet() throws Exception {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE,
            WALLET_CURRENCY
        ));

        HttpResponse<String> response = put("/wallets/" + WALLET_ID, "{\"balance\":124.45,\"currency\":\"sample-2\"}");

        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode body = OBJECT_MAPPER.readTree(response.body());
        assertThat(body.path("id").asText()).isEqualTo(String.valueOf(WALLET_ID));
        assertThat(body.path("balance").asText()).isEqualTo(String.valueOf(WALLET_UPDATED_BALANCE));
        assertThat(body.path("currency").asText()).isEqualTo(String.valueOf(WALLET_UPDATED_CURRENCY));
        var persisted = walletRepository.findById(WALLET_ID).orElseThrow();
        assertThat(persisted.getBalance()).isEqualTo(WALLET_UPDATED_BALANCE);
        assertThat(persisted.getCurrency()).isEqualTo(WALLET_UPDATED_CURRENCY);
    }

    @Test
    void shouldReturnUpdatedWalletWhenFetchedAfterUpdate() throws Exception {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE,
            WALLET_CURRENCY
        ));
        assertThat(put("/wallets/" + WALLET_ID, "{\"balance\":124.45,\"currency\":\"sample-2\"}").statusCode()).isEqualTo(200);

        HttpResponse<String> response = get("/wallets/" + WALLET_ID);
        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode body = OBJECT_MAPPER.readTree(response.body());
        assertThat(body.path("balance").asText()).isEqualTo(String.valueOf(WALLET_UPDATED_BALANCE));
        assertThat(body.path("currency").asText()).isEqualTo(String.valueOf(WALLET_UPDATED_CURRENCY));
    }

    @Test
    void shouldReturnNotFoundForMissingWallet() throws Exception {
        assertThat(put("/wallets/" + UUID.fromString("11111111-1111-1111-1111-111111111112"), "{\"balance\":124.45,\"currency\":\"sample-2\"}").statusCode()).isEqualTo(404);
    }

    @Test
    void shouldRejectNullBody() throws Exception {
        assertThat(put("/wallets/" + WALLET_ID, null).statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectMissingValue() throws Exception {
        assertThat(put("/wallets/" + WALLET_ID, "{\"currency\":\"sample-2\"}").statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectInvalidJson() throws Exception {
        assertThat(put("/wallets/" + WALLET_ID, "{not-json").statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectInvalidPathIdentifier() throws Exception {
        assertThat(put("/wallets/not-a-uuid", "{\"balance\":124.45,\"currency\":\"sample-2\"}").statusCode()).isEqualTo(400);
    }

    private HttpResponse<String> put(String path, String body) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
            .header("Content-Type", "application/json");
        HttpRequest request = body == null
            ? builder.PUT(HttpRequest.BodyPublishers.noBody()).build()
            : builder.PUT(HttpRequest.BodyPublishers.ofString(body)).build();
        return HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> get(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET().build();
        return HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
    }
}
