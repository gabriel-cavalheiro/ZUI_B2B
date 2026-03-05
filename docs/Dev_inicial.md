|               | Detalhe                                                                                  |
|---------------|------------------------------------------------------------------------------------------|
| **Projeto**   | ZUI_SD_B2B — APP FIORI UI5 B2B · ZSD277                                                  |
| **Dev**       | Gabriel Cavalheiro                                                                       |
| **Empresa**   | Prestativ                                                                                |
| **Data**      | 05.03.2026                                                                               |
| **Descrição** | Documentação técnica do app Fiori UI5 de Envio de Cargas B2B. Cobre arquitetura, fluxos, processadores, parâmetros e integração OData. |

**Requests OData — `ZSD_B2B_SRV`**

| Tipo             | Endpoint                | Descrição                              |
|------------------|-------------------------|----------------------------------------|
| Entity Set (GET) | `/ZshOrgVendasSet`      | Organizações de Vendas                 |
| Entity Set (GET) | `/ZshClientesSet`       | Clientes                               |
| Entity Set (GET) | `/ZshProdutosSet`       | Produtos (com paginação)               |
| Entity Set (GET) | `/YpmtlBranchSet`       | Filiais (NF)                           |
| Entity Set (GET) | `/ZshPricelistypSet`    | Tipos de Lista de Preço                |
| Entity Set (GET) | `/ZshGroupSet`          | Grupos de Imposto                      |
| Entity Set (GET) | `/ZshShipIcmsSet`       | Combinações Ship From/To (ICMS)        |
| Function (GET)   | `/ExecutarProcessador`  | Executa 1 processador → `Collection(B2BMessage)` |
| Function (GET)   | `/ExecutarMultiplos`    | Executa N processadores → `Collection(B2BResult)` |

---

# Documentação de Funcionamento — ZUI_SD_B2B

