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
        JsonNode document = document();
        JsonNode operation = operation(document);
        JsonNode parameter = findParameter(operation.path("parameters"), "filter");

        assertThat(parameter.path("in").asText()).isEqualTo("query");
        assertThat(parameter.path("required").asBoolean(false)).isFalse();
        assertThat(parameter.path("schema").path("type").asText()).isEqualTo("array");
        assertThat(parameter.path("description").asText()).contains("<field>:<operator>[:<value>]");
    }

    @Test void documentsPagingParametersAndPageResponse() throws Exception {
        JsonNode document = document();
        JsonNode operation = operation(document);
        JsonNode page = findParameter(operation.path("parameters"), "page");
        JsonNode size = findParameter(operation.path("parameters"), "size");

        assertThat(page.path("required").asBoolean(true)).isFalse();
        assertThat(page.path("schema").path("type").asText()).isEqualTo("integer");
        assertThat(page.path("schema").path("default").asInt()).isEqualTo(0);
        assertThat(page.path("schema").path("minimum").asInt()).isEqualTo(0);
        assertThat(size.path("required").asBoolean(true)).isFalse();
        assertThat(size.path("schema").path("type").asText()).isEqualTo("integer");
        assertThat(size.path("schema").path("default").asInt()).isEqualTo(20);
        assertThat(size.path("schema").path("minimum").asInt()).isEqualTo(1);

        JsonNode response = operation.path("responses").path("200");
        JsonNode content = response.path("content");
        JsonNode media = content.has("application/json") ? content.path("application/json") : content.path("*/*");
        JsonNode schema = resolveSchema(document, media.path("schema"));
        JsonNode items = schema.path("properties").path("items");
        assertThat(items.path("type").asText()).isEqualTo("array");
        JsonNode itemSchema = resolveSchema(document, items.path("items"));
        String itemReference = items.path("items").path("$ref").asText("");
        assertThat(itemReference + itemSchema.path("title").asText()).contains("WalletResponse");
        String responseReference = response.path("content").path("*/*").path("schema").path("$ref").asText("");
        assertThat(responseReference).contains("WalletPageResponse");
        assertThat(schema.path("properties").has("page")).isTrue();
        assertThat(schema.path("properties").has("size")).isTrue();
        assertThat(schema.path("properties").has("totalItems")).isTrue();
        assertThat(schema.path("properties").has("totalPages")).isTrue();
        assertThat(operation.path("responses").has("400")).isTrue();
        assertThat(operation.path("responses").has("500")).isTrue();
    }

    @Test void documentsTheSortQueryParameter() throws Exception {
        JsonNode document = document();
        JsonNode operation = operation(document);
        JsonNode sort = findParameter(operation.path("parameters"), "sort");

        assertThat(sort.path("in").asText()).isEqualTo("query");
        assertThat(sort.path("required").asBoolean(true)).isFalse();
        assertThat(sort.path("schema").path("type").asText()).isEqualTo("array");
        assertThat(sort.path("description").asText()).contains("<field>:<direction>");
    }

    @Test void documentsFindByIdOperation() throws Exception {
        JsonNode document = document();
        JsonNode operation = findByIdOperation(document);
        JsonNode parameter = findParameter(operation.path("parameters"), "id");

        assertThat(parameter.path("in").asText()).isEqualTo("path");
        assertThat(parameter.path("required").asBoolean(false)).isTrue();
        assertThat(parameter.path("schema").path("type").asText()).isEqualTo("string");
        assertThat(parameter.path("schema").path("format").asText()).isEqualTo("uuid");
        JsonNode response = operation.path("responses").path("200");
        JsonNode content = response.path("content");
        JsonNode media = content.has("application/json") ? content.path("application/json") : content.path("*/*");
        String responseReference = media.path("schema").path("$ref").asText("");
        assertThat(responseReference).contains("WalletResponse");
        assertThat(operation.path("responses").has("400")).isTrue();
        assertThat(operation.path("responses").has("404")).isTrue();
        assertThat(operation.path("responses").has("500")).isTrue();
    }

    private JsonNode document() throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/v3/api-docs")).GET().build();
        HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(200);
        return new ObjectMapper().readTree(response.body());
    }

    private JsonNode operation(JsonNode document) {
        assertThat(document.path("paths").has("/wallets")).isTrue();
        assertThat(document.path("paths").path("/wallets").has("get")).isTrue();
        return document.path("paths").path("/wallets").path("get");
    }

    private JsonNode findByIdOperation(JsonNode document) {
        assertThat(document.path("paths").has("/wallets/{id}")).isTrue();
        assertThat(document.path("paths").path("/wallets/{id}").has("get")).isTrue();
        return document.path("paths").path("/wallets/{id}").path("get");
    }

    private static JsonNode resolveSchema(JsonNode document, JsonNode schema) {
        String reference = schema.path("$ref").asText("");
        if (reference.isBlank()) return schema;
        String name = reference.substring(reference.lastIndexOf('/') + 1);
        return document.path("components").path("schemas").path(name);
    }

    private static JsonNode findParameter(JsonNode parameters, String name) {
        for (JsonNode parameter : parameters) if (name.equals(parameter.path("name").asText())) return parameter;
        throw new AssertionError("Parameter '" + name + "' was not documented.");
    }
}
