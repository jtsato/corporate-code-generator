package io.github.jtsato.walletservice;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
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
        assertThat(response.body()).isEqualTo("[]");
        assertThat(response.headers().firstValue("Content-Type"))
            .hasValueSatisfying(contentType ->
                assertThat(contentType).startsWith("application/json")
            );
    }
}
