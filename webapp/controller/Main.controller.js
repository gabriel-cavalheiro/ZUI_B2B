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
            this._initViewModel();
            this._loadBranches();
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
                    datum: "", pltyp: "", mater: "",
                    datimp: "", icms: true, ipi: true, st: false,
                    gruop: "", shipf: "", shipt: "",
                    positivados: true, rejeitados: false, kunnr: "", erdatk: "",
                    matnr: "", vtweg: "", werks: "", mtart: "", lgort: "",
                    matest: "",
                    branch: "", credat: "",
                    erdat: "", vbeln: "",
                    datbi: "", ztag1: ""
                },
                temSelecionado: false,
                resultadoVisivel: false,
                resultados: [],
                branches: []
            });
            this.getView().setModel(oViewModel, "view");
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

        // ========== VALUE HELP VKORG ==========

        onValueHelpVkorg: function () {
            var oView = this.getView();
            var aBranches = oView.getModel("view").getProperty("/branches") || [];
            var that = this;

            Promise.resolve(aBranches.length ? aBranches : this._loadBranches()).then(function () {
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

        onVHVkorgSearch: function (oEvent) {
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

        onVHVkorgConfirm: function (oEvent) {
            var oItem = oEvent.getParameter("selectedItem");
            if (oItem) {
                var sBranch = oItem.getBindingContext("view").getProperty("branch");
                this.getView().getModel("view").setProperty("/vkorg", sBranch);
            }
        },

        onVkorgSuggestionSelected: function (oEvent) {
            var oItem = oEvent.getParameter("selectedItem");
            if (oItem) {
                this.getView().getModel("view").setProperty("/vkorg", oItem.getKey());
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
            this._loadBranches();
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
