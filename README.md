# Corporate Code Generator

`java-spring-clean-multimodule` now generates 110 artifacts in the full profile: build 6, Core 42, entrypoints-rest 59, Infra 60, and Configuration 110. The build+core selection emits 48 artifacts; build+configuration emits 110. Because `entrypoints-rest` and `infra-database` require `core`, their selection counts include the Core artifacts transitively. It includes the REST Filter Contract Foundation, REST Sort Contract Foundation, Core Filter Common, entity-aware Querydsl filter definitions and mapper foundation in Infra, the Querydsl filter runtime integration, the REST filter runtime integration, paging runtime integration, filtered paging runtime integration, REST filtered paging runtime integration, REST sorting runtime integration, find-by-id runtime integration, and create runtime integration without HTTP exposure. The generated Java CI uses Java 25 and `mvn -B clean verify`.

Querydsl filters run against the database through a dedicated filtered use case. The generated flow is `FilterExpression -> QuerydslFilterMapper -> ListQuerydslPredicateExecutor -> repository -> gateway -> Find<Entity>ByFilterUseCase`. `FilterExpression.empty()` falls back to `repository.findAll()`. Validate it with `npm run smoke:querydsl-filter-runtime:java-multimodule`.

Paging now runs against the database through a dedicated paginated use case, separate from filtering. The generated flow is `PageRequest -> Find<Entity>PageUseCase -> gateway.findPage -> SpringDataPageRequestMapper -> JpaRepository.findAll(Pageable) -> SpringDataPageResultMapper -> PageResult<Entity>`. REST sorting is exposed separately through the combined HTTP flow. Validate it with `npm run smoke:paging-runtime:java-multimodule`. See [ADR-038](docs/adr/ADR-038-paging-runtime-integration.md).

REST filter parsing remains available as a repeatable `filter` parameter, but the HTTP controller now composes it with paging through `FindWalletsByFilterPageUseCase`. `RestFilterWebConfiguration` preserves commas inside a single `in` value, while repeated filters combine with AND. Parsing, conversion, and paging value errors surface as HTTP 400 through the existing `GlobalExceptionHandler`. Validate the parser alone with `npm run smoke:rest-filter:java-multimodule`, the generated Querydsl definitions with `npm run smoke:querydsl-filter:java-multimodule`, and the full HTTP path with `npm run smoke:http-filter:java-multimodule`. See [ADR-037](docs/adr/ADR-037-rest-filter-runtime-integration.md) and [ADR-040](docs/adr/ADR-040-rest-filtered-paging-runtime-integration.md).

Filtered paging now runs through the combined core port and persistence runtime: `FilterExpression + PageRequest -> Find<Entity>ByFilterPageUseCase -> gateway.findByFilterPage -> QuerydslFilterMapper + SpringDataPageRequestMapper -> repository.findAll(predicate, pageable) -> SpringDataPageResultMapper -> PageResult<Entity>`. An empty filter uses `repository.findAll(pageable)`. Validate it with `npm run smoke:querydsl-filter-paging-runtime:java-multimodule`. See [ADR-039](docs/adr/ADR-039-filtered-paging-runtime-integration.md).

REST filtered paging is exposed by `GET /wallets`, which always returns `WalletPageResponse` with `items`, `page`, `size`, `totalItems`, and `totalPages`. `filter` remains repeatable and combines with `page` and `size`; defaults are `page=0` and `size=20`. Validate it with `npm run smoke:http-filter:java-multimodule`. See [ADR-040](docs/adr/ADR-040-rest-filtered-paging-runtime-integration.md).

REST sorting is exposed by the repeatable `sort=<field>:<direction>` parameter. Directions are strictly `asc` or `desc`; Wallet initially allows `id` and `balance`. Sorting combines with filters and paging, and its domain-to-persistence mapping is generated from entity attributes. Validate it with `npm run smoke:http-filter:java-multimodule`. See [ADR-041](docs/adr/ADR-041-rest-sorting-runtime-integration.md).

Individual reads are exposed by `GET /wallets/{id}` through `FindWalletByIdUseCase`. Existing identifiers return `200`, unknown identifiers return `404`, and malformed UUID path values return `400`. Validate the complete generated path with `npm run smoke:find-by-id:java-multimodule`. See [ADR-042](docs/adr/ADR-042-find-by-id-runtime-and-rest-integration.md).

