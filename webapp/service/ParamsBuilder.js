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
         * Extrai a data inicial de um range "YYYYMMDD - YYYYMMDD"
         * @private
         */
        _rangeFrom: function (sRange) {
            if (!sRange) { return ""; }
            return sRange.split(" - ")[0] || "";
        },

        /**
         * Extrai as duas datas de um range como CSV "YYYYMMDD,YYYYMMDD"
         * @private
         */
        _rangeToCsv: function (sRange) {
            if (!sRange) { return ""; }
            var aParts = sRange.split(" - ");
            if (aParts.length === 2 && aParts[1]) {
                return aParts[0] + "," + aParts[1];
            }
            return aParts[0] || "";
        },

        /**
         * Converte um range "YYYYMMDD - YYYYMMDD" para o formato "YYYYMMDD:YYYYMMDD"
         * aceito pelo handler ABAP como intervalo BT.
         * Se apenas uma data, retorna "YYYYMMDD" (EQ).
         * @private
         */
        _rangeToInterval: function (sRange) {
            if (!sRange) { return ""; }
            var aParts = sRange.split(" - ");
            if (aParts.length === 2 && aParts[1]) {
                return aParts[0] + ":" + aParts[1];
            }
            return aParts[0] || "";
        },

        /**
         * Adiciona parâmetros comuns de todos os processadores
         * @private
         */
        _addCommonParams: function (oParams, p) {
            if (!p) { return; }

            // Lista de Preço
            if (p.datumRange) { oParams.Datum = this._rangeFrom(p.datumRange); }
            if (p.pltyp) { oParams.Pltyp = p.pltyp; }
            if (p.mater) { oParams.Mater = p.mater; }

            // Impostos
            if (p.datimpRange) { oParams.Datimp = this._rangeFrom(p.datimpRange); }
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
            if (p.erdatkRange) { oParams.Erdatk = this._rangeToCsv(p.erdatkRange); }

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
            if (p.cRedatRange) { oParams.Credat = this._rangeToCsv(p.cRedatRange); }

            // OV
            if (p.erdatRange) { oParams.Erdat = this._rangeToCsv(p.erdatRange); }
            if (p.vbeln) { oParams.Vbeln = p.vbeln; }

            // Data Incremental (s_dtincr) — usada por NF, Lista de Preço, Estoque, Impostos
            // Formato enviado: "YYYYMMDD:YYYYMMDD" (intervalo BT) ou "YYYYMMDD" (dia único)
            if (p.dtincrRange) { oParams.Dtincr = this._rangeToInterval(p.dtincrRange); }

            // Segmento
            if (p.datbiRange) { oParams.Datbi = this._rangeFrom(p.datbiRange); }
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