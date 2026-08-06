# Roadmap

Este é o roadmap canônico do Corporate Code Generator.

Ele consolida a história conhecida a partir dos materiais disponíveis e da
memória documental do projeto. Para evitar oficializar inferências como fatos,
cada item diferencia explicitamente:

- **Confirmado**: nome e/ou escopo preservado nos materiais disponíveis.
- **Reconstruído**: sequência e conteúdo recuperados por inferência documental,
  mas sem confirmação completa do cabeçalho histórico.
- **Histórico não recuperado**: milestone mencionado pela numeração, mas sem
  nome histórico preservado nos materiais disponíveis.
- **Planejado/proposto**: trabalho ainda não concluído ou milestone de
  fechamento proposto.

## Fases 1–2 — Fundação arquitetural

Status: **confirmado como fase fundacional, sem numeração retrospectiva
confirmada**.

Não há milestones numerados `1.x` ou `2.x` preservados nos materiais atuais.
Essa fase foi registrada principalmente nos ADRs iniciais e decisões
arquiteturais fundacionais:

- TypeScript como linguagem.
- Nunjucks como template engine.
- IR agnóstica de tecnologia.
- Regras fora dos templates.
- Geração determinística.
- Profiles e módulos.
- Template Packs versionados.
- IA fora do runtime.
- FilePlan antes do filesystem.
- Golden Tests.
- Java como primeiro Golden Path.

Não se deve inventar números retrospectivos para essas decisões.

## Fase 3 — Pipeline de geração

### Históricos não recuperados

- `3.1` — **histórico não recuperado**; nome histórico não preservado.
- `3.2` — **histórico não recuperado**; nome histórico não preservado.
- `3.3` — **histórico não recuperado**; nome histórico não preservado.
- `3.4` — **histórico não recuperado**; nome histórico não preservado.

### Milestones confirmados

- `3.5` — **Java Domain Generation Foundation**
  Status: **confirmado**. Primeiro producer Java, entidade de domínio, planner e
  golden.

- `3.6` — **Versioned Template Pack Foundation**
  Status: **confirmado**. Manifest declarativo, `TemplatePack`,
  `TemplateDefinition`, loader, resolver e `OutputPathResolver`.

- `3.7` — **FileWriter Foundation**
  Status: **confirmado**. `NodeFileWriter`, preflight do filesystem e operação
  `CREATE`.

- `3.8` — **CLI Generate Integration**
  Status: **confirmado**. `codegen generate`, `--profile`, `--module`,
  `--output` e `--dry-run`.

O `3.6` retirou do producer o conhecimento do template físico e do caminho
final; o `3.7` introduziu a escrita fora do Core; o `3.8` fez a CLI atuar como
composition root.

## Fase 4 — Golden Path Java single-module

- `4.0` — **Application Module Foundation**
  Status: **confirmado**. Módulo application e composição explícita de múltiplos
  producers.

- `4.1` — **Maven Build Foundation**
  Status: **reconstruído**. Módulo build e geração determinística do `pom.xml`.

- `4.2` — **Minimal Spring Boot Materialization**
  Status: **reconstruído**. Módulo bootstrap e classe `@SpringBootApplication`.

- `4.3` — **REST Controller Foundation**
  Status: **reconstruído**. Módulo `api-rest` e controller estrutural.

O número `4.0` está explicitamente documentado. A numeração `4.1–4.3` é uma
reconstrução pela sequência dos designs e pelos ADRs; os conteúdos estão
confirmados, mas os documentos disponíveis não mostram seus números no
cabeçalho.

## Fase 5 — Golden Path Java multi-module

### Roadmap formal recuperado

- `5.1` — **Multi-module Profile and Template Pack Skeleton**
  Status: **confirmado**.

- `5.2` — **Maven Reactor Foundation**
  Status: **confirmado**.

- `5.3` — **Core Module Migration**
  Status: **confirmado**.

- `5.4` — **Configuration Module Foundation**
  Status: **confirmado**.

- `5.5` — **REST Entrypoint Module Foundation**
  Status: **confirmado**.

- `5.6` — **Multi-module Maven Compile Smoke**
  Status: **confirmado**.

- `5.7` — **Core Use Cases and Ports**
  Status: **confirmado**.

- `5.8` — **Database Infrastructure Foundation**
  Status: **confirmado**.

- `5.9` — **Spring Wiring Foundation**
  Status: **confirmado**.

- `5.10` — **REST Delegation and Runtime Validation**
  Status: **confirmado**.

- `5.11` — **Spring Context Smoke Foundation**
  Status: **confirmado**.

### Slices adicionais

- `5.12` — **Spring Data Repository Foundation**
  Status: **confirmado**.

- `5.13` — **histórico não recuperado**; nome histórico não preservado.
- `5.14` — **histórico não recuperado**; nome histórico não preservado.
- `5.15` — **histórico não recuperado**; nome histórico não preservado.
- `5.16` — **histórico não recuperado**; nome histórico não preservado.

- `5.17` — **HTTP Persistence Read Validation**
  Status: **confirmado**. Adicionou `WalletHttpPersistenceReadTests`,
  preparando uma entidade pelo repository e verificando-a exclusivamente pelo
  endpoint HTTP.

