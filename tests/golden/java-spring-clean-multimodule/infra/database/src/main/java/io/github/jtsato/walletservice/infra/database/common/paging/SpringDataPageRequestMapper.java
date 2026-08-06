package io.github.jtsato.walletservice.infra.database.common.paging;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import io.github.jtsato.walletservice.core.common.paging.PageRequest;
import io.github.jtsato.walletservice.core.common.paging.SortDirection;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public final class SpringDataPageRequestMapper {
    private SpringDataPageRequestMapper() {
    }

    public static Pageable toPageable(PageRequest pageRequest, Map<String, String> sortPropertyMapping) {
        var fields = new ArrayList<FieldViolation>();
        if (pageRequest == null) fields.add(new FieldViolation("pageRequest", "common.paging.page-request.required", "Page request is required."));
        if (sortPropertyMapping == null) fields.add(new FieldViolation("sortPropertyMapping", "common.paging.sort.mapping.required", "Sort property mapping is required."));
        if (!fields.isEmpty()) throw validationException(fields);
        var orders = new ArrayList<Sort.Order>();
        for (var sortOrder : pageRequest.sort()) {
            var persistenceProperty = sortPropertyMapping.get(sortOrder.property());
            if (!sortPropertyMapping.containsKey(sortOrder.property())) fields.add(new FieldViolation("sort", "common.paging.sort.property.unsupported", "Sort property is not supported."));
            else if (persistenceProperty == null || persistenceProperty.isBlank()) fields.add(new FieldViolation("sortPropertyMapping", "common.paging.sort.mapping.invalid", "Sort property mapping target is invalid."));
            else orders.add(new Sort.Order(sortOrder.direction() == SortDirection.ASC ? Sort.Direction.ASC : Sort.Direction.DESC, persistenceProperty));
        }
        if (!fields.isEmpty()) throw validationException(fields);
        return org.springframework.data.domain.PageRequest.of(pageRequest.page(), pageRequest.size(), Sort.by(orders));
    }

    private static ValidationException validationException(List<FieldViolation> fields) {
        fields.sort(java.util.Comparator.comparing(FieldViolation::name));
        return new ValidationException(fields);
    }
}
