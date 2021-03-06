"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusFields = exports.DlpStatus = void 0;
// TYPES
var DlpStatus;
(function (DlpStatus) {
    DlpStatus["UNSCANNED"] = "UNSCANNED";
    DlpStatus["NO_ISSUES"] = "NO_ISSUES";
    DlpStatus["ISSUES_FOUND"] = "ISSUES_FOUND";
    DlpStatus["OVERRIDE"] = "OVERRIDE";
})(DlpStatus = exports.DlpStatus || (exports.DlpStatus = {}));
var StatusFields;
(function (StatusFields) {
    StatusFields["Title"] = "titleStatus";
    StatusFields["Details"] = "detailsStatus";
    StatusFields["AcceptanceCriteria"] = "acceptanceCriteriaStatus";
    StatusFields["ReproductionSteps"] = "reproductionStepsStatus";
    StatusFields["Description"] = "descriptionStatus";
    StatusFields["SystemInfo"] = "systemInfoStatus";
    StatusFields["Analysis"] = "analysisStatus";
})(StatusFields = exports.StatusFields || (exports.StatusFields = {}));
