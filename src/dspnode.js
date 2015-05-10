
var util = require('./util');

var DSPNode = {};

var priv = {};

/**
 * {
 *   params: {
 *     freq: [
 *       {
 *         set: function (value),
 *         get: function ()
 *       }
 *     ],
 *     volume: [
 *       {
 *         set: function (value),
 *         get: function ()
 *       }
 *     ]
 *   },
 *
 *   envelopes: {
 *     start: [ function (), ...],
 *     stop: [ function (), ...],
 *     play: [ function (), ...]
 *   },
 *
 *   inputs: {
 *     fxinput: [
 *       {
 *         connect: function (sourceNode),
 *         get: function ()
 *       }
 *     ]
 *   },
 *
 *   outputs: {
 *     l: AudioNode,
 *     r: AudioNode
 *   }
 * }
 */
DSPNode.create = function () {
    var dn = {};
    dn.params = {};

    dn.envelopes = {};

    dn.inputs = {};

    dn.outputs = {};

    return dn;
};

DSPNode.addParam = function (node, name, paramObj) {
    if (node.params[name] === undefined) {
        node.params[name] = [];
    }
    node.params[name].push(paramObj);
};

DSPNode.addEnvelope = function (node, name, envelopeFunc) {
    if (node.envelopes[name] === undefined) {
        node.envelopes[name] = [];
    }
    node.envelopes[name].push(envelopeFunc);
};

DSPNode.addInput = function (node, name, inputObj) {
    if (node.inputs[name] === undefined) {
        node.inputs[name] = [];
    }
    node.inputs[name].push(inputObj);
};

DSPNode.addOutput = function (node, name, output) {
    node.outputs[name] = output;
};

/**
 * Merges parameters and inputs, but leaves outputs empty
 */
DSPNode.merge = function (nodes) {
    var dspnode = DSPNode.create();

    var mergeParams = function (paramName, paramObjs) {
        if (dspnode.params[paramName] === undefined) {
            dspnode.params[paramName] = [];
        }
        util.mapArray(paramObjs, function (f) {
            dspnode.params[paramName].push(f);
        });
    };

    var mergeInputs = function (inputName, inputObjs) {
        if (dspnode.inputs[inputName] === undefined) {
            dspnode.inputs[inputName] = [];
        }
        util.mapArray(inputObjs, function (i) {
            dspnode.inputs[inputName].push(i);
        });
    };

    var mergeEnvelopes = function (envelopeName, envelopeFunctions) {
        if (dspnode.envelopes[envelopeName] === undefined) {
            dspnode.envelopes[envelopeName] = [];
        }
        util.mapArray(envelopeFunctions, function (f) {
            dspnode.envelopes[envelopeName].push(f);
        });
    };

    util.mapArray(nodes, function (n) {
        util.mapObject(n.params, mergeParams);
        util.mapObject(n.inputs, mergeInputs);
        util.mapObject(n.envelopes, mergeEnvelopes);
    });

    return dspnode;
};

DSPNode.createSummer = function (setFunction) {
    var summer = {};

    summer.constant = 0;
    summer.values = {};

    summer.setTarget = function () {
        var value = util.foldObject(summer.values, summer.constant, function (c, n, v) {
            return c + v;
        });
        setFunction(value);
    };

    summer.incrConstant = function (constantValue) {
        summer.constant += constantValue;
    };

    summer.createSetNode = function (name) {
        if (summer.values[name] === undefined) {
            summer.values[name] = 0;
        }
        var setnode = {
            set: function (value) {
                summer.values[name] = value;
                summer.setTarget();
            }
        };
        return setnode;
    };

    return summer;
};

DSPNode.createParamNode = function () {
    var node = {
        value: 0
    };
    node.set = function (newValue, audioCtx) {
        node.value = newValue;
    };
    node.get = function (newValue, audioCtx) {
        return node.value;
    };
    return node;
};

module.exports = DSPNode;

