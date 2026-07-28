# Corporate Code Generator

Corporate Code Generator é uma plataforma determinística para transformar
modelos de aplicação, Profiles e Templates em scaffolds de código.

## Status atual

O primeiro Golden Path suporta atualmente:

- Profile: `java-spring-clean`;
- Modules: `domain` e `application` (`application` requer `domain`);
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
```

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

## Limitações atuais

- somente o Profile `java-spring-clean` com os módulos `domain` e `application`;
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
