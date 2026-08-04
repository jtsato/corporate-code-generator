package io.github.jtsato.walletservice;

import static org.assertj.core.api.Assertions.assertThat;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class WalletOpenApiSmokeTests {
    @LocalServerPort private int port;
    @Test void servesOpenApiDocument() throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/v3/api-docs")).GET().build();
        HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.headers().firstValue("Content-Type")).hasValueSatisfying(value -> assertThat(value).startsWith("application/json"));
        assertThat(response.body()).contains("openapi", "/wallets", "WalletResponse", "ResponseStatus", "wallet-service API");
    }

    @Test void documentsTheFilterQueryParameter() throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/v3/api-docs")).GET().build();
        HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
        JsonNode operation = new ObjectMapper().readTree(response.body()).path("paths").path("/wallets").path("get");
        JsonNode parameter = findParameter(operation.path("parameters"), "filter");

        assertThat(parameter.path("in").asText()).isEqualTo("query");
        assertThat(parameter.path("required").asBoolean(false)).isFalse();
        assertThat(parameter.path("description").asText()).contains("<field>:<operator>[:<value>]");
        assertThat(parameter.path("schema").path("type").asText()).isEqualTo("array");
        assertThat(operation.path("responses").has("400")).isTrue();
    }

    private static JsonNode findParameter(JsonNode parameters, String name) {
        for (JsonNode parameter : parameters) if (name.equals(parameter.path("name").asText())) return parameter;
        throw new AssertionError("Parameter '" + name + "' was not documented.");
    }
}
