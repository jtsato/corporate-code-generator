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
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class WalletHttpFilterTests {
    private static final UUID WALLET_ID1 =
        UUID.fromString("11111111-1111-1111-1111-111111111111");

    private static final UUID WALLET_ID2 =
        UUID.fromString("11111111-1111-1111-1111-111111111112");

    private static final UUID WALLET_ID3 =
        UUID.fromString("11111111-1111-1111-1111-111111111113");

    private static final HttpClient HTTP_CLIENT = HttpClient.newHttpClient();
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @LocalServerPort
    private int port;

    @Autowired
    private WalletRepository walletRepository;

    @BeforeEach
    void arrange() {
        walletRepository.deleteAll();
        walletRepository.saveAllAndFlush(List.of(
            new WalletEntity(WALLET_ID1, new BigDecimal("123.45")),
            new WalletEntity(WALLET_ID2, new BigDecimal("124.45")),
            new WalletEntity(WALLET_ID3, new BigDecimal("125.45"))
        ));
    }

    @AfterEach
    void cleanUp() {
        walletRepository.deleteAll();
    }

    @Test
    void shouldReturnAllRecordsWhenFilterIsAbsent() throws Exception {
        HttpResponse<String> response = get();
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(identifiersOf(response)).containsExactlyInAnyOrder(WALLET_ID1, WALLET_ID2, WALLET_ID3);
    }

    @Test
    void shouldFilterByBalanceEquals() throws Exception {
        HttpResponse<String> response = get("balance:eq:124.45");
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(identifiersOf(response)).containsExactlyInAnyOrder(WALLET_ID2);
    }

    @Test
    void shouldFilterByIdIn() throws Exception {
        HttpResponse<String> response = get("id:in:11111111-1111-1111-1111-111111111111,11111111-1111-1111-1111-111111111113");
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(identifiersOf(response)).containsExactlyInAnyOrder(WALLET_ID1, WALLET_ID3);
    }

    @Test
    void shouldFilterByBalanceGreaterThan() throws Exception {
        HttpResponse<String> response = get("balance:gt:123.45");
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(identifiersOf(response)).containsExactlyInAnyOrder(WALLET_ID2, WALLET_ID3);
    }

    @Test
    void shouldCombineRepeatedFiltersWithAnd() throws Exception {
        HttpResponse<String> response = get("balance:gt:123.45", "balance:lt:125.45");
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(identifiersOf(response)).containsExactlyInAnyOrder(WALLET_ID2);
    }

    @Test
    void shouldRejectUnknownField() throws Exception {
        HttpResponse<String> response = get("unknown:eq:1");
        assertThat(response.statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectDisallowedOperatorForBalance() throws Exception {
        HttpResponse<String> response = get("balance:contains:1");
        assertThat(response.statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectInvalidBalanceValue() throws Exception {
        HttpResponse<String> response = get("balance:eq:not-a-valid-value");
        assertThat(response.statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectInvalidFormat() throws Exception {
        HttpResponse<String> response = get("balance");
        assertThat(response.statusCode()).isEqualTo(400);
    }

    private HttpResponse<String> get(String... filters) throws Exception {
        StringBuilder query = new StringBuilder();
        for (String filter : filters) {
            query.append(query.isEmpty() ? '?' : '&').append("filter=").append(URLEncoder.encode(filter, StandardCharsets.UTF_8));
        }

        HttpRequest request = HttpRequest.newBuilder(
            URI.create("http://localhost:" + port + "/wallets" + query)
        ).GET().build();

        return HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private List<UUID> identifiersOf(HttpResponse<String> response) throws Exception {
        JsonNode root = OBJECT_MAPPER.readTree(response.body());
        List<UUID> identifiers = new ArrayList<>();
        for (JsonNode node : root) identifiers.add(UUID.fromString(node.get("id").asText()));
        return identifiers;
    }
}
