// The HTTP contract the generated application exposes to its runtime environment.
//
// These two values are consumed by more than one producer: the `configuration`
// producer renders them into `application.yaml` and into the generated Actuator
// health smoke test, and the `build` producer renders them into the generated
// `Dockerfile` (`EXPOSE`, `HEALTHCHECK`) and Compose file. Keeping them here
// means the container healthcheck cannot drift away from the endpoint the
// generated application actually serves.
export const springApplicationPort = 8080;
export const springActuatorHealthPath = "/actuator/health";

// Springdoc's default document path. The generated smoke request collection
// points at it, so it belongs to the same runtime contract.
export const springOpenApiDocumentPath = "/v3/api-docs";
