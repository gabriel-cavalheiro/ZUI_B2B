sap.ui.define([], function () {
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
            return new Promise(function (resolve, reject) {
                oModel.read("/ZshOrgVendasSet", {
                    success: function (oData) {
                        var aItems = (oData.results || []).map(function (o) {
                            return { vkorg: o.Vkorg, vtext: o.Vtext };
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
            return new Promise(function (resolve, reject) {
                oModel.read("/YpmtlBranchSet", {
                    success: function (oData) {
                        var aItems = (oData.results || []).map(function (o) {
                            return { branch: o.Branch, name: o.Name, bukrs: o.Bukrs };
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
            return new Promise(function (resolve, reject) {
                oModel.read("/ZshClientesSet", {
                    success: function (oData) {
                        var aItems = (oData.results || []).map(function (o) {
                            return { customer: o.Customer, customername: o.Customername, cityname: o.Cityname };
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
            return new Promise(function (resolve, reject) {
                oModel.read("/ZshProdutosSet", {
                    success: function (oData) {
                        var aItems = (oData.results || []).map(function (o) {
                            return { product: o.Product, productname: o.Productname };
                        });
                        resolve(aItems);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
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
