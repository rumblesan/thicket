
var DspGraph = require('./dspGraph');

var Synth = {};


/**
 * returns
 *     Synth: {
 *       paramNames: [paramNames, ...],
 *       params: {
 *           paramName1: [setFunctions, ...],
 *       }
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
    if (synth.params[paramName] === undefined) {
        throw new Error('Synth does not have ' + paramName + ' parameter');
    } else {
        for (i = 0; i < synth.params[paramName].length; i += 1) {
            synth.params[paramName][i](value);
        }
    }
};

Synth.start = function (synth, parameterList) {
    var i, t;
    var paramName, paramValue;
    if (synth.params.trigger === undefined) {
        throw new Error('Synth does not have trigger parameter');
    } else {
        for (i = 0; i < parameterList.length; i += 2) {
            paramName  = parameterList[i];
            paramValue = parameterList[i+1];
            Synth.setParam(synth, paramName, paramValue);
        }
        for (t = 0; t < synth.params.trigger.length; t += 1) {
            synth.params.trigger[t]();
        }
    }
};

Synth.stop = function (synth) {
    var i, t;
    var paramName, paramValue;
    if (synth.params.stop === undefined) {
        throw new Error('Synth does not have stop parameter');
    } else {
        for (t = 0; t < synth.params.stop.length; t += 1) {
            synth.params.stop[t]();
        }
    }
};

Synth.play = function (synth, length, parameterList) {
    var i, t;
    var paramName, paramValue;
    if (synth.params.trigger === undefined) {
        throw new Error('Synth does not have trigger parameter');
    } else {
        for (i = 0; i < parameterList.length; i += 2) {
            paramName  = parameterList[i];
            paramValue = parameterList[i+1];
            Synth.setParam(synth, paramName, paramValue);
        }
        for (t = 0; t < synth.params.trigger.length; t += 1) {
            synth.params.trigger[t]();
        }
        setTimeout(function () {
            Synth.stop(synth);
        }, length * 1000);
    }
};

module.exports = Synth;

