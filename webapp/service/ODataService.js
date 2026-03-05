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
            var that = this;
            return new Promise(function (resolve, reject) {
                oModel.read("/ZshOrgVendasSet", {
                    success: function (oData) {
                        var aItems = (oData.results || []).map(function (o) {
                            var oLower = that._toLowerCaseObject(o);
                            var sVkorg = o.Vkorg || o.Salesorganization || oLower.salesorganization || "";
                            var sVtext = o.Vtext || o.Salesorganizationname || oLower.salesorganizationname || "";
                            return Object.assign(oLower, { vkorg: sVkorg, vtext: sVtext });
                        }).filter(function (oItem) {
                            return !!oItem.vkorg;
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
            var sSearch = (((oCriteria && oCriteria.search) || "").trim()).toLowerCase();
            var iTop = (oCriteria && oCriteria.top) || 200;
            var iSkip = (oCriteria && oCriteria.skip) || 0;
            var sVkorg = ((oCriteria && oCriteria.vkorg) || "").trim();
            var sVtweg = ((oCriteria && oCriteria.vtweg) || "").trim();
            var sWerks = ((oCriteria && oCriteria.werks) || "").trim();
            var sMtart = ((oCriteria && oCriteria.mtart) || "").trim();

            return new Promise(function (resolve, reject) {
                oModel.read("/ZshProdutosSet", {
                    urlParameters: {
                        "$top": String(iTop),
                        "$skip": String(iSkip)
                    },
                    success: function (oData) {
                        var aRawItems = (oData.results || []).map(function (o) {
                            return Object.assign(that._toLowerCaseObject(o), {
                                product: o.Product,
                                productname: o.Productname
                            });
                        });

                        var aItems = aRawItems.filter(function (oItem) {
                            var sProduct = String(oItem.product || "").toLowerCase();
                            var sProductName = String(oItem.productname || "").toLowerCase();
                            var bTermOk = !sSearch || sProduct.indexOf(sSearch) > -1 || sProductName.indexOf(sSearch) > -1;

                            var sItemVkorg = String(oItem.vkorg || oItem.salesorg || "").trim();
                            var sItemVtweg = String(oItem.vtweg || "").trim();
                            var sItemWerks = String(oItem.werks || "").trim();
                            var sItemMtart = String(oItem.mtart || "").trim();

                            var bVkorgOk = !sVkorg || !sItemVkorg || sItemVkorg === sVkorg;
                            var bVtwegOk = !sVtweg || !sItemVtweg || sItemVtweg === sVtweg;
                            var bWerksOk = !sWerks || !sItemWerks || sItemWerks === sWerks;
                            var bMtartOk = !sMtart || !sItemMtart || sItemMtart === sMtart;

                            return bTermOk && bVkorgOk && bVtwegOk && bWerksOk && bMtartOk;
                        });

                        resolve({
                            items: aItems,
                            pageSize: aRawItems.length
                        });
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
