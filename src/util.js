
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
            paramName = node.paramNames[p];
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

util.createParamNodeSummer = function (audioTargetNode) {
    var paramSummer = {};

    paramSummer.constant = 0;
    paramSummer.names = [];
    paramSummer.values = {};

    paramSummer.setTarget = function () {
        var name, i, v, total = paramSummer.constant;
        for (i = 0; i < paramSummer.names.length; i += 1) {
            name = paramSummer.names[i];
            v = paramSummer.values[name];
            total += v;
        }
        audioTargetNode.set(total);
    };

    paramSummer.createSetNode = function (name) {
        paramSummer.names.push(name);
        paramSummer.values[name] = 0;
        var setNode = {
            set: function (value) {
                paramSummer.values[name] = value;
                paramSummer.setTarget();
            }
        };
        return setNode;
    };

    return paramSummer;
};


module.exports = util;

