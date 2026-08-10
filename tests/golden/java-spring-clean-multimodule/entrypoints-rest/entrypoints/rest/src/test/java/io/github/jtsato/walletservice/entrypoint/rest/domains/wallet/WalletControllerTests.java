package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.model.WalletTombstone;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.create.CreateWalletCommand;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.create.CreateWalletUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.delete.DeleteWalletCommand;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.delete.DeleteWalletUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindDeletedWalletByIdUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindDeletedWalletsByFilterPageUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletByIdUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsByFilterPageUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.patch.PatchWalletCommand;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.patch.PatchWalletUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.restore.RestoreWalletCommand;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.restore.RestoreWalletUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.update.UpdateWalletCommand;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.update.UpdateWalletUseCase;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;

/**
 * Contract test for {@link WalletController}.
 *
 * <p>Loads the web layer only. Every use case is replaced by a mock, so the assertions cover
 * routing, request binding, status codes, the response JSON contract, and the command each
 * request is translated into. End-to-end behavior across all four modules is covered separately
 * by the configuration module's HTTP tests.</p>
 */
@Import({WalletControllerTests.TestConfig.class})
@AutoConfigureMockMvc(addFilters = false)
@WebMvcTest(controllers = WalletController.class)
class WalletControllerTests {
    private static final UUID WALLET_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final BigDecimal WALLET_BALANCE = new BigDecimal("123.45");
    private static final Instant DELETED_AT = Instant.parse("2026-01-20T08:00:00Z");
    private static final String EXPECTED_BODY = "{\"id\":\"11111111-1111-1111-1111-111111111111\",\"balance\":123.45}";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CreateWalletUseCase createWalletUseCase;

    @Autowired
    private UpdateWalletUseCase updateWalletUseCase;

    @Autowired
    private PatchWalletUseCase patchWalletUseCase;

    @Autowired
    private DeleteWalletUseCase deleteWalletUseCase;

    @Autowired
    private RestoreWalletUseCase restoreWalletUseCase;

    @Autowired
    private FindWalletByIdUseCase findWalletByIdUseCase;

    @Autowired
    private FindDeletedWalletByIdUseCase findDeletedWalletByIdUseCase;

    @Autowired
    private FindWalletsByFilterPageUseCase findWalletsByFilterPageUseCase;

    @Autowired
    private FindDeletedWalletsByFilterPageUseCase findDeletedWalletsByFilterPageUseCase;

    @TestConfiguration
    static class TestConfig {

        @Bean
        @Primary
        CreateWalletUseCase createWalletUseCase() {
            return mock(CreateWalletUseCase.class);
        }

        @Bean
        @Primary
        UpdateWalletUseCase updateWalletUseCase() {
            return mock(UpdateWalletUseCase.class);
        }

        @Bean
        @Primary
        PatchWalletUseCase patchWalletUseCase() {
            return mock(PatchWalletUseCase.class);
        }

        @Bean
        @Primary
        DeleteWalletUseCase deleteWalletUseCase() {
            return mock(DeleteWalletUseCase.class);
        }

        @Bean
        @Primary
        RestoreWalletUseCase restoreWalletUseCase() {
            return mock(RestoreWalletUseCase.class);
        }

        @Bean
        @Primary
        FindWalletByIdUseCase findWalletByIdUseCase() {
            return mock(FindWalletByIdUseCase.class);
        }

        @Bean
        @Primary
        FindDeletedWalletByIdUseCase findDeletedWalletByIdUseCase() {
            return mock(FindDeletedWalletByIdUseCase.class);
        }

        @Bean
        @Primary
        FindWalletsByFilterPageUseCase findWalletsByFilterPageUseCase() {
            return mock(FindWalletsByFilterPageUseCase.class);
        }

        @Bean
        @Primary
        FindDeletedWalletsByFilterPageUseCase findDeletedWalletsByFilterPageUseCase() {
            return mock(FindDeletedWalletsByFilterPageUseCase.class);
        }
    }

    private static Wallet wallet() {
        return new Wallet(WALLET_ID, WALLET_BALANCE);
    }

    private static WalletTombstone walletTombstone() {
        return new WalletTombstone(WALLET_ID, WALLET_BALANCE, DELETED_AT);
    }

