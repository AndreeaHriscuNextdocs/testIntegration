importPackage(Packages.de.elo.ix.client);
importPackage(Packages.de.elo.ix.jscript);
importPackage(Packages.de.elo.ix.scripting);
importPackage(java.io);
importPackage(java.net);
importPackage(Packages.de.elo.utils);
importPackage(java.nio.file);
importPackage(java.nio);
importPackage(Packages.org.apache.commons.codec);
importPackage(Packages.org.apache.commons.codec.binary);
importPackage(java.util.zip);
importPackage(java.util);


//@include lib_Class.js
//@include lib_sol.common.IxUtils.js

/**
 * Function that processes a JSON object with specific properties.
 * @param {string} args.cnp - A valid CNP
 * @returns {JSON object} - A message indicating the processing result.
 */


function RF_search_Self_Care(ec, args) {

    try {
        var initialObj = "";
        var response = { "status": "ok", "files": [], "error": "" };

        if (args[0] == "{") {
            initialObj = JSON.parse(args + "");
        } else {
            initialObj = JSON.parse(args[0].toString() + "");
        }

        if (initialObj.hasOwnProperty("CNP")) {

            if (initialObj.CNP !== "") {

                var cfg = getConfig();

                var sords = getSords(cfg.maskIdCi, { "SELF_CARE_CNP": initialObj.CNP, "SELF_CARE_STATUS_FLUX": "ACCEPTAT" });

                for (var i = 0; i < sords.length; i++) {
                    var sordId = sords[i].id; 0.
                    var fileObj = { "sordId": sordId + "", "filename": "" };

                    response.files.push(fileObj);
                }

                if (response.files.length == 0) {
                    response.status = "nok";
                    response.error = "No archived files for CNP " + initialObj.CNP;
                }

            } else {
                response.status = "nok"
                response.error = "Check HTTP body. CNP property is empty.";
            }

        } else {
            response.status = "nok"
            response.error = "Check HTTP body. One or more property names are wrong.";
        }


    } catch (error) {
        var err = "Self Care search ERROR: " + error
        log.info(err);
        response.status = "nok";
        response.error = err
    } finally {
        return JSON.stringify(response);
    }
}


function getSords(maskId, list) {

    try {
        var findInfo = new FindInfo();
        findInfo.findByIndex = new FindByIndex();
        findInfo.findByIndex.maskId = maskId;
        var keys = Object.keys(list);
        var objKeys = [];

        for (var i = 0; i < keys.length; i++) {
            var objKey = new ObjKey();
            objKey.name = keys[i];
            objKey.data = [list[keys[i]]];
            objKeys.push(objKey);
        }

        findInfo.findByIndex.objKeys = objKeys;
        var findResult = ixConnect.ix().findFirstSords(findInfo, 1000, SordC.mbAll);

        var returnVal = [];
        if (findResult.sords.length != 0) {
            returnVal = findResult.sords;
        }
        ixConnect.ix().findClose(findResult.searchId);
        return returnVal;
    }
    catch (err) {
        log.info("err cautaField= " + err);
        return [];
    }
}


function getConfig() {
    var cfgObj = sol.common.IxUtils.execute('RF_sol_common_service_GetConfigHierarchy', {
        compose: "/cec.selfCare/Configuration/selfCare.config",
        content: true,  //optional, if not set, or none `true` value, only GUIDs will be returned
        forceReload: true  // optional, if true, the cache will be refreshed
    });

    var params = {};

    params.maskIdCi = (cfgObj.customConfigs != null && cfgObj.customConfigs.length > 0 && cfgObj.customConfigs[0] && cfgObj.customConfigs[0].content.maskIdDocument) ? cfgObj.customConfigs[0].content.maskIdDocument : cfgObj.defaultConfig.content.maskIdDocument;
    //params.maskIdCi = (cfgObj.customConfigs != null && cfgObj.customConfigs.length > 0 && cfgObj.customConfigs[0] && cfgObj.customConfigs[0].content.maskIdDocument) ? cfgObj.customConfigs[0].content.maskIdDocument : cfgObj.defaultConfig.content.maskIdDocument;
    //params.folderIdBufferMb = (cfgObj.customConfigs != null && cfgObj.customConfigs.length > 0 && cfgObj.customConfigs[0] && cfgObj.customConfigs[0].content.folderIdBufferMb) ? cfgObj.customConfigs[0].content.folderIdBufferMb : cfgObj.defaultConfig.content.folderIdBufferMb;
    //params.folderIdBufferMb = (cfgObj.customConfigs != null && cfgObj.customConfigs.length > 0 && cfgObj.customConfigs[0] && cfgObj.customConfigs[0].content.folderIdBufferMb) ? cfgObj.customConfigs[0].content.folderIdBufferMb : cfgObj.defaultConfig.content.folderIdBufferMb;

    return params
};

