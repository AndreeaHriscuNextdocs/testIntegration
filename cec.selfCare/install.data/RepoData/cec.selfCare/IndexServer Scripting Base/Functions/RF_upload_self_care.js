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
importPackage(java.lang);

//@include lib_Class.js
//@include lib_sol.common.IxUtils.js

/**Call Body properties
 * Function that processes ID upload based on the provided JSON data.
 * @param {Object} args - JSON object containing credit information.
 * @property {string} args.SELF_CARE_CORELATION_ID - The correlation ID associated with the user.
 * @property {string} args.SELF_CARE_NUME_CLIENT - The last name of the client.
 * @property {string} args.SELF_CARE_PRENUME_CLIENT - The first name of the client.
 * @property {string} args.SELF_CARE_CNP - The client's personal identification number. Must be a valid one.
 * @property {string} args.SELF_CARE_DATA_NASTERII - The client's date of birth (format: "yyyyMMdd").
 * @property {string} args.SELF_CARE_CETATENIE - The citizenship of the client.
 * @property {string} args.SELF_CARE_FEL_ID - The ID type.
 * @property {string} args.SELF_CARE_JUDET_SECTOR - The county or sector.
 * @property {string} args.SELF_CARE_ORAS - The city.
 * @property {string} args.SELF_CARE_STRADA - The street name.
 * @property {string} args.SELF_CARE_NUMAR - The street number.
 * @property {string} args.SELF_CARE_BLOC - The block number.
 * @property {string} args.SELF_CARE_SCARA - The staircase number.
 * @property {string} args.SELF_CARE_ETAJ - The floor number.
 * @property {string} args.SELF_CARE_APARTAMENT - The apartment number.
 * @property {string} args.SELF_CARE_EMITENT - The issuer of the document.
 * @property {string} args.SELF_CARE_DATA_EMITERII_CI - The issue date of the document (format: "yyyyMMdd").
 * @property {string} args.SELF_CARE_DATA_EXPIRARE_CI - The expiration date of the document (format: "yyyyMMdd").
 * @property {string} args.SELF_CARE_SERIE_CI - The series of the document.
 * @property {string} args.SELF_CARE_NUMAR_DOCUMENT_CI - The document number.
 * @property {string} args.SELF_CARE_ID_CLIENT - The client ID.
 * @property {string} args.filename - The name of the file.
 * @property {string} args.contentType - The content type of the file.
 * @property {string} args.format - The format of the file.
 * @property {string} args.fileContent - The content of the file encoded in Base64.
 * @returns {JSON Object} - A message indicating the processing result.
 */


function RF_upload_Self_Care(ec, args) {

    var response = { "objId": "", "status": "nok", "error": ""};
    var propertiesNotToValidate = ["SELF_CARE_DATA_NASTERII", "SELF_CARE_BLOC", "SELF_CARE_SCARA", "SELF_CARE_ETAJ", "SELF_CARE_APARTAMENT"];
    var metadataValid = false;

    try {
        var initialObj = "";

        if (args[0] == "{") {
            initialObj = JSON.parse(args + "");
        } else {
            initialObj = JSON.parse(args[0].toString() + "");
        }

        var metadata = initialObj;
        metadataValid = validateMetadata(metadata, response, propertiesNotToValidate)

        if (metadataValid) {

            var cfg = getConfig();

            //CALL IX PLUGIN - CHECK CI
            var email = "test_dev@nextdocs.ro";
            var agentie = "Drumul Taberei";

            metadata.SELF_CARE_STATUS_FLUX = "NEPRELUAT";
            metadata.SELF_CARE_SUCURSALA_AGENTIE = agentie;
            metadata.SELF_CARE_ADRESA_EMAIL = email;
            metadata.SELF_CARE_DATA_INCARCARE_MB = getCurrentDateInfo().toIsoDate;

            var file = createTempFile(metadata.fileContent, metadata.filename);

            if (metadata.CI_EXISTENT_FLAG == "NU") {
                //Implementare CI NOU

                var sordName = "Carte_identitate_" + metadata.SELF_CARE_CNP + "_MB_" + getCurrentDateInfo().toIsoDateWithSlash;
                var maskMetadata = prepareObjectToApplyToMaskMetadata(metadata)
                
                var sordId = uploadDocument(file, cfg.maskIdDocument, maskMetadata, cfg.folderIdBufferMb, sordName, response);
                if (sordId == "-1") {
                    response.error = "Document upload failed";
                }
                response.objId = sordId + "";
            } else {
                //Implementare CI existent
                var sords = getSords(cfg.maskIdDocument, { "SELF_CARE_CNP": initialObj.SELF_CARE_CNP, "SELF_CARE_STATUS_FLUX": "ACCEPTAT" });

                if (sords.length > 0) {
                    var sord = getSordWithMostRecentDate(sords);

                    var sordName = updateMetadata(sord, response, metadata)
                    var sordId = updateDocumentVersion(sord, file, response);
                    if (sordId == "-1") {
                        response.error = "Document update failed";
                    }
                    response.objId = sordId + "";
                } else {
                    response.error = "No existing sords found for CNP: " + initialObj.SELF_CARE_CNP;
                }
            }
            deleteFileIfExists(file);

            if (response.error == "") {
                var newWorkflowId = ixConnect.ix().startWorkFlow(cfg.workflowValidareCi, cfg.workflowValidareCi, sordId);
                response.status = "ok";
            }
        }
    } catch (e) {
        var err = "Self Care upload ERROR: " + e.message
        response.status = "nok";
        response.error = err
        log.info(err);
    } finally {
        return JSON.stringify(response);
    }
}