    @Test
    void shouldCreateAndReturnCreatedWithLocation() throws Exception {
        CreateWalletCommand command = new CreateWalletCommand(WALLET_ID, WALLET_BALANCE);
        when(createWalletUseCase.execute(command)).thenReturn(wallet());

        mockMvc.perform(post("/wallets")
                .content(EXPECTED_BODY)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", "/wallets/" + WALLET_ID))
            .andExpect(content().json(EXPECTED_BODY));

        verify(createWalletUseCase, times(1)).execute(command);
        verifyNoMoreInteractions(createWalletUseCase);
    }

    @Test
    void shouldFindByIdentifier() throws Exception {
        when(findWalletByIdUseCase.execute(WALLET_ID)).thenReturn(wallet());

        mockMvc.perform(get("/wallets/" + WALLET_ID).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().json(EXPECTED_BODY));

        verify(findWalletByIdUseCase, times(1)).execute(WALLET_ID);
        verifyNoMoreInteractions(findWalletByIdUseCase);
    }

    @Test
    void shouldUpdateAndReturnOk() throws Exception {
        UpdateWalletCommand command = new UpdateWalletCommand(WALLET_ID, WALLET_BALANCE);
        when(updateWalletUseCase.execute(command)).thenReturn(wallet());

        mockMvc.perform(put("/wallets/" + WALLET_ID)
                .content("{\"id\":\"11111111-1111-1111-1111-111111111111\",\"balance\":123.45}")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().json(EXPECTED_BODY));

        verify(updateWalletUseCase, times(1)).execute(command);
        verifyNoMoreInteractions(updateWalletUseCase);
    }

    @Test
    void shouldPatchAndReturnOk() throws Exception {
        PatchWalletCommand command = new PatchWalletCommand(WALLET_ID, WALLET_BALANCE, true);
        when(patchWalletUseCase.execute(command)).thenReturn(wallet());

        mockMvc.perform(patch("/wallets/" + WALLET_ID)
                .content("{\"balance\":123.45}")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().json(EXPECTED_BODY));

        verify(patchWalletUseCase, times(1)).execute(command);
        verifyNoMoreInteractions(patchWalletUseCase);
    }

    @Test
    void shouldDeleteAndReturnNoContent() throws Exception {
        mockMvc.perform(delete("/wallets/" + WALLET_ID))
            .andExpect(status().isNoContent());

        verify(deleteWalletUseCase, times(1)).execute(new DeleteWalletCommand(WALLET_ID));
        verifyNoMoreInteractions(deleteWalletUseCase);
    }

    @Test
    void shouldRestoreAndReturnNoContent() throws Exception {
        mockMvc.perform(post("/wallets/" + WALLET_ID + "/restore"))
            .andExpect(status().isNoContent());

        verify(restoreWalletUseCase, times(1)).execute(new RestoreWalletCommand(WALLET_ID));
        verifyNoMoreInteractions(restoreWalletUseCase);
    }

    @Test
    void shouldFindDeletedByIdentifier() throws Exception {
        when(findDeletedWalletByIdUseCase.execute(WALLET_ID)).thenReturn(walletTombstone());

        mockMvc.perform(get("/wallets/deleted/" + WALLET_ID).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().json(EXPECTED_BODY))
            .andExpect(jsonPath("$.deletedAt", is(DELETED_AT.toString())));

        verify(findDeletedWalletByIdUseCase, times(1)).execute(WALLET_ID);
        verifyNoMoreInteractions(findDeletedWalletByIdUseCase);
    }

    @Test
    void shouldReturnPagedResultsWithMetadata() throws Exception {
        when(findWalletsByFilterPageUseCase.execute(any(), any()))
            .thenReturn(new PageResult<>(List.of(wallet()), 0, 20, 1L));

        mockMvc.perform(get("/wallets").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items", hasSize(1)))
            .andExpect(jsonPath("$.page", is(0)))
            .andExpect(jsonPath("$.size", is(20)))
            .andExpect(jsonPath("$.totalItems", is(1)))
            .andExpect(jsonPath("$.totalPages", is(1)));
    }

    @Test
    void shouldReturnPagedDeletedResults() throws Exception {
        when(findDeletedWalletsByFilterPageUseCase.execute(any(), any()))
            .thenReturn(new PageResult<>(List.of(walletTombstone()), 0, 20, 1L));

        mockMvc.perform(get("/wallets/deleted").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items", hasSize(1)))
            .andExpect(jsonPath("$.items[0].deletedAt", is(DELETED_AT.toString())));
    }

    @Test
    void shouldRejectUnparseableIdentifier() throws Exception {
        mockMvc.perform(get("/wallets/not-an-identifier").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().is4xxClientError());
    }
}
