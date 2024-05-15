importPackage(Packages.de.elo.ix.client);
importPackage(Packages.de.elo.ix.jscript);
importPackage(Packages.de.elo.ix.scripting);
importPackage(Packages.java.lang);
importPackage(Packages.java.util);

//@include lib_Country.js

function getDataIterator() {
    return new DynamicKeywordDataProvider(new CountiesList());
}

function getCounties() {
    try {
        var any = new Any();
        var resultJson = ixConnect.ix().executeRegisteredFunction("RF_getCountiesByCountryName", any);
        var result = JSON.parse(resultJson);
        if (result.error) {
            throw new Error(result.error);
        }
        log.info("dkl_Counties result: " + result);
        log.info("dkl_Counties data: " + result.data);

        var counties = result.data;
        return counties;
    } catch (ex) {
        log.error("dkl_Counties error: " + ex);
    }
}

function CountiesList() {
    this.index = 0;
    this.resultset = [];
    this.focusName = "";

    this.openMap = function (ec, data, focusName) {
        try {
            this.focusName = focusName;
            this.resultset = getCounties();
            log.info("CountiesList openMap method counties:" + this.resultset);
        } catch (ex) {
            log.error("CountiesList openMap method error: " + ex.message);
        }
    };

    this.close = function () { };

    this.getNextRow = function () {
        try {
            var row = this.resultset[this.index++].name;
        } catch (ex) {
            log.error("CountiesList getNextRow method error: " + ex.message);
        }

        return [row];
    };

    this.getHeader = function () {
        return ["Judet/ Sector"];
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
        return "Judet/ Sector";
    };
}