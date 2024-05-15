importPackage(Packages.de.elo.ix.client);
importPackage(Packages.de.elo.ix.jscript);
importPackage(Packages.de.elo.ix.scripting);
importPackage(Packages.java.lang);
importPackage(Packages.java.util);

//@include lib_Country.js
//@include lib_sord.js

function getDataIterator() {
    return new DynamicKeywordDataProvider(new CitiesList());
}

function getCities(countyName) {
    try {
        var params = {};
        params.countyName = countyName;

        var anyToObject = new AnyToObject();

        var paramsAny = anyToObject.fromObject(JSON.stringify(params));
        var any = new Any(paramsAny);

        var resultJson = ixConnect.ix().executeRegisteredFunction("RF_getCitiesByCountyName", any);
        var result = JSON.parse(resultJson);
        if (result.error) {
            throw new Error(result.error);
        }
        log.info("dkl_Cities result: " + result);
        log.info("dkl_Cities data: " + result.data);

        var cities = result.data;
        return cities;
    } catch (ex) {
        log.error("dkl_Cities error: " + ex);
    }
}

function CitiesList() {
    this.index = 0;
    this.countyName = "";
    this.resultset = [];
    this.focusName = "";

    this.openMap = function (ec, data, focusName) {
        try {
            this.focusName = focusName;
            this.countyName = data["IX_GRP_SELF_CARE_JUDET_SECTOR"] + "";
            this.resultset = getCities(this.countyName);
        } catch (ex) {
            log.error("CitiesList openMap method error: " + ex.message);
        }
    };

    this.close = function () { }

    this.getNextRow = function () {
        try {
            var row = this.resultset[this.index++].name;
        } catch (ex) {
            log.error("CitiesList getNextRow method error: " + ex.message);
        }

        return [row];
    };

    this.getHeader = function () {
        return ["Oras"];
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
        return "Oras";
    };
}