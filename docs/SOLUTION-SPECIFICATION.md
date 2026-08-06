# Corporate Code Generator

## Documento de Arquitetura e Especificação da Solução

**Status:** Draft  
**Versão:** 0.2  
**Tipo:** Solution Architecture & Technical Specification

---

# 1. Visão Geral

O **Corporate Code Generator** é uma plataforma de **model-driven application scaffolding** destinada à geração determinística de aplicações corporativas a partir de modelos declarativos, Profiles e padrões versionados da organização.

A solução não se limita à geração de classes ou componentes isolados. Seu objetivo é permitir a geração do **scaffolding completo de uma aplicação**, incluindo, conforme o Profile utilizado:

- código-fonte;
- estrutura arquitetural;
- projetos e módulos;
- testes;
- configurações de build;
- containerização;
- análise de qualidade;
- CI/CD;
- deployment;
- Infrastructure as Code;
- observabilidade;
- documentação.

Por exemplo, a partir de um modelo declarativo e de um Profile corporativo, o gerador poderá produzir:

```text
payment-service/
├── src/
│   ├── Domain/
│   ├── Application/
│   ├── Infrastructure/
│   └── Api/
├── tests/
│   ├── UnitTests/
│   └── IntegrationTests/
├── deploy/
│   ├── helm/
│   └── terraform/
├── Dockerfile
├── docker-compose.yml
├── sonar-project.properties
├── README.md
└── .github/
    └── workflows/
        ├── build.yml
        ├── test.yml
        └── deploy.yml
```

Inicialmente, serão suportados os ecossistemas:

- .NET / C#;
- Spring Boot / Java;
- TypeScript.

A solução deverá suportar diferentes estilos arquiteturais por meio de **Profiles**, como:

- Clean Architecture;
- Hexagonal Architecture;
- Vertical Slice Architecture;
- arquiteturas específicas da organização.

O gerador não utilizará Inteligência Artificial durante a geração.

A geração deverá ser:

- determinística;
- reproduzível;
- previsível;
- testável;
- versionável;
- automatizável.

Inteligência Artificial poderá ser utilizada durante o desenvolvimento de Models, Schemas, Rules, Transformers, Technology Adapters, Templates, testes e documentação, mas nunca será necessária para executar uma geração.

---

# 2. Visão do Produto

Conceitualmente:

```text
Application Model
       +
Corporate Profile
       +
Versioned Generator
       ↓
┌───────────────────────────────┐
│ Complete Service Scaffolding  │
├───────────────────────────────┤
│ Source Code                   │
│ Tests                         │
│ Build                         │
│ Quality                       │
│ Containerization              │
│ CI/CD                         │
│ Deployment                    │
│ Infrastructure as Code        │
│ Observability                 │
│ Documentation                 │
└───────────────────────────────┘
```

O Corporate Code Generator deve funcionar como mecanismo de implementação de **Golden Paths corporativos**.

Um Profile como:

```text
company-dotnet-service@3.2.0
```

poderá representar o padrão oficial da organização para um determinado tipo de serviço, incluindo:

```text
.NET
+
Clean Architecture
+
xUnit
+
EF Core
+
Docker
+
Sonar
+
GitHub Actions
+
Helm
+
Terraform
+
Observability
```

---

# 3. Problema

Grande parte do desenvolvimento inicial de aplicações corporativas consiste na implementação de estruturas previsíveis e repetitivas.

Exemplos relacionados ao código:

- entidades;
- value objects;
- DTOs;
- repositories;
- use cases;
- services;
- controllers;
- adapters;
- mappers;
- configurações de persistência;
- tratamento de erros;
- dependency injection;
- testes.

Além disso, aplicações corporativas normalmente precisam repetir estruturas operacionais:

- solution/project files;
- Dockerfiles;
- Docker Compose;
- configurações de qualidade;
- pipelines;
- manifests Kubernetes;
- Helm Charts;
- Terraform;
- observabilidade;
- documentação.

Esses elementos normalmente representam padrões corporativos conhecidos antes mesmo da implementação da regra de negócio.

O objetivo do gerador é automatizar essas transformações sem incorporar conhecimento específico de linguagem, framework, cloud ou ferramenta ao modelo semântico da aplicação.

---

# 4. Objetivos

## 4.1 Objetivos principais

A solução deverá:

1. gerar aplicações a partir de modelos declarativos;
2. gerar scaffolding completo de serviços;
3. suportar múltiplas tecnologias;
4. suportar diferentes arquiteturas;
5. suportar diferentes Golden Paths corporativos;
6. permitir geração completa ou modular;
7. permitir criação de novos Templates e Template Packs sem alteração significativa do Core;
8. centralizar decisões de geração em código testável;
9. manter Templates simples;
10. produzir resultados determinísticos;
11. permitir versionamento independente dos padrões corporativos;
12. fornecer uma CLI adequada para desenvolvimento local e CI/CD;
13. permitir validação antes de qualquer mutação no filesystem;
14. produzir aplicações compiláveis e testáveis;
15. facilitar utilização por humanos e agentes de IA durante a implementação.

---

# 5. Não Objetivos

Na primeira versão, explicitamente não fazem parte do escopo:

- geração por IA em runtime;
- interpretação de linguagem natural;
- análise automática de projetos existentes;
- geração baseada em Swagger/OpenAPI;
- reverse engineering de bancos de dados;
- geração baseada em UML;
- modificação arbitrária de código existente por IA;
- merge semântico de source code;
- execução de Template Packs não confiáveis;
- marketplace público de Templates.

Esses recursos poderão ser avaliados futuramente sem alterar os fundamentos arquiteturais.

---

# 6. Princípios Arquiteturais

## 6.1 Determinismo

A propriedade fundamental da geração será:

```text
Input Model
+
Generator Version
+
Model Schema Version
+
Profile Version
+
Template Pack Version
+
Explicit Configuration

=

Identical Output
```

Uma geração não poderá depender implicitamente de:

- LLM;
- serviço externo não determinístico;
- horário;
- estado global;
- dados não declarados;
- comportamento aleatório;
- configurações locais desconhecidas.

---

## 6.2 Separation of Concerns

