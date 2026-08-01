# Corporate Code Generator

`java-spring-clean-multimodule` now generates 54 artifacts, including a Querydsl predicate foundation in Infra. Validate it with `npm run smoke:querydsl:java-multimodule`.

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