Create runtime is available without HTTP through `CreateWalletUseCase`. The
flow is `CreateWalletCommand -> CreateWalletUseCase -> WalletGateway.create ->
WalletGatewayProvider -> WalletRepository.existsById/save ->
WalletPersistenceMapper`. The command supplies the identifier, and duplicate
IDs raise a Core `ConflictException` before save. Validate the Core and H2
persistence path with `npm run smoke:create-runtime:java-multimodule`. POST,
HTTP 409 mapping and concurrent conflict translation remain future work; see
[ADR-043](docs/adr/ADR-043-create-runtime-integration.md) and
[ADR-044](docs/adr/ADR-044-create-conflict-runtime-integration.md).

It also generates explicit local, test, and production configuration profiles plus properties-driven CORS. Validate the generated preflight path with `npm run smoke:cors:java-multimodule`.

The multi-module Golden Path includes OpenAPI at `/v3/api-docs`. Validate it with `npm run smoke:openapi:java-multimodule`.

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=jtsato_corporate-code-generator&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=jtsato_corporate-code-generator)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=jtsato_corporate-code-generator&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=jtsato_corporate-code-generator)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=jtsato_corporate-code-generator&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=jtsato_corporate-code-generator)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=jtsato_corporate-code-generator&metric=coverage)](https://sonarcloud.io/summary/new_code?id=jtsato_corporate-code-generator)

[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=jtsato_corporate-code-generator&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=jtsato_corporate-code-generator)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=jtsato_corporate-code-generator&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=jtsato_corporate-code-generator)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=jtsato_corporate-code-generator&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=jtsato_corporate-code-generator)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=jtsato_corporate-code-generator&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=jtsato_corporate-code-generator)

Corporate Code Generator é uma plataforma determinística para transformar
modelos de aplicação, Profiles e Templates em scaffolds de código.

## Status atual

O primeiro Golden Path suporta atualmente:

- Profile: `java-spring-clean`;
- Modules: `build`, `domain`, `application` e `bootstrap` (`application` requer `domain` e `bootstrap` requer `application`);
- tecnologia: Java;
- entidade de referência: `Wallet`.

O pipeline atual é:

```text
Model validation
  -> Profile resolution
  -> Module resolution
  -> Template Pack resolution
  -> Java producer
  -> Generation Planner
  -> FilePlan
  -> dry-run ou NodeFileWriter
```

## Pré-requisitos e instalação

É necessário Node.js 22 ou superior e npm.

```bash
npm install
npm run typecheck
npm run build
npm test
```

Os comandos abaixo devem ser executados a partir da raiz do repositório.
Profiles e Template Packs são resolvidos relativamente ao `process.cwd()`.

Para uso local, o entrypoint compilado é o caminho mais portátil, inclusive
no Windows:

```bash
node packages/cli/dist/index.js <comando>
```

## Validar um modelo

```bash
node packages/cli/dist/index.js validate examples/wallet-service/model.yaml
```

## Dry-run

O dry-run produz somente o FilePlan, sem conteúdo de arquivos e sem mutação
do filesystem. O output root não é necessário:

```bash
node packages/cli/dist/index.js generate \
  examples/wallet-service/model.yaml \
  --profile java-spring-clean \
  --module domain \
  --dry-run
```

## Geração real

O output root precisa existir antes da execução. A CLI não o cria.

```bash
mkdir generated
node packages/cli/dist/index.js generate \
  examples/wallet-service/model.yaml \
  --profile java-spring-clean \
  --module domain \
  --output generated
```

O arquivo gerado estará em:

```text
generated/src/main/java/io/github/jtsato/walletservice/domain/Wallet.java
generated/pom.xml
generated/src/main/java/io/github/jtsato/walletservice/WalletServiceApplication.java
```

Maven é o build tool inicial. O `pom.xml` atual materializa Spring Boot
mínimo na versão `4.1.0`, sem web, REST ou JPA. Se Maven e Java 25 estiverem instalados, a
compilação do projeto gerado pode ser executada opcionalmente com:

```bash
mvn compile
```

### Smoke ArchUnit multi-módulo

### Smoke de error handling multi-módulo

O projeto multi-módulo também gera o contrato REST `ResponseStatus`, bundles
de mensagens e um handler global de exceções. Para validar essa foundation:

```bash
npm run smoke:error-handling:java-multimodule
```

O Golden Path `java-spring-clean-multimodule` gera `ArchitectureTests` no
módulo `configuration`. O smoke dedicado executa somente essas regras sobre o
código Java de produção, incluindo os limites core/entrypoint/infra e a
localização de entidades JPA e repositories:

```bash
npm run smoke:archunit:java-multimodule
```

Ele segue a mesma política de disponibilidade do Maven dos demais smokes.

### Smoke Core Filter Common multi-módulo