O pipeline conceitual será:

```text
Model
  ↓
Parser
  ↓
IR
  ↓
Profile / Modules
  ↓
Technology Adapters
  ↓
Rules / Transformers
  ↓
Template Models
  ↓
Templates
  ↓
File Plan
  ↓
Filesystem
```

Cada estágio possui responsabilidade distinta.

---

## 6.3 Princípio Fundamental

A principal regra arquitetural será:

> **O Model descreve intenção.  
> Rules e Transformers tomam decisões.  
> Technology Adapters representam conceitos tecnológicos.  
> Templates representam artefatos.  
> O File Plan descreve mutações.**

Em termos conceituais:

```text
WHAT
Model / IR
   │
   ▼
DECISION
Rules / Transformers
   │
   ▼
TECHNOLOGY
Technology Adapter
   │
   ▼
REPRESENTATION
Template Model / Templates
   │
   ▼
PLAN
File Plan
   │
   ▼
RESULT
Generated Application
```

---

# 7. Invariantes Arquiteturais

As seguintes regras deverão ser tratadas como invariantes da solução.

## INV-001

O Core não deverá depender de uma Template Engine concreta.

## INV-002

O Core não deverá conter conceitos específicos como:

```text
JPA
EF Core
Spring MVC
ASP.NET Core
NestJS
Helm
Terraform
GitHub Actions
```

## INV-003

Templates não deverão resolver relacionamentos semânticos.

## INV-004

Templates não deverão realizar mapeamento de tipos tecnológicos.

## INV-005

Transformers poderão depender de Technology Adapters por meio de contratos.

## INV-006

Technology Adapters não deverão depender de Templates.

## INV-007

Nenhuma mutação no filesystem deverá ocorrer antes da construção e validação do File Plan.

## INV-008

Entradas e versões idênticas deverão produzir resultados equivalentes byte a byte, exceto quando houver comportamento de formatter explicitamente documentado.

## INV-009

O IR deverá representar referências semânticas resolvidas.

## INV-010

Um Module representa uma capacidade de geração e não um Template.

## INV-011

Um Profile representa composição e configuração, não implementação arbitrária de regras.

## INV-012

Templates deverão receber modelos preparados para renderização sempre que o acesso direto ao IR introduzir lógica excessiva.

---

# 8. Arquitetura de Alto Nível

```text
                         CLI
                          │
                          ▼
                  Generation Request
                          │
                          ▼
                    Model Loader
                          │
                          ▼
                   Schema Validator
                          │
                          ▼
                        Parser
                          │
                          ▼
             Intermediate Representation
                         (IR)
                          │
                          ▼
                   Profile Resolver
                          │
                          ▼
                   Module Resolver
                          │
                          ▼
                Technology Adapters
                          │
                          ▼
                 Rules / Transformers
                          │
                          ▼
                   Template Models
                          │
                          ▼
                  Template Resolver
                          │
                          ▼
                    Template Engine
                          │
                          ▼
                       File Plan
                          │
                          ▼
                 File Plan Validation
                          │
                          ▼
                   Preview / Dry Run
                          │
                          ▼
                     File Writer
                          │
                          ▼
                      Formatter
                          │
                          ▼
                Generated Application
```

---

# 9. Modelo de Entrada

O modelo de entrada será declarativo e independente de tecnologia.

Inicialmente poderá ser representado em:

- YAML;
- JSON.

Exemplo:

```yaml
application:
  name: PaymentService

namespace: Company.Payments

entities:

  - name: Payment

    attributes:

      - name: id
        type: uuid
        required: true
        identifier: true

      - name: amount
        type: decimal
        required: true

      - name: createdAt
        type: datetime
        required: true
```

---

# 10. Application Model

O modelo deverá evoluir além da descrição exclusiva de entidades.

Ele poderá representar características semanticamente relevantes da aplicação.

Exemplo:

```yaml
application:
  name: payment-service

  runtime:
    port: 8080

  health:
    liveness: /health/live
    readiness: /health/ready

namespace: Company.Payments
```

Essas informações poderão alimentar diferentes módulos.

Por exemplo:

```text
runtime.port
    │
    ├──► ASP.NET configuration
    ├──► Dockerfile
    ├──► docker-compose
    ├──► Kubernetes Service
    └──► Helm values
```

O modelo deverá evitar detalhes excessivamente específicos de infraestrutura.

Preferir:

```yaml
deployment:
  replicas:
    min: 2
    max: 5
```

em vez de incorporar diretamente estruturas específicas de um provider sempre que existir uma abstração semântica adequada.

---

# 11. Technology-Agnostic Model

O modelo não deverá utilizar tipos específicos de plataforma.

Evitar:

```yaml
name: id
type: Guid
```

Preferir:

```yaml
name: id
type: uuid
```

Resolução:

```text
uuid
 ├── C#         → Guid
 ├── Java       → UUID
 └── TypeScript → string
```

---

# 12. Tipos Primitivos

Conjunto inicial:

```text
string
text

boolean

int16
int32
int64

decimal
float
double

uuid

date
datetime
time

binary
```

Exemplo:

| IR | C# | Java | TypeScript |
|---|---|---|---|
| string | string | String | string |
| boolean | bool | boolean | boolean |
| int32 | int | Integer/int | number |
| int64 | long | Long/long | number |
| decimal | decimal | BigDecimal | number |
| uuid | Guid | UUID | string |
| date | DateOnly | LocalDate | string |
| datetime | DateTimeOffset | OffsetDateTime | string |

O mapeamento exato pertence ao Technology Adapter e poderá ser influenciado pelo Profile.

---

# 13. Relacionamentos

Relacionamentos serão representados semanticamente.

Tipos iniciais:

```text
one-to-one
one-to-many
many-to-one
many-to-many
```

Exemplo:

```yaml
relationships:

  - name: items
    target: OrderItem
    cardinality: one-to-many

  - name: customer
    target: Customer
    cardinality: many-to-one
    required: true
```

O modelo não deverá conter diretamente:

```text
@OneToMany
ICollection<T>
HasMany()
@JoinColumn
```

---

# 14. Intermediate Representation — IR

