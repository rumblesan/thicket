
var Helpers = {};

Helpers.dbToNum = function (dbValue) {
    return Math.pow(10, (dbValue/10));
};

module.exports = Helpers;