O Core gera uma foundation sem integração REST ou Querydsl runtime: operadores,
condições, grupos e expressões de filtro com validação determinística. O smoke
executa somente `*FilterConditionTests`, `*FilterGroupTests` e
`*FilterExpressionTests` no projeto gerado:

```bash
npm run smoke:filter:java-multimodule
```

Ele exige Maven e JDK compatível com Java 25 e segue a mesma política dos
demais smokes Maven.

### Smoke Querydsl filter runtime multi-módulo

O runtime de filtro é provado sem HTTP. O smoke executa somente
`*QuerydslFilterPersistenceTests` e `*FindWalletsByFilterUseCaseInteractorTests`:

```bash
npm run smoke:querydsl-filter-runtime:java-multimodule
```

O teste de persistência sobe o contexto Spring com H2, persiste três registros
determinísticos e valida condição única, `IN`, `AND`, `OR`, grupo aninhado e
expressão vazia por conjunto de identificadores. Quando o atributo-condutor
suporta ordenação, também valida `GREATER_THAN` e faixa. Ele não usa
`RestFilterParser`, não expõe filtros por HTTP e não introduz paginação ou
ordenação. Segue a mesma política de disponibilidade do Maven dos demais smokes.

### Smoke paging runtime multi-módulo

A paginação é provada sem HTTP, num fluxo isolado do filtro. O smoke executa
somente `*PagingPersistenceTests` e `*FindWalletsPageUseCaseInteractorTests`:

```bash
npm run smoke:paging-runtime:java-multimodule
```

O teste de persistência sobe o contexto Spring com H2 (sem `webEnvironment`),
persiste cinco registros determinísticos e valida, para `page`/`size` de
0/2, 1/2, 2/2 e 10/2, a quantidade de itens da página e os metadados
(`totalItems`, `totalPages`, `page`, `size`) do `PageResult` retornado por
`Find<Entity>PageUseCase`. Não valida conteúdo por ordem, porque
`findAll(Pageable)` sem `Sort` explícito não garante ordem estável, e não
introduz sorting só para estabilizar o teste. Não usa `RestFilterParser` nem
o runtime de filtro, não expõe paginação por HTTP e não combina paginação
com filtro. Segue a mesma política de disponibilidade do Maven dos demais
smokes.

### Smoke de contexto Spring multi-módulo

O Golden Path `java-spring-clean-multimodule` também possui um smoke dedicado
que gera o projeto completo e executa apenas `*ApplicationTests`, carregando o
contexto Spring e validando o bootstrap Spring Data/JPA com H2 no classpath de
teste:

```bash
npm run smoke:spring-context:java-multimodule
```

Ele exige Maven e JDK compatível com Java 25. Como os demais smokes Maven, é
ignorado quando Maven não estiver instalado, exceto se
`CODEGEN_REQUIRE_MAVEN_SMOKE=true` for definido. O smoke valida wiring e
bootstrap de persistência, mas não testa endpoint HTTP.

### Smoke HTTP runtime multi-módulo

O smoke HTTP gera o perfil completo e executa apenas `*HttpSmokeTests`. O teste
inicia o Spring Boot em porta aleatória, chama `GET /wallets` com o
`java.net.http.HttpClient` do JDK e valida status `200`, body `[]` e
`Content-Type` JSON:

```bash
npm run smoke:http:java-multimodule
```

Ele segue a mesma política de disponibilidade do Maven. Este smoke comprova o
caminho HTTP de leitura vazio; não introduz cliente de teste Spring adicional,
Actuator, healthcheck, seed de dados, escrita ou CRUD completo.

### Smoke HTTP persistence read multi-módulo

O smoke de leitura persistida mantém o Arrange restrito ao código de teste:
limpa o H2, persiste uma `WalletEntity` conhecida com o Spring Data repository
e faz a verificação exclusivamente por `GET /wallets`. Assim, os valores
precisam atravessar repository, provider, persistence mapper, domínio,
response DTO e serialização JSON:

```bash
npm run smoke:http-persistence-read:java-multimodule
```

O teste valida status `200`, `Content-Type` JSON e o body exato com o UUID e o
balance persistidos. Ele não cria endpoint de escrita, seed global, migration
ou configuração de datasource de produção.

### Smoke HTTP filter multi-módulo

O smoke de filtro HTTP prova o Milestone 6.15 ponta a ponta, executando
somente `*HttpFilterTests`:

```bash
npm run smoke:http-filter:java-multimodule
```