Após parsing e validação, o documento será convertido para uma representação interna fortemente tipada.

Exemplo conceitual:

```typescript
interface ApplicationModel {
    name: string;
    namespace?: string;
    runtime?: RuntimeRequirements;
    entities: Entity[];
}

interface Entity {
    name: string;
    attributes: Attribute[];
    uniqueGroups?: string[][];
    relationships: Relationship[];
}

interface Attribute {
    name: string;
    type: PrimitiveType;
    required: boolean;
    identifier: boolean;
    constraints: Constraint[];
}

interface Relationship {
    name: string;
    target: Entity;
    cardinality: Cardinality;
    required: boolean;
}
```

O IR representa semântica, não JSON/YAML.

Assim:

```yaml
target: Customer
```

será transformado em uma referência efetiva:

```text
Order.customer
      │
      └────────► Customer
```

---

# 15. Parser

Responsabilidades:

1. carregar JSON/YAML;
2. validar estrutura;
3. converter para IR;
4. resolver referências;
5. aplicar defaults;
6. normalizar representações;
7. executar validações semânticas necessárias ao parsing.

---

# 16. Validação

Existirão pelo menos dois níveis.

## 16.1 Structural Validation

Baseada em JSON Schema.

Exemplos:

- propriedades obrigatórias;
- tipos;
- enums;
- estruturas;
- cardinalidades.

## 16.2 Semantic Validation

Executada sobre o modelo resolvido.

Exemplos:

- entidade duplicada;
- atributo duplicado;
- relacionamento inválido;
- referência inexistente;
- identifier ausente;
- configurações incompatíveis.

Erros deverão possuir códigos estáveis.

Exemplo:

```text
MODEL004

Unknown relationship target.

Entity:
Order

Relationship:
customer

Target:
CustomerX

Location:
entities[1].relationships[0].target
```

---

# 17. Profiles

Um Profile representa uma composição coerente de padrões.

Exemplo:

```yaml
id: company-dotnet-service
version: 1.0.0

technology:
  language: csharp
  languageVersion: "10"
  framework: dotnet

architecture:
  style: clean-architecture

modules:
  - domain
  - application
  - persistence-ef
  - api-rest
  - unit-tests
  - integration-tests
  - docker
  - docker-compose
  - sonar
  - github-actions
  - helm
  - terraform
  - documentation
```

Um Profile responde:

> **Qual Golden Path corporativo deverá ser utilizado?**

No MVP, Modules serão declarados inline no manifesto local do Profile.
Cada Module utiliza o campo `requires` para declarar suas dependências.
`technology.languageVersion` será tratado pelo Core como identificador
opaco em formato string.

No MVP, Profiles serão resolvidos localmente a partir de um
`profilesDirectory`, no caminho `<profilesDirectory>/<profileId>/profile.yaml`.
Não haverá registry, package discovery, resolução remota ou resolução
sofisticada de versões nesta fase.

---

# 18. Responsabilidade dos Profiles

Profiles poderão definir:

- tecnologia;
- framework;
- arquitetura;
- módulos;
- convenções;
- Template Packs;
- versões;
- configurações;
- defaults.

Profiles não deverão se transformar em implementações monolíticas contendo todas as Rules e Templates.

---

# 19. Modules

Modules representam **capacidades independentes de geração**.

Categorias possíveis:

```text
Application
├── domain
├── application
├── persistence
└── api

Testing
├── unit-tests
└── integration-tests

Build
├── docker
└── docker-compose

Quality
└── sonar

CI/CD
└── github-actions

Deployment
├── helm
└── kubernetes

Infrastructure
└── terraform

Observability
├── logging
├── metrics
└── tracing

Documentation
└── documentation
```

Um Module não é um Template.

---

# 20. Dependências entre Modules

Modules poderão declarar dependências.

Exemplo:

```yaml
id: persistence-ef

requires:
  - domain
```

Outro:

```yaml
id: api-rest

requires:
  - application
```

O Module Resolver construirá um dependency graph.

```text
api-rest
    │
    ▼
application
    │
    ▼
domain
```

Dependências circulares deverão resultar em erro.

O Module Resolver deverá oferecer resolução total e resolução parcial.
Na resolução parcial, os Modules solicitados incluirão transitivamente
todos os Modules declarados em `requires` e serão retornados em ordem
topológica determinística.

Exemplo: selecionar `api-rest`, que requer `application`, que requer
`domain`, resulta em `domain`, `application`, `api-rest`.

---

# 21. Technology Adapters

Technology Adapters representam conhecimento específico de uma tecnologia.

Exemplos:

```text
DotNetAdapter
JavaAdapter
TypeScriptAdapter
```

Responsabilidades possíveis:

- tipos;
- naming conventions;
- namespaces;
- packages;
- imports;
- modifiers;
- linguagem;
- convenções de framework.

Exemplo:

```typescript
interface TechnologyAdapter {
    resolveType(type: PrimitiveType): TechnologyType;

    normalizeClassName(name: string): string;

    normalizePropertyName(name: string): string;
}
```

Um Technology Adapter responde:

> **Como esta tecnologia representa determinado conceito?**

---

# 22. Rules

Rules representam decisões reutilizáveis e testáveis.

```typescript
interface Rule<TInput, TOutput> {
    apply(
        input: TInput,
        output: TOutput,
        context: GenerationContext
    ): void;
}
```

Exemplo:

```typescript
class OneToManyRule {

    apply(
        entity: Entity,
        model: JavaClassModel
    ): void {

        if (!entity.hasRelationship("one-to-many")) {
            return;
        }

        model.imports.add("java.util.List");
        model.imports.add("jakarta.persistence.OneToMany");
    }
}
```

Rules respondem:

> **Que decisão precisa ser tomada para gerar este artefato?**

---

# 23. Transformers

Transformers convertem representações semânticas em modelos adequados para rendering.

```text
Entity
   │
   ▼
JpaEntityTransformer
   │
   ▼
JavaClassTemplateModel
```

Outro exemplo:

```text
Entity
   │
   ▼
EfEntityTransformer
   │
   ▼
CSharpClassTemplateModel
```

Transformers poderão aplicar múltiplas Rules.

