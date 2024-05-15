importPackage(Packages.de.elo.ix.client);
importPackage(Packages.de.elo.ix.jscript);
importPackage(Packages.de.elo.ix.scripting);
importPackage(Packages.java.lang);
importPackage(Packages.java.util);

//@include lib_Class.js
//@include lib_sol.common.IxUtils.js
//@include lib_sol.common.RepoUtils.js

function getDataIterator() {
    return new DynamicKeywordDataProvider(new RejectionReasonList());
}

function getObjectFromSelfCareConfig(propertyName) {
    var cfgObj = sol.common.IxUtils.execute('RF_sol_common_service_GetConfigHierarchy', {
        compose: "/cec.selfCare/Configuration/selfCare.config",
        content: true,  //optional, if not set, or none `true` value, only GUIDs will be returned
        forceReload: true  // optional, if true, the cache will be refreshed
    });

    var currentConfig = cfgObj.defaultConfig;

    if (cfgObj.customConfigs && cfgObj.customConfigs[0] && cfgObj.customConfigs[0].content[propertyName]) {
        currentConfig = cfgObj.customConfigs[0];
    }

    return currentConfig.content[propertyName];
}

function RejectionReasonList() {
    this.index = 0;
    this.resultset = [];
    this.focusName = "";

    this.openMap = function (ec, data, focusName) {
        try {
            this.focusName = focusName;
            this.resultset = getObjectFromSelfCareConfig("FORM").REJECTION_REASON_LIST;
            log.info("RejectionReasonList openMap method resultset:" + this.resultset);
        } catch (ex) {
            log.error("RejectionReasonList openMap method error: " + ex.message);
        }
    };

    this.close = function () { };

    this.getNextRow = function () {
        try {
            var row = this.resultset[this.index++];
        } catch (ex) {
            log.error("RejectionReasonList getNextRow method error: " + ex.message);
        }

        return [row];
    };

    this.getHeader = function () {
        return ["Motivul respingerii"];
    };

    this.getKeyNames = function () {
        return [this.focusName];
    };

    this.hasMoreRows = function () {
        return (this.index < this.resultset.length);
    };

    this.getMessage = function () {
        return "";
    };

    this.getTitle = function () {
        return "Motivul respingerii";
    };
}