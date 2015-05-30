
var DspGraph = require('./dspGraph');
var util = require('./util');

var Synth = {};


Synth.create = function (audioCtx, dspAst) {
    var destinationNode = null;
    return DspGraph.evaluate(
        audioCtx,
        destinationNode,
        dspAst
    );
};

Synth.setParam = function (synth, paramName, value) {
    var i;
    if (synth.params[paramName] === undefined) {
        throw new Error('Synth does not have ' + paramName + ' parameter');
    } else {
        util.mapArray(synth.params[paramName], function (p) {
            p.set(value);
        });
    }
};

Synth.getParam = function (synth, paramName) {
    var i, output = [];
    if (synth.params[paramName] === undefined) {
        throw new Error('Synth does not have ' + paramName + ' parameter');
    } else {
        output = util.mapArray(synth.params[paramName], function (p) {
            return p.get();
        });
    }
    return output;
};

Synth.start = function (synth, parameterList) {
    var plist = parameterList || [];
    var i, e;
    var paramName, paramValue;
    if (synth.envelopes.start === undefined) {
        throw new Error('Synth does not have start parameter');
    } else {
        for (i = 0; i < plist.length; i += 2) {
            paramName  = plist[i];
            paramValue = plist[i+1];
            Synth.setParam(synth, paramName, paramValue);
        }
        util.mapArray(synth.envelopes.start, function (e) {
            e();
        });
    }
};

Synth.stop = function (synth) {
    var i, t;
    var paramName, paramValue;
    if (synth.envelopes.stop === undefined) {
        throw new Error('Synth does not have stop parameter');
    } else {
        util.mapArray(synth.envelopes.stop, function (e) {
            e();
        });
    }
};

Synth.play = function (synth, length, parameterList) {
    var plist = parameterList || [];
    var i, t;
    var paramName, paramValue;
    if (synth.envelopes.play === undefined) {
        throw new Error('Synth does not have play parameter');
    } else {
        for (i = 0; i < plist.length; i += 2) {
            paramName  = plist[i];
            paramValue = plist[i+1];
            Synth.setParam(synth, paramName, paramValue);
        }
        util.mapArray(synth.envelopes.play, function (e) {
            e(length);
        });
    }
};

Synth.getInputs = function (synth, inputName) {
    var inputs = [];
    if (synth.inputs[inputName] === undefined) {
        throw new Error('Synth does not have ' + inputName + ' input');
    } else {
        inputs = util.mapArray(synth.inputs[inputName], function (i) {
            return i.get();
        });
    }
    return inputs;
};

Synth.connectSynthToInputs = function (synth, inputName, sourceSynth, sourceOutputsName) {
    if (synth.inputs[inputName] === undefined) {
        throw new Error('Synth does not have ' + inputName + ' input');
    }
    var outputs = Synth.getOutputs(sourceSynth, sourceOutputsName);
    util.mapArray(synth.inputs[inputName], function (i) {
        util.mapArray(outputs, function (o) {
            i.connect(o);
        });
    });
};

Synth.connectToInputs = function (synth, inputName, sourceNodes) {
    if (synth.inputs[inputName] === undefined) {
        throw new Error('Synth does not have ' + inputName + ' input');
    }
    util.mapArray(synth.inputs[inputName], function (i) {
        util.mapArray(sourceNodes, function (o) {
            i.connect(o);
        });
    });
};

Synth.getOutputs = function (synth, outputsName) {
    var outputs = [];
    if (synth.outputs[outputsName] === undefined) {
        throw new Error('Synth does not have ' + outputsName + ' input');
    } else {
        outputs = synth.outputs[outputsName];
    }
    return outputs;
};


module.exports = Synth;