---

# 24. Template Models

Templates deverão preferencialmente receber modelos preparados para rendering.

Exemplo:

```typescript
interface JavaClassTemplateModel {
    packageName: string;
    imports: ImportCollection;
    annotations: JavaAnnotation[];
    className: string;
    modifiers: string[];
    fields: JavaField[];
    constructors: JavaConstructor[];
    methods: JavaMethod[];
}
```

O Template Model responde:

> **Quais informações são necessárias para escrever este artefato?**

---

# 25. Import Management

Imports deverão ser tratados antes do rendering.

```typescript
const imports = new ImportCollector();

imports.add("java.util.UUID");
imports.add("java.util.List");
imports.add("java.util.List");
```

Resultado:

```text
java.util.List
java.util.UUID
```

O collector poderá realizar:

- deduplicação;
- ordenação;
- agrupamento;
- static imports;
- convenções específicas.

---

# 26. Template Engine

A implementação inicial utilizará **Nunjucks**.

O Template Engine será abstraído:

```typescript
interface TemplateEngine {
    render(
        template: Template,
        model: unknown
    ): Promise<string>;
}
```

O Core não deverá depender diretamente do Nunjucks.

---

# 27. Templates Devem Permanecer Simples

Templates respondem principalmente:

> **Como este artefato deve ser representado?**

Evitar:

```jinja2
{% if entity.hasOneToMany %}
{% set requiresList = true %}
{% endif %}
```

Preferir:

```jinja2
{% for import in imports %}
import {{ import }};
{% endfor %}
```

---

# 28. Template Packs

Templates serão agrupados em Template Packs versionados.

Um Template Pack é uma unidade declarativa de configuração que associa um identificador de template a um module, a um arquivo de template e a um padrão de saída. O Generation Planner resolve a definição do pack, valida a compatibilidade com o producer e produz um File Plan com caminhos de saída determinísticos.

No MVP, um Profile referencia exatamente um Template Pack por `id` e
`version`. O resolver local procura o manifest em
`<templatePacksDirectory>/<id>/manifest.yaml`; não há ranges, fallback,
registry ou resolução remota.

O manifest mínimo é:

```yaml
id: java-spring-clean
version: 0.1.0

templates:
  - id: domain-entity
    module: domain
    template: domain/entity.java.njk
    output: src/main/java/{{ packagePath }}/domain/{{ className }}.java
```

`template` é um path POSIX relativo ao Template Pack. `output` é um
path POSIX relativo ao diretório de geração. Ambos devem ser não vazios,
não absolutos e não podem conter traversal.

O output aceita somente placeholders estritos no formato
`{{ identifier }}`, com whitespace opcional. O identifier segue
`[A-Za-z_][A-Za-z0-9_]*`. Não são permitidos filtros, expressões,
acesso a propriedades, condições ou loops. Placeholder sem variável
correspondente é erro; ele nunca é preservado ou substituído por vazio.

O producer retorna uma Template Invocation com `templateId`, Template
Model e `OutputPathVariables` explícitas. O Generation Planner combina a
invocation com a Template Definition, resolve o output, renderiza por meio
da porta Template Engine e cria operações `CREATE` no File Plan.

Exemplo:

```text
template-packs/
└── company-dotnet-service/
    ├── manifest.yaml
    │
    ├── domain/
    │   └── entity.njk
    │
    ├── application/
    │   └── use-case.njk
    │
    ├── infrastructure/
    │   ├── repository.njk
    │   └── entity-configuration.njk
    │
    ├── api/
    │   └── controller.njk
    │
    ├── tests/
    │   ├── unit-test.njk
    │   └── integration-test.njk
    │
    ├── docker/
    │   ├── Dockerfile.njk
    │   └── docker-compose.yml.njk
    │
    ├── sonar/
    │   └── sonar-project.properties.njk
    │
    ├── github/
    │   ├── build.yml.njk
    │   ├── test.yml.njk
    │   └── deploy.yml.njk
    │
    ├── helm/
    │   ├── Chart.yaml.njk
    │   ├── values.yaml.njk
    │   └── templates/
    │
    ├── terraform/
    │   └── ...
    │
    └── documentation/
        └── README.md.njk
```

---

# 29. Template Manifest

O manifest define a participação dos Templates na geração.

```yaml
id: company-dotnet-service
version: 1.0.0

templates:

  - id: domain-entity
    module: domain
    template: domain/entity.njk
    output: src/Domain/Entities/{{ className }}.cs

  - id: dockerfile
    module: docker
    template: docker/Dockerfile.njk
    output: Dockerfile

  - id: docker-compose
    module: docker-compose
    template: docker/docker-compose.yml.njk
    output: docker-compose.yml

  - id: sonar
    module: sonar
    template: sonar/sonar-project.properties.njk
    output: sonar-project.properties

  - id: github-build
    module: github-actions
    template: github/build.yml.njk
    output: .github/workflows/build.yml

  - id: helm-values
    module: helm
    template: helm/values.yaml.njk
    output: deploy/helm/values.yaml

  - id: readme
    module: documentation
    template: documentation/README.md.njk
    output: README.md
```

---

# 30. Distinção entre os Principais Conceitos

A separação deverá permanecer explícita.

```text
Technology Adapter
    "Como a tecnologia representa conceitos?"

Module
    "Que capacidade será gerada?"

Template Pack
    "Como os artefatos são declarados e posicionados?"

Profile
    "Qual composição corporativa será utilizada?"
```

Exemplo:

```text
Technology Adapter
    uuid → Guid

Module
    persistence-ef

Template Pack
    infrastructure/repository.njk

Profile
    company-dotnet-service@1.0.0
```

---

# 31. File Plan

Templates não escreverão diretamente no filesystem.

Toda geração deverá produzir primeiro um File Plan.

```yaml
operations:

  - action: create
    target: src/Domain/Entities/Payment.cs

  - action: create
    target: Dockerfile

  - action: create
    target: deploy/helm/values.yaml

  - action: create
    target: .github/workflows/build.yml
```

Pipeline:

```text
Rules / Transformers
       ↓
Template Models
       ↓
Templates
       ↓
File Plan
       ↓
Validation
       ↓
Preview
       ↓
Write
```

