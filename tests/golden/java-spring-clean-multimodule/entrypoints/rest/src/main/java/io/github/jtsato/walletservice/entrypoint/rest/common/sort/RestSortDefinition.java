package io.github.jtsato.walletservice.entrypoint.rest.common.sort;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public final class RestSortDefinition {
    private final List<RestSortFieldDefinition> fields;
    private final Map<String, RestSortFieldDefinition> fieldsByPublicName;

    private RestSortDefinition(List<RestSortFieldDefinition> fields) {
        this.fields = List.copyOf(fields);
        this.fieldsByPublicName = this.fields.stream().collect(java.util.stream.Collectors.toMap(RestSortFieldDefinition::publicName, field -> field, (first, second) -> first, LinkedHashMap::new));
    }

    public static RestSortDefinition of(List<RestSortFieldDefinition> fields) {
        var violations = new ArrayList<FieldViolation>();
        if (fields == null) violations.add(new FieldViolation("fields", "common.rest.sort.definition.fields.required", "Sort definition fields are required."));
        else {
            if (fields.isEmpty()) violations.add(new FieldViolation("fields", "common.rest.sort.definition.fields.empty", "Sort definition fields must not be empty."));
            if (fields.stream().anyMatch(java.util.Objects::isNull)) violations.add(new FieldViolation("fields", "common.rest.sort.definition.fields.null-element", "Sort definition fields must not contain null elements."));
            if (fields.stream().filter(java.util.Objects::nonNull).map(RestSortFieldDefinition::publicName).distinct().count() != fields.size()) violations.add(new FieldViolation("fields", "common.rest.sort.definition.fields.duplicate", "Sort definition fields must not contain duplicate public names."));
        }
        if (!violations.isEmpty()) throw new ValidationException(violations);
        return new RestSortDefinition(fields);
    }

    public Optional<RestSortFieldDefinition> findField(String publicName) { return Optional.ofNullable(fieldsByPublicName.get(publicName)); }
    public List<RestSortFieldDefinition> fields() { return fields; }
}
