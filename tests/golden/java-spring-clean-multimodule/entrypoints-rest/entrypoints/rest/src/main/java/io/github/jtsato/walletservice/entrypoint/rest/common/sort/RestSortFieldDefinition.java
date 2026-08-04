package io.github.jtsato.walletservice.entrypoint.rest.common.sort;

import io.github.jtsato.walletservice.core.common.exception.FieldViolation;
import io.github.jtsato.walletservice.core.common.exception.ValidationException;
import java.util.ArrayList;

public record RestSortFieldDefinition(String publicName, String domainName) {
    public RestSortFieldDefinition {
        var fields = new ArrayList<FieldViolation>();
        if (publicName == null || publicName.isBlank()) fields.add(new FieldViolation("publicName", "common.rest.sort.field.public-name.required", "Public sort field name is required."));
        if (domainName == null || domainName.isBlank()) fields.add(new FieldViolation("domainName", "common.rest.sort.field.domain-name.required", "Domain sort field name is required."));
        fields.sort(java.util.Comparator.comparing(FieldViolation::name));
        if (!fields.isEmpty()) throw new ValidationException(fields);
    }
    public static RestSortFieldDefinition of(String publicName, String domainName) { return new RestSortFieldDefinition(publicName, domainName); }
}
