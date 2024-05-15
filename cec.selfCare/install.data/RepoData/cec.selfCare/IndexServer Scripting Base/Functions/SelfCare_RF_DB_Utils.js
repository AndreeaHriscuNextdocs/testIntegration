importPackage(Packages.de.elo.ix.jscript);
importPackage(Packages.de.elo.ix.client);
importPackage(Packages.java.io);
importPackage(Packages.java.text);
//@include lib_Class.js
//@include lib_sol.common.IxUtils.js

var SELF_CARE_config;

function getInfoFromConfig() {
    var cfgObj = sol.common.IxUtils.execute('RF_sol_common_service_GetConfigHierarchy', {
        compose: "/cec.selfCare/Configuration/selfCare.config",
        content: true,  //optional, if not set, or none `true` value, only GUIDs will be returned
        forceReload: true  // optional, if true, the cache will be refreshed
    });
    var currentConfig = cfgObj.defaultConfig.content;
    if (cfgObj.customConfigs[0] && cfgObj.customConfigs[0].content && cfgObj.customConfigs[0].content.length) {
        currentConfig = cfgObj.customConfigs[0].content;
    }

    SELF_CARE_config = currentConfig;
}

function transformArgsToJson(args) {
    var json = {};
    if (!args) return json;
    if (args[0] == "{") {
        json = JSON.parse(args + "");
    } else {
        json = JSON.parse(args[0].toString() + "");
    }
    return json;
}

function RF_getCountries(ec, args) {
    var result = {};
    try {
        getInfoFromConfig();
        var dbResourceName = SELF_CARE_config.DATA_BASE.name;

        var statement = "SELECT * FROM [CEC].[dbo].[Tari]";
        var database = new DBConnection(dbResourceName);
        var dbResult = database.query(statement);

        var countries = [];
        dbResult.forEach(row => {
            var country = {};
            country.id = row[0] + "";
            country.name = row[1] + "";
            country.phoneCode = row[2] + "";
            country.symbol = row[3] + "";

            countries.push(country);
        });

        result.data = countries;
        result.error = "";

        return JSON.stringify(result);
    } catch (ex) {
        log.error("SelfCare_RF_DB_Utils RF_getCountries method error: " + ex);
        result.error = ex.message;
        return JSON.stringify(result);
    }
}

function RF_getCountiesByCountryName(ec, args) {
    var result = {};
    try {
        getInfoFromConfig();
        var json = transformArgsToJson(args);

        var countryName = json.countryName || "Romania";
        log.info("RF_getCountiesByCountryName countryName = " + countryName);

        var dbResourceName = SELF_CARE_config.DATA_BASE.name;
        log.info("RF_getCountiesByCountryName dbResourceName = " + dbResourceName);

        var statement = "SELECT judet.id, judet.nume " +
            "FROM [CEC].[dbo].[Tari] tara, [CEC].[dbo].[Judete] judet " +
            "WHERE tara.nume = '{countryName}' " +
            "AND tara.id = judet.taraId";

        var database = new DBConnection(dbResourceName);
        var dbResult = database.query(statement.replace("{countryName}", countryName));

        var counties = [];
        dbResult.forEach(row => {
            var county = {};
            county.id = row[0] + "";
            county.name = row[1] + "";

            counties.push(county);
        });

        result.data = counties;
        result.error = "";

        return JSON.stringify(result);
    } catch (ex) {
        log.error("SelfCare_RF_DB_Utils RF_getCountiesByCountryName method error: " + ex);
        result.error = ex.message;
        return result;
    }
}

function RF_getCitiesByCountyName(ec, args) {
    var result = {};
    try {
        getInfoFromConfig();
        var json = transformArgsToJson(args);
        var countyName = json.countyName;

        var dbResourceName = SELF_CARE_config.DATA_BASE.name;

        var statement = "SELECT oras.id, oras.nume, oras.judetId " +
            "FROM  [CEC].[dbo].[Judete] judet,  [CEC].[dbo].[Orase] oras " +
            "WHERE judet.nume = '{countyName}' " +
            "AND judet.id = oras.judetId;"

        var database = new DBConnection(dbResourceName);
        var dbResult = database.query(statement.replace("{countyName}", countyName));

        var cities = [];
        dbResult.forEach(row => {
            var city = {};
            city.id = row[0] + "";
            city.name = row[1] + "";
            city.countyId = row[2] + "";

            cities.push(city);
        });

        result.data = cities;
        result.error = "";
        return JSON.stringify(result);
    } catch (ex) {
        log.error("SelfCare_RF_DB_Utils RF_getCitiesByCountyName method error: " + ex);
        result.error = ex.message;
        return JSON.stringify(result);
    }
}