Os nomes históricos exatos de `5.13–5.16` não estão preservados nos materiais
disponíveis. Eles não devem ser oficializados por inferência sem consultar o
histórico Git anterior.

## Fase 6 — Capabilities e runtime do Golden Path

### Arquitetura e foundations

- `6.0` — **Advanced Reference Architecture Analysis**
  Status: **confirmado**.

- `6.1` — **Capability Taxonomy and Profile Options**
  Status: **confirmado**.

- `6.2` — **ArchUnit Architecture Guardrails**
  Status: **confirmado**.

- `6.3` — **Standard REST Error Contract and i18n**
  Status: **confirmado**.

- `6.4` — **Configuration Profiles and CORS Policy**
  Status: **confirmado**.

- `6.5` — **OpenAPI and Swagger UI Policy**
  Status: **confirmado**.

- `6.6` — **Core Validation and Self-Validation**
  Status: **confirmado**.

- `6.7` — **Core Paging Common**
  Status: **confirmado**.

- `6.8` — **Spring Data Paging Adapter**
  Status: **confirmado**.

- `6.9` — **Querydsl Foundation in Infra Database**
  Status: **confirmado**.

- `6.10` — **Generated Java CI Pipeline**
  Status: **confirmado**.

- `6.11` — **Core Filter Common**
  Status: **confirmado**.

- `6.12` — **REST Filter Contract Foundation**
  Status: **confirmado**.

- `6.13` — **Querydsl Filter Mapper Foundation**
  Status: **confirmado**.

### Read side, filtros e paginação

- `6.14` — **Querydsl Filter Runtime Integration**
  Status: **confirmado**.

- `6.15` — **REST Filter Runtime Integration**
  Status: **confirmado**.

- `6.16` — **Paging Runtime Integration**
  Status: **confirmado**.

- `6.17` — **Filtered Paging Runtime Integration**
  Status: **confirmado**.

- `6.18` — **REST Filtered Paging Runtime Integration**
  Status: **confirmado**.

- `6.19` — **REST Sorting Runtime Integration**
  Status: **confirmado**.

- `6.20` — **Find By ID Runtime and REST Integration**
  Status: **confirmado**.

O `6.17` foi deliberadamente pivotado para combinar filtro e paginação apenas
no runtime; a exposição HTTP ficou para o `6.18`.

### Create side

- `6.21` — **Create Runtime Integration**
  Status: **confirmado**.

- `6.22` — **Create Conflict Runtime Integration**
  Status: **confirmado**.

- `6.23` — **RestSortParser Generated-Test Stabilization**
  Status: **confirmado**.

- `6.24` — **Full Maven Reactor Quality Gate**
  Status: **confirmado**.

- `6.25` — **REST Create Integration**
  Status: **confirmado**.

O `6.23` foi um milestone corretivo: resolveu o teste Java gerado com
`List.of((String) null)`. Por isso, o POST inicialmente esperado para o `6.23`
foi deslocado até o `6.25`.

Após o `6.25`, o fluxo passou a incluir `POST /wallets`, `201 Created`,
`Location`, HTTP 400 para corpo inválido e HTTP 409 para duplicidade.

### Update side

- `6.26` — **Update Runtime Integration**
  Status: **confirmado**.

- `6.27` — **REST Update Integration**
  Status: **confirmado**.

O `6.26` introduziu `UpdateWalletCommand`, use case, gateway e persistência,
garantindo que ID inexistente não virasse upsert. O `6.27` expôs esse runtime
por `PUT /wallets/{id}`, com o ID exclusivamente no path.

### Delete side e fechamento

- `6.28` — **Delete Runtime Integration**
  Status: **confirmado/concluído**.

- `6.29` — **REST Delete Integration**
  Status: **planejado/proposto**.

- `6.30` — **Golden Path Java 1.0 Release Readiness**
  Status: **planejado/proposto**.

O `6.30` não deve adicionar capability nova. Ele deverá apenas auditar:

- Definition of Done.
- Artifacts e contagens.
- Goldens.
- Arquitetura.
- Typecheck e build.
- Testes e coverage.
- Todos os smokes.
- Maven reactor completo.
- CI.
- ADRs e documentação.
- Blockers pendentes.

## Visão consolidada do estado atual

Status conforme o material-base consolidado:

- Concluídos: até `6.28`.
- Próximo funcional: `6.29`.
- Fechamento proposto: `6.30`.

## Fronteira — Target Release Java 1.0

Target Release: **Golden Path Java 1.0**.

Incluído na fronteira:

- GET collection.
- Filtro, paginação e ordenação.
- GET by ID.
- POST.
- PUT.
- DELETE.
- Contratos de erro.
- OpenAPI.
- Persistência real.
- Testes HTTP reais.
- Quality gates.
- Maven reactor.
- CI e documentação.

Futuro/opcional:

- PATCH.
- Soft delete.
- Optimistic locking.
- Auditoria.
- ETag/If-Match.
- Autenticação e autorização.
- Outros bancos, stacks e profiles.