## Sumário

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Processadores](#processadores)
4. [Parâmetros por Processador](#parâmetros-por-processador)
5. [Controllers](#controllers)
6. [Views e Fragments](#views-e-fragments)
7. [Serviços e OData](#serviços-e-odata)
8. [Modelos de Dados](#modelos-de-dados)
9. [Sistema de Value Help](#sistema-de-value-help)
10. [Internacionalização (i18n)](#internacionalização-i18n)
11. [Roteamento e Navegação](#roteamento-e-navegação)
12. [Configuração e Build](#configuração-e-build)
13. [Testes](#testes)
14. [Fluxos de Dados](#fluxos-de-dados)

---

## Visão Geral

O **ZUI_SD_B2B** é uma aplicação SAP Fiori para gerenciamento de envio de cargas B2B. Ela permite que usuários selecionem um ou mais **processadores** de dados — cada um responsável por sincronizar um domínio específico de dados mestre (preços, impostos, clientes, produtos, etc.) — e os executem com parâmetros customizados contra um backend SAP.

**Funcionalidades principais:**
- Seleção de tipo de carga: **Inicial** (carga completa) ou **Incremental** (diferencial)
- Seleção de até 8 processadores independentes com execução em lote
- Parametrização granular por processador com visibilidade dinâmica de campos
- Value helps com busca, filtros dependentes e paginação (produtos)
- Exibição de resultados com status e mensagens retornadas pelo backend

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

| Parâmetro OData | Campo UI | Tipo | Descrição |
|---|---|---|---|
| `Datum` | Período Referência | `Edm.String` | Intervalo de datas (YYYYMMDD,YYYYMMDD) |
| `Pltyp` | Tipo Lista Preço | `Edm.String` | Tipo de lista de preço (value help) |
| `Mater` | Material | `Edm.String` | Código do material (value help) |

### Impostos

| Parâmetro OData | Campo UI | Tipo | Descrição |
|---|---|---|---|
| `Datimp` | Período Imposto | `Edm.String` | Intervalo de datas |
| `Icms` | ICMS | `Edm.Boolean` | Flag ICMS (padrão: true) |
| `Ipi` | IPI | `Edm.Boolean` | Flag IPI (padrão: true) |
| `ST` | ST | `Edm.Boolean` | Flag Substituição Tributária (padrão: false) |
| `Gruop` | Grupo | `Edm.String` | Grupo de imposto (value help) |
| `Shipf` | Emissor | `Edm.String` | Ship From — ICMS (value help) |
| `Shipt` | Receptor | `Edm.String` | Ship To — ICMS (value help, dependente de Shipf) |

### Clientes

| Parâmetro OData | Campo UI | Tipo | Descrição |
|---|---|---|---|
| `Positivados` | Positivados | `Edm.Boolean` | Incluir clientes positivados |
| `Rejeitados` | Rejeitados | `Edm.Boolean` | Incluir clientes rejeitados |
| `Kunnr` | Cliente | `Edm.String` | Código do cliente (value help) |
| `Erdatk` | Período Criação Cliente | `Edm.String` | Intervalo de datas |

### Produtos

| Parâmetro OData | Campo UI | Tipo | Descrição |
|---|---|---|---|
| `Matnr` | Material | `Edm.String` | Código do material (value help) |
| `Vtweg` | Canal Distrib. | `Edm.String` | Canal de distribuição |
| `Werks` | Centro | `Edm.String` | Centro/planta |
| `Mtart` | Tipo Material | `Edm.String` | Tipo de material |
| `Lgort` | Depósito | `Edm.String` | Localização de estoque |

### Estoque

| Parâmetro OData | Campo UI | Tipo | Descrição |
|---|---|---|---|
| `Matest` | Material Estoque | `Edm.String` | Código do material (value help) |

### Nota Fiscal

| Parâmetro OData | Campo UI | Tipo | Descrição |
|---|---|---|---|
| `Branch` | Filial | `Edm.String` | Filial (value help) |
| `Credat` | Período Criação NF | `Edm.String` | Intervalo de datas |

### Ordem de Venda

| Parâmetro OData | Campo UI | Tipo | Descrição |
|---|---|---|---|
| `Erdat` | Período Criação OV | `Edm.String` | Intervalo de datas |
| `Vbeln` | Nº Ordem Venda | `Edm.String` | Número da ordem |

### Segmento

| Parâmetro OData | Campo UI | Tipo | Descrição |
|---|---|---|---|
| `Datbi` | Período Validade | `Edm.String` | Intervalo de datas |
| `Ztag1` | Tag Segmento | `Edm.String` | Tag identificadora |

---

## Controllers

### `App.controller.js`

Controller raiz. Sem lógica de negócio — serve apenas como container.

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
| `onInit()` | Inicializa referências de dialogs e carrega dados de org. de vendas |
| `_initViewModel()` | Cria JSONModel com estado dos processadores, parâmetros e resultados |
| `_loadOrgVendas()` | Carrega Organizações de Vendas do OData → `ZshOrgVendasSet` |
| `_loadBranches()` | Carrega filiais → `YpmtlBranchSet` |
| `_loadClientes()` | Carrega clientes → `ZshClientesSet` |
| `_loadPriceListTypes()` | Carrega tipos de lista de preço → `ZshPricelistypSet` |
| `_loadGroups()` | Carrega grupos de imposto → `ZshGroupSet` |
| `_loadShipIcms()` | Carrega combinações Ship From/To → `ZshShipIcmsSet` |
| `_loadProdutos()` | Carrega produtos → `ZshProdutosSet` |

**Gerenciamento de Value Helps:**

| Método | Descrição |
|---|---|
| `onValueHelpVkorg()` | Abre dialog de seleção de organização (single-select) |
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
| `_processarResultadoUnico()` | Trata resultado de processador único (`B2BMessage`) |
| `_processarResultadoMultiplo()` | Trata resultado de múltiplos processadores (`B2BResult`) |
| `_processarErro()` | Tratamento e exibição de erros |

**Filtros e Busca:**

| Método | Descrição |
|---|---|
| `_applyValueHelpFilters()` | Aplica filtros baseado na configuração `_mVHFilterConfig` |
| `_buildSearchFilter()` | Cria filtros de busca a partir da entrada do usuário |
| `_buildAdditionalBindingFilter()` | Cria filtros de binding de campos relacionados |
| `_resolveTargetProperty()` | Determina o campo alvo a partir de candidatos |
| `_searchProdutosValueHelp()` | Busca server-side de produtos com paginação |

---

## Views e Fragments

### `Main.view.xml`

View principal com 3 seções e uma toolbar de rodapé:

#### Seção 1 — Processadores (Panel expansível)
- **Tipo de Carga:** `SegmentedButton` → INICIAL / INCREMENTAL
- **Org. de Vendas (Vkorg):** `Input` com value help e sugestões
- **Checkboxes:** 8 processadores independentes
- **Botões:** Selecionar Todos / Desmarcar Todos

#### Seção 2 — Parâmetros (visibilidade dinâmica)
Cada processador expõe seus parâmetros em cards flexíveis responsivos, visíveis somente quando o processador está selecionado.

#### Seção 3 — Resultado da Execução (pós-execução)
Tabela com colunas: **Processador**, **Status** (ícone colorido), **Mensagens**.

#### Toolbar do Rodapé
- **Executar** — habilitado somente com vkorg + ao menos 1 processador selecionado
- **Limpar** — reseta o formulário

---

### Fragments de Value Help

Todos os fragments usam `sap.m.SelectDialog` com suporte a busca.

| Fragment | Seleção | Colunas | Entity Set |
|---|---|---|---|
| `ValueHelpVkorg` | Single | Org., Descrição | `ZshOrgVendasSet` |
| `ValueHelpClientes` | Multi | Cliente, Nome, Cidade | `ZshClientesSet` |
| `ValueHelpProdutos` | Multi + paginação | Código, Nome | `ZshProdutosSet` |
| `ValueHelpBranch` | Multi | Filial, Nome, Bukrs | `YpmtlBranchSet` |
| `ValueHelpPltyp` | Multi | Tipo, Descrição | `ZshPricelistypSet` |
| `ValueHelpGruop` | Multi | Grupo | `ZshGroupSet` |
| `ValueHelpShipf` | Multi | Ship From | `ZshShipIcmsSet` |
| `ValueHelpShipt` | Multi | Ship To | `ZshShipIcmsSet` |

---

## Serviços e OData

**Serviço:** `ZSD_B2B_SRV`
**URL base:** `https://vhbtsde1ci.sap.inbetta.com:44300/sap/opu/odata/sap/ZSD_B2B_SRV/`
**Versão:** OData v2.0

### Entity Sets

| Entity Set | EntityType | Chave | Campos |
|---|---|---|---|
| `ZshOrgVendasSet` | `ZshOrgVendas` | `Vkorg` | `Vkorg` (4), `Vtext` (20) |
| `ZshClientesSet` | `ZshClientes` | `Customer` | `Customer` (10), `Customername` (80), `Cityname` (35) |
| `ZshProdutosSet` | `ZshProdutos` | `Product` | `Product` (40), `Productname` (40) |
| `YpmtlBranchSet` | `YpmtlBranch` | `Branch` | `Branch` (4), `Bukrs` (4), `Name` (30) |
| `ZshPricelistypSet` | — | — | `pricelisttype`, `pricelisttypename` |
| `ZshGroupSet` | — | — | `gruop` |
| `ZshShipIcmsSet` | — | — | `shipfrom`, `shipto`, `land1`, `rate`, `base`, `gruop` |
| `B2BMessageSet` | `B2BMessage` | `SeqID` | `SeqID`, `Type`, `Message` |
| `B2BResultSet` | `B2BResult` | `Processor` | `Processor`, `Status`, `QtdMessages` |

### Function Imports

#### `ExecutarProcessador` — Executa um único processador
- **HTTP Method:** GET
- **Retorno:** `Collection(B2BMessage)`
- **Parâmetro obrigatório:** `Tipo` (Edm.String)

#### `ExecutarMultiplos` — Executa múltiplos processadores
- **HTTP Method:** GET
- **Retorno:** `Collection(B2BResult)`
- **Parâmetro obrigatório:** `Tipos` (Edm.String, CSV)

**Parâmetros comuns a ambos os function imports:**

| Parâmetro | Tipo | Nullable | Descrição |
|---|---|---|---|
| `CargaInicial` | `Edm.Boolean` | Sim | true = INICIAL, false = INCREMENTAL |
| `Vkorg` | `Edm.String` | Sim | Organização de Vendas |
| `Datum` | `Edm.String` | Sim | Período referência (Lista de Preço) |
| `Datimp` | `Edm.String` | Sim | Período de imposto |
| `Icms` | `Edm.Boolean` | Sim | Flag ICMS |
| `Ipi` | `Edm.Boolean` | Sim | Flag IPI |
| `ST` | `Edm.Boolean` | Sim | Flag Substituição Tributária |
| `Positivados` | `Edm.Boolean` | Sim | Flag clientes positivados |
| `Rejeitados` | `Edm.Boolean` | Sim | Flag clientes rejeitados |
| `Vtweg` | `Edm.String` | Sim | Canal de distribuição |
| `Werks` | `Edm.String` | Sim | Centro/planta |
| `Mtart` | `Edm.String` | Sim | Tipo de material |
| `Lgort` | `Edm.String` | Sim | Depósito |
| `Datbi` | `Edm.String` | Sim | Período de validade (Segmento) |
| `Ztag1` | `Edm.String` | Sim | Tag de segmento |
| `Pltyp` | `Edm.String` | Sim | Tipo de lista de preço |
| `Mater` | `Edm.String` | Sim | Material (Lista de Preço) |
| `Matnr` | `Edm.String` | Sim | Material (Produtos) |
| `Matest` | `Edm.String` | Sim | Material (Estoque) |
| `Kunnr` | `Edm.String` | Sim | Código do cliente |
| `Erdatk` | `Edm.String` | Sim | Data criação cliente |
| `Branch` | `Edm.String` | Sim | Filial (NF) |
| `Credat` | `Edm.String` | Sim | Data criação NF |
| `Vbeln` | `Edm.String` | Sim | Número da ordem de venda |
| `Erdat` | `Edm.String` | Sim | Data criação OV |
| `Gruop` | `Edm.String` | Sim | Grupo de imposto |
| `Shipf` | `Edm.String` | Sim | Ship From (ICMS) |
| `Shipt` | `Edm.String` | Sim | Ship To (ICMS) |

---

## Modelos de Dados

### View Model (JSONModel — nome: `"view"`)

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
    "datumRange": "",   "pltyp": "",        "mater": "",
    "datimpRange": "",  "icms": true,       "ipi": true,
    "st": false,        "gruop": "",        "shipf": "",        "shipt": "",
    "positivados": true,"rejeitados": false,"kunnr": "",        "erdatkRange": "",
    "matnr": "",        "vtweg": "",        "werks": "",        "mtart": "",        "lgort": "",
    "matest": "",
    "branch": "",       "cRedatRange": "",
    "erdatRange": "",   "vbeln": "",
    "datbiRange": "",   "ztag1": ""
  },
  "temSelecionado": false,
  "resultadoVisivel": false,
  "resultados": [],
  "orgVendas": [],   "branches": [],     "clientes": [],
  "produtos": [],    "priceListTypes": [],"groups": [],
  "shipIcms": [],    "shipFromOptions": [],"shipToOptions": []
}
```

---

## Sistema de Value Help

### Comportamentos

| Comportamento | Detalhe |
|---|---|
| **Carregamento lazy** | Dialog criado na primeira abertura via `Fragment.load()` |
| **Cache** | Dados carregados no `onInit` e reutilizados em abertura subsequente |
| **Filtragem client-side** | Baseada em `_mVHFilterConfig` com campos dependentes |
| **Filtragem server-side** | Usada apenas para Produtos (mínimo 3 caracteres) |
| **Filtros dependentes** | Ship To filtra com base em Ship From e Grupo selecionados |

### Paginação de Produtos

- Máximo de 100 itens por página (`_iMaxProdutosVH`)
- Estado em `_oProdutosVHState`: página atual, total de itens
- Busca server-side disparada após digitar 3+ caracteres

---

## Internacionalização (i18n)

**Arquivo:** `webapp/i18n/i18n.properties` — Português (Brasil) — ~104 chaves

| Grupo | Prefixo | Exemplos |
|---|---|---|
| Aplicação | `appTitle`, `title` | Nome e descrição do app |
| Seções | `sec*` | `secProcessadores`, `secParametros`, `secResultado` |
| Labels | `lbl*` | `lblVkorg`, `lblDatum`, `lblKunnr` |
| Botões | `btn*` | `btnExecutar`, `btnLimpar`, `btnSelecionarTodos` |
| Colunas | `col*` | `colProcessador`, `colStatus`, `colMensagens` |

---

## Roteamento e Navegação

Aplicação **single-page** — sem navegação entre views.

```
Router: sap.m.routing.Router  (async XML)
ControlId: app  |  Aggregation: pages

Rota: RouteMain
  Pattern: :?query:
  Target: TargetMain → View: Main (transition: slide)
```

---

## Configuração e Build

### Scripts npm

| Script | Descrição |
|---|---|
| `npm start` | Inicia com FLP preview e proxy para backend SAP |
| `npm run start-local` | Modo desenvolvimento local |
| `npm run start-mock` | Mock server com dados gerados do metadata |
| `npm run build` | Build de produção → `dist/` |
| `npm run deploy` | Build + deploy no servidor SAP |
| `npm run unit-test` | Testes unitários (QUnit) |
| `npm run int-test` | Testes de integração (OPA5) |

### Arquivos de Configuração UI5

| Arquivo | Uso |
|---|---|
| `ui5.yaml` | Produção — proxy + FLP preview + hot reload |
| `ui5-local.yaml` | Desenvolvimento local |
| `ui5-mock.yaml` | Mock server com `@sap-ux/ui5-middleware-fe-mockserver` |
| `ui5-deploy.yaml` | Config de deploy (destino, app ID, pacote ABAP) |

---

## Testes

### Unitários (QUnit) — `webapp/test/unit/`

- `unitTests.qunit.js` — Suite principal
- `controller/Main.controller.js` — Instanciação e `onInit()` do controller principal

### Integração (OPA5) — `webapp/test/integration/`

- `NavigationJourney.js` — Verifica carregamento inicial e visibilidade da Main view
- `pages/App.js`, `pages/Main.js` — Page objects com asserções
- `arrangements/Startup.js` — Setup do ambiente de teste

---

## Fluxos de Dados

### Inicialização do App

```
Component.js
  → App.view.xml (container)
    → Main.view.xml (roteamento)
      → Main.controller.js: onInit()
        → _initViewModel()     [JSONModel vazio]
        → _loadOrgVendas()     [GET /ZshOrgVendasSet]
        → view recebe binding
```

### Execução de Processador

```
Usuário clica "Executar"
  → onExecutar()
    → Valida: vkorg preenchido?
    → Valida: ao menos 1 processador selecionado?
    → MessageBox de confirmação
      → Usuário confirma → BusyIndicator ON
        → _executar(aTipos)
          → ParamsBuilder.buildSingle/Multiple()
          → ODataService.executarProcessador()  → GET /ExecutarProcessador
            ou executarMultiplos()              → GET /ExecutarMultiplos
          → _processarResultadoUnico()   [B2BMessage: SeqID, Type, Message]
            ou _processarResultadoMultiplo() [B2BResult: Processor, Status, QtdMessages]
            → model.resultados[] atualizado
            → resultadoVisivel = true
        → BusyIndicator OFF
        → Toast (sucesso) ou MessageBox (erro)
```

### Fluxo de Value Help

```
Usuário clica ícone de value help
  → onValueHelpRequest handler
    → Fragment.load() (lazy — só na 1ª vez)
    → Dialog.open()
      → _applyValueHelpFilters()   [filtros de campos dependentes]

    → Usuário digita na busca
      → Produtos: _searchProdutosValueHelp() se ≥ 3 chars (server-side)
      → Outros: filtragem client-side no JSONModel

    → Usuário seleciona e confirma
      → onVHConfirm()
        → view model atualizado com valor(es) selecionado(s)
        → Dialog fecha
```
