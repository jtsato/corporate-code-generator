package io.github.jtsato.walletservice.entrypoint.rest.domains.wallet;

import io.github.jtsato.walletservice.core.common.filter.FilterExpression;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.PageResult;
import io.github.jtsato.walletservice.core.common.paging.SortOrder;
import io.github.jtsato.walletservice.core.domains.wallet.model.Wallet;
import io.github.jtsato.walletservice.core.domains.wallet.model.WalletTombstone;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.create.CreateWalletUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.delete.DeleteWalletCommand;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.delete.DeleteWalletUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindDeletedWalletByIdUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindDeletedWalletsByFilterPageUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletByIdUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.find.FindWalletsByFilterPageUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.patch.PatchWalletUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.restore.RestoreWalletCommand;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.restore.RestoreWalletUseCase;
import io.github.jtsato.walletservice.core.domains.wallet.usecase.update.UpdateWalletUseCase;
import io.github.jtsato.walletservice.entrypoint.rest.common.filter.RestFilterParser;
import io.github.jtsato.walletservice.entrypoint.rest.common.sort.RestSortParser;
import io.github.jtsato.walletservice.entrypoint.rest.common.WalletPageResponse;
import io.github.jtsato.walletservice.entrypoint.rest.common.WalletTombstonePageResponse;
import io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.filter.WalletRestFilterDefinition;
import io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.request.CreateWalletRequest;
import io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.request.PatchWalletRequest;
import io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.request.UpdateWalletRequest;
import io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.sort.WalletRestSortDefinition;
import io.github.jtsato.walletservice.entrypoint.rest.domains.wallet.WalletTombstoneResponse;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/wallets")
public class WalletController implements WalletApi {
    private final FindWalletsByFilterPageUseCase findWalletsByFilterPageUseCase;
    private final FindWalletByIdUseCase findWalletByIdUseCase;
    private final CreateWalletUseCase createWalletUseCase;
    private final UpdateWalletUseCase updateWalletUseCase;
    private final PatchWalletUseCase patchWalletUseCase;
    private final DeleteWalletUseCase deleteWalletUseCase;
    private final FindDeletedWalletsByFilterPageUseCase findDeletedWalletsByFilterPageUseCase;
    private final FindDeletedWalletByIdUseCase findDeletedWalletByIdUseCase;
    private final RestoreWalletUseCase restoreWalletUseCase;

    public WalletController(FindWalletsByFilterPageUseCase findWalletsByFilterPageUseCase, FindWalletByIdUseCase findWalletByIdUseCase, CreateWalletUseCase createWalletUseCase, UpdateWalletUseCase updateWalletUseCase, PatchWalletUseCase patchWalletUseCase, DeleteWalletUseCase deleteWalletUseCase, FindDeletedWalletsByFilterPageUseCase findDeletedWalletsByFilterPageUseCase, FindDeletedWalletByIdUseCase findDeletedWalletByIdUseCase, RestoreWalletUseCase restoreWalletUseCase) {
        this.findWalletsByFilterPageUseCase = findWalletsByFilterPageUseCase;
        this.findWalletByIdUseCase = findWalletByIdUseCase;
        this.createWalletUseCase = createWalletUseCase;
        this.updateWalletUseCase = updateWalletUseCase;
        this.patchWalletUseCase = patchWalletUseCase;
        this.deleteWalletUseCase = deleteWalletUseCase;
        this.findDeletedWalletsByFilterPageUseCase = findDeletedWalletsByFilterPageUseCase;
        this.findDeletedWalletByIdUseCase = findDeletedWalletByIdUseCase;
        this.restoreWalletUseCase = restoreWalletUseCase;
    }

    @Override
    @GetMapping
    public WalletPageResponse findAll(
        @RequestParam(name = "filter", required = false) List<String> filter,
        @RequestParam(name = "page", required = false) Integer page,
        @RequestParam(name = "size", required = false) Integer size,
        @RequestParam(name = "sort", required = false) List<String> sort
    ) {
        FilterExpression expression = RestFilterParser.parse(filter, WalletRestFilterDefinition.create());
        List<SortOrder> sortOrders = RestSortParser.parse(sort, WalletRestSortDefinition.create());
        PageRequest pageRequest = PageRequest.of(
            page == null ? PageRequest.DEFAULT_PAGE : page,
            size == null ? PageRequest.DEFAULT_SIZE : size,
            sortOrders
        );
        PageResult<Wallet> result = findWalletsByFilterPageUseCase.execute(expression, pageRequest);
        List<WalletResponse> items = result.items()
            .stream()
            .map(WalletResponse::from)
            .toList();
        return new WalletPageResponse(items, result.page(), result.size(), result.totalItems(), result.totalPages());
    }

    @Override
    @GetMapping("/deleted")
    public WalletTombstonePageResponse findDeleted(
        @RequestParam(name = "filter", required = false) List<String> filter,
        @RequestParam(name = "page", required = false) Integer page,
        @RequestParam(name = "size", required = false) Integer size,
        @RequestParam(name = "sort", required = false) List<String> sort
    ) {
        FilterExpression expression = RestFilterParser.parse(filter, WalletRestFilterDefinition.create());
        List<SortOrder> sortOrders = RestSortParser.parse(sort, WalletRestSortDefinition.create());
        PageRequest pageRequest = PageRequest.of(
            page == null ? PageRequest.DEFAULT_PAGE : page,
            size == null ? PageRequest.DEFAULT_SIZE : size,
            sortOrders
        );
        PageResult<WalletTombstone> result = findDeletedWalletsByFilterPageUseCase.execute(expression, pageRequest);
        List<WalletTombstoneResponse> items = result.items()
            .stream()
            .map(WalletTombstoneResponse::from)
            .toList();
        return new WalletTombstonePageResponse(items, result.page(), result.size(), result.totalItems(), result.totalPages());
    }

    @Override
    @GetMapping("/{id}")
    public WalletResponse findById(@PathVariable UUID id) {
        Wallet result = findWalletByIdUseCase.execute(id);
        return WalletResponse.from(result);
    }

    @Override
    @GetMapping("/deleted/{id}")
    public WalletTombstoneResponse findDeletedById(@PathVariable UUID id) {
        WalletTombstone result = findDeletedWalletByIdUseCase.execute(id);
        return WalletTombstoneResponse.from(result);
    }

    @Override
    @PutMapping("/{id}")
    public WalletResponse update(@PathVariable UUID id, @RequestBody UpdateWalletRequest request) {
        Wallet updated = updateWalletUseCase.execute(request.toCommand(id));
        return WalletResponse.from(updated);
    }

    @Override
    @PatchMapping("/{id}")
    public WalletResponse patch(@PathVariable UUID id, @RequestBody PatchWalletRequest request) {
        Wallet patched = patchWalletUseCase.execute(request.toCommand(id));
        return WalletResponse.from(patched);
    }

    @Override
    @PostMapping
    public ResponseEntity<WalletResponse> create(@RequestBody CreateWalletRequest request) {
        Wallet created = createWalletUseCase.execute(request.toCommand());
        return ResponseEntity
            .created(URI.create("/wallets/" + created.getId()))
            .body(WalletResponse.from(created));
    }

    @Override
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        deleteWalletUseCase.execute(new DeleteWalletCommand(id));
        return ResponseEntity.noContent().build();
    }

    @Override
    @PostMapping("/{id}/restore")
    public ResponseEntity<Void> restore(@PathVariable UUID id) {
        restoreWalletUseCase.execute(new RestoreWalletCommand(id));
        return ResponseEntity.noContent().build();
    }
}
