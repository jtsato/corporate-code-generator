package io.github.jtsato.walletservice.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import jakarta.persistence.Entity;
import org.junit.jupiter.api.Test;

class PackageStructureArchitectureTests {
    private static final String BASE_PACKAGE = "io.github.jtsato.walletservice";

    private static final JavaClasses IMPORTED_CLASSES = new ClassFileImporter()
        .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
        .importPackages(BASE_PACKAGE);

    @Test
    void jpaEntitiesShouldResideInInfraEntityPackages() {
        classes()
            .that().areAnnotatedWith(Entity.class)
            .should().resideInAPackage(BASE_PACKAGE + ".infra..entity..")
            .check(IMPORTED_CLASSES);
    }

    @Test
    void repositoriesShouldResideInInfraRepositoryPackages() {
        classes()
            .that().haveSimpleNameEndingWith("Repository")
            .should().resideInAPackage(BASE_PACKAGE + ".infra..repository..")
            .check(IMPORTED_CLASSES);
    }
}
