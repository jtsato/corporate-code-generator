package io.github.jtsato.walletservice.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.Test;

class FrameworkIsolationArchitectureTests {
    private static final String BASE_PACKAGE = "io.github.jtsato.walletservice";

    private static final JavaClasses IMPORTED_CLASSES = new ClassFileImporter()
        .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
        .importPackages(BASE_PACKAGE);

    @Test
    void coreShouldNotDependOnSpring() {
        noClasses()
            .that().resideInAPackage(BASE_PACKAGE + ".core..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("org.springframework..")
            .check(IMPORTED_CLASSES);
    }

    @Test
    void coreShouldNotDependOnQuerydsl() {
        noClasses()
            .that().resideInAPackage(BASE_PACKAGE + ".core..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("com.querydsl..")
            .check(IMPORTED_CLASSES);
    }

    @Test
    void noClassesShouldUseQuerydslPathBuilder() {
        noClasses()
            .should().dependOnClassesThat()
            .haveFullyQualifiedName("com.querydsl.core.types.dsl.PathBuilder")
            .check(IMPORTED_CLASSES);
    }
}
