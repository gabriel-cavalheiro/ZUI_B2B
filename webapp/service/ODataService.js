sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Filter, FilterOperator) {
    "use strict";

    return {

        /**
         * Executa um unico processador via Function Import do ODataModel
         */
        executarProcessador: function (oModel, oParams) {
            return this._callFunction(oModel, "/ExecutarProcessador", oParams);
        },

        executarMultiplos: function (oModel, oParams) {
            return this._callFunction(oModel, "/ExecutarMultiplos", oParams);
        },

        /**
         * Carrega lista de Org. de Vendas para o campo Vkorg
         */
        loadOrgVendas: function (oModel) {
            var that = this;
            return new Promise(function (resolve, reject) {
                oModel.read("/ZshOrgVendasSet", {
                    success: function (oData) {
                        var aItems = (oData.results || []).map(function (o) {
                            return Object.assign(that._toLowerCaseObject(o), { vkorg: o.Vkorg, vtext: o.Vtext });
                        });
                        resolve(aItems);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Carrega lista de Branches (para NF)
         */
        loadBranches: function (oModel) {
            var that = this;
            return new Promise(function (resolve, reject) {
                oModel.read("/YpmtlBranchSet", {
                    success: function (oData) {
                        var aItems = (oData.results || []).map(function (o) {
                            return Object.assign(that._toLowerCaseObject(o), { branch: o.Branch, name: o.Name, bukrs: o.Bukrs });
                        });
                        resolve(aItems);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Carrega lista de Clientes
         */
        loadClientes: function (oModel) {
            var that = this;
            return new Promise(function (resolve, reject) {
                oModel.read("/ZshClientesSet", {
                    success: function (oData) {
                        var aItems = (oData.results || []).map(function (o) {
                            return Object.assign(that._toLowerCaseObject(o), {
                                customer: o.Customer,
                                customername: o.Customername,
                                cityname: o.Cityname
                            });
                        });
                        resolve(aItems);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Carrega lista de Produtos/Materiais
         */
        loadProdutos: function (oModel) {
            var that = this;
            return new Promise(function (resolve, reject) {
                oModel.read("/ZshProdutosSet", {
                    success: function (oData) {
                        var aItems = (oData.results || []).map(function (o) {
                            return Object.assign(that._toLowerCaseObject(o), {
                                product: o.Product,
                                productname: o.Productname
                            });
                        });
                        resolve(aItems);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Busca produtos no backend (server-side) para evitar carregar todo o dataset no VH
         */
        searchProdutos: function (oModel, oCriteria) {
            var that = this;
            var sSearch = ((oCriteria && oCriteria.search) || "").trim();
            var iTop = (oCriteria && oCriteria.top) || 200;

            if (!sSearch) {
                return Promise.resolve([]);
            }

            return new Promise(function (resolve, reject) {
                var aFilters = [new Filter({
                    filters: [
                        new Filter("Product", FilterOperator.Contains, sSearch),
                        new Filter("Productname", FilterOperator.Contains, sSearch)
                    ],
                    and: false
                })];

                oModel.read("/ZshProdutosSet", {
                    filters: aFilters,
                    urlParameters: {
                        "$top": String(iTop)
                    },
                    success: function (oData) {
                        var aItems = (oData.results || []).map(function (o) {
                            return Object.assign(that._toLowerCaseObject(o), {
                                product: o.Product,
                                productname: o.Productname
                            });
                        });
                        resolve(aItems);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },

        _toLowerCaseObject: function (oData) {
            var oResult = {};
            Object.keys(oData || {}).forEach(function (sKey) {
                var sLower = sKey.charAt(0).toLowerCase() + sKey.slice(1);
                oResult[sLower] = oData[sKey];
            });
            return oResult;
        },

        _callFunction: function (oModel, sFunctionName, oParams) {
            return new Promise(function (resolve, reject) {
                oModel.callFunction(sFunctionName, {
                    method: "GET",
                    urlParameters: oParams,
                    success: function (oData) {
                        resolve((oData && (oData.results || oData)) || []);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },

        /**
         * Extrai mensagem de erro do OData
         */
        extractErrorMessage: function (oError) {
            try {
                if (oError.responseText) {
                    var oParsed = JSON.parse(oError.responseText);
                    if (oParsed.error && oParsed.error.message) {
                        return oParsed.error.message.value || oParsed.error.message;
                    }
                }
            } catch (e) { /* ignore */ }
            return oError.message || "Erro desconhecido ao processar.";
        }
    };
});
