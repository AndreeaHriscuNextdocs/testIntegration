importPackage(Packages.de.elo.ix.client);
importPackage(Packages.de.elo.ix.jscript);
importPackage(Packages.de.elo.ix.scripting);

//@include lib_Class.js
//@include lib_sol.common.IxUtils.js
//@include lib_sol.common.RepoUtils.js
//@include lib_sol.common.AclUtils.js
//@include lib_sord.js
//@include lib_user.js

var SELF_CARE_CONFIG = {};

function onExitNode(ci, userId, workflow, nodeId) {
    try {
        sordExt.setIxAndConst();

        SELF_CARE_CONFIG.MASK_ID = getObjectFromSelfCareConfig("MASK_ID");
        SELF_CARE_CONFIG.ELO_ARCHIVE = getObjectFromSelfCareConfig("ELO_ARCHIVE");

        var sordId = workflow.objId;

        var currentSord = ixConnect.ix().checkoutSord(sordId, SordC.mbAll, LockC.NO);

        var workflowStatus = sordExt.getValueFromObjKeys(currentSord, "SELF_CARE_STATUS_FLUX");

        if (nodeId == 12) {
            user.userId = userId;
            var currentUserName = user.getUserNameByUserId();
            archiveSordElo(currentSord, workflowStatus, currentUserName);
        }
    } catch (ex) {
        log.error("ix_SelfCare_ev_onExitNode_moveDocumentToEloArchive error: " + ex);
    }
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

function archiveSordElo(sord, workflowStatus, currentUserName) {
    var root = SELF_CARE_CONFIG.ELO_ARCHIVE.ROOT;
    log.info("ix_SelfCare_ev_onExitNode_moveDocumentToEloArchive root = " + root);

    var documentName = "Carte_identitate_{CNP}_MB_{DATA_INCARCARE_MB}";
    var folderPath = "{root}\\{lastNameInitial}\\{lastName}_{firstName}_{cnp}";

    var lastName = sordExt.getValueFromObjKeys(sord, "SELF_CARE_NUME_CLIENT") + "";
    var firstName = sordExt.getValueFromObjKeys(sord, "SELF_CARE_PRENUME_CLIENT") + "";
    var cnp = sordExt.getValueFromObjKeys(sord, "SELF_CARE_CNP") + "";
    var uploadMBDate = (sordExt.getValueFromObjKeys(sord, "SELF_CARE_DATA_INCARCARE_MB") + "").replace("000000", "");

    var mbDate = "{year}/{month}/{day}";
    mbDate = mbDate.replace("{year}", uploadMBDate.substr(0, 4));
    mbDate = mbDate.replace("{month}", uploadMBDate.substr(4, 2));
    mbDate = mbDate.replace("{day}", uploadMBDate.substr(6, 2));

    documentName = documentName.replace("{CNP}", cnp).replace("{DATA_INCARCARE_MB}", mbDate);

    folderPath = folderPath.replace("{root}", root).replace("{lastNameInitial}", lastName[0]).replace("{lastName}", lastName).replace("{firstName}", firstName).replace("{cnp}", cnp);
    var bgColor = "green";

    log.info("workflowStatus = " + workflowStatus);

    if (workflowStatus == "RESPINS") {
        folderPath += "\\CI nevalidate";
        bgColor = "red";
    } else {
        folderPath += "\\CI validate"
    }


    log.info("ix_SelfCare_ev_onExitNode_moveDocumentToEloArchive folderPath = " + folderPath);
    var newParentId = sordExt.createFoldersArborescenceByPath(folderPath);
    log.info("ix_SelfCare_ev_onExitNode_moveDocumentToEloArchive newParentId = " + newParentId);
    sord.name = documentName;
    ixConnect.ix().checkinSord(sord, SordC.mbAll, LockC.NO);

    var sords = sol.common.RepoUtils.findChildren(newParentId, {
        includeFolders: false,
        includeDocuments: true,
    });

    sords.forEach(sord => {
        sol.common.AclUtils.addRights(
            sord.id,
            [currentUserName],
            {
                r: true,
                w: true,
                d: false,
                e: true,
                l: false,
                p: false
            },
            { asAdmin: true }
        );

        sol.common.IxUtils.execute("RF_sol_function_ChangeColor", {
            objId: sord.id,
            color: "System color"
        });

        sol.common.AclUtils.removeRights(
            sord.id,
            [],
            {
                r: false,
                w: true,
                d: true,
                e: true,
                l: true,
                p: true
            },
            { asAdmin: true }
        );
    });

    ixConnect.ix().copySord(newParentId, sord.id, null, CopySordC.MOVE);

    sol.common.IxUtils.execute("RF_sol_function_ChangeColor", {
        objId: sord.id,
        color: bgColor,
    });

    sol.common.AclUtils.removeRights(
        sord.id,
        [],
        {
            r: false,
            w: true,
            d: true,
            e: true,
            l: true,
            p: true
        },
        { asAdmin: true }
    );
}