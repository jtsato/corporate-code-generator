package io.github.jtsato.walletservice.entrypoint.rest.common.filter;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.ArrayList;
import java.util.List;

public record RestFilterFieldDefinition(String publicName, String domainName, List<RestFilterOperator> supportedOperators) {
    public RestFilterFieldDefinition { var fields = new ArrayList<FieldViolation>(); if (publicName == null || publicName.isBlank()) fields.add(new FieldViolation("publicName", "common.rest.filter.field.public-name.required", "Public filter field name is required.")); if (domainName == null || domainName.isBlank()) fields.add(new FieldViolation("domainName", "common.rest.filter.field.domain-name.required", "Domain filter field name is required.")); if (supportedOperators == null) fields.add(new FieldViolation("supportedOperators", "common.rest.filter.field.operators.required", "Filter operators are required.")); else { if (supportedOperators.isEmpty()) fields.add(new FieldViolation("supportedOperators", "common.rest.filter.field.operators.empty", "Filter operators must not be empty.")); if (supportedOperators.stream().anyMatch(java.util.Objects::isNull)) fields.add(new FieldViolation("supportedOperators", "common.rest.filter.field.operators.null-element", "Filter operators must not contain null elements.")); } if (!fields.isEmpty()) throw new ValidationException(fields); supportedOperators = List.copyOf(supportedOperators); }
    public static RestFilterFieldDefinition of(String publicName, String domainName, List<RestFilterOperator> supportedOperators) { return new RestFilterFieldDefinition(publicName, domainName, supportedOperators); }
}