function createTempFile(fileContentBase64, filename) {
    var decodedBytes = Base64.decodeBase64(fileContentBase64);
    var tempFile = new java.io.File.createTempFile(filename, ".png");
    var fileOutputStream = new java.io.FileOutputStream(tempFile);
    try {
        fileOutputStream.write(decodedBytes);
    } catch(e) {
        response.error = "Error on creating temp file: " + e;
    } finally {
        fileOutputStream.close();
    }

    return tempFile
}


function updateDocumentVersion(sord, file, response) {
    try {
        var ed = ixConnect.ix().checkoutDoc(sord.id+"", null, EditInfoC.mbSordDoc, LockC.NO);
        ed.sord.name = sord.name;
        
        var numarVersiuneNoua = ed.document.docs.length + 1;
        var docVersions = Array(numarVersiuneNoua);
        
        // Copy existing docVersions
        for (var i = 0; i < ed.document.docs.length; i++) {
            docVersions[i] = ed.document.docs[i];
        }
        
        // Create new DocVersion for the new version
        var newDocVersion = new DocVersion();
        newDocVersion.version = numarVersiuneNoua; // Set the version number
        docVersions[numarVersiuneNoua - 1] = newDocVersion; // Adjusted index
        
        // Update other properties of the new DocVersion as needed
        newDocVersion.ext = ixConnect.getFileExt(file);
        newDocVersion.pathId = ed.sord.path;
        newDocVersion.encryptionSet = ed.sord.details.encryptionSet;
        
        ed.document.docs = docVersions;
        ed.document = ixConnect.ix().checkinDocBegin(ed.document);
        
        var uploadResult = ixConnect.upload(ed.document.docs[numarVersiuneNoua - 1].url, file);
        ed.document.docs[numarVersiuneNoua - 1].uploadResult = uploadResult;
        
        ed.document = ixConnect.ix().checkinDocEnd(ed.sord, SordC.mbAll, ed.document, LockC.NO);
        var idRepoForThisFile = ed.document.objId;
    } catch(err) {
        response.error = "Error update doc version: " + err;
    }

    return idRepoForThisFile;
}



function updateMetadata(sord, response, metadata) {
    try {
        var sordx = ixConnect.ix().checkoutSord(sord.id + "", SordC.mbAll, LockC.NO);
        var regex = /_\d{8}$/; // Matches underscore followed by 8 digits at the end of the string
        // Replace the matched date part with the new date
        var sordName = sord.name + "";
        sordx.name = sordName.replace(regex, "_" + getCurrentDateInfo().toIsoDateWithSlash);

        setObjKey(sordx, "SELF_CARE_CI_NOU", "NU");
        //setObjKey(sordx, "SELF_CARE_STATUS_FLUX",  metadata.SELF_CARE_STATUS_FLUX);
        setObjKey(sordx, "SELF_CARE_SUCURSALA_AGENTIE", "Bucurestii Noi");
        setObjKey(sordx, "SELF_CARE_ADRESA_EMAIL", "catalin.lacatus@virtualhub.ro");
        setObjKey(sordx, "SELF_CARE_DATA_INCARCARE_MB", metadata.SELF_CARE_DATA_INCARCARE_MB);
        setObjKey(sordx, "SELF_CARE_CORELATION_ID", metadata.SELF_CARE_CORELATION_ID);

        ixConnect.ix().checkinSord(sordx, SordC.mbAll, LockC.NO);
        return sordx.name;
    } catch(err) {
        response.error = "Error update sord metadata: " + err;
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
        response.error = "err get sord= " + err;
        log.info("err get sord= " + err);
        return [];
    }
}