O teste persiste três `WalletEntity` determinísticas (mesmas fixtures do
`*QuerydslFilterPersistenceTests`), chama `GET /wallets` com e sem `filter` via
`java.net.http.HttpClient`, e valida: ausência de filtro retorna todos;
`balance:eq`, `balance:gt`, dois `filter` repetidos combinados com AND e
`id:in` retornam o conjunto de identificadores esperado (comparado sem
depender de ordem); campo desconhecido, operador não permitido, valor
inválido e formato inválido retornam `400`. Ele não duplica os testes
unitários do `RestFilterParser` nem introduz paginação, sorting ou sintaxe
OR. Segue a mesma política de disponibilidade do Maven dos demais smokes.

Para limpar a saída local:

```bash
rm -rf generated
```

No PowerShell:

```powershell
Remove-Item generated -Recurse -Force
```

## Smoke test

O smoke test compila o projeto e executa a CLI buildada em um diretório
temporário:

```bash
npm run smoke
```

Ele valida `validate`, dry-run, geração física e o Golden Test de `Wallet.java`.

### Smoke Maven opcional

Para validar também a compilação do projeto gerado, execute:

```bash
npm run smoke:maven
```

Esse smoke não faz parte de `npm run smoke`. Ele requer Maven instalado e um
JDK compatível com Java 25. Na primeira execução, Maven pode baixar o parent,
plugins e dependências; por isso a execução pode ser lenta com o cache vazio.

Se Maven não estiver instalado, o teste é pulado por padrão com uma mensagem
clara. Para tornar a ausência de Maven uma falha, use:

```bash
CODEGEN_REQUIRE_MAVEN_SMOKE=true npm run smoke:maven
```

O comando manual equivalente, após gerar um projeto, é:

```bash
cd <generated-output>
mvn compile
```

## Limitações atuais

- somente o Profile `java-spring-clean` com os módulos `build`, `domain`, `application`, `bootstrap` e `api-rest`;
- sem `--module`, gera `pom.xml`, domain, application e a classe principal Spring Boot;
- `--module build` gera somente `pom.xml`;
- `--module application` gera domain e application, sem `pom.xml`;
- `--module bootstrap` gera domain, application e a classe principal, sem `pom.xml`;
- `--module api-rest` gera domain, application e o controller REST, sem `pom.xml`;
- não há aplicação web funcional, REST ou JPA neste estágio;
- o controller REST inicial fica no package `.api`, sem endpoints reais;
- `api-rest` também gera response DTOs como Java records no package `.api`, derivados dos atributos do modelo;
- controllers ainda não referenciam os DTOs e não há endpoints ou mappers;
- o primeiro GET REST é estrutural, usa `findAll()` com `List.of()` e não possui delegação para service, persistência ou comportamento de negócio real;
- entidades de domínio permanecem classes com fields `final`, constructor completo e getters JavaBean;
- não são gerados setters, constructor sem argumentos, `equals`, `hashCode` ou `toString` neste estágio;
- application services são beans Spring com `@Service`; `findAll()` retorna entidades de domínio com `List.of()` provisório, sem persistence, mapper ou delegação do controller;
- a geração completa inclui `spring-boot-starter-web`; planos parciais podem não ser compiláveis isoladamente;
- somente operação `CREATE`;
- não há overwrite, skip, merge ou rollback;
- o output root deve existir;
- a execução deve partir da raiz do repositório;
- não há registry ou plugin system de producers;
- Profiles e Template Packs não são descobertos globalmente ou remotamente;
- ainda não há Spring/JPA, REST, Docker ou Helm.

## Troubleshooting

**`codegen` não encontrado**: use `node packages/cli/dist/index.js ...` ou
execute `npm run build` antes dos comandos da CLI.

**Output root inexistente (`IO001`)**: crie o diretório antes de executar a
geração real, por exemplo `mkdir generated`.

**Profile ou Template Pack não encontrado**: confirme que o comando está
sendo executado a partir da raiz do repositório.

**Erro `CREATE` porque o arquivo já existe (`IO002`)**: use um output root
novo ou remova a saída anterior. O writer nunca sobrescreve arquivos.

**Caminhos Windows**: target paths do FilePlan usam separadores POSIX (`/`).
Não use backslashes em caminhos lógicos de geração.

## Estrutura do monorepo

```text
packages/core/                    contratos e pipeline agnóstico
packages/adapter-java/            transformação específica de Java
packages/template-engine-nunjucks/engine de templates
packages/file-writer-node/        escrita no filesystem
packages/cli/                     composition root
profiles/                         Profiles locais
template-packs/                   Template Packs locais
examples/                         modelos de exemplo
tests/golden/                     Golden Tests
tests/smoke/                      smoke test da CLI
```
