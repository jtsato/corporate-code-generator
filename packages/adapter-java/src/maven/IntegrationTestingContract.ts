/**
 * Shared contract for the generated Testcontainers verification capability.
 *
 * The build producer writes the Maven profile that runs the integration tests and the
 * infra-database producer writes the test classes themselves. Both must agree on the profile name
 * and the container image, so neither owns these values alone.
 */

/** Maven profile that activates Failsafe. Nothing runs the `*IT` classes without it. */
export const integrationTestProfileId = "integration-test";

/**
 * Pinned by digest-free tag rather than `latest` so a generated project builds the same way
 * tomorrow, per ADR-005.
 */
export const testcontainersDatabaseImage = "postgres:18-alpine";