function getSordWithMostRecentDate(sords) {
    if (sords.length === 0) {
        return null; // Return null if the list is empty
    }

    var mostRecentSord = sords[0]; // Initialize with the first sord
    var mostRecentDate = getObjKey(mostRecentSord, "SELF_CARE_DATA_INCARCARE_MB");

    // Iterate through the remaining sords
    for (var i = 1; i < sords.length; i++) {
        var currentDate = getObjKey(sords[i], "SELF_CARE_DATA_INCARCARE_MB");

        // Compare the current date with the most recent date
        if (currentDate > mostRecentDate) {
            mostRecentSord = sords[i];
            mostRecentDate = currentDate;
        }
    }

    return mostRecentSord;
}


function setObjKey(sord, keyName, keyValue) {
    for (var i = 0; i < sord.objKeys.length; i++) {
        if (sord.objKeys[i].name.equals(keyName)) {
            sord.objKeys[i].setData([keyValue]);
            break;
        }
    }
}


function getObjKey(sord, keyName) {
    for (var i = 0; i < sord.objKeys.length; i++) {
        if (sord.objKeys[i].name.equals(keyName)) {
            return sord.objKeys[i].getData();
        }
    }
}


function uploadDocument(file, mask, keys, parentFolderId, name, response) {
    log.info("FUNCTION UPLOAD DOCUMENT");

    var returnID = "-1";
    try {
        var ed = ixConnect.ix().createDoc(parentFolderId, mask, null, EditInfoC.mbSordDocAtt);
        ed.sord.name = name;

        var keyList = Object.keys(keys);
        for (var i = 0; i < keyList.length; i++) {
            var key1 = keyList[i];
            var value = keys[key1];
            for (var q = 0; q < ed.sord.objKeys.length; q++) {
                if (ed.sord.objKeys[q].name == key1) {
                    ed.sord.objKeys[q].data = [value];
                    break;
                }
            }
        }
        var docVersions = new Array(1);
        docVersions[0] = new DocVersion();
        ed.document.docs = docVersions;
        ed.document.docs[0] = new DocVersion();
        ed.document.docs[0].ext = ixConnect.getFileExt(file);
        ed.document.docs[0].pathId = ed.sord.path;
        ed.document.docs[0].encryptionSet = ed.sord.details.encryptionSet;
        ed.document.docs[0].version = 1;
        ed.document.docs[0].workVersion = true;
        ed.document = ixConnect.ix().checkinDocBegin(ed.document);
        var uploadResult = ixConnect.upload(ed.document.docs[0].url, file);
        ed.document.docs[0].uploadResult = uploadResult;
        ed.document = ixConnect.ix().checkinDocEnd(ed.sord, SordC.mbAll, ed.document, LockC.NO);
        var idRepoForThisFile = ed.document.objId;
        returnID = idRepoForThisFile;

        //var idRepoForThisFile = ArchiveHelper.insertIntoArchive(ixConnect, file, sord2.id, masca, "1", "1", false);
        log.info("Documentul cu id-ul " + idRepoForThisFile + " a fost incarcat cu succes in repository");
    } catch (e) {
        response.error = e;
        log.info("Eroare: " + e);
    }
    return returnID;
}


function prepareObjectToApplyToMaskMetadata(obj) {
    var newObj = {}; // Create an empty object
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            newObj[prop] = obj[prop]; // Copy each property to the new object
        }
    }

    delete newObj.filename
    delete newObj.contentType
    delete newObj.format
    delete newObj.fileContent
    delete newObj.CI_EXISTENT_FLAG

    return newObj;
}


function validateMetadata(metadata, response, propertiesNotToValidate) {
    for (var property in metadata) {
        if (metadata.hasOwnProperty(property)) {
            switch (property) {
                case "SELF_CARE_DATA_NASTERII":
                case "SELF_CARE_DATA_EMITERII_CI":
                case "SELF_CARE_DATA_EXPIRARE_CI":
                case "SELF_CARE_DATA_INCARCARE_MB":
                    if (!isValidDate(metadata[property])) {
                        response.error = "Invalid date for property '" + property + "'.";
                        return false;
                    }
                    break;
                default:
                    if (!propertiesNotToValidate.includes(metadata[property])) {
                        if (!isNotEmpty(metadata[property])) {
                            response.error = "Property '" + property + "' is empty.";
                            return false;
                        }
                    }
            }
        }
    }
    return true;
}


function isValidDate(dateString) {
    const regex = /^\d{8}$/;
    if (!regex.test(dateString)) {
        return false;
    }

    const year = parseInt(dateString.substring(0, 4), 10);
    const month = parseInt(dateString.substring(4, 6), 10) - 1; // Months are 0-indexed
    const day = parseInt(dateString.substring(6, 8), 10);

    const date = new Date(year, month, day);
    return (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
    );
}