---

# 32. File Operations

O modelo deverá preparar suporte para:

```text
CREATE
OVERWRITE
SKIP
MERGE
DELETE
```

No estado atual (Milestone 3.7), o único operation kind suportado é:

```text
CREATE
```

`CREATE` é exclusivo: o target deve ser inexistente; targets existentes
falham e nunca são sobrescritos ou silenciosamente ignorados. `OVERWRITE`
e `SKIP` permanecem operações planejadas para milestones futuros.

O `FilePlan` contém apenas caminhos POSIX relativos e conteúdo, sendo
independente de qualquer output root. O output root é fornecido
explicitamente pelo caller do writer e deve existir previamente. Antes da
primeira mutação, o writer executa preflight completo do plano, incluindo
segurança lógica do caminho, contenção física no root, ancestors e
symlinks intermediários. Esse preflight reduz escrita parcial, mas não
oferece rollback nem atomicidade contra concorrência ou falhas físicas.

Dry-run é decisão do caller: o plano pode ser apresentado sem invocar o
writer.

`MERGE` será posterior devido à complexidade de modificar arquivos existentes preservando alterações manuais.

---

# 33. Idempotência

Sempre que possível:

```text
generate(model)
generate(model)
```

não deverá produzir alterações adicionais.

Essa propriedade será essencial para utilização em projetos existentes e pipelines.

---

# 34. Generation Context

Toda geração possuirá contexto explícito.

```typescript
interface GenerationContext {
    generatorVersion: string;

    profile: Profile;

    modules: Module[];

    model: ApplicationModel;

    outputDirectory: string;

    variables: Record<string, unknown>;
}
```

Nenhum componente deverá depender desnecessariamente de estado global.

## 34.1 Generation Planning

Generation Planning receberá uma Application Model e um Profile com
Modules já resolvidos. O Core orquestrará a produção de artifacts,
rendering por meio da porta Template Engine e construção do File Plan.

O Core não poderá conhecer templates, target paths ou Template Models
específicos de tecnologia. Essas informações serão produzidas por um
componente específico de Profile e Module, que declarará explicitamente
seu `profileId` e `moduleId`.

Antes de produzir artifacts, o Generation Planner validará a
compatibilidade entre esse componente, o Profile e os Modules do request.
Um componente compatível poderá produzir zero artifacts; incompatibilidade
deverá falhar explicitamente.

---

# 35. CLI

Neste estágio, o primeiro endpoint GET REST é estrutural: usa `findAll()` e
retorna provisoriamente `List.of()`, sem delegação para service, persistência,
mapper ou comportamento de negócio real.

Entidades Java permanecem classes com fields finais, constructor completo e
getters JavaBean. Setters, constructor sem argumentos, `equals`, `hashCode` e
`toString` não são gerados neste estágio e a decisão não é otimizada para JPA.

Application services são beans Spring com `@Service`. Seu `findAll()` retorna
entidades de domínio com `List.of()` provisório, sem dependência de DTO REST,
persistência, mapper ou delegação pelo controller.

A CLI será a interface inicial.

No Milestone 3.8, o primeiro comando implementado é:

```bash
codegen generate <model> --profile <profile-id> [--module <module-id> ...] [--output <directory>] [--dry-run]
```

`--profile` é obrigatório. `--module` é opcional e repetível; quando
omitido, todos os módulos do Profile são resolvidos. `--output` é
obrigatório quando não há `--dry-run` e deve apontar para um diretório
existente. A CLI não cria o output root.

`--dry-run` produz somente uma listagem determinística do File Plan, sem
conteúdo de arquivos e sem mutação do filesystem. O output root não é
necessário nesse modo.

O suporte concreto está limitado ao Profile `java-spring-clean` com os
módulos `build`, `domain`, `application`, `bootstrap` e `api-rest`. O módulo `api-rest`
requer `application` e gera controllers estruturais no package `.api`; o
starter web é incluído condicionalmente quando esse módulo está resolvido. O módulo `api-rest`
também gera response DTOs como Java records no package `.api`, derivados dos
atributos do Application Model. Controllers permanecem sem endpoints e não
referenciam os DTOs neste estágio. O módulo `build`
gera um `pom.xml` Maven com materialização mínima de Spring Boot 4.1.0; o
módulo `bootstrap` gera a classe principal `@SpringBootApplication`. A CLI compõe explicitamente um producer
por módulo conhecido, sem registry de producers,
plugins, `OVERWRITE`, `SKIP`, `MERGE` ou rollback. Uso inválido produz
`CLI001`; combinação de Profile/Module não suportada pela CLI produz
`CLI002`. Sucesso retorna exit code `0`; erros retornam `1`.

Geração completa:

```bash
codegen generate \
  --profile company-dotnet-service \
  --model payment-service.yaml
```

Geração de módulo:

```bash
codegen generate \
  --profile company-dotnet-service \
  --module domain \
  --model payment-service.yaml
```

Infraestrutura:

```bash
codegen generate \
  --profile company-dotnet-service \
  --module helm \
  --module terraform \
  --model payment-service.yaml
```

CI/CD:

```bash
codegen generate \
  --profile company-dotnet-service \
  --module github-actions \
  --model payment-service.yaml
```

Preview:

```bash
codegen generate \
  --profile company-dotnet-service \
  --model payment-service.yaml \
  --dry-run
```

Validação:

```bash
codegen validate payment-service.yaml
```

Listagem:

```bash
codegen profiles
```

```bash
codegen modules \
  --profile company-dotnet-service
```

---

# 36. Exemplo Completo

Modelo:

```yaml
application:
  name: payment-service

  runtime:
    port: 8080

  health:
    liveness: /health/live
    readiness: /health/ready

namespace: Company.Payments

entities:

  - name: Payment

    attributes:

      - name: id
        type: uuid
        identifier: true
        required: true

      - name: amount
        type: decimal
        required: true

      - name: createdAt
        type: datetime
        required: true
```

Profile:

```text
company-dotnet-service
```

Pipeline:

