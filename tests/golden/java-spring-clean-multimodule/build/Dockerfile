FROM maven:3.9-eclipse-temurin-25-alpine AS build
WORKDIR /build

# Copy the reactor descriptors before the sources so that the plugin resolution
# layer is reused whenever only source files change.
COPY pom.xml ./
COPY core/pom.xml core/
COPY entrypoints/rest/pom.xml entrypoints/rest/
COPY infra/database/pom.xml infra/database/
COPY configuration/pom.xml configuration/

RUN mvn -B dependency:resolve-plugins

COPY . .
RUN mvn -B -DskipTests -pl configuration -am package

FROM eclipse-temurin:25-jre-alpine AS runtime
WORKDIR /app

ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC" \
    SERVER_PORT=8080

RUN addgroup -g 10001 spring \
 && adduser -u 10001 -G spring -D -H -s /sbin/nologin spring

COPY --from=build --chown=10001:10001 /build/configuration/target/wallet-service-starter.jar /app/application.jar

USER 10001:10001

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --quiet --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "/app/application.jar"]
