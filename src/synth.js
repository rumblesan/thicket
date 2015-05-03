
var DspGraph = require('./dspGraph');

var Synth = {};


/**
 * returns
 *     Synth: {
 *       params: [paramNames, ...],
 *       paramName1: [setFunctions, ...]
 *     }
 **/
Synth.create = function (audioCtx, dspAst, destination) {
    var destinationNode = destination || audioCtx.destination;
    return DspGraph.evaluate(
        audioCtx,
        destinationNode,
        dspAst
    );
};

Synth.setParam = function (synth, paramName, value) {
    var i;
    if (synth[paramName] === undefined) {
        throw new Error('Synth does not have ' + paramName + ' parameter');
    } else {
        for (i = 0; i < synth[paramName].length; i += 1) {
            synth[paramName][i](value);
        }
    }
};

Synth.start = function (synth, parameterList) {
    var i, t;
    var paramName, paramValue;
    if (synth.trigger === undefined) {
        throw new Error('Synth does not have trigger parameter');
    } else {
        for (i = 0; i < parameterList.length; i += 2) {
            paramName  = parameterList[i];
            paramValue = parameterList[i+1];
            Synth.setParam(synth, paramName, paramValue);
        }
        for (t = 0; t < synth.trigger.length; t += 1) {
            synth.trigger[t]();
        }
    }
};

Synth.stop = function (synth) {
    var i, t;
    var paramName, paramValue;
    if (synth.stop === undefined) {
        throw new Error('Synth does not have stop parameter');
    } else {
        for (t = 0; t < synth.stop.length; t += 1) {
            synth.stop[t]();
        }
    }
};

Synth.play = function (synth, length, parameterList) {
    var i, t;
    var paramName, paramValue;
    if (synth.trigger === undefined) {
        throw new Error('Synth does not have trigger parameter');
    } else {
        for (i = 0; i < parameterList.length; i += 2) {
            paramName  = parameterList[i];
            paramValue = parameterList[i+1];
            Synth.setParam(synth, paramName, paramValue);
        }
        for (t = 0; t < synth.trigger.length; t += 1) {
            synth.trigger[t]();
        }
        setTimeout(function () {
            Synth.stop(synth);
        }, length * 1000);
    }
};

module.exports = Synth;

