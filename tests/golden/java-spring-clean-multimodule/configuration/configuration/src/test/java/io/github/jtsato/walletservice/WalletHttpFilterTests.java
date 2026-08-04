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
        HttpResponse<String> response = get(null, null, List.of(), List.of());
        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode root = OBJECT_MAPPER.readTree(response.body());
        assertThat(root.path("page").asInt()).isEqualTo(0);
        assertThat(root.path("size").asInt()).isEqualTo(20);
        assertThat(root.path("totalItems").asLong()).isEqualTo(3L);
        assertThat(root.path("totalPages").asInt()).isEqualTo(1);
        assertThat(identifiersOf(root)).containsExactlyInAnyOrder(WALLET_ID1, WALLET_ID2, WALLET_ID3);
    }

    @Test
    void shouldFilterByBalanceEquals() throws Exception {
        HttpResponse<String> response = get(null, null, List.of("balance:eq:124.45"), List.of());
        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode root = OBJECT_MAPPER.readTree(response.body());
        assertThat(root.path("page").asInt()).isEqualTo(0);
        assertThat(root.path("size").asInt()).isEqualTo(20);
        assertThat(root.path("totalItems").asLong()).isEqualTo(1L);
        assertThat(root.path("totalPages").asInt()).isEqualTo(1);
        assertThat(identifiersOf(root)).containsExactlyInAnyOrder(WALLET_ID2);
    }

    @Test
    void shouldFilterByIdIn() throws Exception {
        HttpResponse<String> response = get(0, 20, List.of("id:in:11111111-1111-1111-1111-111111111111,11111111-1111-1111-1111-111111111113"), List.of());
        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode root = OBJECT_MAPPER.readTree(response.body());
        assertThat(root.path("page").asInt()).isEqualTo(0);
        assertThat(root.path("size").asInt()).isEqualTo(20);
        assertThat(root.path("totalItems").asLong()).isEqualTo(2L);
        assertThat(root.path("totalPages").asInt()).isEqualTo(1);
        assertThat(identifiersOf(root)).containsExactlyInAnyOrder(WALLET_ID1, WALLET_ID3);
    }

    @Test
    void shouldReturnFirstPage() throws Exception {
        HttpResponse<String> response = get(0, 2, List.of(), List.of());
        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode root = OBJECT_MAPPER.readTree(response.body());
        assertThat(root.path("page").asInt()).isEqualTo(0);
        assertThat(root.path("size").asInt()).isEqualTo(2);
        assertThat(root.path("totalItems").asLong()).isEqualTo(3L);
        assertThat(root.path("totalPages").asInt()).isEqualTo(2);
        assertThat(identifiersOf(root)).containsExactlyInAnyOrder(WALLET_ID1, WALLET_ID2);
    }

    @Test
    void shouldReturnSecondPage() throws Exception {
        HttpResponse<String> response = get(1, 2, List.of(), List.of());
        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode root = OBJECT_MAPPER.readTree(response.body());
        assertThat(root.path("page").asInt()).isEqualTo(1);
        assertThat(root.path("size").asInt()).isEqualTo(2);
        assertThat(root.path("totalItems").asLong()).isEqualTo(3L);
        assertThat(root.path("totalPages").asInt()).isEqualTo(2);
        assertThat(identifiersOf(root)).containsExactlyInAnyOrder(WALLET_ID3);
    }

    @Test
    void shouldSortBalanceAscending() throws Exception {
        HttpResponse<String> response = get(0, 3, List.of(), List.of("balance:asc"));
        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode root = OBJECT_MAPPER.readTree(response.body());
        assertThat(root.path("page").asInt()).isEqualTo(0);
        assertThat(root.path("size").asInt()).isEqualTo(3);
        assertThat(root.path("totalItems").asLong()).isEqualTo(3L);
        assertThat(root.path("totalPages").asInt()).isEqualTo(1);
        assertThat(identifiersOf(root)).containsExactly(WALLET_ID1, WALLET_ID2, WALLET_ID3);
    }

    @Test
    void shouldSortBalanceDescending() throws Exception {
        HttpResponse<String> response = get(0, 3, List.of(), List.of("balance:desc"));
        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode root = OBJECT_MAPPER.readTree(response.body());
        assertThat(root.path("page").asInt()).isEqualTo(0);
        assertThat(root.path("size").asInt()).isEqualTo(3);
        assertThat(root.path("totalItems").asLong()).isEqualTo(3L);
        assertThat(root.path("totalPages").asInt()).isEqualTo(1);
        assertThat(identifiersOf(root)).containsExactly(WALLET_ID3, WALLET_ID2, WALLET_ID1);
    }

    @Test
    void shouldFilterByBalanceGreaterThan() throws Exception {
        HttpResponse<String> response = get(0, 2, List.of("balance:gt:123.45"), List.of());
        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode root = OBJECT_MAPPER.readTree(response.body());
        assertThat(root.path("page").asInt()).isEqualTo(0);
        assertThat(root.path("size").asInt()).isEqualTo(2);
        assertThat(root.path("totalItems").asLong()).isEqualTo(2L);
        assertThat(root.path("totalPages").asInt()).isEqualTo(1);
        assertThat(identifiersOf(root)).containsExactlyInAnyOrder(WALLET_ID2, WALLET_ID3);
    }

    @Test
    void shouldCombineRepeatedFiltersWithAnd() throws Exception {
        HttpResponse<String> response = get(0, 2, List.of("balance:gt:123.45", "balance:lt:125.45"), List.of());
        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode root = OBJECT_MAPPER.readTree(response.body());
        assertThat(root.path("page").asInt()).isEqualTo(0);
        assertThat(root.path("size").asInt()).isEqualTo(2);
        assertThat(root.path("totalItems").asLong()).isEqualTo(1L);
        assertThat(root.path("totalPages").asInt()).isEqualTo(1);
        assertThat(identifiersOf(root)).containsExactlyInAnyOrder(WALLET_ID2);
    }

    @Test
    void shouldCombineFilterPagingAndSort() throws Exception {
        HttpResponse<String> response = get(0, 2, List.of("balance:gt:123.45"), List.of("balance:desc"));
        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode root = OBJECT_MAPPER.readTree(response.body());
        assertThat(root.path("page").asInt()).isEqualTo(0);
        assertThat(root.path("size").asInt()).isEqualTo(2);
        assertThat(root.path("totalItems").asLong()).isEqualTo(2L);
        assertThat(root.path("totalPages").asInt()).isEqualTo(1);
        assertThat(identifiersOf(root)).containsExactly(WALLET_ID3, WALLET_ID2);
    }

    @Test
    void shouldAcceptRepeatedSort() throws Exception {
        HttpResponse<String> response = get(0, 3, List.of(), List.of("balance:desc", "id:asc"));
        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode root = OBJECT_MAPPER.readTree(response.body());
        assertThat(root.path("page").asInt()).isEqualTo(0);
        assertThat(root.path("size").asInt()).isEqualTo(3);
        assertThat(root.path("totalItems").asLong()).isEqualTo(3L);
        assertThat(root.path("totalPages").asInt()).isEqualTo(1);
        assertThat(identifiersOf(root)).containsExactly(WALLET_ID3, WALLET_ID2, WALLET_ID1);
    }

    @Test
    void shouldPreserveFilterInCommaWithSort() throws Exception {
        HttpResponse<String> response = get(0, 20, List.of("id:in:11111111-1111-1111-1111-111111111111,11111111-1111-1111-1111-111111111113"), List.of("balance:asc"));
        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode root = OBJECT_MAPPER.readTree(response.body());
        assertThat(root.path("page").asInt()).isEqualTo(0);
        assertThat(root.path("size").asInt()).isEqualTo(20);
        assertThat(root.path("totalItems").asLong()).isEqualTo(2L);
        assertThat(root.path("totalPages").asInt()).isEqualTo(1);
        assertThat(identifiersOf(root)).containsExactly(WALLET_ID1, WALLET_ID3);
    }

    @Test
    void shouldRejectUnknownField() throws Exception {
        HttpResponse<String> response = get(null, null, List.of("unknown:eq:1"), List.of());
        assertThat(response.statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectDisallowedOperatorForBalance() throws Exception {
        HttpResponse<String> response = get(null, null, List.of("balance:contains:1"), List.of());
        assertThat(response.statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectInvalidBalanceValue() throws Exception {
        HttpResponse<String> response = get(0, 2, List.of("balance:eq:not-a-valid-value"), List.of());
        assertThat(response.statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectInvalidFormat() throws Exception {
        HttpResponse<String> response = get(null, null, List.of("balance"), List.of());
        assertThat(response.statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectUnknownSortField() throws Exception {
        HttpResponse<String> response = get(null, null, List.of(), List.of("unknown:asc"));
        assertThat(response.statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectInvalidSortDirection() throws Exception {
        HttpResponse<String> response = get(null, null, List.of(), List.of("balance:invalid"));
        assertThat(response.statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectInvalidSortFormat() throws Exception {
        HttpResponse<String> response = get(null, null, List.of(), List.of("balance"));
        assertThat(response.statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectSortWithSpaces() throws Exception {
        HttpResponse<String> response = get(null, null, List.of(), List.of("balance: desc"));
        assertThat(response.statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectNonNumericPage() throws Exception {
        HttpResponse<String> response = get("abc", 2, List.of(), List.of());
        assertThat(response.statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectNonNumericSize() throws Exception {
        HttpResponse<String> response = get(0, "abc", List.of(), List.of());
        assertThat(response.statusCode()).isEqualTo(400);
    }

    private HttpResponse<String> get(Object page, Object size, List<String> filters, List<String> sorts) throws Exception {
        StringBuilder query = new StringBuilder();
        for (String filter : filters) {
            query.append(query.isEmpty() ? '?' : '&').append("filter=").append(URLEncoder.encode(filter, StandardCharsets.UTF_8));
        }
        for (String sort : sorts) {
            query.append(query.isEmpty() ? '?' : '&').append("sort=").append(URLEncoder.encode(sort, StandardCharsets.UTF_8));
        }
        if (page != null) query.append(query.isEmpty() ? '?' : '&').append("page=").append(URLEncoder.encode(String.valueOf(page), StandardCharsets.UTF_8));
        if (size != null) query.append(query.isEmpty() ? '?' : '&').append("size=").append(URLEncoder.encode(String.valueOf(size), StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder(
            URI.create("http://localhost:" + port + "/wallets" + query)
        ).GET().build();

        return HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private List<UUID> identifiersOf(JsonNode root) {
        List<UUID> identifiers = new ArrayList<>();
        for (JsonNode node : root.path("items")) identifiers.add(UUID.fromString(node.get("id").asText()));
        return identifiers;
    }
}