```text
payment-service.yaml
        │
        ▼
Schema Validation
        │
        ▼
Parser
        │
        ▼
ApplicationModel / IR
        │
        ▼
company-dotnet-service
        │
        ▼
Module Resolution
        │
        ├── domain
        ├── application
        ├── persistence-ef
        ├── api-rest
        ├── unit-tests
        ├── integration-tests
        ├── docker
        ├── sonar
        ├── github-actions
        ├── helm
        ├── terraform
        └── documentation
        │
        ▼
Technology Adapters
        │
        ▼
Rules + Transformers
        │
        ▼
Template Models
        │
        ▼
Templates
        │
        ▼
File Plan
        │
        ▼
Validation
        │
        ▼
Generated Application
```

Resultado:

```text
payment-service/
├── src/
│   ├── Domain/
│   │   └── Entities/
│   │       └── Payment.cs
│   │
│   ├── Application/
│   │   └── Payments/
│   │
│   ├── Infrastructure/
│   │   └── Persistence/
│   │
│   └── Api/
│
├── tests/
│   ├── UnitTests/
│   └── IntegrationTests/
│
├── deploy/
│   ├── helm/
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   │
│   └── terraform/
│
├── Dockerfile
├── docker-compose.yml
├── sonar-project.properties
├── README.md
│
└── .github/
    └── workflows/
        ├── build.yml
        ├── test.yml
        └── deploy.yml
```

---

# 37. Testabilidade

O projeto deverá privilegiar componentes pequenos, puros e determinísticos.

Unit Tests deverão cobrir especialmente:

```text
Parser
Schema Validator
Semantic Validator
Type Resolver
Technology Adapters
Rules
Transformers
Import Collector
Module Resolver
Profile Resolver
Template Resolver
File Plan
```

---

# 38. Golden Tests

Template Packs deverão possuir Golden/Snapshot Tests.

```text
fixtures/payment-service.yaml
        │
        ▼
Generator
        │
        ▼
Actual
        │
        ▼
Compare
        │
        ▼
Expected
```

Expected poderá representar uma árvore completa:

```text
expected/
└── company-dotnet-service/
    ├── src/
    ├── tests/
    ├── deploy/
    ├── Dockerfile
    └── ...
```

Alterações nos padrões corporativos aparecerão explicitamente nos diffs.

---

# 39. Generated Project Tests

O teste não deverá terminar na comparação textual.

Projetos gerados deverão ser validados.

.NET:

```text
dotnet restore
dotnet build
dotnet test
```

Spring:

```text
./mvnw test
```

TypeScript:

```text
npm install
npm test
npm run build
```

Quando aplicável, poderão existir validações adicionais:

```text
docker build
helm lint
terraform validate
```

O objetivo é provar:

> **O gerador produziu uma aplicação válida, compilável, testável e operacionalmente consistente.**

---

# 40. Versionamento

Deverão possuir versões independentes:

```text
Generator
Model Schema
Profile
Template Pack
```

Exemplo:

```text
generator:       1.4.0
schema:          1.1
profile:         company-dotnet-service@3.2.0
template-pack:   company-dotnet-service@3.2.0
```

Isso permitirá reproduzir gerações históricas.

---

# 41. Repositório

Estrutura inicial sugerida:

```text
corporate-code-generator/

packages/

  core/
    src/
      model/
      parser/
      validation/
      generation/
      modules/
      profiles/
      rules/
      transformers/
      file-plan/

  template-engine-nunjucks/
    src/

  cli/
    src/

  adapters/
    java/
    dotnet/
    typescript/

schemas/
  model.schema.json

template-packs/

  company-dotnet-service/
  company-spring-service/
  company-typescript-service/

examples/

  simple-domain/
  relationships/
  payment-service/
  ecommerce/

tests/

  fixtures/
  golden/
  integration/
  generated/
```

O projeto poderá inicialmente ser implementado como monorepo.

---

# 42. Dependências entre Componentes

Regra desejada:

```text
                         CLI
                          │
                          ▼
                         Core
               ┌──────────┼──────────┐
               ▼          ▼          ▼
           Adapters    Template    Infrastructure
                        Engine
```

O Core não deverá depender diretamente de:

```text
Spring
.NET
Nunjucks
filesystem concreto
CLI framework
Helm
Terraform
GitHub Actions
```

---

# 43. Tratamento de Erros

Categorias iniciais:

```text
MODELxxx
PROFILExxx
MODULExxx
ADAPTERxxx
TEMPLATExxx
GENxxx
FILEPLANxxx
IOxxx
```

`FILEPLANxxx` is the official category for errors identified while
constructing or validating a File Plan, before any filesystem mutation.

Os códigos de File Plan e escrita Node são:

```text
FILEPLAN001  target vazio.
FILEPLAN002  target duplicado.
FILEPLAN003  target logicamente inseguro.

IO001  output root inexistente ou não diretório.
IO002  target CREATE já existe.
IO003  parent incompatível, escape físico ou symlink inseguro.
IO004  falha física durante mkdir ou escrita.
```

Os códigos iniciais de Profile e Module são:

```text
PROFILE001  Profile não encontrado.
PROFILE002  Manifest de Profile inválido.
PROFILE003  ID solicitado diverge do ID do manifest.

MODULE001   IDs de Module duplicados.
MODULE002   Module requerido inexistente.
MODULE003   Dependência circular entre Modules.
MODULE004   Module solicitado inexistente.

GEN001      Producer de artifacts incompatível com o request de geração.

TEMPLATE001  Template Pack não encontrado.
TEMPLATE002  Manifest de Template Pack inválido.
TEMPLATE003  ID do Template Pack diverge da referência.
TEMPLATE004  Versão do Template Pack diverge da referência.
TEMPLATE005  ID de Template Definition duplicado.
TEMPLATE006  Template Definition solicitada não existe.
TEMPLATE007  Template Definition incompatível com o Module do producer.
TEMPLATE008  Template/output path inválido ou impossível de resolver.
```

Exemplo:

```text
Error MODEL004:

Entity 'Order' relationship 'customer'
references unknown entity 'CustomerX'.

Location:
entities[1].relationships[0].target
```

Códigos deverão permanecer estáveis.

---

# 44. Logging

