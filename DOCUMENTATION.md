# ZUI_SD_B2B — Documentação do Projeto

> **App:** Envio de Cargas B2B — ZSD277
> **Namespace:** `br.com.inbetta.zsdb2b`
> **Framework:** OpenUI5 v1.114.13 (SAP Fiori)
> **Backend:** SAP ERP via OData v2.0 (`ZSD_B2B_SRV`)
> **Tema:** sap_horizon
> **Idioma:** Português (Brasil)

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Estrutura de Diretórios](#estrutura-de-diretórios)
3. [Arquitetura](#arquitetura)
4. [Processadores](#processadores)
5. [Parâmetros por Processador](#parâmetros-por-processador)
6. [Controllers](#controllers)
7. [Views e Fragments](#views-e-fragments)
8. [Serviços e OData](#serviços-e-odata)
9. [Modelos de Dados](#modelos-de-dados)
10. [Sistema de Value Help](#sistema-de-value-help)
11. [Internacionalização (i18n)](#internacionalização-i18n)
12. [Roteamento e Navegação](#roteamento-e-navegação)
13. [Configuração e Build](#configuração-e-build)
14. [Testes](#testes)
15. [Fluxos de Dados](#fluxos-de-dados)

---

## Visão Geral

O **ZUI_SD_B2B** é uma aplicação SAP Fiori para gerenciamento de envio de cargas B2B. Ela permite que usuários selecionem um ou mais **processadores** de dados — cada um responsável por sincronizar um domínio específico de dados mestre (preços, impostos, clientes, produtos, etc.) — e os executem com parâmetros customizados contra um backend SAP.

**Funcionalidades principais:**
- Seleção de tipo de carga: **Inicial** (carga completa) ou **Incremental** (diferencial)
- Seleção de até 8 processadores independentes
- Parametrização granular por processador
- Value helps com busca, filtros dependentes e paginação
- Execução individual ou em lote (múltiplos processadores)
- Exibição de resultados com status e mensagens

---

## Estrutura de Diretórios

```
ZUI_SD_B2B/
├── webapp/
│   ├── Component.js                    # Inicialização do componente UI5
│   ├── index.html                      # Ponto de entrada da aplicação
│   ├── manifest.json                   # Configuração do app (metadata, routing, modelos)
│   ├── controller/
│   │   ├── App.controller.js           # Controller raiz (sem lógica)
│   │   └── Main.controller.js          # Controller principal (~1000 linhas)
│   ├── view/
│   │   ├── App.view.xml                # View raiz com controle App
│   │   ├── Main.view.xml               # View principal com formulários e tabela de resultado
│   │   ├── ValueHelpVkorg.fragment.xml # Dialog: Org. de Vendas
│   │   ├── ValueHelpClientes.fragment.xml
│   │   ├── ValueHelpProdutos.fragment.xml
│   │   ├── ValueHelpBranch.fragment.xml
│   │   ├── ValueHelpPltyp.fragment.xml
│   │   ├── ValueHelpGruop.fragment.xml
│   │   ├── ValueHelpShipf.fragment.xml
│   │   └── ValueHelpShipt.fragment.xml
│   ├── model/
│   │   └── models.js                   # Factory do DeviceModel
│   ├── service/
│   │   ├── ODataService.js             # Leituras e chamadas de função OData
│   │   └── ParamsBuilder.js            # Construção de parâmetros para function imports
│   ├── i18n/
│   │   └── i18n.properties             # Strings de tradução (PT-BR)
│   ├── css/
│   │   └── style.css                   # Estilos customizados
│   └── localService/
│       └── mainService/
│           ├── metadata.xml            # Metadata OData para mock
│           └── data/                   # Dados mock para desenvolvimento
├── test/
│   ├── unit/                           # Testes unitários (QUnit)
│   └── integration/                    # Testes de integração (OPA5)
├── dist/                               # Saída do build
├── package.json
├── ui5.yaml                            # Config produção
├── ui5-mock.yaml                       # Config mock server
├── ui5-local.yaml                      # Config desenvolvimento local
└── ui5-deploy.yaml                     # Config deploy
```

---

## Arquitetura

A aplicação segue o padrão **MVC** do SAP UI5:

```
┌─────────────────────────────────────────────────┐
│                   View (XML)                    │
│  Main.view.xml + 8 Fragments de Value Help      │
└────────────────────┬────────────────────────────┘
                     │ data binding (two-way)
┌────────────────────▼────────────────────────────┐
│              Controller (JS)                    │
│  Main.controller.js — lógica de negócio, UX     │
└─────────┬───────────────────┬───────────────────┘
          │                   │
┌─────────▼──────┐   ┌────────▼────────────────────┐
│ JSONModel      │   │ OData Model (sap.ui.model)  │
│ (View State)   │   │ Backend SAP — ZSD_B2B_SRV   │
└────────────────┘   └──────────────┬──────────────┘
                                    │
                     ┌──────────────▼──────────────┐
                     │  service/ODataService.js    │
                     │  service/ParamsBuilder.js   │
                     └─────────────────────────────┘
```

**Camada de Serviço:**
- `ODataService.js` — encapsula todas as chamadas OData (leitura de entidades e chamadas de função)
- `ParamsBuilder.js` — constrói objetos de parâmetros limpos para os function imports do backend

---

## Processadores

O app suporta 8 processadores que podem ser executados individualmente ou em conjunto:

| Chave interna | Nome exibido | Propósito |
|---|---|---|
| `LISTA_PRECO` | Lista de Preço | Sincronização de listas de preços |
| `IMPOSTOS` | Impostos | Cálculo e sincronização de impostos (ICMS, IPI, ST) |
| `CLIENTES` | Clientes | Sincronização de dados mestre de clientes |
| `PRODUTOS` | Produtos | Sincronização de dados mestre de produtos |
| `ESTOQUE` | Estoque | Sincronização de inventário |
| `NF` | Nota Fiscal | Gerenciamento de notas fiscais |
| `ORDEM_VENDA` | Ordem de Venda | Sincronização de ordens de venda |
| `SEGMENTO` | Segmento | Gerenciamento de dados de segmento |

**Tipo de Carga:**
- `INICIAL` — carga completa de todos os dados
- `INCREMENTAL` — carga diferencial (apenas alterações)

---

## Parâmetros por Processador

Cada processador tem seu próprio conjunto de parâmetros exibidos condicionalmente na UI:

### Lista de Preço
| Parâmetro | Campo UI | Descrição |
|---|---|---|
| `Datum` | Período Referência | Intervalo de datas |
| `Pltyp` | Tipo Lista Preço | Tipo de lista de preço (value help) |
| `Mater` | Material | Código do material (value help) |

### Impostos
| Parâmetro | Campo UI | Descrição |
|---|---|---|
| `Datimp` | Período Imposto | Intervalo de datas |
| `Icms` | ICMS | Checkbox (padrão: ativo) |
| `Ipi` | IPI | Checkbox (padrão: ativo) |
| `ST` | ST | Checkbox (padrão: inativo) |
| `Gruop` | Grupo | Grupo de imposto (value help) |
| `Shipf` | Emissor | Ship From — ICMS (value help) |
| `Shipt` | Receptor | Ship To — ICMS (value help, dependente de Shipf) |

### Clientes
| Parâmetro | Campo UI | Descrição |
|---|---|---|
| `Positivados` | Positivados | Checkbox |
| `Rejeitados` | Rejeitados | Checkbox |
| `Kunnr` | Cliente | Código do cliente (value help) |
| `Erdatk` | Período Criação Cliente | Intervalo de datas |

### Produtos
| Parâmetro | Campo UI | Descrição |
|---|---|---|
| `Matnr` | Material | Código do material (value help) |
| `Vtweg` | Canal Distrib. | Canal de distribuição |
| `Werks` | Centro | Centro/planta |
| `Mtart` | Tipo Material | Tipo de material |
| `Lgort` | Depósito | Localização de estoque |

### Estoque
| Parâmetro | Campo UI | Descrição |
|---|---|---|
| `Matest` | Material Estoque | Código do material (value help) |

### Nota Fiscal
| Parâmetro | Campo UI | Descrição |
|---|---|---|
| `Branch` | Filial | Filial (value help) |
| `Credat` | Período Criação NF | Intervalo de datas |

### Ordem de Venda
| Parâmetro | Campo UI | Descrição |
|---|---|---|
| `Erdat` | Período Criação OV | Intervalo de datas |
| `Vbeln` | Nº Ordem Venda | Número da ordem |

### Segmento
| Parâmetro | Campo UI | Descrição |
|---|---|---|
| `Datbi` | Período Validade | Intervalo de datas |
| `Ztag1` | Tag Segmento | Tag identificadora |

---

## Controllers

### `App.controller.js`

Controller raiz. Sem lógica de negócio — serve apenas como container.

**Método:**
- `onInit()` — vazio

---

### `Main.controller.js`

Controller principal com toda a lógica de negócio (~1000 linhas).

#### Propriedades Internas

| Propriedade | Descrição |
|---|---|
| `_oVHDialog` | Instância do dialog de Org. de Vendas |
| `_oVHClientesDialog` | Instância do dialog de Clientes |
| `_oVHProdutosDialog` | Instância do dialog de Produtos |
| `_oVHBranchDialog` | Instância do dialog de Filiais |
| `_oVHPltypDialog` | Instância do dialog de Tipos de Lista de Preço |
| `_oVHGruopDialog` | Instância do dialog de Grupos |
| `_oVHShipfDialog` | Instância do dialog de Ship From |
| `_oVHShiptDialog` | Instância do dialog de Ship To |
| `_sProdutoTargetField` | Campo alvo para seleção de produto |
| `_iMinProdutoSearchChars` | Mínimo de 3 caracteres para busca de produto |
| `_iMaxProdutosVH` | Máximo de 100 produtos por página |
| `_oProdutosVHState` | Estado de paginação da busca de produtos |
| `_mVHFilterConfig` | Configuração de filtros para todos os value helps |

#### Métodos por Categoria

**Inicialização:**

| Método | Descrição |
|---|---|
| `onInit()` | Inicializa referências de dialogs, carrega dados de org. de vendas |
| `_initViewModel()` | Cria JSONModel com estado dos processadores, parâmetros e resultados |
| `_loadOrgVendas()` | Carrega Organizações de Vendas do OData |
| `_loadBranches()` | Carrega filiais para o processador NF |
| `_loadClientes()` | Carrega clientes |
| `_loadPriceListTypes()` | Carrega tipos de lista de preço |
| `_loadGroups()` | Carrega grupos de imposto |
| `_loadShipIcms()` | Carrega combinações Ship From/To |
| `_loadProdutos()` | Carrega produtos |

**Gerenciamento de Value Helps:**

| Método | Descrição |
|---|---|
| `onValueHelpVkorg()` | Abre dialog de seleção de organização |
| `onKunnrInputValueHelpRequest()` | Abre dialog de clientes |
| `onMatnrInputValueHelpRequest()` | Abre dialog de produtos (campo Matnr) |
| `onMaterInputValueHelpRequest()` | Abre dialog de produtos (campo Mater) |
| `onMatestInputValueHelpRequest()` | Abre dialog de produtos (campo Matest) |
| `onPltypInputValueHelpRequest()` | Abre dialog de tipos de lista de preço |
| `onGruopInputValueHelpRequest()` | Abre dialog de grupos |
| `onShipfInputValueHelpRequest()` | Abre dialog de Ship From |
| `onShiptInputValueHelpRequest()` | Abre dialog de Ship To |
| `onBranchInputValueHelpRequest()` | Abre dialog de filiais |

**Seleção de Processadores:**

| Método | Descrição |
|---|---|
| `onProcessadorSelect()` | Atualiza estado quando checkbox de processador muda |
| `onSelecionarTodos()` | Seleciona todos os processadores |
| `onDesmarcarTodos()` | Desmarca todos os processadores |

**Execução e Resultados:**

| Método | Descrição |
|---|---|
| `onExecutar()` | Handler principal com validação e confirmação |
| `onLimpar()` | Limpa formulário e recarrega dados de org. |
| `_executar(aTipos)` | Executa processador(es) via OData |
| `_processarResultadoUnico()` | Trata resultado de processador único |
| `_processarResultadoMultiplo()` | Trata resultado de múltiplos processadores |
| `_processarErro()` | Tratamento de erros |

**Filtros e Busca:**

| Método | Descrição |
|---|---|
| `_applyValueHelpFilters()` | Aplica filtros baseado na configuração |
| `_buildSearchFilter()` | Cria filtros de busca a partir da entrada do usuário |
| `_buildAdditionalBindingFilter()` | Cria filtros de binding de campos relacionados |
| `_resolveTargetProperty()` | Determina o campo alvo a partir de candidatos |
| `_searchProdutosValueHelp()` | Busca server-side de produtos com paginação |

---

## Views e Fragments

### `App.view.xml`

View raiz. Contém apenas o controle `sap.m.App` que serve de container para as páginas roteadas.

---

### `Main.view.xml`

View principal com 3 seções principais e uma toolbar de rodapé:

#### Seção 1 — Processadores (Panel expansível)
- **Tipo de Carga:** `SegmentedButton` com opções Inicial / Incremental
- **Org. de Vendas (Vkorg):** Input com value help e sugestões
- **Checkboxes de Processadores:** 8 checkboxes (um por processador)
- **Botões:** Selecionar Todos / Desmarcar Todos

#### Seção 2 — Parâmetros (visibilidade dinâmica)
Cada processador expõe seus parâmetros condicionalmente quando selecionado. Os campos aparecem em cards flexíveis responsivos.

#### Seção 3 — Resultado da Execução (Panel expansível, pós-execução)
Tabela com colunas:
- **Processador** — nome do processador executado
- **Status** — ícone colorido (Sucesso / Erro / Aviso)
- **Mensagens** — lista de mensagens retornadas pelo backend

#### Toolbar do Rodapé
- Botão **Executar** (Emphasized, habilitado somente com vkorg + processador selecionado)
- Botão **Limpar** (Transparent)

---

### Fragments de Value Help

Todos os fragments usam `sap.m.SelectDialog` com busca, confirmação e cancelamento.

| Fragment | Tipo Seleção | Colunas Exibidas |
|---|---|---|
| `ValueHelpVkorg` | Single-select | Org., Descrição |
| `ValueHelpClientes` | Multi-select | Cliente, Nome, Cidade |
| `ValueHelpProdutos` | Multi-select + paginação | Código, Nome |
| `ValueHelpBranch` | Multi-select | Filial, Nome, Bukrs |
| `ValueHelpPltyp` | Multi-select | Tipo, Descrição |
| `ValueHelpGruop` | Multi-select | Grupo |
| `ValueHelpShipf` | Multi-select | Ship From |
| `ValueHelpShipt` | Multi-select | Ship To |

---

## Serviços e OData

**URL base do serviço:** `https://vhbtsde1ci.sap.inbetta.com:44300/sap/opu/odata/sap/ZSD_B2B_SRV/`

### `ODataService.js`

Encapsula toda a comunicação com o backend. Todos os métodos retornam **Promises**.

#### Entity Sets (leitura)

| Método | Entity Set | Campos Retornados |
|---|---|---|
| `loadOrgVendas(oModel)` | `/ZshOrgVendasSet` | `vkorg`, `vtext` |
| `loadBranches(oModel)` | `/YpmtlBranchSet` | `branch`, `name`, `bukrs` |
| `loadClientes(oModel)` | `/ZshClientesSet` | `customer`, `customername`, `cityname` |
| `loadProdutos(oModel)` | `/ZshProdutosSet` | `product`, `productname` |
| `loadPriceListTypes(oModel)` | `/ZshPricelistypSet` | `pricelisttype`, `pricelisttypename` |
| `loadGroups(oModel)` | `/ZshGroupSet` | `gruop` |
| `loadShipIcms(oModel)` | `/ZshShipIcmsSet` | `shipfrom`, `shipto`, `land1`, `rate`, `base`, `gruop` |

#### Busca de Produtos

```javascript
searchProdutos(oModel, oCriteria)
// oCriteria: { search, top, skip, vkorg, vtweg, werks, mtart }
// Filtragem client-side com suporte a $top e $skip
```

#### Function Imports

| Método | Function Import | Uso |
|---|---|---|
| `executarProcessador(oModel, oParams)` | `/ExecutarProcessador` | Executa um único processador |
| `executarMultiplos(oModel, oParams)` | `/ExecutarMultiplos` | Executa múltiplos processadores |

---

### `ParamsBuilder.js`

Constrói objetos de parâmetros limpos (sem `null`/`undefined`) para os function imports.

#### Métodos

```javascript
ParamsBuilder.buildSingle(sTipo, oViewData)
// Retorna parâmetros para execução de um processador
// Inclui: Tipo, CargaInicial, Vkorg + parâmetros específicos do processador

ParamsBuilder.buildMultiple(aTipos, oViewData)
// Retorna parâmetros para execução de múltiplos processadores
// Inclui: Tipos (CSV), CargaInicial, Vkorg + todos os parâmetros relevantes
```

**Parâmetros comuns adicionados por processador:**

| Processador | Parâmetros |
|---|---|
| LISTA_PRECO | Datum, Pltyp, Mater |
| IMPOSTOS | Datimp, Icms, Ipi, ST, Gruop, Shipf, Shipt |
| CLIENTES | Positivados, Rejeitados, Kunnr, Erdatk |
| PRODUTOS | Matnr, Vtweg, Werks, Mtart, Lgort |
| ESTOQUE | Matest |
| NF | Branch, Credat |
| ORDEM_VENDA | Erdat, Vbeln |
| SEGMENTO | Datbi, Ztag1 |

---

## Modelos de Dados

### View Model (JSONModel)

Criado em `_initViewModel()` e ligado à view com o nome `"view"`:

```json
{
  "tipoCarga": "INICIAL",
  "vkorg": "",
  "processadores": {
    "LISTA_PRECO": false,
    "IMPOSTOS": false,
    "CLIENTES": false,
    "PRODUTOS": false,
    "ESTOQUE": false,
    "NF": false,
    "ORDEM_VENDA": false,
    "SEGMENTO": false
  },
  "params": {
    "datumRange": "",
    "pltyp": "",
    "mater": "",
    "datimpRange": "",
    "icms": true,
    "ipi": true,
    "st": false,
    "gruop": "",
    "shipf": "",
    "shipt": "",
    "positivados": true,
    "rejeitados": false,
    "kunnr": "",
    "erdatkRange": "",
    "matnr": "",
    "vtweg": "",
    "werks": "",
    "mtart": "",
    "lgort": "",
    "matest": "",
    "branch": "",
    "cRedatRange": "",
    "erdatRange": "",
    "vbeln": "",
    "datbiRange": "",
    "ztag1": ""
  },
  "temSelecionado": false,
  "resultadoVisivel": false,
  "resultados": [],
  "orgVendas": [],
  "branches": [],
  "clientes": [],
  "produtos": [],
  "priceListTypes": [],
  "groups": [],
  "shipIcms": [],
  "shipFromOptions": [],
  "shipToOptions": []
}
```

### Device Model

Criado por `models.js` e registrado como `"device"`. Contém informações do dispositivo via `sap.ui.Device` (somente leitura).

---

## Sistema de Value Help

O sistema de value help suporta as seguintes capacidades:

### Busca e Filtragem

- **Filtragem client-side:** aplicada automaticamente baseada em campos relacionados via `_mVHFilterConfig`
- **Filtragem server-side:** usada para produtos com busca mínima de 3 caracteres
- **Filtros dependentes:** Ship To filtra baseado em Ship From e Grupo selecionados

### Paginação (Produtos)

O dialog de produtos suporta paginação com:
- Máximo de 100 itens por página (`_iMaxProdutosVH`)
- Estado gerenciado em `_oProdutosVHState` (currentPage, totalItems, etc.)
- Busca server-side disparada após 3+ caracteres

### Configuração de Filtros (`_mVHFilterConfig`)

Mapa de configuração que define para cada value help:
- Campos de busca (colunas pesquisáveis)
- Campos de binding adicionais (filtros dependentes de outros campos)
- Propriedade alvo no modelo da view

---

## Internacionalização (i18n)

**Arquivo:** `webapp/i18n/i18n.properties`
**Idioma:** Português (Brasil)
**Total:** ~104 chaves de tradução

### Grupos de Chaves

| Grupo | Prefixo | Descrição |
|---|---|---|
| Aplicação | `app*`, `title` | Título e descrição do app |
| Seções | `sec*` | Títulos das seções da UI |
| Labels gerais | `lbl*` | Rótulos de campos |
| Processadores | `lbl<Processador>` | Nomes dos processadores |
| Resultados | `col*` | Colunas da tabela de resultado |
| Botões | `btn*` | Texto dos botões |

---

## Roteamento e Navegação

A aplicação é **single-page** — não há navegação entre views.

**Configuração do Router** (em `manifest.json`):

```
Router: sap.m.routing.Router
ViewType: XML (async)
ViewPath: br.com.inbetta.zsdb2b.view
ControlId: app
Aggregation: pages

Rota: RouteMain
  Pattern: :?query:
  Target: TargetMain

Target: TargetMain
  View: Main
  Transition: slide
```

---

## Configuração e Build

### Scripts disponíveis (`package.json`)

| Script | Comando | Descrição |
|---|---|---|
| `npm start` | `ui5 serve --config ui5.yaml` | Inicia com FLP preview |
| `npm run start-local` | `ui5 serve --config ui5-local.yaml` | Inicia em modo local |
| `npm run start-mock` | `ui5 serve --config ui5-mock.yaml` | Inicia com mock server |
| `npm run start-noflp` | — | Inicia sem FLP |
| `npm run build` | `ui5 build` → `dist/` | Gera build de produção |
| `npm run deploy` | Build + deploy | Faz build e deploy |
| `npm run undeploy` | — | Remove do servidor |
| `npm run unit-test` | — | Executa testes unitários |
| `npm run int-test` | — | Executa testes de integração |

### Arquivos de Configuração UI5

| Arquivo | Uso |
|---|---|
| `ui5.yaml` | Produção — proxy para backend SAP + FLP preview |
| `ui5-local.yaml` | Desenvolvimento local |
| `ui5-mock.yaml` | Mock server com dados sintéticos gerados do metadata |
| `ui5-deploy.yaml` | Configuração de deploy (destino, app ID, pacote) |

### Dependências de Desenvolvimento

| Pacote | Versão | Propósito |
|---|---|---|
| `@ui5/cli` | ^4.0.33 | Build e tooling UI5 |
| `@sap/ux-ui5-tooling` | 1 | Fiori tools (proxy, preview, reload) |
| `@sap-ux/ui5-middleware-fe-mockserver` | 2 | Mock server OData |
| `rimraf` | ^5.0.5 | Limpeza de diretórios |

---

## Testes

### Testes Unitários (QUnit)

**Localização:** `webapp/test/unit/`

- `unitTests.qunit.js` — Suite principal de testes unitários
- `controller/Main.controller.js` — Testes de inicialização do controller principal
  - Verifica que o controller é instanciado corretamente
  - Verifica execução de `onInit()`

### Testes de Integração (OPA5)

**Localização:** `webapp/test/integration/`

- `opaTests.qunit.js` — Suite principal OPA
- `AllJourneys.js` — Carrega todas as jornadas
- `NavigationJourney.js` — Jornada: "Should see the initial page of the app"
  - Verifica que o app carrega com sucesso
  - Verifica que a view Main está visível

**Page Objects:**
- `pages/App.js` — Asserções sobre a view App
- `pages/Main.js` — Asserções sobre a view Main
- `arrangements/Startup.js` — Setup do ambiente de teste

---

## Fluxos de Dados

### Inicialização do App

```
Component.js inicializa
  → App.view.xml carrega
    → Main.view.xml carrega via roteamento
      → Main.controller.js: onInit()
        → _initViewModel()         [cria JSONModel vazio]
        → _loadOrgVendas()         [carrega org. de vendas via OData]
        → View recebe data binding
```

### Execução de Processador

```
Usuário clica "Executar"
  → onExecutar()
    → Valida: vkorg preenchido?
    → Valida: ao menos 1 processador selecionado?
    → Exibe dialog de confirmação com processadores selecionados
      → Usuário confirma
        → BusyIndicator ativo
        → _executar(aTipos)
          → ParamsBuilder.buildSingle/Multiple(tipo, viewData)
          → ODataService.executarProcessador/executarMultiplos()
            → Backend SAP processa
          → _processarResultadoUnico() ou _processarResultadoMultiplo()
            → Atualiza model: resultados[]
            → resultadoVisivel = true
        → BusyIndicator desativo
        → Toast de sucesso ou MessageBox de erro
```

### Fluxo de Value Help

```
Usuário clica ícone de value help
  → onValueHelpRequest handler
    → Dados já carregados? (cache no model)
    → Fragment.load() → cria dialog (lazy)
    → Dialog.open()
      → _applyValueHelpFilters()    [aplica filtros de campos relacionados]

    → Usuário digita na busca
      → Produtos: _searchProdutosValueHelp() [server-side se ≥3 chars]
      → Outros: filtragem client-side

    → Usuário seleciona item(s)
      → onVHConfirm()
        → Atualiza view model com valor(es) selecionado(s)
        → Dialog fecha
```

---

## Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Framework Frontend | OpenUI5 v1.114.13 |
| Biblioteca de Controles | `sap.m`, `sap.ui.core` |
| Linguagem | JavaScript (ES5) |
| Views | XML (carregamento assíncrono) |
| Data Binding | Two-way binding |
| Modelos | `JSONModel` (estado da view), `ODataModel` (backend) |
| Backend | SAP ERP — OData v2.0 (`ZSD_B2B_SRV`) |
| Build | UI5 CLI v4.0.33 |
| Testes | QUnit (unitários) + OPA5 (integração) |
| Tema | sap_horizon |
| Localização | Properties file (PT-BR) |
| Plataforma de Desenvolvimento | Visual Studio Code + SAP Fiori Tools |
