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
            this._oVHPltypDialog = null;
            this._oVHGruopDialog = null;
            this._oVHShipfDialog = null;
            this._oVHShiptDialog = null;
            this._sProdutoTargetField = null;
            this._iMinProdutoSearchChars = 3;
            this._iMaxProdutosVH = 100;
            this._oProdutosVHState = {
                term: "",
                skip: 0,
                hasMore: false,
                loading: false,
                requestToken: 0
            };
            this._mVHFilterConfig = {
                clientes: {
                    collectionPath: "/clientes",
                    searchFields: ["customer", "customername", "cityname"],
                    additionalBindings: [
                        { sourcePath: "/vkorg", targetCandidates: ["vkorg", "salesorg"] }
                    ]
                },
                produtos: {
                    collectionPath: "/produtos",
                    searchFields: ["product", "productname"],
                    additionalBindings: [
                        { sourcePath: "/vkorg", targetCandidates: ["vkorg", "salesorg"] },
                        { sourcePath: "/params/vtweg", targetCandidates: ["vtweg"] },
                        { sourcePath: "/params/werks", targetCandidates: ["werks"] },
                        { sourcePath: "/params/mtart", targetCandidates: ["mtart"] }
                    ]
                },
                branch: {
                    collectionPath: "/branches",
                    searchFields: ["branch", "name"],
                    additionalBindings: [
                        { sourcePath: "/vkorg", targetCandidates: ["vkorg", "bukrs"] }
                    ]
                },
                pltyp: {
                    collectionPath: "/priceListTypes",
                    searchFields: ["pricelisttype", "pricelisttypename"],
                    additionalBindings: []
                },
                gruop: {
                    collectionPath: "/groups",
                    searchFields: ["gruop"],
                    additionalBindings: []
                },
                shipf: {
                    collectionPath: "/shipFromOptions",
                    searchFields: ["shipfrom"],
                    additionalBindings: []
                },
                shipt: {
                    collectionPath: "/shipToOptions",
                    searchFields: ["shipto", "shipfrom"],
                    additionalBindings: [
                        { sourcePath: "/params/shipf", targetCandidates: ["shipfrom"] },
                        { sourcePath: "/params/gruop", targetCandidates: ["gruop", "group"] }
                    ]
                }
            };
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
                produtos: [],
                priceListTypes: [],
                groups: [],
                shipIcms: [],
                shipFromOptions: [],
                shipToOptions: []
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

        _loadPriceListTypes: function () {
            var that = this;
            var oODataModel = this.getOwnerComponent().getModel();
            return ODataService.loadPriceListTypes(oODataModel).then(function (aItems) {
                that.getView().getModel("view").setProperty("/priceListTypes", aItems);
                return aItems;
            }).catch(function () {
                return [];
            });
        },

        _loadGroups: function () {
            var that = this;
            var oODataModel = this.getOwnerComponent().getModel();
            return ODataService.loadGroups(oODataModel).then(function (aItems) {
                that.getView().getModel("view").setProperty("/groups", aItems);
                return aItems;
            }).catch(function () {
                return [];
            });
        },

        _loadShipIcms: function () {
            var that = this;
            var oODataModel = this.getOwnerComponent().getModel();
            return ODataService.loadShipIcms(oODataModel).then(function (aItems) {
                var oViewModel = that.getView().getModel("view");
                oViewModel.setProperty("/shipIcms", aItems);
                that._setShipOptionCollections(aItems);
                return aItems;
            }).catch(function () {
                that.getView().getModel("view").setProperty("/shipIcms", []);
                that._setShipOptionCollections([]);
                return [];
            });
        },

        _setShipOptionCollections: function (aItems) {
            var mShipFrom = Object.create(null);
            var mShipTo = Object.create(null);
            var aShipFromOptions = [];
            var aShipToOptions = [];

            (aItems || []).forEach(function (oItem) {
                var sShipFrom = (oItem.shipfrom || "").trim();
                var sShipTo = (oItem.shipto || "").trim();
                var sGruop = (oItem.gruop || "").trim();
                var sLand1 = (oItem.land1 || "").trim();

                if (sShipFrom && !mShipFrom[sShipFrom]) {
                    mShipFrom[sShipFrom] = true;
                    aShipFromOptions.push({
                        shipfrom: sShipFrom
                    });
                }

                if (!sShipFrom || !sShipTo) {
                    return;
                }

                var sShipToKey = sShipFrom + "|" + sShipTo;
                if (mShipTo[sShipToKey]) {
                    return;
                }

                mShipTo[sShipToKey] = true;
                aShipToOptions.push({
                    shipfrom: sShipFrom,
                    shipto: sShipTo,
                    gruop: sGruop,
                    land1: sLand1
                });
            });

            aShipFromOptions.sort(function (a, b) {
                return a.shipfrom.localeCompare(b.shipfrom);
            });
            aShipToOptions.sort(function (a, b) {
                var iByShipTo = a.shipto.localeCompare(b.shipto);
                return iByShipTo !== 0 ? iByShipTo : a.shipfrom.localeCompare(b.shipfrom);
            });

            var oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/shipFromOptions", aShipFromOptions);
            oViewModel.setProperty("/shipToOptions", aShipToOptions);
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

        _applyValueHelpFilters: function (oDialog, sConfigKey, sSearchValue) {
            var mCfg = this._mVHFilterConfig[sConfigKey];
            if (!mCfg) {
                return;
            }

            var oBinding = oDialog.getBinding("items");
            if (!oBinding) {
                return;
            }

            var aFilters = [];
            var oSearchFilter = this._buildSearchFilter(mCfg.searchFields, sSearchValue);
            var oAdditionalFilter = this._buildAdditionalBindingFilter(
                mCfg.collectionPath,
                mCfg.additionalBindings
            );

            if (oAdditionalFilter) {
                aFilters.push(oAdditionalFilter);
            }
            if (oSearchFilter) {
                aFilters.push(oSearchFilter);
            }

            if (!aFilters.length) {
                oBinding.filter([]);
                return;
            }

            oBinding.filter(aFilters.length === 1 ? aFilters[0] : new Filter({
                filters: aFilters,
                and: true
            }));
        },

        _buildSearchFilter: function (aFields, sSearchValue) {
            if (!sSearchValue) {
                return null;
            }
            return new Filter({
                filters: aFields.map(function (sField) {
                    return new Filter(sField, FilterOperator.Contains, sSearchValue);
                }),
                and: false
            });
        },

        _buildAdditionalBindingFilter: function (sCollectionPath, aBindings) {
            var oViewModel = this.getView().getModel("view");
            var aItems = oViewModel.getProperty(sCollectionPath) || [];
            var aFilters = [];

            (aBindings || []).forEach(function (oBinding) {
                var sSource = oViewModel.getProperty(oBinding.sourcePath);
                var aValues = (sSource || "").toString().split(",").map(function (sValue) {
                    return sValue.trim();
                }).filter(Boolean);
                if (!aValues.length) {
                    return;
                }

                var sTarget = this._resolveTargetProperty(aItems, oBinding.targetCandidates);
                if (!sTarget) {
                    return;
                }

                if (aValues.length === 1) {
                    aFilters.push(new Filter(sTarget, FilterOperator.EQ, aValues[0]));
                    return;
                }

                aFilters.push(new Filter({
                    filters: aValues.map(function (sValue) {
                        return new Filter(sTarget, FilterOperator.EQ, sValue);
                    }),
                    and: false
                }));
            }.bind(this));

            if (!aFilters.length) {
                return null;
            }

            return new Filter({
                filters: aFilters,
                and: true
            });
        },

        _resolveTargetProperty: function (aItems, aCandidates) {
            if (!aItems.length) {
                return null;
            }

            for (var i = 0; i < aCandidates.length; i++) {
                var sCandidate = aCandidates[i];
                var bHasValue = aItems.some(function (oItem) {
                    if (!Object.prototype.hasOwnProperty.call(oItem, sCandidate)) {
                        return false;
                    }
                    var vValue = oItem[sCandidate];
                    if (vValue === null || vValue === undefined) {
                        return false;
                    }
                    return String(vValue).trim() !== "";
                });
                if (bHasValue) {
                    return sCandidate;
                }
            }

            return null;
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
                        that._applyValueHelpFilters(oDialog, "clientes", "");
                        oDialog.open();
                    });
                } else {
                    that._applyValueHelpFilters(that._oVHClientesDialog, "clientes", "");
                    that._oVHClientesDialog.open();
                }
            });
        },

        onVHClientesSearch: function (oEvent) {
            this._applyValueHelpFilters(oEvent.getSource(), "clientes", oEvent.getParameter("value"));
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

        // ========== VALUE HELP PLTYP ==========

        onPltypInputValueHelpRequest: function () {
            var oView = this.getView();
            var that = this;
            var aTypes = oView.getModel("view").getProperty("/priceListTypes") || [];

            Promise.resolve(aTypes.length ? aTypes : this._loadPriceListTypes()).then(function () {
                if (!that._oVHPltypDialog) {
                    Fragment.load({
                        id: oView.getId() + "-pltyp",
                        name: "br.com.inbetta.zsdb2b.view.ValueHelpPltyp",
                        controller: that
                    }).then(function (oDialog) {
                        that._oVHPltypDialog = oDialog;
                        oView.addDependent(oDialog);
                        that._applyValueHelpFilters(oDialog, "pltyp", "");
                        oDialog.open();
                    });
                } else {
                    that._applyValueHelpFilters(that._oVHPltypDialog, "pltyp", "");
                    that._oVHPltypDialog.open();
                }
            });
        },

        onVHPltypSearch: function (oEvent) {
            this._applyValueHelpFilters(oEvent.getSource(), "pltyp", oEvent.getParameter("value"));
        },

        onVHPltypConfirm: function (oEvent) {
            var aItems = oEvent.getParameter("selectedItems");
            if (aItems && aItems.length) {
                var sValues = aItems.map(function (oItem) {
                    return oItem.getBindingContext("view").getProperty("pricelisttype");
                }).join(",");
                this.getView().getModel("view").setProperty("/params/pltyp", sValues);
            }
        },

        // ========== VALUE HELP GRUOP ==========

        onGruopInputValueHelpRequest: function () {
            var oView = this.getView();
            var that = this;
            var aGroups = oView.getModel("view").getProperty("/groups") || [];

            Promise.resolve(aGroups.length ? aGroups : this._loadGroups()).then(function () {
                if (!that._oVHGruopDialog) {
                    Fragment.load({
                        id: oView.getId() + "-gruop",
                        name: "br.com.inbetta.zsdb2b.view.ValueHelpGruop",
                        controller: that
                    }).then(function (oDialog) {
                        that._oVHGruopDialog = oDialog;
                        oView.addDependent(oDialog);
                        that._applyValueHelpFilters(oDialog, "gruop", "");
                        oDialog.open();
                    });
                } else {
                    that._applyValueHelpFilters(that._oVHGruopDialog, "gruop", "");
                    that._oVHGruopDialog.open();
                }
            });
        },

        onVHGruopSearch: function (oEvent) {
            this._applyValueHelpFilters(oEvent.getSource(), "gruop", oEvent.getParameter("value"));
        },

        onVHGruopConfirm: function (oEvent) {
            var aItems = oEvent.getParameter("selectedItems");
            if (aItems && aItems.length) {
                var sValues = aItems.map(function (oItem) {
                    return oItem.getBindingContext("view").getProperty("gruop");
                }).join(",");
                this.getView().getModel("view").setProperty("/params/gruop", sValues);
            }
        },

        // ========== VALUE HELP SHIP FROM / SHIP TO ==========

        onShipfInputValueHelpRequest: function () {
            var oView = this.getView();
            var that = this;
            var aShipFromOptions = oView.getModel("view").getProperty("/shipFromOptions") || [];

            Promise.resolve(aShipFromOptions.length ? aShipFromOptions : this._loadShipIcms()).then(function () {
                if (!that._oVHShipfDialog) {
                    Fragment.load({
                        id: oView.getId() + "-shipf",
                        name: "br.com.inbetta.zsdb2b.view.ValueHelpShipf",
                        controller: that
                    }).then(function (oDialog) {
                        that._oVHShipfDialog = oDialog;
                        oView.addDependent(oDialog);
                        that._applyValueHelpFilters(oDialog, "shipf", "");
                        oDialog.open();
                    });
                } else {
                    that._applyValueHelpFilters(that._oVHShipfDialog, "shipf", "");
                    that._oVHShipfDialog.open();
                }
            });
        },

        onVHShipfSearch: function (oEvent) {
            this._applyValueHelpFilters(oEvent.getSource(), "shipf", oEvent.getParameter("value"));
        },

        onVHShipfConfirm: function (oEvent) {
            var aItems = oEvent.getParameter("selectedItems") || [];
            if (aItems.length) {
                var aShipFrom = [];
                aItems.forEach(function (oItem) {
                    var sValue = oItem.getBindingContext("view").getProperty("shipfrom");
                    if (sValue && aShipFrom.indexOf(sValue) === -1) {
                        aShipFrom.push(sValue);
                    }
                });
                this.getView().getModel("view").setProperty("/params/shipf", aShipFrom.join(","));
            }
        },

        onShiptInputValueHelpRequest: function () {
            var oView = this.getView();
            var that = this;
            var aShipToOptions = oView.getModel("view").getProperty("/shipToOptions") || [];

            Promise.resolve(aShipToOptions.length ? aShipToOptions : this._loadShipIcms()).then(function () {
                if (!that._oVHShiptDialog) {
                    Fragment.load({
                        id: oView.getId() + "-shipt",
                        name: "br.com.inbetta.zsdb2b.view.ValueHelpShipt",
                        controller: that
                    }).then(function (oDialog) {
                        that._oVHShiptDialog = oDialog;
                        oView.addDependent(oDialog);
                        that._applyValueHelpFilters(oDialog, "shipt", "");
                        oDialog.open();
                    });
                } else {
                    that._applyValueHelpFilters(that._oVHShiptDialog, "shipt", "");
                    that._oVHShiptDialog.open();
                }
            });
        },

        onVHShiptSearch: function (oEvent) {
            this._applyValueHelpFilters(oEvent.getSource(), "shipt", oEvent.getParameter("value"));
        },

        onVHShiptConfirm: function (oEvent) {
            var aItems = oEvent.getParameter("selectedItems") || [];
            if (aItems.length) {
                var aShipTo = [];
                aItems.forEach(function (oItem) {
                    var sValue = oItem.getBindingContext("view").getProperty("shipto");
                    if (sValue && aShipTo.indexOf(sValue) === -1) {
                        aShipTo.push(sValue);
                    }
                });
                this.getView().getModel("view").setProperty("/params/shipt", aShipTo.join(","));
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
            oView.getModel("view").setProperty("/produtos", []);
            this._oProdutosVHState.term = "";
            this._oProdutosVHState.skip = 0;
            this._oProdutosVHState.hasMore = false;
            this._oProdutosVHState.loading = false;
            this._oProdutosVHState.requestToken = 0;

            if (!this._oVHProdutosDialog) {
                Fragment.load({
                    id: oView.getId() + "-produtos",
                    name: "br.com.inbetta.zsdb2b.view.ValueHelpProdutos",
                    controller: this
                }).then(function (oDialog) {
                    that._oVHProdutosDialog = oDialog;
                    oView.addDependent(oDialog);
                    oDialog.setNoDataText("Digite ao menos " + that._iMinProdutoSearchChars + " caracteres e pesquise.");
                    oDialog.open();
                });
            } else {
                this._oVHProdutosDialog.setNoDataText("Digite ao menos " + this._iMinProdutoSearchChars + " caracteres e pesquise.");
                this._oVHProdutosDialog.open();
            }
        },

        onVHProdutosSearch: function (oEvent) {
            this._searchProdutosValueHelp(oEvent.getParameter("value"));
        },

        _searchProdutosValueHelp: function (sSearchValue) {
            var sTerm = (sSearchValue || "").trim();
            var oViewModel = this.getView().getModel("view");
            var oDialog = this._oVHProdutosDialog;
            var oState = this._oProdutosVHState;

            if (sTerm.length < this._iMinProdutoSearchChars) {
                oViewModel.setProperty("/produtos", []);
                if (oDialog) {
                    oDialog.setNoDataText("Digite ao menos " + this._iMinProdutoSearchChars + " caracteres e pesquise.");
                }
                oState.term = "";
                oState.skip = 0;
                oState.hasMore = false;
                return;
            }

            if (oState.loading) {
                return;
            }

            var bLoadNextPage = (sTerm === oState.term && oState.hasMore);

            if (!bLoadNextPage) {
                oState.term = sTerm;
                oState.skip = 0;
                oState.hasMore = false;
                oViewModel.setProperty("/produtos", []);
            }

            var iRequestToken = ++oState.requestToken;
            oState.loading = true;

            var oCriteria = {
                search: sTerm,
                top: this._iMaxProdutosVH,
                skip: oState.skip,
                vkorg: oViewModel.getProperty("/vkorg"),
                vtweg: oViewModel.getProperty("/params/vtweg"),
                werks: oViewModel.getProperty("/params/werks"),
                mtart: oViewModel.getProperty("/params/mtart")
            };

            if (oDialog) {
                oDialog.setBusy(true);
            }

            ODataService.searchProdutos(this.getOwnerComponent().getModel(), oCriteria)
                .then(function (oResult) {
                    if (iRequestToken !== oState.requestToken) {
                        return;
                    }

                    var aItems = Array.isArray(oResult) ? oResult : (oResult.items || []);
                    var iReturned = Array.isArray(oResult) ? aItems.length : (oResult.pageSize || 0);
                    var aCurrent = bLoadNextPage ? (oViewModel.getProperty("/produtos") || []) : [];
                    var aCombined = bLoadNextPage ? aCurrent.concat(aItems) : aItems;
                    oViewModel.setProperty("/produtos", aCombined);

                    oState.skip += iReturned;
                    oState.hasMore = iReturned === this._iMaxProdutosVH;

                    if (oDialog) {
                        if (!aCombined.length) {
                            oDialog.setNoDataText("Nenhum material encontrado para o termo informado.");
                        } else if (oState.hasMore) {
                            oDialog.setNoDataText("Há mais resultados. Pesquise novamente o mesmo termo para carregar mais.");
                        } else {
                            oDialog.setNoDataText("Fim dos resultados para o termo informado.");
                        }
                    }
                }.bind(this))
                .catch(function (oError) {
                    if (iRequestToken !== oState.requestToken) {
                        return;
                    }
                    oViewModel.setProperty("/produtos", []);
                    oState.skip = 0;
                    oState.hasMore = false;
                    MessageBox.error(ODataService.extractErrorMessage(oError));
                })
                .then(function () {
                    if (iRequestToken === oState.requestToken) {
                        oState.loading = false;
                        if (oDialog) {
                            oDialog.setBusy(false);
                        }
                    }
                });
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
                        that._applyValueHelpFilters(oDialog, "branch", "");
                        oDialog.open();
                    });
                } else {
                    that._applyValueHelpFilters(that._oVHBranchDialog, "branch", "");
                    that._oVHBranchDialog.open();
                }
            });
        },

        onVHBranchSearch: function (oEvent) {
            this._applyValueHelpFilters(oEvent.getSource(), "branch", oEvent.getParameter("value"));
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