Níveis:

```text
TRACE
DEBUG
INFO
WARN
ERROR
```

Execução normal:

```text
Loading model: payment-service.yaml
Validating model...
Resolving profile: company-dotnet-service@1.0.0
Resolving modules...
Building template models...
Planning 37 files...
Validating file plan...
Writing files...
Formatting...
Generation completed successfully.
```

Verbose:

```text
Applying PaymentEntityTransformer
Resolving uuid using DotNetAdapter
Added import System
Rendering domain/entity.njk
Planning src/Domain/Entities/Payment.cs
```

---

# 45. Segurança dos Templates

Templates serão considerados código confiável pertencente ao ecossistema do generator.

Template Packs corporativos deverão ser:

- versionados;
- revisados;
- testados;
- assinados ou verificados futuramente;
- distribuídos por repositórios controlados.

A primeira versão não deverá executar arbitrariamente Template Packs não confiáveis.

---

# 46. Uso de Inteligência Artificial

IA não fará parte do runtime.

Fluxo permitido:

```text
Developer
    │
    ├── AI Assistant
    │      │
    │      ├── Model
    │      ├── Schema
    │      ├── Rules
    │      ├── Transformers
    │      ├── Adapters
    │      ├── Templates
    │      ├── Tests
    │      └── Documentation
    │
    ▼
Pull Request
    │
    ▼
Automated Tests
    │
    ▼
Generator / Template Pack
```

Fluxo proibido no Core:

```text
Model
  ↓
LLM
  ↓
Generated Application
```

---

# 47. AI-Friendly Architecture

O projeto deverá facilitar assistência de agentes de IA durante desenvolvimento e manutenção.

Para isso:

- contratos deverão ser explícitos;
- componentes deverão possuir responsabilidades pequenas;
- schemas deverão ser documentados;
- invariantes deverão ser documentadas;
- Rules deverão ser isoladas;
- exemplos deverão acompanhar features;
- decisões deverão possuir ADRs;
- Template Packs deverão possuir README;
- comportamento esperado deverá ser representado por testes;
- nomenclatura deverá permanecer consistente.

Uma IA deverá conseguir responder:

> Onde implemento suporte ao tipo `money` para Java?

Resposta esperada:

```text
1. Model Schema
2. IR
3. Semantic Validation, se necessária
4. Java Technology Adapter
5. Rules específicas, se necessárias
6. Unit Tests
7. Golden Tests
```

---

# 48. AGENTS.md

O repositório deverá possuir um documento operacional para agentes de IA.

Exemplo conceitual:

```text
# Corporate Code Generator — Agent Instructions

## Architectural invariant

Model / IR
    ↓
Rules / Transformers
    ↓
Template Models
    ↓
Templates
    ↓
File Plan

## Rules

- Never put technology-specific types in the input model.
- Never implement generation decisions in Nunjucks.
- Templates render prepared models.
- Core must not depend on Nunjucks.
- Core must not depend on a concrete filesystem.
- Generation must remain deterministic.
- Every generation behavior requires tests.
- Generated source changes require Golden Tests.

## Where changes belong

New semantic concept
    → Model Schema / IR / Validation

Technology mapping
    → Technology Adapter

Generation decision
    → Rule

IR → renderable representation
    → Transformer

Source representation
    → Template

New generation capability
    → Module

Golden Path composition
    → Profile
```

---

# 49. ADRs

ADRs iniciais recomendados:

```text
ADR-001 — TypeScript as Generator Implementation Language

ADR-002 — Nunjucks as Initial Template Engine

ADR-003 — Technology-Agnostic Intermediate Representation

ADR-004 — Rules Outside Templates

ADR-005 — Deterministic Generation

ADR-006 — Profile and Module Architecture

ADR-007 — Versioned Template Packs

ADR-008 — AI Outside Runtime

ADR-009 — File Plan Before Filesystem Mutation

ADR-010 — Golden Tests for Generated Artifacts

ADR-011 — Model-Driven Application Scaffolding

ADR-012 — Technology Adapters

ADR-013 — Golden Paths Represented by Profiles

ADR-014 — Application Requirements Independent from Deployment Technology
```

---

# 50. Estratégia de Documentação

Este documento será tratado como a **Solution Specification** e fonte de verdade arquitetural de alto nível.

Documentação especializada deverá ser separada.

```text
docs/
├── README.md
│
├── architecture/
│   ├── ARCHITECTURE.md
│   ├── COMPONENTS.md
│   ├── GENERATION-PIPELINE.md
│   └── DEPENDENCY-RULES.md
│
├── model/
│   ├── MODEL-SPECIFICATION.md
│   ├── TYPES.md
│   ├── RELATIONSHIPS.md
│   ├── CONSTRAINTS.md
│   ├── VALIDATION.md
│   └── model.schema.json
│
├── generation/
│   ├── GENERATION-CONTEXT.md
│   ├── FILE-PLAN.md
│   ├── RULES.md
│   ├── TRANSFORMERS.md
│   └── TEMPLATE-MODELS.md
│
├── profiles/
│   ├── PROFILE-SPECIFICATION.md
│   ├── MODULE-SPECIFICATION.md
│   └── PROFILE-AUTHORING-GUIDE.md
│
├── templates/
│   ├── TEMPLATE-PACK-SPECIFICATION.md
│   ├── TEMPLATE-MANIFEST.md
│   ├── TEMPLATE-AUTHORING-GUIDE.md
│   └── NUNJUCKS-GUIDELINES.md
│
├── cli/
│   └── CLI-SPECIFICATION.md
│
├── testing/
│   ├── TESTING-STRATEGY.md
│   ├── GOLDEN-TESTS.md
│   └── GENERATED-PROJECT-TESTS.md
│
└── adr/
```

Na raiz:

```text
AGENTS.md
```

---

# 51. Roadmap Inicial

## Fase 1 — Vertical Slice

Antes de implementar um Profile completo, deverá ser criado um fluxo mínimo end-to-end:

