
var util = {};

util.mergeNodeParams = function (paramNodes) {
    var output = {
        paramNames: [],
        params: {}
    };
    var node;
    var paramName;
    var n, p, pf;
    for (n = 0; n < paramNodes.length; n += 1) {
        node = paramNodes[n];
        for (p = 0; p < node.paramNames.length; p += 1) {
            paramName = node.params[p];
            if (output.params[paramName] === undefined) {
                output.params[paramName] = [];
                output.paramNames.push(paramName);
            }
            for (pf = 0; pf < node.params[paramName].length; pf += 1) {
                output.params[paramName].push(node.params[paramName][pf]);
            }
        }
    }
    return output;
};

module.exports = util;

