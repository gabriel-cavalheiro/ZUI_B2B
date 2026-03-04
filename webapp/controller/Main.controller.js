sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "../service/ODataService",
    "../service/ParamsBuilder"
], function (Controller, JSONModel, MessageBox, MessageToast, BusyIndicator, Fragment, Filter, FilterOperator, ODataService, ParamsBuilder) {
    "use strict";

    return Controller.extend("br.com.inbetta.zsdb2b.controller.Main", {

        onInit: function () {
            this._oVHDialog = null;
            this._oVHClientesDialog = null;
            this._oVHProdutosDialog = null;
            this._oVHBranchDialog = null;
            this._sProdutoTargetField = null;
            this._initViewModel();
            this._loadOrgVendas();
        },

        _initViewModel: function () {
            var oViewModel = new JSONModel({
                tipoCarga: "INICIAL",
                vkorg: "",
                processadores: {
                    LISTA_PRECO: false,
                    IMPOSTOS: false,
                    CLIENTES: false,
                    PRODUTOS: false,
                    ESTOQUE: false,
                    NF: false,
                    ORDEM_VENDA: false,
                    SEGMENTO: false
                },
                params: {
                    datumRange: "", pltyp: "", mater: "",
                    datimpRange: "", icms: true, ipi: true, st: false,
                    gruop: "", shipf: "", shipt: "",
                    positivados: true, rejeitados: false, kunnr: "", erdatkRange: "",
                    matnr: "", vtweg: "", werks: "", mtart: "", lgort: "",
                    matest: "",
                    branch: "", cRedatRange: "",
                    erdatRange: "", vbeln: "",
                    datbiRange: "", ztag1: ""
                },
                temSelecionado: false,
                resultadoVisivel: false,
                resultados: [],
                orgVendas: [],
                branches: [],
                clientes: [],
                produtos: []
            });
            this.getView().setModel(oViewModel, "view");
        },

        _loadOrgVendas: function () {
            var that = this;
            var oODataModel = this.getOwnerComponent().getModel();
            return ODataService.loadOrgVendas(oODataModel).then(function (aItems) {
                that.getView().getModel("view").setProperty("/orgVendas", aItems);
                return aItems;
            }).catch(function () {
                return [];
            });
        },

        _loadBranches: function () {
            var that = this;
            var oODataModel = this.getOwnerComponent().getModel();
            return ODataService.loadBranches(oODataModel).then(function (aItems) {
                that.getView().getModel("view").setProperty("/branches", aItems);
                return aItems;
            }).catch(function () {
                return [];
            });
        },

        _loadClientes: function () {
            var that = this;
            var oODataModel = this.getOwnerComponent().getModel();
            return ODataService.loadClientes(oODataModel).then(function (aItems) {
                that.getView().getModel("view").setProperty("/clientes", aItems);
                return aItems;
            }).catch(function () {
                return [];
            });
        },

        _loadProdutos: function () {
            var that = this;
            var oODataModel = this.getOwnerComponent().getModel();
            return ODataService.loadProdutos(oODataModel).then(function (aItems) {
                that.getView().getModel("view").setProperty("/produtos", aItems);
                return aItems;
            }).catch(function () {
                return [];
            });
        },

        // ========== VALUE HELP VKORG ==========

        onValueHelpVkorg: function () {
            var oView = this.getView();
            var aOrgVendas = oView.getModel("view").getProperty("/orgVendas") || [];
            var that = this;

            Promise.resolve(aOrgVendas.length ? aOrgVendas : this._loadOrgVendas()).then(function () {
                if (!that._oVHDialog) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "br.com.inbetta.zsdb2b.view.ValueHelpVkorg",
                        controller: that
                    }).then(function (oDialog) {
                        that._oVHDialog = oDialog;
                        oView.addDependent(oDialog);
                        oDialog.open();
                    });
                } else {
                    that._oVHDialog.open();
                }
            });
        },

        onOrgVendasSelectDialogSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var aFilters = [];
            if (sValue) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("vkorg", FilterOperator.Contains, sValue),
                        new Filter("vtext", FilterOperator.Contains, sValue)
                    ],
                    and: false
                }));
            }
            oEvent.getSource().getBinding("items").filter(aFilters);
        },

        onOrgVendasSelectDialogConfirm: function (oEvent) {
            var oItem = oEvent.getParameter("selectedItem");
            if (oItem) {
                var sVkorg = oItem.getBindingContext("view").getProperty("vkorg");
                this.getView().getModel("view").setProperty("/vkorg", sVkorg);
            }
        },

        onOrgVendasSelectDialogCancel: function () {},

        onVkorgSuggestionSelected: function (oEvent) {
            var oItem = oEvent.getParameter("selectedItem");
            if (oItem) {
                this.getView().getModel("view").setProperty("/vkorg", oItem.getKey());
            }
        },

        // ========== VALUE HELP CLIENTES ==========

        onKunnrInputValueHelpRequest: function () {
            var oView = this.getView();
            var that = this;
            var aClientes = oView.getModel("view").getProperty("/clientes") || [];

            Promise.resolve(aClientes.length ? aClientes : this._loadClientes()).then(function () {
                if (!that._oVHClientesDialog) {
                    Fragment.load({
                        id: oView.getId() + "-clientes",
                        name: "br.com.inbetta.zsdb2b.view.ValueHelpClientes",
                        controller: that
                    }).then(function (oDialog) {
                        that._oVHClientesDialog = oDialog;
                        oView.addDependent(oDialog);
                        oDialog.open();
                    });
                } else {
                    that._oVHClientesDialog.open();
                }
            });
        },

        onVHClientesSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var aFilters = [];
            if (sValue) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("customer", FilterOperator.Contains, sValue),
                        new Filter("customername", FilterOperator.Contains, sValue),
                        new Filter("cityname", FilterOperator.Contains, sValue)
                    ],
                    and: false
                }));
            }
            oEvent.getSource().getBinding("items").filter(aFilters);
        },

        onVHClientesConfirm: function (oEvent) {
            var aItems = oEvent.getParameter("selectedItems");
            if (aItems && aItems.length) {
                var sValues = aItems.map(function (oItem) {
                    return oItem.getBindingContext("view").getProperty("customer");
                }).join(",");
                this.getView().getModel("view").setProperty("/params/kunnr", sValues);
            }
        },

        // ========== VALUE HELP PRODUTOS (Mater / Matnr / Matest) ==========

        onMaterInputValueHelpRequest: function () {
            this._sProdutoTargetField = "mater";
            this._openProdutosDialog();
        },

        onMatnrInputValueHelpRequest: function () {
            this._sProdutoTargetField = "matnr";
            this._openProdutosDialog();
        },

        onMatestInputValueHelpRequest: function () {
            this._sProdutoTargetField = "matest";
            this._openProdutosDialog();
        },

        _openProdutosDialog: function () {
            var oView = this.getView();
            var that = this;
            var aProdutos = oView.getModel("view").getProperty("/produtos") || [];

            Promise.resolve(aProdutos.length ? aProdutos : this._loadProdutos()).then(function () {
                if (!that._oVHProdutosDialog) {
                    Fragment.load({
                        id: oView.getId() + "-produtos",
                        name: "br.com.inbetta.zsdb2b.view.ValueHelpProdutos",
                        controller: that
                    }).then(function (oDialog) {
                        that._oVHProdutosDialog = oDialog;
                        oView.addDependent(oDialog);
                        oDialog.open();
                    });
                } else {
                    that._oVHProdutosDialog.open();
                }
            });
        },

        onVHProdutosSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var aFilters = [];
            if (sValue) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("product", FilterOperator.Contains, sValue),
                        new Filter("productname", FilterOperator.Contains, sValue)
                    ],
                    and: false
                }));
            }
            oEvent.getSource().getBinding("items").filter(aFilters);
        },

        onVHProdutosConfirm: function (oEvent) {
            var aItems = oEvent.getParameter("selectedItems");
            if (aItems && aItems.length) {
                var sValues = aItems.map(function (oItem) {
                    return oItem.getBindingContext("view").getProperty("product");
                }).join(",");
                this.getView().getModel("view").setProperty("/params/" + this._sProdutoTargetField, sValues);
            }
        },

        // ========== VALUE HELP BRANCH (NF) ==========

        onBranchInputValueHelpRequest: function () {
            var oView = this.getView();
            var that = this;
            var aBranches = oView.getModel("view").getProperty("/branches") || [];

            Promise.resolve(aBranches.length ? aBranches : this._loadBranches()).then(function () {
                if (!that._oVHBranchDialog) {
                    Fragment.load({
                        id: oView.getId() + "-branch",
                        name: "br.com.inbetta.zsdb2b.view.ValueHelpBranch",
                        controller: that
                    }).then(function (oDialog) {
                        that._oVHBranchDialog = oDialog;
                        oView.addDependent(oDialog);
                        oDialog.open();
                    });
                } else {
                    that._oVHBranchDialog.open();
                }
            });
        },

        onVHBranchSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var aFilters = [];
            if (sValue) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("branch", FilterOperator.Contains, sValue),
                        new Filter("name", FilterOperator.Contains, sValue)
                    ],
                    and: false
                }));
            }
            oEvent.getSource().getBinding("items").filter(aFilters);
        },

        onVHBranchConfirm: function (oEvent) {
            var aItems = oEvent.getParameter("selectedItems");
            if (aItems && aItems.length) {
                var sValues = aItems.map(function (oItem) {
                    return oItem.getBindingContext("view").getProperty("branch");
                }).join(",");
                this.getView().getModel("view").setProperty("/params/branch", sValues);
            }
        },

        // ========== EVENTOS PROCESSADORES ==========

        onTipoCargaChange: function (oEvent) {
            var sSelectedKey = oEvent.getParameter("item").getKey();
            this.getView().getModel("view").setProperty("/tipoCarga", sSelectedKey);
        },

        onProcessadorSelect: function () {
            this._atualizarTemSelecionado();
        },

        onSelecionarTodos: function () {
            var oModel = this.getView().getModel("view");
            var oProc = oModel.getProperty("/processadores");
            Object.keys(oProc).forEach(function (k) { oProc[k] = true; });
            oModel.setProperty("/processadores", Object.assign({}, oProc));
            this._atualizarTemSelecionado();
        },

        onDesmarcarTodos: function () {
            var oModel = this.getView().getModel("view");
            var oProc = oModel.getProperty("/processadores");
            Object.keys(oProc).forEach(function (k) { oProc[k] = false; });
            oModel.setProperty("/processadores", Object.assign({}, oProc));
            this._atualizarTemSelecionado();
        },

        // ========== EXECUTAR ==========

        onExecutar: function () {
            var oModel = this.getView().getModel("view");
            var sVkorg = oModel.getProperty("/vkorg");

            if (!sVkorg) {
                MessageBox.warning("Informe a Organizacao de Vendas.");
                return;
            }

            var aTipos = this._getTiposSelecionados();
            if (aTipos.length === 0) {
                MessageBox.warning("Selecione pelo menos um processador.");
                return;
            }

            var sMsg = "Executar " + aTipos.length + " processador(es)?\n\n" + aTipos.join(", ");
            var that = this;

            MessageBox.confirm(sMsg, {
                title: "Confirmar Execucao",
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that._executar(aTipos);
                    }
                }
            });
        },

        onLimpar: function () {
            this._initViewModel();
            this._loadOrgVendas();
            MessageToast.show("Filtros limpos!");
        },

        // ========== PRIVADOS ==========

        _executar: function (aTipos) {
            var oModel = this.getView().getModel("view");
            var oODataModel = this.getOwnerComponent().getModel();
            var oViewData = oModel.getData();
            var that = this;

            BusyIndicator.show(0);
            oModel.setProperty("/resultadoVisivel", false);

            var oPromise;

            if (aTipos.length === 1) {
                var oParams = ParamsBuilder.buildSingle(aTipos[0], oViewData);
                oPromise = ODataService.executarProcessador(oODataModel, oParams)
                    .then(function (aResults) {
                        that._processarResultadoUnico(aTipos[0], aResults);
                    });
            } else {
                var oParamsMulti = ParamsBuilder.buildMultiple(aTipos, oViewData);
                oPromise = ODataService.executarMultiplos(oODataModel, oParamsMulti)
                    .then(function (aResults) {
                        that._processarResultadoMultiplo(aResults);
                    });
            }

            oPromise
                .catch(function (oError) {
                    that._processarErro(oError);
                })
                .then(function () {
                    BusyIndicator.hide();
                });
        },

        _processarResultadoUnico: function (sTipo, aMessages) {
            var oModel = this.getView().getModel("view");

            if (!Array.isArray(aMessages)) {
                aMessages = [aMessages];
            }

            var bTemErro = aMessages.some(function (m) {
                return m.Type === "E";
            });

            var sMensagens = aMessages.map(function (m) {
                return m.Message || "";
            }).join(" | ");

            oModel.setProperty("/resultados", [{
                processor: sTipo,
                status: bTemErro ? "E" : "S",
                statusText: bTemErro ? "Erro" : "Sucesso",
                mensagem: sMensagens
            }]);
            oModel.setProperty("/resultadoVisivel", true);

            if (bTemErro) {
                MessageBox.error("Processamento concluido com erros.\n\n" + sMensagens);
            } else {
                MessageToast.show("Processamento concluido com sucesso!");
            }
        },

        _processarResultadoMultiplo: function (aItems) {
            var oModel = this.getView().getModel("view");

            if (!Array.isArray(aItems)) {
                aItems = [aItems];
            }

            var aResults = aItems.map(function (o) {
                return {
                    processor: o.Processor,
                    status: o.Status,
                    statusText: o.Status === "S" ? "Sucesso" : (o.Status === "E" ? "Erro" : "Aviso"),
                    mensagem: (o.QtdMessages || 0) + " mensagem(ns)"
                };
            });

            oModel.setProperty("/resultados", aResults);
            oModel.setProperty("/resultadoVisivel", true);

            var bTemErro = aResults.some(function (r) { return r.status === "E"; });
            if (bTemErro) {
                MessageBox.warning("Alguns processadores apresentaram erros.");
            } else {
                MessageToast.show("Todos os processadores executados com sucesso!");
            }
        },

        _processarErro: function (oError) {
            var sMsg = ODataService.extractErrorMessage(oError);
            MessageBox.error(sMsg);
        },

        _getTiposSelecionados: function () {
            var oModel = this.getView().getModel("view");
            var oProc = oModel.getProperty("/processadores");
            return Object.keys(oProc).filter(function (k) { return oProc[k]; });
        },

        _atualizarTemSelecionado: function () {
            var oModel = this.getView().getModel("view");
            oModel.setProperty("/temSelecionado", this._getTiposSelecionados().length > 0);
        }
    });
});
