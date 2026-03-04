sap.ui.define([], function () {
    "use strict";

    /**
     * Monta os parâmetros para as Function Imports
     * a partir do view model
     */
    return {

        /**
         * Monta parâmetros para ExecutarProcessador
         * @param {string} sTipo - tipo do processador
         * @param {object} oViewData - dados do view model
         * @returns {object} parâmetros para a Function Import
         */
        buildSingle: function (sTipo, oViewData) {
            var oParams = {
                Tipo: sTipo,
                CargaInicial: oViewData.tipoCarga === "INICIAL",
                Vkorg: oViewData.vkorg || ""
            };

            this._addCommonParams(oParams, oViewData.params);
            return this._cleanParams(oParams);
        },

        /**
         * Monta parâmetros para ExecutarMultiplos
         * @param {string[]} aTipos - array de tipos selecionados
         * @param {object} oViewData - dados do view model
         * @returns {object} parâmetros para a Function Import
         */
        buildMultiple: function (aTipos, oViewData) {
            var oParams = {
                Tipos: aTipos.join(","),
                CargaInicial: oViewData.tipoCarga === "INICIAL",
                Vkorg: oViewData.vkorg || ""
            };

            this._addCommonParams(oParams, oViewData.params);
            return this._cleanParams(oParams);
        },

        /**
         * Adiciona parâmetros comuns de todos os processadores
         * @private
         */
        _addCommonParams: function (oParams, p) {
            if (!p) { return; }

            // Lista de Preço
            if (p.datum) { oParams.Datum = p.datum; }
            if (p.pltyp) { oParams.Pltyp = p.pltyp; }
            if (p.mater) { oParams.Mater = p.mater; }

            // Impostos
            if (p.datimp) { oParams.Datimp = p.datimp; }
            oParams.Icms = !!p.icms;
            oParams.Ipi = !!p.ipi;
            oParams.ST = !!p.st;
            if (p.gruop) { oParams.Gruop = p.gruop; }
            if (p.shipf) { oParams.Shipf = p.shipf; }
            if (p.shipt) { oParams.Shipt = p.shipt; }

            // Clientes
            oParams.Positivados = !!p.positivados;
            oParams.Rejeitados = !!p.rejeitados;
            if (p.kunnr) { oParams.Kunnr = p.kunnr; }
            if (p.erdatk) { oParams.Erdatk = p.erdatk; }

            // Produtos
            if (p.matnr) { oParams.Matnr = p.matnr; }
            if (p.vtweg) { oParams.Vtweg = p.vtweg; }
            if (p.werks) { oParams.Werks = p.werks; }
            if (p.mtart) { oParams.Mtart = p.mtart; }
            if (p.lgort) { oParams.Lgort = p.lgort; }

            // Estoque
            if (p.matest) { oParams.Matest = p.matest; }

            // NF
            if (p.branch) { oParams.Branch = p.branch; }
            if (p.credat) { oParams.Credat = p.credat; }

            // OV
            if (p.erdat) { oParams.Erdat = p.erdat; }
            if (p.vbeln) { oParams.Vbeln = p.vbeln; }

            // Segmento
            if (p.datbi) { oParams.Datbi = p.datbi; }
            if (p.ztag1) { oParams.Ztag1 = p.ztag1; }
        },

        /**
         * Remove parâmetros vazios/undefined
         * @private
         */
        _cleanParams: function (oParams) {
            var oClean = {};
            Object.keys(oParams).forEach(function (sKey) {
                var val = oParams[sKey];
                if (val !== undefined && val !== null && val !== "") {
                    oClean[sKey] = val;
                }
            });
            return oClean;
        }
    };
});
