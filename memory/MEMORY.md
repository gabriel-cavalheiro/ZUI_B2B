# ZUI_SD_B2B Project Memory

## Project Overview
- SAP UI5 Fiori app for B2B cargo shipment processing (ZSD277)
- OData service: `ZSD_B2B_SRV` at `/sap/opu/odata/sap/ZSD_B2B_SRV/`
- App namespace: `br.com.inbetta.zsdb2b`
- Min UI5 version: 1.114.13, flexEnabled: true

## Key Files
- [webapp/view/Main.view.xml](../webapp/view/Main.view.xml) — main view
- [webapp/controller/Main.controller.js](../webapp/controller/Main.controller.js) — main controller
- [webapp/service/ODataService.js](../webapp/service/ODataService.js) — OData calls
- [webapp/service/ParamsBuilder.js](../webapp/service/ParamsBuilder.js) — builds FunctionImport params
- [webapp/i18n/i18n.properties](../webapp/i18n/i18n.properties) — labels (PT-BR)
- [webapp/localService/mainService/metadata.xml](../webapp/localService/mainService/metadata.xml) — local OData metadata

## OData Entity Sets
| EntitySet | Entity Type | Purpose |
|-----------|-------------|---------|
| ZshOrgVendasSet | ZshOrgVendas (Vkorg, Vtext) | Org. Vendas VH for Vkorg field |
| YpmtlBranchSet | YpmtlBranch (Branch, Name, Bukrs) | Branch VH for NF panel |
| ZshClientesSet | ZshClientes (Customer, Customername, Cityname) | Cliente VH for Kunnr field |
| ZshProdutosSet | ZshProdutos (Product, Productname) | Material VH for Matnr/Mater/Matest |

## FunctionImports
- `ExecutarProcessador` (GET) — single processor, param `Tipo`
- `ExecutarMultiplos` (GET) — multiple processors, param `Tipos` (CSV)

## Value Help Fragments
- `ValueHelpVkorg.fragment.xml` — binds `view>/orgVendas`, handlers: `onOrgVendasSelectDialogSearch/Confirm/Cancel`
- `ValueHelpClientes.fragment.xml` — binds `view>/clientes`, multiSelect, handlers: `onVHClientes*`
- `ValueHelpProdutos.fragment.xml` — binds `view>/produtos`, multiSelect, reused for mater/matnr/matest via `_sProdutoTargetField`
- `ValueHelpBranch.fragment.xml` — binds `view>/branches`, multiSelect, handlers: `onVHBranch*`

## UI5 Plugin Naming Conventions (strict)
- SelectDialog IDs: `idXxxSelectDialog` where Xxx matches binding path (e.g. `idClientesSelectDialog`)
- StandardListItem IDs: `idXxxStandardListItem`
- DateRangePicker IDs: `idXxxRangeDateRangePicker` (e.g. `idDatumRangeDateRangePicker`)
- VH event handlers on Input: `onXxxInputValueHelpRequest` (e.g. `onKunnrInputValueHelpRequest`)
- SelectDialog handlers derived from binding path: `onOrgVendasSelectDialogSearch/Confirm/Cancel`
- Instance dialog properties must be declared in `onInit` to avoid plugin warnings
- `DateRangePicker` in `sap.m` causes false-positive "class doesn't exist" from plugin — safe to ignore

## Date Range Pattern
- DateRangePicker uses `valueFormat="yyyyMMdd"` → stored value format: `"YYYYMMDD - YYYYMMDD"` (default delimiter ` - `)
- ParamsBuilder splits on `" - "`: `_rangeFrom()` gets start date, `_rangeToCsv()` gets `"FROM,TO"`
- Validity date params (Datum, Datimp, Datbi) → send start date only via `_rangeFrom`
- Creation date params (Erdatk, Credat, Erdat) → send CSV via `_rangeToCsv`

## View Model Structure (params)
Date range fields: `datumRange`, `datimpRange`, `datbiRange`, `erdatkRange`, `cRedatRange`, `erdatRange`
Lists: `orgVendas[]`, `branches[]`, `clientes[]`, `produtos[]` (lazy-loaded on first VH open)
