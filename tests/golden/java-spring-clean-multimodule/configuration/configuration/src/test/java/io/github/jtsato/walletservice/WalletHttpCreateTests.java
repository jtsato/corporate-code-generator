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
class WalletHttpCreateTests {
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
    void shouldCreateAndPersistWalletEntity() throws Exception {
        HttpResponse<String> response = post("{\"id\":\"11111111-1111-1111-1111-111111111111\",\"balance\":123.45}");

        assertThat(response.statusCode()).isEqualTo(201);
        assertThat(response.headers().firstValue("Location")).hasValue("/wallets/" + WALLET_ID);
        JsonNode body = OBJECT_MAPPER.readTree(response.body());
        assertThat(body.path("id").asText()).isEqualTo(String.valueOf(WALLET_ID));
        assertThat(body.path("balance").asText()).isEqualTo(String.valueOf(WALLET_BALANCE));
        var persisted = walletRepository.findById(WALLET_ID).orElseThrow();
        assertThat(persisted.getId()).isEqualTo(WALLET_ID);
        assertThat(persisted.getBalance()).isEqualTo(WALLET_BALANCE);
    }

    @Test
    void shouldRejectDuplicateWalletEntityWithoutOverwritingOriginal() throws Exception {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE
        ));

        HttpResponse<String> response = post("{\"id\":\"11111111-1111-1111-1111-111111111111\",\"balance\":124.45}");

        assertThat(response.statusCode()).isEqualTo(409);
        JsonNode body = OBJECT_MAPPER.readTree(response.body());
        assertThat(body.path("code").asInt()).isEqualTo(409);
        assertThat(body.path("message").asText()).isEqualTo("Wallet already exists.");
        var persisted = walletRepository.findById(WALLET_ID).orElseThrow();
        assertThat(persisted.getId()).isEqualTo(WALLET_ID);
        assertThat(persisted.getBalance()).isEqualTo(WALLET_BALANCE);
    }

    @Test
    void shouldReuseUniqueValueAfterSoftDelete() throws Exception {
        assertThat(post("{\"id\":\"11111111-1111-1111-1111-111111111111\",\"balance\":123.45}").statusCode()).isEqualTo(201);
        assertThat(delete("/wallets/" + WALLET_ID).statusCode()).isEqualTo(204);

        HttpResponse<String> response = post("{\"id\":\"11111111-1111-1111-1111-111111111112\",\"balance\":123.45}");

        assertThat(response.statusCode()).isEqualTo(201);
    }


    @Test
    void shouldRejectNullIdentifier() throws Exception {
        assertThat(post("{\"id\":null,\"balance\":123.45}").statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectNullValue() throws Exception {
        assertThat(post("{\"id\":\"11111111-1111-1111-1111-111111111111\",\"balance\":null}").statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectInvalidIdentifier() throws Exception {
        assertThat(post("{\"id\":\"not-a-uuid\",\"balance\":123.45}").statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectInvalidJson() throws Exception {
        assertThat(post("{not-json").statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectMissingBody() throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/wallets"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.noBody())
            .build();
        assertThat(HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(400);
    }

    @Test
    void shouldCreateThenFindByIdentifier() throws Exception {
        HttpResponse<String> created = post("{\"id\":\"11111111-1111-1111-1111-111111111111\",\"balance\":123.45}");
        assertThat(created.statusCode()).isEqualTo(201);

        HttpResponse<String> found = get("/wallets/" + WALLET_ID);
        assertThat(found.statusCode()).isEqualTo(200);
        JsonNode body = OBJECT_MAPPER.readTree(found.body());
        assertThat(body.path("id").asText()).isEqualTo(String.valueOf(WALLET_ID));
        assertThat(body.path("balance").asText()).isEqualTo(String.valueOf(WALLET_BALANCE));
    }

    private HttpResponse<String> post(String body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/wallets"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();
        return HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> get(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET().build();
        return HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> delete(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).DELETE().build();
        return HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
    }
}