```text
model.yaml
    ↓
Schema Validation
    ↓
Parser
    ↓
IR
    ↓
Profile
    ↓
Module: domain
    ↓
DotNetAdapter
    ↓
EntityTransformer
    ↓
CSharpClassTemplateModel
    ↓
entity.njk
    ↓
File Plan
    ↓
File Writer
    ↓
Customer.cs
    ↓
Golden Test
```

Esse slice validará todas as abstrações principais com complexidade mínima.

---

## Fase 2 — Core

Consolidar:

```text
Model Schema
Parser
IR
Structural Validation
Semantic Validation
Generation Context
Profiles
Modules
Module Resolver
File Plan
CLI
```

---

## Fase 3 — .NET Golden Path

Implementar:

```text
company-dotnet-service

domain
application
persistence-ef
api-rest
unit-tests
integration-tests
docker
sonar
github-actions
documentation
```

Resultado esperado:

```text
model.yaml
    ↓
complete compilable .NET service
```

---

## Fase 4 — Deployment Scaffolding

Adicionar:

```text
docker-compose
helm
terraform
observability
```

O objetivo será gerar o scaffolding operacional completo.

---

## Fase 5 — Spring Boot

Implementar:

```text
company-spring-service
```

Essa fase validará a independência tecnológica do IR.

Se o suporte Java exigir alterações excessivamente específicas no IR, isso deverá ser tratado como sinal de acoplamento arquitetural.

---

## Fase 6 — TypeScript

Adicionar o terceiro ecossistema para validar as abstrações multi-stack.

---

## Fase 7 — Recursos Avançados

Posteriormente:

```text
OpenAPI import
database reverse engineering
code merge
plugin system
remote Template Packs
Template Pack Registry
IDE integration
project inspection
REST API for generator
```

---

# 52. Critérios de Qualidade

Uma feature não será considerada concluída apenas porque produz arquivos.

Definition of Done:

1. Model Schema atualizado quando necessário.
2. IR atualizado quando necessário.
3. validações implementadas.
4. Technology Adapter atualizado quando necessário.
5. Rules implementadas.
6. Transformers implementados.
7. Unit Tests implementados.
8. Templates implementados.
9. Golden Tests implementados.
10. File Plan validado.
11. arquivos formatados.
12. projeto gerado compila.
13. testes do projeto gerado passam.
14. validações operacionais aplicáveis passam.
15. documentação atualizada.

---

# 53. Métricas

## Structural Generation Coverage

Percentual de componentes estruturais produzidos automaticamente pelo Golden Path.

## Manual Modification Rate

Percentual de artefatos gerados que precisam ser alterados imediatamente após geração.

Quanto menor, melhor.

## Time to First Green Build

Tempo entre:

```text
model.yaml
```

e:

```text
successful build + tests
```

## Time to Deployable Scaffold

Tempo entre o modelo inicial e a existência de um projeto com:

```text
source
tests
container
pipeline
deployment
infrastructure
```

## Generation Reproducibility

Mesmas entradas e mesmas versões deverão produzir exatamente os mesmos resultados.

Meta:

```text
100%
```

---

# 54. Golden Path Corporativo

O conceito de Golden Path será uma das capacidades centrais da plataforma.

Um Profile poderá representar:

```text
company-dotnet-service@3.2.0
```

que define:

```text
Architecture
+
Framework
+
Libraries
+
Testing
+
Persistence
+
API conventions
+
Containerization
+
Quality
+
CI/CD
+
Deployment
+
Infrastructure
+
Observability
+
Documentation
```

Assim:

```bash
codegen generate \
  --profile company-dotnet-service \
  --model payment-service.yaml
```

deverá ser capaz de transformar uma intenção declarativa em um serviço aderente aos padrões corporativos.

---

# 55. Visão Arquitetural Consolidada

```text
                              Developer
                                  │
                                  ▼
                             model.yaml
                                  │
                                  ▼
                         Schema Validation
                                  │
                                  ▼
                                Parser
                                  │
                                  ▼
                                  IR
                                  │
                   ┌──────────────┴──────────────┐
                   ▼                             ▼
                Profile                       Modules
                   │                             │
                   └──────────────┬──────────────┘
                                  ▼
                         Technology Adapters
                                  │
                                  ▼
                         Rules / Transformers
                                  │
                                  ▼
                           Template Models
                                  │
                                  ▼
                            Template Packs
                                  │
                                  ▼
                           Template Engine
                                  │
                                  ▼
                              File Plan
                                  │
                                  ▼
                         File Plan Validation
                                  │
                                  ▼
                          Preview / Dry Run
                                  │
                                  ▼
                             File Writer
                                  │
                                  ▼
                              Formatter
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │   Generated Application   │
                    ├───────────────────────────┤
                    │ Source Code               │
                    │ Tests                     │
                    │ Build                     │
                    │ Quality                   │
                    │ Containers                │
                    │ CI/CD                     │
                    │ Deployment                │
                    │ Infrastructure as Code    │
                    │ Observability             │
                    │ Documentation             │
                    └───────────────────────────┘
```

---

# 56. Conclusão

O **Corporate Code Generator** deverá ser tratado como uma plataforma de **model-driven application scaffolding**, e não apenas como um gerador de código.

Sua principal função será transformar:

```text
Application Intent
+
Corporate Golden Path
```

em:

```text
Consistent
+
Compilable
+
Testable
+
Deployable
+
Observable
+
Documented
+
Reproducible

Application Scaffold
```

A arquitetura deverá preservar uma separação rigorosa entre:

```text
Model / IR
    ↓
Semantic Intent

Rules / Transformers
    ↓
Generation Decisions

Technology Adapters
    ↓
Technology Representation

Template Models
    ↓
Renderable Data

Templates
    ↓
Artifact Representation

File Plan
    ↓
Filesystem Mutation Plan
```

Essa separação permitirá evoluir a plataforma para múltiplas linguagens, frameworks, arquiteturas e ambientes de deployment sem transformar Templates, Profiles ou o Core em componentes monolíticos.

O resultado pretendido é uma plataforma capaz de codificar e versionar os **Golden Paths de engenharia da organização**, reduzindo trabalho repetitivo, aumentando consistência arquitetural e diminuindo significativamente o tempo entre a definição inicial de uma aplicação e seu primeiro build executável e implantável.
:::
