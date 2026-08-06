package io.github.jtsato.walletservice.entrypoint.rest.common.filter;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public final class RestFilterDefinition {
    private final List<RestFilterFieldDefinition> fields; private final Map<String, RestFilterFieldDefinition> fieldsByPublicName;
    private RestFilterDefinition(List<RestFilterFieldDefinition> fields) { this.fields = fields; this.fieldsByPublicName = fields.stream().collect(java.util.stream.Collectors.toMap(RestFilterFieldDefinition::publicName, field -> field, (first, second) -> first, LinkedHashMap::new)); }
    public static RestFilterDefinition of(List<RestFilterFieldDefinition> fields) { var violations = new ArrayList<FieldViolation>(); if (fields == null) violations.add(new FieldViolation("fields", "common.rest.filter.definition.fields.required", "Filter definition fields are required.")); else { if (fields.isEmpty()) violations.add(new FieldViolation("fields", "common.rest.filter.definition.fields.empty", "Filter definition fields must not be empty.")); if (fields.stream().anyMatch(java.util.Objects::isNull)) violations.add(new FieldViolation("fields", "common.rest.filter.definition.fields.null-element", "Filter definition fields must not contain null elements.")); if (fields.stream().filter(java.util.Objects::nonNull).map(RestFilterFieldDefinition::publicName).distinct().count() != fields.size()) violations.add(new FieldViolation("fields", "common.rest.filter.definition.fields.duplicate", "Filter definition fields must not contain duplicate public names.")); } if (!violations.isEmpty()) throw new ValidationException(violations); return new RestFilterDefinition(List.copyOf(fields)); }
    public Optional<RestFilterFieldDefinition> findField(String publicName) { return Optional.ofNullable(fieldsByPublicName.get(publicName)); }
    public List<RestFilterFieldDefinition> fields() { return fields; }
}