function isNotEmpty(value) {
    return typeof value === 'string' && value.trim() !== '';
}


function isValidNumber(value) {
    return typeof value === 'number' && value !== 0;
}


function deleteFileIfExists(file) {
    var filePath = Paths.get(file);
    var threadTimeout = 1000;

    while (true) {
        try {
            var deleteResult = Files.deleteIfExists(filePath);

            if (deleteResult) {
                while (File.exists(filePath)) {
                    Thread.sleep(threadTimeout);
                }
            }

            break;
        } catch (e) {
            var x = e;

            log.info("RF_upload_self_care - exceptie FilesDeleteIfExists " + x);
            log.info("RF_upload_self_care - path FilesDeleteIfExists " + filePath);
            log.info("RF_upload_self_care - apeleaza garbage collector");

            System.gc();
        }

        // add delay if needed
        Thread.sleep(threadTimeout);
    }
}


function getConfig() {
    var cfgObj = sol.common.IxUtils.execute('RF_sol_common_service_GetConfigHierarchy', {
        compose: "/cec.selfCare/Configuration/selfCare.config",
        content: true,  //optional, if not set, or none `true` value, only GUIDs will be returned
        forceReload: true  // optional, if true, the cache will be refreshed
    });

    var params = {};

    params.rootUploadDocument = (cfgObj.customConfigs != null && cfgObj.customConfigs.length > 0 && cfgObj.customConfigs[0] && cfgObj.customConfigs[0].content.rootUploadDocument) ? cfgObj.customConfigs[0].content.rootUploadDocument : cfgObj.defaultConfig.content.rootUploadDocument;
    params.maskIdDocument = (cfgObj.customConfigs != null && cfgObj.customConfigs.length > 0 && cfgObj.customConfigs[0] && cfgObj.customConfigs[0].content.maskIdDocument) ? cfgObj.customConfigs[0].content.maskIdDocument : cfgObj.defaultConfig.content.maskIdDocument;
    params.folderIdBufferMb = (cfgObj.customConfigs != null && cfgObj.customConfigs.length > 0 && cfgObj.customConfigs[0] && cfgObj.customConfigs[0].content.folderIdBufferMb) ? cfgObj.customConfigs[0].content.folderIdBufferMb : cfgObj.defaultConfig.content.folderIdBufferMb;
    params.workflowValidareCi = (cfgObj.customConfigs != null && cfgObj.customConfigs.length > 0 && cfgObj.customConfigs[0] && cfgObj.customConfigs[0].content.workflowValidareCi) ? cfgObj.customConfigs[0].content.workflowValidareCi : cfgObj.defaultConfig.content.workflowValidareCi;
    params.CI_EXISTENT_FLAG = (cfgObj.customConfigs != null && cfgObj.customConfigs.length > 0 && cfgObj.customConfigs[0] && cfgObj.customConfigs[0].content.CI_EXISTENT_FLAG) ? cfgObj.customConfigs[0].content.CI_EXISTENT_FLAG : cfgObj.defaultConfig.content.CI_EXISTENT_FLAG;

    return params
};


function getCurrentDateInfo() {
    var now = new Date();
    var newDate = {};
    var month = now.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }
    newDate.month = month;
    var day = now.getDate();
    if (day < 10) {
        day = "0" + day;
    }
    newDate.day = day;
    var year = now.getFullYear();
    newDate.year = year;
    var hours = now.getHours();
    newDate.hours = hours;
    var minutes = now.getMinutes();
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    newDate.minutes = minutes;
    var seconds = now.getSeconds();
    if (seconds < 0) {
        seconds = "0" + seconds;
    }
    newDate.seconds = seconds;
    var miliseconds = now.getMilliseconds();
    newDate.miliseconds = miliseconds;

    newDate.timestamp = year + "" + month + "" + day + "" + hours + "" + minutes + "" + seconds;
    newDate.toIsoDate = year + "" + month + "" + day;
    newDate.roDate = day + "." + month + "." + year;
    newDate.roDateLong = day + "." + month + "." + year + " " + hours + ":" + minutes + ":" + seconds;
    newDate.roTime = hours + ":" + minutes + ":" + seconds;
    newDate.timeMartor = year + "." + month + "." + day + " " + hours + ":" + minutes + ":" + seconds + ":" + miliseconds;
    newDate.btDate = day + "/" + month + "/" + year + " " + hours + ":" + minutes;
    newDate.toIsoDateWithSlash = year + "/" + month + "/" + day;
    return newDate;
}
