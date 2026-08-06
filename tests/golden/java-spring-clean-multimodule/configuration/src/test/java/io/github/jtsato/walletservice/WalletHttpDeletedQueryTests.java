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
class WalletHttpDeletedQueryTests {
    private static final UUID WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final BigDecimal WALLET_BALANCE = new BigDecimal("123.45");
    private static final String WALLET_CURRENCY = "sample";
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
    void shouldExposeDeletedWalletByTheExplicitDeletedRoutes() throws Exception {
        walletRepository.saveAndFlush(new WalletEntity(
            WALLET_ID,
            WALLET_BALANCE,
            WALLET_CURRENCY
        ));
        assertThat(delete("/wallets/" + WALLET_ID).statusCode()).isEqualTo(204);
        assertThat(get("/wallets/" + WALLET_ID).statusCode()).isEqualTo(404);

        HttpResponse<String> byId = get("/wallets/deleted/" + WALLET_ID);
        assertThat(byId.statusCode()).isEqualTo(200);
        assertThat(OBJECT_MAPPER.readTree(byId.body()).path("deletedAt").isTextual()).isTrue();

        HttpResponse<String> page = get("/wallets/deleted");
        assertThat(page.statusCode()).isEqualTo(200);
        assertThat(OBJECT_MAPPER.readTree(page.body()).path("items").size()).isEqualTo(1);
    }

    private HttpResponse<String> delete(String path) throws Exception {
        return HTTP_CLIENT.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).DELETE().build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> get(String path) throws Exception {
        return HTTP_CLIENT.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET().build(), HttpResponse.BodyHandlers.ofString());
    }
}
