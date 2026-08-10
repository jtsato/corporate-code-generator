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
class ActuatorHealthSmokeTests {
    @LocalServerPort
    private int port;

    @Test
    void healthEndpointReportsUp() throws Exception {
        HttpRequest request = HttpRequest.newBuilder(
            URI.create("http://localhost:" + port + "/actuator/health")
        ).GET().build();

        HttpResponse<String> response = HttpClient.newHttpClient().send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        assertThat(response.statusCode()).isEqualTo(200);
        JsonNode root = new ObjectMapper().readTree(response.body());
        assertThat(root.path("status").asText()).isEqualTo("UP");
        assertThat(root.has("components")).isFalse();
    }
}
