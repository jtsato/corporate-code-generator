package io.github.jtsato.walletservice.smoke;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class WalletHttpSmokeTests {
    @LocalServerPort
    private int port;

    @Test
    void findAllReturnsEmptyList() throws Exception {
        HttpRequest request = HttpRequest.newBuilder(
            URI.create("http://localhost:" + port + "/wallets")
        ).GET().build();

        HttpResponse<String> response = HttpClient.newHttpClient().send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode root = new ObjectMapper().readTree(response.body());
        assertThat(root.path("items").isArray()).isTrue();
        assertThat(root.path("items").size()).isEqualTo(0);
        assertThat(root.path("page").asInt()).isEqualTo(0);
        assertThat(root.path("size").asInt()).isEqualTo(20);
        assertThat(root.path("totalItems").asLong()).isEqualTo(0L);
        assertThat(root.path("totalPages").asInt()).isEqualTo(0);
        assertThat(response.headers().firstValue("Content-Type"))
            .hasValueSatisfying(contentType ->
                assertThat(contentType).startsWith("application/json")
            );
    }
}
