
var DspGraph = require('./dspGraph');
var util = require('./util');

var Synth = {};


Synth.create = function (audioCtx, dspAst, destination) {
    var destinationNode = destination || undefined;
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
        util.mapObject(synth.params[paramName], function (p) {
            p.set(value);
        });
    }
};

Synth.getParam = function (synth, paramName) {
    var i, output = [];
    if (synth.params[paramName] === undefined) {
        throw new Error('Synth does not have ' + paramName + ' parameter');
    } else {
        output = util.mapObject(synth.params[paramName], function (p) {
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

Synth.connectSynthToInput = function (synth, inputName, sourceSynth, sourceOutputName) {
    if (synth.inputs[inputName] === undefined) {
        throw new Error('Synth does not have ' + inputName + ' input');
    }
    var output = Synth.getOutput(sourceSynth, sourceOutputName);
    util.mapArray(synth.inputs[inputName], function (i) {
        i.connect(output);
    });
};

Synth.connectToInput = function (synth, inputName, sourceNode) {
    if (synth.inputs[inputName] === undefined) {
        throw new Error('Synth does not have ' + inputName + ' input');
    }
    util.mapArray(synth.inputs[inputName], function (i) {
        i.connect(sourceNode);
    });
};

Synth.getOutput = function (synth, outputName) {
    var output = null;
    if (synth.outputs[outputName] === undefined) {
        throw new Error('Synth does not have ' + outputName + ' input');
    } else {
        output = synth.outputs[outputName];
    }
    return output;
};


module.exports = Synth;

