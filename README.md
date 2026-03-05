# ZUI_SD_B2B — Envio de Cargas B2B

Aplicação SAP Fiori para gerenciamento de envio de cargas B2B (ZSD277).

## Informações Gerais

| | |
|---|---|
| **App ID** | `br.com.inbetta.zsdb2b` |
| **Transação SAP** | ZSD277 |
| **Framework** | OpenUI5 v1.114.13 |
| **OData Service** | `ZSD_B2B_SRV` |
| **Tema** | sap_horizon |
| **Idioma** | Português (Brasil) |

## O que faz

Permite selecionar e executar processadores de dados mestre B2B contra o backend SAP. Cada processador sincroniza um domínio específico (preços, impostos, clientes, produtos, estoque, notas fiscais, ordens de venda, segmentos) com suporte a carga **Inicial** ou **Incremental**.

## Como Executar

```bash
# Desenvolvimento com backend real
npm start

# Desenvolvimento local
npm run start-local

# Desenvolvimento com mock data
npm run start-mock

# Build de produção
npm run build

# Deploy
npm run deploy
```

## Documentação

A documentação técnica detalhada está em [docs/FUNCIONAMENTO.md](docs/FUNCIONAMENTO.md).

## Estrutura

```
webapp/
├── controller/     # Lógica de negócio (MVC)
├── view/           # Views XML e Fragments
├── service/        # Comunicação OData e construção de parâmetros
├── model/          # Factories de modelo
├── i18n/           # Tradução PT-BR
└── localService/   # Mock data e metadata OData
```

## OData — ZSD_B2B_SRV

**URL:** `https://vhbtsde1ci.sap.inbetta.com:44300/sap/opu/odata/sap/ZSD_B2B_SRV/`

### Entity Sets (leitura)

| Entity Set | Descrição |
|---|---|
| `GET /ZshOrgVendasSet` | Organizações de Vendas |
| `GET /ZshClientesSet` | Clientes |
| `GET /ZshProdutosSet` | Produtos (com paginação) |
| `GET /YpmtlBranchSet` | Filiais (NF) |
| `GET /ZshPricelistypSet` | Tipos de Lista de Preço |
| `GET /ZshGroupSet` | Grupos de Imposto |
| `GET /ZshShipIcmsSet` | Combinações Ship From/To (ICMS) |

### Function Imports (execução)

| Function Import | Retorno | Descrição |
|---|---|---|
| `GET /ExecutarProcessador` | `Collection(B2BMessage)` | Executa 1 processador |
| `GET /ExecutarMultiplos` | `Collection(B2BResult)` | Executa N processadores em lote |

## Tecnologias

- **Frontend:** OpenUI5 (sap.m, sap.ui.core)
- **Backend:** SAP ERP via OData v2.0
- **Build:** UI5 CLI + SAP Fiori Tools
- **Testes:** QUnit + OPA5
