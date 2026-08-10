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
class WalletHttpPatchTests {
    private static final UUID WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final BigDecimal WALLET_BALANCE = new BigDecimal("123.45");
    private static final BigDecimal WALLET_UPDATED_BALANCE = new BigDecimal("124.45");
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
    void shouldPatchAndPersistWallet() throws Exception {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE
        ));
        HttpResponse<String> response = patch("/wallets/" + WALLET_ID, "{\"balance\":124.45}");
        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode body = OBJECT_MAPPER.readTree(response.body());
        assertThat(body.path("id").asText()).isEqualTo(String.valueOf(WALLET_ID));
        assertThat(body.path("balance").asText()).isEqualTo(String.valueOf(WALLET_UPDATED_BALANCE));
        var persisted = walletRepository.findById(WALLET_ID).orElseThrow();
        assertThat(persisted.getBalance()).isEqualTo(WALLET_UPDATED_BALANCE);
    }

    @Test
    void shouldRejectEmptyPatch() throws Exception {
        assertThat(patch("/wallets/" + WALLET_ID, "{}").statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectNullRequiredField() throws Exception {
        assertThat(patch("/wallets/" + WALLET_ID, "{\"balance\":null}").statusCode()).isEqualTo(400);
    }

    @Test
    void shouldReturnNotFoundForMissingWallet() throws Exception {
        assertThat(patch("/wallets/" + UUID.fromString("11111111-1111-1111-1111-111111111112"), "{\"balance\":124.45}").statusCode()).isEqualTo(404);
    }

    @Test
    void shouldRejectNullBody() throws Exception {
        assertThat(patch("/wallets/" + WALLET_ID, null).statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectInvalidJson() throws Exception {
        assertThat(patch("/wallets/" + WALLET_ID, "{not-json").statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectInvalidPathIdentifier() throws Exception {
        assertThat(patch("/wallets/not-a-uuid", "{\"balance\":124.45}").statusCode()).isEqualTo(400);
    }

    private HttpResponse<String> patch(String path, String body) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
            .header("Content-Type", "application/json");
        HttpRequest request = body == null
            ? builder.method("PATCH", HttpRequest.BodyPublishers.noBody()).build()
            : builder.method("PATCH", HttpRequest.BodyPublishers.ofString(body)).build();
        return HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
    }
}
